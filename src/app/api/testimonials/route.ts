import { NextResponse } from "next/server";
import { getApprovedTestimonials } from "@/lib/queries";

export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  const rows = await getApprovedTestimonials();
  return NextResponse.json(
    rows.map((t) => ({ name: t.name, role: t.role, quote: t.quote, photoUrl: t.photoUrl, rating: t.rating })),
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
