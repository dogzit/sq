import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { questId } = await params;

  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: {
      submissions: {
        where: { userId: user.id },
        select: { id: true, vetoStatus: true, mediaUrl: true, mediaType: true },
      },
      _count: { select: { submissions: true } },
    },
  });

  if (!quest) {
    return NextResponse.json({ error: "Quest олдсонгүй" }, { status: 404 });
  }

  return NextResponse.json({ quest });
}
