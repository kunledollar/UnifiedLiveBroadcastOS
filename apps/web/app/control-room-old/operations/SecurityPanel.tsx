import { PermissionValidator } from '@ubos/shared';

export function SecurityPanel() {
  const role = 'director';
  const permissions = PermissionValidator.permissionsForRole(role);
  return (
    <div className="space-y-ubos-2 text-ubos-caption text-ubos-fg-secondary">
      <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-2">
        <p className="text-ubos-metadata font-semibold uppercase text-ubos-fg-muted">Current role</p>
        <p className="text-ubos-body font-semibold text-ubos-fg-primary">{role}</p>
      </div>
      <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-2">Permission status: {permissions.length} permissions active</div>
      <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-2">Pending approvals: AI execution, destructive changes</div>
      <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-2">Recent audit events: switch.cut allowed, ai.execute needs approval</div>
      <div className="rounded-ubos-md border border-amber-400/30 bg-amber-400/10 p-ubos-2 text-amber-100">Policy warnings: enforcement is read-only for Phase 26.</div>
    </div>
  );
}
