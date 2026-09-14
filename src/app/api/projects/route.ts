import { NextResponse } from "next/server";
import { getPublishedProjects } from "@/lib/queries";

/** Public read API (used by anything outside the Next render: OG workers, mobile app, etc.) */
export const dynamic = "force-static";
export const revalidate = 300;

export async function GET() {
  const rows = await getPublishedProjects();
  return NextResponse.json(
    rows.map((p) => ({
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      tags: p.tags,
      imageUrl: p.imageUrl,
      liveUrl: p.liveUrl,
      githubUrl: p.githubUrl,
    })),
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
