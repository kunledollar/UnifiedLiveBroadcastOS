'use client';

import type { AgentSuggestion } from '@ubos/shared';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';

export function SuggestionCenterPanel({ suggestions, onAccept, onReject, onIgnore, className }: { suggestions: AgentSuggestion[]; onAccept: (id: string) => void; onReject: (id: string) => void; onIgnore: (id: string) => void; className?: string; }) {
  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('overflow-hidden', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>AI Suggestions</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>Accept converts a recommendation into an approved Production Command. Reject and ignore are audit logged.</p>
      </div>
      <div className="space-y-2 p-ubos-2">
        {suggestions.length ? suggestions.map((suggestion) => (
          <article key={suggestion.id} className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight p-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-ubos-caption font-semibold text-ubos-fg-primary">{suggestion.title}</p>
                <p className="text-ubos-caption text-ubos-fg-secondary">{suggestion.recommendation}</p>
              </div>
              <StatusBadge variant={suggestion.status === 'pending' ? 'warning' : 'neutral'}>{suggestion.status}</StatusBadge>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-ubos-metadata text-ubos-fg-muted">
              <span>Source Agent: {suggestion.agentName}</span>
              <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
              <span>Timestamp: {suggestion.createdAt}</span>
              <span>Target: {suggestion.targetType}/{suggestion.targetId}</span>
            </div>
            <div className="mt-2 flex gap-1">
              <button type="button" onClick={() => onAccept(suggestion.id)} className="rounded-ubos-sm bg-ubos-success px-2 py-1 text-ubos-metadata font-semibold text-ubos-black">Accept</button>
              <button type="button" onClick={() => onReject(suggestion.id)} className="rounded-ubos-sm bg-ubos-danger px-2 py-1 text-ubos-metadata font-semibold text-white">Reject</button>
              <button type="button" onClick={() => onIgnore(suggestion.id)} className="rounded-ubos-sm bg-ubos-graphite px-2 py-1 text-ubos-metadata font-semibold text-ubos-fg-secondary">Ignore</button>
            </div>
          </article>
        )) : <p className="text-ubos-caption text-ubos-fg-muted">No AI suggestions are pending.</p>}
      </div>
    </BroadcastPanel>
  );
}
