import { NextResponse } from "next/server";

const SESSION_COOKIE = "vtc_session";
const COOKIE_SECURE =
  process.env.AUTH_COOKIE_SECURE != null
    ? process.env.AUTH_COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: COOKIE_SECURE,
    path: "/",
    maxAge: 0,
  });
  return response;
}
