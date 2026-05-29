import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadToImgbb } from "@/lib/imgur";
import { submissionSchema } from "@/lib/validations";
import { calculateLevel } from "@/lib/utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { questId, photo, caption } = parsed.data;

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.status !== "ACTIVE") {
    return NextResponse.json({ error: "Quest not available" }, { status: 404 });
  }

  const existing = await prisma.questSubmission.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  // Upload to imgbb
  const { url } = await uploadToImgbb(photo);

  const isLobbyQuest = !!quest.lobbyId;

  if (isLobbyQuest) {
    // Lobby quest: PENDING — lobby members vote, 50%+ approve = XP
    const vetoDeadline = new Date(Date.now() + 60 * 60 * 1000); // 1 hour to vote
    const submission = await prisma.questSubmission.create({
      data: {
        photoUrl: url,
        caption,
        vetoStatus: "PENDING",
        vetoDeadline,
        userId: user.id,
        questId,
      },
    });
    return NextResponse.json({ submission, pending: true }, { status: 201 });
  }

  // Global quest: auto-approve with XP
  let multiplier = 1.0;

  const effects = await prisma.activeEffect.findMany({
    where: { targetId: user.id, consumed: false, expiresAt: { gt: new Date() } },
  });
  for (const effect of effects) {
    multiplier *= effect.multiplier;
    await prisma.activeEffect.update({ where: { id: effect.id }, data: { consumed: true } });
  }

  const xpAwarded = Math.round(quest.xpReward * multiplier);
  const newXp = user.xp + xpAwarded;

  const [submission] = await prisma.$transaction([
    prisma.questSubmission.create({
      data: {
        photoUrl: url,
        caption,
        vetoStatus: "APPROVED",
        xpAwarded,
        userId: user.id,
        questId,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXp,
        level: calculateLevel(newXp),
        streak: { increment: 1 },
      },
    }),
    prisma.userLocation.upsert({
      where: { userId: user.id },
      update: { visibleUntil: new Date(Date.now() + 60 * 60 * 1000) },
      create: {
        userId: user.id,
        latitude: 0,
        longitude: 0,
        visibleUntil: new Date(Date.now() + 60 * 60 * 1000),
      },
    }),
  ]);

  return NextResponse.json({ submission: { ...submission, xpAwarded } }, { status: 201 });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const questId = searchParams.get("questId");

  // Auto-approve expired PENDING submissions (deadline passed, nobody voted enough)
  const expiredPending = await prisma.questSubmission.findMany({
    where: {
      vetoStatus: "PENDING",
      vetoDeadline: { lt: new Date() },
      ...(questId ? { questId } : {}),
    },
    include: { quest: true },
  });

  for (const sub of expiredPending) {
    let multiplier = 1.0;
    const effects = await prisma.activeEffect.findMany({
      where: { targetId: sub.userId, consumed: false, expiresAt: { gt: new Date() } },
    });
    for (const effect of effects) {
      multiplier *= effect.multiplier;
      await prisma.activeEffect.update({ where: { id: effect.id }, data: { consumed: true } });
    }
    const xp = Math.round(sub.quest.xpReward * multiplier);
    const submitter = await prisma.user.findUnique({ where: { id: sub.userId } });
    if (submitter) {
      const newXp = submitter.xp + xp;
      await prisma.$transaction([
        prisma.questSubmission.update({
          where: { id: sub.id },
          data: { vetoStatus: "APPROVED", xpAwarded: xp },
        }),
        prisma.user.update({
          where: { id: sub.userId },
          data: { xp: newXp, level: calculateLevel(newXp), streak: { increment: 1 } },
        }),
      ]);
    }
  }

  const submissions = await prisma.questSubmission.findMany({
    where: questId ? { questId } : { userId: user.id },
    include: {
      quest: true,
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      votes: {
        select: { verdict: true, voterId: true },
      },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ submissions });
}
