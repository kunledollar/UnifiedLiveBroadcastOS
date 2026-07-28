'use client';

import { BroadcastPanel, StatusBadge } from '@ubos/ui';
import type { RuntimeHealth, RuntimeSnapshot, RuntimeState } from '@ubos/shared';

export function RuntimeDashboard({ state, health, snapshots }: { state: RuntimeState; health: RuntimeHealth; snapshots: RuntimeSnapshot[] }) {
  return (
    <div className="space-y-ubos-2">
      <BroadcastPanel><h3 className="mb-2 font-semibold">Runtime Dashboard</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <StatusBadge variant={health.runtimeAlive ? 'success' : 'warning'}>Runtime {health.runtimeAlive ? 'Alive' : 'Unavailable'}</StatusBadge>
          <StatusBadge variant={state.status === 'idle' ? 'neutral' : 'warning'}>{state.status === 'idle' ? 'Idle' : 'Executing'}</StatusBadge>
          <div>Current Program: {state.currentProgram ?? 'Not Connected'}</div>
          <div>Current Preview: {state.currentPreview ?? 'Not Connected'}</div>
          <div>Transition: {state.currentTransition}</div>
          <div>Progress: {Math.round(state.transitionProgress * 100)}%</div>
          <div>Queue Size: {health.queueSize}</div>
          <div>Locked: {health.locked ? 'Locked' : 'Unlocked'}</div>
        </div>
      </BroadcastPanel>
      <BroadcastPanel><h3 className="mb-2 font-semibold">Execution Queue</h3><p className="text-sm text-ubos-fg-muted">{state.executionQueue.length ? state.executionQueue.map((c) => c.type).join(', ') : 'Idle'}</p></BroadcastPanel>
      <BroadcastPanel><h3 className="mb-2 font-semibold">History</h3><p className="text-sm text-ubos-fg-muted">Commands Executed: {health.commandsExecuted} · Dropped: {health.droppedCommands} · Average Execute Time: {health.averageExecuteTimeMs.toFixed(1)}ms</p></BroadcastPanel>
      <BroadcastPanel><h3 className="mb-2 font-semibold">Snapshots</h3><ul className="space-y-1 text-xs text-ubos-fg-muted">{snapshots.slice(-6).reverse().map((s) => <li key={s.id}>{s.command} by {s.operator} · Program {s.program ?? '—'} · Preview {s.preview ?? '—'}</li>)}</ul></BroadcastPanel>
      <BroadcastPanel><h3 className="mb-2 font-semibold">Runtime Health</h3><p className="text-sm text-ubos-fg-muted">Last Runtime Error: {health.lastRuntimeError ?? 'None'} · GPU Unavailable · Streaming Inactive · Recording Inactive</p></BroadcastPanel>
    </div>
  );
}
