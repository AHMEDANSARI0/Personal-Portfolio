/** Shared content types — the DB stores these as JSON in `SiteContent`. */

export interface HeroContent {
  /** Big display line. Default is an obvious placeholder, replace in /admin/content */
  name: string;
  tagline: string;
  /** Optional small eyebrow label above the name */
  kicker: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  /** Availability pill, e.g. "Available for freelance — Oct 2026" */
  status: string;
}

export interface AboutContent {
  heading: string;
  /** Plain-text paragraphs (one per line). Rendered as <p>. */
  bio: string[];
  location: string;
  experienceYears: string;
  portraitUrl: string | null;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface SkillsContent {
  heading: string;
  groups: SkillGroup[];
}

export interface ContactContent {
  heading: string;
  blurb: string;
  email: string;
  calendlyUrl: string;
  responseTime: string;
}

export interface SocialContent {
  linkedin: string;
  github: string;
  twitter: string;
  dribbble: string;
  whatsapp: string;
  resumeUrl: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  visible: boolean;
}

export interface NavigationContent {
  logoText: string;
  logoHref: string;
  items: NavigationItem[];
  showLinkedIn: boolean;
  contactLabel: string;
  contactHref: string;
  showContact: boolean;
  showOnMobile: boolean;
}

export type FooterTemplate = "stacked" | "split" | "columns" | "compact" | "editorial" | "band";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterContent {
  template: FooterTemplate;
  eyebrow: string;
  heading: string;
  description: string;
  copyright: string;
  newsletterEnabled: boolean;
  newsletterHeading: string;
  newsletterDescription: string;
  newsletterButtonLabel: string;
  newsletterSuccessMessage: string;
  links: FooterLink[];
  policyLinks: FooterLink[];
  showSocials: boolean;
}

export interface AvatarContent {
  /** URL of the .glb the hero renders. Default ships the generated placeholder. */
  modelUrl: string;
  /** Optional high-quality still shown on low-end devices / reduced motion */
  posterUrl: string;
  /** Normalise any model so drop-in swaps keep the same framing */
  height: number;
  yOffset: number;
  headBoneHints: string[];
}

export type ThemeMode = "light" | "dark";
export type HeroTemplate = "classic" | "ai-studio";

export interface HeroStudioSettings {
  backgroundStart: string;
  backgroundEnd: string;
  glowColor: string;
  glowIntensity: number;
  floatingEnabled: boolean;
  floatingSpeed: number;
  floatingDensity: number;
  robotScale: number;
  robotMotion: boolean;
  screenMode: "mixed" | "code" | "preview";
}

export interface ThemeContent {
  mode: ThemeMode;
  accent: string;
  template: HeroTemplate;
  heroStudio: HeroStudioSettings;
  /** CSS font pair key, see src/lib/fonts.ts */
  fonts: string;
  /** Render full 3D hero on phones/tablets (off = poster fallback) */
  hero3dOnMobile: boolean;
  /** Site-wide default OG image */
  ogImage: string;
  faviconUrl: string;
}

export interface SeoContent {
  titleSuffix: string;
  defaultTitle: string;
  defaultDescription: string;
  /** robots.txt toggle managed in /admin/seo */
  indexable: boolean;
}

export interface SiteContentMap {
  hero: HeroContent;
  about: AboutContent;
  skills: SkillsContent;
  contact: ContactContent;
  social: SocialContent;
  navigation: NavigationContent;
  footer: FooterContent;
  avatar: AvatarContent;
  theme: ThemeContent;
  seo: SeoContent;
}

export type ContentKey = keyof SiteContentMap;

export interface ProjectDTO {
  id: number;
  title: string;
  slug: string;
  summary: string;
  description: string | null;
  imageUrl: string | null;
  tags: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  featured: boolean;
  published: boolean;
  order: number;
  updatedAt: string;
}

export interface TestimonialDTO {
  id: number;
  name: string;
  role: string;
  quote: string;
  photoUrl: string | null;
  rating: number | null;
  approved: boolean;
  order: number;
}

export interface MessageDTO {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  body: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
}

export interface NewsletterSubscriberDTO {
  id: number;
  email: string;
  createdAt: string;
}

export interface SeoPageDTO {
  id: number;
  path: string;
  label: string;
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
  canonical: string | null;
  noindex: boolean;
  showInSitemap: boolean;
}
