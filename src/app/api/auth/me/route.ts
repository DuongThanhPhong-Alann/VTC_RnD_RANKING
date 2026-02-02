import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

const SESSION_COOKIE = "vtc_session";

export async function GET(request: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing AUTH_SECRET" },
      { status: 500 },
    );
  }

  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifySessionToken(token, secret);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: payload.sub,
      username: payload.username,
      name: payload.name,
    },
  });
}
