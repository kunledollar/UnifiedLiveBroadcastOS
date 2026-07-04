import type { CollaborationCommandStub } from './types.js';

export type CollaborationCommandIntent = {
  type: CollaborationCommandStub;
  payload: Record<string, unknown>;
  timestamp: string;
  actorRole: string;
};

export function createCollaborationCommandIntent(
  type: CollaborationCommandStub,
  payload: Record<string, unknown>,
  actorRole = 'director',
): CollaborationCommandIntent {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    actorRole,
  };
}
