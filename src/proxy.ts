import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next 16 proxy (the renamed middleware). Guards only the /admin page tree —
 * API routes are protected by requireAdmin() in each handler, because reading
 * request state here on /api/* POSTs can interfere with body parsing in dev.
 * Signature verification happens twice: cheap edge check here, full session
 * check in the layout/routes (forged cookies never pass both).
 */
const enc = new TextEncoder();

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function verify(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [h, p, s] = parts;
  const secret = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${h}.${p}`));
  if (b64url(sig) !== s) return false;
  try {
    const payload = JSON.parse(atob(p.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  // page-guard only: non-GET requests pass through untouched (body must stay
  // readable for API route handlers in dev), and so does the login page itself
  if (!["GET", "HEAD"].includes(req.method)) return NextResponse.next();
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return NextResponse.next();

  const token = req.cookies.get("pf_admin")?.value;
  if (token && (await verify(token))) return NextResponse.next();

  void searchParams;
  const url = new URL("/admin/login", req.url);
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
