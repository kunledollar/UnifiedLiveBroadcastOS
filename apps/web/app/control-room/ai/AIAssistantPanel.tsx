'use client';

import type { AIState } from './ai-state';
import { BroadcastButton, BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { AIProductionSummary } from './AIProductionSummary';
import { AIRecommendationList } from './AIRecommendationList';
import { AIRiskMonitor } from './AIRiskMonitor';
import { AISafetyPanel } from './AISafetyPanel';
import type { AIAction } from './ai-state';
import {
  aiModeLabel,
  aiStatusLabel,
  aiStatusVariant,
  getProductionSummaryLines,
  getSuggestedRecommendations,
} from './ai-utils';

export function AIAssistantPanel({
  state,
  dispatch,
  summaryLines,
  className,
}: {
  state: AIState;
  dispatch: (action: AIAction) => void;
  summaryLines?: string[];
  className?: string;
}) {
  const { assistant, recommendations, riskSignals } = state;
  const resolvedSummary =
    summaryLines ??
    getProductionSummaryLines({
      recommendationCount: getSuggestedRecommendations(recommendations).length,
      riskCount: riskSignals.length,
    });

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <BroadcastPanel variant="inset" padding={false} className="border-0 shadow-none">
        <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>AI Assistant</h3>
              <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                Advisory metadata only · No execution
              </p>
            </div>
            <StatusBadge variant={aiStatusVariant(assistant.status)}>{aiStatusLabel(assistant)}</StatusBadge>
          </div>
        </div>
        <div className="space-y-ubos-2 overflow-y-auto p-ubos-2">
          <AIProductionSummary assistant={assistant} summaryLines={resolvedSummary} />
          <AISafetyPanel mode={assistant.mode} />
          <AIRiskMonitor
            riskSignals={riskSignals}
            onAcknowledgeRisk={(riskId) => dispatch({ type: 'ACKNOWLEDGE_RISK', riskId })}
          />
          <AIRecommendationList
            recommendations={recommendations}
            selectedRecommendationId={state.selectedRecommendationId}
            onSelectRecommendation={(recommendationId) =>
              dispatch({ type: 'SELECT_RECOMMENDATION', recommendationId })
            }
            onAcceptRecommendation={(recommendationId) =>
              dispatch({ type: 'ACCEPT_RECOMMENDATION', recommendationId })
            }
            onDismissRecommendation={(recommendationId) =>
              dispatch({ type: 'DISMISS_RECOMMENDATION', recommendationId })
            }
          />
          <div className="flex flex-wrap gap-1">
            <BroadcastButton
              size="sm"
              variant="secondary"
              onClick={() => dispatch({ type: 'REQUEST_ANALYSIS' })}
              disabled={assistant.status === 'disabled' || assistant.status === 'unavailable'}
            >
              Request analysis
            </BroadcastButton>
            <BroadcastButton
              size="sm"
              variant="ghost"
              onClick={() => dispatch({ type: 'SET_ASSISTANT_MODE', mode: 'advisory' })}
            >
              {aiModeLabel('advisory')}
            </BroadcastButton>
          </div>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Human approval required. AI cannot execute production commands.
          </p>
        </div>
      </BroadcastPanel>
    </div>
  );
}
