import { requireAdmin, NextResponse, bad, ok, readJson } from "@/lib/api";
import { getContent, upsertContent } from "@/lib/content";
import { saveUpload } from "@/lib/storage";
import { avatarSchema } from "@/lib/validation";
import { revalidateSite } from "@/lib/queries";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_ROOT } from "@/lib/storage";

export const runtime = "nodejs";

/** GET: current avatar config. */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json(await getContent("avatar"));
}

/**
 * PUT: JSON { modelUrl?, posterUrl?, height?, yOffset?, headBoneHints? }
 * or multipart with `file` (.glb/.gltf) — the upload becomes active immediately.
 */
export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const current = await getContent("avatar");
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) return bad("Missing GLB file");
    const name = file.name.toLowerCase();
    if (!name.endsWith(".glb") && !name.endsWith(".gltf")) {
      return bad("Only .glb / .gltf files are accepted");
    }
    if (file.size > 5.5 * 1024 * 1024) {
      return bad(
        `Model is ${(file.size / 1024 / 1024).toFixed(1)} MB — the perf budget is ~3–5 MB. Run it through \`pnpm avatar:optimize\` (Draco + WebP) first.`,
        413,
      );
    }
    const saved = await saveUpload(file, "model");
    const updated = { ...current, modelUrl: saved.url };
    await upsertContent("avatar", updated);
    revalidateSite();
    return ok({ ...updated, uploaded: saved.name, size: saved.size });
  }

  const parsed = avatarSchema.safeParse({ ...current, ...(await readJson(req)) });
  if (!parsed.success) return bad("Validation failed", 422, parsed.error.flatten().fieldErrors);
  await upsertContent("avatar", parsed.data);
  revalidateSite();
  return ok(parsed.data);
}

/** DELETE ?file=/uploads/model/x.glb — remove an old upload (never the active one). */
export async function DELETE(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const file = new URL(req.url).searchParams.get("file") || "";
  const current = await getContent("avatar");
  if (!file || file === current.modelUrl) return bad("Refusing to delete the active model");
  if (!file.startsWith("/uploads/model/")) return bad("Only /uploads/model/* files can be removed here");
  try {
    await unlink(path.join(UPLOADS_ROOT, "model", path.basename(file)));
    return ok({ deleted: file });
  } catch {
    return bad("File not found", 404);
  }
}
