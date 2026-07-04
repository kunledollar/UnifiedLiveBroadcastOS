'use client';

import type { ProfessionalOperatorRole, RoleWorkspaceMapping } from '@ubos/shared';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { getRoleWorkspaceMapping } from '@ubos/shared';

export function OperatorRoleCard({
  role,
  mapping,
  active = false,
  onSelect,
}: {
  role: ProfessionalOperatorRole;
  mapping?: RoleWorkspaceMapping;
  active?: boolean;
  onSelect?: () => void;
}) {
  const resolved = mapping ?? getRoleWorkspaceMapping(role);
  if (!resolved) return null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-ubos-sm border px-ubos-2 py-2 text-left transition-colors',
        active
          ? 'border-ubos-selection-border bg-ubos-selection-muted'
          : 'border-ubos-border-subtle bg-ubos-midnight/50 hover:bg-ubos-midnight',
      )}
    >
      <div className="flex items-center justify-between gap-ubos-2">
        <span className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>
          {resolved.label}
        </span>
        <StatusBadge variant="neutral">{resolved.preferredWorkspaceId}</StatusBadge>
      </div>
      <p className={cn(ubosTypographyClasses.metadata, 'mt-1 text-ubos-fg-muted')}>
        {resolved.description}
      </p>
      <p className={cn(ubosTypographyClasses.caption, 'mt-1 text-ubos-fg-muted')}>
        Panels: {resolved.panels.join(' · ')}
      </p>
    </button>
  );
}
