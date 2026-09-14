/** Thin page-level helpers: content + per-path SEO meta in one cached call. */
import type { Metadata } from "next";
import { getAllContent } from "./content";
import { getSeoPage } from "./queries";
import { buildMetadata as build } from "./seo";

export async function pageMeta(path: string, label: string): Promise<Metadata> {
  const [content, page] = await Promise.all([getAllContent(), getSeoPage(path)]);
  return build(content, {
    path,
    label,
    page: page
      ? {
          title: page.title,
          description: page.description,
          ogImageUrl: page.ogImageUrl,
          canonical: page.canonical,
          noindex: page.noindex,
        }
      : null,
  });
}

export { getAllContent, getSeoPage };
