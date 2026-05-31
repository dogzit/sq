import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

// PATCH — accept/decline a pending request
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { id } = await params;
  const { action } = await request.json();
  if (action !== "ACCEPT" && action !== "DECLINE") {
    return NextResponse.json({ error: "action нь ACCEPT/DECLINE байх ёстой" }, { status: 400 });
  }

  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (friendship.addresseeId !== user.id) {
    return NextResponse.json({ error: "Эрх алга" }, { status: 403 });
  }
  if (friendship.status !== "PENDING") {
    return NextResponse.json({ error: "Аль хэдийн шийдвэрлэгдсэн" }, { status: 400 });
  }

  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED" },
  });

  if (action === "ACCEPT") {
    createNotification({
      userId: friendship.requesterId,
      type: "friend_accepted",
      title: "Найзын хүсэлт зөвшөөрөгдлөө!",
      body: `${user.displayName} таны хүсэлтийг хүлээж авлаа`,
      metadata: { friendshipId: id, userId: user.id, username: user.username },
    }).catch(() => {});
  }

  return NextResponse.json({ friendship: updated });
}

// DELETE — unfriend or cancel a request
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { id } = await params;
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (friendship.requesterId !== user.id && friendship.addresseeId !== user.id) {
    return NextResponse.json({ error: "Эрх алга" }, { status: 403 });
  }

  await prisma.friendship.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
