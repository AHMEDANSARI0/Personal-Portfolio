/**
 * Placeholder raster assets (hero poster for low-end devices + OG image).
 * Generated — swap them with real renders from /admin (Theme & 3D / SEO).
 *   pnpm assets:placeholder
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "uploads", "image");

const poster = /* svg */ `<svg width="900" height="1000" viewBox="0 0 900 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="85%">
      <stop offset="0%" stop-color="#15151b"/><stop offset="100%" stop-color="#0b0b0d"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="50%">
      <stop offset="0%" stop-color="#5B8CFF" stop-opacity="0.55"/><stop offset="100%" stop-color="#5B8CFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#b8bcc8"/><stop offset="100%" stop-color="#6d7180"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1000" fill="url(#bg)"/>
  <circle cx="450" cy="390" r="330" fill="url(#glow)"/>
  <g>
    <ellipse cx="450" cy="770" rx="260" ry="200" fill="url(#skin)"/>
    <rect x="405" y="540" width="90" height="120" rx="30" fill="url(#skin)"/>
    <circle cx="450" cy="430" r="150" fill="url(#skin)"/>
    <path d="M300 400 a150 150 0 0 1 300 0 q-150 -110 -300 0 z" fill="#26262c"/>
    <circle cx="450" cy="430" r="160" fill="none" stroke="#5B8CFF" stroke-opacity="0.5" stroke-width="6" stroke-dasharray="240 700" stroke-linecap="round"/>
  </g>
  <text x="450" y="962" text-anchor="middle" font-family="monospace" font-size="24" letter-spacing="6" fill="#8a8a93">PLACEHOLDER AVATAR RENDER</text>
  <rect x="0" y="905" width="900" height="95" fill="#0b0b0d" opacity="0.72"/>
</svg>`;

const og = /* svg */ `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="85%" cy="10%" r="90%">
      <stop offset="0%" stop-color="#5B8CFF" stop-opacity="0.35"/><stop offset="55%" stop-color="#5B8CFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0b0b0d"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="80" y="80" width="1040" height="470" fill="none" stroke="#232329" stroke-width="2" rx="24"/>
  <text x="130" y="210" font-family="monospace" font-size="22" letter-spacing="10" fill="#8a8a93">PORTFOLIO · [YOUR NAME]</text>
  <text x="130" y="330" font-family="Helvetica, Arial, sans-serif" font-size="86" font-weight="700" fill="#f4f4f5">Creative Developer</text>
  <text x="130" y="400" font-family="Helvetica, Arial, sans-serif" font-size="34" fill="#8a8a93">React · Three.js · Motion — placeholder OG image, replace in /admin/seo</text>
  <circle cx="1010" cy="470" r="46" fill="none" stroke="#5B8CFF" stroke-width="4"/>
  <circle cx="1010" cy="470" r="18" fill="#5B8CFF"/>
</svg>`;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  await sharp(Buffer.from(poster)).jpeg({ quality: 82, progressive: true }).toFile(path.join(OUT_DIR, "hero-poster.jpg"));
  await sharp(Buffer.from(og)).png({ quality: 90 }).toFile(path.join(OUT_DIR, "og-default.png"));
  console.log("✓ uploads/image/hero-poster.jpg");
  console.log("✓ uploads/image/og-default.png");

  const favicon = path.join(process.cwd(), "public", "favicon.svg");
  if (!existsSync(favicon)) {
    writeFileSync(
      favicon,
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0b0b0d"/><circle cx="32" cy="32" r="13" fill="none" stroke="#5B8CFF" stroke-width="3.5"/><circle cx="32" cy="32" r="4.5" fill="#5B8CFF"/></svg>\n`,
    );
    console.log("✓ public/favicon.svg (placeholder monogram)");
  }
  readFileSync(path.join(OUT_DIR, "hero-poster.jpg")); // throws if encode failed
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
