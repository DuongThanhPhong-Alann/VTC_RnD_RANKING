import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSessionToken } from "@/lib/session";
import { hashPassword } from "@/lib/password";

const SESSION_COOKIE = "vtc_session";
const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS ?? 7);
type AppUserRow = {
  id: string;
  username: string;
  email: string | null;
  password_salt: string;
  password_hash: string;
  full_name: string | null;
  status: string | null;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const identifier = String(body?.identifier ?? "").trim();
  const password = String(body?.password ?? "");

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Missing identifier or password" },
      { status: 400 },
    );
  }

  const query = supabaseAdmin
    .from("app_users")
    .select("id, username, email, password_salt, password_hash, full_name, status")
    .limit(1);

  const isEmail = identifier.includes("@");
  const { data, error } = isEmail
    ? await query.eq("email", identifier)
    : await query.eq("username", identifier);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = data[0] as AppUserRow;
  if (user.status && user.status !== "active") {
    return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
  }

  const expected = hashPassword(password, user.password_salt);
  if (expected !== user.password_hash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Missing AUTH_SECRET" },
      { status: 500 },
    );
  }

  const token = await createSessionToken(
    { sub: user.id, username: user.username, name: user.full_name },
    secret,
    SESSION_DAYS * 24 * 60 * 60,
  );

  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.full_name,
      email: user.email,
    },
  });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  return response;
}
