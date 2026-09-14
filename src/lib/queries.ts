import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "./db";

export const SITE_TAG = "site";

const cached = <T extends (...args: never[]) => Promise<unknown>>(name: string, fn: T) =>
  unstable_cache(fn as never, [name], { tags: [SITE_TAG], revalidate: 300 }) as unknown as T;

/** Public read: published projects, ordered. */
export const getPublishedProjects = cached("projects", async () => {
  try {
    const rows = await prisma.project.findMany({
      where: { published: true },
      orderBy: [{ order: "asc" }, { id: "desc" }],
    });
    return rows;
  } catch {
    return [];
  }
});

/** Public read: approved testimonials, ordered. */
export const getApprovedTestimonials = cached("testimonials", async () => {
  try {
    const rows = await prisma.testimonial.findMany({
      where: { approved: true },
      orderBy: [{ order: "asc" }, { id: "desc" }],
    });
    return rows;
  } catch {
    return [];
  }
});

export const getSeoPage = cached("seo-page", async (path: string) => {
  try {
    return await prisma.seoPage.findUnique({ where: { path } });
  } catch {
    return null;
  }
});

/** Called after any admin mutation so the public site refreshes immediately. */
export function revalidateSite() {
  try {
    revalidateTag(SITE_TAG, "default");
  } catch {
    /* outside a request context (e.g. seed script) */
  }
}
