import type { Metadata } from "next";
import { About, Footer, Nav } from "@/components/sections";
import { getAllContent, pageMeta } from "@/lib/pages";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta("/about", "About");
}

export default async function AboutPage() {
  const content = await getAllContent();
  return (
    <>
      <Nav social={content.social} navigation={content.navigation} />
      <main>
        <About about={content.about} />
      </main>
      <Footer social={content.social} seo={content.seo} footer={content.footer} />
    </>
  );
}
