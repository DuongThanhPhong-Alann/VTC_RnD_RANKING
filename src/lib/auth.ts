import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/session";

const SESSION_COOKIE = "vtc_session";

export async function getServerSession() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token, secret);
}
