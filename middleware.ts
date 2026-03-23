import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

const SESSION_COOKIE = "vtc_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLogin = pathname.startsWith("/login");
  if (
    pathname.startsWith("/account") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/game-images") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|gif)$/)
  ) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (isLogin) {
    if (!secret || !token) {
      return NextResponse.next();
    }
    const payload = await verifySessionToken(token, secret);
    if (!payload) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!secret) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const payload = await verifySessionToken(token, secret);
  if (!payload) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
