import {
  createBroadcastSession,
  createMockCollaborationSession,
  getRevisionLag,
  type CollaborationEvent,
  type CollaborationOperator,
  type CollaborationSession,
} from '@ubos/shared';

const activityLabel: Record<string, string> = {
  viewing: 'Viewing',
  switching: 'Cutting program',
  editing_scene: 'Editing scenes',
  managing_guests: 'Managing guests',
  adjusting_audio: 'Editing mixer',
  editing_graphics: 'Editing overlays',
  monitoring_health: 'Monitoring health',
  viewing_multiview: 'Viewing multiview',
  idle: 'Idle',
};

const presenceTone: Record<string, string> = {
  online: 'bg-emerald-400', active: 'bg-emerald-400', editing: 'bg-cyan-300', reviewing: 'bg-violet-300', presenting: 'bg-rose-300', idle: 'bg-amber-300', disconnected: 'bg-slate-500', offline: 'bg-slate-600', away: 'bg-amber-300', reconnecting: 'bg-amber-300 animate-pulse',
};

const commandActivity = [
  'Director CUT to Scene 2',
  'Producer renamed Scene 3',
  'Audio muted Music Bed',
  'Graphics published Lower Third',
  'Guest Manager admitted Guest 4',
  'Recording started',
  'YouTube Main destination enabled',
];

function mockSession() {
  const production = createBroadcastSession({ id: 'demo-broadcast', name: 'UBOS Demo Broadcast', operatorId: 'director', timestamp: '2026-07-01T00:00:00.000Z' });
  const session = createMockCollaborationSession(production);
  return { ...session, currentGraphRevision: 42 } satisfies CollaborationSession;
}

function event(session: CollaborationSession, id: string, type: CollaborationEvent['type'], operatorId: string | undefined, minutesAgo: number, message: string): CollaborationEvent {
  return { id, type, sessionId: session.id, ...(operatorId ? { operatorId } : {}), timestamp: new Date(Date.parse(session.createdAt) + (60 - minutesAgo) * 60_000).toISOString(), graphRevision: session.currentGraphRevision - Math.min(minutesAgo, 6), payload: { message } };
}

function mockEvents(session: CollaborationSession): CollaborationEvent[] {
  return [
    event(session, 'evt-lock', 'LOCK_ACQUIRED', 'director', 1, 'Director acquired Program lock'),
    event(session, 'evt-cut', 'COMMAND_BROADCAST', 'director', 2, 'Director CUT to Scene 2'),
    event(session, 'evt-graphics', 'COMMAND_BROADCAST', 'graphics', 3, 'Graphics published Lower Third'),
    event(session, 'evt-audio', 'COMMAND_BROADCAST', 'audio', 4, 'Audio muted Music Bed'),
    event(session, 'evt-conflict', 'COMMAND_CONFLICT_CREATED', 'producer', 5, 'Producer scene edit conflicted with revision 42'),
    event(session, 'evt-reconnect', 'OPERATOR_RECONNECTED', 'td', 6, 'Technical Director reconnected'),
    event(session, 'evt-join', 'OPERATOR_JOINED', 'moderator', 7, 'Moderator joined Control Room'),
  ];
}

function FocusBadge({ operator }: { operator: CollaborationOperator }) {
  const selection = operator.sharedSelection;
  const label = selection ? `${selection.type.replace('_', ' ')} · ${selection.label}` : operator.currentPanel;
  return <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100">{label}</span>;
}

function OperatorRow({ operator, session }: { operator: CollaborationOperator; session: CollaborationSession }) {
  const lag = getRevisionLag(operator, session);
  const connected = operator.connectionState === 'connected';
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-2 transition hover:border-cyan-300/25 hover:bg-white/[0.055]">
      <div className="flex items-center gap-2">
        <span className="relative grid h-7 w-7 place-items-center rounded-full text-[10px] font-black text-slate-950" style={{ backgroundColor: operator.color }}>
          {operator.initials}<i className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-950 ${presenceTone[operator.presence] ?? 'bg-slate-500'}`} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold text-slate-100">{operator.displayName}</div>
          <div className="truncate text-[10px] uppercase tracking-wide text-slate-500">{operator.role.replaceAll('_', ' ')}</div>
        </div>
        <div className={lag > 0 ? 'text-right text-[10px] font-bold text-amber-300' : 'text-right text-[10px] font-bold text-emerald-300'}>rev {operator.observedGraphRevision}</div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
        <span className="rounded-full bg-white/5 px-2 py-0.5">{operator.presence}</span>
        <span className={connected ? 'text-emerald-300' : 'text-slate-400'}>{operator.connectionState}</span>
        <span>{activityLabel[operator.currentActivity]}</span>
        <FocusBadge operator={operator} />
        {operator.activeAuthorityScope ? <span className="rounded-full bg-fuchsia-400/10 px-2 py-0.5 text-fuchsia-100">{operator.activeAuthorityScope}</span> : null}
        {operator.lockCount ? <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-amber-100">🔒 {operator.lockCount}</span> : null}
        {lag > 0 ? <span className="text-amber-300">lag {lag}</span> : <span className="text-emerald-300">synced</span>}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-slate-500">
        <span>View: <b className="text-slate-300">{operator.workspaceAwareness?.currentView}</b></span>
        <span>Preset: <b className="text-slate-300">{operator.workspaceAwareness?.preset}</b></span>
      </div>
    </div>
  );
}

export function ProductionTeamPanel() {
  const session = mockSession();
  const operators = Object.values(session.operators);
  const events = mockEvents(session);
  const connected = operators.filter((operator) => operator.connectionState === 'connected').length;
  const disconnected = operators.length - connected;
  const highestLag = Math.max(...operators.map((operator) => getRevisionLag(operator, session)));
  const activeLocks = operators.reduce((sum, operator) => sum + (operator.lockCount ?? 0), 0);

  return (
    <details className="group rounded-2xl border border-cyan-400/20 bg-slate-900/70 shadow-2xl shadow-cyan-950/20" open>
      <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-200 group-open:border-b group-open:border-white/10">
        <span>Production Team</span><span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-200">rev {session.currentGraphRevision}</span>
      </summary>
      <div className="space-y-3 p-3">
        <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
          <div className="rounded-lg bg-white/[0.04] p-2"><b className="block text-sm text-white">{operators.length}</b>Operators</div>
          <div className="rounded-lg bg-white/[0.04] p-2"><b className="block text-sm text-emerald-300">{connected}</b>Connected</div>
          <div className="rounded-lg bg-white/[0.04] p-2"><b className="block text-sm text-amber-300">{highestLag}</b>Max Lag</div>
        </div>
        <div className="space-y-2">{operators.map((operator) => <OperatorRow key={operator.id} operator={operator} session={session} />)}</div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Session Dashboard</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-300">
              <span>Disconnected</span><b className="text-right">{disconnected}</b><span>Commands</span><b className="text-right">{commandActivity.length}</b><span>Conflicts</span><b className="text-right text-rose-300">1</b><span>Active locks</span><b className="text-right">{activeLocks}</b><span>Pending commands</span><b className="text-right">2</b><span>Uptime</span><b className="text-right">01:00:00</b>
            </div>
          </section>
          <section className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Activity Feed</div>
            <div className="space-y-1.5">{commandActivity.slice(0, 5).map((item) => <div key={item} className="rounded bg-white/[0.03] px-2 py-1 text-xs text-slate-300">{item}</div>)}</div>
          </section>
          <section className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Collaboration Timeline</div>
            <div className="space-y-1.5">{events.map((event) => <div key={event.id} className="flex gap-2 text-[11px] text-slate-300"><span className="w-16 shrink-0 text-slate-500">rev {event.graphRevision}</span><span>{String(event.payload.message)}</span></div>)}</div>
          </section>
          <section className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Notifications</div>
            <div className="space-y-1.5">{events.slice(0, 4).map((event) => <div key={`note-${event.id}`} className="rounded-lg border border-cyan-300/10 bg-cyan-300/5 px-2 py-1 text-[11px] text-cyan-50">{String(event.payload.message)}</div>)}</div>
          </section>
          <details className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
            <summary className="cursor-pointer text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Collaboration Inspector</summary>
            <div className="mt-2 grid gap-1 font-mono text-[10px] text-slate-400">
              {['Presence', 'Authority', 'Locks', 'Revisions', 'Transport', 'Pending Commands', 'Sync', 'Latest Commands', 'Latest Events', 'Latest Conflicts', 'Recent Activity', 'Connection State'].map((label) => <details key={label} className="rounded bg-white/[0.03] p-1"><summary>{label}</summary><div className="pt-1 text-slate-500">local simulated collaboration diagnostics</div></details>)}
            </div>
          </details>
        </div>
      </div>
    </details>
  );
}
