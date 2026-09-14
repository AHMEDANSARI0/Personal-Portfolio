# Build order — status

| # | Deliverable (from brief §7) | Status |
|---|------------------------------|--------|
| 1 | Project scaffold (Next 16 + React 19 + TS + Tailwind 4), routing, folder structure | ✅ done |
| 2 | Static sections (About, Skills, Projects, Testimonials, Contact) + GSAP ScrollTrigger reveals | ✅ done — DB-driven already, placeholder copy marked `[PLACEHOLDER]` |
| 3 | 3D hero: R3F canvas, preloader with real progress, perf tuning (DPR cap 2, frameloop pause, mobile poster) | ✅ done — placeholder GLB pipeline proven (`pnpm avatar:placeholder`) |
| 4 | Backend + schema (Prisma/Postgres: admin-user, site-content, projects, testimonials, seo, messages) | ✅ done + migrated + seeded, verified against a live Postgres 17 |
| 5 | Admin panel: auth, then content → projects → testimonials → theme/3D → SEO → messages → security | ✅ all managers live |
| 6 | Public site pulls from DB (not hardcoded), with defaults as fallback | ✅ done, incl. instant revalidation on save |
| 7 | SEO pass: meta per page, OG + previews, robots toggle, sitemap auto-gen, Person/WebSite/CreativeWork JSON-LD | ✅ done |
| 8 | Perf + a11y audit (Lighthouse, keyboard nav, alt text) | ⬜ run locally — `pnpm build` is clean and the smoke suite (50 checks) passes; Lighthouse needs your browser |

## Deliberate deviations / decisions
- Next.js fullstack (you picked it) instead of Vite + separate Express: `src/app/api/*` *is* the Express layer, Prisma unchanged.
- Uploads live in repo-root `/uploads` (not `/public`) served by a route handler — `output: "standalone"` snapshots `/public` at build time, so runtime uploads must be streamed. Cloudinary auto-engages when `CLOUDINARY_URL` is set.
- Fonts: system/Google link pairs switchable in /admin/theme (max 2 families). Swap to `next/font` for full self-hosting when you pick your final pair.
- Admin password is bcrypt cost 12, JWT (jose) in httpOnly SameSite=Lax cookie; middleware verifies the signature at the edge, `requireAdmin()` verifies again per mutation.
- JWTs are stateless: logout clears the cookie but an already-issued token lives until expiry (7d). Want instant revocation? Add `tokenVersion Int` to AdminUser and put it in the JWT.
