import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmergencyQuestEmail } from "@/lib/email";
import { emergencySchema } from "@/lib/validations";

const emergencyQuests = [
  { title: "Flash Mob Dance!", description: "Drop everything and do a 15-second dance — video proof NOW!", xpReward: 200, difficulty: "LEGENDARY" as const },
  { title: "Speed Selfie", description: "Take a creative selfie with something RED in 15 minutes!", xpReward: 150, difficulty: "HARD" as const },
  { title: "Emergency Compliment", description: "Call a friend RIGHT NOW and give them the most dramatic compliment", xpReward: 120, difficulty: "MEDIUM" as const },
  { title: "Instant Art", description: "Draw your current mood in 5 minutes — pen and paper only!", xpReward: 130, difficulty: "HARD" as const },
  { title: "Scream into the Void", description: "Go outside and photograph the sky — add a dramatic caption", xpReward: 100, difficulty: "MEDIUM" as const },
  { title: "Mirror Challenge", description: "Take the most creative mirror selfie you can in 15 minutes", xpReward: 140, difficulty: "HARD" as const },
];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = emergencySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { lobbyId } = parsed.data;

  // Verify user is admin/owner
  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
  });
  if (!member || member.role === "MEMBER") {
    return NextResponse.json({ error: "Only admins can trigger emergency quests" }, { status: 403 });
  }

  // Pick a random emergency quest
  const template = emergencyQuests[Math.floor(Math.random() * emergencyQuests.length)];

  const quest = await prisma.quest.create({
    data: {
      title: `⚡ ${template.title}`,
      description: template.description,
      xpReward: template.xpReward,
      difficulty: template.difficulty,
      questType: "EMERGENCY",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      lobbyId,
    },
  });

  // Send email notifications to all lobby members (non-blocking)
  const lobbyWithMembers = await prisma.lobby.findUnique({
    where: { id: lobbyId },
    select: {
      name: true,
      members: {
        select: { user: { select: { email: true } } },
      },
    },
  });

  if (lobbyWithMembers) {
    const emails = lobbyWithMembers.members.map((m) => m.user.email);
    sendEmergencyQuestEmail(
      emails,
      `⚡ ${template.title}`,
      template.description,
      lobbyWithMembers.name,
      15
    ).catch((err) => console.error("Failed to send emergency emails:", err));
  }

  return NextResponse.json({ quest }, { status: 201 });
}
