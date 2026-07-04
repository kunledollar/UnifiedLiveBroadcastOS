'use client';

import { useState, type ReactNode } from 'react';

export type RightSidebarTab = {
  id: 'guests' | 'outputs' | 'chat' | 'audio' | 'health' | 'logs' | 'ai';
  label: string;
  content: ReactNode;
};

export function RightSidebarTabs({ tabs }: { tabs: RightSidebarTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? 'guests');
  const activeTab = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 shadow-2xl shadow-black/25">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab?.id === tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition ${
              activeTab?.id === tab.id
                ? 'bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-300/25'
                : 'text-slate-500 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">{activeTab?.content}</div>
    </section>
  );
}
