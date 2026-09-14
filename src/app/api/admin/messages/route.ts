import { prisma } from "@/lib/db";
import { NextResponse, bad, readJson, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?status=new|read|replied|archived|all & q=search */
export async function GET(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "all";
  const q = (url.searchParams.get("q") || "").trim();

  const rows = await prisma.message.findMany({
    where: {
      ...(status !== "all" ? { status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(rows);
}

/** PUT { id, status } — mark read/replied/archived from the table. */
export async function PUT(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await readJson(req);
  if (typeof body.id !== "number") return bad("id required");

  const status = body.status;
  if (!["new", "read", "replied", "archived"].includes(String(status))) return bad("invalid status");

  await prisma.message.update({ where: { id: body.id }, data: { status: String(status) } });
  return NextResponse.json({ ok: true });
}
