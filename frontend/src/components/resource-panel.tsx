"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ResourcePanel({
  title,
  endpoint,
  emptyMessage,
}: {
  title: string;
  endpoint: string;
  emptyMessage: string;
}) {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await apiFetch<Record<string, Record<string, unknown>[]>>(endpoint);
        const [firstKey] = Object.keys(data);
        if (active) {
          setItems((data[firstKey] as Record<string, unknown>[]) ?? []);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [apiFetch, endpoint]);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">{title}</span>
          <h2>{title}</h2>
          <p>Permission-aware data rendered from the live API for the current account scope.</p>
        </div>
        {!loading && !error ? <div className="status-pill">{items.length} records</div> : null}
      </div>

      {loading ? <div className="empty-state">Loading...</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}
      {!loading && !error && items.length === 0 ? <div className="empty-state">{emptyMessage}</div> : null}

      <div className="resource-list">
        {items.map((item, index) => {
          const orderedEntries = Object.entries(item).filter(([key]) => key !== "id");
          const [primary, ...rest] = orderedEntries;

          return (
            <article key={String(item.id ?? index)} className="resource-card">
              {primary ? (
                <div className="resource-card-head">
                  <strong>{String(primary[1])}</strong>
                  <span>{formatLabel(primary[0])}</span>
                </div>
              ) : null}

              <div className="resource-meta-grid">
                {rest.map(([key, value]) => (
                  <div key={key} className="resource-row">
                    <span>{formatLabel(key)}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
