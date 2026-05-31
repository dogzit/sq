import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const effects = await prisma.activeEffect.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      caster: { select: { id: true, username: true, displayName: true } },
      target: { select: { id: true, username: true, displayName: true } },
    },
  });
  return NextResponse.json({ effects });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id шаардлагатай" }, { status: 400 });
  await prisma.activeEffect.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
