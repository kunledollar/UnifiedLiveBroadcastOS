import { z } from 'zod';

export enum BroadcastSessionStatus {
  Draft = 'draft',
  Live = 'live',
  Ended = 'ended',
}
export enum GuestStatus {
  Invited = 'invited',
  Waiting = 'waiting',
  GreenRoom = 'green_room',
  Connected = 'connected',
  OnAir = 'on_air',
  Muted = 'muted',
  Disconnected = 'disconnected',
  Reconnecting = 'reconnecting',
  Rejected = 'rejected',
  Removed = 'removed',
}
export enum GuestRole {
  Host = 'host',
  Guest = 'guest',
  Producer = 'producer',
}
export enum DestinationPlatform {
  YouTube = 'youtube',
  Facebook = 'facebook',
  TikTok = 'tiktok',
  Instagram = 'instagram',
  LinkedIn = 'linkedin',
  Twitch = 'twitch',
  CustomRtmp = 'custom_rtmp',
}
export enum DestinationStatus {
  Disconnected = 'disconnected',
  Connected = 'connected',
  Live = 'live',
  Error = 'error',
}
export enum ChatPlatform {
  YouTube = 'youtube',
  Facebook = 'facebook',
  TikTok = 'tiktok',
  Instagram = 'instagram',
  Twitch = 'twitch',
  LinkedIn = 'linkedin',
  Mock = 'mock',
}
export enum ChatModerationStatus {
  Visible = 'visible',
  Held = 'held',
  Hidden = 'hidden',
}
export enum FollowPlatform {
  YouTube = 'youtube',
  Instagram = 'instagram',
  TikTok = 'tiktok',
  Twitch = 'twitch',
  Facebook = 'facebook',
  LinkedIn = 'linkedin',
}
export enum RecordingStatus {
  Pending = 'pending',
  Recording = 'recording',
  Processing = 'processing',
  Ready = 'ready',
  Failed = 'failed',
}
export enum SceneType {
  Intro = 'intro',
  Countdown = 'countdown',
  Camera = 'camera',
  Interview = 'interview',
  ScreenShare = 'screen_share',
  Break = 'break',
  Outro = 'outro',
  Custom = 'custom',
}

export type CanvasAspectRatio = '16:9' | '9:16' | '1:1';
export type ProductionStatus = 'offline' | 'rehearsal' | 'live' | 'ending';
export type SceneLayout =
  'solo' | 'interview' | 'grid' | 'screen_share' | 'vertical_split' | 'picture_in_picture';
export enum MediaRouteType {
  GuestCamera = 'guest_camera',
  GuestScreenShare = 'guest_screen_share',
  HostCamera = 'host_camera',
  MediaSource = 'media_source',
  ScreenShare = 'screen_share',
  Placeholder = 'placeholder',
}
export type MediaLayoutPreset =
  'full_screen' | 'side_by_side' | 'picture_in_picture' | '2x2_grid' | 'speaker_focus';
export type SceneSourceType = 'camera' | 'screen' | 'media' | 'overlay' | 'browser' | 'audio';
export type BroadcastCanvas = {
  id: string;
  label: string;
  aspectRatio: CanvasAspectRatio;
  destinationHint?: string;
};
export interface SceneSource {
  id: string;
  workspaceId?: string;
  broadcastId?: string;
  sceneId?: string;
  type: SceneSourceType;
  name: string;
  label: string;
  order: number;
  visible: boolean;
  isVisible: boolean;
  isLocked: boolean;
  settings: Record<string, unknown>;
  transform: Record<string, unknown>;
  muted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
export interface Scene {
  id: string;
  broadcastId: string;
  name: string;
  type: SceneType;
  order: number;
  isActive: boolean;
  thumbnailUrl?: string | null;
  background?: Record<string, unknown> | null;
  layout?: SceneLayout | null;
  sources: SceneSource[];
  overlays: Record<string, unknown>[];
  audioConfig: Record<string, unknown>;
  canvases: BroadcastCanvas[];
  createdAt: string;
  updatedAt: string;
}
export interface StreamHealthMetric {
  id: string;
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  helperText?: string;
}
export interface AudioChannel {
  id: string;
  label: string;
  level: number;
  muted: boolean;
  kind: 'mic' | 'system' | 'media' | 'guest';
}
export interface ProductionAsset {
  id: string;
  name: string;
  type: 'video' | 'image' | 'lower_third' | 'background' | 'overlay';
  status: 'ready' | 'queued' | 'disabled';
}

export interface BroadcastSession {
  id: string;
  workspaceId: string;
  title: string;
  status: BroadcastSessionStatus;
  createdAt: string;
}
export interface Guest {
  id: string;
  workspaceId?: string;
  sessionId: string;
  inviteId?: string | null;
  displayName: string;
  status: GuestStatus;
  role: GuestRole;
  isMuted?: boolean;
  isSpotlighted?: boolean;
  lastSeenAt?: string | null;
  privateChatNote?: string | null;
}
export interface MediaRoute {
  id: string;
  workspaceId: string;
  broadcastId: string;
  guestId?: string | null;
  sourceId?: string | null;
  sceneId?: string | null;
  routeType: MediaRouteType;
  displayName: string;
  isActive: boolean;
  isOnProgram: boolean;
  isPinned: boolean;
  isMuted: boolean;
  layoutSlot?: string | null;
  order: number;
  metadata: Record<string, unknown>;
  guest?: Guest | null;
  createdAt: string;
  updatedAt: string;
}
export interface MediaRoutingState {
  routes: MediaRoute[];
  layoutPreset: MediaLayoutPreset;
}
export const mediaLayoutPresets: { id: MediaLayoutPreset; label: string }[] = [
  { id: 'full_screen', label: 'Full Screen' },
  { id: 'side_by_side', label: 'Side by Side' },
  { id: 'picture_in_picture', label: 'Picture in Picture' },
  { id: '2x2_grid', label: '2x2 Grid' },
  { id: 'speaker_focus', label: 'Speaker Focus' },
];
export interface GuestInvite {
  id: string;
  workspaceId: string;
  sessionId: string;
  token: string;
  displayName?: string | null;
  revokedAt?: string | null;
  acceptedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}
export interface DeviceInfo {
  id: string;
  guestId: string;
  cameraReady: boolean;
  microphoneReady: boolean;
  networkReady: boolean;
  userAgent?: string | null;
}
export interface Destination {
  id: string;
  workspaceId: string;
  platform: DestinationPlatform;
  label: string;
  status: DestinationStatus;
  enabled: boolean;
}
export interface ChatMessage {
  id: string;
  sessionId: string;
  authorName: string;
  body: string;
  platform: ChatPlatform;
  moderationStatus: ChatModerationStatus;
  createdAt: string;
}
export interface StreamHealth {
  bitrateKbps: number;
  resolution: string;
  droppedFrames: number;
  cpuPercent: number;
}

export interface WebRtcService {
  createGuestToken(sessionId: string, guestName: string): Promise<string>;
}
export interface MediaRouterService {
  reserveRoute(sessionId: string): Promise<{ routeId: string; ingestUrl: string }>;
}
export interface ProductionAdapter {
  name: string;
  setLayout(sessionId: string, layoutId: string): Promise<void>;
}
export interface EdgeAgentService {
  registerAgent(workspaceId: string, agentVersion: string): Promise<{ agentId: string }>;
}
export interface ChatAggregatorService {
  listMessages(sessionId: string): Promise<ChatMessage[]>;
}
export interface DestinationPublisherService {
  publish(sessionId: string, destinationId: string): Promise<void>;
  stop(destinationId: string): Promise<void>;
}
export interface CrossFollowService {
  recordFollowEvent(sessionId: string, platform: FollowPlatform, handle: string): Promise<void>;
}

export const createBroadcastSessionSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(120),
});
export const createGuestSchema = z.object({
  displayName: z.string().min(1).max(80),
  role: z.nativeEnum(GuestRole).default(GuestRole.Guest),
});
export const createDestinationSchema = z.object({
  platform: z.nativeEnum(DestinationPlatform),
  label: z.string().min(1),
  enabled: z.boolean().default(false),
});
export const mockChatMessageSchema = z.object({
  authorName: z.string().min(1),
  body: z.string().min(1).max(500),
  platform: z.nativeEnum(ChatPlatform).default(ChatPlatform.Mock),
});
export const SUPPORTED_DESTINATIONS = Object.values(DestinationPlatform);

export const sceneTypeSchema = z.nativeEnum(SceneType);
export const createSceneSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: sceneTypeSchema.default(SceneType.Custom),
});
export const renameSceneSchema = z.object({ name: z.string().trim().min(1).max(80) });

export const sourceTypeSchema = z.enum([
  'camera',
  'screen',
  'media',
  'overlay',
  'browser',
  'audio',
] as const);
export const sourceSettingsSchema = z.record(z.string(), z.unknown()).default({});
export const sourceTransformSchema = z.record(z.string(), z.unknown()).default({});
export const addSceneSourceSchema = z.object({
  sceneId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  type: sourceTypeSchema,
});
export const renameSceneSourceSchema = z.object({
  sourceId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
});
export const updateSceneSourceSettingsSchema = z.object({
  sourceId: z.string().min(1),
  settings: sourceSettingsSchema,
});
export const updateSceneSourceTransformSchema = z.object({
  sourceId: z.string().min(1),
  transform: sourceTransformSchema,
});

export const guestInviteSchema = z.object({ displayName: z.string().trim().max(80).optional() });
export const renameGuestSchema = z.object({
  guestId: z.string().min(1),
  displayName: z.string().trim().min(1).max(80),
});
export const guestJoinSchema = z.object({
  token: z.string().trim().min(12),
  displayName: z.string().trim().min(1).max(80),
  cameraReady: z.boolean().default(false),
  microphoneReady: z.boolean().default(false),
  networkReady: z.boolean().default(false),
  userAgent: z.string().max(500).optional(),
});

export const broadcastRealtimeEventTypes = [
  'guest:joined',
  'guest:left',
  'guest:invited',
  'guest:admitted',
  'guest:rejected',
  'guest:muted',
  'guest:unmuted',
  'guest:removed',
  'guest:spotlighted',
  'guest:renamed',
  'guest:mediaReady',
  'guest:cameraToggled',
  'guest:microphoneToggled',
  'guest:screenShareStarted',
  'guest:screenShareStopped',
  'scene:switched',
  'scene:created',
  'scene:renamed',
  'scene:deleted',
  'source:created',
  'source:renamed',
  'source:deleted',
  'source:visibilityChanged',
  'source:lockChanged',
  'broadcast:statusChanged',
  'system:connected',
  'system:disconnected',
  'webrtc:offer',
  'webrtc:answer',
  'webrtc:iceCandidate',
  'webrtc:connectionStateChanged',
  'webrtc:trackStarted',
  'webrtc:trackStopped',
  'webrtc:error',
  'route:created',
  'route:removed',
  'route:pinned',
  'route:muted',
  'route:programChanged',
  'route:sceneAssigned',
  'route:layoutChanged',
] as const;

export type BroadcastRealtimeEventType = (typeof broadcastRealtimeEventTypes)[number];
export type BroadcastRealtimeEntityType =
  'guest' | 'scene' | 'source' | 'broadcast' | 'system' | 'webrtc' | 'route';
export type WebRtcSignalRole = 'host' | 'guest';
export type WebRtcConnectionState = RTCPeerConnectionState;
export interface WebRtcSignalPayload {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  connectionState?: WebRtcConnectionState;
  trackKind?: 'audio' | 'video';
  message?: string;
  [key: string]: unknown;
}
export interface WebRtcSignalEvent<TPayload = WebRtcSignalPayload> {
  workspaceId: string;
  broadcastId: string;
  guestId: string;
  senderRole: WebRtcSignalRole;
  targetRole: WebRtcSignalRole;
  timestamp: string;
  payload: TPayload;
}

export interface BroadcastRealtimeEvent<TPayload = Record<string, unknown>> {
  workspaceId: string;
  broadcastId: string;
  actorId?: string;
  entityId?: string;
  entityType: BroadcastRealtimeEntityType;
  eventType: BroadcastRealtimeEventType;
  timestamp: string;
  payload: TPayload;
}

export interface BroadcastRealtimeRoom {
  workspaceId: string;
  broadcastId: string;
}

export function broadcastRealtimeRoom({ workspaceId, broadcastId }: BroadcastRealtimeRoom) {
  return `workspace:${workspaceId}:broadcast:${broadcastId}`;
}
