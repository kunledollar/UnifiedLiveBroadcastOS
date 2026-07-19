'use client';

import { useState } from 'react';
import type { RuntimeHealth } from '../../lib/runtime/runtime-health';

export function RuntimeManagerScreen({ initialHealth }: { initialHealth: RuntimeHealth }) {
  const [health, setHealth] = useState(initialHealth);
  const [retrying, setRetrying] = useState(false);
  const retry = async () => {
    setRetrying(true);
    try {
      const response = await fetch('/api/runtime/health?retry=1', { cache: 'no-store' });
      setHealth((await response.json()) as RuntimeHealth);
    } finally {
      setRetrying(false);
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-ubos-carbon p-6 text-ubos-fg-primary">
      <section className="w-full max-w-2xl rounded-ubos-md border border-amber-500/40 bg-ubos-midnight p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
          UBOS Runtime Manager
        </p>
        <h1 className="mt-2 text-2xl font-semibold">
          {health.status === 'blocked' ? 'Startup blocked' : 'Runtime degraded'}
        </h1>
        <p className="mt-2 text-sm text-ubos-fg-muted">
          UBOS checks required services before opening the Control Room. No saved-session changes
          are attempted while this screen is shown.
        </p>
        <div className="mt-6 space-y-3">
          {health.services.map((service) => (
            <article
              key={service.id}
              className="rounded border border-ubos-border-subtle bg-ubos-graphite p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium">{service.displayName}</h2>
                <span className="rounded bg-red-500/15 px-2 py-1 text-xs font-semibold uppercase text-red-300">
                  {service.status}
                </span>
              </div>
              <p className="mt-2 text-sm">{service.message}</p>
              <p className="mt-1 text-xs text-ubos-fg-muted">
                Last checked {new Date(service.lastCheckedAt).toLocaleTimeString()}{' '}
                {service.latencyMs !== undefined ? `· ${service.latencyMs}ms` : ''}
              </p>
              <details className="mt-3 text-xs text-ubos-fg-muted">
                <summary className="cursor-pointer">Open diagnostics</summary>
                <p className="mt-2">
                  {service.technicalDetail ?? 'No additional diagnostics available.'}
                </p>
                <p className="mt-1">{service.recoveryAction}</p>
              </details>
            </article>
          ))}
        </div>
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="mt-6 rounded bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {retrying ? 'Checking…' : 'Retry'}
        </button>
        <p className="mt-3 text-xs text-ubos-fg-muted">
          Offline mode is not available: this Control Room persists scenes and production state to
          PostgreSQL.
        </p>
      </section>
    </main>
  );
}
