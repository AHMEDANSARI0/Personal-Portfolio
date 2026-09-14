import { readFile, stat } from "node:fs/promises";
import { NextResponse, bad } from "@/lib/api";
import { resolveUploadPath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
};

/**
 * Streams runtime uploads (images, GLB avatars) from /uploads on disk.
 * Content-addressed names → safe to cache forever.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const filePath = resolveUploadPath(`/uploads/${parts.map(encodeURIComponent).join("/")}`);
  if (!filePath) return bad("Not found", 404);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return bad("Not found", 404);
    const data = await readFile(filePath);
    const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": TYPES[ext] || "application/octet-stream",
        "content-length": String(info.size),
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return bad("Not found", 404);
  }
}
