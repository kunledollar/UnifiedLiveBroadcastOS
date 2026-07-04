import type { DeviceCommandStub } from './types.js';

export type DeviceCommandIntent = {
  type: DeviceCommandStub;
  payload: Record<string, unknown>;
  timestamp: string;
  actorRole: string;
  metadataOnly: true;
};

export function createDeviceCommandIntent(
  type: DeviceCommandStub,
  payload: Record<string, unknown>,
  actorRole = 'technical_director',
): DeviceCommandIntent {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    actorRole,
    metadataOnly: true,
  };
}
