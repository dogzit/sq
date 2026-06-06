import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { locationSchema } from "@/lib/validations";
import { pushTo, lobbyChannel } from "@/lib/pusher-server";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json();
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { latitude, longitude, accuracy } = parsed.data;
  const heading = parsed.data.heading ?? null;
  const speed = parsed.data.speed ?? null;
  const battery = parsed.data.battery ?? null;

  const location = await prisma.userLocation.upsert({
    where: { userId: user.id },
    update: { latitude, longitude, accuracy, sharing: true },
    create: { userId: user.id, latitude, longitude, accuracy, sharing: true },
  });

  // ── REALTIME: broadcast to every lobby the user is in ──
  // Each lobby's private channel emits `location:update` with the live payload,
  // so other members' Map page can move the marker in real-time.
  const memberships = await prisma.lobbyMember.findMany({
    where: { userId: user.id },
    select: { lobbyId: true },
  });

  const payload = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    equippedFrameValue: user.equippedFrameValue ?? null,
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    heading,
    speed,
    battery,
    updatedAt: location.updatedAt.toISOString(),
  };

  for (const m of memberships) {
    pushTo(lobbyChannel(m.lobbyId), "location:update", payload);
  }

  return NextResponse.json({ location });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  // Stop sharing — flip the flag and broadcast offline to every lobby.
  await prisma.userLocation.updateMany({
    where: { userId: user.id },
    data: { sharing: false },
  });

  const memberships = await prisma.lobbyMember.findMany({
    where: { userId: user.id },
    select: { lobbyId: true },
  });
  for (const m of memberships) {
    pushTo(lobbyChannel(m.lobbyId), "location:offline", { userId: user.id });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lobbyId = searchParams.get("lobbyId");

  if (!lobbyId) return NextResponse.json({ error: "Lobby шаардлагатай" }, { status: 400 });

  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
  });
  if (!member) return NextResponse.json({ error: "Гишүүн биш байна" }, { status: 403 });

  // ── FOG OF WAR CHECK ──
  // Current user must have visibleUntil > now() to see others
  const myLocation = await prisma.userLocation.findUnique({
    where: { userId: user.id },
  });

  const canSeeOthers = myLocation && myLocation.visibleUntil > new Date();

  if (!canSeeOthers) {
    return NextResponse.json({
      locations: [],
      fogOfWar: true,
      message: "Complete a quest and get approved to reveal the map for 1 hour",
    });
  }

  // Get lobby members' locations (only those who are sharing AND also have fog cleared)
  const members = await prisma.lobbyMember.findMany({
    where: { lobbyId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          equippedFrameValue: true,
          locations: {
            where: { sharing: true },
            take: 1,
          },
        },
      },
    },
  });

  const now = new Date();
  const locations = members
    .filter((m) => m.user.locations.length > 0 && m.user.locations[0].visibleUntil > now)
    .map((m) => ({
      userId: m.user.id,
      username: m.user.username,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      equippedFrameValue: m.user.equippedFrameValue,
      latitude: m.user.locations[0].latitude,
      longitude: m.user.locations[0].longitude,
      accuracy: m.user.locations[0].accuracy ?? null,
      updatedAt: m.user.locations[0].updatedAt.toISOString(),
    }));

  return NextResponse.json({
    locations,
    fogOfWar: false,
    visibleUntil: myLocation.visibleUntil,
  });
}
