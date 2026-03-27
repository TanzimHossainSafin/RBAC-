"use client";

import { useAuth } from "./auth-provider";

export function DashboardOverview() {
  const { user, stats, sidebar } = useAuth();

  if (!user) return null;

  return (
    <div className="page-grid">
      <section className="panel hero-panel full-width">
        <div className="hero-split">
          <div>
            <span className="eyebrow">Dashboard</span>
            <h2>{user.name}</h2>
            <p>
              Your workspace is assembled at runtime. Route access, sidebar visibility, data scope, and management
              actions are all permission-driven rather than hard-coded to a role page.
            </p>
          </div>

          <div className="hero-summary">
            <div className="hero-summary-card">
              <strong>{sidebar.length}</strong>
              <span>visible modules</span>
            </div>
            <div className="hero-summary-card">
              <strong>{user.permissions.length}</strong>
              <span>permission atoms</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid full-width">
        <article className="panel stat-card">
          <span>Users in scope</span>
          <strong>{stats?.users ?? 0}</strong>
        </article>
        <article className="panel stat-card">
          <span>Leads in scope</span>
          <strong>{stats?.leads ?? 0}</strong>
        </article>
        <article className="panel stat-card">
          <span>Tasks in scope</span>
          <strong>{stats?.tasks ?? 0}</strong>
        </article>
        <article className="panel stat-card">
          <span>Reports visible</span>
          <strong>{stats?.reports ?? 0}</strong>
        </article>
      </section>

      <section className="panel">
        <span className="eyebrow">Current Access</span>
        <h2>Resolved Permissions</h2>
        <p>These atoms are what the middleware and backend are using right now to make access decisions.</p>
        <div className="chip-grid">
          {user.permissions.map((permission) => (
            <span key={permission} className="permission-chip">
              {permission}
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <span className="eyebrow">Visible Routes</span>
        <h2>Navigation From Permissions</h2>
        <div className="module-list">
          {sidebar.map((item) => (
            <article key={item.href} className="module-card">
              <strong>{item.label}</strong>
              <span>{item.href}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
