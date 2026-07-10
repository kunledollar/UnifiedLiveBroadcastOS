'use client';

/**
 * UBOS 3.15 Phase 1 — active Command Center dock resize handle.
 *
 * Uses Pointer Events with pointer capture and delegates all persisted geometry
 * through useCommandCenterWorkspace().setZoneSize(), keeping Workspace Manager
 * as the sole layout owner. This component stores no runtime media handles.
 */
import { useCallback, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '@ubos/ui';
import type { CommandCenterZoneToggleId } from './useCommandCenterWorkspace';

export type DockResizeHandleProps = {
  zoneId: CommandCenterZoneToggleId;
  currentSize: number;
  onResize: (zoneId: CommandCenterZoneToggleId, newSize: number) => void;
  disabled?: boolean;
};

const LABEL: Record<CommandCenterZoneToggleId, string> = {
  'left-dock': 'Resize sources dock',
  'right-dock': 'Resize operations dock',
  'bottom-workspace': 'Resize bottom workspace',
};

function applyDelta(zoneId: CommandCenterZoneToggleId, currentSize: number, delta: number): number {
  if (zoneId === 'left-dock') return currentSize + delta;
  return currentSize - delta;
}

export function DockResizeHandle({ zoneId, currentSize, onResize, disabled = false }: DockResizeHandleProps) {
  const currentSizeRef = useRef(currentSize);
  currentSizeRef.current = currentSize;
  const pointerStartRef = useRef<number | null>(null);

  const isBottom = zoneId === 'bottom-workspace';

  const requestResize = useCallback(
    (delta: number) => {
      onResize(zoneId, applyDelta(zoneId, currentSizeRef.current, delta));
    },
    [onResize, zoneId],
  );

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointerStartRef.current = isBottom ? event.clientY : event.clientX;
    },
    [disabled, isBottom],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (disabled || pointerStartRef.current === null) return;
      const position = isBottom ? event.clientY : event.clientX;
      const delta = position - pointerStartRef.current;
      if (delta === 0) return;
      pointerStartRef.current = position;
      requestResize(delta);
    },
    [disabled, isBottom, requestResize],
  );

  const endPointer = useCallback((event: PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const step = event.shiftKey ? 24 : 8;
      let delta = 0;
      if (isBottom) {
        if (event.key === 'ArrowUp') delta = step;
        if (event.key === 'ArrowDown') delta = -step;
      } else {
        if (event.key === 'ArrowLeft') delta = -step;
        if (event.key === 'ArrowRight') delta = step;
      }
      if (delta === 0) return;
      event.preventDefault();
      requestResize(delta);
    },
    [disabled, isBottom, requestResize],
  );

  return (
    <div
      role="separator"
      tabIndex={disabled ? -1 : 0}
      aria-label={LABEL[zoneId]}
      aria-orientation={isBottom ? 'horizontal' : 'vertical'}
      aria-disabled={disabled}
      aria-valuenow={Math.round(currentSize)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onLostPointerCapture={() => { pointerStartRef.current = null; }}
      onKeyDown={onKeyDown}
      className={cn(
        'group relative shrink-0 touch-none select-none outline-none',
        'focus-visible:ring-2 focus-visible:ring-ubos-selection/60 focus-visible:ring-offset-1 focus-visible:ring-offset-ubos-carbon',
        disabled ? 'cursor-default opacity-40' : isBottom ? 'cursor-row-resize' : 'cursor-col-resize',
        isBottom ? 'h-2' : 'w-2',
      )}
    >
      <div
        className={cn(
          'absolute transition-colors duration-ubos-fast',
          disabled
            ? 'bg-ubos-border-subtle'
            : 'bg-ubos-border-subtle group-hover:bg-ubos-selection-muted group-active:bg-ubos-selection group-focus-visible:bg-ubos-selection',
          isBottom
            ? 'inset-x-0 top-1/2 h-0.5 -translate-y-1/2'
            : 'inset-y-0 left-1/2 w-0.5 -translate-x-1/2',
        )}
      />
    </div>
  );
}
