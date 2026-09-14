"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Login failed");
      }
      router.push(params.get("next") || "/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4 p-8">
        <div>
          <p className="eyebrow">Private area</p>
          <h1 className="mt-2 text-2xl font-semibold">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">
            Single-user access. No public sign-up. <span className="placeholder-tag">SET PASSWORD IN .env</span>
          </p>
        </div>
        <label className="block">
          <span className="label">Email</span>
          <input name="email" type="email" required autoComplete="username" className="field" placeholder="admin@example.com" />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className="field" />
        </label>
        {error && (
          <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-500">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center disabled:opacity-60">
          {busy ? "Checking…" : "Sign in"}
        </button>
        <p className="text-center text-xs text-muted">
          Forgot it? Reset via <code>pnpm admin:password</code> on the server.
        </p>
      </form>
    </main>
  );
}
