import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pf_admin";
const WEEK = 60 * 60 * 24 * 7;

function secretKey() {
  const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { sub: number; email: string };

export async function signSession(payload: SessionPayload) {
  const days = Number(process.env.JWT_TTL_DAYS || 7);
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days * 24 * 60 * 60}s`)
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return { sub: Number(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}

export async function sessionCookieOptions(maxAgeSeconds = WEEK) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Server-side guard used by every /api/admin/* route and /admin page. */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
