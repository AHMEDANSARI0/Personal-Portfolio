import { NextResponse } from "next/server";
import { getAdminSession } from "./auth";

export { NextResponse };

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  }
  return { session, error: null } as const;
}

export function bad(message: string, status = 400, issues?: unknown) {
  return NextResponse.json({ error: message, issues }, { status });
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}
