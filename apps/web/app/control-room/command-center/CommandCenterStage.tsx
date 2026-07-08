'use client';

/**
 * UBOS 3.15D-2 — Center Stage.
 *
 * Hosts the EXISTING Program and Preview monitor nodes plus the existing
 * transition controls (CUT / TAKE / AUTO). The monitor renderers are passed
 * in unchanged and stay mounted at all times — fullscreen is implemented by
 * fixing the same cell to the viewport so live media never remounts.
 *
 * Center Stage Layout Contract (3.15D-2):
 *   Program:  visually dominant, never hidden, never collapsed, 16:9 where
 *             possible, minimum 800×450, preferred 1200×675.
 *   Preview:  secondary but large, never hidden, never collapsed, 16:9 where
 *             possible, minimum 480×270, preferred 800×450.
 *
 *   Desktop (≥1200px center width):  Program and Preview side-by-side.
 *   Laptop  (900–1199px):            Program dominant, Preview beside/below.
 *   Small   (<900px):                Program above Preview, stacked.
 *
 * Safety rules:
 *   - No dock, panel, tooltip, menu, or overlay may cover Program.
 *   - Preview may only be covered by explicit fullscreen/dialog behavior.
 *   - Transition controls remain directly accessible below monitors.
 *
 * One Owner Rule (3.15C/D): Program and Preview have NO secondary homes.
 * Center Stage is their sole primary home; no other zone may host them.
 */
import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { WorkspaceCenterEmphasis } from '@ubos/shared';
import { broadcastMonitor, broadcastSurfaces } from '../broadcast-command-center/broadcast-theme';
import { MonitorOverlay, type MonitorOverlayData } from './MonitorOverlay';
import type { CommandCenterFullscreenTarget } from './useCommandCenterWorkspace';

type MonitorRole = 'program' | 'preview';

/**
 * Program share of the monitor axis per emphasis. Program always receives
 * more space than Preview, per the Center Stage layout contract (Program
 * ~60–65% of the video area in the default Director workspace).
 */
function programShare(emphasis: WorkspaceCenterEmphasis): number {
  switch (emphasis) {
    case 'program':
      return 0.68;
    case 'preview':
      return 0.56;
    case 'balanced':
    default:
      return 0.65;
  }
}

function SafeAreaOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {/* Action safe — 90% */}
      <div className="absolute inset-[5%] border border-dashed border-white/30" />
      {/* Title safe — 80% */}
      <div className="absolute inset-[10%] border border-dotted border-white/20" />
      {/* Center cross */}
      <div className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/25" />
      <div className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-white/25" />
      {/* Labels */}
      <span className="absolute left-[5%] top-[5%] translate-x-1 translate-y-0.5 text-[8px] font-bold uppercase tracking-widest text-white/30">
        Action
      </span>
      <span className="absolute left-[10%] top-[10%] translate-x-1 translate-y-0.5 text-[8px] font-bold uppercase tracking-widest text-white/25">
        Title
      </span>
    </div>
  );
}

function StageMonitorCell({
  role,
  monitor,
  overlay,
  safeAreasVisible,
  fullscreen,
  onToggleFullscreen,
  style,
  className,
}: {
  role: MonitorRole;
  monitor: ReactNode;
  overlay: MonitorOverlayData;
  safeAreasVisible: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  style?: CSSProperties;
  className?: string;
}) {
  const chrome = broadcastMonitor[role];
  const roleLabel = role === 'program' ? 'Program' : 'Preview';

  return (
    <div
      {...(role === 'program' ? { 'data-ubos-program-monitor': 'true' } : {})}
      {...(role === 'preview' ? { 'data-ubos-preview-monitor': 'true' } : {})}
      className={cn(
        'group/monitor flex min-h-0 min-w-0 flex-col overflow-hidden',
        'rounded-ubos-md border',
        broadcastSurfaces.monitorWell,
        chrome.border,
        chrome.glow,
        fullscreen && 'fixed inset-0 z-[80] rounded-none border-0',
        className,
      )}
      style={fullscreen ? undefined : style}
      aria-label={`${roleLabel} monitor`}
    >
      {/* Monitor header — compact single row with role badge and fullscreen toggle */}
      <header
        className={cn(
          'flex shrink-0 items-center gap-2 border-b px-2 py-1',
          chrome.headerBg,
          chrome.headerBorder,
        )}
      >
        <span
          className={cn(
            'shrink-0 text-[10px] font-black uppercase tracking-[0.22em]',
            chrome.label,
          )}
        >
          {roleLabel}
        </span>
        <span className="min-w-0 flex-1" />

        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={cn(
            'shrink-0 rounded-ubos-sm border px-1.5 py-px',
            'text-[9px] font-bold uppercase tracking-wide',
            'transition-colors duration-[var(--ubos-duration-fast)]',
            'hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
            chrome.chip,
          )}
          aria-label={
            fullscreen
              ? `Exit ${roleLabel} fullscreen`
              : `Enter ${roleLabel} fullscreen`
          }
          title={fullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}
        >
          {fullscreen ? '⊠ Exit' : '⊡ Full'}
        </button>
      </header>

      {/* Monitor canvas — fills remaining height; overlay and safe areas are
          absolutely positioned so they never push the video surface. */}
      <div className="relative min-h-0 min-w-0 flex-1">
        {/* Existing monitor renderer — mounted unchanged, never wrapped in
            anything that intercepts its pointer events. */}
        <div className="absolute inset-0">{monitor}</div>
        <MonitorOverlay role={role} data={overlay} />
        {safeAreasVisible ? <SafeAreaOverlay /> : null}
      </div>
    </div>
  );
}

// Height budget reserved for non-monitor chrome when stacked: switcher panel
// (~184 px max-height via --ubos-switcher-height), monitor headers (2×32 px),
// section gaps, and a small margin.  Used only to cap stacked min-heights.
const STACKED_CHROME_RESERVE_PX = 200;

// Absolute floor below which a monitor's min-height will never be pushed,
// even on very small viewports, to keep the video surface legible.
const PROGRAM_MIN_HEIGHT_FLOOR_PX = 180;
const PREVIEW_MIN_HEIGHT_FLOOR_PX = 108;

export function CommandCenterStage({
  programMonitor,
  previewMonitor,
  programOverlay,
  previewOverlay,
  switcherContent,
  emphasis,
  stacked,
  safeAreasVisible,
  fullscreenMonitor,
  onFullscreenChange,
  viewportHeight,
  className,
}: {
  programMonitor: ReactNode;
  previewMonitor: ReactNode;
  programOverlay: MonitorOverlayData;
  previewOverlay: MonitorOverlayData;
  switcherContent: ReactNode;
  emphasis: WorkspaceCenterEmphasis;
  stacked: boolean;
  safeAreasVisible: boolean;
  fullscreenMonitor: CommandCenterFullscreenTarget;
  onFullscreenChange: (target: CommandCenterFullscreenTarget) => void;
  /**
   * Height of the center-stage zone (px), supplied by the shell from the
   * Workspace Manager layout.  Used only when stacked to cap each monitor's
   * min-height so the pair never exceeds the available vertical space and
   * causes an unwanted scrollbar on very small viewports.
   */
  viewportHeight?: number;
  className?: string;
}) {
  const share = programShare(emphasis);

  useEffect(() => {
    if (!fullscreenMonitor) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onFullscreenChange(null);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [fullscreenMonitor, onFullscreenChange]);

  const toggleFullscreen = (role: MonitorRole) => {
    onFullscreenChange(fullscreenMonitor === role ? null : role);
  };

  // Center Stage Layout Contract (3.15D-2):
  //   Program: min 800×450; flex share = programShare(emphasis)
  //   Preview: min 480×270; flex share = 1 - programShare(emphasis)
  //   Stacked (center width <900): min-h for program 450, preview 270
  //   Side-by-side: min-w for program 800, preview 480
  //
  // Using CSS min-* alongside flex so the browser enforces the floor while
  // still allowing the monitors to expand to fill all freed space.
  //
  // Min-height cap (stacked only): when viewportHeight is provided the nominal
  // min-heights (450 / 270) are capped to each monitor's proportional share of
  // the available height after reserving STACKED_CHROME_RESERVE_PX for switcher
  // and monitor chrome.  This prevents the stacked pair from overflowing the
  // zone on very small viewports without altering the flex share or geometry.
  let programMinH = 450;
  let previewMinH = 270;
  if (stacked && viewportHeight) {
    const available = Math.max(STACKED_CHROME_RESERVE_PX, viewportHeight - STACKED_CHROME_RESERVE_PX);
    programMinH = Math.max(PROGRAM_MIN_HEIGHT_FLOOR_PX, Math.min(450, Math.floor(available * share)));
    previewMinH = Math.max(PREVIEW_MIN_HEIGHT_FLOOR_PX, Math.min(270, Math.floor(available * (1 - share))));
  }

  const programMinStyle: CSSProperties = stacked
    ? { flex: `${share} 1 0%`, minHeight: programMinH }
    : { flex: `${share} 1 0%`, minWidth: 800 };
  const previewMinStyle: CSSProperties = stacked
    ? { flex: `${1 - share} 1 0%`, minHeight: previewMinH }
    : { flex: `${1 - share} 1 0%`, minWidth: 480 };

  return (
    <section
      className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-1.5', className)}
      aria-label="Center stage — Program and Preview monitors"
      data-ubos-center-stage="3.15d"
    >
      {/* Fullscreen backdrop */}
      {fullscreenMonitor ? (
        <div
          className="fixed inset-0 z-[75] bg-black/90 backdrop-blur-sm transition-opacity duration-[var(--ubos-duration-normal)]"
          aria-hidden="true"
          onClick={() => onFullscreenChange(null)}
        />
      ) : null}

      {/* Monitor bay — Program is always rendered first (DOM order = visual
          priority). When stacked, Program occupies the upper slot; when
          side-by-side, Program occupies the left slot. The bay uses overflow-
          auto (not overflow-hidden) so that if the viewport is smaller than
          the minimum monitor sizes the operator can still scroll to see both
          monitors — Program is never clipped out of view. */}
      <div
        className={cn(
          'flex min-h-0 min-w-0 flex-1 gap-1.5',
          stacked ? 'flex-col overflow-y-auto' : 'flex-row overflow-x-auto',
        )}
      >
        <StageMonitorCell
          role="program"
          monitor={programMonitor}
          overlay={programOverlay}
          safeAreasVisible={safeAreasVisible}
          fullscreen={fullscreenMonitor === 'program'}
          onToggleFullscreen={() => toggleFullscreen('program')}
          style={programMinStyle}
          className={stacked ? '' : 'min-w-0'}
        />
        <StageMonitorCell
          role="preview"
          monitor={previewMonitor}
          overlay={previewOverlay}
          safeAreasVisible={safeAreasVisible}
          fullscreen={fullscreenMonitor === 'preview'}
          onToggleFullscreen={() => toggleFullscreen('preview')}
          style={previewMinStyle}
          className={stacked ? '' : 'min-w-0'}
        />
      </div>

      {/* Transition controls (existing CUT / TAKE / AUTO switcher) — always
          directly accessible below the monitors, never overlapping them.
          The switcher is rendered in the normal flow so it cannot cover
          Program or Preview. */}
      {switcherContent ? (
        <div
          className={cn(
            'shrink-0 overflow-hidden rounded-ubos-md border shadow-ubos-raised',
            broadcastSurfaces.panel,
          )}
          style={{ maxHeight: 'var(--ubos-switcher-height, 11.5rem)' }}
        >
          {switcherContent}
        </div>
      ) : null}
    </section>
  );
}
