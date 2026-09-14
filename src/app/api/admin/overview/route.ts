import { prisma } from "@/lib/db";
import { NextResponse, requireAdmin } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dashboard home numbers — one round trip. */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [projects, published, testimonials, approved, unread, lastContent, lastMessage] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { published: true } }),
    prisma.testimonial.count(),
    prisma.testimonial.count({ where: { approved: true } }),
    prisma.message.count({ where: { status: "new" } }),
    prisma.siteContent.aggregate({ _max: { updatedAt: true } }),
    prisma.message.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true, name: true } }),
  ]);

  return NextResponse.json({
    projects,
    publishedProjects: published,
    testimonials,
    approvedTestimonials: approved,
    unreadMessages: unread,
    lastContentUpdate: lastContent._max.updatedAt,
    lastMessageAt: lastMessage?.createdAt || null,
    lastMessageFrom: lastMessage?.name || null,
  });
}
