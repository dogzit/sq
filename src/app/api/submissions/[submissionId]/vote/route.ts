import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { awardQuestXP } from "@/lib/economy";
import { checkAchievements } from "@/lib/achievements";
import { createNotification } from "@/lib/notifications";

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
  if (submission.vetoStatus !== "PENDING") {
    return NextResponse.json({ error: "Санал хураалт дууссан байна" }, { status: 400 });
  }

  // Check existing vote — allow changing vote
  const existingVote = await prisma.vetoVote.findUnique({
    where: { voterId_submissionId: { voterId: user.id, submissionId } },
  });

  if (existingVote) {
    if (existingVote.verdict === verdict) {
      return NextResponse.json({ error: "Аль хэдийн санал өгсөн байна" }, { status: 409 });
    }
    // Change vote: update verdict and swap counts
    await prisma.vetoVote.update({
      where: { id: existingVote.id },
      data: { verdict },
    });
    const updated = await prisma.questSubmission.update({
      where: { id: submissionId },
      data: {
        approveCount: { increment: verdict === "APPROVE" ? 1 : -1 },
        rejectCount: { increment: verdict === "REJECT" ? 1 : -1 },
      },
    });

    // Voter earns 2 coins for participating
    await prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: 2 } },
    });

    await tryResolve(submission, updated);
    checkAchievements(user.id, { votesCast: 1 }).catch(() => {});
    return NextResponse.json({ success: true, changed: true, verdict });
  }

  // New vote
  await prisma.vetoVote.create({
    data: { verdict, voterId: user.id, submissionId },
  });

  const field = verdict === "APPROVE" ? "approveCount" : "rejectCount";
  const updated = await prisma.questSubmission.update({
    where: { id: submissionId },
    data: { [field]: { increment: 1 } },
  });

  // Voter earns 2 coins for participating
  await prisma.user.update({
    where: { id: user.id },
    data: { coins: { increment: 2 } },
  });

  await tryResolve(submission, updated);
  checkAchievements(user.id, { votesCast: 1 }).catch(() => {});

  return NextResponse.json({ success: true, verdict });
}

// Try to resolve submission based on vote counts
async function tryResolve(
  submission: { id: string; userId: string; questId: string; quest: { id: string; lobbyId: string | null; xpReward: number; difficulty: string } },
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
  if (totalVotes < majorityThreshold) return;

  const approved = updated.approveCount > updated.rejectCount;
  await resolveSubmission(submission, approved);
}

// Award XP and finalize submission
async function resolveSubmission(
  submission: { id: string; userId: string; questId: string; quest: { id: string; lobbyId: string | null; xpReward: number; difficulty: string } },
  approved: boolean
) {
  if (!approved) {
    await prisma.questSubmission.update({
      where: { id: submission.id },
      data: { vetoStatus: "REJECTED", xpAwarded: 0 },
    });
    createNotification({
      userId: submission.userId,
      type: "submission_rejected",
      title: "Submission татгалзагдлаа",
      body: "Таны submission олонхийн саналаар татгалзагдлаа",
      metadata: { submissionId: submission.id },
    }).catch(() => {});
    return;
  }

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
    metadata: { submissionId: submission.id, xpAwarded, coinsAwarded },
  }).catch(() => {});
}
