import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";
import { cookies } from "next/headers";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { success } = rateLimitByIp(request, "login", { maxRequests: 5, windowMs: 60_000 });
    if (!success) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // If email not verified, send OTP and require verification
    if (!user.emailVerified) {
      const code = generateCode();
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

      return NextResponse.json({
        needsVerification: true,
        email: user.email,
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = await createToken({ userId: user.id, username: user.username });
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
