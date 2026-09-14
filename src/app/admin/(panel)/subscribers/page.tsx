"use client";

import { useEffect, useState } from "react";
import { api, Card, useToast } from "@/components/admin/ui";
import type { NewsletterSubscriberDTO } from "@/lib/types";

export default function SubscribersAdmin() {
  const [rows, setRows] = useState<NewsletterSubscriberDTO[]>([]);
  const toast = useToast();

  useEffect(() => {
    api<NewsletterSubscriberDTO[]>("/api/admin/subscribers").then(setRows).catch((e) => toast.show(e.message, "err"));
  }, [toast]);

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold">Newsletter subscribers</h1><p className="mt-1 text-sm text-muted">Email signup data from the public footer.</p></div>
    <Card title={`${rows.length} subscriber${rows.length === 1 ? "" : "s"}`}>
      {rows.length === 0 ? <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No signups yet.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase tracking-wider text-muted"><th className="py-2">Email</th><th className="py-2 text-right">Joined</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-line"><td className="py-3">{row.email}</td><td className="py-3 text-right text-xs text-muted">{new Date(row.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}
    </Card>
    {toast.node}
  </div>;
}