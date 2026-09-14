"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Card, Field, Input, SaveBar, Textarea, Toggle, UploadButton, useToast } from "@/components/admin/ui";
import type { SeoPageDTO, SiteContentMap } from "@/lib/types";

interface SeoShape {
  global: SiteContentMap["seo"];
  pages: SeoPageDTO[];
}

export default function SeoAdmin() {
  const [data, setData] = useState<SeoShape | null>(null);
  const [content, setContent] = useState<SiteContentMap | null>(null);
  const [global, setGlobal] = useState<SeoShape["global"] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    Promise.all([api<SeoShape>("/api/admin/seo"), api<SiteContentMap>("/api/admin/content")])
      .then(([s, c]) => {
        setData(s);
        setGlobal(s.global);
        setContent(c);
      })
      .catch((e) => toast.show(e.message, "err"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data || !global || !content) return <p className="py-20 text-center text-sm text-muted">Loading SEO config…</p>;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  async function saveGlobal() {
    setSaving(true);
    try {
      await api("/api/admin/seo", { method: "PUT", body: JSON.stringify({ global }) });
      toast.show("Global SEO saved");
    } catch (e) {
      toast.show((e as Error).message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function savePage(page: SeoPageDTO, patch: Partial<SeoPageDTO>) {
    try {
      const updated = await api<SeoPageDTO>(`/api/admin/seo/${page.id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      setData((d) => (d ? { ...d, pages: d.pages.map((p) => (p.id === page.id ? updated : p)) } : d));
      toast.show(`${page.label} meta saved`);
    } catch (e) {
      toast.show((e as Error).message, "err");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">SEO manager</h1>
        <p className="mt-1 text-sm text-muted">
          Meta, OG images, sitemap inclusion and the robots toggle — with live previews below each field.
        </p>
      </div>

      <Card title="Site-wide defaults">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title suffix" hint='appended to page names, e.g. "— Jane Doe"'>
              <Input value={global.titleSuffix} onChange={(e) => setGlobal({ ...global, titleSuffix: e.target.value })} />
            </Field>
            <Field label="Home meta title (also used for og:site_name fallbacks)">
              <Input value={global.defaultTitle} onChange={(e) => setGlobal({ ...global, defaultTitle: e.target.value })} />
            </Field>
          </div>
          <Field label="Default meta description" hint={`${global.defaultDescription.length}/240 — keep 150–160 for Google`}>
            <Textarea rows={2} value={global.defaultDescription} onChange={(e) => setGlobal({ ...global, defaultDescription: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Toggle checked={global.indexable} onChange={(v) => setGlobal({ ...global, indexable: v })} label="Allow search engines (robots.txt)" />
            <span className="text-xs text-muted">Off = robots disallow everything + noindex site-wide. Great for staging.</span>
          </div>
          <GooglePreview
            title={global.defaultTitle}
            description={global.defaultDescription}
            url={`${baseUrl}/`}
          />
        </div>
        <SaveBar onSave={saveGlobal} saving={saving} />
      </Card>

      <div className="space-y-3">
        {data.pages.map((page) => (
          <PageEditor key={page.id} page={page} content={content} baseUrl={baseUrl} open={open === page.path} onToggle={() => setOpen(open === page.path ? null : page.path)} onSave={(patch) => savePage(page, patch)} />
        ))}
      </div>
      {toast.node}
    </div>
  );
}

function PageEditor({
  page,
  content,
  baseUrl,
  open,
  onToggle,
  onSave,
}: {
  page: SeoPageDTO;
  content: SiteContentMap;
  baseUrl: string;
  open: boolean;
  onToggle: () => void;
  onSave: (patch: Partial<SeoPageDTO>) => Promise<void> | void;
}) {
  const [form, setForm] = useState({
    title: page.title || "",
    description: page.description || "",
    ogImageUrl: page.ogImageUrl || "",
    canonical: page.canonical || "",
    noindex: page.noindex,
    showInSitemap: page.showInSitemap,
  });
  useEffect(() => {
    setForm({
      title: page.title || "",
      description: page.description || "",
      ogImageUrl: page.ogImageUrl || "",
      canonical: page.canonical || "",
      noindex: page.noindex,
      showInSitemap: page.showInSitemap,
    });
  }, [page]);

  const effectiveTitle = useMemo(() => {
    if (form.title) return `${form.title} ${content.seo.titleSuffix}`.trim();
    return page.path === "/" ? content.seo.defaultTitle : `${page.label} ${content.seo.titleSuffix}`.trim();
  }, [form.title, content, page]);
  const effectiveDesc = form.description || content.seo.defaultDescription;
  const og = form.ogImageUrl || content.theme.ogImage;

  return (
    <div className="card">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-6 py-4 text-left">
        <span className="flex items-baseline gap-3">
          <span className="text-sm font-semibold">{page.label}</span>
          <span className="font-mono text-xs text-muted">{page.path}</span>
        </span>
        <span className="flex items-center gap-3 text-xs text-muted">
          {page.noindex && <span className="rounded bg-bgsoft px-1.5 py-0.5 font-bold uppercase">noindex</span>}
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-line px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Meta title" hint={`${effectiveTitle.length}/~60 chars ideal`}>
              <Input
                value={form.title}
                placeholder={`(default) ${effectiveTitle}`}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Canonical URL (optional override)">
              <Input value={form.canonical} placeholder={`${baseUrl}${page.path === "/" ? "" : page.path}`} onChange={(e) => setForm({ ...form, canonical: e.target.value })} />
            </Field>
          </div>
          <Field label="Meta description" hint={`${(form.description || "").length}/240 — 150–160 ideal`}>
            <Textarea rows={2} value={form.description} placeholder={`(default) ${effectiveDesc}`} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              {og && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={og.startsWith("http") ? og : baseUrl + og} alt="" className="h-12 w-24 rounded-md border border-line object-cover" />
              )}
              <UploadButton label="OG image (1200×630)" onUploaded={(url) => setForm({ ...form, ogImageUrl: url })} />
            </div>
            <Toggle checked={form.noindex} onChange={(v) => setForm({ ...form, noindex: v })} label="noindex this page" />
            <Toggle checked={form.showInSitemap} onChange={(v) => setForm({ ...form, showInSitemap: v })} label="in sitemap.xml" />
            <button className="btn btn-primary ml-auto !py-1.5 text-xs" onClick={() => onSave(form)}>
              Save page
            </button>
          </div>

          <div className="grid gap-4 pt-2 lg:grid-cols-2">
            <GooglePreview title={effectiveTitle} description={effectiveDesc} url={`${baseUrl}${page.path}`} />
            <SocialPreview title={effectiveTitle} description={effectiveDesc} image={og ? (og.startsWith("http") ? og : baseUrl + og) : null} url={page.path} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── live previews ─────────────────────────────────────────── */

export function GooglePreview({ title, description, url }: { title: string; description: string; url: string }) {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "yoursite.com";
    }
  })();
  return (
    <div className="rounded-xl border border-line bg-white p-4 dark:bg-white">
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-neutral-400">Google result preview</p>
      <div className="[font-family:Arial,sans-serif]">
        <p className="truncate text-xs text-[#202124]">
          {host} <span className="text-[#5f6368]">{url.replace(/^https?:\/\//, "/").replace(/\/$/, "").replace(/^\//, "/")}</span>
        </p>
        <p className="cursor-pointer truncate text-[1.15rem] leading-7 text-[#1a0dab] hover:underline">{title}</p>
        <p className="line-clamp-2 text-sm leading-5 text-[#4d5156]">{description}</p>
      </div>
    </div>
  );
}

export function SocialPreview({ title, description, image, url }: { title: string; description: string; image: string | null; url: string }) {
  return (
    <div className="rounded-xl border border-line bg-[#333639] p-4">
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-neutral-400">Social card (OG) preview</p>
      <div className="overflow-hidden rounded-lg border border-[#4a4e52] bg-[#15202b] [font-family:Arial,sans-serif]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="aspect-[1.91/1] w-full object-cover" />
        ) : (
          <div className="grid aspect-[1.91/1] w-full place-items-center bg-[#22303c] text-xs text-neutral-400">no OG image set</div>
        )}
        <div className="p-3">
          <p className="text-[0.7rem] uppercase text-[#8899a6]">{new URL("http://x" + (url.startsWith("/") ? url : "/")).pathname === "/" ? "website" : "page"}</p>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium text-white">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-[#8899a6]">{description}</p>
        </div>
      </div>
    </div>
  );
}
