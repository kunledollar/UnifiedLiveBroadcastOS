import type {
  ProducerNote,
  RemoteCollaborationEvent,
  RemoteProductionState,
} from '@ubos/shared';
import { createCollaborationCommandIntent } from '@ubos/shared';

export type CollaborationState = {
  remoteProduction: RemoteProductionState;
  commandLog: ReturnType<typeof createCollaborationCommandIntent>[];
};

export type CollaborationAction =
  | { type: 'SET_REMOTE_PRODUCTION'; state: RemoteProductionState }
  | { type: 'ADD_NOTE'; note: ProducerNote }
  | { type: 'RESOLVE_NOTE'; noteId: string }
  | { type: 'PIN_NOTE'; noteId: string }
  | { type: 'ADD_EVENT'; event: RemoteCollaborationEvent };

export const initialCollaborationState: CollaborationState = {
  remoteProduction: {
    operators: [],
    locks: [],
    notes: [],
    events: [],
    collaborationEnabled: false,
    containsRuntimeHandles: false,
  },
  commandLog: [],
};

export function collaborationReducer(
  state: CollaborationState,
  action: CollaborationAction,
): CollaborationState {
  switch (action.type) {
    case 'SET_REMOTE_PRODUCTION':
      return { ...state, remoteProduction: action.state };
    case 'ADD_NOTE':
      return {
        ...state,
        remoteProduction: {
          ...state.remoteProduction,
          notes: [action.note, ...state.remoteProduction.notes],
        },
        commandLog: [
          createCollaborationCommandIntent('ADD_PRODUCER_NOTE', { note: action.note }),
          ...state.commandLog,
        ].slice(0, 50),
      };
    case 'RESOLVE_NOTE':
      return {
        ...state,
        remoteProduction: {
          ...state.remoteProduction,
          notes: state.remoteProduction.notes.map((note) =>
            note.id === action.noteId ? { ...note, status: 'resolved' as const, updatedAt: new Date().toISOString() } : note,
          ),
        },
      };
    case 'PIN_NOTE':
      return {
        ...state,
        remoteProduction: {
          ...state.remoteProduction,
          notes: state.remoteProduction.notes.map((note) =>
            note.id === action.noteId ? { ...note, status: 'pinned' as const, updatedAt: new Date().toISOString() } : note,
          ),
        },
      };
    case 'ADD_EVENT':
      return {
        ...state,
        remoteProduction: {
          ...state.remoteProduction,
          events: [action.event, ...state.remoteProduction.events].slice(0, 50),
        },
      };
    default:
      return state;
  }
}
