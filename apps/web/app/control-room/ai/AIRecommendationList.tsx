'use client';

import type { AIRecommendation } from '@ubos/shared';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import { AIEmptyState } from './AIEmptyState';
import { AIRecommendationRow } from './AIRecommendationRow';

export function AIRecommendationList({
  recommendations,
  selectedRecommendationId,
  onSelectRecommendation,
  onAcceptRecommendation,
  onDismissRecommendation,
  className,
}: {
  recommendations: AIRecommendation[];
  selectedRecommendationId?: string | null;
  onSelectRecommendation?: (recommendationId: string) => void;
  onAcceptRecommendation?: (recommendationId: string) => void;
  onDismissRecommendation?: (recommendationId: string) => void;
  className?: string;
}) {
  const suggested = recommendations.filter((recommendation) => recommendation.status === 'suggested');

  return (
    <BroadcastPanel variant="inset" padding={false} className={cn('flex min-h-0 flex-col border-0 shadow-none', className)}>
      <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Suggested Actions</h3>
        <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
          Metadata suggestions only · Human approval required
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-ubos-2">
        {!suggested.length ? (
          <AIEmptyState message="No recommendations available" />
        ) : (
          suggested.map((recommendation) => (
            <AIRecommendationRow
              key={recommendation.id}
              recommendation={recommendation}
              selected={selectedRecommendationId === recommendation.id}
              onSelect={() => onSelectRecommendation?.(recommendation.id)}
              onAccept={() => onAcceptRecommendation?.(recommendation.id)}
              onDismiss={() => onDismissRecommendation?.(recommendation.id)}
            />
          ))
        )}
      </div>
    </BroadcastPanel>
  );
}
