'use client';

import { useMemo } from 'react';
import {
  selectBroadcastStatus,
  selectHealthSummary,
  selectRecordingState,
  type ProductionBroadcastSession,
  type ProductionGraph,
} from '@ubos/shared';
import { cn } from '@ubos/ui';

type TreeNode = {
  id: string;
  label: string;
  value?: string;
  children?: TreeNode[];
};

function TreeBranch({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const hasChildren = Boolean(node.children?.length);
  return (
    <details
      open={depth < 2}
      className={cn('rounded-ubos-sm border border-white/6 bg-ubos-midnight/60', depth > 0 && 'ml-3')}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1 text-[10px]">
        <span className="font-semibold uppercase tracking-wide text-ubos-fg-secondary">
          {node.label}
        </span>
        {node.value ? (
          <span className="truncate font-mono text-[10px] text-ubos-fg-muted">{node.value}</span>
        ) : null}
      </summary>
      {hasChildren ? (
        <div className="space-y-1 border-t border-white/6 p-1">
          {node.children!.map((child) =>
            child.children?.length ? (
              <TreeBranch key={child.id} node={child} depth={depth + 1} />
            ) : (
              <div
                key={child.id}
                className="flex items-center justify-between gap-2 rounded px-2 py-0.5 text-[10px]"
              >
                <span className="text-ubos-fg-muted">{child.label}</span>
                <span className="truncate font-mono text-ubos-fg-secondary">{child.value ?? '—'}</span>
              </div>
            ),
          )}
        </div>
      ) : null}
    </details>
  );
}

function buildGraphTree(graph: ProductionGraph, session: ProductionBroadcastSession): TreeNode[] {
  const recording = selectRecordingState(graph);
  const health = selectHealthSummary(graph);

  const collectionNodes = (
    title: string,
    items: Record<string, { name?: string; displayName?: string; label?: string }>,
    labelFor: (item: { name?: string; displayName?: string; label?: string }, id: string) => string,
  ): TreeNode => ({
    id: title.toLowerCase(),
    label: title,
    value: String(Object.keys(items).length),
    children: Object.entries(items).map(([id, item]) => ({
      id,
      label: labelFor(item, id),
      value: id,
    })),
  });

  const healthMetrics = Object.entries(health.metrics).map(([key, metric]) => ({
    id: `health-${key}`,
    label: key,
    value: String(metric.value),
  }));

  return [
    {
      id: 'metadata',
      label: 'Graph Metadata',
      children: [
        { id: 'status', label: 'Status', value: selectBroadcastStatus(graph) },
        { id: 'graph-id', label: 'Graph ID', value: graph.metadata.graphId },
        { id: 'revision', label: 'Revision', value: String(graph.metadata.revision) },
        { id: 'versions', label: 'Versions', value: `${graph.graphVersion} / ${graph.schemaVersion}` },
        { id: 'created', label: 'Created', value: graph.metadata.createdAt },
        { id: 'updated', label: 'Updated', value: graph.metadata.updatedAt },
      ],
    },
    {
      id: 'program-preview',
      label: 'Program / Preview',
      children: [
        { id: 'program', label: 'Program Scene', value: graph.program.sceneId ?? '—' },
        { id: 'preview', label: 'Preview Scene', value: graph.preview.sceneId ?? '—' },
      ],
    },
    collectionNodes('Scenes', graph.scenes, (item, id) => item.name ?? id),
    collectionNodes('Sources', graph.sources, (item, id) => item.name ?? id),
    collectionNodes('Guests', graph.guests, (item, id) => item.displayName ?? id),
    collectionNodes('Destinations', graph.destinations, (item, id) => item.name ?? id),
    collectionNodes('Audio Channels', graph.audioChannels, (item, id) => item.label ?? id),
    {
      id: 'recording',
      label: 'Recording',
      children: [
        { id: 'rec-status', label: 'Status', value: recording.status },
        { id: 'rec-file', label: 'File', value: String(recording.metadata?.currentFile ?? '—') },
        { id: 'rec-health', label: 'Health', value: String(recording.metadata?.health ?? recording.status) },
        {
          id: 'rec-drops',
          label: 'Dropped Frames',
          value: String(recording.metadata?.droppedFrames ?? '—'),
        },
      ],
    },
    {
      id: 'health',
      label: 'Pipeline Health',
      value: health.status,
      children: healthMetrics.length
        ? healthMetrics
        : [{ id: 'health-empty', label: 'Metrics', value: 'No health metrics recorded' }],
    },
    {
      id: 'session',
      label: 'Session Log',
      children: [
        { id: 'commands', label: 'Commands', value: String(session.commandLog.length) },
        { id: 'events', label: 'Events', value: String(session.eventLog.length) },
        {
          id: 'rejected',
          label: 'Rejected',
          value: String(
            session.eventLog.filter((event) => event.type === 'COMMAND_REJECTED').length,
          ),
        },
      ],
    },
  ];
}

export function ProductionGraphTreeSummary({
  session,
  className,
}: {
  session: ProductionBroadcastSession;
  className?: string;
}) {
  const tree = useMemo(
    () => buildGraphTree(session.graph, session),
    [session],
  );

  return (
    <div className={cn('space-y-1 p-2', className)}>
      <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-ubos-fg-muted">
        Metadata tree · rev {session.graph.metadata.revision}
      </p>
      {tree.map((node) => (
        <TreeBranch key={node.id} node={node} />
      ))}
    </div>
  );
}
