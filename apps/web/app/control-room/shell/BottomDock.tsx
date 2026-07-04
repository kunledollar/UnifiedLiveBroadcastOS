'use client';

import type { ReactNode } from 'react';
import { Dock, DockTab, cn, ubosTypographyClasses } from '@ubos/ui';
import type { DockTabId } from './types';

const dockTabs: Array<{ id: DockTabId; label: string }> = [
  { id: 'audio', label: 'Audio' },
  { id: 'layers', label: 'Layers' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'replay', label: 'Replay' },
  { id: 'media', label: 'Media' },
  { id: 'logs', label: 'Logs' },
];

export function BottomDock({
  activeTab,
  onTabChange,
  children,
  className,
}: {
  activeTab: DockTabId;
  onTabChange: (id: DockTabId) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex shrink-0 flex-col overflow-hidden border-t border-ubos-border-subtle bg-ubos-graphite',
        'h-[var(--ubos-dock-total-height)] max-h-[var(--ubos-dock-total-height)]',
        className,
      )}
    >
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
      <div className="ubos-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-t border-ubos-border-subtle">
        {children}
      </div>
    </section>
  );
}
