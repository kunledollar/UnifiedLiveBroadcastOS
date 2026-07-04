import type { AICommandStub } from './types.js';

export type AICommandIntent = {
  type: AICommandStub;
  payload: Record<string, unknown>;
  timestamp: string;
  actorRole: string;
  requiresApproval: true;
};

export function createAICommandIntent(
  type: AICommandStub,
  payload: Record<string, unknown>,
  actorRole = 'producer',
): AICommandIntent {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    actorRole,
    requiresApproval: true,
  };
}
