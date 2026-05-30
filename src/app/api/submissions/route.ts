import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadToImgbb } from "@/lib/imgur";
import { submissionSchema } from "@/lib/validations";
import { awardQuestXP } from "@/lib/economy";
import { notifyLobbyMembers } from "@/lib/notifications";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { questId, photo, caption } = parsed.data;

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.status !== "ACTIVE") {
    return NextResponse.json({ error: "Quest олдсонгүй" }, { status: 404 });
  }

  const existing = await prisma.questSubmission.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Аль хэдийн илгээсэн байна" }, { status: 409 });
  }

  // Upload to imgbb
  const { url } = await uploadToImgbb(photo);

  const isLobbyQuest = !!quest.lobbyId;

  if (isLobbyQuest) {
    // Lobby quest: PENDING — lobby members vote, 50%+ approve = XP
    const vetoDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours to vote
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
    // Notify lobby members to vote
    if (quest.lobbyId) {
      notifyLobbyMembers({
        lobbyId: quest.lobbyId,
        excludeUserId: user.id,
        type: "vote_needed",
        title: "Vote хэрэгтэй!",
        body: `${user.displayName} "${quest.title}" quest-д submission илгээлээ`,
        metadata: { questId, submissionId: submission.id },
      }).catch(() => {});
    }

    return NextResponse.json({ submission, pending: true }, { status: 201 });
  }

  // Global quest: auto-approve with XP
  const { xpAwarded, coinsAwarded } = await awardQuestXP({
    userId: user.id,
    questId,
    questXpReward: quest.xpReward,
    questDifficulty: quest.difficulty,
    lobbyId: quest.lobbyId,
  });

  const submission = await prisma.questSubmission.create({
    data: {
      photoUrl: url,
      caption,
      vetoStatus: "APPROVED",
      xpAwarded,
      coinsAwarded,
      userId: user.id,
      questId,
    },
  });

  return NextResponse.json({ submission: { ...submission, xpAwarded, coinsAwarded } }, { status: 201 });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const questId = searchParams.get("questId");

  // Auto-resolve expired PENDING submissions (3hr deadline passed)
  const expiredPending = await prisma.questSubmission.findMany({
    where: {
      vetoStatus: "PENDING",
      vetoDeadline: { lt: new Date() },
      ...(questId ? { questId } : {}),
    },
    include: { quest: true },
  });

  for (const sub of expiredPending) {
    let xpPercent = 0.4; // default: no votes → 40%

    if (sub.approveCount + sub.rejectCount > 0) {
      if (sub.rejectCount > sub.approveCount) {
        xpPercent = 0; // Majority reject → 0%
      } else {
        xpPercent = 0.5; // Some approves but didn't hit threshold → 50%
      }
    }

    if (xpPercent === 0) {
      await prisma.questSubmission.update({
        where: { id: sub.id },
        data: { vetoStatus: "REJECTED", xpAwarded: 0 },
      });
      continue;
    }

    const { xpAwarded, coinsAwarded } = await awardQuestXP({
      userId: sub.userId,
      questId: sub.questId,
      questXpReward: sub.quest.xpReward,
      questDifficulty: sub.quest.difficulty,
      lobbyId: sub.quest.lobbyId,
      xpPercentage: xpPercent,
    });

    await prisma.questSubmission.update({
      where: { id: sub.id },
      data: { vetoStatus: "APPROVED", xpAwarded, coinsAwarded },
    });
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
