'use client';

import { cn } from '@ubos/ui';
import { workspaceProfileList } from './workspace-presets';
import type { ProfessionalWorkspaceId } from './workspace-types';

export function WorkspaceSelector({
  selected,
  onSelect,
  className,
}: {
  selected: ProfessionalWorkspaceId;
  onSelect: (id: ProfessionalWorkspaceId) => void;
  className?: string;
}) {
  return (
    <details className={cn('group relative', className)}>
      <summary className="flex h-6 cursor-pointer list-none items-center gap-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight px-2 text-ubos-metadata font-medium text-ubos-fg-secondary hover:bg-ubos-slate">
        <span className="text-ubos-fg-muted">Workspace</span>
        <span className="text-ubos-fg-primary">
          {workspaceProfileList.find((profile) => profile.id === selected)?.label ?? 'Director'}
        </span>
        <span aria-hidden="true" className="text-ubos-fg-muted">
          ▼
        </span>
      </summary>
      <div className="absolute right-0 z-30 mt-1 grid max-h-[70vh] min-w-52 gap-0.5 overflow-y-auto rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon p-2 text-ubos-caption text-ubos-fg-secondary shadow-ubos-raised">
        {workspaceProfileList.map((profile) => {
          const active = profile.id === selected;
          return (
            <button
              key={profile.id}
              type="button"
              aria-pressed={active}
              className={cn(
                'rounded-ubos-sm px-2 py-1.5 text-left transition-colors duration-ubos-fast',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'hover:bg-ubos-midnight',
              )}
              onClick={() => onSelect(profile.id)}
            >
              {profile.label}
              <span className="block text-ubos-metadata text-ubos-fg-muted">{profile.description}</span>
            </button>
          );
        })}
      </div>
    </details>
  );
}
