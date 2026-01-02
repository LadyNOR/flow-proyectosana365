import type { Handler } from "@netlify/functions";
import crypto from "crypto";

function b64url(input: string) {
  return Buffer.from(input).toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(input: string) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return Buffer.from(input, "base64").toString("utf8");
}

function sign(payload: any, secret: string) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${data}.${signature}`;
}

function verify(token: string, secret: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "bad_format" };

  const [header, body, sig] = parts;
  const data = `${header}.${body}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (expected !== sig) return { ok: false, reason: "bad_signature" };

  const payload = JSON.parse(b64urlDecode(body));
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && now > payload.exp) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}

export const handler: Handler = async (event) => {
  try {
    const secret = process.env.PREMIUM_SECRET || "";
    const rawCodes = process.env.PREMIUM_CODES || "";

    if (!secret || !rawCodes) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Missing env vars" }),
      };
    }

    const codes = rawCodes
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const body = event.body ? JSON.parse(event.body) : {};
    const code = (body.code || "").trim();
    const token = (body.token || "").trim();

    // 1) Verificar token (cuando la app abre)
    if (token) {
      const v = verify(token, secret);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: v.ok, reason: v.ok ? undefined : v.reason }),
      };
    }

    // 2) Validar código (cuando usuario activa Premium)
    if (!code) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Missing code" }),
      };
    }

    const isValid = codes.includes(code);
    if (!isValid) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false }),
      };
    }

    // Token válido por 365 días (ajústalo si deseas)
    const now = Math.floor(Date.now() / 1000);
    const payload = { premium: true, iat: now, exp: now + 365 * 24 * 60 * 60 };

    const newToken = sign(payload, secret);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, token: newToken }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: e?.message || "Server error" }),
    };
  }
};
