'use client';

/**
 * UBOS Next-Gen Chrome — Global Top Bar
 *
 * Matches the reference design: UBOS wordmark | workspace name + tagline |
 * LIVE indicator + timer | show title | resolution + bitrate | utility icons |
 * user profile chip.
 *
 * Replaces the old status bar + menu bar + workspace ribbon with a single,
 * authoritative, 56px chrome strip.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { WorkspacePresetId } from '@ubos/shared';
import { workspaceChromeDefs } from './chrome-workspace-defs';

function UbosWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'select-none font-black tracking-tight text-white',
        'text-lg leading-none',
        className,
      )}
      aria-label="UBOS"
    >
      <span className="text-[#7c6af7]">U</span>BOS
    </span>
  );
}

function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
    </span>
  );
}

function useTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed * 1000;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function IconBtn({
  label,
  icon,
  badge,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  badge?: number | undefined;
  onClick?: (() => void) | undefined;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-lg',
        'text-[#94a3b8] transition-colors duration-150',
        'hover:bg-white/8 hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6af7]/60',
      )}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

export type UbosGlobalTopBarProps = {
  activePresetId: WorkspacePresetId;
  isLive?: boolean;
  showTitle?: string;
  resolution?: string;
  bitrate?: string;
  viewerCount?: number;
  notificationCount?: number;
  userName?: string;
  userRole?: string;
  onOpenChat?: () => void;
  onOpenNotifications?: () => void;
  onOpenSettings?: () => void;
  onOpenCommandPalette?: () => void;
  className?: string;
  /** Slot for additional status elements (e.g. existing status bar content). */
  statusSlot?: ReactNode;
};

export function UbosGlobalTopBar({
  activePresetId,
  isLive = false,
  showTitle,
  resolution = '1080p60',
  bitrate,
  viewerCount,
  notificationCount = 0,
  userName,
  userRole,
  onOpenChat,
  onOpenNotifications,
  onOpenSettings,
  onOpenCommandPalette,
  className,
  statusSlot,
}: UbosGlobalTopBarProps) {
  const def = workspaceChromeDefs[activePresetId];
  const timer = useTimer(isLive);

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-3 border-b px-4',
        'border-[#1e2530] bg-[#080c12]',
        className,
      )}
      data-testid="ubos-global-top-bar"
    >
      {/* Wordmark */}
      <UbosWordmark className="mr-2 shrink-0" />

      {/* Workspace identity */}
      <div className="min-w-0 shrink-0">
        <p className="truncate text-[11px] font-black uppercase tracking-[0.12em] text-white">
          {def.id === activePresetId ? def.id.replace(/-/g, ' ') : activePresetId.replace(/-/g, ' ')}
        </p>
        <p className="truncate text-[10px] text-[#475569]">{def.tagline}</p>
      </div>

      {/* Divider */}
      <span className="h-6 w-px shrink-0 bg-[#1e2530]" aria-hidden="true" />

      {/* Live status */}
      <div className="flex shrink-0 items-center gap-2">
        {isLive ? (
          <>
            <LivePulse />
            <span className="rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-400 ring-1 ring-red-500/40">
              LIVE
            </span>
            <span className="font-mono text-[11px] font-semibold tabular-nums text-white">
              {timer}
            </span>
            <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400 ring-1 ring-amber-500/30">
              ON AIR
            </span>
          </>
        ) : (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#475569] ring-1 ring-[#1e2530]">
            IDLE
          </span>
        )}
      </div>

      {/* Show info */}
      {showTitle && (
        <>
          <span className="h-6 w-px shrink-0 bg-[#1e2530]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-[#cbd5e1]">{showTitle}</p>
          </div>
        </>
      )}

      {/* Technical stats */}
      <div className="ml-auto flex shrink-0 items-center gap-3">
        {resolution && (
          <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
            <span aria-label="Resolution">{resolution}</span>
          </div>
        )}
        {bitrate && (
          <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
            <span
              className={cn(
                'inline-block h-1.5 w-1.5 rounded-full',
                isLive ? 'bg-emerald-400' : 'bg-[#475569]',
              )}
              aria-hidden="true"
            />
            <span aria-label="Bitrate">{bitrate}</span>
          </div>
        )}
        {viewerCount !== undefined && (
          <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 3a5 5 0 100 10A5 5 0 008 3zm0 1.5A3.5 3.5 0 118 11 3.5 3.5 0 018 4.5zM2.5 8a5.5 5.5 0 0111 0" />
            </svg>
            <span aria-label="Viewers">{viewerCount.toLocaleString()}</span>
          </div>
        )}

        {/* Divider */}
        <span className="h-6 w-px bg-[#1e2530]" aria-hidden="true" />

        {/* Utility icons */}
        <IconBtn
          label="Command Palette (Ctrl+K)"
          {...(onOpenCommandPalette ? { onClick: onOpenCommandPalette } : {})}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          }
        />
        <IconBtn
          label="Chat"
          {...(onOpenChat ? { onClick: onOpenChat } : {})}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <IconBtn
          label="Notifications"
          {...(onOpenNotifications ? { onClick: onOpenNotifications } : {})}
          badge={notificationCount}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          }
        />
        <IconBtn
          label="System Health"
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <IconBtn
          label="Settings"
          {...(onOpenSettings ? { onClick: onOpenSettings } : {})}
          icon={
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
        />

        {/* Divider */}
        <span className="h-6 w-px bg-[#1e2530]" aria-hidden="true" />

        {/* User profile */}
        {(userName ?? userRole) && (
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 rounded-lg px-2 py-1',
              'text-left transition-colors duration-150',
              'hover:bg-white/8',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c6af7]/60',
            )}
            aria-label="User profile"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#7c6af7]/20 text-[10px] font-bold uppercase text-[#a78bf8]">
              {(userName ?? 'U').charAt(0)}
            </div>
            <div className="hidden min-w-0 lg:block">
              {userName && (
                <p className="truncate text-[11px] font-semibold text-white">{userName}</p>
              )}
              {userRole && (
                <p className="truncate text-[10px] text-[#475569]">{userRole}</p>
              )}
            </div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hidden shrink-0 text-[#475569] lg:block" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}

        {/* Status slot for existing status bar content */}
        {statusSlot}
      </div>
    </header>
  );
}
