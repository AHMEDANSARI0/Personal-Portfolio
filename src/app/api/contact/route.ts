import { z } from "zod";
import { prisma } from "@/lib/db";
import { NextResponse, bad } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  subject: z.string().max(140).optional().or(z.literal("")),
  message: z.string().min(10).max(4000),
  company_website: z.string().max(400).optional(), // honeypot: real humans leave it empty (any length = bot)
});

/** Public contact submission → messages table (+ optional email notify). Rate-limited-ish per IP. */
const recent = new Map<string, number[]>();
const LIMIT = Number(process.env.CONTACT_RATE_LIMIT_PER_MIN ?? 4);
function rateLimited(ip: string) {
  if (!Number.isFinite(LIMIT) || LIMIT <= 0) return false; // 0 disables (tests/CI)
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > LIMIT;
}

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    console.warn("[contact] validation:", JSON.stringify(parsed.error.issues));
    return bad("Please fill every field correctly", 422);
  }
  if (parsed.data.company_website) return NextResponse.json({ ok: true }); // silently swallow bots

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return bad("Too many messages — try again in a minute", 429);

  await prisma.message.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      body: parsed.data.message,
    },
  });

  // best-effort email notify — never fail the request because SMTP is down
  if (process.env.EMAIL_SERVER && process.env.EMAIL_TO) {
    try {
      const { createTransport } = await import("nodemailer");
      const t = createTransport({
        url: `smtp://${process.env.EMAIL_USER}:${process.env.EMAIL_PASS}@${process.env.EMAIL_SERVER}`,
      });
      await t.sendMail({
        from: `${process.env.EMAIL_USER}`,
        to: process.env.EMAIL_TO,
        replyTo: parsed.data.email,
        subject: `Portfolio: ${parsed.data.subject || parsed.data.name}`,
        text: `${parsed.data.name} <${parsed.data.email}>\n\n${parsed.data.message}`,
      });
    } catch (e) {
      console.warn("[contact] email notify failed:", (e as Error).message);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
