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
  blendAspects(canvases: Record<string, CanvasRect>): number;
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
   * Compute the weighted average (blended) aspect ratio across all
   * canvas rects. Used for multi-destination aspect blending.
   */
  blendAspects(canvases: Record<string, CanvasRect>): number {
    const aspects = Object.values(canvases).map((c) => c.width / c.height);
    if (aspects.length === 0) return 1;

    const sum = aspects.reduce((a, b) => a + b, 0);
    return sum / aspects.length;
  }

  /**
   * Adjust a TriadZone rect based on the blended output aspect ratio.
   * Portrait-dominant outputs grow zone height and shrink width;
   * landscape-dominant outputs do the inverse.
   */
  applyTriadAspect(rect: Rect, canvases: Record<string, CanvasRect>): Rect {
    const blended = this.blendAspects(canvases);

    if (blended < 1) {
      // Portrait-dominant (TikTok, IG Reels)
      return {
        ...rect,
        height: Math.round(rect.height * 1.25),
        width: Math.round(rect.width * 0.85),
      };
    } else {
      // Landscape-dominant (YouTube, Twitch, Facebook)
      return {
        ...rect,
        width: Math.round(rect.width * 1.25),
        height: Math.round(rect.height * 0.85),
      };
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
