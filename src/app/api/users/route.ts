import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
  const suggest = searchParams.get("suggest") === "true";

  // For suggestions: exclude users I already have any friendship with (any status)
  let excludeIds: string[] = [me.id];
  if (suggest) {
    const existingRels = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: me.id }, { addresseeId: me.id }],
      },
      select: { requesterId: true, addresseeId: true },
    });
    const relatedIds = new Set<string>();
    for (const r of existingRels) {
      relatedIds.add(r.requesterId);
      relatedIds.add(r.addresseeId);
    }
    relatedIds.delete(me.id);
    excludeIds = [me.id, ...relatedIds];
  }

  const users = await prisma.user.findMany({
    where: {
      id: { notIn: excludeIds },
      isProfileComplete: true,
      ...(q
        ? {
            OR: [
              { username: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: suggest
      ? [{ lastActiveAt: "desc" }, { level: "desc" }]
      : [{ level: "desc" }, { xp: "desc" }],
    take: limit,
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      level: true,
      xp: true,
      streak: true,
      interests: true,
    },
  });

  // Attach friendship state per user (only when not in suggest mode — suggestions are all "no relation")
  let friendshipByUserId: Record<
    string,
    { id: string; status: string; direction: "outgoing" | "incoming" }
  > = {};
  if (!suggest && users.length > 0) {
    const ids = users.map((u) => u.id);
    const rels = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: me.id, addresseeId: { in: ids } },
          { addresseeId: me.id, requesterId: { in: ids } },
        ],
      },
      select: {
        id: true,
        status: true,
        requesterId: true,
        addresseeId: true,
      },
    });
    friendshipByUserId = Object.fromEntries(
      rels.map((r) => {
        const otherId = r.requesterId === me.id ? r.addresseeId : r.requesterId;
        return [
          otherId,
          {
            id: r.id,
            status: r.status,
            direction: r.requesterId === me.id ? "outgoing" : "incoming",
          },
        ];
      })
    );
  }

  const enriched = users.map((u) => ({
    ...u,
    friendship: friendshipByUserId[u.id] ?? null,
  }));

  return NextResponse.json({ users: enriched });
}
