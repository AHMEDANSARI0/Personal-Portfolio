import { prisma } from "@/lib/db";
import { NextResponse, bad, ok, readJson, requireAdmin } from "@/lib/api";
import { revalidateSite } from "@/lib/queries";
import { testimonialSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await prisma.testimonial.findMany({ orderBy: [{ order: "asc" }, { id: "desc" }] });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const parsed = testimonialSchema.safeParse(await readJson(req));
  if (!parsed.success) return bad("Validation failed", 422, parsed.error.flatten().fieldErrors);
  const created = await prisma.testimonial.create({ data: parsed.data });
  revalidateSite();
  return ok(created, 201);
}

/** PUT { ids }: reorder */
export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await readJson(req);
  const ids = Array.isArray(body.ids) ? (body.ids as number[]) : null;
  if (!ids?.length) return bad("ids[] required");
  await prisma.$transaction(
    ids.map((id, index) => prisma.testimonial.updateMany({ where: { id }, data: { order: index } })),
  );
  revalidateSite();
  return ok({ reordered: ids.length });
}
