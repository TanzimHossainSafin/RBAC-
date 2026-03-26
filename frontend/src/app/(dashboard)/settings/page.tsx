"use client";

import { useAuth } from "@/components/auth-provider";

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <section className="panel">
      <span className="eyebrow">Settings</span>
      <h2>Profile & Access</h2>
      <div className="resource-list">
        <article className="resource-card">
          <div className="resource-row">
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>
          <div className="resource-row">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div className="resource-row">
            <span>Role</span>
            <strong>{user.role}</strong>
          </div>
          <div className="resource-row">
            <span>Status</span>
            <strong>{user.status}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}
