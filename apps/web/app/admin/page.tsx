const panels = [
  ['Admin Dashboard', 'Enterprise overview, plan posture, policy health, quota warnings, and recent audit activity.'],
  ['Organizations', 'Metadata for organization identity, ownership, regions, workspace membership, and lifecycle status.'],
  ['Tenants', 'Tenant isolation mode, status, workspace accounts, users, and quota envelopes.'],
  ['Users', 'Enterprise users with deterministic role assignments and account status only.'],
  ['Teams', 'Team and department membership for production and administrative groups.'],
  ['Roles', 'Owner, admin, billing admin, compliance admin, technical admin, production admin, workspace admin, operator, viewer, and guest roles.'],
  ['Workspaces', 'Workspace account metadata grouped by tenant, region, and status.'],
  ['Licensing', 'Metadata-only plans, seats, allocations, and subscription descriptors without providers or payment processing.'],
  ['Usage & Quotas', 'User, workspace, studio, guest, output, recording, storage, cloud node, plugin, and API client limits.'],
  ['Policies', 'Administrative approval, governance, and quota policies for enterprise account management.'],
  ['Compliance', 'Compliance controls, retention metadata, and audit readiness signals.'],
  ['Audit Trail', 'Append-only administrative events suitable for deterministic serialization.'],
  ['Admin Settings', 'Safe enterprise settings for future SSO, billing, and cloud account integrations.'],
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-10 text-slate-100">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-8">
          <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-cyan-200">UBOS Enterprise Administration</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Admin Dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">Metadata-first organization, tenant, licensing, quota, policy, compliance, and audit foundation. This UI intentionally excludes passwords, OAuth tokens, payment secrets, billing providers, and external account provisioning.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {panels.map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
              <h2 className="text-lg font-black text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
