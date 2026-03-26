"use client";

import { useAuth } from "./auth-provider";

export function DashboardOverview() {
  const { user, stats } = useAuth();

  if (!user) return null;

  return (
    <div className="page-grid">
      <section className="panel hero-panel">
        <span className="eyebrow">Dashboard</span>
        <h2>{user.name}</h2>
        <p>
          Your view is assembled at runtime. The sidebar, route access, and all management controls are driven by the
          permission atoms on your account.
        </p>
      </section>

      <section className="stats-grid">
        <article className="panel stat-card">
          <span>Users</span>
          <strong>{stats?.users ?? 0}</strong>
        </article>
        <article className="panel stat-card">
          <span>Leads</span>
          <strong>{stats?.leads ?? 0}</strong>
        </article>
        <article className="panel stat-card">
          <span>Tasks</span>
          <strong>{stats?.tasks ?? 0}</strong>
        </article>
        <article className="panel stat-card">
          <span>Reports</span>
          <strong>{stats?.reports ?? 0}</strong>
        </article>
      </section>

      <section className="panel">
        <h3>Resolved Permissions</h3>
        <div className="chip-grid">
          {user.permissions.map((permission) => (
            <span key={permission} className="permission-chip">
              {permission}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
