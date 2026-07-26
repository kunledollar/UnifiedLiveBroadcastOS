'use client';

import { useAutonomous, type AutonomyLevel } from './AutonomousProvider';

export function AutonomousUI({ onClose }: { onClose: () => void }) {
  const { state, setState } = useAutonomous();

  const setLevel = (autonomyLevel: AutonomyLevel) => {
    setState((current) => ({
      ...current,
      autonomyLevel,
      permissions: { allowed: autonomyLevel > 0 },
      timeline: [
        `Autonomy changed to level ${autonomyLevel}`,
        ...current.timeline,
      ].slice(0, 4),
    }));
  };

  return (
    <aside
      aria-label="Autonomous control panel"
      className="autonomous-ui"
      id="autonomous-panel"
    >
      <header className="autonomous-ui__header">
        <div>
          <span>AI CREW</span>
          <strong>Autonomous Control</strong>
        </div>
        <button aria-label="Close autonomous controls" onClick={onClose} type="button">
          ×
        </button>
      </header>

      <section className="autonomous-hud" aria-label="Autonomous status">
        <div><span>Level</span><strong>{state.autonomyLevel}</strong></div>
        <div><span>Confidence</span><strong>{Math.round(state.confidence * 100)}%</strong></div>
        <div><span>Severity</span><strong>{Math.round(state.severity * 100)}%</strong></div>
      </section>

      <section className="autonomous-control-panel">
        <label htmlFor="autonomy-level">Autonomy level</label>
        <select
          id="autonomy-level"
          onChange={(event) => setLevel(Number(event.target.value) as AutonomyLevel)}
          value={state.autonomyLevel}
        >
          <option value={0}>0 · Observe only</option>
          <option value={1}>1 · Suggest</option>
          <option value={2}>2 · Assist</option>
          <option value={3}>3 · Operate</option>
          <option value={4}>4 · Full autonomy</option>
        </select>
        <p>
          {state.permissions.allowed
            ? 'AI Crew actions are enabled within the selected level.'
            : 'Actions require operator approval.'}
        </p>
      </section>

      <section className="autonomous-timeline">
        <h2>Timeline</h2>
        {state.timeline.length > 0 ? (
          <ul>{state.timeline.map((event, index) => <li key={`${event}-${index}`}>{event}</li>)}</ul>
        ) : <p>No autonomous actions in this session.</p>}
      </section>

      <section className="autonomous-logs">
        <h2>System health</h2>
        <p><span className="autonomous-status-dot" />Output {state.system.outputHealth}</p>
        <p><span className="autonomous-status-dot" />Routing {state.system.routingHealth}</p>
        <p><span className="autonomous-status-dot" />Streaming {state.system.streamingHealth}</p>
      </section>
    </aside>
  );
}
