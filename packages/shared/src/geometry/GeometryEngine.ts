/**
 * UBOS Geometry Engine — Root interface
 *
 * The GeometryEngine is the single authoritative source of zone geometry
 * for every UBOS workspace. It computes where each zone lives on screen,
 * adapts to monitor configurations, output aspect ratios, and operator
 * roles, and publishes a GeometryMap that the render layer consumes.
 *
 * Nothing in this interface touches runtime media, DOM nodes, or React.
 * It is a pure layout calculation contract.
 */
import type {
  GeometryMap,
  MonitorConfig,
  GeometryRole,
  OutputProfile,
  ProductionState,
  WorkspaceShell,
} from './types.js';

export interface GeometryEngine {
  /**
   * Bind the engine to a workspace shell, registering its zone
   * definitions as the geometry baseline for subsequent compute calls.
   */
  initialize(workspace: WorkspaceShell): void;

  /**
   * Run a full geometry pass given the current production state.
   * Returns a GeometryMap: zone id → computed Rect.
   * Deterministic — same inputs always produce the same output.
   */
  computeZones(state: ProductionState): GeometryMap;

  /**
   * Adapt zone geometry to the connected physical monitor layout.
   * Called when monitors are added, removed, or reconfigured.
   */
  adaptToMonitors(monitors: MonitorConfig[]): void;

  /**
   * Adapt the canvas geometry to the delivery output profiles.
   * Handles letterboxing (16:9→9:16) and pillarboxing (4:3→16:9).
   */
  adaptToAspectRatios(outputs: OutputProfile[]): void;

  /**
   * Adapt zone emphasis and sizing to the active operator role.
   * Directors get program-dominant layouts; graphics operators get
   * preview-dominant layouts; audio engineers get console-dominant.
   */
  adaptToRole(role: GeometryRole): void;
}

// ── Default implementation ────────────────────────────────────────────────────

export class UbosGeometryEngine implements GeometryEngine {
  private shell: WorkspaceShell | null = null;
  private monitors: MonitorConfig[] = [];
  private outputs: OutputProfile[] = [];
  private role: GeometryRole = 'director';

  initialize(workspace: WorkspaceShell): void {
    this.shell = workspace;
  }

  computeZones(state: ProductionState): GeometryMap {
    if (!this.shell) return {};

    const map: GeometryMap = {};

    for (const zone of this.shell.zones) {
      const rect = this.resolveZoneRect(zone.id, state);
      if (rect) map[zone.id] = rect;
    }

    return map;
  }

  adaptToMonitors(monitors: MonitorConfig[]): void {
    this.monitors = monitors;
  }

  adaptToAspectRatios(outputs: OutputProfile[]): void {
    this.outputs = outputs;
  }

  adaptToRole(role: GeometryRole): void {
    this.role = role;
  }

  private resolveZoneRect(
    zoneId: string,
    state: ProductionState,
  ): import('./types.js').Rect | null {
    const zone = this.shell?.zones.find((z) => z.id === zoneId);
    if (!zone) return null;

    const vw = state.viewportWidth;
    const vh = state.viewportHeight;

    // Role-aware proportional layout
    const sidebarWidth = 210;
    const topBarHeight = 56;
    const bottomBarHeight = 40;
    const rightPanelWidth = 300;

    const contentWidth = vw - sidebarWidth - rightPanelWidth;
    const contentHeight = vh - topBarHeight - bottomBarHeight;

    // Resolve well-known zones
    switch (zoneId) {
      case 'scene':
        return {
          x: sidebarWidth,
          y: topBarHeight,
          width: contentWidth * (this.role === 'graphics-operator' ? 0.4 : 0.6),
          height: contentHeight * 0.55,
        };
      case 'triad':
        return {
          x: sidebarWidth,
          y: topBarHeight,
          width: contentWidth,
          height: contentHeight * 0.55,
        };
      case 'inspector':
        return {
          x: vw - rightPanelWidth,
          y: topBarHeight,
          width: rightPanelWidth,
          height: contentHeight,
        };
      case 'workbench':
        return {
          x: sidebarWidth,
          y: vh - bottomBarHeight,
          width: vw - sidebarWidth,
          height: bottomBarHeight,
        };
      case 'dock':
        return {
          x: 0,
          y: topBarHeight,
          width: sidebarWidth,
          height: contentHeight,
        };
      case 'graph':
        return {
          x: sidebarWidth,
          y: topBarHeight + contentHeight * 0.55,
          width: contentWidth,
          height: contentHeight * 0.45,
        };
      case 'output':
        return {
          x: vw - rightPanelWidth,
          y: topBarHeight,
          width: rightPanelWidth,
          height: contentHeight * 0.5,
        };
      default:
        return zone.defaultRect;
    }
  }
}
