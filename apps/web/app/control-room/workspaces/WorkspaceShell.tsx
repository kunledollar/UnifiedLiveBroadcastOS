'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import { workspaceById, workspaceCatalog, type WorkspaceId } from './workspace-catalog';
import { UbosGlobalTopBar, UbosWorkspaceSidebar } from '../chrome';
import type { ChromeToolAction } from '../chrome';
import type { WorkspacePresetId } from '@ubos/shared';
import { workspaceManager } from '../state/workspace-manager-instance';
import { ControlRoomCanvas } from '../zones/ControlRoomCanvas';
import { useUiIntelligence } from '../hooks/useUiIntelligence';
import { workspaceState } from '../workspace/workspaceState';
import '../intelligence-graph/ui-intelligence.css';
import './workspace-shell.css';

const workspaceFromPath = (pathname: string): WorkspaceId => {
  const value = pathname.split('/')[2];
  return value && value in workspaceById ? (value as WorkspaceId) : 'director';
};

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

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const workspace = workspaceById[workspaceFromPath(pathname)];
  const g = workspace.geometry;
  const canvasRef = useRef<HTMLDivElement>(null);
  // Step 90 — elevate active workspace shell from UIIL
  useUiIntelligence();
  const shellElevated = workspaceState.intelligenceGraph.uiIntegration.isWorkspaceElevated();
  const shellUiClass = workspaceState.intelligenceGraph.getPanelUiClassName('workspaceShell');

  const style = {
    '--ubos-program-weight': g.programWeight,
    '--ubos-preview-weight': g.previewWeight,
    '--ubos-center-stage-weight': g.centerStageWeight,
    '--ubos-monitor-cols': g.orientation === 'horizontal-split'
      ? `minmax(${g.minProgramWidth}px, ${g.programWeight}fr) minmax(${g.minPreviewWidth}px, ${g.previewWeight}fr)`
      : '1fr',
    '--ubos-monitor-rows': g.orientation === 'vertical-stack'
      ? `minmax(0, ${g.programWeight}fr) minmax(0, ${g.previewWeight}fr)`
      : '1fr',
  } as CSSProperties;

  const activePresetId: WorkspacePresetId =
    CATALOG_TO_PRESET[workspace.id] ?? 'director';

  // Sync WorkspaceManager whenever the route changes
  useEffect(() => {
    workspaceManager.setWorkspace(activePresetId);
  }, [activePresetId]);

  // Sync WorkspaceManager viewport whenever the content area resizes
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r && r.width > 0 && r.height > 0) {
        workspaceManager.setViewport(Math.round(r.width), Math.round(r.height));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSelectPreset = useCallback((presetId: WorkspacePresetId) => {
    const route = PRESET_TO_ROUTE[presetId] ?? '/control-room/director';
    router.push(route);
  }, [router]);

  const handleToolAction = useCallback((action: ChromeToolAction) => {
    if (action.nav) router.push(`/control-room/${action.nav}`);
  }, [router]);

  return (
    <div
      className={[
        'ubos-workspace-shell-v2',
        'is-horizontal-split',
        shellElevated ? shellUiClass : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-workspace={workspace.id}
      data-ui-elevated={shellElevated ? 'true' : 'false'}
    >
      {/* ── New top bar ──────────────────────────────────────────────── */}
      <UbosGlobalTopBar
        activePresetId={activePresetId}
        isLive={false}
        resolution="1080p60"
        userName="Operator"
        userRole={workspace.name}
      />

      {/* ── Body: sidebar + geometry canvas ─────────────────────────── */}
      <div className="ubos-workspace-body">
        <UbosWorkspaceSidebar
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          onToolAction={handleToolAction}
          onAddWorkspace={() => router.push('/control-room/director')}
        />

        {/* Geometry-driven canvas — fills all remaining space */}
        <div
          ref={canvasRef}
          className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
        >
          <ControlRoomCanvas />

          {/* Workspace-specific content sits behind the geometry zones
              so existing panels (inspector, workbench, etc.) remain
              accessible until geometry zones fully supersede them.    */}
          <div className="ubos-workspace-content-area is-horizontal-split pointer-events-none absolute inset-0 opacity-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
