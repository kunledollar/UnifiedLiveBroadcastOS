import type { FastifyInstance } from 'fastify';
import {
  broadcastRealtimeEventTypes,
  broadcastRealtimeRoom,
  type BroadcastRealtimeEvent,
  type BroadcastRealtimeRoom,
} from '@ubos/shared';
import { z } from 'zod';
import { createHash, randomUUID } from 'node:crypto';
import type { Duplex } from 'node:stream';

const roomSchema = z.object({ workspaceId: z.string().trim().min(1), broadcastId: z.string().trim().min(1) });
const eventSchema = roomSchema.extend({
  actorId: z.string().trim().min(1).optional(), entityId: z.string().trim().min(1).optional(),
  entityType: z.enum(['guest', 'scene', 'source', 'broadcast', 'system']), eventType: z.enum(broadcastRealtimeEventTypes),
  timestamp: z.string().datetime().optional(), payload: z.record(z.string(), z.unknown()).default({}),
});

type Client = { id: string; socket: Duplex; room: string };
const clients = new Map<string, Client>();

function frame(data: string) {
  const payload = Buffer.from(data);
  if (payload.length < 126) return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  if (payload.length < 65536) {
    const header = Buffer.alloc(4); header[0] = 0x81; header[1] = 126; header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, payload]);
  }
  const header = Buffer.alloc(10); header[0] = 0x81; header[1] = 127; header.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([header, payload]);
}

function send(client: Client, event: BroadcastRealtimeEvent) {
  if (!client.socket.destroyed) client.socket.write(frame(JSON.stringify(event)));
}

export function emitBroadcastRealtime(event: BroadcastRealtimeEvent) {
  const room = broadcastRealtimeRoom(event);
  for (const client of clients.values()) if (client.room === room) send(client, event);
}

export async function registerRealtime(app: FastifyInstance) {
  app.server.on('upgrade', (request, socket) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.pathname !== '/realtime/broadcast') return socket.destroy();
      const roomInput = roomSchema.parse({ workspaceId: url.searchParams.get('workspaceId'), broadcastId: url.searchParams.get('broadcastId') });
      const key = request.headers['sec-websocket-key'];
      if (typeof key !== 'string') return socket.destroy();
      const accept = createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
      socket.write(['HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${accept}`, '', ''].join('\r\n'));
      const id = randomUUID();
      const client: Client = { id, socket, room: broadcastRealtimeRoom(roomInput) };
      clients.set(id, client);
      send(client, { ...roomInput, entityType: 'system', eventType: 'system:connected', timestamp: new Date().toISOString(), payload: { connectionId: id } });
      socket.on('close', () => clients.delete(id));
      socket.on('error', () => clients.delete(id));
    } catch {
      socket.destroy();
    }
  });

  app.post('/realtime/broadcast/emit', async (req) => {
    const parsed = eventSchema.parse(req.body);
    const event: BroadcastRealtimeEvent = {
      workspaceId: parsed.workspaceId, broadcastId: parsed.broadcastId, entityType: parsed.entityType,
      eventType: parsed.eventType, timestamp: parsed.timestamp ?? new Date().toISOString(), payload: parsed.payload,
      ...(parsed.actorId ? { actorId: parsed.actorId } : {}), ...(parsed.entityId ? { entityId: parsed.entityId } : {}),
    };
    emitBroadcastRealtime(event);
    return { ok: true, room: broadcastRealtimeRoom(event), deliveredTo: clients.size };
  });
}
