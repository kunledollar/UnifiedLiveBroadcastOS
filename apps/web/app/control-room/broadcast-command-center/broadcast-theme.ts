/**
 * Shared visual tokens for the Broadcast Command Center.
 * Updated: UBOS 3.15C — visual polish layer
 *
 * Uses @ubos/ui design-system classes — avoid hardcoded accent colors.
 */

export const broadcastSurfaces = {
  app: 'bg-ubos-carbon text-ubos-fg-secondary',
  header: 'border-ubos-border-subtle bg-ubos-carbon',
  menuBar: 'border-ubos-border-subtle bg-ubos-graphite/60',
  panel: 'border-ubos-border-subtle bg-ubos-graphite',
  panelHeader: 'border-ubos-border-subtle bg-ubos-midnight/90',
  rail: 'border-ubos-border-subtle bg-ubos-carbon',
  dock: 'border-ubos-border-subtle bg-ubos-graphite',
  monitorWell: 'bg-black',
} as const;

export const broadcastDock = {
  /** 3.15C: tab active state uses text + underline indicator (no blob bg) */
  tabActive:
    'text-ubos-fg-primary',
  tabInactive:
    'text-ubos-fg-muted hover:text-ubos-fg-secondary',
  tabBar: 'border-ubos-border-subtle bg-ubos-midnight/40',
  collapseButton:
    'rounded-ubos-sm px-1.5 py-0.5 text-[10px] text-ubos-fg-muted transition-colors hover:bg-ubos-midnight hover:text-ubos-fg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
} as const;

/**
 * Quick-action button used by secondary surfaces to navigate to a panel's
 * primary home (One Owner Rule). Does NOT render a duplicate editor inline.
 */
export const broadcastQuickAction =
  'rounded-ubos-sm border border-ubos-border-default bg-ubos-midnight/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ubos-fg-secondary transition-colors hover:border-ubos-border-strong hover:bg-ubos-midnight hover:text-ubos-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60';

/**
 * Compact status chip for secondary surfaces (One Owner Rule).
 * Shows a status at-a-glance without rendering a full editor.
 */
export const broadcastStatusChip = {
  live: 'inline-flex items-center gap-1 rounded-full border border-ubos-program-border/50 bg-ubos-program-muted px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-ubos-program-text',
  ready: 'inline-flex items-center gap-1 rounded-full border border-ubos-preview-border/50 bg-ubos-preview-muted px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-ubos-preview-text',
  warning: 'inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-amber-300',
  neutral: 'inline-flex items-center gap-1 rounded-full border border-ubos-border-subtle bg-ubos-midnight px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-ubos-fg-muted',
} as const;

export const broadcastMonitor = {
  program: {
    border: 'border-ubos-program-border/55',
    glow: 'shadow-[0_0_48px_var(--ubos-program-glow)]',
    headerBg: 'bg-ubos-program-muted/80',
    headerBorder: 'border-ubos-program-border/40',
    label: 'text-ubos-program-text',
    chip: 'border-ubos-program-border/45 bg-ubos-program-muted text-ubos-program-text',
    stateChip: 'border-ubos-program-border/40 bg-ubos-program-muted text-ubos-program-text',
  },
  preview: {
    border: 'border-ubos-preview-border/55',
    glow: 'shadow-[0_0_40px_var(--ubos-preview-glow)]',
    headerBg: 'bg-ubos-preview-muted/80',
    headerBorder: 'border-ubos-preview-border/40',
    label: 'text-ubos-preview-text',
    chip: 'border-ubos-preview-border/45 bg-ubos-preview-muted text-ubos-preview-text',
    stateChip: 'border-ubos-preview-border/40 bg-ubos-preview-muted text-ubos-preview-text',
  },
} as const;

/** Default program/preview column weights — program-dominant. */
export const DEFAULT_PROGRAM_FLEX = 72;
export const DEFAULT_PREVIEW_FLEX = 28;
