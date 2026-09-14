import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage: every runtime upload lives in the top-level `/uploads` folder
 * (NOT /public — Next snapshots /public at build time, so uploads must be
 * streamed by /uploads/[...path] to work under `next start`/standalone).
 * Cloudinary is used automatically when CLOUDINARY_URL is set.
 */

export type UploadKind = "image" | "model" | "favicon";

const MAX_SIZE: Record<UploadKind, number> = {
  image: 8 * 1024 * 1024, // 8 MB
  model: 5.5 * 1024 * 1024, // brief budget: GLB must stay ≤5 MB — enforced, not just documented
  favicon: 1 * 1024 * 1024,
};

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9. -]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
}

function rand() {
  return Math.random().toString(36).slice(2, 8);
}

export async function saveUpload(
  file: File,
  kind: UploadKind = "image",
): Promise<{ url: string; name: string; size: number }> {
  if (file.size > MAX_SIZE[kind]) {
    throw new Error(`File too large (max ${Math.round(MAX_SIZE[kind] / 1024 / 1024)} MB)`);
  }

  const ext = path.extname(file.name) || (kind === "model" ? ".glb" : ".jpg");
  const base = `${Date.now().toString(36)}-${rand()}-${safeName(path.basename(file.name, ext))}`;
  const rel = path.posix.join(kind, `${base}${ext.toLowerCase()}`);

  if (process.env.CLOUDINARY_URL && kind === "image") {
    return uploadToCloudinary(file, base);
  }

  const dir = path.join(UPLOADS_ROOT, kind);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(UPLOADS_ROOT, rel), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${rel}`, name: file.name, size: file.size };
}

async function uploadToCloudinary(file: File, name: string) {
  const raw = process.env.CLOUDINARY_URL!.replace("cloudinary://", "");
  const [key, secret, cloud] = raw.split("@");
  const base64 = Buffer.from(`${key}:${secret}`).toString("base64");
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", process.env.CLOUDINARY_PRESET || "portfolio");
  form.append("folder", "portfolio");
  form.append("public_id", name);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    headers: { Authorization: `Basic ${base64}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
  const json = (await res.json()) as { secure_url: string };
  return { url: json.secure_url, name: file.name, size: file.size };
}

/** Resolve /uploads/<...> URL → on-disk path (guarded against traversal). */
export function resolveUploadPath(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const rel = decodeURIComponent(url.replace(/^\/uploads\//, ""));
  const abs = path.normalize(path.join(UPLOADS_ROOT, rel));
  if (!abs.startsWith(UPLOADS_ROOT + path.sep)) return null;
  return abs;
}
