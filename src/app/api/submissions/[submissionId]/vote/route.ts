import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardQuestXP, calculateLevel } from "@/lib/economy";
import { checkAchievements } from "@/lib/achievements";
import { createNotification } from "@/lib/notifications";

type QuestSub = {
  id: string;
  userId: string;
  questId: string;
  vetoStatus: string;
  xpAwarded: number;
  coinsAwarded: number;
  quest: { id: string; lobbyId: string | null; xpReward: number; difficulty: string };
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { submissionId } = await params;
  const { verdict } = await request.json(); // "APPROVE" or "REJECT"

  if (!["APPROVE", "REJECT"].includes(verdict)) {
    return NextResponse.json({ error: "Буруу санал" }, { status: 400 });
  }

  const submission = await prisma.questSubmission.findUnique({
    where: { id: submissionId },
    include: { quest: true },
  });

  if (!submission) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (submission.userId === user.id) {
    return NextResponse.json({ error: "Өөрийнхөө илгээлтэд санал өгөх боломжгүй" }, { status: 400 });
  }

  // Check existing vote — allow changing vote even after resolution
  const existingVote = await prisma.vetoVote.findUnique({
    where: { voterId_submissionId: { voterId: user.id, submissionId } },
  });

  let updated;
  let isFirstVote = false;

  if (existingVote) {
    if (existingVote.verdict === verdict) {
      return NextResponse.json({ error: "Аль хэдийн санал өгсөн байна" }, { status: 409 });
    }
    await prisma.vetoVote.update({
      where: { id: existingVote.id },
      data: { verdict },
    });
    updated = await prisma.questSubmission.update({
      where: { id: submissionId },
      data: {
        approveCount: { increment: verdict === "APPROVE" ? 1 : -1 },
        rejectCount: { increment: verdict === "REJECT" ? 1 : -1 },
      },
    });
  } else {
    isFirstVote = true;
    await prisma.vetoVote.create({
      data: { verdict, voterId: user.id, submissionId },
    });
    const field = verdict === "APPROVE" ? "approveCount" : "rejectCount";
    updated = await prisma.questSubmission.update({
      where: { id: submissionId },
      data: { [field]: { increment: 1 } },
    });
  }

  // Voter earns 2 coins on first-time vote only (no farming via vote-flipping)
  if (isFirstVote) {
    await prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: 2 } },
    });
  }

  await tryResolve({ ...submission, ...updated }, updated);
  checkAchievements(user.id, { votesCast: 1 }).catch(() => {});

  return NextResponse.json({ success: true, changed: !!existingVote, verdict });
}

// Try to resolve submission based on vote counts.
// Also re-resolves already-resolved submissions when votes change.
async function tryResolve(
  submission: QuestSub,
  updated: { approveCount: number; rejectCount: number }
) {
  const totalVotes = updated.approveCount + updated.rejectCount;

  let eligibleVoters = 1;
  if (submission.quest.lobbyId) {
    const lobbyMemberCount = await prisma.lobbyMember.count({
      where: { lobbyId: submission.quest.lobbyId },
    });
    eligibleVoters = Math.max(lobbyMemberCount - 1, 1);
  }

  const majorityThreshold = Math.ceil(eligibleVoters / 2);

  // Not enough votes yet — if previously resolved, revert to PENDING
  if (totalVotes < majorityThreshold) {
    if (submission.vetoStatus === "APPROVED") {
      await revertAward(submission);
      await prisma.questSubmission.update({
        where: { id: submission.id },
        data: { vetoStatus: "PENDING", xpAwarded: 0, coinsAwarded: 0 },
      });
    } else if (submission.vetoStatus === "REJECTED") {
      await prisma.questSubmission.update({
        where: { id: submission.id },
        data: { vetoStatus: "PENDING" },
      });
    }
    return;
  }

  const shouldApprove = updated.approveCount > updated.rejectCount;
  const currentStatus = submission.vetoStatus;

  if (shouldApprove && currentStatus !== "APPROVED") {
    if (currentStatus === "REJECTED" || currentStatus === "PENDING") {
      await applyApproval(submission);
    }
  } else if (!shouldApprove && currentStatus !== "REJECTED") {
    if (currentStatus === "APPROVED") {
      await revertAward(submission);
    }
    await prisma.questSubmission.update({
      where: { id: submission.id },
      data: { vetoStatus: "REJECTED", xpAwarded: 0, coinsAwarded: 0 },
    });
    createNotification({
      userId: submission.userId,
      type: "submission_rejected",
      title: "Submission татгалзагдлаа",
      body: "Таны submission олонхийн саналаар татгалзагдлаа",
      metadata: { submissionId: submission.id, questId: submission.questId },
    }).catch(() => {});
  }
}

async function applyApproval(submission: QuestSub) {
  const { xpAwarded, coinsAwarded } = await awardQuestXP({
    userId: submission.userId,
    questId: submission.questId,
    questXpReward: submission.quest.xpReward,
    questDifficulty: submission.quest.difficulty,
    lobbyId: submission.quest.lobbyId,
  });

  await prisma.questSubmission.update({
    where: { id: submission.id },
    data: { vetoStatus: "APPROVED", xpAwarded, coinsAwarded },
  });

  createNotification({
    userId: submission.userId,
    type: "submission_approved",
    title: "Submission зөвшөөрөгдлөө!",
    body: `+${xpAwarded} XP, +${coinsAwarded} coins авлаа`,
    metadata: { submissionId: submission.id, questId: submission.questId, xpAwarded, coinsAwarded },
  }).catch(() => {});
}

// Revert XP/coins/level/xpInLobby from a previously approved submission.
// Streak is left as-is (one-off edge case not worth the complexity).
async function revertAward(submission: QuestSub) {
  const sub = await prisma.questSubmission.findUnique({
    where: { id: submission.id },
    select: { xpAwarded: true, coinsAwarded: true, userId: true },
  });
  if (!sub || (sub.xpAwarded === 0 && sub.coinsAwarded === 0)) return;

  const user = await prisma.user.findUnique({
    where: { id: sub.userId },
    select: { xp: true },
  });
  if (!user) return;

  const newXp = Math.max(0, user.xp - sub.xpAwarded);
  const newLevel = calculateLevel(newXp);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: sub.userId },
      data: {
        xp: newXp,
        coins: { decrement: sub.coinsAwarded },
        level: newLevel,
      },
    }),
    ...(submission.quest.lobbyId
      ? [
          prisma.lobbyMember.updateMany({
            where: { userId: sub.userId, lobbyId: submission.quest.lobbyId },
            data: { xpInLobby: { decrement: sub.xpAwarded } },
          }),
        ]
      : []),
  ]);
}
