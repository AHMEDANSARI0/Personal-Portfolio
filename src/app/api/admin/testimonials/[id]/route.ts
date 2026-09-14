import { prisma } from "@/lib/db";
import { bad, ok, readJson, requireAdmin } from "@/lib/api";
import { revalidateSite } from "@/lib/queries";
import { testimonialSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;

  const parsed = testimonialSchema.safeParse(await readJson(req));
  if (!parsed.success) return bad("Validation failed", 422, parsed.error.flatten().fieldErrors);

  try {
    const row = await prisma.testimonial.update({ where: { id: Number(id) }, data: parsed.data });
    revalidateSite();
    return ok(row);
  } catch {
    return bad("Testimonial not found", 404);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  try {
    await prisma.testimonial.delete({ where: { id: Number(id) } });
    revalidateSite();
    return ok({ deleted: true });
  } catch {
    return bad("Testimonial not found", 404);
  }
}
