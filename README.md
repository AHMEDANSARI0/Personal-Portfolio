# 3D Portfolio + Admin — Next.js fullstack scaffold

Minimal, typography-led portfolio with a **live 3D hero (R3F)** and a **private admin panel** that owns all content. Built exactly to the master brief (Next.js variant, per your choice).

**Status: verified end-to-end.** `tsc` clean · `next build` clean (18 routes, ISR 60 s) · **51/51 checks pass, repeated runs included, in `scripts/smoke.sh`** against a production standalone build running against a live PostgreSQL 17 (auth, CRUD, reorder, uploads incl. GLB budget rejection, contact→inbox, robots/sitemap, JSON-LD, revalidation-to-public-HTML).

---

## Quickstart

```bash
pnpm install
copy .env.example .env.local   # Windows (cp on mac/linux) — Next.js loads .env.local;
                             # scripts also read .env.local, and prisma CLI also reads .env —
                             # same values in both if you run raw prisma commands
# set DATABASE_URL, AUTH_SECRET (32+ chars), ADMIN_EMAIL, ADMIN_PASSWORD

# 1. Database (pick one)
pnpm db:up                    # Docker Postgres (recommended)
# node scripts/start-dev-db.mjs   # zero-Docker local Postgres (embedded-postgres)
# or point DATABASE_URL at Railway/Render/Neon

# 2. Schema + seed
pnpm db:migrate               # creates prisma/migrations + applies
pnpm db:seed                  # admin user + [PLACEHOLDER] content (rerun-safe)

# 3. Generated placeholder assets (already generated in this repo)
pnpm avatar:placeholder       # writes uploads/model/avatar.glb (22 KB low-poly bust)
pnpm assets:placeholder       # hero poster + OG image + favicon.svg

# 4. Run
pnpm dev                      # http://localhost:3000  (admin: /admin)
pnpm build && pnpm start      # prod standalone at .next/standalone
pnpm test:smoke               # the 51-check suite (against a running server)
```

Admin login: `ADMIN_EMAIL`/`ADMIN_PASSWORD` from `.env` (dev default `admin@example.com` / `dev-password-123` — **change it** at `/admin/security`).

---

## Stack

| Concern | Choice |
|---|---|
| App framework | **Next.js 16** (App Router) — pages + API routes in one deployable |
| 3D | three ^0.186 · @react-three/fiber 9 · @react-three/drei 10 |
| Scroll motion | GSAP + ScrollTrigger (transform/opacity only, `power2.out`, 26–28 px travel) |
| Styling | Tailwind v4 + CSS vars driven by DB theme |
| DB | **PostgreSQL via Prisma 6** (schema in `prisma/schema.prisma`) |
| Auth | bcryptjs (cost 12) + jose JWT in httpOnly SameSite=Lax cookie; no public sign-up |
| Uploads | Cloudinary if `CLOUDINARY_URL` set, else `/uploads/*` streamed by a route handler |

## Layout

```
prisma/schema.prisma        AdminUser · SiteContent · Project · Testimonial · SeoPage · Message
prisma/migrations/          20260911181754_init (applied + verified live)
src/
  proxy.ts                  edge guard for /admin pages (signature-verified at edge)
  app/
    layout.tsx              theme CSS vars from DB · JSON-LD Person/WebSite · fonts
    page.tsx                hero + about + skills + projects + testimonials + contact (ISR 60s)
    about · work · work/[slug] · contact
    admin/                  (panel)/ layout guard + dashboard/content/projects/testimonials/theme/seo/messages/security; login sits OUTSIDE the guarded group
    api/                    auth · content · projects(+[id]) · testimonials(+[id]) · seo(+[id]) · messages · avatar · upload · overview · password
      api/admin/*           auth · content · projects(+[id]) · testimonials(+[id]) · seo(+[id]) · messages · avatar · upload · overview · password
      api/contact           public form → DB + optional SMTP notify (+honeypot + per-IP rate limit, CONTACT_RATE_LIMIT_PER_MIN, 0 = off for CI)
      projects · testimonials public read APIs
    uploads/[...path]       runtime file streaming (works in standalone prod)
    sitemap.ts · robots.ts  DB-driven, robots toggle lives in /admin/seo
  components/
    hero.tsx                lazy Canvas · poster fallback · error boundary
    three/scene.tsx         DPR cap 2 · PerformanceMonitor · frameloop pause when offscreen
    three/avatar.tsx        GLTF+Draco loader · bbox normalisation · clips · cursor-follow
    preloader.tsx           real progress % + bar (no blank flash: server-rendered)
    reveal.tsx              GSAP ScrollTrigger helpers (will-change set → cleared)
    sections.tsx · contact-form.tsx
    admin/                  ui.tsx · glb-preview (orbit) · glb-canvas
  lib/                      content.ts (DB↔defaults) · queries.ts (unstable_cache + tags) · theme.ts · fonts.ts · storage.ts · seo.ts · auth.ts · validation.ts (zod)
scripts/                    seed · make-placeholder-avatar · make-placeholder-assets · start-dev-db · smoke.sh · postbuild-standalone
infra/docker-compose.yml    Postgres + web (VPS one-liner)
uploads/                    runtime storage (models, images) — gitignored except .gitkeep
```

---

## Your 3D avatar — the swap pipeline (proven, drop-in)

1. Get a `.glb` (Ready Player Me, or artist commission). If rigged with an **Idle** clip, it plays automatically; otherwise the scene adds float + breathing.
2. Either **drop it at `uploads/model/avatar.glb`** or **upload it in `/admin/theme`** — the admin route validates size (≤5 MB enforced), stores it, updates `avatar.modelUrl`, and the hero picks it up with **zero code changes**.
3. Anything is normalised: the loader computes the bounding box and scales the model to `height` (default 1.9) with a `yOffset` nudge — both editable in /admin/theme, nothing is hardcoded to a specific rig.
4. Head tracking uses your hint list (`Head`, `head`, `head_01`…) — add bone names from Blender if yours differ.
5. Keep the file lean: `pnpm avatar:optimize` (gltf-transform: Draco + WebP, 1–2 K textures). For Draco files, also copy the decoder to `public/draco/` (loader looks there first, so no CDN dependency).
6. Phones/reduced-motion get the **poster render** instead of WebGL — replaceable from /admin/theme. The 22 KB procedural bust you see today (`pnpm avatar:placeholder`) is the pipeline proof.

## Performance checklist (from brief §2 → where it lives)

| Requirement | Implementation |
|---|---|
| Preloader, real progress, no white flash | SSR'd overlay + `useProgress`-fed %/bar; 2.5 s worst-case release (`preloader.tsx`, `scene.tsx`) |
| ≤3–5 MB model | 413 response over 5.5 MB on upload; Draco path wired; `avatar:optimize` script |
| pixelRatio ≤ 2 | `Math.min(devicePixelRatio, 2)` + drei `PerformanceMonitor` step-down ladder |
| Efficient `useFrame` | damped pointer follow only; no React state per frame; contact shadows baked `frames={1}`; frameloop off when hero leaves viewport |
| `memo/useMemo/useCallback` | scene components memoised; loader effects keyed by URL only |
| No layout shift / transform-only | GSAP animates opacity/transform, `will-change` set before / cleared after; images have fixed aspect boxes |
| Code splitting | Canvas + drei + three behind `dynamic(() => …, { ssr:false })`; admin never loads it |
| Mobile fallback | capability screen (WebGL2 + size + pointer + deviceMemory) → static poster; force-3D toggle in admin |
| Lighthouse 90+ | `/` prerenders static with ISR 60 s (see build log `○ / 1m`); fonts are system-stack by default |

## Admin panel (brief §4)

- **Auth** — single user, bcrypt+JWT, httpOnly cookie, edge proxy + per-route `requireAdmin()`, forged token → 401 (verified).
- **Content** — hero, about (+portrait upload), skills (line format `Label: a, b, c`), contact, socials.
- **Theme & 3D** — mode (light/dark), accent (presets + picker + hex), font pair, mobile-3D toggle, OG image, favicon, **GLB upload with orbit-preview**, height/offset tuning. (You asked for everything editable here — done: palette, 3D, images, all copy.)
- **Projects** — full CRUD, image upload, tags, live/GitHub links, published/featured, **drag-to-reorder** (persisted order, verified).
- **Testimonials** — CRUD + approve/unapprove (only approved render publicly; seeded demo row is unapproved on purpose).
- **SEO** — per-page title/description/OG/canonical/noindex/sitemap flags + **live Google and OG card previews**; global defaults + robots toggle; sitemap/robots generated from DB (verified incl. project URLs).
- **Messages** — table with search/filter, open-to-read, mark replied/archive, reply-via-mailto; honeypot submissions accepted-then-swallowed (verified).
- **Dashboard** — counts + last-update + last-message; **Security** — password rotation with current-password check.

## SEO & structured data (brief §7.7)

Per-page meta from DB via `generateMetadata`; canonicals; `Person` + `WebSite` JSON-LD site-wide, `CreativeWork` per project page; `sitemap.xml` (public pages + published projects + admin-selected extras) and `robots.txt` (with indexable toggle) both DB-driven; OG images per page with 1200×630 previews in admin. Placeholder-safe: `[BRACKETED]` copy renders with a visible **PLACEHOLDER** chip instead of masquerading as real content.

## Deployment

**Option A — VPS/Railway/Render (recommended, matches the local-upload design):**
`infra/docker-compose.yml` runs Postgres + `Dockerfile` web container; mount named volumes on `/app/uploads` (see compose). Run `pnpm db:deploy` (migrations) at release, `pnpm db:seed` first time.

**Option B — Vercel (frontend+API) + Neon/Supabase:** set `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`. Vercel's FS is ephemeral → set `CLOUDINARY_URL` (images) or an S3-compatible bucket for uploads; GLB hosting in that case: any CDN URL works in `avatar.modelUrl`. Note: `output:"standalone"` is for Docker/VPS; Vercel ignores it (still builds fine).

## Security notes

JWTs are **stateless** — logout clears the cookie, but an issued token stays valid until its 7-day expiry (standard trade-off). For instant revocation add `tokenVersion Int` to `AdminUser`, embed it in the JWT, compare in `requireAdmin()`. `AUTH_SECRET` must be ≥32 random chars in prod (32-byte check is yours to wire into CI). Password ≥10 chars enforced on rotation.

## Prisma client (aapke jaise fresh installs ke liye)

`npm run dev` par `Cannot find module '.prisma/client/default'` aaye to iska matlab Prisma client generate nahi hua.
`package.json` mein ab **`postinstall` hook** hai — har `npm/pnpm install` ke baad `prisma generate` khud chalta hai.
Agar aapke paas purana zip/fresh clone bina hook wala ho to bas ek baar:

```bash
npx prisma generate     # → node_modules/.prisma/client ban jayega
rmdir /s /q .next        # (Windows) purana failed bundle cache hatao
npm run dev
```

### Prisma version trap (yeh error kabhi dobara na aaye)

`@prisma/client` **6.16.2 se upar mat le jana** (Prisma 7 ka client layout bilkul different hai) — generate ke waqt chhapne wala
hint `npm i @prisma/client@latest` **follow na karein**. Version drift ho to `next dev` par cryptic
`Cannot find module '@prisma/client/runtime/library.js'` 500 aata hai; `src/lib/db.ts` mein guard ab uski seedhi wajah + fix batata hai.
Repair:
```bash
npm uninstall @prisma/client prisma
rm -rf node_modules .next
npm install --package-lock-only && npm ci   # lockfile 6.16.2 pin karta hai
npx prisma generate
```
Network/proxy se engine download fail ho to dobara chalaayein; `prisma generate` sirf codegen karta hai, DB se connect nahi karta — DATABASE_URL ka koi role nahi yahan.

## Verification done in this environment

- `pnpm typecheck` → 0 errors; `pnpm build` → clean, 16/16 static gen.
- Migration `20260911181754_init` applied to a **real PostgreSQL 17** + seed rows verified by count.
- `scripts/smoke.sh` → **51 passed, 0 failed** (against the production standalone server).
- **Not verifiable here:** WebGL rendering + Lighthouse jank claims — sandbox has no GPU/browser. Open `pnpm dev` locally, check DevTools Performance + Lighthouse; the budgets above are implemented but you should measure on real devices.
