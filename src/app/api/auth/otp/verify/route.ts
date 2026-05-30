import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { success } = rateLimitByIp(request, "otp-verify", { maxRequests: 5, windowMs: 60_000 });
    if (!success) return NextResponse.json({ error: "Хэт олон оролдлого. Түр хүлээнэ үү." }, { status: 429 });

    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Имэйл болон код шаардлагатай" }, { status: 400 });
    }

    // Case 1: New signup — check PendingSignup
    const pending = await prisma.pendingSignup.findUnique({ where: { email } });

    if (pending) {
      if (pending.otpCode !== code) {
        return NextResponse.json({ error: "Код буруу байна" }, { status: 401 });
      }
      if (pending.expiresAt < new Date()) {
        return NextResponse.json({ error: "Кодны хугацаа дууссан" }, { status: 401 });
      }

      // Double-check uniqueness before creating
      const conflict = await prisma.user.findFirst({
        where: { OR: [{ email }, { username: pending.username }] },
      });
      if (conflict) {
        await prisma.pendingSignup.delete({ where: { id: pending.id } });
        return NextResponse.json({ error: "Имэйл эсвэл хэрэглэгчийн нэр бүртгэлтэй байна" }, { status: 409 });
      }

      // Create user + delete pending in one transaction
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: pending.email,
            username: pending.username,
            displayName: pending.displayName,
            passwordHash: pending.passwordHash,
            emailVerified: true,
          },
        });
        await tx.pendingSignup.delete({ where: { id: pending.id } });
        return newUser;
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
        verified: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
        },
      });
    }

    // Case 2: Existing user re-verifying (login flow)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Код буруу байна" }, { status: 401 });
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "Код буруу эсвэл хугацаа дууссан" }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.otpCode.update({
        where: { id: otp.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, lastActiveAt: new Date() },
      }),
    ]);

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
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Баталгаажуулалт амжилтгүй боллоо" }, { status: 500 });
  }
}
