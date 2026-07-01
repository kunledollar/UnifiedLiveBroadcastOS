import {
  createBroadcastSession,
  createMockCollaborationSession,
  getOperatorsBehindRevision,
  getRevisionLag,
  type CollaborationEvent,
  type CollaborationSession,
} from '@ubos/shared';

const activityLabel: Record<string, string> = {
  viewing: 'viewing',
  switching: 'switching',
  editing_scene: 'editing scene',
  managing_guests: 'managing guests',
  adjusting_audio: 'adjusting audio',
  editing_graphics: 'editing graphics',
  monitoring_health: 'monitoring health',
  viewing_multiview: 'viewing multiview',
  idle: 'idle',
};

function mockSession() {
  const production = createBroadcastSession({
    id: 'demo-broadcast',
    name: 'UBOS Demo Broadcast',
    operatorId: 'director',
    timestamp: '2026-07-01T00:00:00.000Z',
  });
  const session = createMockCollaborationSession(production);
  return { ...session, currentGraphRevision: 42 } satisfies CollaborationSession;
}

function mockEvents(session: CollaborationSession): CollaborationEvent[] {
  const behind = getOperatorsBehindRevision(session)[0];
  return [
    { id: 'evt-1', type: 'OPERATOR_JOINED', sessionId: session.id, operatorId: 'director', timestamp: session.createdAt, graphRevision: 42, payload: { message: 'Director joined' } },
    { id: 'evt-2', type: 'OPERATOR_ACTIVITY_UPDATED', sessionId: session.id, operatorId: 'audio', timestamp: session.createdAt, graphRevision: 42, payload: { message: 'Audio changed activity' } },
    { id: 'evt-3', type: 'GRAPH_REVISION_SYNCED', sessionId: session.id, operatorId: 'audio', timestamp: session.createdAt, graphRevision: 42, payload: { message: 'Audio synced to rev 42' } },
    { id: 'evt-4', type: 'GRAPH_REVISION_BEHIND', sessionId: session.id, operatorId: behind?.id ?? 'unknown', timestamp: session.createdAt, graphRevision: 42, payload: { message: `${behind?.displayName ?? 'Operator'} is behind by ${behind ? getRevisionLag(behind, session) : 0} revisions` } },
    { id: 'evt-5', type: 'COMMAND_BROADCAST', sessionId: session.id, operatorId: 'director', timestamp: session.createdAt, graphRevision: 42, payload: { message: 'Command broadcast: TAKE_PREVIEW' } },
  ];
}

export function ProductionTeamPanel() {
  const session = mockSession();
  const operators = Object.values(session.operators);
  const events = mockEvents(session);

  return (
    <details className="group rounded-2xl border border-cyan-400/20 bg-slate-900/70 shadow-2xl shadow-cyan-950/20" open>
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-200 group-open:border-b group-open:border-white/10">
        <span>Production Team</span>
        <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-200">rev {session.currentGraphRevision}</span>
      </summary>
      <div className="space-y-4 p-3">
        <div>
          <div className="text-sm font-bold text-white">{session.sessionName}</div>
          <div className="text-xs text-slate-400">{session.activeOperatorIds.length} active operators · local simulation</div>
        </div>
        <div className="space-y-2">
          {operators.map((operator) => {
            const lag = getRevisionLag(operator, session);
            return (
              <div key={operator.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-black text-slate-950" style={{ backgroundColor: operator.color }}>{operator.initials}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-slate-100">{operator.displayName}</div>
                    <div className="truncate text-[10px] uppercase tracking-wide text-slate-500">{operator.role.replaceAll('_', ' ')}</div>
                  </div>
                  <div className={lag > 0 ? 'text-right text-[10px] font-bold text-amber-300' : 'text-right text-[10px] font-bold text-emerald-300'}>rev {operator.observedGraphRevision}</div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                  <span className="rounded-full bg-white/5 px-2 py-0.5">{operator.presence}</span>
                  <span>{activityLabel[operator.currentActivity]}</span>
                  {lag > 0 ? <span className="text-amber-300">behind {lag} revs</span> : <span className="text-emerald-300">synced</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Activity Feed</div>
          <div className="space-y-2">
            {events.map((event) => <div key={event.id} className="text-xs text-slate-300">{String(event.payload.message)}</div>)}
          </div>
        </div>
      </div>
    </details>
  );
}
