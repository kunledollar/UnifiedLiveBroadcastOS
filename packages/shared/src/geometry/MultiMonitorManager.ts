/**
 * UBOS Geometry Engine — Multi-Monitor Manager
 *
 * Assigns geometry zones to physical or virtual monitors.
 * Enables UBOS to distribute the Program monitor, Preview monitor,
 * confidence surfaces, and operational zones across multiple screens.
 */
import type { MonitorConfig, MonitorZoneMap } from './types.js';

export interface MultiMonitorManager {
  /**
   * Assign zones to monitors based on their configuration.
   * Returns a MonitorZoneMap: monitor id → list of zone ids.
   */
  assignZones(monitors: MonitorConfig[]): MonitorZoneMap;
}

// ── Default implementation ────────────────────────────────────────────────────

/**
 * Priority-based zone assignment:
 * - Primary monitor gets Program + Preview + Workbench
 * - Secondary monitor (if present) gets Inspector + Output + Graph
 * - Additional monitors get confidence / auxiliary zones
 */
export class UbosMultiMonitorManager implements MultiMonitorManager {
  private static readonly PRIMARY_ZONES = ['scene', 'workbench', 'dock'];
  private static readonly SECONDARY_ZONES = ['inspector', 'output', 'graph'];
  private static readonly AUXILIARY_ZONES = ['triad'];

  assignZones(monitors: MonitorConfig[]): MonitorZoneMap {
    if (monitors.length === 0) return {};

    const sorted = [...monitors].sort((a, b) =>
      a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1,
    );

    const map: MonitorZoneMap = {};

    for (let i = 0; i < sorted.length; i++) {
      const monitor = sorted[i];
      if (!monitor) continue;

      if (i === 0) {
        map[monitor.id] = [...UbosMultiMonitorManager.PRIMARY_ZONES];
      } else if (i === 1) {
        map[monitor.id] = [...UbosMultiMonitorManager.SECONDARY_ZONES];
      } else {
        map[monitor.id] = [...UbosMultiMonitorManager.AUXILIARY_ZONES];
      }
    }

    return map;
  }
}
