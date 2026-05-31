import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;
  const p256dh: string | undefined = body?.keys?.p256dh;
  const auth: string | undefined = body?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Буруу subscription" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") || null;

  // Upsert by endpoint — endpoint is globally unique per browser/device
  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth, userAgent, userId: user.id },
    update: { p256dh, auth, userAgent, userId: user.id, lastUsed: new Date() },
  });

  return NextResponse.json({ ok: true, id: sub.id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const endpoint: string | undefined = body?.endpoint;
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint шаардлагатай" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}
