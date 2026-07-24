/**
 * UBOS Geometry Engine — Adaptive Canvas Engine
 *
 * Handles letterboxing and pillarboxing when the output aspect ratio
 * differs from the production canvas, and supports simultaneous
 * multi-aspect output (e.g. 16:9 + 9:16 social vertical).
 */
import type { CanvasRect, OutputProfile, Rect } from './types.js';

export interface AdaptiveCanvasEngine {
  renderCanvas(profile: OutputProfile): CanvasRect;
  renderAll(outputs: OutputProfile[]): Record<string, CanvasRect>;
  applyLetterboxing(): void;
  applyPillarboxing(): void;
  supportMultiAspect(): void;
  applyTriadAspect(rect: Rect, canvases: Record<string, CanvasRect>): Rect;
  applyOutputAspect(rect: Rect, canvases: Record<string, CanvasRect>): Rect;
}

// ── Default implementation ────────────────────────────────────────────────────

export class UbosAdaptiveCanvasEngine implements AdaptiveCanvasEngine {
  private sourceWidth = 1920;
  private sourceHeight = 1080;
  private letterboxed = false;
  private pillarboxed = false;
  private multiAspect = false;

  constructor(sourceWidth = 1920, sourceHeight = 1080) {
    this.sourceWidth = sourceWidth;
    this.sourceHeight = sourceHeight;
  }

  renderCanvas(profile: OutputProfile): CanvasRect {
    const sourceAspect = this.sourceWidth / this.sourceHeight;
    const outputAspect = profile.width / profile.height;

    let scale: number;
    let offsetX = 0;
    let offsetY = 0;
    let canvasWidth: number;
    let canvasHeight: number;

    if (Math.abs(sourceAspect - outputAspect) < 0.001) {
      // Aspects match — no boxing needed
      scale = profile.width / this.sourceWidth;
      canvasWidth = profile.width;
      canvasHeight = profile.height;
    } else if (sourceAspect > outputAspect) {
      // Source is wider → letterbox (bars on top and bottom)
      scale = profile.width / this.sourceWidth;
      canvasWidth = profile.width;
      canvasHeight = Math.round(this.sourceHeight * scale);
      offsetY = Math.round((profile.height - canvasHeight) / 2);
    } else {
      // Source is taller → pillarbox (bars on left and right)
      scale = profile.height / this.sourceHeight;
      canvasHeight = profile.height;
      canvasWidth = Math.round(this.sourceWidth * scale);
      offsetX = Math.round((profile.width - canvasWidth) / 2);
    }

    return {
      x: offsetX,
      y: offsetY,
      width: canvasWidth,
      height: canvasHeight,
      offsetX,
      offsetY,
      scale,
    };
  }

  applyLetterboxing(): void {
    this.letterboxed = true;
    this.pillarboxed = false;
  }

  applyPillarboxing(): void {
    this.pillarboxed = true;
    this.letterboxed = false;
  }

  supportMultiAspect(): void {
    this.multiAspect = true;
  }

  /**
   * Render canvas rects for every output profile in one pass.
   * Returns a map of output id → CanvasRect.
   */
  renderAll(outputs: OutputProfile[]): Record<string, CanvasRect> {
    const result: Record<string, CanvasRect> = {};
    outputs.forEach((output) => {
      result[output.id] = this.renderCanvas(output);
    });
    return result;
  }

  /**
   * Adjust a TriadZone rect based on the dominant output aspect ratio.
   * Portrait outputs (aspect < 1) grow the zone height;
   * landscape outputs grow the zone width.
   */
  applyTriadAspect(rect: Rect, canvases: Record<string, CanvasRect>): Rect {
    const dominant = Object.values(canvases)[0];
    if (!dominant) return rect;

    const aspect = dominant.width / dominant.height;

    if (aspect < 1) {
      // Portrait → taller triad zone
      return { ...rect, height: Math.round(rect.height * 1.15) };
    } else {
      // Landscape → wider triad zone
      return { ...rect, width: Math.round(rect.width * 1.15) };
    }
  }

  /**
   * Adjust an OutputZone rect when many simultaneous destinations exist.
   * More than 3 outputs widens the zone to accommodate more status rows.
   */
  applyOutputAspect(rect: Rect, canvases: Record<string, CanvasRect>): Rect {
    if (Object.keys(canvases).length > 3) {
      return { ...rect, width: Math.round(rect.width * 1.2) };
    }
    return rect;
  }

  get isLetterboxed() { return this.letterboxed; }
  get isPillarboxed() { return this.pillarboxed; }
  get isMultiAspect()  { return this.multiAspect; }
}
