'use client';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { workspaceById, workspaceCatalog, type WorkspaceId } from './workspace-catalog';
import { ProductionRuntimeHost } from './ProductionRuntimeHost';
import { WorkspaceHost } from './WorkspaceHost';
import { WorkspaceDockManager } from './WorkspaceDockManager';
import { UbosGlobalTopBar, UbosWorkspaceSidebar } from '../chrome';
import type { ChromeToolAction } from '../chrome';
import type { WorkspacePresetId } from '@ubos/shared';
import './workspace-shell.css';

const workspaceFromPath = (pathname: string): WorkspaceId => {
  const value = pathname.split('/')[2];
  return value && value in workspaceById ? (value as WorkspaceId) : 'director';
};

/**
 * Map old workspace catalog IDs to the nearest WorkspacePresetId for the
 * new sidebar. Used only for sidebar active-highlight and tool group display;
 * navigation always goes to the real route.
 */
const CATALOG_TO_PRESET: Record<string, WorkspacePresetId> = {
  director: 'director',
  'solo-streamer': 'solo-streamer',
  'technical-director': 'technical-director',
  'audio-engineer': 'audio-engineer',
  'graphics-operator': 'graphics-operator',
  'replay-operator': 'replay-operator',
  'streaming-operator': 'streaming-operator',
  'monitor-wall': 'monitor-wall',
  compact: 'compact',
  scenes: 'director',
  sources: 'media-operator',
  'social-fabric': 'social-fabric',
  guests: 'production',
  automation: 'automation-operator',
  scheduler: 'automation-operator',
  'ai-producer': 'analytics',
  'emergency-control': 'technical-director',
};

/**
 * Map a sidebar preset selection back to the best available route.
 * New presets without dedicated routes fall back to the closest existing one.
 */
const PRESET_TO_ROUTE: Record<WorkspacePresetId, string> = {
  director: '/control-room/director',
  production: '/control-room/director',
  'social-fabric': '/control-room/social-fabric',
  'graphics-operator': '/control-room/graphics-operator',
  'media-operator': '/control-room/sources',
  'replay-operator': '/control-room/replay-operator',
  'distribution-operator': '/control-room/streaming-operator',
  'automation-operator': '/control-room/automation',
  analytics: '/control-room/director',
  'technical-director': '/control-room/technical-director',
  'audio-engineer': '/control-room/audio-engineer',
  'monitor-wall': '/control-room/monitor-wall',
  compact: '/control-room/compact',
  'solo-streamer': '/control-room/solo-streamer',
  streamer: '/control-room/solo-streamer',
  'streaming-operator': '/control-room/streaming-operator',
};

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const workspace = workspaceById[workspaceFromPath(pathname)];
  const g = workspace.geometry;

  const style = {
    '--ubos-program-weight': g.programWeight,
    '--ubos-preview-weight': g.previewWeight,
    '--ubos-center-stage-weight': g.centerStageWeight,
    '--ubos-left-dock-weight': g.leftDockWeight,
    '--ubos-right-dock-weight': g.rightDockWeight,
    '--ubos-bottom-dock-weight': g.bottomDockWeight,
    '--ubos-program-min-width': `${g.minProgramWidth}px`,
    '--ubos-preview-min-width': `${g.minPreviewWidth}px`,
    // Full grid-template-columns value set as a variable so fr units work reliably
    '--ubos-monitor-cols': g.orientation === 'horizontal-split'
      ? `minmax(${g.minProgramWidth}px, ${g.programWeight}fr) minmax(${g.minPreviewWidth}px, ${g.previewWeight}fr)`
      : '1fr',
    '--ubos-monitor-rows': g.orientation === 'vertical-stack'
      ? `minmax(0, ${g.programWeight}fr) minmax(0, ${g.previewWeight}fr)`
      : '1fr',
  } as CSSProperties;

  const activePresetId: WorkspacePresetId =
    CATALOG_TO_PRESET[workspace.id] ?? 'director';

  const handleSelectPreset = (presetId: WorkspacePresetId) => {
    const route = PRESET_TO_ROUTE[presetId] ?? '/control-room/director';
    router.push(route);
  };

  const handleToolAction = (action: ChromeToolAction) => {
    if (action.nav) router.push(`/control-room/${action.nav}`);
  };

  return (
    <div
      className={`ubos-workspace-shell-v2 is-${g.orientation} is-${g.mode}`}
      style={style}
      data-workspace={workspace.id}
    >
      {/* ── New unified top bar ──────────────────────────────────────────── */}
      <UbosGlobalTopBar
        activePresetId={activePresetId}
        isLive={false}
        resolution="1080p60"
        userName="Operator"
        userRole={workspace.name}
      />

      {/* ── Body: sidebar + content area ────────────────────────────────── */}
      <div className="ubos-workspace-body">
        {/* New workspace sidebar */}
        <UbosWorkspaceSidebar
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          onToolAction={handleToolAction}
          onAddWorkspace={() => router.push('/control-room/director')}
        />

        {/* Real content area — monitors (row 1) / content (row 2) / workbench (row 3) */}
        <div
          className={`ubos-workspace-content-area is-${g.orientation} is-${g.mode}`}
          style={style}
        >
          <ProductionRuntimeHost
            programWeight={g.programWeight}
            previewWeight={g.previewWeight}
          />
          <WorkspaceDockManager workspaceId={workspace.id}>
            <WorkspaceHost workspaceId={workspace.id}>{children}</WorkspaceHost>
          </WorkspaceDockManager>
        </div>
      </div>
    </div>
  );
}
