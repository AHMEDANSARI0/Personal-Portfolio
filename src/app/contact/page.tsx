import type { Metadata } from "next";
import { Contact, Footer, Nav } from "@/components/sections";
import { getAllContent, pageMeta } from "@/lib/pages";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta("/contact", "Contact");
}

export default async function ContactPage() {
  const content = await getAllContent();
  return (
    <>
      <Nav social={content.social} navigation={content.navigation} />
      <main>
        <Contact contact={content.contact} social={content.social} />
      </main>
      <Footer social={content.social} seo={content.seo} footer={content.footer} />
    </>
  );
}
