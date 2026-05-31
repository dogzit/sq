import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

// GET — list current user's friendships
// ?status=ACCEPTED → friends, ?status=PENDING → incoming + outgoing requests
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as
    | "PENDING"
    | "ACCEPTED"
    | "DECLINED"
    | "BLOCKED"
    | null;

  const friendships = await prisma.friendship.findMany({
    where: {
      ...(status ? { status } : {}),
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
    include: {
      requester: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, level: true, xp: true, coins: true },
      },
      addressee: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, level: true, xp: true, coins: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ friendships });
}

// POST — send friend request { addresseeId }
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { addresseeId } = await request.json();
  if (!addresseeId || typeof addresseeId !== "string") {
    return NextResponse.json({ error: "addresseeId шаардлагатай" }, { status: 400 });
  }
  if (addresseeId === user.id) {
    return NextResponse.json({ error: "Өөртөө хүсэлт илгээх боломжгүй" }, { status: 400 });
  }

  const addressee = await prisma.user.findUnique({ where: { id: addresseeId } });
  if (!addressee) return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 404 });

  // Check existing in either direction
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId },
        { requesterId: addresseeId, addresseeId: user.id },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") {
      return NextResponse.json({ error: "Аль хэдийн найзууд" }, { status: 409 });
    }
    if (existing.status === "PENDING") {
      // If they already sent you one, auto-accept it
      if (existing.requesterId === addresseeId) {
        const accepted = await prisma.friendship.update({
          where: { id: existing.id },
          data: { status: "ACCEPTED" },
        });
        createNotification({
          userId: addresseeId,
          type: "friend_accepted",
          title: "Найзын хүсэлт зөвшөөрөгдлөө!",
          body: `${user.displayName} таны хүсэлтийг хүлээж авлаа`,
          metadata: { friendshipId: accepted.id, userId: user.id, username: user.username },
        }).catch(() => {});
        return NextResponse.json({ friendship: accepted, autoAccepted: true });
      }
      return NextResponse.json({ error: "Хүсэлт илгээгдсэн байна" }, { status: 409 });
    }
    // DECLINED/BLOCKED — re-send by updating to PENDING
    if (existing.requesterId === user.id) {
      const updated = await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: "PENDING" },
      });
      createNotification({
        userId: addresseeId,
        type: "friend_request",
        title: "Найзын хүсэлт",
        body: `${user.displayName} танд найзын хүсэлт илгээлээ`,
        metadata: { friendshipId: updated.id, userId: user.id, username: user.username },
      }).catch(() => {});
      return NextResponse.json({ friendship: updated });
    }
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: user.id, addresseeId, status: "PENDING" },
  });

  createNotification({
    userId: addresseeId,
    type: "friend_request",
    title: "Найзын хүсэлт",
    body: `${user.displayName} танд найзын хүсэлт илгээлээ`,
    metadata: { friendshipId: friendship.id, userId: user.id, username: user.username },
  }).catch(() => {});

  return NextResponse.json({ friendship }, { status: 201 });
}
