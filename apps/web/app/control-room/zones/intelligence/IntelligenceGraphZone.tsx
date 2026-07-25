'use client';

import { useEffect, useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { UigInsightKind, UigNodeType } from '../../intelligence-graph/ubosIntelligenceGraph';

const kindColor: Record<UigInsightKind, string> = {
  warning:        'text-red-400',
  prediction:     'text-sky-400',
  recommendation: 'text-amber-400',
  guidance:       'text-emerald-400',
};

const kindBadge: Record<UigInsightKind, string> = {
  warning:        'bg-red-500/15 text-red-400',
  prediction:     'bg-sky-500/15 text-sky-400',
  recommendation: 'bg-amber-500/15 text-amber-400',
  guidance:       'bg-emerald-500/15 text-emerald-400',
};

const TYPE_ORDER: UigNodeType[] = [
  'SceneNode',
  'GraphicsNode',
  'AudioNode',
  'ReplayNode',
  'RoutingNode',
  'AutomationNode',
  'OutputNode',
  'HealthNode',
  'OperatorNode',
  'SystemNode',
  'PredictionNode',
];

export function IntelligenceGraphZone({ state: _ }: { state: ProductionState }) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      workspaceState.refreshIntelligenceGraph();
      forceRender((n) => n + 1);
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  const graph = workspaceState.intelligenceGraph;
  const snapshot = graph.getSnapshot();
  const insights = snapshot.latestInsights;
  const nodes = graph.getNodes().slice(-12).reverse();
  const edges = graph.getEdges().slice(-10).reverse();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Intelligence Graph
        </h4>
        <span className="rounded bg-[#7c6af7]/15 px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#7c6af7]">
          UIG
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-3 text-[9px]">
        <span className="text-[#94a3b8]">{snapshot.nodeCount} nodes</span>
        <span className="text-[#475569]">{snapshot.edgeCount} edges</span>
        <span className="text-[#64748b]">{snapshot.eventCount} events</span>
        <span className="text-[#334155]">{snapshot.insightCount} insights</span>
      </div>

      <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Normalized events</p>
      <div className="mb-3 flex flex-col gap-0.5 overflow-y-auto" style={{ maxHeight: '88px' }}>
        {snapshot.latestEvents.map((event) => (
          <div key={`${event.id}-${event.timestamp}`} className="flex items-center gap-1.5 px-1 py-0.5 text-[8px]">
            <span className="shrink-0 rounded bg-[#0d1117] px-1 py-0.5 font-mono text-[#7c6af7]">
              {event.type}
            </span>
            <span className="truncate text-[#475569]">{event.source}</span>
            <span className="ml-auto shrink-0 text-[#1e2530]">
              {(event.confidence * 100).toFixed(0)}%
            </span>
          </div>
        ))}
        {snapshot.latestEvents.length === 0 && (
          <span className="text-[10px] text-[#334155]">Awaiting normalized events…</span>
        )}
      </div>

      <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Node types</p>
      <div className="mb-3 flex flex-wrap gap-1">
        {TYPE_ORDER.map((type) => {
          const count = snapshot.nodesByType[type] ?? 0;
          if (count === 0) return null;
          return (
            <span
              key={type}
              className="rounded border border-[#1e2530] bg-[#0d1117] px-1.5 py-0.5 font-mono text-[8px] text-[#64748b]"
            >
              {type.replace('Node', '')} {count}
            </span>
          );
        })}
        {snapshot.nodeCount === 0 && (
          <span className="text-[10px] text-[#334155]">Awaiting engine signals…</span>
        )}
      </div>

      <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Insights</p>
      <div className="mb-3 flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: '140px' }}>
        {insights.map((insight) => (
          <div key={insight.id} className="rounded border border-[#1e2530] bg-[#0d1117] px-2 py-1.5">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className={`rounded px-1 py-0.5 text-[7px] font-bold uppercase ${kindBadge[insight.kind]}`}>
                {insight.kind}
              </span>
              <span className="text-[8px] text-[#334155]">
                {(insight.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className={`text-[10px] leading-snug ${kindColor[insight.kind]}`}>{insight.message}</p>
          </div>
        ))}
        {insights.length === 0 && (
          <p className="text-[10px] text-[#334155]">No insights yet</p>
        )}
      </div>

      <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Recent nodes</p>
      <div className="mb-2 flex flex-col gap-0.5 overflow-y-auto" style={{ maxHeight: '100px' }}>
        {nodes.map((node) => (
          <div key={node.id} className="flex items-center gap-2 px-1 py-0.5 text-[9px]">
            <span className="w-20 shrink-0 truncate font-mono text-[#475569]">
              {node.eventType ?? node.type.replace('Node', '')}
            </span>
            <span className="flex-1 truncate text-[#94a3b8]">{node.id}</span>
          </div>
        ))}
        {nodes.length === 0 && <p className="text-[10px] text-[#334155]">Empty graph</p>}
      </div>

      <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Edges</p>
      <div className="flex flex-col gap-0.5 overflow-y-auto">
        {edges.map((edge) => (
          <div key={edge.id} className="flex items-center gap-1 px-1 py-0.5 font-mono text-[8px] text-[#475569]">
            <span className="truncate text-[#64748b]">{edge.from}</span>
            <span className="shrink-0 text-[#1e2530]">·{edge.type}·</span>
            <span className="truncate text-[#64748b]">{edge.to}</span>
          </div>
        ))}
        {edges.length === 0 && <p className="text-[10px] text-[#334155]">No edges</p>}
      </div>
    </div>
  );
}
