import type { AutomationCommandStub } from './types.js';

export type AutomationCommandIntent = {
  type: AutomationCommandStub;
  payload: Record<string, unknown>;
  timestamp: string;
  actorRole: string;
};

export function createAutomationCommandIntent(
  type: AutomationCommandStub,
  payload: Record<string, unknown>,
  actorRole = 'director',
): AutomationCommandIntent {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    actorRole,
  };
}
