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

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bgsoft">
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-8">
        <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-52 shrink-0 flex-col md:flex">
          <Link href="/" className="display mb-8 text-sm font-bold tracking-tight">
            PORTFOLIO<span className="text-muted"> / admin</span>
          </Link>
          <nav className="flex flex-col gap-1" aria-label="Admin">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                    active ? "bg-bg font-semibold text-fg" : "text-muted hover:bg-bg/60 hover:text-fg"
                  }`}
                  style={active ? { boxShadow: "inset 2px 0 0 var(--accent)" } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto space-y-3 pt-6">
            <Link href="/" className="block text-xs text-muted hover:text-fg">
              ← View live site
            </Link>
            <p className="truncate text-xs text-muted">{email}</p>
            <button onClick={logout} className="btn btn-ghost !py-1.5 w-full justify-center text-xs">
              Log out
            </button>
          </div>
        </aside>

        {/* mobile top bar */}
        <div className="mb-4 flex w-full items-center justify-between md:hidden">
          <Link href="/admin" className="display text-sm font-bold">
            ADMIN
          </Link>
          <div className="flex gap-2 overflow-x-auto text-xs">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-full border border-line bg-card px-3 py-1.5">
                {n.label}
              </Link>
            ))}
          </div>
        </div>

        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
