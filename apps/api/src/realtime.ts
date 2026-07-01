import type { FastifyInstance } from 'fastify';
import {
  broadcastRealtimeEventTypes,
  broadcastRealtimeRoom,
  createSyncEnvelope,
  deserializeSyncEnvelope,
  serializeSyncEnvelope,
  validateSyncEnvelope,
  type BroadcastRealtimeEvent,
  type BroadcastRealtimeRoom,
  type SyncEnvelope,
  type SyncMessage,
} from '@ubos/shared';
import { z } from 'zod';
import { createHash, randomUUID } from 'node:crypto';
import type { Duplex } from 'node:stream';

const roomSchema = z.object({ workspaceId: z.string().trim().min(1), broadcastId: z.string().trim().min(1) });
const eventSchema = roomSchema.extend({
  actorId: z.string().trim().min(1).optional(), entityId: z.string().trim().min(1).optional(),
  entityType: z.enum(['guest', 'scene', 'source', 'broadcast', 'system', 'webrtc']), eventType: z.enum(broadcastRealtimeEventTypes),
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
  registerSyncHubUpgrade(app);
  app.server.on('upgrade', (request, socket) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.pathname !== '/realtime/broadcast') return;
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

type SyncHubClient = { id: string; socket: Duplex; sessionId: string; clientId: string; operatorId: string; lastSeenAt: string };
const syncHubClients = new Map<string, SyncHubClient>();

function decodeTextFrames(buffer: Buffer) {
  const messages: string[] = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const first = buffer[offset++]!;
    const second = buffer[offset++]!;
    const opcode = first & 0x0f;
    let length = second & 0x7f;
    if (length === 126) { if (offset + 2 > buffer.length) break; length = buffer.readUInt16BE(offset); offset += 2; }
    else if (length === 127) { if (offset + 8 > buffer.length) break; const big = buffer.readBigUInt64BE(offset); offset += 8; if (big > BigInt(Number.MAX_SAFE_INTEGER)) break; length = Number(big); }
    const masked = Boolean(second & 0x80);
    let mask: Buffer | undefined;
    if (masked) { if (offset + 4 > buffer.length) break; mask = buffer.subarray(offset, offset + 4); offset += 4; }
    if (offset + length > buffer.length) break;
    const payload = Buffer.from(buffer.subarray(offset, offset + length));
    offset += length;
    if (mask) for (let i = 0; i < payload.length; i++) payload[i] = payload[i]! ^ mask[i % 4]!;
    if (opcode === 0x1) messages.push(payload.toString('utf8'));
  }
  return messages;
}

function sendSync(client: SyncHubClient, message: SyncMessage) {
  if (!client.socket.destroyed) client.socket.write(frame(serializeSyncEnvelope(message)));
}

function broadcastSync(message: SyncMessage, exceptConnectionId?: string) {
  let deliveredTo = 0;
  for (const client of syncHubClients.values()) {
    if (client.sessionId === message.sessionId && client.id !== exceptConnectionId) { sendSync(client, message); deliveredTo++; }
  }
  return deliveredTo;
}

export function getSyncHubDiagnostics(sessionId?: string) {
  const clients = [...syncHubClients.values()].filter((client) => !sessionId || client.sessionId === sessionId);
  return { connectedClients: clients.length, clients: clients.map(({ id, sessionId: sid, clientId, operatorId, lastSeenAt }) => ({ id, sessionId: sid, clientId, operatorId, lastSeenAt })) };
}

export function registerSyncHubUpgrade(app: FastifyInstance) {
  app.server.on('upgrade', (request, socket) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      if (url.pathname !== '/realtime/sync') return;
      const sessionId = url.searchParams.get('sessionId');
      const clientId = url.searchParams.get('clientId');
      const operatorId = url.searchParams.get('operatorId');
      if (!sessionId || !clientId || !operatorId) return socket.destroy();
      const key = request.headers['sec-websocket-key'];
      if (typeof key !== 'string') return socket.destroy();
      const accept = createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
      socket.write(['HTTP/1.1 101 Switching Protocols', 'Upgrade: websocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${accept}`, '', ''].join('\r\n'));
      const id = randomUUID();
      const client: SyncHubClient = { id, socket, sessionId, clientId, operatorId, lastSeenAt: new Date().toISOString() };
      syncHubClients.set(id, client);
      socket.on('data', (chunk: Buffer) => {
        for (const text of decodeTextFrames(chunk)) {
          try {
            const message = deserializeSyncEnvelope(text);
            if (!validateSyncEnvelope(message) || message.sessionId !== sessionId) throw new Error('Invalid sync envelope.');
            client.lastSeenAt = new Date().toISOString();
            if (message.type === 'CLIENT_HEARTBEAT') {
              sendSync(client, createSyncEnvelope({ sessionId: message.sessionId, broadcastSessionId: message.broadcastSessionId, clientId: message.clientId, operatorId: message.operatorId, graphRevision: message.graphRevision, correlationId: message.id, type: 'CLIENT_HEARTBEAT', payload: { ...(message.payload as object), acknowledgedAt: client.lastSeenAt } }));
            }
            broadcastSync(message, id);
          } catch (error) {
            const envelope: SyncEnvelope<'SYNC_ERROR', { message: string }> = createSyncEnvelope({ id: `sync-error:${randomUUID()}`, type: 'SYNC_ERROR', sessionId, broadcastSessionId: sessionId, clientId, operatorId, graphRevision: 0, payload: { message: error instanceof Error ? error.message : 'Invalid sync message.' } });
            sendSync(client, envelope);
          }
        }
      });
      socket.on('close', () => syncHubClients.delete(id));
      socket.on('error', () => syncHubClients.delete(id));
    } catch { socket.destroy(); }
  });
}
