import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Footer, Nav } from "@/components/sections";
import { getAllContent } from "@/lib/content";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/seo";
import { abs } from "@/lib/seo";

export const revalidate = 60;

type Ctx = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const rows = await prisma.project.findMany({ where: { published: true }, select: { slug: true }, take: 50 });
    return rows.map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata(ctx: Ctx): Promise<Metadata> {
  const { slug } = await ctx.params;
  const [content, project] = await Promise.all([
    getAllContent(),
    prisma.project.findUnique({ where: { slug } }).catch(() => null),
  ]);
  if (!project) return { title: "Project — not found", robots: { index: false } };
  return {
    title: `${project.title} ${content.seo.titleSuffix}`.trim(),
    description: project.summary || content.seo.defaultDescription,
    alternates: { canonical: `${siteUrl()}/work/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.summary,
      url: `${siteUrl()}/work/${project.slug}`,
      ...(project.imageUrl ? { images: [{ url: abs(project.imageUrl)!, width: 1200, height: 630, alt: project.title }] } : {}),
    },
  };
}

export default async function ProjectPage(ctx: Ctx) {
  const { slug } = await ctx.params;
  const [content, project] = await Promise.all([
    getAllContent(),
    prisma.project.findUnique({ where: { slug, published: true } }).catch(() => null),
  ]);
  if (!project) notFound();

  return (
    <>
      <Nav social={content.social} navigation={content.navigation} />
      <main className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <p className="eyebrow">Case study</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">{project.title}</h1>
        <p className="mt-4 text-lg text-muted">{project.summary}</p>
        {project.imageUrl && (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl border border-line">
            <Image src={project.imageUrl} alt={`${project.title} screenshot`} fill sizes="896px" className="object-cover" priority />
          </div>
        )}
        {project.description && (
          <div className="prose-minimal mt-10 space-y-5 text-lg leading-relaxed text-muted">
            {project.description.split(/\n\s*\n/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        {project.tags.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                {t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-10 flex gap-3">
          {project.liveUrl && (
            <a className="btn btn-primary" href={project.liveUrl} target="_blank" rel="noreferrer noopener">
              Visit live site ↗
            </a>
          )}
          {project.githubUrl && (
            <a className="btn btn-ghost" href={project.githubUrl} target="_blank" rel="noreferrer noopener">
              Source code ↗
            </a>
          )}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              name: project.title,
              description: project.summary,
              url: `${siteUrl()}/work/${project.slug}`,
              keywords: project.tags.join(", "),
            }),
          }}
        />
      </main>
      <Footer social={content.social} seo={content.seo} footer={content.footer} />
    </>
  );
}
