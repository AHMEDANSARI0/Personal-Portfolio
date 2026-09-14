import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/auth";
import { NextResponse, bad } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/** POST {email,password} → sets httpOnly JWT cookie. No public sign-up: single admin row. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.warn("[auth] body parse failed:", (e as Error).message);
    return bad("Invalid JSON body");
  }
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success)
    return bad("Invalid credentials payload", 400, parsed.error.issues.map((i) => i.path.join(".") + ": " + i.code));

  const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return bad("Invalid email or password", 401);

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return bad("Invalid email or password", 401);

  const token = await signSession({ sub: user.id, email: user.email });
  const res = NextResponse.json({ ok: true, email: user.email, name: user.name });
  res.cookies.set(SESSION_COOKIE, token, await sessionCookieOptions());
  return res;
}

export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
