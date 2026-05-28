import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { uploadToImgbb } from "@/lib/imgur";
import { submissionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }
  const { questId, photo, caption } = parsed.data;

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.status !== "ACTIVE") {
    return NextResponse.json({ error: "Quest not available" }, { status: 404 });
  }

  const existing = await prisma.questSubmission.findUnique({
    where: { userId_questId: { userId: user.id, questId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  // Upload to imgbb
  const { url } = await uploadToImgbb(photo);

  // Veto deadline = 1 hour from now
  const vetoDeadline = new Date(Date.now() + 60 * 60 * 1000);

  const submission = await prisma.questSubmission.create({
    data: {
      photoUrl: url,
      caption,
      vetoStatus: "PENDING",
      vetoDeadline,
      userId: user.id,
      questId,
    },
  });

  return NextResponse.json({ submission }, { status: 201 });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const questId = searchParams.get("questId");

  const submissions = await prisma.questSubmission.findMany({
    where: questId ? { questId } : { userId: user.id },
    include: {
      quest: true,
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      votes: {
        select: { verdict: true, voterId: true },
      },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ submissions });
}
