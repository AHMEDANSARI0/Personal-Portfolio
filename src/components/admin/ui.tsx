"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Tiny shared plumbing for every /admin page. */

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers:
      init?.body instanceof FormData
        ? init?.headers
        : { "content-type": "application/json", ...(init?.headers || {}) },
  });
  if (res.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fieldErrors = json.issues
      ? Object.entries(json.issues as Record<string, string[]>)
          .map(([k, v]) => `${k}: ${v.join(", ")}`)
          .join(" · ")
      : "";
    throw new Error([json.error, fieldErrors].filter(Boolean).join(" — ") || `HTTP ${res.status}`);
  }
  return json as T;
}

export function Card({
  title,
  desc,
  action,
  children,
  className = "",
}: {
  title?: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-6 ${className}`}>
      {(title || action) && (
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`field ${props.className || ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`field resize-y ${props.className || ""}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-sm"
    >
      <span
        className="relative h-5 w-9 rounded-full border transition-colors"
        style={{
          background: checked ? "var(--accent)" : "var(--bg-soft)",
          borderColor: checked ? "var(--accent)" : "var(--line)",
        }}
      >
        <span
          className="absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all"
          style={{ left: checked ? 18 : 3 }}
        />
      </span>
      {label}
    </button>
  );
}

/** File → /api/admin/upload. Returns the public URL. */
export function useUpload() {
  const [busy, setBusy] = useState(false);
  const upload = useCallback(async (file: File, kind: "image" | "model" = "image") => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      return await api<{ url: string; name: string }>("/api/admin/upload", {
        method: "POST",
        body: form,
      });
    } finally {
      setBusy(false);
    }
  }, []);
  return { upload, busy };
}

export function UploadButton({
  onUploaded,
  accept = "image/*",
  kind = "image",
  label = "Upload",
  localOnly = false,
}: {
  /** localOnly: hand the raw File to onUploaded and skip the generic upload route
   *  (used for .glb which goes through /api/admin/avatar instead) */
  localOnly?: boolean;
  onUploaded: (url: string, name: string, file: File) => void | Promise<void>;
  accept?: string;
  kind?: "image" | "model";
  label?: string;
}) {
  const { upload, busy } = useUpload();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        className="btn btn-ghost py-1.5! px-3! text-xs"
        disabled={busy}
        onClick={() => ref.current?.click()}
      >
        {busy ? "Uploading…" : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (localOnly) {
            await onUploaded("", f.name, f);
          } else {
            const r = await upload(f, kind);
            await onUploaded(r.url, r.name, f);
          }
          e.target.value = "";
        }}
      />
    </>
  );
}

export function Toast({ message, tone }: { message: string; tone: "ok" | "err" }) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-sm shadow-lg"
      style={{
        background: "var(--card)",
        borderColor: tone === "ok" ? "var(--accent)" : "#ef4444",
      }}
    >
      {message}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; tone: "ok" | "err" } | null>(null);
  const show = useCallback((message: string, tone: "ok" | "err" = "ok") => {
    setToast({ message, tone });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const node = toast ? <Toast {...toast} /> : null;
  return { show, node };
}

export function SaveBar({
  onSave,
  saving,
  extra,
}: {
  onSave: () => void;
  saving?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex items-center justify-between gap-3 border-t border-line bg-card/95 px-6 py-4 backdrop-blur">
      <p className="text-xs text-muted">Saved content appears on the site immediately.</p>
      <div className="flex gap-3">
        {extra}
        <button type="button" onClick={onSave} disabled={saving} className="btn btn-primary py-2! text-sm disabled:opacity-60">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
