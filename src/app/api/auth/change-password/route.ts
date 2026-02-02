import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateSalt, hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const identifier = String(body?.identifier ?? "").trim();
  const currentPassword = String(body?.currentPassword ?? "");
  const newPassword = String(body?.newPassword ?? "");

  if (!identifier || !currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Missing identifier, currentPassword or newPassword" },
      { status: 400 },
    );
  }

  const query = supabaseAdmin
    .from("app_users")
    .select("id, username, email, password_salt, password_hash");

  const isEmail = identifier.includes("@");
  const { data, error } = isEmail
    ? await query.eq("email", identifier)
    : await query.eq("username", identifier);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = data[0];
  const expected = hashPassword(currentPassword, user.password_salt);
  if (expected !== user.password_hash) {
    return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
  }

  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);

  const { error: updateError } = await supabaseAdmin
    .from("app_users")
    .update({ password_salt: newSalt, password_hash: newHash })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
