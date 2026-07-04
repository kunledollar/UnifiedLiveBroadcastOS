import type {
  OperatorPresence,
  ProducerNote,
  ProductionLock,
  RemoteCollaborationEvent,
  RemoteProductionState,
} from './types.js';

export function createRemoteProductionState(input: {
  operators?: OperatorPresence[];
  locks?: ProductionLock[];
  notes?: ProducerNote[];
  events?: RemoteCollaborationEvent[];
  collaborationEnabled?: boolean;
}): RemoteProductionState {
  return {
    operators: input.operators ?? [],
    locks: input.locks ?? [],
    notes: input.notes ?? [],
    events: input.events ?? [],
    collaborationEnabled: input.collaborationEnabled ?? false,
    containsRuntimeHandles: false,
  };
}

export function isRemoteProductionStateReplaySafe(state: RemoteProductionState): boolean {
  return state.containsRuntimeHandles === false;
}
