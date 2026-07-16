'use client';

/**
 * Workspace test page — no database required.
 * Renders CommandCenterShell with empty production state so workspace
 * preset switching can be verified in the browser without Prisma.
 */
import { CommandCenterShell } from '../control-room/command-center';
import { BroadcastStatusBar } from '../control-room/shell/BroadcastStatusBar';
import { useState } from 'react';
import type { DockTabId, NavItemId, OperationsTabId, SourceDockTabId } from '../control-room/shell/types';
import type { MonitorStatusInfo } from '../control-room/command-center/monitor-status';
import type { OperationsDockSection } from '../control-room/broadcast-command-center/RightOperationsDock';
import type { UbosWorkspaceModeId } from '../control-room/menu';

const programStatus: MonitorStatusInfo = {
  state: 'live',
  sourceName: 'Camera 1',
  resolution: '1920×1080',
  fps: '30',
  audioLevel: -18,
};

const previewStatus: MonitorStatusInfo = {
  state: 'preview',
  sourceName: 'Screen Capture',
  resolution: '1920×1080',
  fps: '30',
  audioLevel: null,
};

const operationsSections: OperationsDockSection[] = [];

export default function WorkspaceTestPage() {
  const [activeNav, setActiveNav] = useState<NavItemId>('scenes');
  const [activeSourceDockTab, setActiveSourceDockTab] = useState<SourceDockTabId>('scenes');
  const [activeOperationsTab, setActiveOperationsTab] = useState<OperationsTabId>('inspector');
  const [activeDockTab, setActiveDockTab] = useState<DockTabId>('layers');

  return (
    <main className="ubos-workstation h-screen overflow-hidden bg-ubos-carbon text-ubos-fg-primary">
      <CommandCenterShell
        statusBar={
          <BroadcastStatusBar
            sessionName="Workspace Test"
            isLive={false}
            isRecording={false}
            runTime="00:00:00"
            clock="00:00:00"
            transitionActive={false}
            fps="30"
            cpu="0%"
            dropped="0"
            upload="0 kbps"
            automationModeLabel="Manual"
            aiStatusLabel="Offline"
            outputHealthLabel="No outputs"
            deviceHealthLabel="No devices"
            engineStatusLabel="Unavailable"
            compactChrome={false}
          />
        }
        activeNav={activeNav}
        onNavChange={setActiveNav}
        sourceDockContent={
          <div className="flex h-full items-center justify-center text-ubos-fg-muted text-xs p-4">
            Source dock content (no database)
          </div>
        }
        activeSourceDockTab={activeSourceDockTab}
        onSourceDockTabChange={setActiveSourceDockTab}
        programMonitor={
          <div className="flex h-full w-full items-center justify-center bg-black/60 text-white text-sm font-bold">
            PROGRAM
          </div>
        }
        previewMonitor={
          <div className="flex h-full w-full items-center justify-center bg-black/40 text-gray-300 text-sm font-bold">
            PREVIEW
          </div>
        }
        programStatus={programStatus}
        previewStatus={previewStatus}
        switcherContent={
          <div className="flex h-full items-center justify-center text-ubos-fg-muted text-xs">
            Switcher
          </div>
        }
        operationsSections={operationsSections}
        activeOperationsTab={activeOperationsTab}
        activeDockTab={activeDockTab}
        onOperationsTabChange={setActiveOperationsTab}
        onDockTabChange={setActiveDockTab}
        bottomWorkspaceContent={
          <div className="flex h-full items-center justify-center text-ubos-fg-muted text-xs p-4">
            Bottom workspace content
          </div>
        }
        onWorkspaceModeApplied={(_mode: UbosWorkspaceModeId) => {}}
      />
    </main>
  );
}
