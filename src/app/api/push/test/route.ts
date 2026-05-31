import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

/**
 * Send a test push to the current user — used by the settings/permission UI
 * to confirm subscriptions reach the device.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Нэвтэрнэ үү" }, { status: 401 });

  await sendPushToUser(user.id, {
    title: "SideQuest",
    body: "Push notification амжилттай тохирлоо! 🎉",
    url: "/dashboard",
    type: "test",
  });

  return NextResponse.json({ ok: true });
}
