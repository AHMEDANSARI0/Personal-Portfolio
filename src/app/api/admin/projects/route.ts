import { prisma } from "@/lib/db";
import { NextResponse, bad, ok, readJson, requireAdmin } from "@/lib/api";
import { revalidateSite } from "@/lib/queries";
import { projectSchema, slugify } from "@/lib/validation";

export const runtime = "nodejs";

/** GET (admin): everything including drafts. */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await prisma.project.findMany({ orderBy: [{ order: "asc" }, { id: "desc" }] });
  return NextResponse.json(rows);
}

/** POST: create. */
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = projectSchema.safeParse(await readJson(req));
  if (!parsed.success) return bad("Validation failed", 422, parsed.error.flatten().fieldErrors);

  const base = parsed.data.slug || slugify(parsed.data.title);
  let slug = base;
  for (let i = 2; await prisma.project.findUnique({ where: { slug } }); i++) slug = `${base}-${i}`;

  const created = await prisma.project.create({ data: { ...parsed.data, slug } });
  revalidateSite();
  return ok(created, 201);
}

/** PUT { ids: [...] }: persist drag-to-reorder (writes order = index). */
export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await readJson(req);
  const ids = Array.isArray(body.ids) ? (body.ids as number[]) : null;
  if (!ids?.length) return bad("ids[] required");

  // updateMany: rows that vanished mid-drag are skipped, not a 500
  await prisma.$transaction(
    ids.map((id, index) => prisma.project.updateMany({ where: { id }, data: { order: index } })),
  );
  revalidateSite();
  return ok({ reordered: ids.length });
}
