'use client';

import { MonitorFrame } from '@ubos/ui';
import type { Guest } from '@ubos/shared';
import { GuestStatus } from '@ubos/shared';
import {
  PreviewMonitorCompact,
  ProgramMonitor,
} from '../workspace/OutputViewRenderer';
import { monitorSafeAreaProps, type WorkspaceMonitorContext } from './workspace-monitor-context';

export type MonitorCellKind =
  | 'program'
  | 'preview'
  | 'guest'
  | 'media'
  | 'replay'
  | 'graphics'
  | 'aux'
  | 'outputs'
  | 'empty'
  | 'unavailable'
  | 'offline'
  | 'disconnected';

export type MonitorCellSpec = {
  kind: MonitorCellKind;
  label?: string;
  guestIndex?: number;
  aspectRatio?: '16/9' | '9/16' | 'auto';
  compact?: boolean;
};

const placeholderMessages: Record<MonitorCellKind, string> = {
  program: 'No source assigned.',
  preview: 'No source assigned.',
  guest: 'Guest unavailable.',
  media: 'Media not configured.',
  replay: 'Replay not active.',
  graphics: 'Graphics unavailable.',
  aux: 'No aux output assigned.',
  outputs: 'Outputs not configured.',
  empty: 'Empty monitor.',
  unavailable: 'Unavailable',
  offline: 'Offline',
  disconnected: 'Disconnected',
};

function getGuestByIndex(guests: Guest[], index: number) {
  return guests[index] ?? null;
}

function guestStatusMessage(guest: Guest | null) {
  if (!guest) return 'Guest unavailable.';
  if (guest.status === GuestStatus.Disconnected) return 'Disconnected';
  if (guest.status === GuestStatus.Removed || guest.status === GuestStatus.Rejected) {
    return 'Unavailable';
  }
  if (guest.status === GuestStatus.Invited) return 'Not connected';
  return undefined;
}

export function MultiViewRenderer({
  cell,
  context,
}: {
  cell: MonitorCellSpec;
  context: WorkspaceMonitorContext;
}) {
  const safeAreas = monitorSafeAreaProps(context);
  const graphProps = context.graph ? { graph: context.graph } : {};
  const {
    programScene,
    previewScene,
    routes,
    layoutPreset,
    guests,
    healthFps,
  } = context;

  switch (cell.kind) {
    case 'program':
      return (
        <ProgramMonitor
          scene={programScene}
          routes={routes}
          layoutPreset={layoutPreset}
          guests={guests}
          {...graphProps}
          healthFps={healthFps}
          {...safeAreas}
          {...(cell.compact ? { compact: true } : {})}
        />
      );
    case 'preview':
      return (
        <PreviewMonitorCompact
          scene={previewScene}
          routes={routes}
          layoutPreset={layoutPreset}
          guests={guests}
          {...graphProps}
          healthFps={healthFps}
          {...safeAreas}
        />
      );
    case 'guest': {
      const guest = getGuestByIndex(guests, cell.guestIndex ?? 0);
      const statusMessage = guestStatusMessage(guest);
      return (
        <MonitorFrame
          fill
          {...(cell.compact ? { compact: true } : {})}
          tally={statusMessage ? 'offline' : 'idle'}
          label={cell.label ?? guest?.displayName ?? `Guest ${(cell.guestIndex ?? 0) + 1}`}
          aspectRatio={cell.aspectRatio ?? '16/9'}
          emptyMessage={statusMessage ?? placeholderMessages.guest}
          {...(guest ? { metadata: [{ label: 'Status', value: guest.status }] } : {})}
          {...safeAreas}
        />
      );
    }
    case 'media':
    case 'replay':
    case 'graphics':
    case 'aux':
    case 'outputs':
    case 'empty':
    case 'unavailable':
    case 'offline':
    case 'disconnected':
      return (
        <MonitorFrame
          fill
          {...(cell.compact ? { compact: true } : {})}
          tally="offline"
          label={cell.label ?? cell.kind}
          aspectRatio={cell.aspectRatio ?? '16/9'}
          emptyMessage={placeholderMessages[cell.kind]}
          {...safeAreas}
        />
      );
    default:
      return null;
  }
}
