import type { Handler } from "@netlify/functions";
import crypto from "crypto";

function verify(token: string, secret: string): boolean {
  if (!token || typeof token !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payloadB64, sig] = parts;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const handler: Handler = async (event) => {
  try {
    const secret = process.env.PREMIUM_SECRET;
    if (!secret) {
      return { statusCode: 500, body: JSON.stringify({ ok: false }) };
    }

    const body = JSON.parse(event.body || "{}");
    const token = String(body.token || "").trim();

    const ok = verify(token, secret);
    return { statusCode: 200, body: JSON.stringify({ ok }) };
  } catch {
    return { statusCode: 200, body: JSON.stringify({ ok: false }) };
  }
};
