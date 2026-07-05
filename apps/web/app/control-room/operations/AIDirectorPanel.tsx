'use client';
import { AIDirectorSession, createAIDirectorContext } from '@ubos/shared';
import { OperationsPanel } from './OperationsChrome';
const dashboard = new AIDirectorSession().createDashboard(
  createAIDirectorContext({
    program: 'Program',
    preview: 'Preview',
    guestStatus: { remote: 'connected' },
    monitoring: { status: 'healthy' },
    recording: { storageLow: false },
  }),
);
export function AIDirectorPanel() {
  return (
    <OperationsPanel title="AI Director">
      <div className="space-y-ubos-2">
        <div className="text-ubos-metadata text-ubos-fg-muted">
          Current Production State · metadata-only
        </div>
        <div>Recommendations: {dashboard.metrics.total}</div>
        <div>Priority: normal</div>
        <div>Confidence: high</div>
        <div>Pending Approvals: {dashboard.metrics.pendingApprovals}</div>
        <div>Risks: {dashboard.metrics.riskCount}</div>
        <div>Insights: {dashboard.analysis.insights.length}</div>
        <div>Optimization Opportunities: {dashboard.metrics.optimizationCount}</div>
        <p className="text-ubos-metadata text-ubos-fg-muted">
          No LLM APIs, browser AI APIs, remote AI calls, model weights, or autonomous execution.
        </p>
      </div>
    </OperationsPanel>
  );
}
