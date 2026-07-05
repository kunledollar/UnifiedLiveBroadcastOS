'use client';

const auditEvents = ['organization.updated', 'license.allocated', 'quota.warning'];

export function EnterpriseAdminPanel() {
  return (
    <div className="space-y-ubos-2 text-ubos-caption text-ubos-fg-secondary">
      <section className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-2">
        <p className="text-ubos-metadata font-semibold uppercase tracking-wide text-ubos-accent">Enterprise/Admin</p>
        <h3 className="mt-1 text-ubos-body font-semibold text-ubos-fg-primary">UBOS Network Operations</h3>
        <dl className="mt-2 grid grid-cols-2 gap-2">
          <div><dt className="text-ubos-fg-muted">Plan</dt><dd className="text-ubos-fg-primary">enterprise</dd></div>
          <div><dt className="text-ubos-fg-muted">Seat usage</dt><dd className="text-ubos-fg-primary">42 / 64</dd></div>
          <div><dt className="text-ubos-fg-muted">Active policies</dt><dd className="text-ubos-fg-primary">4</dd></div>
          <div><dt className="text-ubos-fg-muted">Quota warnings</dt><dd className="text-amber-200">2</dd></div>
        </dl>
      </section>
      <section className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon p-ubos-2">
        <p className="text-ubos-metadata font-semibold uppercase tracking-wide text-ubos-fg-muted">Recent audit events</p>
        <ul className="mt-2 space-y-1">
          {auditEvents.map((event) => <li key={event} className="rounded-ubos-sm bg-ubos-midnight px-2 py-1 font-mono">{event}</li>)}
        </ul>
      </section>
    </div>
  );
}
