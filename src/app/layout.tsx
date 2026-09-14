import "./globals.css";
import { buildMetadata } from "@/lib/seo";
import { getAllContent } from "@/lib/content";
import { resolveFontPair } from "@/lib/fonts";
import { themeVars } from "@/lib/theme";
import { personJsonLd, websiteJsonLd } from "@/lib/seo";

export const revalidate = 60;

export async function generateMetadata() {
  const content = await getAllContent();
  return buildMetadata(content, { path: "/", label: "Home", page: null });
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getAllContent();
  const fonts = resolveFontPair(content.theme.fonts);

  return (
    <html
      lang="en"
      data-mode={content.theme.mode}
      style={
        {
          ...themeVars(content.theme),
          "--font-display": fonts.display,
          "--font-body": fonts.body,
        } as React.CSSProperties
      }
    >
      <body className="min-h-screen antialiased">
        {/* Google Fonts are opt-in per pair — zero webfont cost for system stack */}
        {fonts.googleHref && (
          <link rel="stylesheet" href={fonts.googleHref} crossOrigin="anonymous" />
        )}
        <noscript>
          <style>{`.nojs-hide{display:none!important}`}</style>
        </noscript>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(content)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(content)) }}
        />
      </body>
    </html>
  );
}
