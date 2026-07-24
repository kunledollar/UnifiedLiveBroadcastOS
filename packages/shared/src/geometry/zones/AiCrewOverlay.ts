/**
 * AiCrewOverlay — Step 48
 *
 * Geometry definition for the AI Crew Overlay — a floating, adaptive,
 * scene-aware overlay that appears on top of the Triad or Scene zone
 * when AI Crew is actively assisting the operator.
 *
 * Unlike fixed zones, this overlay:
 *   - Floats above the Triad, Scene, Replay Monitor, Output, or Graph
 *   - Moves based on operator role (applyAiCrewOverlayGeometry)
 *   - Scales based on AI alert level
 *   - Only appears when state.aiCrewActive && state.aiCrewOverlayEnabled
 *
 * Default position: slight inset from top-left of the content area.
 * Role-specific positions are applied by GeometryEngine at compute time.
 */
import type { ZoneDefinition } from '../types.js';

export const AiCrewOverlay: ZoneDefinition = {
  id: 'ai-crew-overlay',
  rect: {
    x: 0.05,
    y: 0.05,
    width: 0.40,
    height: 0.30,
  },
  normalized: true,
  minWidth: 200,
  minHeight: 120,
  collapsible: true,
  resizable: true,
};
