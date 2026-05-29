import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateLevel } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { submissionId } = await params;
  const { verdict } = await request.json(); // "APPROVE" or "REJECT"

  if (!["APPROVE", "REJECT"].includes(verdict)) {
    return NextResponse.json({ error: "Invalid verdict" }, { status: 400 });
  }

  const submission = await prisma.questSubmission.findUnique({
    where: { id: submissionId },
    include: { quest: true },
  });

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.userId === user.id) {
    return NextResponse.json({ error: "Cannot vote on your own submission" }, { status: 400 });
  }
  if (submission.vetoStatus !== "PENDING") {
    return NextResponse.json({ error: "Voting already closed" }, { status: 400 });
  }

  // Check existing vote — allow changing vote
  const existingVote = await prisma.vetoVote.findUnique({
    where: { voterId_submissionId: { voterId: user.id, submissionId } },
  });

  if (existingVote) {
    if (existingVote.verdict === verdict) {
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
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
    await tryResolve(submission, updated);
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

  await tryResolve(submission, updated);

  return NextResponse.json({ success: true, verdict });
}

// Try to resolve submission based on vote counts
async function tryResolve(
  submission: { id: string; userId: string; questId: string; quest: { id: string; lobbyId: string | null; xpReward: number } },
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
  submission: { id: string; userId: string; questId: string; quest: { id: string; lobbyId: string | null; xpReward: number } },
  approved: boolean
) {
  if (!approved) {
    await prisma.questSubmission.update({
      where: { id: submission.id },
      data: { vetoStatus: "REJECTED", xpAwarded: 0 },
    });
    return;
  }

  let multiplier = 1.0;
  const effects = await prisma.activeEffect.findMany({
    where: { targetId: submission.userId, consumed: false, expiresAt: { gt: new Date() } },
  });
  for (const effect of effects) {
    multiplier *= effect.multiplier;
    await prisma.activeEffect.update({ where: { id: effect.id }, data: { consumed: true } });
  }

  if (submission.quest.lobbyId) {
    const member = await prisma.lobbyMember.findUnique({
      where: { userId_lobbyId: { userId: submission.userId, lobbyId: submission.quest.lobbyId } },
    });
    if (member) {
      const questTemplate = await prisma.quest.findUnique({
        where: { id: submission.questId },
        include: { template: { include: { category: true } } },
      });
      if (questTemplate?.template?.category?.bonusClass === member.characterClass) {
        multiplier *= 1.25;
      }
    }
  }

  const finalXp = Math.round(submission.quest.xpReward * multiplier);
  const finalCoins = Math.round(submission.quest.xpReward * 0.2 * multiplier);
  const submitter = await prisma.user.findUnique({ where: { id: submission.userId } });
  if (!submitter) return;

  const newXp = submitter.xp + finalXp;

  await prisma.$transaction([
    prisma.questSubmission.update({
      where: { id: submission.id },
      data: { vetoStatus: "APPROVED", xpAwarded: finalXp, coinsAwarded: finalCoins },
    }),
    prisma.user.update({
      where: { id: submission.userId },
      data: { xp: newXp, coins: { increment: finalCoins }, level: calculateLevel(newXp), streak: { increment: 1 } },
    }),
    ...(submission.quest.lobbyId
      ? [prisma.lobbyMember.updateMany({
          where: { userId: submission.userId, lobbyId: submission.quest.lobbyId },
          data: { xpInLobby: { increment: finalXp } },
        })]
      : []),
    prisma.userLocation.upsert({
      where: { userId: submission.userId },
      update: { visibleUntil: new Date(Date.now() + 60 * 60 * 1000) },
      create: { userId: submission.userId, latitude: 0, longitude: 0, visibleUntil: new Date(Date.now() + 60 * 60 * 1000) },
    }),
  ]);
}
