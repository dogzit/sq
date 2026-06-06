import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { notificationId, readAll } = await request.json();

  if (readAll) {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  if (notificationId) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { notificationId, notificationIds } = await request.json();

  const ids: string[] = Array.isArray(notificationIds)
    ? notificationIds.filter((x): x is string => typeof x === "string")
    : notificationId
      ? [notificationId]
      : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "ID шаардлагатай" }, { status: 400 });
  }

  const { count } = await prisma.notification.deleteMany({
    where: { id: { in: ids }, userId: user.id },
  });
  return NextResponse.json({ success: true, deleted: count });
}
