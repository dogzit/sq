import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
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

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|screenshots|manifest\\.json|sw\\.js|apple-touch-icon\\.png|workbox-).*)"],
};
