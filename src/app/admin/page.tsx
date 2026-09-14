"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Card } from "@/components/admin/ui";

interface Overview {
  projects: number;
  publishedProjects: number;
  testimonials: number;
  approvedTestimonials: number;
  unreadMessages: number;
  lastContentUpdate: string | null;
  lastMessageAt: string | null;
  lastMessageFrom: string | null;
}

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Overview>("/api/admin/overview").then(setData).catch((e) => setError(e.message));
  }, []);

  const stat = (label: string, value: React.ReactNode, href: string, note?: string) => (
    <Link href={href} className="card block p-6 transition-transform hover:-translate-y-0.5">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Everything here writes to the database and revalidates the public site instantly.{" "}
          {error && <span className="text-red-500">API error: {error} (is DATABASE_URL set + migrated?)</span>}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat("Projects", data ? `${data.publishedProjects}/${data.projects}` : "—", "/admin/projects", "published / total")}
        {stat(
          "Testimonials",
          data ? `${data.approvedTestimonials}/${data.testimonials}` : "—",
          "/admin/testimonials",
          "approved / total",
        )}
        {stat("Unread messages", data?.unreadMessages ?? "—", "/admin/messages", "from the contact form")}
        {stat(
          "Last content update",
          data?.lastContentUpdate ? new Date(data.lastContentUpdate).toLocaleDateString() : "—",
          "/admin/content",
          data?.lastMessageAt ? `last message ${new Date(data.lastMessageAt).toLocaleDateString()} · ${data.lastMessageFrom}` : "no messages yet",
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Quick actions">
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/admin/content" className="btn btn-ghost text-xs">Edit hero & about</Link>
            <Link href="/admin/projects" className="btn btn-ghost text-xs">Add a project</Link>
            <Link href="/admin/theme" className="btn btn-ghost text-xs">Swap 3D avatar</Link>
            <Link href="/admin/seo" className="btn btn-ghost text-xs">SEO preview</Link>
            <Link href="/admin/security" className="btn btn-ghost text-xs">Password</Link>
          </div>
        </Card>
        <Card title="Placeholder content audit" desc="Any [BRACKETED] text on the public site is filler waiting for your real copy.">
          <ul className="space-y-2 pt-1 text-sm text-muted">
            <li>1. Open the live site and search the page source for “[”</li>
            <li>2. Replace hero / about / contact copy in Content</li>
            <li>3. Add at least one project + one real testimonial</li>
            <li>4. Upload your real avatar GLB under Theme & 3D</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
