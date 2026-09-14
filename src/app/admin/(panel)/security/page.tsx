"use client";

import { useState } from "react";
import { api, Card, Field, Input, useToast } from "@/components/admin/ui";

export default function SecurityAdmin() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const data = Object.fromEntries(new FormData(f).entries());
    if (data.newPassword !== data.confirm) return toast.show("New password and confirmation don’t match", "err");
    setBusy(true);
    try {
      await api("/api/admin/password", { method: "POST", body: JSON.stringify(data) });
      setDone(true);
      f.reset();
    } catch (err) {
      toast.show((err as Error).message, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="mt-1 text-sm text-muted">Single admin user, bcrypt-hashed password, httpOnly JWT cookie, no public sign-up.</p>
      </div>
      <Card title="Change admin password">
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Current password">
            <Input required type="password" name="currentPassword" autoComplete="current-password" />
          </Field>
          <Field label="New password" hint="minimum 10 characters">
            <Input required type="password" name="newPassword" minLength={10} autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password">
            <Input required type="password" name="confirm" minLength={10} autoComplete="new-password" />
          </Field>
          <div className="flex items-center gap-3">
            <button className="btn btn-primary text-sm" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
            {done && <span className="text-sm" style={{ color: "var(--accent)" }}>Password updated ✓</span>}
          </div>
        </form>
      </Card>
      <Card title="Lost access?" desc="Recover from the server:">
        <pre className="overflow-x-auto rounded-lg bg-bgsoft p-4 text-xs">
{`# set a fresh hash (also creates the admin user if missing)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='new-long-password' pnpm db:seed
# or just:
pnpm admin:password you@example.com 'new-long-password'`}
        </pre>
      </Card>
      {toast.node}
    </div>
  );
}
