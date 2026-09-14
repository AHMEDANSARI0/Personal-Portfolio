import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { NextResponse, bad, ok, readJson, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(10, "Use 10+ characters"),
});

/** Rotate the single admin user's password. */
export async function POST(req: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  const parsed = Schema.safeParse(await readJson(req));
  if (!parsed.success) return bad("Validation failed", 422, parsed.error.flatten().fieldErrors);

  const user = await prisma.adminUser.findUnique({ where: { id: session!.sub } });
  if (!user) return bad("No admin user found", 404);
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return bad("Current password incorrect", 403);
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash } });
  return ok({ updated: true });
}
