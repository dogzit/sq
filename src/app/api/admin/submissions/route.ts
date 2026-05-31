import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const submissions = await prisma.questSubmission.findMany({
    where: status ? { vetoStatus: status as "PENDING" | "APPROVED" | "REJECTED" } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      mediaUrl: true,
      mediaType: true,
      caption: true,
      vetoStatus: true,
      vetoDeadline: true,
      approveCount: true,
      rejectCount: true,
      xpAwarded: true,
      coinsAwarded: true,
      createdAt: true,
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      quest: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json({ submissions });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { id, vetoStatus } = await req.json();
  const valid = ["PENDING", "APPROVED", "REJECTED"];
  if (!id || !valid.includes(vetoStatus)) {
    return NextResponse.json({ error: "id болон vetoStatus шаардлагатай" }, { status: 400 });
  }

  const updated = await prisma.questSubmission.update({
    where: { id },
    data: { vetoStatus, vetoDeadline: null },
  });
  return NextResponse.json({ updated });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id шаардлагатай" }, { status: 400 });

  await prisma.questSubmission.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
