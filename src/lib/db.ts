import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

/**
 * Fresh-install guard: Prisma's postinstall hint (`npm i @prisma/client@latest`)
 * drifts @prisma/client onto v7, whose file layout differs from the 6.x
 * generated client in package-lock/pnpm-lock — that produced the cryptic
 * Turbopack "Cannot find module '@prisma/client/runtime/library.js'" 500s.
 * Fail loudly with the actual remedy instead.
 */
if (process.env.NODE_ENV !== "test" && !process.env.SKIP_PRISMA_GUARD) {
  try {
    const require_ = createRequire(__filename);
    // Resolve the @prisma/client *package root* (not its main entry, which codegen
    // redirects to .prisma/client) by way of its package.json.
    const clientDir = join(require_.resolve("@prisma/client/package.json"), "..");
    const pkg = require_("@prisma/client/package.json") as { version?: string };
    const hasRuntime = existsSync(join(clientDir, "runtime", "library.js"));
    if (!hasRuntime && (pkg.version ?? "").startsWith("7")) {
      throw new Error(
        `[db] @prisma/client@${pkg.version} installed but package.json pins 6.16.2 (lockfile drift).\n` +
          "Fix: delete node_modules, run `npm ci` (or `pnpm install --frozen-lockfile`), then `npx prisma generate`. " +
          "Do NOT run `npm i @prisma/client@latest` — Prisma 7 has a different client layout."
      );
    }
    if (!hasRuntime) {
      throw new Error(
        "[db] @prisma/client install is incomplete (missing runtime/library.js). " +
          "Corrupt install, antivirus quarantine, or partial extraction. Run: npx prisma generate — if it persists, " +
          "delete node_modules and reinstall (npm ci)."
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("[db]")) throw e;
    /* resolution edge cases on non-node runtimes: let normal import surface the error */
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
