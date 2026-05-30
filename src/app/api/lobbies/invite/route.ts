import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendEmergencyQuestEmail } from "@/lib/email";
import { z } from "zod";

const inviteSchema = z.object({
  lobbyId: z.string().min(1),
  username: z.string().min(1),
});

const respondSchema = z.object({
  inviteId: z.string().min(1),
  action: z.enum(["accept", "decline"]),
});

// Send invite
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { lobbyId, username } = parsed.data;

  // Verify sender is member
  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
  });
  if (!member) return NextResponse.json({ error: "Гишүүн биш байна" }, { status: 403 });

  // Find target user
  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  if (target.id === user.id) return NextResponse.json({ error: "Өөрийгөө урих боломжгүй" }, { status: 400 });

  // Check if already member
  const existingMember = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: target.id, lobbyId } },
  });
  if (existingMember) return NextResponse.json({ error: "Аль хэдийн гишүүн байна" }, { status: 409 });

  // Check existing pending invite
  const existingInvite = await prisma.lobbyInvite.findFirst({
    where: { receiverId: target.id, lobbyId, status: "PENDING" },
  });
  if (existingInvite) return NextResponse.json({ error: "Урилга аль хэдийн илгээсэн байна" }, { status: 409 });

  const invite = await prisma.lobbyInvite.create({
    data: {
      senderId: user.id,
      receiverId: target.id,
      lobbyId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    include: {
      receiver: { select: { username: true, displayName: true } },
      lobby: { select: { name: true } },
    },
  });

  return NextResponse.json({ invite }, { status: 201 });
}

// Respond to invite (accept/decline)
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { inviteId, action } = parsed.data;

  const invite = await prisma.lobbyInvite.findUnique({
    where: { id: inviteId },
    include: { lobby: { include: { _count: { select: { members: true } } } } },
  });

  if (!invite || invite.receiverId !== user.id) {
    return NextResponse.json({ error: "Урилга олдсонгүй" }, { status: 404 });
  }

  if (invite.status !== "PENDING") {
    return NextResponse.json({ error: "Урилгад аль хэдийн хариулсан байна" }, { status: 400 });
  }

  if (invite.expiresAt < new Date()) {
    await prisma.lobbyInvite.update({ where: { id: inviteId }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Урилгын хугацаа дууссан байна" }, { status: 400 });
  }

  if (action === "decline") {
    await prisma.lobbyInvite.update({ where: { id: inviteId }, data: { status: "DECLINED" } });
    return NextResponse.json({ status: "declined" });
  }

  // Accept
  if (invite.lobby._count.members >= invite.lobby.maxMembers) {
    return NextResponse.json({ error: "Lobby дүүрсэн байна" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.lobbyInvite.update({ where: { id: inviteId }, data: { status: "ACCEPTED" } }),
    prisma.lobbyMember.create({ data: { userId: user.id, lobbyId: invite.lobbyId } }),
  ]);

  return NextResponse.json({ status: "accepted", lobbyId: invite.lobbyId });
}

// Get pending invites for current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const invites = await prisma.lobbyInvite.findMany({
    where: { receiverId: user.id, status: "PENDING", expiresAt: { gt: new Date() } },
    include: {
      sender: { select: { username: true, displayName: true } },
      lobby: { select: { id: true, name: true, code: true, _count: { select: { members: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}
