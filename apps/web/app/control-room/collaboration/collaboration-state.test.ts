import assert from 'node:assert/strict';
import test from 'node:test';
import { collaborationReducer, initialCollaborationState } from './collaboration-state.js';

test('SET_REMOTE_PRODUCTION ignores semantically unchanged remote production snapshots', () => {
  const initialRemoteProduction = {
    operators: [],
    locks: [],
    notes: [],
    events: [],
    collaborationEnabled: false,
    containsRuntimeHandles: false as const,
  };
  const state = {
    ...initialCollaborationState,
    remoteProduction: initialRemoteProduction,
  };

  const next = collaborationReducer(state, {
    type: 'SET_REMOTE_PRODUCTION',
    state: {
      operators: [],
      locks: [],
      notes: [],
      events: [],
      collaborationEnabled: false,
      containsRuntimeHandles: false,
    },
  });

  assert.equal(next, state);
  assert.equal(next.remoteProduction, initialRemoteProduction);
});
