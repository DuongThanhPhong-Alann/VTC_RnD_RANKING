import "server-only";
import crypto from "node:crypto";

export function hashPassword(password: string, salt: string) {
  return crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("hex");
}

export function generateSalt(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}
