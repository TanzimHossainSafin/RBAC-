"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { loading, sidebar, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return <div className="screen-loader">Loading workspace...</div>;
  }

  return (
    <div className="workspace-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand brand-compact">
            <div className="brand-mark" />
            <span>Obliq</span>
          </div>

          <div className="sidebar-copy">
            <span className="eyebrow">RBAC Workspace</span>
            <p>Navigation, route access, and user controls resolve from the signed permission set.</p>
          </div>

          <div className="workspace-user">
            <div className="workspace-avatar">{user.name.slice(0, 1)}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebar.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "nav-item active" : "nav-item"}>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-note">
            <strong>{user.permissions.length}</strong>
            <span>resolved permissions</span>
          </div>
          <button className="ghost-button" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-banner">
          <div>
            <span className="eyebrow">Shared App</span>
            <h1>Dynamic RBAC Workspace</h1>
            <p>One application, permission atoms everywhere, and manager grant ceilings enforced server-side.</p>
          </div>

          <div className="workspace-banner-actions">
            <div className="workspace-banner-stat">
              <strong>{user.role}</strong>
              <span>role label</span>
            </div>
            <div className="status-pill">{user.status}</div>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
