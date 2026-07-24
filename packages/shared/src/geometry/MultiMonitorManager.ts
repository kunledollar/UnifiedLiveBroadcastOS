/**
 * UBOS Geometry Engine — Multi-Monitor Manager (Step 35)
 *
 * assignZones() applies context-aware zone-to-monitor rules:
 *
 *   Single monitor  → no overrides (zones use workspace-shell defaults)
 *   Dual monitor    → Inspector (35%) + Output (65%) move to monitor 2
 *   Triple monitor  → Scene on left, Triad on center, Inspector on right
 *   Quad monitor    → Scene, Triad, Inspector, Output each own a monitor
 *   5+ monitors     → primary monitor + secondary (zones 1-3) +
 *                     tertiary (triad) + remaining monitors as video wall
 */
import type { MonitorConfig, MonitorZoneMap, Rect } from './types.js';

export interface MultiMonitorManager {
  /**
   * Assign zones to monitors and return a zone id → Rect map.
   * Zones in the returned map are hosted on a specific monitor at the
   * specified Rect. Absent zones use workspace-shell defaults.
   */
  assignZones(monitors: MonitorConfig[]): MonitorZoneMap;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function monitorRect(m: MonitorConfig): Rect {
  return { x: m.x, y: m.y, width: m.width, height: m.height };
}

// ── Default implementation ────────────────────────────────────────────────────

export class UbosMultiMonitorManager implements MultiMonitorManager {
  private readonly initialMonitors: MonitorConfig[];

  constructor(monitors: MonitorConfig[] = []) {
    this.initialMonitors = monitors;
  }

  assignZones(monitors: MonitorConfig[]): MonitorZoneMap {
    const map: MonitorZoneMap = {};

    // ── Single monitor → no override ──────────────────────────────────────────
    if (monitors.length <= 1) {
      return map;
    }

    // ── Dual monitor → Inspector + Output move to monitor 2 ──────────────────
    if (monitors.length === 2) {
      const [, m2] = monitors;
      if (!m2) return map;

      map['inspector'] = {
        x: m2.x,
        y: m2.y,
        width: Math.round(m2.width * 0.35),
        height: m2.height,
      };

      map['output'] = {
        x: m2.x + Math.round(m2.width * 0.35),
        y: m2.y,
        width: Math.round(m2.width * 0.65),
        height: m2.height,
      };

      return map;
    }

    // ── Triple monitor → Scene left · Triad center · Inspector right ──────────
    if (monitors.length === 3) {
      const [left, center, right] = monitors;

      if (left)   map['scene']     = monitorRect(left);
      if (center) map['triad']     = monitorRect(center);
      if (right)  map['inspector'] = monitorRect(right);

      return map;
    }

    // ── Quad monitor → each zone owns a dedicated monitor ─────────────────────
    if (monitors.length === 4) {
      const [m1, m2, m3, m4] = monitors;

      if (m1) map['scene']     = monitorRect(m1);
      if (m2) map['triad']     = monitorRect(m2);
      if (m3) map['inspector'] = monitorRect(m3);
      if (m4) map['output']    = monitorRect(m4);

      return map;
    }

    // ── 5+ monitors → standard quad assignment + video-wall remainder ─────────
    const [m1, m2, m3, m4, ...rest] = monitors;

    if (m1) map['scene']     = monitorRect(m1);
    if (m2) map['triad']     = monitorRect(m2);
    if (m3) map['inspector'] = monitorRect(m3);
    if (m4) map['output']    = monitorRect(m4);

    // Additional monitors receive the graph zone spanning their combined area
    if (rest.length > 0) {
      const first = rest[0]!;
      const last  = rest[rest.length - 1]!;
      map['graph'] = {
        x: first.x,
        y: first.y,
        width: last.x + last.width - first.x,
        height: Math.max(...rest.map((m) => m.height)),
      };
    }

    return map;
  }
}
