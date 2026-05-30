import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { CharacterClass } from "@/generated/prisma/client";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { lobbyId } = await params;
  const { characterClass } = await request.json();

  if (!["TANK", "MAGE", "CLOWN"].includes(characterClass)) {
    return NextResponse.json({ error: "Буруу класс" }, { status: 400 });
  }

  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
  });

  if (!member) return NextResponse.json({ error: "Гишүүн биш байна" }, { status: 403 });

  const updated = await prisma.lobbyMember.update({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
    data: { characterClass: characterClass as CharacterClass },
  });

  return NextResponse.json({ characterClass: updated.characterClass });
}
