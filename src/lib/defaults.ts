import type { SiteContentMap } from "./types";

/**
 * Every default below is a clearly-marked placeholder — nothing here should ship
 * as "final copy". Edit in /admin/content (saved to DB) or change this file
 * and re-seed (`pnpm db:seed`).
 */
export const DEFAULTS: SiteContentMap = {
  hero: {
    name: "[Your Name]",
    tagline: "[ROLE — e.g. Creative Developer · React / Three.js / Motion]",
    kicker: "[PORTFOLIO 2026]",
    ctaLabel: "View work",
    ctaHref: "#work",
    secondaryLabel: "Get in touch",
    secondaryHref: "#contact",
    status: "[STATUS — e.g. Available for select projects]",
  },
  about: {
    heading: "About",
    bio: [
      "[PLACEHOLDER] One or two sentences about you: what you build, for whom, and what you care about. Example: “I build fast, tactile interfaces for early-stage teams — most recently a 3D product configurator that shipped to 40k users.”",
      "[PLACEHOLDER] Second paragraph: background, current focus, one human detail. Keep it 60–110 words total for a minimal site.",
    ],
    location: "[CITY, COUNTRY]",
    experienceYears: "[X]",
    portraitUrl: null,
  },
  skills: {
    heading: "Skills & Tools",
    groups: [
      { label: "Frontend", items: ["React", "TypeScript", "Next.js", "Tailwind CSS"] },
      { label: "3D / Motion", items: ["Three.js", "React Three Fiber", "GSAP", "Blender"] },
      { label: "Backend", items: ["Node.js", "PostgreSQL", "Prisma", "REST APIs"] },
      { label: "Tooling", items: ["Vite", "Git", "Figma", "Playwright"] },
    ],
  },
  contact: {
    heading: "Contact",
    blurb: "[PLACEHOLDER] Short line inviting people to reach out — what you say yes to, and how fast you reply.",
    email: "hello@example.com",
    calendlyUrl: "",
    responseTime: "[e.g. within 24h]",
  },
  social: {
    linkedin: "https://linkedin.com/in/[your-handle]",
    github: "https://github.com/[your-handle]",
    twitter: "",
    dribbble: "",
    whatsapp: "",
    resumeUrl: "",
  },
  footer: {
    template: "split",
    eyebrow: "Stay in the loop",
    heading: "Thoughts, work, and useful links.",
    description: "A small, occasional note about what I am building and learning.",
    copyright: "All rights reserved.",
    newsletterEnabled: true,
    newsletterHeading: "Get the occasional update",
    newsletterDescription: "No noise. Just new work, useful ideas, and a note when something ships.",
    newsletterButtonLabel: "Subscribe",
    newsletterSuccessMessage: "You are on the list. Thanks.",
    links: [
      { label: "About", href: "/about" },
      { label: "Work", href: "/work" },
      { label: "Contact", href: "/contact" },
    ],
    policyLinks: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
    showSocials: true,
  },
  avatar: {
    modelUrl: "/uploads/model/avatar.glb",
    posterUrl: "/uploads/image/hero-poster.jpg",
    height: 1.9,
    yOffset: -0.75,
    headBoneHints: ["Head", "head", "head_01", "Bone_head"],
  },
  theme: {
    mode: "dark",
    accent: "#5B8CFF",
    fonts: "grotesk",
    hero3dOnMobile: false,
    ogImage: "/uploads/image/og-default.png",
    faviconUrl: "",
  },
  seo: {
    titleSuffix: "— [Your Name]",
    defaultTitle: "[Your Name] — [Role]",
    defaultDescription: "[PLACEHOLDER] 150–160 chars: who you are, what you build, and why someone should hire you.",
    indexable: true,
  },
};

export const SEO_PAGES = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/work", label: "Work / Projects" },
  { path: "/contact", label: "Contact" },
] as const;
