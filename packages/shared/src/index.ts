import { z } from 'zod';

export enum BroadcastSessionStatus {
  Draft = 'draft',
  Live = 'live',
  Ended = 'ended',
}
export enum GuestStatus {
  Invited = 'invited',
  Waiting = 'waiting',
  OnAir = 'on_air',
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

export type CanvasAspectRatio = '16:9' | '9:16' | '1:1';
export type ProductionStatus = 'offline' | 'rehearsal' | 'live' | 'ending';
export type SceneLayout = 'solo' | 'interview' | 'grid' | 'screen_share' | 'vertical_split' | 'picture_in_picture';
export type SceneSourceType = 'camera' | 'screen' | 'media' | 'overlay' | 'browser' | 'audio';
export type BroadcastCanvas = {
  id: string;
  label: string;
  aspectRatio: CanvasAspectRatio;
  destinationHint?: string;
};
export interface SceneSource {
  id: string;
  type: SceneSourceType;
  label: string;
  visible: boolean;
  muted?: boolean;
}
export interface Scene {
  id: string;
  name: string;
  layout: SceneLayout;
  sources: SceneSource[];
  canvases: BroadcastCanvas[];
  isActive?: boolean;
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
  sessionId: string;
  displayName: string;
  status: GuestStatus;
  role: GuestRole;
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

export const createBroadcastSessionSchema = z.object({ workspaceId: z.string().min(1), title: z.string().min(1).max(120) });
export const createGuestSchema = z.object({ displayName: z.string().min(1).max(80), role: z.nativeEnum(GuestRole).default(GuestRole.Guest) });
export const createDestinationSchema = z.object({ platform: z.nativeEnum(DestinationPlatform), label: z.string().min(1), enabled: z.boolean().default(false) });
export const mockChatMessageSchema = z.object({ authorName: z.string().min(1), body: z.string().min(1).max(500), platform: z.nativeEnum(ChatPlatform).default(ChatPlatform.Mock) });
export const SUPPORTED_DESTINATIONS = Object.values(DestinationPlatform);
