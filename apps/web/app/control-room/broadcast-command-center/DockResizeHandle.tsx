'use client';

/**
 * UBOS 3.15D-5 — Dock resize handle.
 *
 * Thin wrapper around ZoneResizeHandle that translates drag deltas into
 * absolute zone sizes and routes them through the Workspace Manager
 * `setZoneSize` callback. Handles left dock (vertical), right dock
 * (vertical), and bottom workspace (horizontal).
 *
 * Safety: if the layout is locked or the zone is collapsed, the handle
 * is rendered in a disabled state and ignores pointer events.
 */
import { useCallback, useRef } from 'react';
import type { CommandCenterZoneToggleId } from '../command-center/useCommandCenterWorkspace';
import { ZoneResizeHandle } from './ZoneResizeHandle';

export type DockResizeHandleProps = {
  /** Zone this handle controls. */
  zoneId: CommandCenterZoneToggleId;
  /** Current rendered size in pixels (width for left/right, height for bottom). */
  currentSize: number;
  /** Called with the new requested size after each pointer move. Clamped in the hook. */
  onResize: (zoneId: CommandCenterZoneToggleId, newSize: number) => void;
  /** Disables the handle (layout locked, zone collapsed, etc.). */
  disabled?: boolean;
};

const LABEL: Record<CommandCenterZoneToggleId, string> = {
  'left-dock': 'Resize sources dock',
  'right-dock': 'Resize operations dock',
  'bottom-workspace': 'Resize bottom workspace',
};

export function DockResizeHandle({ zoneId, currentSize, onResize, disabled }: DockResizeHandleProps) {
  // Keep a ref so the delta handler always sees the latest size without
  // being recreated on every render (avoids missing pointer-up teardown).
  const currentSizeRef = useRef(currentSize);
  currentSizeRef.current = currentSize;

  const orientation = zoneId === 'bottom-workspace' ? 'horizontal' : 'vertical';

  const handleDelta = useCallback(
    (delta: number) => {
      let newSize: number;
      if (zoneId === 'left-dock') {
        // Handle is on the right edge of the left dock.
        // Dragging right (+delta) → left dock grows.
        newSize = currentSizeRef.current + delta;
      } else if (zoneId === 'right-dock') {
        // Handle is on the left edge of the right dock.
        // Dragging right (+delta) → right dock shrinks.
        newSize = currentSizeRef.current - delta;
      } else {
        // Handle is on the top edge of the bottom workspace.
        // Dragging down (+delta) → bottom workspace shrinks.
        newSize = currentSizeRef.current - delta;
      }
      onResize(zoneId, newSize);
    },
    [zoneId, onResize],
  );

  return (
    <ZoneResizeHandle
      orientation={orientation}
      onResizeDelta={handleDelta}
      disabled={disabled ?? false}
      label={LABEL[zoneId]}
    />
  );
}
