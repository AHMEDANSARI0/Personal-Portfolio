import { prisma } from "@/lib/db";
import { bad, ok, readJson, requireAdmin } from "@/lib/api";
import { revalidateSite } from "@/lib/queries";
import { projectSchema, slugify } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  const row = await prisma.project.findUnique({ where: { id: Number(id) } });
  return row ? ok(row) : bad("Not found", 404);
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;

  const parsed = projectSchema.safeParse(await readJson(req));
  if (!parsed.success) return bad("Validation failed", 422, parsed.error.flatten().fieldErrors);

  const data = { ...parsed.data };
  if (!data.slug) data.slug = slugify(data.title);

  try {
    const row = await prisma.project.update({ where: { id: Number(id) }, data });
    revalidateSite();
    return ok(row);
  } catch {
    return bad("Project not found or slug conflict", 404);
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await ctx.params;
  try {
    await prisma.project.delete({ where: { id: Number(id) } });
    revalidateSite();
    return ok({ deleted: true });
  } catch {
    return bad("Project not found", 404);
  }
}
