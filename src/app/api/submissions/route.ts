import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadMediaStream } from "@/lib/cloudinary";
import { awardQuestXP } from "@/lib/economy";
import { notifyLobbyMembers } from "@/lib/notifications";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;   // 10 MB
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;   // 80 MB

export const maxDuration = 60; // Vercel — long upload

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const questId = (form.get("questId") as string | null)?.trim();
  const caption = (form.get("caption") as string | null) ?? null;

  if (!file) return NextResponse.json({ error: "Файл байхгүй" }, { status: 400 });
  if (!questId) return NextResponse.json({ error: "questId шаардлагатай" }, { status: 400 });

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Зөвхөн зураг эсвэл видео оруулна уу" }, { status: 400 });
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Зураг 10MB-аас бага байх ёстой" }, { status: 400 });
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Видео 80MB-аас бага байх ёстой" }, { status: 400 });
  }

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.status !== "ACTIVE") {
    return NextResponse.json({ error: "Quest олдсонгүй эсвэл идэвхгүй" }, { status: 404 });
  }

  const existing = await prisma.questSubmission.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Аль хэдийн илгээсэн байна" }, { status: 409 });
  }

  // Upload to Cloudinary via stream
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadMediaStream(
    buffer,
    "sidequest/submissions",
    isVideo ? "video" : "image"
  );

  const mediaType = isVideo ? "VIDEO" : "IMAGE";
  const isLobbyQuest = !!quest.lobbyId;

  if (isLobbyQuest) {
    const vetoDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const submission = await prisma.questSubmission.create({
      data: {
        mediaUrl: uploaded.url,
        mediaType,
        caption,
        vetoStatus: "PENDING",
        vetoDeadline,
        userId: user.id,
        questId,
      },
    });

    if (quest.lobbyId) {
      notifyLobbyMembers({
        lobbyId: quest.lobbyId,
        excludeUserId: user.id,
        type: "vote_needed",
        title: "Vote хэрэгтэй!",
        body: `${user.displayName} "${quest.title}" quest-д ${isVideo ? "видео" : "зураг"} илгээлээ`,
        metadata: { questId, submissionId: submission.id },
      }).catch(() => {});
    }

    return NextResponse.json({ submission, pending: true }, { status: 201 });
  }

  // Global quest: auto-approve
  const { xpAwarded, coinsAwarded } = await awardQuestXP({
    userId: user.id,
    questId,
    questXpReward: quest.xpReward,
    questDifficulty: quest.difficulty,
    lobbyId: quest.lobbyId,
  });

  const submission = await prisma.questSubmission.create({
    data: {
      mediaUrl: uploaded.url,
      mediaType,
      caption,
      vetoStatus: "APPROVED",
      xpAwarded,
      coinsAwarded,
      userId: user.id,
      questId,
    },
  });

  return NextResponse.json(
    { submission: { ...submission, xpAwarded, coinsAwarded } },
    { status: 201 }
  );
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
    let xpPercent = 0.4;
    if (sub.approveCount + sub.rejectCount > 0) {
      if (sub.rejectCount > sub.approveCount) {
        xpPercent = 0;
      } else {
        xpPercent = 0.5;
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
      votes: { select: { verdict: true, voterId: true } },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ submissions });
}
