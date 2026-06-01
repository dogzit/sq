import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      xp: true,
      coins: true,
      level: true,
      streak: true,
      createdAt: true,
      birthDate: true,
      interests: true,
      isProfileComplete: true,
      equippedFrameValue: true,
      _count: {
        select: {
          submissions: true,
          achievements: true,
        },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });

  // Friendship state between me and target
  let friendship: {
    id: string;
    status: string;
    direction: "outgoing" | "incoming";
  } | null = null;
  if (me.id !== user.id) {
    const f = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: me.id, addresseeId: user.id },
          { requesterId: user.id, addresseeId: me.id },
        ],
      },
    });
    if (f) {
      friendship = {
        id: f.id,
        status: f.status,
        direction: f.requesterId === me.id ? "outgoing" : "incoming",
      };
    }
  }

  // Last 6 approved submissions for showcase
  const recentSubmissions = await prisma.questSubmission.findMany({
    where: { userId: user.id, vetoStatus: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      mediaUrl: true,
      mediaType: true,
      caption: true,
      createdAt: true,
      quest: { select: { title: true } },
    },
  });

  // Friend count
  const friendCount = await prisma.friendship.count({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
  });

  return NextResponse.json({
    user,
    isSelf: me.id === user.id,
    friendship,
    friendCount,
    recentSubmissions,
  });
}
