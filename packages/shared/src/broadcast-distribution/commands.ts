import type { DistributionCommandStub } from './types.js';

export type DistributionCommandIntent = {
  type: DistributionCommandStub;
  payload: Record<string, unknown>;
  timestamp: string;
  actorRole: string;
  redacted: true;
};

export function createDistributionCommandIntent(
  type: DistributionCommandStub,
  payload: Record<string, unknown>,
  actorRole = 'producer',
): DistributionCommandIntent {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    actorRole,
    redacted: true,
  };
}
