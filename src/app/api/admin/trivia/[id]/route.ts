import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, rejectReason } = body;

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "action нь APPROVE/REJECT байх" }, { status: 400 });
  }

  const existing = await prisma.triviaQuestion.findUnique({
    where: { id },
    select: { creatorId: true, question: true, status: true },
  });
  if (!existing) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Аль хэдийн шийдэгдсэн байна" }, { status: 409 });
  }

  const isApprove = action === "APPROVE";

  await prisma.$transaction([
    prisma.triviaQuestion.update({
      where: { id },
      data: {
        status: isApprove ? "APPROVED" : "REJECTED",
        rejectReason: isApprove ? null : (typeof rejectReason === "string" ? rejectReason : null),
        reviewedAt: new Date(),
        reviewedById: user.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: existing.creatorId,
        type: isApprove ? "TRIVIA_APPROVED" : "TRIVIA_REJECTED",
        title: isApprove ? "✅ Trivia батлагдлаа" : "❌ Trivia татгалзагдлаа",
        body: isApprove
          ? `"${existing.question.slice(0, 60)}…" асуулт нийтэд харагдах боллоо.`
          : `"${existing.question.slice(0, 60)}…" асуулт татгалзагдсан${rejectReason ? `: ${rejectReason}` : "."}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, action });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.triviaQuestion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
