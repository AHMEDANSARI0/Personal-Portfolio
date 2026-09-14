import type { Metadata } from "next";
import { Footer, Nav } from "@/components/sections";
import { getAllContent, pageMeta } from "@/lib/pages";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta("/privacy", "Privacy");
}

export default async function PrivacyPage() {
  const content = await getAllContent();
  return <>
    <Nav social={content.social} navigation={content.navigation} />
    <main className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold">Privacy policy</h1>
      <div className="prose-minimal mt-8 space-y-5 text-muted">
        <p>This site only stores information you choose to send through the contact form or email signup.</p>
        <p>Email signup addresses are used for updates from this site and are not sold. You can request removal at any time by contacting the site owner.</p>
        <p>Contact submissions are retained to respond to your inquiry. For questions about your data, use the contact details on the site.</p>
      </div>
    </main>
    <Footer social={content.social} seo={content.seo} footer={content.footer} />
  </>;
}