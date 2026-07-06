'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';
import { UbosMenuBar, type UbosDockLayoutState, type UbosWorkspaceModeId } from '../menu';
import type { LayoutFocusMode } from '../workspaces/workspace-types';
import type { UbosDockPanelId } from '../menu';

export function TopBar({
  statusBar,
  dockLayout,
  activeWorkspaceMode,
  layoutFocus,
  compactChrome,
  onSelectWorkspaceMode,
  onToggleDockPanel,
  onResetLayout,
  onSaveLayout,
  onToggleLayoutLock,
  onSelectLayoutFocus,
  onToggleCompactChrome,
  onSaveWorkspace,
  onRestoreWorkspace,
  onResetWorkspace,
  onSeedDemo,
  onSimulateDemo,
  onResetDemo,
  trailingSlot,
  className,
}: {
  statusBar: ReactNode;
  dockLayout: UbosDockLayoutState;
  activeWorkspaceMode: UbosWorkspaceModeId;
  layoutFocus: LayoutFocusMode;
  compactChrome: boolean;
  onSelectWorkspaceMode: (mode: UbosWorkspaceModeId) => void;
  onToggleDockPanel: (panelId: UbosDockPanelId) => void;
  onResetLayout: () => void;
  onSaveLayout: () => void;
  onToggleLayoutLock: (locked: boolean) => void;
  onSelectLayoutFocus: (focus: LayoutFocusMode) => void;
  onToggleCompactChrome: () => void;
  onSaveWorkspace?: () => void;
  onRestoreWorkspace?: () => void;
  onResetWorkspace?: () => void;
  onSeedDemo?: () => void;
  onSimulateDemo?: () => void;
  onResetDemo?: () => void;
  trailingSlot?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'flex shrink-0 flex-col border-b border-ubos-border-subtle bg-[#020408]',
        className,
      )}
    >
      {statusBar}
      <UbosMenuBar
        dockLayout={dockLayout}
        activeWorkspaceMode={activeWorkspaceMode}
        layoutFocus={layoutFocus}
        compactChrome={compactChrome}
        onSelectWorkspaceMode={onSelectWorkspaceMode}
        onToggleDockPanel={onToggleDockPanel}
        onResetLayout={onResetLayout}
        onSaveLayout={onSaveLayout}
        onToggleLayoutLock={onToggleLayoutLock}
        onSelectLayoutFocus={onSelectLayoutFocus}
        onToggleCompactChrome={onToggleCompactChrome}
        {...(onSaveWorkspace ? { onSaveWorkspace } : {})}
        {...(onRestoreWorkspace ? { onRestoreWorkspace } : {})}
        {...(onResetWorkspace ? { onResetWorkspace } : {})}
        {...(onSeedDemo ? { onSeedDemo } : {})}
        {...(onSimulateDemo ? { onSimulateDemo } : {})}
        {...(onResetDemo ? { onResetDemo } : {})}
        trailingSlot={trailingSlot}
      />
    </header>
  );
}
