// ONE OWNER RULE AUDIT (3.15C/D) — /control-room/ai-director
//
// Surface type: standalone full-page route (Next.js App Router page).
//   This route is NOT a panel inside the CommandCenter zone layout.
//
// activatePanel() usage: NOT APPLICABLE.
//   Standalone route pages sit outside the CommandCenter zone system and do
//   not use activatePanel().  If/when the AI Director is embedded as a
//   CommandCenter panel, activation must route through activatePanel() via
//   the Workspace Manager so the One Owner Rule is respected.
//
// Workspace Manager bypass: NONE — no CommandCenter zones are rendered here.
//   The AI Director surface uses AIDirectorSession (from @ubos/shared) for
//   deterministic metadata-only orchestration.  It does not render Program or
//   Preview monitors; those remain solely in CommandCenterStage per the One
//   Owner Rule.  Operator approval is required for all recommendations;
//   no autonomous or inference-driven execution is performed here.
//
// TODO(one-owner): When the AI Director is wired as a docked CommandCenter
//   panel, verify that panel reveal goes through activatePanel() and that no
//   code path renders a secondary Program/Preview outside Center Stage.
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
