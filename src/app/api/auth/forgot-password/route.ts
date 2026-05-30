import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rate-limit";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { success } = rateLimitByIp(request, "forgot-password", { maxRequests: 3, windowMs: 60_000 });
    if (!success) return NextResponse.json({ error: "Хэт олон оролдлого. Түр хүлээнэ үү." }, { status: 429 });

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Имэйл шаардлагатай" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Don't reveal whether email exists
    if (!user) {
      return NextResponse.json({ sent: true });
    }

    const code = generateCode();

    // Mark all previous unused codes as used
    await prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    await prisma.otpCode.create({
      data: {
        code,
        userId: user.id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendOtpEmail(email, code);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Сэргээх код илгээж чадсангүй" }, { status: 500 });
  }
}
