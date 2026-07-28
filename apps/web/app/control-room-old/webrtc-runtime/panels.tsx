import { createGuestRuntimeState, createGuestRuntimeSnapshot } from '@ubos/shared';

const state = createGuestRuntimeState();
const snapshot = createGuestRuntimeSnapshot(state, 'control-room');
const cards = [
  ['WebRTC Runtime Dashboard', 'WebRTC runtime unavailable · Metadata only'],
  ['Guest Sessions Panel', `${snapshot.guestCount} sessions · invited ${snapshot.invited} · waiting ${snapshot.waiting} · connected ${snapshot.connected} · disconnected ${snapshot.disconnected}`],
  ['Guest Readiness Panel', 'Camera unknown · Mic unknown · Screen-share unknown'],
  ['Return Feed Panel', 'Return feed metadata tracked without transport'],
  ['Tally Panel', 'Preview/program tally metadata only'],
  ['Talkback / IFB Panel', 'IFB metadata only · no audio transport'],
  ['Guest Runtime Queue', `${snapshot.queueSize} queued commands`],
  ['Guest Runtime Health', state.health.warnings.join(' · ')],
  ['Guest Runtime History', `${state.history.length} recorded snapshots`],
  ['Guest Runtime Inspector', 'No MediaStreams, peer connections, SDP, ICE, or sockets are attached'],
];

export function WebRTCRuntimeDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Phase 24</p>
          <h1 className="text-3xl font-semibold">WebRTC Runtime Dashboard</h1>
          <p className="mt-2 text-slate-400">Deterministic remote guest runtime foundation. Transport is intentionally unavailable.</p>
        </div>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
              <h2 className="text-lg font-semibold text-cyan-100">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
