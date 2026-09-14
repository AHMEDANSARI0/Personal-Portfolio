/**
 * CLI reset for the single admin user — creates the user if missing.
 *   pnpm admin:password you@example.com 'a-long-password'
 */
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

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

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 10) {
    console.error("usage: pnpm admin:password <email> <password(10+ chars)>");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), passwordHash: hash, name: "Site Admin" },
    update: { passwordHash: hash },
  });
  console.log(`✓ password set for ${email.toLowerCase()}`);
}

main().finally(() => prisma.$disconnect());
