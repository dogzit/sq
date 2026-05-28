import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const albums = await prisma.album.findMany({
    where: { userId: user.id },
    include: {
      photos: {
        include: {
          submission: {
            include: {
              user: { select: { id: true, username: true, displayName: true } },
              quest: { select: { title: true } },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ albums });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, submissionIds } = await request.json();

  if (!title || !submissionIds?.length) {
    return NextResponse.json({ error: "Title and submissions required" }, { status: 400 });
  }

  const album = await prisma.album.create({
    data: {
      title,
      coverUrl: null,
      userId: user.id,
      photos: {
        create: submissionIds.map((id: string, i: number) => ({
          submissionId: id,
          order: i,
        })),
      },
    },
    include: {
      photos: {
        include: { submission: true },
        orderBy: { order: "asc" },
      },
    },
  });

  return NextResponse.json({ album }, { status: 201 });
}
