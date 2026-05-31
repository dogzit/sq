import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { title, body, lobbyId } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "title болон body шаардлагатай" }, { status: 400 });
  }

  const targetUsers = lobbyId
    ? await prisma.lobbyMember.findMany({
        where: { lobbyId },
        select: { userId: true },
      })
    : await prisma.user.findMany({ select: { id: true } });

  if (targetUsers.length === 0) {
    return NextResponse.json({ error: "Хэрэглэгч олдсонгүй" }, { status: 400 });
  }

  const result = await prisma.notification.createMany({
    data: targetUsers.map((u) => ({
      type: "ADMIN_BROADCAST",
      title,
      body,
      userId: "userId" in u ? u.userId : u.id,
    })),
  });

  return NextResponse.json({ sent: result.count });
}
