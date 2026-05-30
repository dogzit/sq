import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { success } = rateLimitByIp(request, "register", { maxRequests: 3, windowMs: 60_000 });
    if (!success) return NextResponse.json({ error: "Хэт олон оролдлого. Түр хүлээнэ үү." }, { status: 429 });

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { email, username, displayName, password } = parsed.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.email === email ? "Имэйл эсвэл хэрэглэгчийн нэр бүртгэлтэй байна" : "Хэрэглэгчийн нэр бүртгэлтэй байна" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const code = generateCode();

    await prisma.pendingSignup.upsert({
      where: { email },
      update: {
        username,
        displayName,
        passwordHash,
        otpCode: code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
      create: {
        email,
        username,
        displayName,
        passwordHash,
        otpCode: code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    console.log(`[OTP] ${email} → ${code}`);
    sendOtpEmail(email, code).catch((err) =>
      console.error("Email илгээж чадсангүй:", err)
    );

    return NextResponse.json({ needsVerification: true, email });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Серверийн алдаа" }, { status: 500 });
  }
}
