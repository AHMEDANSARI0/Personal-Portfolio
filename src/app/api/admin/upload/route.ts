import { requireAdmin, NextResponse, bad } from "@/lib/api";
import { saveUpload } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST multipart { file, kind: "image"|"model"|"favicon" }
 * → Cloudinary (if CLOUDINARY_URL set) or /uploads/<kind>/… served by
 * /uploads/[...path]. Returns { url } to store in content.
 */
export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const kind = ((form?.get("kind") as "image" | "model" | "favicon") || "image") as
    | "image"
    | "model"
    | "favicon";
  if (!file || !(file instanceof File)) return bad("Missing file");

  try {
    const saved = await saveUpload(file, kind);
    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    return bad((e as Error).message, 413);
  }
}
