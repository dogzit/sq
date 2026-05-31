import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPusherServer } from "@/lib/pusher-server";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const pusher = getPusherServer();
  if (!pusher) {
    return NextResponse.json({ error: "Pusher not configured" }, { status: 500 });
  }

  const form = await req.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channel = String(form.get("channel_name") ?? "");
  if (!socketId || !channel) {
    return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });
  }

  // Authorize: user can subscribe to their own private-user-<id> channel,
  // and to private-match-<id> channels where they are host or guest.
  let allowed = false;
  if (channel === `private-user-${user.id}`) {
    allowed = true;
  } else if (channel.startsWith("private-match-")) {
    const matchId = channel.slice("private-match-".length);
    const m = await prisma.gameMatch.findUnique({
      where: { id: matchId },
      select: { hostId: true, guestId: true },
    });
    if (m && (m.hostId === user.id || m.guestId === user.id)) {
      allowed = true;
    }
  } else if (channel.startsWith("private-lobby-")) {
    const lobbyId = channel.slice("private-lobby-".length);
    const member = await prisma.lobbyMember.findUnique({
      where: { userId_lobbyId: { userId: user.id, lobbyId } },
      select: { id: true },
    });
    if (member) allowed = true;
  }

  if (!allowed) return NextResponse.json({ error: "Эрх алга" }, { status: 403 });

  const authResponse = pusher.authorizeChannel(socketId, channel);
  return NextResponse.json(authResponse);
}
