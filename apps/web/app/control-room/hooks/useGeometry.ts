'use client';

/**
 * useGeometry — Step 50
 *
 * React hook that subscribes to WorkspaceManager geometry updates.
 * Returns the current GeometryMap and re-renders whenever any of the
 * following changes trigger a geometry recompute:
 *
 *   - workspace switching
 *   - role changes
 *   - scene changes
 *   - monitor configuration
 *   - output profiles
 *   - AI Crew activation / alert level
 */
import { useEffect, useState } from 'react';
import type { GeometryMap } from '@ubos/shared';
import { workspaceManager } from '../state/workspace-manager-instance';

export function useGeometry(): GeometryMap {
  const [zones, setZones] = useState<GeometryMap>(() =>
    workspaceManager.getGeometryMap(),
  );

  useEffect(() => {
    const listener = (newZones: GeometryMap) => {
      setZones({ ...newZones });
    };

    workspaceManager.onGeometryChange(listener);

    return () => {
      workspaceManager.removeGeometryListener(listener);
    };
  }, []);

  return zones;
}
