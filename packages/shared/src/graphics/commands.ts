import type { GraphicsCommandStub } from './types.js';

/**
 * Graph-safe command stubs for future Production Graph integration.
 * Phase 9 records intended commands in UI state only — no reducer wiring yet.
 */
export type GraphicsCommandIntent = {
  type: GraphicsCommandStub;
  payload: Record<string, unknown>;
  timestamp: string;
  actorRole: 'GRAPHICS_OPERATOR' | 'DIRECTOR';
};

export function createGraphicsCommandIntent(
  type: GraphicsCommandStub,
  payload: Record<string, unknown>,
  actorRole: GraphicsCommandIntent['actorRole'] = 'GRAPHICS_OPERATOR',
): GraphicsCommandIntent {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    actorRole,
  };
}
