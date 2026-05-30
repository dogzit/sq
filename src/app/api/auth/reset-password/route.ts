import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { success } = rateLimitByIp(request, "reset-password", { maxRequests: 5, windowMs: 60_000 });
    if (!success) return NextResponse.json({ error: "Хэт олон оролдлого. Түр хүлээнэ үү." }, { status: 429 });

    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Имэйл, код, шинэ нууц үг шаардлагатай" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой" }, { status: 400 });
    }

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

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.otpCode.update({
        where: { id: otp.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, emailVerified: true },
      }),
    ]);

    // Auto-login after password reset
    const token = await createToken({ userId: user.id, username: user.username });
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Нууц үг солих амжилтгүй боллоо" }, { status: 500 });
  }
}
