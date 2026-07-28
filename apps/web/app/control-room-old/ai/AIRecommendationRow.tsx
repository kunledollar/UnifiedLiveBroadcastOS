'use client';

import type { AIRecommendation } from '@ubos/shared';
import { BroadcastButton, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CompactRowActions, RowIconButton } from '../browsers/BrowserChrome';
import { confidenceLabel, recommendationStatusVariant, riskSeverityVariant } from './ai-utils';

export function AIRecommendationRow({
  recommendation,
  selected = false,
  onSelect,
  onAccept,
  onDismiss,
}: {
  recommendation: AIRecommendation;
  selected?: boolean;
  onSelect?: () => void;
  onAccept?: () => void;
  onDismiss?: () => void;
}) {
  const actionable = recommendation.status === 'suggested';

  return (
    <div
      className={cn(
        'flex w-full items-start gap-ubos-2 rounded-ubos-sm border px-ubos-2 py-1.5',
        selected ? 'border-ubos-selection-border bg-ubos-selection-muted' : 'border-transparent bg-ubos-midnight/50',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left outline-none focus-visible:ring-1 focus-visible:ring-ubos-selection-border"
      >
        <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
          {recommendation.title}
        </div>
        <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          {recommendation.type} · {recommendation.targetType}/{recommendation.targetId} ·{' '}
          {confidenceLabel(recommendation.confidence)} confidence
        </div>
        <div className={cn(ubosTypographyClasses.caption, 'mt-0.5 text-ubos-fg-secondary')}>
          {recommendation.description}
        </div>
        <div className={cn(ubosTypographyClasses.metadata, 'mt-1 text-ubos-warning-text')}>
          Requires operator approval
        </div>
      </button>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <StatusBadge variant={recommendationStatusVariant(recommendation.status)}>
          {recommendation.status}
        </StatusBadge>
        <StatusBadge variant={riskSeverityVariant(recommendation.riskLevel)}>
          {recommendation.riskLevel}
        </StatusBadge>
      </div>
      {actionable ? (
        <CompactRowActions>
          <RowIconButton label="Accept metadata" onClick={() => onAccept?.()} />
          <RowIconButton label="Dismiss" onClick={() => onDismiss?.()} />
        </CompactRowActions>
      ) : (
        <BroadcastButton size="sm" variant="ghost" disabled>
          No action
        </BroadcastButton>
      )}
    </div>
  );
}
