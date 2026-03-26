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
          <div className="brand">
            <div className="brand-mark" />
            <span>Obliq</span>
          </div>

          <div className="workspace-user">
            <div className="workspace-avatar">{user.name.slice(0, 1)}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebar.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "nav-item active" : "nav-item"}>
              {item.label}
            </Link>
          ))}
        </nav>

        <button className="ghost-button" onClick={() => void logout()}>
          Log out
        </button>
      </aside>

      <main className="workspace-main">
        <header className="workspace-banner">
          <div>
            <h1>Dynamic RBAC Workspace</h1>
            <p>Routes, navigation, and actions all resolve from the signed permission set.</p>
          </div>
          <div className="status-pill">{user.status}</div>
        </header>
        {children}
      </main>
    </div>
  );
}
