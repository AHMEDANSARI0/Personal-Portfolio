import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Footer, Nav } from "@/components/sections";
import { RevealGroup } from "@/components/reveal";
import { getAllContent, pageMeta } from "@/lib/pages";
import { getPublishedProjects } from "@/lib/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta("/work", "Work");
}

export default async function WorkPage() {
  const [content, projects] = await Promise.all([getAllContent(), getPublishedProjects()]);

  return (
    <>
      <Nav social={content.social} seo={content.seo} />
      <main className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <h1 className="text-4xl font-semibold md:text-5xl">Selected work</h1>
        <p className="mt-3 max-w-lg text-muted">
          Every card here is created and ordered in the admin panel — no code, no redeploy.
        </p>
        {projects.length === 0 ? (
          <p className="mt-12 rounded-xl border border-dashed border-line p-12 text-center text-sm text-muted">
            No published projects yet.
          </p>
        ) : (
          <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/work/${p.slug}`} className="card group overflow-hidden">
                <span className="relative block aspect-[16/10] bg-bgsoft">
                  {p.imageUrl && (
                    <Image
                      src={p.imageUrl}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
                    />
                  )}
                </span>
                <span className="block p-5">
                  <span className="block font-semibold">{p.title}</span>
                  <span className="mt-1 block text-sm text-muted">{p.summary}</span>
                </span>
              </Link>
            ))}
          </RevealGroup>
        )}
      </main>
      <Footer social={content.social} seo={content.seo} footer={content.footer} />
    </>
  );
}
