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
   * Run a full geometry pass using the state bound in initialize().
   * Returns a GeometryMap: zone id → ComputedZoneGeometry.
   * Deterministic — same bound state always produces the same output.
   */
  computeZones(): GeometryMap;

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

  // ── Step 34: computeZones() ────────────────────────────────────────────────

  computeZones(): GeometryMap {
    if (!this.initialized) {
      throw new Error('GeometryEngine must be initialized before computing zones.');
    }

    const geometryMap: GeometryMap = {};

    // 1. Determine monitor layout (zone id → Rect on assigned monitor)
    const monitorZoneMap = this.monitorManager!.assignZones(this.monitors);

    // 2. Determine aspect ratio behavior for Program / Preview
    const canvasRects = this.canvasEngine!.renderAll(this.outputs);

    // 3. Iterate through workspace zones
    this.workspace!.zones.forEach((zoneDef) => {
      const zoneId = zoneDef.id;

      // Base rect from workspace shell
      let rect: Rect = { ...zoneDef.rect };

      // 4. Adapt rect based on monitor assignment
      const monitorRect = monitorZoneMap[zoneId];
      if (monitorRect) {
        rect = monitorRect;
      }

      // 5. Adapt rect based on aspect ratios (TriadZone + OutputZone)
      if (zoneId === 'triad') {
        rect = this.canvasEngine!.applyTriadAspect(rect, canvasRects);
      }

      if (zoneId === 'output') {
        rect = this.canvasEngine!.applyOutputAspect(rect, canvasRects);
      }

      // 6. Adapt rect based on operator role
      rect = this.applyRoleAdaptation(zoneId, rect);

      // 7. Adapt rect based on production state (scene-centric geometry)
      rect = this.applySceneDrivenGeometry(zoneId, rect, this.state!);

      // 8. Store final computed zone geometry
      geometryMap[zoneId] = {
        id: zoneId,
        rect,
        state: this.state!,
      };
    });

    return geometryMap;
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

  // ── Step 34: Role-adaptive geometry ───────────────────────────────────────

  private applyRoleAdaptation(zoneId: string, rect: Rect): Rect {
    const role = this.state?.role ?? this.role;

    // Directors get larger SceneZone + TriadZone
    if (role === 'director') {
      if (zoneId === 'scene') return { ...rect, width: Math.round(rect.width * 1.1) };
      if (zoneId === 'triad') return { ...rect, width: Math.round(rect.width * 1.05) };
    }

    // Graphics operators get a larger InspectorZone
    if (role === 'graphics-operator') {
      if (zoneId === 'inspector') return { ...rect, width: Math.round(rect.width * 1.2) };
    }

    return rect;
  }

  // ── Step 34: Scene-centric geometry ───────────────────────────────────────

  private applySceneDrivenGeometry(
    zoneId: string,
    rect: Rect,
    state: ProductionState,
  ): Rect {
    // If a scene is LIVE, expand SceneZone slightly
    if (zoneId === 'scene' && state.currentScene?.status === 'LIVE') {
      return { ...rect, height: Math.round(rect.height * 1.05) };
    }

    // If Preview is empty, shrink the triad zone slightly
    if (zoneId === 'triad' && !state.previewSource) {
      return { ...rect, height: Math.round(rect.height * 0.95) };
    }

    return rect;
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get isInitialized(): boolean { return this.initialized; }
  get activeRole(): GeometryRole { return this.role; }
  get registeredZoneIds(): string[] { return [...this.zoneRegistry.keys()]; }
}
