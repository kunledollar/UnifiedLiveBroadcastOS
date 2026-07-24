/**
 * UBOS Geometry Engine — Adaptive Canvas Engine
 *
 * Handles letterboxing and pillarboxing when the output aspect ratio
 * differs from the production canvas, and supports simultaneous
 * multi-aspect output (e.g. 16:9 + 9:16 social vertical).
 */
import type { CanvasRect, OutputProfile } from './types.js';

export interface AdaptiveCanvasEngine {
  /**
   * Compute the active canvas rectangle for a given output profile
   * within the available render area.
   */
  renderCanvas(profile: OutputProfile): CanvasRect;

  /**
   * Apply letterboxing (horizontal black bars) when the output is
   * wider than the source canvas (e.g. source 4:3, output 16:9).
   */
  applyLetterboxing(): void;

  /**
   * Apply pillarboxing (vertical black bars) when the output is
   * taller than the source canvas (e.g. source 16:9, output 9:16).
   */
  applyPillarboxing(): void;

  /**
   * Enable simultaneous multi-aspect output rendering so a single
   * production can deliver 16:9, 1:1, and 9:16 concurrently.
   */
  supportMultiAspect(): void;
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

  get isLetterboxed() { return this.letterboxed; }
  get isPillarboxed() { return this.pillarboxed; }
  get isMultiAspect()  { return this.multiAspect; }
}
