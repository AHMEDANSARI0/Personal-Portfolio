"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, Card, Field, Input, Textarea, Toggle, UploadButton, useToast } from "@/components/admin/ui";
import type { TestimonialDTO } from "@/lib/types";

interface Draft {
  id?: number;
  name: string;
  role: string;
  quote: string;
  photoUrl: string;
  rating: number;
  approved: boolean;
}

const EMPTY: Draft = { name: "", role: "", quote: "", photoUrl: "", rating: 5, approved: true };

export default function TestimonialsAdmin() {
  const [rows, setRows] = useState<TestimonialDTO[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const dragId = useRef<number | null>(null);
  const toast = useToast();

  const load = useCallback(() => {
    api<TestimonialDTO[]>("/api/admin/testimonials").then(setRows).catch((e) => toast.show(e.message, "err"));
  }, [toast]);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: draft.name,
      role: draft.role,
      quote: draft.quote,
      photoUrl: draft.photoUrl || null,
      rating: draft.rating || null,
      approved: draft.approved,
      order: 0,
    };
    try {
      if (draft.id) await api(`/api/admin/testimonials/${draft.id}`, { method: "PUT", body: JSON.stringify(body) });
      else await api("/api/admin/testimonials", { method: "POST", body: JSON.stringify(body) });
      toast.show(draft.id ? "Updated" : "Added");
      setDraft(EMPTY);
      load();
    } catch (err) {
      toast.show((err as Error).message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function toggleApproved(t: TestimonialDTO) {
    await api(`/api/admin/testimonials/${t.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: t.name,
        role: t.role,
        quote: t.quote,
        photoUrl: t.photoUrl || null,
        rating: t.rating ?? null,
        approved: !t.approved,
        order: t.order,
      }),
    });
    load();
  }

  function reorder(targetId: number) {
    const from = rows.findIndex((r) => r.id === dragId.current);
    const to = rows.findIndex((r) => r.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
    api("/api/admin/testimonials", { method: "PUT", body: JSON.stringify({ ids: next.map((r) => r.id) }) }).catch(() => load());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Testimonials</h1>
        <p className="mt-1 text-sm text-muted">
          Only approved quotes render publicly. The site shows no fake ones by default — add the real thing.{" "}
          <span className="placeholder-tag">HONESTY REQUIRED</span>
        </p>
      </div>

      <Card title={draft.id ? `Edit #${draft.id}` : "New testimonial"}>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <Field label="Name *">
              <Input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <Field label="Role / company">
              <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="CTO, Acme Labs" />
            </Field>
            <Field label="Rating (0–5)">
              <Input
                type="number"
                min={0}
                max={5}
                value={draft.rating}
                onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}
                className="w-24"
              />
            </Field>
          </div>
          <Field label="Quote *">
            <Textarea required rows={3} value={draft.quote} onChange={(e) => setDraft({ ...draft, quote: e.target.value })} />
          </Field>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              {draft.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.photoUrl} alt="" className="h-10 w-10 rounded-full border border-line object-cover" />
              )}
              <UploadButton label="Photo" onUploaded={(url) => setDraft({ ...draft, photoUrl: url })} />
            </div>
            <Toggle checked={draft.approved} onChange={(v) => setDraft({ ...draft, approved: v })} label="Approved / public" />
            <div className="ml-auto flex gap-2">
              {draft.id && (
                <button type="button" className="btn btn-ghost text-sm" onClick={() => setDraft(EMPTY)}>
                  Cancel
                </button>
              )}
              <button className="btn btn-primary text-sm" disabled={saving}>
                {saving ? "Saving…" : draft.id ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </form>
      </Card>

      <Card title={`All testimonials (${rows.length})`}>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">None yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((t) => (
              <li
                key={t.id}
                draggable
                onDragStart={() => (dragId.current = t.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => reorder(t.id)}
                className="flex cursor-grab items-start gap-4 py-3"
              >
                <span className="pt-1 text-muted select-none">⋮⋮</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {t.name} <span className="font-normal text-muted">· {t.role}</span>
                    {!t.approved && (
                      <span className="ml-2 rounded bg-bgsoft px-1.5 py-0.5 text-[0.65rem] font-bold uppercase text-muted">
                        pending
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">“{t.quote}”</p>
                </div>
                <button
                  className="text-xs text-muted underline"
                  onClick={() =>
                    setDraft({
                      id: t.id,
                      name: t.name,
                      role: t.role,
                      quote: t.quote,
                      photoUrl: t.photoUrl || "",
                      rating: t.rating ?? 0,
                      approved: t.approved,
                    })
                  }
                >
                  edit
                </button>
                <button className="text-xs underline" style={{ color: "var(--accent)" }} onClick={() => toggleApproved(t)}>
                  {t.approved ? "unpublish" : "approve"}
                </button>
                <button
                  className="text-xs text-red-500 underline"
                  onClick={async () => {
                    if (!confirm("Delete this testimonial?")) return;
                    await api(`/api/admin/testimonials/${t.id}`, { method: "DELETE" });
                    load();
                  }}
                >
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
