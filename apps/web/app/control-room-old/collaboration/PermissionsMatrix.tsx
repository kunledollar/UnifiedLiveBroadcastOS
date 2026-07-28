'use client';

import type { ProfessionalOperatorRole } from '@ubos/shared';
import { roleWorkspaceMappings } from '@ubos/shared';
import { ConsoleSection, InspectorRow, cn, ubosTypographyClasses } from '@ubos/ui';

export function PermissionsMatrix({
  selectedRole,
  className,
}: {
  selectedRole?: ProfessionalOperatorRole;
  className?: string;
}) {
  const mapping = selectedRole
    ? roleWorkspaceMappings.find((item) => item.role === selectedRole)
    : undefined;

  return (
    <ConsoleSection title="Permissions Matrix">
      <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
        Future-ready permission UI · Not enforced in this phase
      </p>
      {mapping ? (
        <>
          <InspectorRow label="Role" value={mapping.label} />
          <InspectorRow label="Workspace" value={mapping.preferredWorkspaceId} />
          <InspectorRow label="Panels" value={mapping.panels.join(', ')} />
        </>
      ) : (
        <InspectorRow label="Role" value="not selected" />
      )}
      <div className="mt-2 space-y-1">
        {roleWorkspaceMappings.map((item) => (
          <div
            key={item.role}
            className={cn(
              'rounded-ubos-sm px-2 py-1 text-ubos-caption',
              item.role === selectedRole ? 'bg-ubos-selection-muted text-ubos-fg-primary' : 'text-ubos-fg-muted',
            )}
          >
            {item.label} → {item.preferredWorkspaceId}
          </div>
        ))}
      </div>
    </ConsoleSection>
  );
}
