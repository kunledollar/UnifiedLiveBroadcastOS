import type { BroadcastRealtimeEntityType, BroadcastRealtimeEventType } from '@ubos/shared';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function emitRealtimeEvent(input: {
  workspaceId: string;
  broadcastId: string;
  eventType: BroadcastRealtimeEventType;
  entityType: BroadcastRealtimeEntityType;
  entityId?: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}) {
  try {
    await fetch(`${API_URL}/realtime/broadcast/emit`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...input, timestamp: new Date().toISOString(), payload: input.payload ?? {} }),
      cache: 'no-store',
    });
  } catch (error) {
    console.warn('Realtime event delivery failed', error);
  }
}
