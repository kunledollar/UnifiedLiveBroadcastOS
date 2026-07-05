import { AIDirectorSession, createAIDirectorContext } from '@ubos/shared';

const session = new AIDirectorSession();
const dashboard = session.createDashboard(
  createAIDirectorContext({
    program: 'Host Wide',
    preview: 'Guest Two-Up',
    guestStatus: { guest1: 'connected', guest2: 'reconnecting' },
    monitoring: { status: 'healthy' },
    distribution: { outputFailure: false },
  }),
);

export default function AIDirectorPage() {
  const panels = [
    'AI Director Dashboard',
    'Production Analysis',
    'Recommendations',
    'Priority Queue',
    'Confidence View',
    'Production Timeline',
    'Scenario Explorer',
    'Risk Analysis',
    'Optimization Center',
    'Recommendation History',
    'Operator Approval Queue',
    'Production Insights',
  ];
  return (
    <main className="min-h-screen bg-ubos-bg p-ubos-4 text-ubos-fg-primary">
      <h1 className="text-2xl font-semibold">AI Director</h1>
      <p className="text-ubos-fg-muted">
        Deterministic metadata-only orchestration. Operator approval is required; no inference or
        autonomous execution is enabled.
      </p>
      <div className="mt-ubos-4 grid gap-ubos-3 md:grid-cols-2 xl:grid-cols-3">
        {panels.map((panel) => (
          <section
            key={panel}
            className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-ubos-3"
          >
            <h2 className="font-semibold">{panel}</h2>
            <p className="text-sm text-ubos-fg-muted">
              {panel === 'Risk Analysis'
                ? `${dashboard.analysis.risks.length} active risks`
                : panel === 'Recommendations'
                  ? `${dashboard.queue.items.length} pending approvals`
                  : panel === 'Optimization Center'
                    ? `${dashboard.analysis.optimizations.length} opportunities`
                    : 'Metadata from production runtimes, queued for operator review.'}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
