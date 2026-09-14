import { z } from "zod";
import { prisma } from "@/lib/db";
import { bad, NextResponse } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email().max(160) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Please enter a valid email", 422);

  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    create: { email: parsed.data.email.toLowerCase() },
    update: {},
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}