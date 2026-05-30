import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validations";

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { displayName, username } = parsed.data;

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName && { displayName }),
        ...(username && { username }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        xp: true,
        level: true,
        streak: true,
      },
    });
    return NextResponse.json({ user: updated });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Хэрэглэгчийн нэр бүртгэлтэй байна" }, { status: 409 });
    }
    throw e;
  }
}
