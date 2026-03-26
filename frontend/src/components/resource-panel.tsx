"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";

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
        </div>
      </div>

      {loading ? <div className="empty-state">Loading...</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}
      {!loading && !error && items.length === 0 ? <div className="empty-state">{emptyMessage}</div> : null}

      <div className="resource-list">
        {items.map((item, index) => (
          <article key={String(item.id ?? index)} className="resource-card">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="resource-row">
                <span>{key.replace(/_/g, " ")}</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
