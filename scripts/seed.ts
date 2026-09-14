/**
 * Seed: single admin user + placeholder content + demo project/testimonial rows.
 * Rerun-safe (upserts). Everything written here is obviously fake on purpose —
 * replace via /admin, not by editing this file.
 *
 *   pnpm db:seed
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm db:seed   (first run: set real creds)
 */
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { DEFAULTS } from "../src/lib/defaults";

/**
 * Load .env.local then .env (repo-root). Next.js does this for the server, but
 * standalone scripts (seed, password reset) need it themselves. .env.local
 * wins, matching Next's precedence.
 */
function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const v = m[2].replace(/^["']|["']$/g, "");
      if (v) process.env[m[1]] ??= v;
    }
  }
}
loadEnvFiles();

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "dev-password-123";

async function main() {
  // 1. admin user (skip if it already exists — never overwrite a real hash by seeding)
  const existing = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!existing) {
    await prisma.adminUser.create({
      data: { email: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), name: "Site Admin" },
    });
    console.log(`✓ admin user created: ${ADMIN_EMAIL} (password from ADMIN_PASSWORD env — change it in /admin/security!)`);
  } else {
    console.log(`• admin user already exists: ${ADMIN_EMAIL} — left untouched`);
  }

  // 2. content groups (create only; admin edits win)
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await prisma.siteContent.upsert({ where: { key }, create: { key, value }, update: {} });
  }
  console.log(`• content groups seeded: ${Object.keys(DEFAULTS).join(", ")}`);

  // 3. SEO pages
  for (const page of DEFAULTS_SEO_PAGES) {
    await prisma.seoPage.upsert({
      where: { path: page.path },
      create: { path: page.path, label: page.label },
      update: {},
    });
  }

  // 4. demo rows — clearly marked placeholders, so nothing fakes being real content
  const projectCount = await prisma.project.count();
  if (projectCount === 0) {
    await prisma.project.createMany({
      data: [
        {
          title: "[PLACEHOLDER] First project",
          slug: "placeholder-first-project",
          summary: "[PLACEHOLDER] One or two lines on what you built and the outcome. Replace or delete — never ship fake case studies.",
          tags: ["React", "Three.js", "PostgreSQL"],
          order: 0,
        },
      ],
    });
    console.log("• 1 placeholder project row (delete/replace in /admin/projects)");
  }

  const tCount = await prisma.testimonial.count();
  if (tCount === 0) {
    await prisma.testimonial.create({
      data: {
        name: "[PLACEHOLDER — do not ship]",
        role: "unapproved demo row",
        quote: "[PLACEHOLDER] Real quotes only. This row is left unapproved so it never renders publicly.",
        approved: false,
        order: 0,
        rating: 5,
      },
    });
    console.log("• 1 unapproved placeholder testimonial (safe: never renders publicly)");
  }

  console.log("\nSeed done. Next: pnpm dev → open / and /admin (login: the email/password above).");
}

const DEFAULTS_SEO_PAGES = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/work", label: "Work / Projects" },
  { path: "/contact", label: "Contact" },
];

main()
  .catch((e) => {
    console.error("Seed failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
