import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { DEFAULTS } from "./defaults";
import type { ContentKey, SiteContentMap } from "./types";

/**
 * Content layer: DB is the source of truth, code defaults are the safety net.
 * If the DB is unreachable (fresh clone, DB down), the site still renders.
 */

async function readRow<K extends ContentKey>(key: K): Promise<SiteContentMap[K]> {
  const row = await prisma.siteContent.findUnique({ where: { key } });
  if (!row) return DEFAULTS[key];
  // merge over defaults so new fields added later never break the page
  return mergeContent(key, row.value) as SiteContentMap[K];
}

function mergeContent<K extends ContentKey>(key: K, value: unknown) {
  const incoming = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const defaults = DEFAULTS[key] as unknown as Record<string, unknown>;
  if (key !== "theme") return { ...defaults, ...incoming };
  return {
    ...defaults,
    ...incoming,
    heroStudio: { ...defaults.heroStudio as object, ...(incoming.heroStudio as object | undefined) },
  };
}

/** One DB round-trip for all content groups (used by pages + admin). */
export const getAllContent = cache(async () => {
  try {
    const rows = await prisma.siteContent.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value as object]));
    const out = {} as SiteContentMap;
    (Object.keys(DEFAULTS) as ContentKey[]).forEach((key) => {
      out[key] = mergeContent(key, map.get(key)) as never;
    });
    return out;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[content] DB unavailable, using defaults:", (err as Error).message);
    }
    return DEFAULTS;
  }
});

export async function getContent<K extends ContentKey>(key: K): Promise<SiteContentMap[K]> {
  try {
    return await readRow(key);
  } catch {
    return DEFAULTS[key];
  }
}

export async function upsertContent(key: ContentKey, value: unknown) {
  // merge over the stored row + defaults: partial saves (or older admin builds)
  // can never blank out fields the form doesn't know about
  const existing = await prisma.siteContent
    .findUnique({ where: { key } })
    .catch(() => null);
  const merged = JSON.stringify({
    ...DEFAULTS[key],
    ...((existing?.value as object) || {}),
    ...((value as object) || {}),
  });
  return prisma.siteContent.upsert({
    where: { key },
    create: { key, value: JSON.parse(merged) as Prisma.InputJsonValue },
    update: { value: JSON.parse(merged) as Prisma.InputJsonValue },
  });
}
