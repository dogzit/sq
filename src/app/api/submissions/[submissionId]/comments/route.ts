import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

const MAX_LEN = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { submissionId } = await params;

  const comments = await prisma.submissionComment.findMany({
    where: { submissionId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, equippedFrameValue: true },
      },
    },
  });

  return NextResponse.json({ comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { submissionId } = await params;
  const json = await request.json().catch(() => null);
  const body = typeof json?.body === "string" ? json.body.trim() : "";
  if (!body) return NextResponse.json({ error: "Хоосон сэтгэгдэл" }, { status: 400 });
  if (body.length > MAX_LEN) {
    return NextResponse.json({ error: `${MAX_LEN} тэмдэгтээс ихгүй` }, { status: 400 });
  }

  const submission = await prisma.questSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true, userId: true, quest: { select: { id: true, title: true } } },
  });
  if (!submission) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });

  const comment = await prisma.submissionComment.create({
    data: { submissionId, userId: user.id, body },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, equippedFrameValue: true },
      },
    },
  });

  if (submission.userId !== user.id) {
    createNotification({
      userId: submission.userId,
      type: "submission_comment",
      title: "💬 Шинэ сэтгэгдэл",
      body: `${user.displayName}: ${body.slice(0, 80)}`,
      metadata: { questId: submission.quest.id, submissionId },
    }).catch(() => {});
  }

  return NextResponse.json({ comment }, { status: 201 });
}
