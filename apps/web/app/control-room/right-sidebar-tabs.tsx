'use client';

import { useState, type ReactNode } from 'react';

export type RightSidebarTab = {
  id: 'guests' | 'outputs' | 'chat' | 'routing' | 'inspector' | 'health' | 'audio' | 'logs' | 'ai';
  label: string;
  content: ReactNode;
};

const order = [
  'guests',
  'inspector',
  'routing',
  'health',
  'outputs',
  'chat',
  'audio',
  'logs',
  'ai',
];

export function RightSidebarTabs({ tabs }: { tabs: RightSidebarTab[] }) {
  const sortedTabs = [...tabs].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const [active, setActive] = useState(sortedTabs[0]?.id ?? 'guests');
  const activeTab = sortedTabs.find((tab) => tab.id === active) ?? sortedTabs[0];

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/85 shadow-2xl shadow-black/25">
      <div className="shrink-0 border-b border-white/10 p-2">
        <p className="mb-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
          Operations Console
        </p>
        <div className="grid grid-cols-2 gap-1">
          {sortedTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeTab?.id === tab.id}
              onClick={() => setActive(tab.id)}
              className={`rounded-lg px-2 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] transition ${
                activeTab?.id === tab.id
                  ? 'bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-300/25'
                  : 'bg-black/20 text-slate-500 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="mb-2 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-2">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100">
            Context Inspector
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-slate-300">
            {[
              'Camera ready',
              'Mic nominal',
              'Network stable',
              'Recording idle',
              'Assign scene',
              'Assign slot',
              'Pin',
              'Mute',
            ].map((item) => (
              <span key={item} className="rounded bg-slate-950/70 px-2 py-1">
                {item}
              </span>
            ))}
          </div>
        </div>
        {activeTab?.content}
      </div>
    </section>
  );
}
