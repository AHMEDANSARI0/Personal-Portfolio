/**
 * Dev-only helper: runs a real PostgreSQL 17 locally via embedded-postgres
 * (no Docker required). Used for this machine; use pnpm db:up / Railway in general.
 *
 *   node scripts/start-dev-db.mjs   # keeps running; ctrl-C to stop
 *
 * Data lives in /tmp/pgdata (outside the workspace, wiped on reboot).
 */
import EmbeddedPostgres from "embedded-postgres";
import { mkdirSync } from "node:fs";

mkdirSync("/tmp/pgdata", { recursive: true });

const pg = new EmbeddedPostgres({
  databaseDir: "/tmp/pgdata",
  user: "portfolio",
  password: "portfolio",
  port: 5432,
  persistent: true,
  onLog: (msg) => process.stdout.write(`[pg] ${msg}`),
  onError: (msg) => process.stderr.write(`[pg-err] ${msg}`),
});

try {
  await pg.initialise();
} catch {
  // already initialised — fine
}
await pg.start();
await pg.createDatabase("portfolio").catch(() => {});
console.log("ready");
console.log("DATABASE_URL=postgresql://portfolio:***@localhost:5432/portfolio?schema=public");

process.on("SIGINT", async () => {
  await pg.stop();
  process.exit(0);
});
setInterval(() => {}, 1 << 30);
