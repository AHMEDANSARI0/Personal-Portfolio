"use client";

import { useEffect, useState } from "react";
import { api, Card, Field, Input, SaveBar, Textarea, Toggle, UploadButton, useToast } from "@/components/admin/ui";
import type { AboutContent, ContactContent, FooterContent, HeroContent, SiteContentMap, SocialContent } from "@/lib/types";

const TABS = [
  { key: "hero", label: "Hero" },
  { key: "about", label: "About" },
  { key: "skills", label: "Skills" },
  { key: "contact", label: "Contact" },
  { key: "social", label: "Socials" },
  { key: "footer", label: "Footer" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ContentAdmin() {
  const [content, setContent] = useState<SiteContentMap | null>(null);
  const [tab, setTab] = useState<TabKey>("hero");
  const toast = useToast();

  useEffect(() => {
    api<SiteContentMap>("/api/admin/content").then(setContent).catch((e) => toast.show(e.message, "err"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!content) {
    return <p className="py-20 text-center text-sm text-muted">Loading content…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Content</h1>
        <p className="mt-1 text-sm text-muted">
          Public site reads all copy from here — nothing is hardcoded. Keep anything you don&apos;t want live wrapped in
          <code className="mx-1 rounded bg-bgsoft px-1">[brackets]</code>
          and it gets flagged on the page as a placeholder.
        </p>
      </div>

      <div className="flex gap-1 border-b border-line pb-px">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="rounded-t-lg px-4 py-2 text-sm transition-colors"
            style={
              tab === t.key
                ? { background: "var(--card)", border: "1px solid var(--line)", borderBottomColor: "var(--card)", fontWeight: 600 }
                : { color: "var(--muted)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hero" && <HeroEditor value={content.hero} onToast={toast.show} />}
      {tab === "about" && <AboutEditor value={content.about} onToast={toast.show} />}
      {tab === "skills" && <SkillsEditor value={content.skills} onToast={toast.show} />}
      {tab === "contact" && <ContactEditor value={content.contact} onToast={toast.show} />}
      {tab === "social" && <SocialEditor value={content.social} onToast={toast.show} />}
          {tab === "footer" && <FooterEditor value={content.footer} onToast={toast.show} />}
      {toast.node}
    </div>
  );
}

function useDraft<T>(server: T) {
  const [draft, setDraft] = useState<T>(server);
  useEffect(() => setDraft(server), [server]);
  const set = (patch: Partial<T>) => setDraft((d) => ({ ...d, ...patch }));
  return { draft, set, dirty: JSON.stringify(draft) !== JSON.stringify(server) };
}

function save(key: TabKey, value: unknown, onToast: (m: string, t?: "ok" | "err") => void, after?: () => void) {
  api(`/api/admin/content`, { method: "PUT", body: JSON.stringify({ key, value }) })
    .then(() => {
      onToast(`${key} saved`);
      after?.();
    })
    .catch((e) => onToast(e.message, "err"));
}

function HeroEditor({ value, onToast }: { value: HeroContent; onToast: (m: string, t?: "ok" | "err") => void }) {
  const { draft, set } = useDraft(value);
  return (
    <Card title="Hero section" desc="Name, one-line role, and the two CTA buttons over the 3D avatar.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name / big line">
          <Input value={draft.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Kicker (small caps line above)">
          <Input value={draft.kicker} onChange={(e) => set({ kicker: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Tagline (one line)" hint="Role + speciality. Aim under 80 characters.">
            <Input value={draft.tagline} onChange={(e) => set({ tagline: e.target.value })} />
          </Field>
        </div>
        <Field label="Primary CTA label">
          <Input value={draft.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} />
        </Field>
        <Field label="Primary CTA href">
          <Input value={draft.ctaHref} onChange={(e) => set({ ctaHref: e.target.value })} />
        </Field>
        <Field label="Secondary CTA label">
          <Input value={draft.secondaryLabel} onChange={(e) => set({ secondaryLabel: e.target.value })} />
        </Field>
        <Field label="Secondary CTA href">
          <Input value={draft.secondaryHref} onChange={(e) => set({ secondaryHref: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Status pill (optional)" hint='e.g. "Available for select projects — Oct 2026"'>
            <Input value={draft.status} onChange={(e) => set({ status: e.target.value })} />
          </Field>
        </div>
      </div>
      <SaveBar onSave={() => save("hero", draft, onToast, () => window.scrollTo({ top: 0, behavior: "smooth" }))} />
    </Card>
  );
}

function AboutEditor({ value, onToast }: { value: AboutContent; onToast: (m: string, t?: "ok" | "err") => void }) {
  const { draft, set } = useDraft(value);
  const [bioText, setBioText] = useState(value.bio.join("\n\n"));
  useEffect(() => setBioText(value.bio.join("\n\n")), [value.bio]);

  return (
    <Card title="About" desc="Text-first. One paragraph per blank-line-separated block.">
      <div className="grid gap-4">
        <Field label="Section heading">
          <Input value={draft.heading} onChange={(e) => set({ heading: e.target.value })} className="max-w-xs" />
        </Field>
        <Field label="Bio paragraphs">
          <Textarea rows={8} value={bioText} onChange={(e) => setBioText(e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location">
            <Input value={draft.location} onChange={(e) => set({ location: e.target.value })} />
          </Field>
          <Field label="Years of experience">
            <Input value={draft.experienceYears} onChange={(e) => set({ experienceYears: e.target.value })} />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          {draft.portraitUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.portraitUrl} alt="" className="h-16 w-14 rounded-lg border border-line object-cover" />
          )}
          <UploadButton
            label={draft.portraitUrl ? "Replace portrait" : "Upload portrait"}
            onUploaded={async (url) => set({ portraitUrl: url })}
          />
          {draft.portraitUrl && (
            <button type="button" className="text-xs text-muted underline" onClick={() => set({ portraitUrl: null })}>
              remove
            </button>
          )}
        </div>
      </div>
      <SaveBar
        onSave={() =>
          save("about", { ...draft, bio: bioText.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean) }, onToast)
        }
      />
    </Card>
  );
}

type SkillsShape = { heading: string; groups: { label: string; items: string[] }[] };

function SkillsEditor({ value, onToast }: { value: SkillsShape; onToast: (m: string, t?: "ok" | "err") => void }) {
  const [heading, setHeading] = useState(value.heading);
  const [text, setText] = useState(
    value.groups.map((g) => `${g.label}: ${g.items.join(", ")}`).join("\n"),
  );
  useEffect(() => {
    setHeading(value.heading);
    setText(value.groups.map((g) => `${g.label}: ${g.items.join(", ")}`).join("\n"));
  }, [value]);

  return (
    <Card
      title="Skills & Tools"
      desc="One group per line: “Label: item, item, item”. Max 4 groups render nicely on desktop."
    >
      <div className="grid gap-4">
        <Field label="Section heading">
          <Input value={heading} onChange={(e) => setHeading(e.target.value)} className="max-w-xs" />
        </Field>
        <Field label="Groups">
          <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-sm" />
        </Field>
      </div>
      <SaveBar
        onSave={() => {
          const groups = text
            .split("\n")
            .map((line) => line.split(/:\s*/, 2))
            .filter(([label, items]) => label && items)
            .map(([label, items]) => ({
              label: label.trim(),
              items: items
                .split(",")
                .map((i) => i.trim())
                .filter(Boolean),
            }));
          if (!groups.length) return onToast("No valid lines — use “Label: a, b, c”", "err");
          save("skills", { heading, groups }, onToast);
        }}
      />
    </Card>
  );
}

function ContactEditor({ value, onToast }: { value: ContactContent; onToast: (m: string, t?: "ok" | "err") => void }) {
  const { draft, set } = useDraft(value);
  return (
    <Card title="Contact" desc="Shown next to the form. Form submissions always land in Messages regardless.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Section heading">
          <Input value={draft.heading} onChange={(e) => set({ heading: e.target.value })} />
        </Field>
        <Field label="Direct email">
          <Input value={draft.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Blurb">
            <Textarea rows={3} value={draft.blurb} onChange={(e) => set({ blurb: e.target.value })} />
          </Field>
        </div>
        <Field label="Response time" hint='e.g. "within 24h"'>
          <Input value={draft.responseTime} onChange={(e) => set({ responseTime: e.target.value })} />
        </Field>
        <Field label="Booking link (optional)">
          <Input value={draft.calendlyUrl} onChange={(e) => set({ calendlyUrl: e.target.value })} placeholder="https://cal.com/…" />
        </Field>
      </div>
      <SaveBar onSave={() => save("contact", draft, onToast)} />
    </Card>
  );
}

function SocialEditor({ value, onToast }: { value: SocialContent; onToast: (m: string, t?: "ok" | "err") => void }) {
  const { draft, set } = useDraft(value);
  const fields: [keyof SocialContent, string][] = [
    ["linkedin", "LinkedIn"],
    ["github", "GitHub"],
    ["twitter", "X / Twitter"],
    ["dribbble", "Dribbble"],
    ["whatsapp", "WhatsApp (wa.me link)"],
    ["resumeUrl", "Resume PDF URL"],
  ];
  return (
    <Card title="Social links" desc="Leave blank to hide a link on the site. Footer + contact list use these.">
      <div className="grid max-w-xl gap-4">
        {fields.map(([key, label]) => (
          <Field key={key} label={label}>
            <Input value={draft[key]} onChange={(e) => set({ [key]: e.target.value } as Partial<SocialContent>)} />
          </Field>
        ))}
      </div>
      <SaveBar onSave={() => save("social", draft, onToast)} />
    </Card>
  );
}

function FooterEditor({ value, onToast }: { value: FooterContent; onToast: (m: string, t?: "ok" | "err") => void }) {
  const { draft, set } = useDraft(value);
  const [links, setLinks] = useState(value.links.map((link) => `${link.label} | ${link.href}`).join("\n"));
  const [policyLinks, setPolicyLinks] = useState(value.policyLinks.map((link) => `${link.label} | ${link.href}`).join("\n"));
  useEffect(() => {
    setLinks(value.links.map((link) => `${link.label} | ${link.href}`).join("\n"));
    setPolicyLinks(value.policyLinks.map((link) => `${link.label} | ${link.href}`).join("\n"));
  }, [value]);

  function parseLinks(text: string) {
    return text.split("\n").map((line) => {
      const [label, ...hrefParts] = line.split("|");
      return { label: label?.trim() || "", href: hrefParts.join("|").trim() };
    }).filter((link) => link.label && link.href);
  }

  return (
    <Card title="Footer builder" desc="Choose one of six layouts, edit every word/link, and publish it instantly site-wide.">
      <div className="grid gap-5">
        <Field label="Published template">
          <div className="grid gap-2 sm:grid-cols-3">
            {([
              ["stacked", "Stacked"], ["split", "Split"], ["columns", "Columns"],
              ["compact", "Compact"], ["editorial", "Editorial"], ["band", "Band"],
            ] as const).map(([key, label]) => (
              <button key={key} type="button" onClick={() => set({ template: key })} className="rounded-lg border p-3 text-left text-sm" style={{ borderColor: draft.template === key ? "var(--accent)" : "var(--line)", fontWeight: draft.template === key ? 600 : 400 }}>
                {label}<span className="mt-1 block text-xs font-normal text-muted">{key} layout</span>
              </button>
            ))}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Eyebrow"><Input value={draft.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
          <Field label="Heading"><Input value={draft.heading} onChange={(e) => set({ heading: e.target.value })} /></Field>
        </div>
        <Field label="Description"><Textarea rows={3} value={draft.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Main links" hint="One per line: Label | /path"><Textarea rows={5} value={links} onChange={(e) => setLinks(e.target.value)} /></Field>
          <Field label="Policy links" hint="One per line: Label | /privacy"><Textarea rows={5} value={policyLinks} onChange={(e) => setPolicyLinks(e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Copyright suffix"><Input value={draft.copyright} onChange={(e) => set({ copyright: e.target.value })} /></Field>
          <Toggle checked={draft.showSocials} onChange={(v) => set({ showSocials: v })} label="Show social media links" />
        </div>
        <div className="rounded-xl border border-line p-4">
          <Toggle checked={draft.newsletterEnabled} onChange={(v) => set({ newsletterEnabled: v })} label="Show email signup" />
          {draft.newsletterEnabled && <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Signup heading"><Input value={draft.newsletterHeading} onChange={(e) => set({ newsletterHeading: e.target.value })} /></Field>
            <Field label="Button label"><Input value={draft.newsletterButtonLabel} onChange={(e) => set({ newsletterButtonLabel: e.target.value })} /></Field>
            <Field label="Signup description"><Textarea rows={2} value={draft.newsletterDescription} onChange={(e) => set({ newsletterDescription: e.target.value })} /></Field>
            <Field label="Success message"><Textarea rows={2} value={draft.newsletterSuccessMessage} onChange={(e) => set({ newsletterSuccessMessage: e.target.value })} /></Field>
          </div>}
        </div>
      </div>
      <SaveBar onSave={() => save("footer", { ...draft, links: parseLinks(links), policyLinks: parseLinks(policyLinks) }, onToast)} />
    </Card>
  );
}
