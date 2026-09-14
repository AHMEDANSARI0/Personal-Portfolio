import { prisma } from "@/lib/db";
import { bad, ok, readJson, requireAdmin } from "@/lib/api";
import { revalidateSite } from "@/lib/queries";
import { seoPageSchema } from "@/lib/validation";

export const runtime = "nodejs";

/** PUT: per-page meta (title/description/OG/canonical/noindex/sitemap). */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;

  const parsed = seoPageSchema.safeParse(await readJson(req));
  if (!parsed.success) return bad("Validation failed", 422, parsed.error.flatten().fieldErrors);

  try {
    const row = await prisma.seoPage.update({ where: { id: Number(id) }, data: parsed.data });
    revalidateSite();
    return ok(row);
  } catch {
    return bad("Page not found", 404);
  }
}
