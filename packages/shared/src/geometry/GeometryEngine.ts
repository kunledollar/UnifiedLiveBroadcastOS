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
  MonitorZoneMap,
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
  /** Pre-computed zone→Rect cache invalidated on adaptToMonitors(). */
  private monitorZoneCache: MonitorZoneMap | null = null;
  /** Pre-computed canvas rects for all outputs, keyed by output id. */
  private canvasRects: Record<string, import('./types.js').CanvasRect> = {};
  /** Dominant aspect ratio (width/height) across all active outputs. */
  private dominantAspect: number | null = null;
  /** Categorised aspect mode — drives applyAspectCategory() switch. */
  private aspectCategory: 'landscape' | 'portrait' | 'square' | 'mixed' | null = null;

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

    // Prepare multi-monitor manager and seed the zone cache
    this.monitorManager = new UbosMultiMonitorManager(monitors);
    this.monitorZoneCache = this.monitorManager.assignZones(monitors);

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

    // Ensure role adaptation is applied before zone computation
    if (this.state?.role) this.adaptToRole(this.state.role);

    // Ensure aspect ratio adaptation is applied before zone computation
    this.adaptToAspectRatios(this.outputs);

    // 1. Determine monitor layout (zone id → Rect on assigned monitor)
    //    Use pre-computed cache from adaptToMonitors() when available.
    const monitorZoneMap =
      this.monitorZoneCache ?? this.monitorManager!.assignZones(this.monitors);

    // 2. Use pre-computed canvas rects from adaptToAspectRatios()
    const canvasRects = this.canvasRects;

    // 3. Iterate through workspace zones
    this.workspace!.zones.forEach((zoneDef) => {
      const zoneId = zoneDef.id;

      // Base rect from workspace shell.
      // If the zone uses normalized (0.0–1.0) fractions, scale to pixels.
      let rect: Rect;
      if (zoneDef.normalized) {
        const vw = this.state!.viewportWidth;
        const vh = this.state!.viewportHeight;
        rect = {
          x:      Math.round(zoneDef.rect.x      * vw),
          y:      Math.round(zoneDef.rect.y      * vh),
          width:  Math.round(zoneDef.rect.width  * vw),
          height: Math.round(zoneDef.rect.height * vh),
        };
      } else {
        rect = { ...zoneDef.rect };
      }

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

      // 5b. Aspect category global adjustment (landscape/portrait/square/mixed)
      rect = this.applyAspectCategory(zoneId, rect);

      // 6. Aspect ratio fine-tuning (dominant ratio scalar)
      rect = this.applyAspectRatio(zoneId, rect);

      // 7. Apply role-specific geometry (Step 37)
      rect = this.applyRoleGeometry(zoneId, rect);

      // 7b. Fine-grained role adaptation (Step 34)
      rect = this.applyRoleAdaptation(zoneId, rect);

      // 8. Adapt rect based on production state (scene-centric geometry)
      rect = this.applySceneDrivenGeometry(zoneId, rect, this.state!);

      // 9. Store final computed zone geometry
      geometryMap[zoneId] = {
        id: zoneId,
        rect,
        state: this.state!,
      };
    });

    return geometryMap;
  }

  // ── Adaptation methods ─────────────────────────────────────────────────────

  // ── Step 35: adaptToMonitors() ────────────────────────────────────────────

  adaptToMonitors(monitors: MonitorConfig[]): void {
    this.monitors = monitors;

    // Recompute monitor zone map
    this.monitorManager = new UbosMultiMonitorManager(monitors);

    // Precompute monitor rects for faster zone computation
    this.monitorZoneCache = this.monitorManager.assignZones(monitors);
  }

  // ── Step 36: adaptToAspectRatios() ────────────────────────────────────────

  adaptToAspectRatios(outputs: OutputProfile[]): void {
    this.outputs = outputs;

    // Recompute canvas rects for all outputs
    this.canvasRects = this.canvasEngine?.renderAll(outputs) ?? {};

    // Determine dominant aspect ratio from the first output
    const first = Object.values(this.canvasRects)[0];
    if (!first) {
      this.dominantAspect = null;
      this.aspectCategory = null;
      return;
    }

    const aspect = first.width / first.height;
    this.dominantAspect = aspect;

    // Store aspect category for use in applyAspectCategory()
    if (aspect > 1.7) {
      this.aspectCategory = 'landscape';          // 16:9, 21:9
    } else if (aspect < 0.8) {
      this.aspectCategory = 'portrait';           // 9:16
    } else if (aspect >= 0.95 && aspect <= 1.05) {
      this.aspectCategory = 'square';             // 1:1
    } else {
      this.aspectCategory = 'mixed';              // multi-output or 4:5
    }
  }

  adaptToRole(role: GeometryRole): void {
    this.role = role;
  }

  // ── Step 36: Aspect-ratio adaptive geometry ───────────────────────────────

  private applyAspectRatio(zoneId: string, rect: Rect): Rect {
    if (!this.dominantAspect) return rect;

    // Portrait dominant (TikTok, IG Reels, Shorts — aspect < 1)
    if (this.dominantAspect < 1) {
      if (zoneId === 'triad') {
        return {
          ...rect,
          height: Math.round(rect.height * 1.2),
          width: Math.round(rect.width * 0.9),
        };
      }
      if (zoneId === 'output') {
        return { ...rect, height: Math.round(rect.height * 1.15) };
      }
    }

    // Landscape dominant (YouTube, Twitch, Facebook — aspect ≥ 1)
    if (this.dominantAspect >= 1) {
      if (zoneId === 'triad') {
        return {
          ...rect,
          width: Math.round(rect.width * 1.2),
          height: Math.round(rect.height * 0.9),
        };
      }
      if (zoneId === 'output') {
        return { ...rect, width: Math.round(rect.width * 1.15) };
      }
    }

    return rect;
  }

  // ── Step 37: Role-specific geometry ───────────────────────────────────────

  private applyRoleGeometry(zoneId: string, rect: Rect): Rect {
    switch (this.role) {
      case 'director':
        if (zoneId === 'scene') return { ...rect, width:  Math.round(rect.width  * 1.15) };
        if (zoneId === 'triad') return { ...rect, width:  Math.round(rect.width  * 1.10) };
        break;

      case 'technical-director':
        if (zoneId === 'triad') return { ...rect, width:  Math.round(rect.width  * 1.20) };
        if (zoneId === 'graph') return { ...rect, height: Math.round(rect.height * 0.90) };
        break;

      case 'graphics-operator':
        if (zoneId === 'inspector') return { ...rect, width: Math.round(rect.width * 1.25) };
        if (zoneId === 'dock')      return { ...rect, width: Math.round(rect.width * 1.10) };
        break;

      case 'replay-operator':
        if (zoneId === 'graph')     return { ...rect, height: Math.round(rect.height * 0.85) };
        if (zoneId === 'workbench') return { ...rect, height: Math.round(rect.height * 1.15) };
        break;

      case 'distribution-operator':
        if (zoneId === 'output') return { ...rect, width:  Math.round(rect.width  * 1.30) };
        if (zoneId === 'graph')  return { ...rect, height: Math.round(rect.height * 0.85) };
        break;

      case 'automation-operator':
        if (zoneId === 'graph')     return { ...rect, width: Math.round(rect.width * 1.30) };
        if (zoneId === 'inspector') return { ...rect, width: Math.round(rect.width * 1.10) };
        break;

      case 'social-fabric':
        if (zoneId === 'dock')      return { ...rect, width:  Math.round(rect.width  * 1.20) };
        if (zoneId === 'workbench') return { ...rect, height: Math.round(rect.height * 1.20) };
        break;

      case 'analytics':
        if (zoneId === 'graph')  return { ...rect, width:  Math.round(rect.width  * 1.35) };
        if (zoneId === 'output') return { ...rect, height: Math.round(rect.height * 0.90) };
        break;

      default:
        break;
    }

    return rect;
  }

  // ── Step 36b: Aspect-category global adjustment ───────────────────────────

  private applyAspectCategory(zoneId: string, rect: Rect): Rect {
    if (!this.aspectCategory) return rect;

    switch (this.aspectCategory) {
      case 'landscape':
        if (zoneId === 'triad')  rect = { ...rect, width: Math.round(rect.width  * 1.1)  };
        if (zoneId === 'output') rect = { ...rect, width: Math.round(rect.width  * 1.15) };
        break;

      case 'portrait':
        if (zoneId === 'triad')  rect = { ...rect, height: Math.round(rect.height * 1.2)  };
        if (zoneId === 'output') rect = { ...rect, height: Math.round(rect.height * 1.25) };
        break;

      case 'square':
        if (zoneId === 'triad') {
          rect = {
            ...rect,
            width:  Math.round(rect.width  * 1.05),
            height: Math.round(rect.height * 1.05),
          };
        }
        break;

      case 'mixed':
        // Multi-destination → widen OutputZone and TriadZone
        if (zoneId === 'output') rect = { ...rect, width: Math.round(rect.width * 1.2)  };
        if (zoneId === 'triad')  rect = { ...rect, width: Math.round(rect.width * 1.1)  };
        break;
    }

    return rect;
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
