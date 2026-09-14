import type { Metadata } from "next";
import { Footer, Nav } from "@/components/sections";
import { getAllContent, pageMeta } from "@/lib/pages";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta("/terms", "Terms");
}

export default async function TermsPage() {
  const content = await getAllContent();
  return <>
    <Nav social={content.social} navigation={content.navigation} />
    <main className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-3 text-4xl font-semibold">Terms of use</h1>
      <div className="prose-minimal mt-8 space-y-5 text-muted">
        <p>Content on this portfolio is provided for general information and may change without notice.</p>
        <p>You may not copy, republish, or use portfolio work, images, or written content without permission from the site owner.</p>
        <p>By using the contact or newsletter forms, you agree to provide accurate information and to use the site lawfully.</p>
      </div>
    </main>
    <Footer social={content.social} seo={content.seo} footer={content.footer} />
  </>;
}