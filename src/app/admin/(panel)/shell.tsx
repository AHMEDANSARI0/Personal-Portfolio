"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/theme", label: "Theme & 3D" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/subscribers", label: "Subscribers" },
  { href: "/admin/security", label: "Security" },
];

const NAV_GROUPS = [
  { label: "Workspace", items: NAV.slice(0, 4) },
  { label: "Growth", items: NAV.slice(4, 8) },
  { label: "Account", items: NAV.slice(8) },
];

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="admin-app min-h-screen">
      <div className="admin-layout mx-auto flex max-w-375 gap-8 px-4 py-4 md:px-6 lg:gap-10 lg:px-8">
        <aside className="admin-sidebar sticky top-4 hidden h-[calc(100vh-2rem)] w-60 shrink-0 flex-col md:flex">
          <Link href="/" className="admin-brand">
            <span className="admin-brand-mark">P</span>
            <span><strong>Portfolio</strong><small>Control center</small></span>
          </Link>
          <div className="admin-sidebar-rule" />
          <nav className="admin-nav" aria-label="Admin">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="admin-nav-group">
                <p>{group.label}</p>
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return <Link key={item.href} href={item.href} className={active ? "is-active" : ""}><span className="admin-nav-dot" />{item.label}</Link>;
                })}
              </div>
            ))}
          </nav>
          <div className="admin-sidebar-footer">
            <Link href="/" className="admin-live-link"><span>↗</span> View live site</Link>
            <div className="admin-user"><span className="admin-avatar">{email.slice(0, 1).toUpperCase()}</span><span className="truncate"><strong>{email.split("@")[0]}</strong><small>{email}</small></span></div>
            <button onClick={logout} className="admin-logout">Log out <span>↗</span></button>
          </div>
        </aside>

        {/* mobile top bar */}
        <div className="admin-mobile-header mb-4 flex w-full items-center justify-between md:hidden">
          <Link href="/admin" className="admin-brand"><span className="admin-brand-mark">P</span><span><strong>Portfolio</strong><small>Admin</small></span></Link>
          <div className="admin-mobile-links flex gap-2 overflow-x-auto text-xs">
            {NAV.map((n) => <Link key={n.href} href={n.href} className={pathname === n.href ? "is-active" : ""}>{n.label}</Link>)}
          </div>
        </div>

        <main className="admin-main min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
