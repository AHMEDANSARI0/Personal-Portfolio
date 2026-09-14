"use client";

import { useCallback, useEffect, useState } from "react";
import { api, Card, useToast } from "@/components/admin/ui";
import type { MessageDTO } from "@/lib/types";

const FILTERS = ["all", "new", "read", "replied", "archived"] as const;

export default function MessagesAdmin() {
  const [rows, setRows] = useState<MessageDTO[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<MessageDTO | null>(null);
  const toast = useToast();

  const load = useCallback(() => {
    api<MessageDTO[]>(`/api/admin/messages?status=${filter}${q ? `&q=${encodeURIComponent(q)}` : ""}`)
      .then(setRows)
      .catch((e) => toast.show(e.message, "err"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function setStatus(m: MessageDTO, status: MessageDTO["status"]) {
    await api("/api/admin/messages", { method: "PUT", body: JSON.stringify({ id: m.id, status }) });
    setRows((rows) => rows.map((r) => (r.id === m.id ? { ...r, status } : r)));
    if (open?.id === m.id) setOpen({ ...m, status });
  }

  async function openMessage(m: MessageDTO) {
    setOpen(m);
    if (m.status === "new") setStatus(m, "read");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="mt-1 text-sm text-muted">Inbox from the contact form. Click a row to open + mark read.</p>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full border px-3 py-1 text-xs capitalize"
              style={{
                borderColor: filter === f ? "var(--accent)" : "var(--line)",
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f}
            </button>
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, body…"
            className="field ml-auto max-w-56 !py-1.5 text-xs"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          <div className="min-w-0">
            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
                Nothing here yet — submissions from the contact form land in this table.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                    <th className="py-2 pr-2 font-semibold">From</th>
                    <th className="hidden py-2 pr-2 font-semibold sm:table-cell">Subject</th>
                    <th className="py-2 pr-2 font-semibold">Status</th>
                    <th className="py-2 text-right font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => openMessage(m)}
                      className={`cursor-pointer border-b border-line transition-colors hover:bg-bgsoft ${
                        open?.id === m.id ? "bg-bgsoft" : ""
                      }`}
                    >
                      <td className="max-w-40 truncate py-2.5 pr-2">
                        <span className={m.status === "new" ? "font-bold" : ""}>{m.name}</span>
                        <span className="block truncate text-xs text-muted">{m.email}</span>
                      </td>
                      <td className="hidden max-w-40 truncate py-2.5 pr-2 text-muted sm:table-cell">{m.subject || "—"}</td>
                      <td className="py-2.5 pr-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase"
                          style={
                            m.status === "new"
                              ? { background: "var(--accent)", color: "var(--accent-fg)" }
                              : { background: "var(--bg-soft)", color: "var(--muted)" }
                          }
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right text-xs text-muted">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            {open ? (
              <div className="card space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{open.name}</p>
                    <a className="text-xs underline" style={{ color: "var(--accent)" }} href={`mailto:${open.email}`}>
                      {open.email}
                    </a>
                  </div>
                  <p className="whitespace-nowrap text-xs text-muted">{new Date(open.createdAt).toLocaleString()}</p>
                </div>
                {open.subject && <p className="text-sm font-semibold">{open.subject}</p>}
                <p className="whitespace-pre-wrap rounded-lg bg-bgsoft p-4 text-sm leading-relaxed">{open.body}</p>
                <div className="flex flex-wrap gap-2">
                  <a className="btn btn-primary !py-1.5 text-xs" href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject || "Your message")}`}>
                    Reply in email
                  </a>
                  <button className="btn btn-ghost !py-1.5 text-xs" onClick={() => setStatus(open, "replied")}>
                    Mark replied
                  </button>
                  <button className="btn btn-ghost !py-1.5 text-xs" onClick={() => setStatus(open, "archived")}>
                    Archive
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid h-full min-h-40 place-items-center rounded-xl border border-dashed border-line p-6 text-center text-xs text-muted">
                Select a message to read it here
              </div>
            )}
          </div>
        </div>
      </Card>
      {toast.node}
    </div>
  );
}
