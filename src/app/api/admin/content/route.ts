import { getAllContent, upsertContent } from "@/lib/content";
import { NextResponse, bad, ok, readJson, requireAdmin } from "@/lib/api";
import { revalidateSite } from "@/lib/queries";
import { CONTENT_SCHEMAS, contentKeySchema } from "@/lib/validation";
import { normalizeHex } from "@/lib/theme";

export const runtime = "nodejs";

/** GET everything the public site renders (kept public-ish: no secrets in here). */
export async function GET() {
  return NextResponse.json(await getAllContent());
}

/** PUT { key, value } — one endpoint for all content groups, schema-validated per key. */
export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await readJson(req);
  const keyParsed = contentKeySchema.safeParse(body.key);
  if (!keyParsed.success) return bad("Unknown content key");
  const key = keyParsed.data;

  const schema = CONTENT_SCHEMAS[key];
  const parsed = schema.safeParse(body.value);
  if (!parsed.success) return bad("Validation failed", 422, parsed.error.flatten().fieldErrors);

  let value = parsed.data as Record<string, unknown>;
  if (key === "theme") value = { ...value, accent: normalizeHex(String(value.accent)) };

  await upsertContent(key, value);
  revalidateSite();
  return ok({ saved: key });
}
