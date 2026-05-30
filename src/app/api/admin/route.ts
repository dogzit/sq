import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function isAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (user?.isAdmin) return true;
  // Fallback: first user in the system is admin
  const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
  return firstUser?.id === userId;
}

// GET: Dashboard stats + data
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });

  const [userCount, lobbyCount, questCount, submissionCount, sessionCount, shopItemCount] = await Promise.all([
    prisma.user.count(),
    prisma.lobby.count(),
    prisma.quest.count(),
    prisma.questSubmission.count(),
    prisma.qASession.count(),
    prisma.shopItem.count(),
  ]);

  const recentUsers = await prisma.user.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    select: { id: true, username: true, displayName: true, email: true, xp: true, coins: true, level: true, streak: true, createdAt: true, emailVerified: true },
  });

  const activeQuests = await prisma.quest.findMany({
    where: { status: "ACTIVE" },
    include: { lobby: { select: { name: true } }, _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const shopItems = await prisma.shopItem.findMany({
    include: { _count: { select: { purchases: true } } },
    orderBy: { createdAt: "desc" },
  });

  const lobbies = await prisma.lobby.findMany({
    include: {
      owner: { select: { displayName: true, username: true } },
      _count: { select: { members: true, quests: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    stats: { userCount, lobbyCount, questCount, submissionCount, sessionCount, shopItemCount },
    recentUsers,
    activeQuests,
    shopItems,
    lobbies,
  });
}

// DELETE: Delete resources
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });

  const { type, id } = await request.json();

  switch (type) {
    case "user": {
      // Don't allow deleting yourself
      if (id === user.id) return NextResponse.json({ error: "Өөрийгөө устгах боломжгүй" }, { status: 400 });
      await prisma.user.delete({ where: { id } });
      return NextResponse.json({ deleted: true });
    }
    case "quest": {
      await prisma.quest.delete({ where: { id } });
      return NextResponse.json({ deleted: true });
    }
    case "shopItem": {
      await prisma.shopItem.delete({ where: { id } });
      return NextResponse.json({ deleted: true });
    }
    case "lobby": {
      await prisma.lobby.delete({ where: { id } });
      return NextResponse.json({ deleted: true });
    }
    default:
      return NextResponse.json({ error: "Тодорхойгүй төрөл" }, { status: 400 });
  }
}

// PUT: Update resources
export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });

  const body = await request.json();
  const { type } = body;

  switch (type) {
    case "user": {
      const { id, xp, coins, level, streak } = body;
      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(xp !== undefined && { xp: Number(xp) }),
          ...(coins !== undefined && { coins: Number(coins) }),
          ...(level !== undefined && { level: Number(level) }),
          ...(streak !== undefined && { streak: Number(streak) }),
        },
        select: { id: true, username: true, displayName: true, xp: true, coins: true, level: true, streak: true },
      });
      return NextResponse.json({ updated });
    }
    case "quest": {
      const { id, status } = body;
      const updated = await prisma.quest.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json({ updated });
    }
    case "shopItem": {
      const { id, name, description, price, itemType, value, iconEmoji } = body;
      const updated = await prisma.shopItem.update({
        where: { id },
        data: { name, description, price: Number(price), itemType, value, iconEmoji },
      });
      return NextResponse.json({ updated });
    }
    default:
      return NextResponse.json({ error: "Тодорхойгүй төрөл" }, { status: 400 });
  }
}

// POST: Create resources
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });
  if (!(await isAdmin(user.id))) return NextResponse.json({ error: "Хандах эрхгүй байна" }, { status: 403 });

  const body = await request.json();
  const { type } = body;

  switch (type) {
    case "shopItem": {
      const { name, description, price, itemType, value, iconEmoji } = body;
      if (!name || !description || !price || !itemType || !value) {
        return NextResponse.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 });
      }
      const item = await prisma.shopItem.create({
        data: { name, description, price: Number(price), itemType, value, iconEmoji: iconEmoji || "🎁" },
      });
      return NextResponse.json({ item });
    }
    case "quest": {
      const { title, description, xpReward, difficulty, questType, lobbyId, expiresInHours } = body;
      if (!title || !description) {
        return NextResponse.json({ error: "Гарчиг болон тайлбар шаардлагатай" }, { status: 400 });
      }
      const hours = Number(expiresInHours) || 24;
      const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      const quest = await prisma.quest.create({
        data: {
          title,
          description,
          xpReward: Number(xpReward) || 50,
          difficulty: difficulty || "MEDIUM",
          questType: questType || "DAILY",
          lobbyId: lobbyId || null,
          expiresAt,
        },
        include: { lobby: { select: { name: true } }, _count: { select: { submissions: true } } },
      });
      return NextResponse.json({ quest });
    }
    default:
      return NextResponse.json({ error: "Тодорхойгүй төрөл" }, { status: 400 });
  }
}
