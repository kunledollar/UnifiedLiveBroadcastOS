'use client';

/**
 * UBOS 3.15B — Center Stage.
 *
 * Hosts the EXISTING Program and Preview monitor nodes plus the existing
 * transition controls (CUT / TAKE / AUTO). The monitor renderers are passed
 * in unchanged and stay mounted at all times — fullscreen is implemented by
 * fixing the same cell to the viewport so live media never remounts.
 *
 * Geometry contract (5A): Program is always dominant, monitors keep priority
 * over every dock, transition controls sit below the monitors and never
 * overlap them, and safe-area overlays scale with the monitor because they
 * are percentage-based.
 */
import { useEffect, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { WorkspaceCenterEmphasis } from '@ubos/shared';
import { broadcastMonitor, broadcastSurfaces } from '../broadcast-command-center/broadcast-theme';
import { MonitorOverlay, type MonitorOverlayData } from './MonitorOverlay';
import type { CommandCenterFullscreenTarget } from './useCommandCenterWorkspace';

type MonitorRole = 'program' | 'preview';

/**
 * Program share of the monitor axis per emphasis. Program always receives
 * more space than Preview, per the Center Stage layout contract.
 */
function programShare(emphasis: WorkspaceCenterEmphasis): number {
  switch (emphasis) {
    case 'program':
      return 0.65;
    case 'preview':
      return 0.55;
    case 'balanced':
    default:
      return 0.62;
  }
}

function SafeAreaOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
      {/* Action safe — 90% */}
      <div className="absolute inset-[5%] border border-dashed border-white/35" />
      {/* Title safe — 80% */}
      <div className="absolute inset-[10%] border border-dotted border-white/25" />
      {/* Center cross */}
      <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-white/30" />
      <div className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-white/30" />
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
  style?: React.CSSProperties;
  className?: string;
}) {
  const chrome = broadcastMonitor[role];

  return (
    <div
      {...(role === 'program' ? { 'data-ubos-program-monitor': 'true' } : {})}
      className={cn(
        'group/monitor flex min-h-0 min-w-0 flex-col overflow-hidden rounded-ubos-md border',
        broadcastSurfaces.monitorWell,
        chrome.border,
        chrome.glow,
        fullscreen && 'fixed inset-0 z-[80] rounded-none border-0',
        className,
      )}
      style={fullscreen ? undefined : style}
    >
      <header
        className={cn(
          'flex shrink-0 items-center gap-2 border-b px-2 py-1',
          chrome.headerBg,
          chrome.headerBorder,
        )}
      >
        <span className={cn('text-[10px] font-black uppercase tracking-[0.2em]', chrome.label)}>
          {role === 'program' ? 'Program' : 'Preview'}
        </span>
        <span className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={cn(
            'shrink-0 rounded-ubos-sm border px-1.5 py-px text-[9px] font-bold uppercase tracking-wide transition-colors hover:bg-white/10',
            chrome.chip,
          )}
          aria-label={fullscreen ? `Exit ${role} fullscreen` : `Fullscreen ${role}`}
        >
          {fullscreen ? 'Exit' : 'Full'}
        </button>
      </header>

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

  return (
    <section
      className={cn('flex min-h-0 min-w-0 flex-1 flex-col gap-1.5', className)}
      aria-label="Command center stage — program and preview monitors"
    >
      {fullscreenMonitor ? (
        <div className="fixed inset-0 z-[75] bg-black" aria-hidden="true" />
      ) : null}

      <div
        className={cn(
          'flex min-h-[14rem] min-w-0 flex-1 gap-1.5 overflow-hidden',
          stacked ? 'flex-col' : 'flex-row',
        )}
      >
        <StageMonitorCell
          role="program"
          monitor={programMonitor}
          overlay={programOverlay}
          safeAreasVisible={safeAreasVisible}
          fullscreen={fullscreenMonitor === 'program'}
          onToggleFullscreen={() => toggleFullscreen('program')}
          style={{ flex: `${share} 1 0%` }}
          className={stacked ? 'min-h-0' : 'min-w-0'}
        />
        <StageMonitorCell
          role="preview"
          monitor={previewMonitor}
          overlay={previewOverlay}
          safeAreasVisible={safeAreasVisible}
          fullscreen={fullscreenMonitor === 'preview'}
          onToggleFullscreen={() => toggleFullscreen('preview')}
          style={{ flex: `${1 - share} 1 0%` }}
          className={stacked ? 'min-h-0' : 'min-w-0'}
        />
      </div>

      {/* Transition controls (existing CUT / TAKE / AUTO switcher) — always
          visible below the monitors, never overlapping them. */}
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
