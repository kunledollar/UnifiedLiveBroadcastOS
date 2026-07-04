'use client';

import type { ReactNode } from 'react';
import { Dock, DockTab, cn } from '@ubos/ui';
import type { DockTabId } from './types';

const dockTabs: Array<{ id: DockTabId; label: string }> = [
  { id: 'audio', label: 'Audio' },
  { id: 'layers', label: 'Layers' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'media', label: 'Media' },
  { id: 'replay', label: 'Replay' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'automation', label: 'Automation' },
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
    <section className={cn('flex shrink-0 flex-col border-t border-ubos-border-subtle bg-ubos-graphite', className)}>
      <Dock>
        {dockTabs.map((tab) => (
          <DockTab
            key={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </Dock>
      <div className="ubos-scroll h-24 min-h-0 overflow-y-auto border-t border-ubos-border-subtle px-ubos-3 py-ubos-2">
        {children}
      </div>
    </section>
  );
}
