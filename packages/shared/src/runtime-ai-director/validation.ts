import {
  AIDirectorSession,
  RecommendationDispatcher,
  RecommendationValidator,
  createAIDirectorContext,
} from './index.js';
function assertOk(v: unknown) {
  if (!v) throw new Error('Expected truthy value');
}
function assertEqual(a: unknown, b: unknown) {
  if (a !== b) throw new Error(`Expected ${String(b)}, received ${String(a)}`);
}
function assertThrows(fn: () => void) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error('Expected throw');
}
const session = new AIDirectorSession();
const context = createAIDirectorContext({
  program: 'Host',
  preview: 'Guest',
  guestStatus: { guest: 'reconnecting' },
  audioMix: { clipping: true },
  recording: { storageLow: true },
  distribution: { outputFailure: true },
  automation: { conflict: true },
  monitoring: { status: 'critical' },
  security: { warning: true },
  cluster: { failure: true },
});
const dashboard = session.createDashboard(context);
assertEqual(dashboard.metadataOnly, true);
assertOk(dashboard.analysis.risks.length >= 7);
assertOk(dashboard.analysis.optimizations.length >= 3);
assertOk(dashboard.queue.items.length >= dashboard.analysis.risks.length);
assertEqual(dashboard.queue.items[0]?.priority, 'critical');
assertOk(
  dashboard.queue.items.every(
    (item) => item.policy.operatorApprovalRequired && !item.policy.autonomousExecutionAllowed,
  ),
);
assertEqual(dashboard.metrics.pendingApprovals, dashboard.queue.items.length);
const approval = session.decide({
  id: 'decision-1',
  recommendationId: dashboard.queue.items[0]!.id,
  decision: 'approve',
  operatorId: 'op-1',
  metadataOnly: true,
});
assertEqual(approval.status, 'approved');
assertOk(session.snapshot(dashboard.queue.items).recommendations.length);
assertOk(JSON.parse(JSON.stringify(dashboard)).metadataOnly);
const dispatcher = new RecommendationDispatcher();
assertThrows(() => dispatcher.dispatch(dashboard.queue.items[0]!));
assertEqual(dispatcher.dispatch(dashboard.queue.items[0]!, approval).lifecycle, 'dispatched');
const validator = new RecommendationValidator();
assertThrows(() => validator.validate({ runtimeHandle: {} }));
assertThrows(() => validator.validate({ browser: 'OpenAI SDK' }));
console.log('Runtime AI Director validation passed');
