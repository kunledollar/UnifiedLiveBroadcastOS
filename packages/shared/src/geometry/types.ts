/**
 * UBOS Geometry Engine — Foundation types
 *
 * Pure TypeScript. No React, no DOM, no runtime media references.
 * These types define the coordinate and layout contract for every
 * zone, shell, canvas, and monitor in the UBOS production environment.
 */
/** Render output type — framework-agnostic in shared; web app constrains to ReactNode. */
export type RenderOutput = unknown;

// ── Coordinate primitives ────────────────────────────────────────────────────

/** Axis-aligned rectangle in viewport pixels. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A named, sized zone with an optional content renderer. */
export interface Zone {
  id: string;
  rect: Rect;
  render(): RenderOutput;
}

/**
 * Fully computed zone geometry — zone id, rect, and the production state
 * snapshot that was used to compute it.
 */
export interface ComputedZoneGeometry {
  id: string;
  rect: Rect;
  state: ProductionState;
}

/** Map of zone id → computed zone geometry for a given layout pass. */
export type GeometryMap = Record<string, ComputedZoneGeometry>;

// ── Zone definitions ─────────────────────────────────────────────────────────

/** Declarative description of a zone slot inside a workspace shell. */
export interface ZoneDefinition {
  id: string;
  rect: Rect;
  /** Minimum allowed size in both axes. */
  minWidth: number;
  minHeight: number;
  /** Whether the zone can be collapsed to zero size. */
  collapsible: boolean;
  /** Whether the zone can be manually resized by the operator. */
  resizable: boolean;
  /**
   * When true, rect values are viewport fractions (0.0–1.0).
   * The geometry engine multiplies them by viewportWidth/Height at
   * compute time to produce pixel-accurate zone rects.
   * When false or absent, rect values are absolute pixel coordinates.
   */
  normalized?: boolean;
}

// ── Monitor / output profiles ─────────────────────────────────────────────────

/** Physical or virtual monitor connected to the production environment. */
export interface MonitorConfig {
  id: string;
  label: string;
  /** Horizontal screen coordinate of the monitor's top-left corner (px). */
  x: number;
  /** Vertical screen coordinate of the monitor's top-left corner (px). */
  y: number;
  width: number;
  height: number;
  aspectRatio: string;
  /** True when this monitor is the primary confidence / program surface. */
  isPrimary: boolean;
  ppi?: number;
}

/** Output delivery profile (stream, record, or preview destination). */
export interface OutputProfile {
  id: string;
  label: string;
  width: number;
  height: number;
  fps: number;
  aspectRatio: string;
  /** Codec hint for the delivery pipeline. */
  codec?: string;
  /** Bitrate in kbps. */
  bitrateKbps?: number;
}

/** Computed canvas rectangle after letterboxing / pillarboxing is applied. */
export interface CanvasRect extends Rect {
  /** Horizontal offset of the active area within the full canvas. */
  offsetX: number;
  /** Vertical offset of the active area within the full canvas. */
  offsetY: number;
  /** Scale factor relative to the source resolution. */
  scale: number;
}

// ── Monitor zone assignment ───────────────────────────────────────────────────

/**
 * Mapping of zone id → the Rect on the assigned monitor.
 * Empty when a single monitor is in use (zones use workspace defaults).
 * Populated for secondary/auxiliary monitors: the zone rect equals that
 * monitor's full display area.
 */
export type MonitorZoneMap = Record<string, Rect>;

// ── Operator roles ────────────────────────────────────────────────────────────

export type GeometryRole =
  | 'director'
  | 'production'
  | 'technical-director'
  | 'audio-engineer'
  | 'graphics-operator'
  | 'replay-operator'
  | 'streaming-operator'
  | 'distribution-operator'
  | 'automation-operator'
  | 'analytics'
  | 'social-fabric'
  | 'monitor-wall'
  | 'solo-streamer'
  | 'streamer'
  | 'compact';

// ── Production state (geometry-layer view) ────────────────────────────────────

/**
 * Minimal production state snapshot consumed by the geometry engine.
 * Only includes fields the geometry layer needs to compute zones —
 * never contains runtime media objects, DOM nodes, or sockets.
 */
export interface ProductionState {
  programSceneId: string | null;
  previewSceneId: string | null;
  isLive: boolean;
  isRecording: boolean;
  activeOutputCount: number;
  connectedGuestCount: number;
  viewportWidth: number;
  viewportHeight: number;
  /** Active operator role — drives role-adaptive zone sizing. */
  role?: GeometryRole;
  /** Minimal geometry hint from Step 34 — superseded by programScene below. */
  _sceneCentricHint?: { id: string; status: string } | null;
  /** Preview source identifier — null when Preview is empty. */
  previewSource?: string | null;
  /** Individual layer within a scene (video, image, text, graphics). */
  currentScene?: {
    id: string;
    status: string;
    name?: string;
    layers?: Array<{
      id: string;
      type: 'video' | 'image' | 'text' | 'graphics';
      src?: string;
      text?: string;
    }>;
  } | null;
  /** Scene currently loaded into Preview. */
  previewScene?: {
    id: string;
    name?: string;
    layers?: Array<{
      id: string;
      type: 'video' | 'image' | 'text' | 'graphics';
      src?: string;
      text?: string;
    }>;
  } | null;
  /** Scene currently on Program output. */
  programScene?: {
    id: string;
    name?: string;
    layers?: Array<{
      id: string;
      type: 'video' | 'image' | 'text' | 'graphics';
      src?: string;
      text?: string;
    }>;
  } | null;
  /** Aspect ratios for each Triad canvas panel. */
  aspectRatios?: {
    scene?: string;
    preview?: string;
    program?: string;
  };
  /** All available scenes in the production. */
  scenes?: Array<{
    id: string;
    name: string;
    layers?: Array<{ id: string; type: 'video' | 'image' | 'text' | 'graphics'; src?: string; text?: string }>;
    outputs?: string[];
    timeline?: Array<{ id: string; time: string; label: string }>;
  }>;
  /** Active workspace id — drives WorkspaceShellRegistry lookup. */
  workspace?: string;
  /** Connected monitor configurations — passed to adaptToMonitors(). */
  monitors?: MonitorConfig[];
  /** Active output profiles — passed to adaptToAspectRatios(). */
  outputs?: OutputProfile[];
  /** Items queued for operator moderation review. */
  moderationQueue?: Array<{
    id: string;
    user: string;
    platform: string;
    time: string;
    text: string;
    velocity?: number;
    avatar?: string;
  }>;
  /** Engagement analytics for EngagementGraphsZone (Social Fabric). */
  engagement?: {
    timeline?: Array<{ time: string; value: number }>;
    platforms?: Array<{ name: string; value: number }>;
    reactions?: Array<{ count: number; color: string }>;
  };
  /** Unified chat messages for UnifiedChatZone (Social Fabric). */
  chat?: Array<{
    id: string;
    user: string;
    avatar?: string;
    platform: string;
    time: string;
    text: string;
    flagged?: boolean;
  }>;
  /** Multi-feed tiles for MultiFeedGridZone (Monitor Wall, Distribution). */
  feeds?: Array<{
    id: string;
    name: string;
    thumbnail?: string;
    source?: string;
    health?: 'healthy' | 'degraded' | 'offline';
    droppedFrames?: number;
  }>;
  /** Camera feeds for CameraGridZone (Replay Operator, Monitor Wall). */
  cameras?: Array<{
    id: string;
    name: string;
    thumbnail?: string;
    status?: 'live' | 'recording' | 'standby' | 'offline';
    resolution?: string;
  }>;
  /** Graphics state for the GraphicsComposerZone. */
  graphics?: {
    layers?: Array<{ id: string; type: string; name: string }>;
    timeline?: Array<{ id: string; time: string; label: string }>;
    preview?: { url: string } | null;
    templates?: Array<{ id: string; name: string }>;
    params?: Record<string, string>;
  };
  /** AI Crew insight items surfaced in the AiInspector. */
  aiInsights?: Array<{ id: string; type: string; message: string }>;
  /** True when the AI Crew module is active and injecting geometry. */
  aiCrewActive?: boolean;
  /** AI alert level — drives AI Insight Zone and Overlay sizing. */
  aiAlertLevel?: 'idle' | 'normal' | 'high';
  /** True when the floating AI Crew Overlay should be injected into the geometry map. */
  aiCrewOverlayEnabled?: boolean;
}

// ── Workspace shell contract ──────────────────────────────────────────────────

export type WorkspaceId = GeometryRole;

export interface WorkspaceShell {
  id: WorkspaceId;
  zones: ZoneDefinition[];
}
