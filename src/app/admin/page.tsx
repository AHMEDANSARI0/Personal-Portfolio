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

  const stat = (label: string, value: React.ReactNode, href: string, note: string, tone: string) => (
    <Link href={href} className="admin-metric">
      <span className={`admin-metric-icon ${tone}`}>{label.slice(0, 1)}</span>
      <span className="admin-metric-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></span>
      <span className="admin-metric-arrow">↗</span>
    </Link>
  );

  return (
    <div className="admin-dashboard space-y-6">
      <div className="admin-page-header">
        <div><p className="admin-overline">Workspace overview</p><h1>Good to see you.</h1><p>Manage your portfolio, content, and publishing pipeline from one place.</p></div>
        <div className="admin-header-meta"><span className="admin-live-status"><i />System online</span><span className="admin-date">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date())}</span></div>
        {error && <span className="admin-error">API error: {error}</span>}
      </div>

      <div className="admin-metrics grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stat("Projects", data ? `${data.publishedProjects}/${data.projects}` : "—", "/admin/projects", "published / total", "blue")}
        {stat(
          "Testimonials",
          data ? `${data.approvedTestimonials}/${data.testimonials}` : "—",
          "/admin/testimonials",
          "approved / total",
          "green",
        )}
        {stat("Unread messages", data?.unreadMessages ?? "—", "/admin/messages", "from the contact form", "orange")}
        {stat(
          "Last content update",
          data?.lastContentUpdate ? new Date(data.lastContentUpdate).toLocaleDateString() : "—",
          "/admin/content",
          data?.lastMessageAt ? `last message ${new Date(data.lastMessageAt).toLocaleDateString()} · ${data.lastMessageFrom}` : "no messages yet",
          "violet",
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card title="Quick actions" desc="Jump into the workflows you use most.">
          <div className="admin-actions-grid">
            <Link href="/admin/content" className="admin-action"><span className="admin-action-icon">Aa</span><span><strong>Edit content</strong><small>Hero, navigation & footer</small></span><b>↗</b></Link>
            <Link href="/admin/projects" className="admin-action"><span className="admin-action-icon">+</span><span><strong>Add a project</strong><small>Publish new work</small></span><b>↗</b></Link>
            <Link href="/admin/theme" className="admin-action"><span className="admin-action-icon">◈</span><span><strong>Design system</strong><small>Theme, avatar & hero</small></span><b>↗</b></Link>
            <Link href="/admin/seo" className="admin-action"><span className="admin-action-icon">⌁</span><span><strong>SEO settings</strong><small>Metadata & visibility</small></span><b>↗</b></Link>
          </div>
        </Card>
        <Card title="Content health" desc="A quick checklist before you publish.">
          <ul className="admin-checklist">
            <li><i className="done">✓</i><span>Database connection</span><b>Ready</b></li>
            <li><i>2</i><span>Replace placeholder copy</span><b>Review</b></li>
            <li><i>3</i><span>Add your first project</span><b>Next</b></li>
            <li><i>4</i><span>Upload a real avatar</span><b>Optional</b></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
