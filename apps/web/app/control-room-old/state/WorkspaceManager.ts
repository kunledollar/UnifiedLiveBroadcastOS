/**
 * WorkspaceManager — Step 49
 *
 * Connects the UBOS GeometryEngine to the Control Room runtime.
 * Every state mutation triggers geometry recompute + listener notification,
 * making zone geometry fully reactive to:
 *
 *   - workspace switching
 *   - role changes
 *   - scene changes
 *   - monitor configuration
 *   - output profile changes
 *   - AI Crew activation / alert level
 */
import {
  UbosGeometryEngine,
  type GeometryMap,
  type GeometryRole,
  type MonitorConfig,
  type OutputProfile,
  type ProductionState,
} from '@ubos/shared';
import { WorkspaceShellRegistry } from '../geometry/shells/WorkspaceShellRegistry';
import type { SceneLayer } from '../scene-graph/sceneGraphEngine';
import { workspaceState } from '../workspace/workspaceState';

export class WorkspaceManager {
  private state: ProductionState;
  private geometry: UbosGeometryEngine;
  private listeners: Array<(zones: GeometryMap) => void> = [];

  constructor(initialState: ProductionState) {
    this.state = initialState;
    this.geometry = new UbosGeometryEngine();

    // Bootstrap: initialize with the workspace shell from the registry
    const initialShell =
      WorkspaceShellRegistry[initialState.workspace ?? 'director'];

    if (initialShell) {
      this.geometry.initialize(
        initialShell,
        initialState.monitors ?? [],
        initialState.outputs  ?? [],
        initialState,
      );
    }
  }

  // ── Workspace switching ────────────────────────────────────────────────────

  setWorkspace(id: string): void {
    this.state = { ...this.state, workspace: id };

    const shell = WorkspaceShellRegistry[id];
    if (!shell) return;

    this.geometry.setShell(shell);
    this.geometry.computeZones();
    this.notify();
  }

  // ── Role switching ─────────────────────────────────────────────────────────

  setRole(role: GeometryRole): void {
    this.state = { ...this.state, role };
    this.geometry.updateState(this.state);
    this.geometry.computeZones();
    this.notify();
  }

  // ── Scene switching ────────────────────────────────────────────────────────

  setScene(sceneId: string): void {
    this.state = {
      ...this.state,
      programSceneId: sceneId,
      programScene: { id: sceneId, name: sceneId },
      isLive: true,
    };
    // Keep Scene Graph Engine in sync
    workspaceState.setCurrentScene(sceneId);
    // Feed scenes array to engine if available in state
    if (this.state.scenes) {
      workspaceState.setScenes(
        this.state.scenes.map((s) => ({
          id:       s.id,
          name:     s.name,
          ...(s.layers   ? { layers:   s.layers   as SceneLayer[] } : {}),
          ...(s.timeline ? { timeline: s.timeline } : {}),
        })),
      );
    }
    this.geometry.updateState(this.state);
    this.geometry.computeZones();
    this.notify();
  }

  // ── Monitor updates ────────────────────────────────────────────────────────

  setMonitors(monitors: MonitorConfig[]): void {
    this.state = { ...this.state, monitors };
    this.geometry.adaptToMonitors(monitors);
    this.geometry.computeZones();
    this.notify();
  }

  // ── Output updates ─────────────────────────────────────────────────────────

  setOutputs(outputs: OutputProfile[]): void {
    this.state = { ...this.state, outputs };
    this.geometry.adaptToAspectRatios(outputs);
    this.geometry.computeZones();
    this.notify();
  }

  // ── AI Crew ────────────────────────────────────────────────────────────────

  setAiCrewActive(active: boolean): void {
    this.state = { ...this.state, aiCrewActive: active };
    this.geometry.updateState(this.state);
    this.geometry.computeZones();
    this.notify();
  }

  setAiAlertLevel(level: 'idle' | 'normal' | 'high'): void {
    this.state = { ...this.state, aiAlertLevel: level };
    this.geometry.updateState(this.state);
    this.geometry.computeZones();
    this.notify();
  }

  // ── Viewport ───────────────────────────────────────────────────────────────

  /** Update viewport dimensions and recompute geometry. */
  setViewport(width: number, height: number): void {
    if (
      this.state.viewportWidth === width &&
      this.state.viewportHeight === height
    ) return;
    this.state = { ...this.state, viewportWidth: width, viewportHeight: height };
    this.geometry.updateState(this.state);
    this.geometry.computeZones();
    this.notify();
  }

  // ── Listener registry ──────────────────────────────────────────────────────

  onGeometryChange(fn: (zones: GeometryMap) => void): void {
    this.listeners.push(fn);
  }

  offGeometryChange(fn: (zones: GeometryMap) => void): void {
    this.listeners = this.listeners.filter((l) => l !== fn);
  }

  /** Alias for offGeometryChange — matches the hook API used in Step 50. */
  removeGeometryListener(fn: (zones: GeometryMap) => void): void {
    this.offGeometryChange(fn);
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  getState(): Readonly<ProductionState> {
    return this.state;
  }

  getGeometryMap(): GeometryMap {
    return this.geometry.getGeometryMap();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private notify(): void {
    const zones = this.geometry.getGeometryMap();
    this.listeners.forEach((fn) => fn(zones));
  }
}
