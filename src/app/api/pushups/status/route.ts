import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { computePushupStatus } from "@/lib/pushup";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: { lastPushupAt: true, pushupTotalReps: true },
  });

  const status = computePushupStatus(u?.lastPushupAt ?? null);
  return NextResponse.json({
    ...status,
    pushupTotalReps: u?.pushupTotalReps ?? 0,
  });
}
