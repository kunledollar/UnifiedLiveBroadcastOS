/**
 * Pure layout geometry calculation for the UBOS 3.15 Workspace Manager.
 *
 * Everything here is a pure function of (viewport, preset, collapsed zones):
 * no DOM access, no side effects, no runtime media objects. Geometry rules:
 *
 * - Center-stage receives all space freed by collapsing left/right/bottom docks.
 * - Program and Preview live inside center-stage and may never be covered by
 *   docks or the bottom workspace (docks are force-collapsed if needed).
 * - Below 1440px viewport width the right dock starts collapsed.
 * - Below 1200px viewport width the left dock starts collapsed.
 * - Below 900px viewport width Program and Preview stack vertically.
 */
import type {
  WorkspaceCenterEmphasis,
  WorkspaceLayoutInput,
  WorkspaceLayoutResult,
  WorkspaceRect,
  WorkspaceValidationIssue,
  WorkspaceZoneGeometry,
  WorkspaceZoneId,
} from './types.js';
import {
  CENTER_STAGE_MIN_WIDTH,
  LEFT_RAIL_WIDTH,
  MONITOR_STACK_WIDTH,
  TOP_RIBBON_HEIGHT,
  clampZoneSize,
  getResponsiveCollapsedZones,
  workspaceZoneDefinitions,
} from './zones.js';

const EMPTY_RECT: WorkspaceRect = { x: 0, y: 0, width: 0, height: 0 };

export function rectsOverlap(a: WorkspaceRect, b: WorkspaceRect): boolean {
  if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) return false;
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export function rectContains(outer: WorkspaceRect, inner: WorkspaceRect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/**
 * Merge preset, operator, and responsive collapse requests into the
 * effective set of collapsed zones. Non-collapsible zones are dropped with
 * a warning instead of being honoured.
 */
export function resolveCollapsedZones(
  viewportWidth: number,
  presetCollapsedZones: readonly WorkspaceZoneId[],
  operatorCollapsedZones: readonly WorkspaceZoneId[] = [],
  warnings?: string[],
): Set<WorkspaceZoneId> {
  const requested = new Set<WorkspaceZoneId>([
    ...getResponsiveCollapsedZones(viewportWidth),
    ...presetCollapsedZones,
    ...operatorCollapsedZones,
  ]);
  const collapsed = new Set<WorkspaceZoneId>();
  for (const zoneId of requested) {
    if (workspaceZoneDefinitions[zoneId]?.collapsible) {
      collapsed.add(zoneId);
    } else {
      warnings?.push(`Zone "${zoneId}" is not collapsible; collapse request ignored`);
    }
  }
  return collapsed;
}

interface MonitorSplit {
  programRect: WorkspaceRect;
  previewRect: WorkspaceRect;
}

/**
 * Split the center stage between Program and Preview. Side-by-side above
 * the 900px stacking threshold, stacked vertically below it.
 */
export function splitCenterStage(
  centerRect: WorkspaceRect,
  emphasis: WorkspaceCenterEmphasis,
  stacked: boolean,
): MonitorSplit {
  const programShare = emphasis === 'program' ? 0.62 : emphasis === 'preview' ? 0.38 : 0.5;
  if (centerRect.width <= 0 || centerRect.height <= 0) {
    return { programRect: { ...EMPTY_RECT }, previewRect: { ...EMPTY_RECT } };
  }
  if (stacked) {
    const programHeight = Math.round(centerRect.height * programShare);
    return {
      programRect: { x: centerRect.x, y: centerRect.y, width: centerRect.width, height: programHeight },
      previewRect: {
        x: centerRect.x,
        y: centerRect.y + programHeight,
        width: centerRect.width,
        height: centerRect.height - programHeight,
      },
    };
  }
  const programWidth = Math.round(centerRect.width * programShare);
  return {
    programRect: { x: centerRect.x, y: centerRect.y, width: programWidth, height: centerRect.height },
    previewRect: {
      x: centerRect.x + programWidth,
      y: centerRect.y,
      width: centerRect.width - programWidth,
      height: centerRect.height,
    },
  };
}

/**
 * Compute the full zone geometry for a viewport + preset combination.
 *
 * The result is deterministic layout metadata. Docks are force-collapsed
 * (right first, then left) whenever honouring their size would push
 * center-stage below its 900px minimum, so Program/Preview are never
 * squeezed or covered.
 */
export function calculateWorkspaceLayout(input: WorkspaceLayoutInput): WorkspaceLayoutResult {
  const warnings: string[] = [];
  const viewportWidth = Math.max(0, Math.floor(input.viewportWidth));
  const viewportHeight = Math.max(0, Math.floor(input.viewportHeight));
  const { preset } = input;

  const collapsed = resolveCollapsedZones(
    viewportWidth,
    preset.collapsedZones,
    input.collapsedZones ?? [],
    warnings,
  );

  const zoneSize = (zoneId: WorkspaceZoneId): number => {
    const zone = workspaceZoneDefinitions[zoneId];
    if (collapsed.has(zoneId)) return zone.collapsedSize;
    const override = input.zoneSizeOverrides?.[zoneId];
    if (override !== undefined && zone.resizable) {
      return clampZoneSize(zoneId, override);
    }
    return zone.defaultSize;
  };

  // Fixed chrome first.
  const topRibbonHeight = Math.min(TOP_RIBBON_HEIGHT, viewportHeight);
  const leftRailWidth = Math.min(LEFT_RAIL_WIDTH, viewportWidth);
  const contentTop = topRibbonHeight;
  const contentHeight = Math.max(0, viewportHeight - topRibbonHeight);

  // Bottom workspace spans the width right of the rail and must never eat
  // into the monitor row below a usable minimum.
  let bottomHeight = zoneSize('bottom-workspace');
  const maxBottomHeight = Math.max(0, contentHeight - 240);
  if (bottomHeight > maxBottomHeight) {
    bottomHeight = collapsed.has('bottom-workspace')
      ? Math.min(bottomHeight, contentHeight)
      : Math.min(workspaceZoneDefinitions['bottom-workspace'].collapsedSize, contentHeight);
    if (!collapsed.has('bottom-workspace')) {
      collapsed.add('bottom-workspace');
      warnings.push('bottom-workspace force-collapsed: viewport too short for the monitor row');
    }
  }
  const middleHeight = Math.max(0, contentHeight - bottomHeight);

  // Horizontal distribution: docks yield to center-stage's 900px floor.
  let leftDockWidth = zoneSize('left-dock');
  let rightDockWidth = zoneSize('right-dock');
  const availableForCenter = () => viewportWidth - leftRailWidth - leftDockWidth - rightDockWidth;

  if (availableForCenter() < CENTER_STAGE_MIN_WIDTH && rightDockWidth > 0) {
    rightDockWidth = workspaceZoneDefinitions['right-dock'].collapsedSize;
    collapsed.add('right-dock');
    warnings.push('right-dock force-collapsed: center-stage below its 900px minimum');
  }
  if (availableForCenter() < CENTER_STAGE_MIN_WIDTH && leftDockWidth > 0) {
    leftDockWidth = workspaceZoneDefinitions['left-dock'].collapsedSize;
    collapsed.add('left-dock');
    warnings.push('left-dock force-collapsed: center-stage below its 900px minimum');
  }
  const centerWidth = Math.max(0, availableForCenter());
  if (centerWidth < CENTER_STAGE_MIN_WIDTH) {
    warnings.push(`center-stage width ${centerWidth}px is below its ${CENTER_STAGE_MIN_WIDTH}px minimum on this viewport`);
  }

  const leftDockX = leftRailWidth;
  const centerX = leftDockX + leftDockWidth;
  const rightDockX = centerX + centerWidth;

  const geometry = (
    zoneId: WorkspaceZoneId,
    rect: WorkspaceRect,
  ): WorkspaceZoneGeometry => ({
    zoneId,
    rect,
    collapsed: collapsed.has(zoneId),
    visible: rect.width > 0 && rect.height > 0,
  });

  const centerRect: WorkspaceRect = { x: centerX, y: contentTop, width: centerWidth, height: middleHeight };
  const monitorsStacked = viewportWidth < MONITOR_STACK_WIDTH;
  const { programRect, previewRect } = splitCenterStage(centerRect, preset.centerEmphasis, monitorsStacked);

  const zones: Record<WorkspaceZoneId, WorkspaceZoneGeometry> = {
    'top-ribbon': geometry('top-ribbon', { x: 0, y: 0, width: viewportWidth, height: topRibbonHeight }),
    'left-rail': geometry('left-rail', { x: 0, y: contentTop, width: leftRailWidth, height: contentHeight }),
    'left-dock': geometry('left-dock', { x: leftDockX, y: contentTop, width: leftDockWidth, height: middleHeight }),
    'center-stage': geometry('center-stage', centerRect),
    'right-dock': geometry('right-dock', { x: rightDockX, y: contentTop, width: rightDockWidth, height: middleHeight }),
    'bottom-workspace': geometry('bottom-workspace', {
      x: leftRailWidth,
      y: contentTop + middleHeight,
      width: Math.max(0, viewportWidth - leftRailWidth),
      height: bottomHeight,
    }),
    // Placeholders: no screen space until floating windows / multi-monitor land.
    floating: geometry('floating', { ...EMPTY_RECT }),
    'external-monitor': geometry('external-monitor', { ...EMPTY_RECT }),
  };

  return {
    viewportWidth,
    viewportHeight,
    presetId: preset.id,
    zones,
    monitorsStacked,
    centerEmphasis: preset.centerEmphasis,
    programRect,
    previewRect,
    warnings,
  };
}

/**
 * Assert the safety invariants of a computed layout:
 * - No dock or bottom workspace overlaps Program/Preview.
 * - Program/Preview stay inside center-stage.
 * - Zones do not overlap each other.
 */
export function validateLayoutResult(result: WorkspaceLayoutResult): WorkspaceValidationIssue[] {
  const issues: WorkspaceValidationIssue[] = [];
  const issue = (code: string, message: string, subject?: string) => issues.push({ code, message, ...(subject !== undefined ? { subject } : {}) });

  const monitorRects: Array<[string, WorkspaceRect]> = [
    ['program', result.programRect],
    ['preview', result.previewRect],
  ];
  const occludingZones: WorkspaceZoneId[] = ['left-dock', 'right-dock', 'bottom-workspace', 'top-ribbon', 'left-rail'];
  for (const zoneId of occludingZones) {
    const zone = result.zones[zoneId];
    for (const [monitorName, monitorRect] of monitorRects) {
      if (rectsOverlap(zone.rect, monitorRect)) {
        issue('MONITOR_COVERED', `Zone "${zoneId}" overlaps the ${monitorName} monitor`, zoneId);
      }
    }
  }

  const centerRect = result.zones['center-stage'].rect;
  for (const [monitorName, monitorRect] of monitorRects) {
    if (monitorRect.width > 0 && monitorRect.height > 0 && !rectContains(centerRect, monitorRect)) {
      issue('MONITOR_OUTSIDE_CENTER', `The ${monitorName} monitor extends outside center-stage`, monitorName);
    }
  }

  const solidZones: WorkspaceZoneId[] = ['top-ribbon', 'left-rail', 'left-dock', 'center-stage', 'right-dock', 'bottom-workspace'];
  for (let i = 0; i < solidZones.length; i += 1) {
    for (let j = i + 1; j < solidZones.length; j += 1) {
      const a = result.zones[solidZones[i]!];
      const b = result.zones[solidZones[j]!];
      if (rectsOverlap(a.rect, b.rect)) {
        issue('ZONE_OVERLAP', `Zones "${a.zoneId}" and "${b.zoneId}" overlap`, a.zoneId);
      }
    }
  }
  return issues;
}
