import { z } from "zod";

/** Shared validation for public + admin routes. */

export const heroSchema = z.object({
  name: z.string().max(80),
  tagline: z.string().max(200),
  kicker: z.string().max(60),
  ctaLabel: z.string().max(40),
  ctaHref: z.string().max(200),
  secondaryLabel: z.string().max(40),
  secondaryHref: z.string().max(200),
  status: z.string().max(80),
});

export const aboutSchema = z.object({
  heading: z.string().max(60),
  bio: z.array(z.string().max(600)).max(8),
  location: z.string().max(80),
  experienceYears: z.string().max(10),
  portraitUrl: z.string().max(400).nullable(),
});

export const skillsSchema = z.object({
  heading: z.string().max(60),
  groups: z
    .array(
      z.object({
        label: z.string().max(40),
        items: z.array(z.string().max(40)).max(12),
      }),
    )
    .max(8),
});

export const contactSchema = z.object({
  heading: z.string().max(60),
  blurb: z.string().max(400),
  email: z.string().email(),
  calendlyUrl: z.string().max(300),
  responseTime: z.string().max(60),
});

export const socialSchema = z.object({
  linkedin: z.string().max(300),
  github: z.string().max(300),
  twitter: z.string().max(300),
  dribbble: z.string().max(300),
  whatsapp: z.string().max(300),
  resumeUrl: z.string().max(400),
});

const footerLinkSchema = z.object({
  label: z.string().min(1).max(50),
  href: z.string().min(1).max(400),
});

export const footerSchema = z.object({
  template: z.enum(["stacked", "split", "columns", "compact", "editorial", "band"]),
  eyebrow: z.string().max(80),
  heading: z.string().max(140),
  description: z.string().max(500),
  copyright: z.string().max(160),
  newsletterEnabled: z.boolean(),
  newsletterHeading: z.string().max(100),
  newsletterDescription: z.string().max(240),
  newsletterButtonLabel: z.string().max(40),
  newsletterSuccessMessage: z.string().max(120),
  links: z.array(footerLinkSchema).max(12),
  policyLinks: z.array(footerLinkSchema).max(8),
  showSocials: z.boolean(),
});

export const avatarSchema = z.object({
  modelUrl: z.string().min(1).max(400),
  posterUrl: z.string().max(400),
  height: z.coerce.number().min(0.4).max(8),
  yOffset: z.coerce.number().min(-4).max(2),
  headBoneHints: z.array(z.string().max(40)).max(10),
});

export const themeSchema = z.object({
  mode: z.enum(["light", "dark"]),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  fonts: z.string().max(30),
  hero3dOnMobile: z.boolean(),
  ogImage: z.string().max(400),
  faviconUrl: z.string().max(400),
});

export const seoGlobalSchema = z.object({
  titleSuffix: z.string().max(40),
  defaultTitle: z.string().max(120),
  defaultDescription: z.string().max(240),
  indexable: z.boolean(),
});

export const projectSchema = z.object({
  title: z.string().min(2).max(120),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(140)
    .optional(),
  summary: z.string().max(400).default(""),
  description: z.string().max(4000).nullish(),
  imageUrl: z.string().max(400).nullish(),
  tags: z.array(z.string().max(30)).max(12).default([]),
  liveUrl: z.string().max(400).nullish(),
  githubUrl: z.string().max(400).nullish(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(999).default(0),
});

export const testimonialSchema = z.object({
  name: z.string().min(2).max(80),
  role: z.string().max(120).default(""),
  quote: z.string().min(10).max(1200),
  photoUrl: z.string().max(400).nullish(),
  rating: z.coerce.number().int().min(0).max(5).nullish(),
  approved: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(999).default(0),
});

export const seoPageSchema = z.object({
  title: z.string().max(120).nullish(),
  description: z.string().max(240).nullish(),
  ogImageUrl: z.string().max(400).nullish(),
  canonical: z.string().max(400).nullish(),
  noindex: z.boolean().default(false),
  showInSitemap: z.boolean().default(true),
});

export const messageStatusSchema = z.enum(["new", "read", "replied", "archived"]);

export const contentKeySchema = z.enum([
  "hero",
  "about",
  "skills",
  "contact",
  "social",
  "footer",
  "avatar",
  "theme",
  "seo",
]);

export const CONTENT_SCHEMAS = {
  hero: heroSchema,
  about: aboutSchema,
  skills: skillsSchema,
  contact: contactSchema,
  social: socialSchema,
  footer: footerSchema,
  avatar: avatarSchema,
  theme: themeSchema,
  seo: seoGlobalSchema,
} as const;

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
