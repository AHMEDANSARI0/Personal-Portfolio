import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

export const revalidate = 300;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await getContent("seo");
  return {
    rules: seo.indexable
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
