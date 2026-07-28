'use client';

import type { AIState } from './ai-state';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { ResizableSplit } from '../workspaces/ResizableSplit';
import { AIAssistantPanel } from './AIAssistantPanel';
import { AIRecommendationList } from './AIRecommendationList';
import { AIRiskMonitor } from './AIRiskMonitor';
import { AISafetyPanel } from './AISafetyPanel';
import { AIProductionSummary } from './AIProductionSummary';
import type { AIAction } from './ai-state';
import { AgentManager, SuggestionCenter, createInitialProductionGraph } from '@ubos/shared';
import { SuggestionCenterPanel } from './SuggestionCenterPanel';
import { aiStatusLabel, getProductionSummaryLines, getSuggestedRecommendations } from './ai-utils';

export function AIAssistantWorkspace({
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
  const phase18Graph = createInitialProductionGraph({ broadcastSessionId: 'control-room-ai', name: 'Control Room AI' });
  const agentManager = new AgentManager();
  const suggestionCenter = new SuggestionCenter();
  const phase18Suggestions = suggestionCenter.ingest(
    agentManager.observe({
      graph: phase18Graph,
      mode: assistant.mode === 'supervised' ? 'supervised' : 'manual',
      timestamp: assistant.lastUpdated,
      chatMessages: [{ id: 'chat-question-1', author: 'Viewer', text: 'Can you explain the next segment?', timestamp: assistant.lastUpdated }],
    }),
  );
  const selectedRecommendation =
    recommendations.find((recommendation) => recommendation.id === state.selectedRecommendationId) ??
    getSuggestedRecommendations(recommendations)[0] ??
    null;

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>
            AI Broadcast Assistant
          </h2>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Observe · Summarize · Suggest · Flag risks · Metadata only
          </p>
        </div>
        <StatusBadge variant="warning">AI advisory metadata staged</StatusBadge>
      </div>

      <ResizableSplit
        initialRatio={0.34}
        minPrimary={0.24}
        maxPrimary={0.5}
        primary={
          <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
            <AIProductionSummary assistant={assistant} summaryLines={resolvedSummary} />
            <AISafetyPanel mode={assistant.mode} />
            <SuggestionCenterPanel
              suggestions={phase18Suggestions}
              onAccept={() => dispatch({ type: 'REQUEST_ANALYSIS' })}
              onReject={() => dispatch({ type: 'REQUEST_ANALYSIS' })}
              onIgnore={() => dispatch({ type: 'REQUEST_ANALYSIS' })}
            />
            <AIRiskMonitor
              riskSignals={riskSignals}
              onAcknowledgeRisk={(riskId) => dispatch({ type: 'ACKNOWLEDGE_RISK', riskId })}
              className="min-h-0 flex-1"
            />
          </div>
        }
        secondary={
          <ResizableSplit
            initialRatio={0.58}
            primary={
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
                className="h-full"
              />
            }
            secondary={
              <BroadcastPanel variant="inset" padding={false} className="h-full border-0 shadow-none">
                <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
                  <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>
                    Recommendation Detail
                  </h3>
                  <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                    {aiStatusLabel(assistant)} · Human approval required
                  </p>
                </div>
                <div className="space-y-2 overflow-y-auto p-ubos-2 text-ubos-caption text-ubos-fg-secondary">
                  {selectedRecommendation ? (
                    <>
                      <p className="font-medium text-ubos-fg-primary">{selectedRecommendation.title}</p>
                      <p>{selectedRecommendation.description}</p>
                      <p className="text-ubos-fg-muted">
                        Type: {selectedRecommendation.type} · Target:{' '}
                        {selectedRecommendation.targetType}/{selectedRecommendation.targetId}
                      </p>
                      <p className="text-ubos-warning-text">Requires operator approval. No execution.</p>
                    </>
                  ) : (
                    <p className="text-ubos-fg-muted">No recommendation selected</p>
                  )}
                </div>
              </BroadcastPanel>
            }
          />
        }
      />
    </div>
  );
}
