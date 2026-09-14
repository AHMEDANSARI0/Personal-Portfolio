"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, Card, Field, Input, Textarea, Toggle, UploadButton, useToast } from "@/components/admin/ui";
import type { ProjectDTO } from "@/lib/types";

interface Draft {
  id?: number;
  title: string;
  slug: string;
  summary: string;
  description: string;
  imageUrl: string;
  tags: string;
  liveUrl: string;
  githubUrl: string;
  featured: boolean;
  published: boolean;
}

const EMPTY: Draft = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  imageUrl: "",
  tags: "",
  liveUrl: "",
  githubUrl: "",
  featured: false,
  published: true,
};

const toDraft = (p: ProjectDTO): Draft => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  summary: p.summary,
  description: p.description || "",
  imageUrl: p.imageUrl || "",
  tags: p.tags.join(", "),
  liveUrl: p.liveUrl || "",
  githubUrl: p.githubUrl || "",
  featured: p.featured,
  published: p.published,
});

const toBody = (d: Draft) => ({
  title: d.title,
  slug: d.slug || undefined,
  summary: d.summary,
  description: d.description || null,
  imageUrl: d.imageUrl || null,
  tags: d.tags.split(",").map((t) => t.trim()).filter(Boolean),
  liveUrl: d.liveUrl || null,
  githubUrl: d.githubUrl || null,
  featured: d.featured,
  published: d.published,
  order: 0,
});

export default function ProjectsAdmin() {
  const [rows, setRows] = useState<ProjectDTO[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const dragId = useRef<number | null>(null);
  const toast = useToast();

  const load = useCallback(() => {
    api<ProjectDTO[]>("/api/admin/projects")
      .then(setRows)
      .catch((e) => toast.show(e.message, "err"));
  }, [toast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (draft.id) {
        await api(`/api/admin/projects/${draft.id}`, { method: "PUT", body: JSON.stringify(toBody(draft)) });
      } else {
        await api("/api/admin/projects", { method: "POST", body: JSON.stringify(toBody(draft)) });
      }
      toast.show(draft.id ? "Project updated" : "Project created");
      setDraft(EMPTY);
      load();
    } catch (err) {
      toast.show((err as Error).message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: ProjectDTO) {
    if (!confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
    await api(`/api/admin/projects/${p.id}`, { method: "DELETE" });
    toast.show("Deleted");
    load();
  }

  /* drag-to-reorder via native HTML5 DnD → PUT { ids } */
  function reorder(targetId: number) {
    const from = rows.findIndex((r) => r.id === dragId.current);
    const to = rows.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    api("/api/admin/projects", { method: "PUT", body: JSON.stringify({ ids: next.map((r) => r.id) }) })
      .then(() => toast.show("Order saved"))
      .catch((e) => toast.show(e.message, "err"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="mt-1 text-sm text-muted">Drag rows to change the public order. Unpublish to hide without deleting.</p>
      </div>

      <Card title={draft.id ? `Edit #${draft.id}` : "New project"}>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title *">
              <Input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="[PLACEHOLDER] Project name" />
            </Field>
            <Field label="Slug" hint="auto-generated from title if left blank">
              <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="my-project" />
            </Field>
          </div>
          <Field label="Short summary (1–2 lines, card view)">
            <Textarea rows={2} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
          </Field>
          <Field label="Longer description (optional, detail page)">
            <Textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tech tags" hint="comma separated">
              <Input value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="React, Three.js, PostgreSQL" />
            </Field>
            <Field label="Live URL">
              <Input value={draft.liveUrl} onChange={(e) => setDraft({ ...draft, liveUrl: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label="GitHub URL">
              <Input value={draft.githubUrl} onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })} placeholder="https://github.com/…" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              {draft.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.imageUrl} alt="" className="h-14 w-24 rounded-lg border border-line object-cover" />
              )}
              <UploadButton label={draft.imageUrl ? "Replace screenshot" : "Upload screenshot"} onUploaded={(url) => setDraft({ ...draft, imageUrl: url })} />
            </div>
            <Toggle checked={draft.published} onChange={(v) => setDraft({ ...draft, published: v })} label="Published" />
            <Toggle checked={draft.featured} onChange={(v) => setDraft({ ...draft, featured: v })} label="Featured" />
            <div className="ml-auto flex gap-2">
              {draft.id && (
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setDraft(EMPTY)}>
                  Cancel edit
                </button>
              )}
              <button type="submit" disabled={saving} className="btn btn-primary text-sm disabled:opacity-60">
                {saving ? "Saving…" : draft.id ? "Update project" : "Create project"}
              </button>
            </div>
          </div>
        </form>
      </Card>

      <Card title={`All projects (${rows.length})`}>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
            Nothing yet — create your first card above.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((p) => (
              <li
                key={p.id}
                draggable
                onDragStart={() => (dragId.current = p.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(p.id)}
                className="flex cursor-grab items-center gap-4 py-3 active:cursor-grabbing"
              >
                <span className="text-muted select-none">⋮⋮</span>
                <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-bgsoft">
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {p.title}
                    {!p.published && <span className="ml-2 rounded bg-bgsoft px-1.5 py-0.5 text-[0.65rem] font-bold uppercase text-muted">draft</span>}
                    {p.featured && <span className="ml-2 rounded px-1.5 py-0.5 text-[0.65rem] font-bold uppercase" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>featured</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{p.tags.join(" · ") || "no tags"} — /work/{p.slug}</p>
                </div>
                <button className="text-xs text-muted underline hover:text-fg" onClick={() => setDraft(toDraft(p))}>
                  edit
                </button>
                <button className="text-xs text-red-500 underline" onClick={() => remove(p)}>
                  delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {toast.node}
    </div>
  );
}
