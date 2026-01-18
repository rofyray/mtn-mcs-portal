import crypto from "crypto";

export function generateOtpCode(): string {
  const code = crypto.randomInt(0, 1000000);
  return code.toString().padStart(6, "0");
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
