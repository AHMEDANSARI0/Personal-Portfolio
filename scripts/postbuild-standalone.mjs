/**
 * `output: "standalone"` snapshots neither runtime uploads nor /public assets
 * into .next/standalone the way we need — copy them so the standalone server
 * (used by our Dockerfile) can seed fresh installs and serve everything.
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const target = path.join(root, ".next", "standalone");

for (const dir of ["public", "uploads"]) {
  const from = path.join(root, dir);
  const to = path.join(target, dir);
  if (!existsSync(from)) mkdirSync(from, { recursive: true });
  if (existsSync(to)) cpSync(from, to, { recursive: true });
  else cpSync(from, to, { recursive: true });
  console.log(`✓ copied ${dir}/ → .next/standalone/${dir}/`);
}
