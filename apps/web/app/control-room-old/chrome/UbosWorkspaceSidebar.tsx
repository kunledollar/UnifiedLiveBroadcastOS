'use client';

/**
 * UBOS Next-Gen Chrome — Workspace Sidebar
 *
 * Text-based workspace navigator matching the reference design.
 * Shows primary workspaces, specialist workspaces, workspace-specific tools,
 * system health summary, and an "+ Add Workspace" action.
 *
 * Replaces the old icon-only command rail with a proper 210px sidebar that
 * lets operators identify and switch workspaces at a glance.
 */
import { useState, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import { getWorkspaceDefinition, type WorkspacePresetId } from '@ubos/shared';
import {
  PRIMARY_WORKSPACE_IDS,
  SPECIALIST_WORKSPACE_IDS,
  workspaceChromeDefs,
  type ChromeToolGroup,
} from './chrome-workspace-defs';

/* ─── Workspace name label ──────────────────────────────────────────────── */

function workspaceLabel(id: WorkspacePresetId): string {
  try {
    return getWorkspaceDefinition(id).name;
  } catch {
    return id
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}

/* ─── Single nav item ───────────────────────────────────────────────────── */

function WorkspaceNavItem({
  id,
  active,
  onSelect,
}: {
  id: WorkspacePresetId;
  active: boolean;
  onSelect: (id: WorkspacePresetId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={active}
      title={workspaceChromeDefs[id].tagline}
      className={cn(
        'group relative flex w-full items-center gap-2 rounded-lg px-3 py-1.5',
        'text-left text-[12px] font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6af7]/60',
        active
          ? 'bg-[#7c6af7]/15 text-white'
          : 'text-[#64748b] hover:bg-white/5 hover:text-[#94a3b8]',
      )}
    >
      {/* Active left bar */}
      {active && (
        <span
          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[#7c6af7]"
          aria-hidden="true"
        />
      )}
      <span className="truncate">{workspaceLabel(id)}</span>
    </button>
  );
}

/* ─── Tool item ──────────────────────────────────────────────────────────── */

function ToolNavItem({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-3 py-1 text-left',
        'text-[11px] text-[#475569] transition-colors duration-150',
        'hover:bg-white/5 hover:text-[#94a3b8]',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#7c6af7]/40',
      )}
    >
      <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-50" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </button>
  );
}

/* ─── Section label ─────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-1 px-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
      {children}
    </p>
  );
}

/* ─── System health dot ─────────────────────────────────────────────────── */

function HealthDot({ healthy }: { healthy: boolean }) {
  return (
    <span
      className={cn(
        'inline-block h-1.5 w-1.5 rounded-full',
        healthy ? 'bg-emerald-400' : 'bg-red-400',
      )}
      aria-hidden="true"
    />
  );
}

/* ─── Main sidebar ──────────────────────────────────────────────────────── */

export type SystemHealthEntry = {
  label: string;
  healthy: boolean;
};

export type UbosWorkspaceSidebarProps = {
  activePresetId: WorkspacePresetId;
  onSelectPreset: (id: WorkspacePresetId) => void;
  onToolAction: (action: ChromeToolGroup['tools'][number]['action']) => void;
  onAddWorkspace?: () => void;
  systemHealth?: SystemHealthEntry[];
  className?: string;
};

export function UbosWorkspaceSidebar({
  activePresetId,
  onSelectPreset,
  onToolAction,
  onAddWorkspace,
  systemHealth = [],
  className,
}: UbosWorkspaceSidebarProps) {
  // Workspace switching is a primary control-room action, not a hidden
  // preference. Start expanded so every role has an immediately visible,
  // clearly bounded destination in the navigation panel.
  const [specialistExpanded, setSpecialistExpanded] = useState(true);
  const def = workspaceChromeDefs[activePresetId];

  const showSpecialist =
    specialistExpanded || SPECIALIST_WORKSPACE_IDS.includes(activePresetId);

  return (
    <aside
      className={cn(
        'flex w-[210px] shrink-0 flex-col overflow-hidden border-r border-[#1e2530] bg-[#080c12]',
        className,
      )}
      aria-label="Workspace navigation"
      data-testid="ubos-workspace-sidebar"
    >
      {/* Scrollable nav area */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-3 ubos-scroll">

        {/* Primary workspaces */}
        <nav aria-label="Core workspaces">
          <SectionLabel>Workspaces</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {PRIMARY_WORKSPACE_IDS.map((id) => (
              <WorkspaceNavItem
                key={id}
                id={id}
                active={activePresetId === id}
                onSelect={onSelectPreset}
              />
            ))}
          </div>
        </nav>

        {/* Specialist workspaces (collapsible) */}
        <nav aria-label="Specialist workspaces">
          <button
            type="button"
            onClick={() => setSpecialistExpanded((v) => !v)}
            className={cn(
              'mb-1 flex w-full items-center justify-between px-3',
              'text-[9px] font-black uppercase tracking-[0.18em]',
              'text-[#334155] transition-colors hover:text-[#475569]',
              'focus-visible:outline-none',
            )}
            aria-expanded={showSpecialist}
          >
            <span>Specialist</span>
            <svg
              width="8"
              height="8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn('transition-transform duration-150', showSpecialist ? 'rotate-180' : '')}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showSpecialist && (
            <div className="flex flex-col gap-0.5">
              {SPECIALIST_WORKSPACE_IDS.map((id) => (
                <WorkspaceNavItem
                  key={id}
                  id={id}
                  active={activePresetId === id}
                  onSelect={onSelectPreset}
                />
              ))}
            </div>
          )}
        </nav>

        {/* Workspace-specific tools */}
        {def.toolGroups.map((group) => (
          <div key={group.label}>
            <SectionLabel>{group.label}</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {group.tools.map((tool) => (
                <ToolNavItem
                  key={tool.id}
                  label={tool.label}
                  onClick={() => onToolAction(tool.action)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* System health */}
      {systemHealth.length > 0 && (
        <div className="shrink-0 border-t border-[#1e2530] px-3 py-2">
          <SectionLabel>System Health</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {systemHealth.slice(0, 5).map((entry) => (
              <div key={entry.label} className="flex items-center gap-2 px-0 py-0.5">
                <HealthDot healthy={entry.healthy} />
                <span className="truncate text-[10px] text-[#475569]">{entry.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Workspace */}
      <div className="shrink-0 border-t border-[#1e2530] p-3">
        <button
          type="button"
          onClick={onAddWorkspace}
          className={cn(
            'flex w-full items-center justify-center gap-1.5 rounded-lg border',
            'border-dashed border-[#1e2530] px-3 py-1.5',
            'text-[11px] text-[#334155] transition-colors duration-150',
            'hover:border-[#7c6af7]/40 hover:text-[#7c6af7]/70',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6af7]/40',
          )}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Workspace</span>
        </button>
      </div>
    </aside>
  );
}
