import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-dev-only"
);

const publicPaths = [
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/offline",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/otp",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

// Static file extensions that should never go through proxy
const staticExtensions = /\.(png|jpg|jpeg|gif|svg|ico|webp|js|css|woff|woff2|ttf|json|xml|txt|webmanifest)$/i;

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files entirely
  if (staticExtensions.test(pathname)) {
    return NextResponse.next();
  }

  // Skip known static directories
  if (
    pathname.startsWith("/icons") ||
    pathname.startsWith("/screenshots") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Vercel Cron GET requests — let through, route checks CRON_SECRET
  if (pathname.startsWith("/api/cron/") && request.method === "GET") {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const headers = new Headers(request.headers);
    headers.set("x-user-id", payload.userId as string);
    headers.set("x-username", payload.username as string);
    return NextResponse.next({ request: { headers } });
  } catch {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
