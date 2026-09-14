import { Hero } from "@/components/hero";
import { About, Contact, Footer, Nav, Projects, Skills, Testimonials } from "@/components/sections";
import { getAllContent } from "@/lib/content";
import { getApprovedTestimonials, getPublishedProjects } from "@/lib/queries";

/** cached reads may hand us Date or an ISO string depending on the serialization path */
const toIso = (v: Date | string) => (typeof v === "string" ? v : v.toISOString());

export const revalidate = 60;

export default async function HomePage() {
  const [content, projects, testimonials] = await Promise.all([
    getAllContent(),
    getPublishedProjects(),
    getApprovedTestimonials(),
  ]);

  return (
    <>
      <Nav social={content.social} navigation={content.navigation} />
      <main>
        <Hero hero={content.hero} avatar={content.avatar} theme={content.theme} />
        <About about={content.about} />
        <Skills skills={content.skills} />
        <Projects
          projects={projects.slice(0, 6).map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            summary: p.summary,
            description: p.description,
            imageUrl: p.imageUrl,
            tags: p.tags,
            liveUrl: p.liveUrl,
            githubUrl: p.githubUrl,
            featured: p.featured,
            published: p.published,
            order: p.order,
            updatedAt: toIso(p.updatedAt),
          }))}
        />
        <Testimonials
          items={testimonials.slice(0, 3).map((t) => ({
            id: t.id,
            name: t.name,
            role: t.role,
            quote: t.quote,
            photoUrl: t.photoUrl,
            rating: t.rating,
            approved: t.approved,
            order: t.order,
          }))}
        />
        <Contact contact={content.contact} social={content.social} />
      </main>
      <Footer social={content.social} seo={content.seo} footer={content.footer} />
    </>
  );
}
