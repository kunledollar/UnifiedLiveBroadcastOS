/**
 * UBOS Geometry Engine — Root interface and implementation (Step 33)
 *
 * The GeometryEngine is the single authoritative source of zone geometry
 * for every UBOS workspace. It computes where each zone lives on screen,
 * adapts to monitor configurations, output aspect ratios, and operator
 * roles, and publishes a GeometryMap that the render layer consumes.
 *
 * Nothing in this module touches runtime media, DOM nodes, or React.
 * It is a pure layout calculation contract.
 */
import type {
  GeometryMap,
  GeometryRole,
  MonitorConfig,
  OutputProfile,
  ProductionState,
  Rect,
  WorkspaceShell,
  ZoneDefinition,
} from './types.js';
import { UbosAdaptiveCanvasEngine } from './AdaptiveCanvasEngine.js';
import { UbosMultiMonitorManager } from './MultiMonitorManager.js';

export interface GeometryEngine {
  /**
   * Bind the engine to a workspace shell along with the current monitor
   * configuration, output profiles, and initial production state.
   * Must be called before computeZones().
   */
  initialize(
    workspace: WorkspaceShell,
    monitors: MonitorConfig[],
    outputs: OutputProfile[],
    state: ProductionState,
  ): void;

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
  private workspace: WorkspaceShell | null = null;
  private monitors: MonitorConfig[] = [];
  private outputs: OutputProfile[] = [];
  private state: ProductionState | null = null;
  private role: GeometryRole = 'director';
  private initialized = false;

  private canvasEngine: UbosAdaptiveCanvasEngine | null = null;
  private monitorManager: UbosMultiMonitorManager | null = null;
  private zoneRegistry: Map<string, ZoneDefinition> = new Map();

  // ── Step 33: initialize() ──────────────────────────────────────────────────

  initialize(
    workspace: WorkspaceShell,
    monitors: MonitorConfig[],
    outputs: OutputProfile[],
    state: ProductionState,
  ): void {
    this.workspace = workspace;
    this.monitors = monitors;
    this.outputs = outputs;
    this.state = state;

    // Prepare adaptive canvas engine
    this.canvasEngine = new UbosAdaptiveCanvasEngine(
      state.viewportWidth,
      state.viewportHeight,
    );

    // Prepare multi-monitor manager
    this.monitorManager = new UbosMultiMonitorManager();

    // Prepare zone registry
    this.zoneRegistry = new Map<string, ZoneDefinition>();
    workspace.zones.forEach((zone) => {
      this.zoneRegistry.set(zone.id, zone);
    });

    // Validate workspace shell
    if (workspace.zones.length === 0) {
      throw new Error('WorkspaceShell has no zones defined.');
    }

    // Validate zone definitions
    workspace.zones.forEach((zone) => {
      if (!zone.id || !zone.rect) {
        throw new Error(`Invalid ZoneDefinition in workspace: ${zone.id}`);
      }
    });

    // Initialization complete
    this.initialized = true;
  }

  // ── computeZones() ─────────────────────────────────────────────────────────

  computeZones(state: ProductionState): GeometryMap {
    if (!this.initialized || !this.workspace) return {};

    const map: GeometryMap = {};

    for (const zone of this.workspace.zones) {
      const rect = this.resolveZoneRect(zone.id, state);
      if (rect) map[zone.id] = rect;
    }

    return map;
  }

  // ── Adaptation methods ─────────────────────────────────────────────────────

  adaptToMonitors(monitors: MonitorConfig[]): void {
    this.monitors = monitors;
    this.monitorManager = new UbosMultiMonitorManager();
  }

  adaptToAspectRatios(outputs: OutputProfile[]): void {
    this.outputs = outputs;
    if (this.state) {
      this.canvasEngine = new UbosAdaptiveCanvasEngine(
        this.state.viewportWidth,
        this.state.viewportHeight,
      );
    }
  }

  adaptToRole(role: GeometryRole): void {
    this.role = role;
  }

  // ── Internal zone resolution ───────────────────────────────────────────────

  private resolveZoneRect(zoneId: string, state: ProductionState): Rect | null {
    const zone = this.zoneRegistry.get(zoneId);
    if (!zone) return null;

    const vw = state.viewportWidth;
    const vh = state.viewportHeight;

    const sidebarWidth  = 210;
    const topBarHeight  = 56;
    const bottomHeight  = 40;
    const rightPanelWidth = 300;

    const contentWidth  = vw - sidebarWidth - rightPanelWidth;
    const contentHeight = vh - topBarHeight - bottomHeight;

    // Role-aware proportional layout
    const programRatio = this.role === 'graphics-operator' ? 0.4
      : this.role === 'replay-operator'                    ? 0.35
      : this.role === 'audio-engineer'                     ? 0.55
      : 0.6;

    switch (zoneId) {
      case 'scene':
        return {
          x: sidebarWidth,
          y: topBarHeight,
          width: Math.round(contentWidth * programRatio),
          height: Math.round(contentHeight * 0.55),
        };
      case 'triad':
        return {
          x: sidebarWidth,
          y: topBarHeight,
          width: contentWidth,
          height: Math.round(contentHeight * 0.55),
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
          y: vh - bottomHeight,
          width: vw - sidebarWidth,
          height: bottomHeight,
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
          y: topBarHeight + Math.round(contentHeight * 0.55),
          width: contentWidth,
          height: Math.round(contentHeight * 0.45),
        };
      case 'output':
        return {
          x: vw - rightPanelWidth,
          y: topBarHeight,
          width: rightPanelWidth,
          height: Math.round(contentHeight * 0.5),
        };
      default:
        return zone.rect;
    }
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get isInitialized(): boolean { return this.initialized; }
  get activeRole(): GeometryRole { return this.role; }
  get registeredZoneIds(): string[] { return [...this.zoneRegistry.keys()]; }
}
