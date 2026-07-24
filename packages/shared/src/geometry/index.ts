// ── UBOS Geometry Engine — public API ────────────────────────────────────────
export type {
  Rect,
  Zone,
  GeometryMap,
  ComputedZoneGeometry,
  ZoneDefinition,
  MonitorConfig,
  OutputProfile,
  CanvasRect,
  MonitorZoneMap,
  GeometryRole,
  ProductionState,
  WorkspaceId,
  WorkspaceShell,
} from './types.js';

export type { GeometryEngine } from './GeometryEngine.js';
export { UbosGeometryEngine } from './GeometryEngine.js';

export type { AdaptiveCanvasEngine } from './AdaptiveCanvasEngine.js';
export { UbosAdaptiveCanvasEngine } from './AdaptiveCanvasEngine.js';

export type { MultiMonitorManager } from './MultiMonitorManager.js';
export { UbosMultiMonitorManager } from './MultiMonitorManager.js';

// Zone definitions
export type { SceneZone } from './zones/SceneZone.js';
export { sceneZoneDefinition } from './zones/SceneZone.js';

export type { TriadZone } from './zones/TriadZone.js';
export { triadZoneDefinition } from './zones/TriadZone.js';

export type { InspectorZone } from './zones/InspectorZone.js';
export { inspectorZoneDefinition } from './zones/InspectorZone.js';

export type { WorkbenchZone } from './zones/WorkbenchZone.js';
export { workbenchZoneDefinition } from './zones/WorkbenchZone.js';

export type { DockZone } from './zones/DockZone.js';
export { dockZoneDefinition } from './zones/DockZone.js';

export type { GraphZone } from './zones/GraphZone.js';
export { graphZoneDefinition } from './zones/GraphZone.js';

export type { OutputZone } from './zones/OutputZone.js';
export { outputZoneDefinition } from './zones/OutputZone.js';

export { AiInsightZone } from './zones/AiInsightZone.js';
export { AiCrewOverlay } from './zones/AiCrewOverlay.js';
