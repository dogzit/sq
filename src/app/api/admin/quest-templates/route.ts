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
  const status = searchParams.get("status") ?? "PENDING";
  const valid = ["PENDING", "APPROVED", "REJECTED"] as const;
  if (!valid.includes(status as typeof valid[number])) {
    return NextResponse.json({ error: "status буруу" }, { status: 400 });
  }

  const templates = await prisma.questTemplate.findMany({
    where: { status: status as typeof valid[number] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      difficulty: true,
      xpReward: true,
      coinReward: true,
      status: true,
      rejectReason: true,
      reviewedAt: true,
      createdAt: true,
      approvedQuestId: true,
      creator: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });

  const counts = await prisma.questTemplate.groupBy({
    by: ["status"],
    _count: true,
  });

  return NextResponse.json({ templates, counts });
}
