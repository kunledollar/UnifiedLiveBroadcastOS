import type { MediaCommandStub } from './types.js';

export type MediaCommandIntent = {
  type: MediaCommandStub;
  payload: Record<string, unknown>;
  timestamp: string;
  actorRole: 'DIRECTOR' | 'PRODUCER';
};

export function createMediaCommandIntent(
  type: MediaCommandStub,
  payload: Record<string, unknown>,
  actorRole: MediaCommandIntent['actorRole'] = 'DIRECTOR',
): MediaCommandIntent {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    actorRole,
  };
}
