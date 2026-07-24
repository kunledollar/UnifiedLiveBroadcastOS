/**
 * AiInsightZone — Step 47
 *
 * Geometry definition for the AI Insight Zone — a right-side contextual
 * overlay injected into any workspace shell when AI Crew is active.
 *
 * This is not a workspace shell zone. It is a geometry module that the
 * GeometryEngine injects into computeZones() output when:
 *   state.aiCrewActive === true
 *
 * Zone behavior:
 *   aiAlertLevel === "high"  → zone expands (height × 1.2)
 *   aiAlertLevel === "idle"  → zone shrinks (height × 0.8)
 *   aiAlertLevel === "normal" → default rect
 *
 * Surfaces:
 *   - AI scene analysis
 *   - AI production insights
 *   - AI risk detection
 *   - AI automation suggestions
 *   - AI timeline predictions
 *   - AI operator assistance
 */
import type { ZoneDefinition } from '../types.js';

export const AiInsightZone: ZoneDefinition = {
  id: 'ai-insight',
  rect: {
    x: 0.75,
    y: 0.0,
    width: 0.25,
    height: 0.50,
  },
  normalized: true,
  minWidth: 200,
  minHeight: 160,
  collapsible: true,
  resizable: true,
};
