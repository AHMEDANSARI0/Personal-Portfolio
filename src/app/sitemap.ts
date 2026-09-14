import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getAllContent } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const content = await getAllContent();
  if (!content.seo.indexable) return [{ url: base, changeFrequency: "yearly", priority: 0 }];

  let paths: { path: string; updatedAt: Date }[] = [];
  try {
    const [seoPages, projects] = await Promise.all([
      prisma.seoPage.findMany({ where: { showInSitemap: true } }),
      prisma.project.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    ]);
    paths = [
      ...seoPages.map((p) => ({ path: p.path, updatedAt: p.updatedAt })),
      ...projects.map((p) => ({ path: `/work/${p.slug}`, updatedAt: p.updatedAt })),
    ];
  } catch {
    paths = [{ path: "/", updatedAt: new Date() }];
  }

  return paths.map(({ path, updatedAt }) => ({
    url: base + (path === "/" ? "" : path),
    lastModified: updatedAt,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
