import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rate-limit";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { success } = rateLimitByIp(request, "otp-send", { maxRequests: 3, windowMs: 60_000 });
    if (!success) return NextResponse.json({ error: "Хэт олон оролдлого. Түр хүлээнэ үү." }, { status: 429 });

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Имэйл шаардлагатай" }, { status: 400 });
    }

    const code = generateCode();

    // Case 1: Pending signup — update the OTP code
    const pending = await prisma.pendingSignup.findUnique({ where: { email } });
    if (pending) {
      await prisma.pendingSignup.update({
        where: { email },
        data: {
          otpCode: code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
      console.log(`[OTP] ${email} → ${code}`);
      try {
        await sendOtpEmail(email, code);
      } catch (emailErr) {
        console.error("Email илгээж чадсангүй:", emailErr);
      }
      return NextResponse.json({ sent: true });
    }

    // Case 2: Existing user (login re-verify)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email exists
      return NextResponse.json({ sent: true });
    }

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

    console.log(`[OTP] ${email} → ${code}`);
    try {
      await sendOtpEmail(email, code);
    } catch (emailErr) {
      console.error("Email илгээж чадсангүй:", emailErr);
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "Баталгаажуулах код илгээж чадсангүй" }, { status: 500 });
  }
}
