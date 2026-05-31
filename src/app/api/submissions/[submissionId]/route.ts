import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MAX_EXTRA = 9;

function isOurCloudinaryUrl(url: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return true;
  return url.includes(`res.cloudinary.com/${cloudName}/`);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { submissionId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });

  const submission = await prisma.questSubmission.findUnique({
    where: { id: submissionId },
  });
  if (!submission) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (submission.userId !== user.id) {
    return NextResponse.json({ error: "Эрх байхгүй" }, { status: 403 });
  }
  if (submission.vetoStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Зөвхөн vote хүлээж буй submission-ийг засах боломжтой" },
      { status: 409 }
    );
  }

  const data: {
    mediaUrl?: string;
    extraMediaUrls?: string[];
    caption?: string | null;
    approveCount?: number;
    rejectCount?: number;
    vetoDeadline?: Date;
  } = {};

  let mediaChanged = false;

  if (typeof body.mediaUrl === "string") {
    const newMediaUrl = body.mediaUrl.trim();
    if (!newMediaUrl) {
      return NextResponse.json({ error: "mediaUrl шаардлагатай" }, { status: 400 });
    }
    if (!isOurCloudinaryUrl(newMediaUrl)) {
      return NextResponse.json({ error: "Буруу media URL" }, { status: 400 });
    }
    if (newMediaUrl !== submission.mediaUrl) {
      data.mediaUrl = newMediaUrl;
      mediaChanged = true;
    }
  }

  if (Array.isArray(body.extraMediaUrls)) {
    const cleaned: string[] = body.extraMediaUrls
      .filter((u: unknown): u is string => typeof u === "string")
      .map((u: string) => u.trim())
      .filter((u: string) => u.length > 0)
      .slice(0, MAX_EXTRA);
    if (cleaned.some((u) => !isOurCloudinaryUrl(u))) {
      return NextResponse.json({ error: "Буруу нэмэлт media URL" }, { status: 400 });
    }
    // Videos can't have extra photos
    const finalExtras = submission.mediaType === "VIDEO" ? [] : cleaned;
    const oldExtras = submission.extraMediaUrls;
    if (
      finalExtras.length !== oldExtras.length ||
      finalExtras.some((u, i) => u !== oldExtras[i])
    ) {
      data.extraMediaUrls = finalExtras;
      mediaChanged = true;
    }
  }

  if (body.caption === null || typeof body.caption === "string") {
    data.caption = body.caption;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ submission });
  }

  // If media changed, reset votes — voters need to re-evaluate the new content
  if (mediaChanged) {
    await prisma.vetoVote.deleteMany({ where: { submissionId } });
    data.approveCount = 0;
    data.rejectCount = 0;
    data.vetoDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000);
  }

  const updated = await prisma.questSubmission.update({
    where: { id: submissionId },
    data,
  });

  return NextResponse.json({ submission: updated, mediaChanged });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { submissionId } = await params;

  const submission = await prisma.questSubmission.findUnique({
    where: { id: submissionId },
    include: { albumPhoto: true },
  });
  if (!submission) return NextResponse.json({ error: "Олдсонгүй" }, { status: 404 });
  if (submission.userId !== user.id) {
    return NextResponse.json({ error: "Эрх байхгүй" }, { status: 403 });
  }
  if (submission.vetoStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Зөвхөн vote хүлээж буй submission-ийг устгах боломжтой" },
      { status: 409 }
    );
  }

  // VetoVote cascades. AlbumPhoto FK has no cascade so wipe it first.
  if (submission.albumPhoto) {
    await prisma.albumPhoto.delete({ where: { id: submission.albumPhoto.id } });
  }

  await prisma.questSubmission.delete({ where: { id: submissionId } });

  return NextResponse.json({ success: true });
}
