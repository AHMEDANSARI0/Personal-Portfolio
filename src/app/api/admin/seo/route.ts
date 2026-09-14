import { prisma } from "@/lib/db";
import { NextResponse, bad, ok, readJson, requireAdmin } from "@/lib/api";
import { getContent, upsertContent } from "@/lib/content";
import { revalidateSite } from "@/lib/queries";
import { seoGlobalSchema } from "@/lib/validation";
import { SEO_PAGES } from "@/lib/defaults";

export const runtime = "nodejs";

/** GET: global seo block + all per-page rows (rows auto-created on first read). */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const global = await getContent("seo");
  for (const page of SEO_PAGES) {
    await prisma.seoPage
      .upsert({
        where: { path: page.path },
        create: { path: page.path, label: page.label },
        update: { label: page.label },
      })
      .catch(() => null);
  }
  const pages = await prisma.seoPage.findMany({ orderBy: { path: "asc" } });
  return NextResponse.json({ global, pages });
}

/** PUT { global } : site-wide defaults + robots toggle. */
export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await readJson(req);
  const parsed = seoGlobalSchema.safeParse(body.global);
  if (!parsed.success) return bad("Validation failed", 422, parsed.error.flatten().fieldErrors);
  await upsertContent("seo", parsed.data);
  revalidateSite();
  return ok({ saved: true });
}
