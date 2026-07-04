'use client';

import type { AIRiskSignal } from '@ubos/shared';
import { BroadcastButton, BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { AIEmptyState } from './AIEmptyState';
import { riskSeverityVariant } from './ai-utils';

export function AIRiskMonitor({
  riskSignals,
  onAcknowledgeRisk,
  className,
}: {
  riskSignals: AIRiskSignal[];
  onAcknowledgeRisk?: (riskId: string) => void;
  className?: string;
}) {
  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Production Risk Monitor</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Metadata risk signals · No autonomous response
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-ubos-2">
        {!riskSignals.length ? (
          <AIEmptyState message="No active risk signals" />
        ) : (
          riskSignals.map((signal) => (
            <div
              key={signal.id}
              className="flex items-start justify-between gap-ubos-2 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight/50 px-ubos-2 py-1.5"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1">
                  <StatusBadge variant={riskSeverityVariant(signal.severity)}>{signal.severity}</StatusBadge>
                  <span className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                    {signal.targetType}/{signal.targetId}
                  </span>
                </div>
                <p className={cn(ubosTypographyClasses.caption, 'mt-1 text-ubos-fg-secondary')}>{signal.message}</p>
                {signal.suggestedAction ? (
                  <p className={cn(ubosTypographyClasses.metadata, 'mt-1 text-ubos-fg-muted')}>
                    Suggested: {signal.suggestedAction}
                  </p>
                ) : null}
              </div>
              <BroadcastButton
                size="sm"
                variant="ghost"
                onClick={() => onAcknowledgeRisk?.(signal.id)}
              >
                Ack
              </BroadcastButton>
            </div>
          ))
        )}
      </div>
    </BroadcastPanel>
  );
}
