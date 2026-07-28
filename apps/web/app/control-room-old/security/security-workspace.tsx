import { PermissionValidator, SecurityManifest, defaultActionPolicies } from '@ubos/shared';

const sampleAuditEvents = [
  { id: 'audit-001', action: 'switch.cut', actor: 'Director', decision: 'allow' },
  { id: 'audit-002', action: 'ai.execute', actor: 'AI Assistant', decision: 'needs approval' },
];

export function SecurityEmptyState() {
  return <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-slate-400">No enterprise auth provider is connected. Phase 26 uses deterministic local security metadata only.</div>;
}

export function SecurityWorkspace() {
  const directorPermissions = PermissionValidator.permissionsForRole('director');
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">UBOS Security</p>
        <h1 className="text-3xl font-black">Security Dashboard</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold">Roles & Permissions</h2><p className="text-sm text-slate-300">{SecurityManifest.roles.length} valid roles and {SecurityManifest.permissions.length} valid permissions. Director has {directorPermissions.length} permissions.</p></section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold">Active Operators</h2><p className="text-sm text-slate-300">Director, Producer, Audio Engineer, Observer, AI Assistant.</p></section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold">Approval Queue</h2><p className="text-sm text-slate-300">AI execution and destructive scene changes require approval metadata.</p></section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold">Audit Trail</h2>{sampleAuditEvents.map((event) => <p key={event.id} className="text-sm text-slate-300">{event.id}: {event.actor} {event.action} → {event.decision}</p>)}</section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold">Policy Inspector</h2><p className="text-sm text-slate-300">{defaultActionPolicies.length} deterministic action policies loaded.</p></section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><h2 className="font-bold">Session Security</h2><p className="text-sm text-slate-300">No secrets, passwords, tokens, or unsafe HTML are required.</p></section>
        <SecurityEmptyState />
      </div>
    </main>
  );
}
