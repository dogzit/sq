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

  // Check existing vote
  const existingVote = await prisma.vetoVote.findUnique({
    where: { voterId_submissionId: { voterId: user.id, submissionId } },
  });
  if (existingVote) {
    return NextResponse.json({ error: "Already voted" }, { status: 409 });
  }

  // Create vote and update counts
  await prisma.vetoVote.create({
    data: { verdict, voterId: user.id, submissionId },
  });

  const field = verdict === "APPROVE" ? "approveCount" : "rejectCount";
  const updated = await prisma.questSubmission.update({
    where: { id: submissionId },
    data: { [field]: { increment: 1 } },
  });

  // Check if we should resolve the vote
  // Resolve when: total votes >= lobby members - 1 (submitter excluded), or deadline passed
  const totalVotes = updated.approveCount + updated.rejectCount;

  let lobbyMemberCount = 0;
  if (submission.quest.lobbyId) {
    lobbyMemberCount = await prisma.lobbyMember.count({
      where: { lobbyId: submission.quest.lobbyId },
    });
  }

  const shouldResolve = totalVotes >= Math.max(lobbyMemberCount - 1, 1);

  if (shouldResolve) {
    const approved = updated.approveCount > updated.rejectCount;
    const vetoStatus = approved ? "APPROVED" : "REJECTED";

    await prisma.questSubmission.update({
      where: { id: submissionId },
      data: {
        vetoStatus,
        xpAwarded: approved ? submission.quest.xpReward : 0,
      },
    });

    // Award XP if approved
    if (approved) {
      // Check for active effects (buff/debuff)
      let multiplier = 1.0;
      const effects = await prisma.activeEffect.findMany({
        where: {
          targetId: submission.userId,
          consumed: false,
          expiresAt: { gt: new Date() },
        },
      });

      for (const effect of effects) {
        multiplier *= effect.multiplier;
        await prisma.activeEffect.update({
          where: { id: effect.id },
          data: { consumed: true },
        });
      }

      // Character class bonus check
      if (submission.quest.lobbyId) {
        const member = await prisma.lobbyMember.findUnique({
          where: {
            userId_lobbyId: {
              userId: submission.userId,
              lobbyId: submission.quest.lobbyId,
            },
          },
        });

        if (member) {
          const questTemplate = await prisma.quest.findUnique({
            where: { id: submission.questId },
            include: { template: { include: { category: true } } },
          });

          if (questTemplate?.template?.category?.bonusClass === member.characterClass) {
            multiplier *= 1.25; // +25% class bonus
          }
        }
      }

      const finalXp = Math.round(submission.quest.xpReward * multiplier);

      const submitter = await prisma.user.findUnique({ where: { id: submission.userId } });
      if (submitter) {
        const newXp = submitter.xp + finalXp;
        await prisma.user.update({
          where: { id: submission.userId },
          data: {
            xp: newXp,
            level: calculateLevel(newXp),
            streak: { increment: 1 },
          },
        });
      }

      // Update lobby XP
      if (submission.quest.lobbyId) {
        await prisma.lobbyMember.updateMany({
          where: { userId: submission.userId, lobbyId: submission.quest.lobbyId },
          data: { xpInLobby: { increment: finalXp } },
        });
      }

      // Fog of War: grant 1 hour of map visibility
      await prisma.userLocation.upsert({
        where: { userId: submission.userId },
        update: { visibleUntil: new Date(Date.now() + 60 * 60 * 1000) },
        create: {
          userId: submission.userId,
          latitude: 0,
          longitude: 0,
          visibleUntil: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await prisma.questSubmission.update({
        where: { id: submissionId },
        data: { xpAwarded: finalXp },
      });
    }
  }

  return NextResponse.json({ success: true, totalVotes, verdict });
}
