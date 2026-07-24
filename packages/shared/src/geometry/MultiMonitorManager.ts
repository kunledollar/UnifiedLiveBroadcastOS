/**
 * UBOS Geometry Engine — Multi-Monitor Manager (Step 34 update)
 *
 * assignZones() now returns MonitorZoneMap = Record<string, Rect>:
 * zone id → the display Rect on the monitor that hosts that zone.
 *
 * Single-monitor setups return an empty map so the geometry engine
 * falls back to workspace-shell defaults for every zone.
 * Multi-monitor setups assign secondary/auxiliary zones to the full
 * area of their respective monitors.
 */
import type { MonitorConfig, MonitorZoneMap, Rect } from './types.js';

export interface MultiMonitorManager {
  /**
   * Assign zones to monitors and return a zone id → Rect map.
   * Zones listed in the returned map are hosted on a dedicated monitor
   * and their rect equals that monitor's full display area.
   * Zones absent from the map use workspace-shell defaults.
   */
  assignZones(monitors: MonitorConfig[]): MonitorZoneMap;
}

// ── Default implementation ────────────────────────────────────────────────────

const PRIMARY_ZONES   = ['scene', 'workbench', 'dock'] as const;
const SECONDARY_ZONES = ['inspector', 'output', 'graph'] as const;
const AUXILIARY_ZONES = ['triad'] as const;

export class UbosMultiMonitorManager implements MultiMonitorManager {
  assignZones(monitors: MonitorConfig[]): MonitorZoneMap {
    const map: MonitorZoneMap = {};

    // Single-monitor or no-monitor: return empty map; geometry engine
    // uses workspace-shell zone rects as the authoritative defaults.
    if (monitors.length <= 1) return map;

    // Sort: primary monitor first
    const sorted = [...monitors].sort((a, b) =>
      a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1,
    );

    // Skip index 0 (primary monitor uses workspace defaults).
    // Secondary and auxiliary monitors get full-area zone rects.
    for (let i = 1; i < sorted.length; i++) {
      const monitor = sorted[i];
      if (!monitor) continue;

      const monitorRect: Rect = {
        x: 0,
        y: 0,
        width: monitor.width,
        height: monitor.height,
      };

      const assignedZones = i === 1 ? SECONDARY_ZONES : AUXILIARY_ZONES;
      for (const zoneId of assignedZones) {
        map[zoneId] = monitorRect;
      }
    }

    return map;
  }
}
