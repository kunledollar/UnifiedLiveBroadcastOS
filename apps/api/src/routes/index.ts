import type { FastifyInstance } from 'fastify';
import { BroadcastSessionStatus, createBroadcastSessionSchema, createDestinationSchema, createGuestSchema, mockChatMessageSchema } from '@ubos/shared';
import { BroadcastSessionService } from '../services/broadcast-session-service.js';
import { ChatAggregatorService } from '../services/chat-aggregator-service.js';
import { DestinationService } from '../services/destination-service.js';
import { FollowEngineService } from '../services/follow-engine-service.js';
import { GuestService } from '../services/guest-service.js';

export async function registerRoutes(app: FastifyInstance) {
  const sessions = new BroadcastSessionService(); const guests = new GuestService(); const destinations = new DestinationService(); const chat = new ChatAggregatorService(); const follows = new FollowEngineService();
  app.get('/health', async () => ({ ok: true, service: 'ubos-api' }));
  app.post('/broadcast-sessions', async (req) => sessions.create(createBroadcastSessionSchema.parse(req.body)));
  app.get<{ Params: { id: string } }>('/broadcast-sessions/:id', async (req, reply) => sessions.get(req.params.id) ?? reply.code(404).send({ message: 'Session not found' }));
  app.get<{ Params: { workspaceId: string } }>('/workspaces/:workspaceId/broadcast-sessions', async (req) => sessions.list(req.params.workspaceId));
  app.post<{ Params: { id: string } }>('/broadcast-sessions/:id/start', async (req, reply) => sessions.setStatus(req.params.id, BroadcastSessionStatus.Live) ?? reply.code(404).send({ message: 'Session not found' }));
  app.post<{ Params: { id: string } }>('/broadcast-sessions/:id/stop', async (req, reply) => sessions.setStatus(req.params.id, BroadcastSessionStatus.Ended) ?? reply.code(404).send({ message: 'Session not found' }));
  app.post<{ Params: { sessionId: string } }>('/broadcast-sessions/:sessionId/guests', async (req) => guests.create(req.params.sessionId, createGuestSchema.parse(req.body)));
  app.get<{ Params: { sessionId: string } }>('/broadcast-sessions/:sessionId/guests', async (req) => guests.list(req.params.sessionId));
  app.patch<{ Params: { id: string } }>('/guests/:id', async (req, reply) => guests.update(req.params.id, req.body as Parameters<GuestService['update']>[1]) ?? reply.code(404).send({ message: 'Guest not found' }));
  app.delete<{ Params: { id: string } }>('/guests/:id', async (req) => ({ deleted: guests.delete(req.params.id) }));
  app.get<{ Params: { workspaceId: string } }>('/workspaces/:workspaceId/destinations', async (req) => destinations.list(req.params.workspaceId));
  app.post<{ Params: { workspaceId: string } }>('/workspaces/:workspaceId/destinations', async (req) => destinations.create(req.params.workspaceId, createDestinationSchema.parse(req.body)));
  app.patch<{ Params: { id: string } }>('/destinations/:id', async (req, reply) => destinations.update(req.params.id, req.body as Parameters<DestinationService['update']>[1]) ?? reply.code(404).send({ message: 'Destination not found' }));
  app.get<{ Params: { sessionId: string } }>('/broadcast-sessions/:sessionId/chat-messages', async (req) => chat.listMessages(req.params.sessionId));
  app.post<{ Params: { sessionId: string } }>('/broadcast-sessions/:sessionId/chat-messages/mock', async (req) => chat.createMock(req.params.sessionId, mockChatMessageSchema.parse(req.body)));
  app.get<{ Params: { workspaceId: string } }>('/workspaces/:workspaceId/follow-profile', async (req) => follows.getProfile(req.params.workspaceId));
  app.patch<{ Params: { workspaceId: string } }>('/workspaces/:workspaceId/follow-profile', async (req) => follows.updateProfile(req.params.workspaceId, req.body as Parameters<FollowEngineService['updateProfile']>[1]));
  app.post<{ Params: { sessionId: string } }>('/broadcast-sessions/:sessionId/follow-events', async (req) => follows.recordEvent(req.params.sessionId, req.body as Parameters<FollowEngineService['recordEvent']>[1]));
}
