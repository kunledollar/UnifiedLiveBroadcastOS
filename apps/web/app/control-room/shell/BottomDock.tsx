'use client';

import { useCallback, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Dock, DockTab, cn, ubosTypographyClasses } from '@ubos/ui';
import type { DockTabId } from './types';
import {
  DOCK_CONTENT_DEFAULT_PX,
  DOCK_CONTENT_MAX_PX,
  DOCK_CONTENT_MIN_PX,
  DOCK_TAB_HEIGHT_PX,
  clampDockContentHeight,
} from './control-room-layout';

const dockTabs: Array<{ id: DockTabId; label: string }> = [
  { id: 'audio', label: 'Audio' },
  { id: 'layers', label: 'Layers' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'replay', label: 'Replay' },
  { id: 'media', label: 'Media' },
  { id: 'collaboration', label: 'Team' },
  { id: 'automation', label: 'ROS' },
  { id: 'logs', label: 'Logs' },
];

export function BottomDock({
  activeTab,
  onTabChange,
  contentHeightPx,
  onContentHeightChange,
  children,
  className,
}: {
  activeTab: DockTabId;
  onTabChange: (id: DockTabId) => void;
  contentHeightPx?: number;
  onContentHeightChange?: (heightPx: number) => void;
  children: ReactNode;
  className?: string;
}) {
  const resizingRef = useRef(false);
  const resolvedContentHeight = clampDockContentHeight(contentHeightPx ?? DOCK_CONTENT_DEFAULT_PX);
  const totalHeightPx = DOCK_TAB_HEIGHT_PX + resolvedContentHeight;

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!onContentHeightChange) return;
      event.preventDefault();
      resizingRef.current = true;
      const startY = event.clientY;
      const startHeight = resolvedContentHeight;

      const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
        if (!resizingRef.current) return;
        const delta = startY - moveEvent.clientY;
        onContentHeightChange(clampDockContentHeight(startHeight + delta));
      };

      const handlePointerUp = () => {
        resizingRef.current = false;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [onContentHeightChange, resolvedContentHeight],
  );

  return (
    <section
      className={cn(
        'relative flex shrink-0 flex-col overflow-hidden border-t border-ubos-border-subtle bg-ubos-graphite',
        !contentHeightPx && 'h-[var(--ubos-dock-total-height)] max-h-[var(--ubos-dock-total-height)]',
        className,
      )}
      style={
        contentHeightPx
          ? { height: totalHeightPx, maxHeight: totalHeightPx, minHeight: DOCK_TAB_HEIGHT_PX + DOCK_CONTENT_MIN_PX }
          : undefined
      }
    >
      {onContentHeightChange ? (
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize dock panel"
          aria-valuemin={DOCK_CONTENT_MIN_PX}
          aria-valuemax={DOCK_CONTENT_MAX_PX}
          aria-valuenow={resolvedContentHeight}
          onPointerDown={handleResizePointerDown}
          className="group absolute inset-x-0 top-0 z-10 flex h-1.5 cursor-row-resize items-center justify-center hover:bg-ubos-selection/20"
        >
          <span className="h-0.5 w-10 rounded-full bg-ubos-border-strong opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      ) : null}
      <Dock className="border-t-0">
        {dockTabs.map((tab) => (
          <DockTab
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              ubosTypographyClasses.metadata,
              'font-semibold uppercase tracking-wide',
            )}
          />
        ))}
      </Dock>
      <div
        className="ubos-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-t border-ubos-border-subtle"
        style={contentHeightPx ? { height: resolvedContentHeight, maxHeight: resolvedContentHeight } : undefined}
      >
        {children}
      </div>
    </section>
  );
}
