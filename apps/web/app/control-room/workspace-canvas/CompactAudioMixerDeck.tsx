'use client';

import type { ReactNode } from 'react';
import { DockablePanel } from './DockablePanel';

export function CompactAudioMixerDeck({
  children,
  channelCount,
  liveLevel,
  collapsed,
  undocked,
  onToggleCollapse,
  onToggleUndock,
}: {
  children: ReactNode;
  channelCount: number;
  liveLevel?: number;
  collapsed: boolean;
  undocked?: boolean;
  onToggleCollapse: () => void;
  onToggleUndock: () => void;
}) {
  return (
    <DockablePanel
      title="Audio Mixer"
      subtitle={`${channelCount} channel${channelCount === 1 ? '' : 's'}`}
      collapsed={collapsed}
      undocked={undocked ?? false}
      onToggleCollapse={onToggleCollapse}
      onToggleUndock={onToggleUndock}
      compactHeader
      headerActions={
        liveLevel !== undefined ? (
          <span className="font-mono text-[10px] text-emerald-400 opacity-0 transition-opacity group-hover/panel-header:opacity-100">
            {liveLevel}%
          </span>
        ) : null
      }
    >
      <div className="min-h-0 p-1">{children}</div>
    </DockablePanel>
  );
}
