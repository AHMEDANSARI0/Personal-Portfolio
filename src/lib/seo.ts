import type { Metadata } from "next";
import { DEFAULTS } from "./defaults";
import type { SeoContent, SiteContentMap } from "./types";

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function abs(url: string | null | undefined) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${siteUrl()}${url}`;
}

function titleWithSuffix(title: string, seo: SeoContent) {
  if (!title) return seo.defaultTitle;
  return `${title.replace(/\s+—\s+\[Your Name\]$/, "")} ${seo.titleSuffix}`.trim();
}

/** Per-path overrides saved in /admin/seo, merged over site-wide defaults. */
export function buildMetadata(
  content: SiteContentMap,
  opts: {
    path: string;
    label: string;
    page?: {
      title: string | null;
      description: string | null;
      ogImageUrl: string | null;
      canonical: string | null;
      noindex: boolean;
    } | null;
  },
): Metadata {
  const seo = content.seo;
  const fallback = {
    title:
      opts.path === "/"
        ? content.seo.defaultTitle
        : titleWithSuffix(opts.label, seo),
    description: seo.defaultDescription,
    ogImage: content.theme.ogImage,
  };
  const title = opts.page?.title || (opts.path === "/" ? seo.defaultTitle : titleWithSuffix(opts.label, seo));
  const description = opts.page?.description || fallback.description;
  const og = abs(opts.page?.ogImageUrl || fallback.ogImage);
  const indexable = seo.indexable && !opts.page?.noindex;

  return {
    title,
    description,
    ...(opts.page?.canonical
      ? { alternates: { canonical: opts.page.canonical } }
      : { alternates: { canonical: siteUrl() + (opts.path === "/" ? "" : opts.path) } }),
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      url: siteUrl() + (opts.path === "/" ? "" : opts.path),
      title,
      description,
      siteName: content.hero.name === DEFAULTS.hero.name ? "Portfolio" : content.hero.name,
      ...(og ? { images: [{ url: og, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: og ? "summary_large_image" : "summary",
      title,
      description,
      ...(og ? { images: [og] } : {}),
    },
    icons: content.theme.faviconUrl
      ? { icon: content.theme.faviconUrl }
      : undefined,
  };
}

export function personJsonLd(content: SiteContentMap) {
  const isPlaceholder = content.hero.name.startsWith("[");
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: isPlaceholder ? content.seo.defaultTitle : content.hero.name,
    ...(content.hero.tagline && !content.hero.tagline.startsWith("[") ? { jobTitle: content.hero.tagline } : {}),
    description: content.seo.defaultDescription,
    url: siteUrl(),
    image: abs(content.theme.ogImage),
    address: {
      "@type": "PostalAddress",
      addressLocality: content.about.location.startsWith("[") ? undefined : content.about.location,
    },
    sameAs: [content.social.linkedin, content.social.github, content.social.twitter, content.social.dribbble]
      .filter((u) => u && !u.includes("[your-handle]")),
    knowsAbout: content.skills.groups.flatMap((g) => g.items).slice(0, 12),
  };
}

export function websiteJsonLd(content: SiteContentMap) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: content.seo.defaultTitle,
    url: siteUrl(),
  };
}
