'use client';
import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';

const TABS = ['Logs', 'Notes', 'Automation', 'Routing'] as const;
type Tab = typeof TABS[number];

export function WorkbenchZone({ state: _ }: { state: ProductionState }) {
  const [activeTab, setActiveTab] = useState<Tab>('Logs');

  return (
    <div className="workbench-zone flex h-full w-full flex-col overflow-hidden border-t border-[#1e2530] bg-[#080c12]">
      <header className="flex items-center gap-1 border-b border-[#1e2530] px-2">
        <h3 className="mr-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Workbench</h3>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-1.5 text-[9px] font-medium transition-colors ${
              activeTab === tab
                ? 'border-b border-[#7c6af7] text-[#7c6af7]'
                : 'text-[#334155] hover:text-[#475569]'
            }`}
          >
            {tab}
          </button>
        ))}
      </header>

      <div className="flex-1 overflow-auto p-2 text-[10px] text-[#334155]">
        {/* Logs */}
        {activeTab === 'Logs' && <p>No recent events.</p>}
        {/* Notes */}
        {activeTab === 'Notes' && <p>Production notes will appear here.</p>}
        {/* Automation */}
        {activeTab === 'Automation' && <p>Automation cues will appear here.</p>}
        {/* Routing */}
        {activeTab === 'Routing' && <p>Routing matrix will appear here.</p>}
      </div>
    </div>
  );
}
