/** Serializable, platform-agnostic contracts for the Social Fabric Workspace. */
export type SocialPlatform = 'youtube' | 'facebook' | 'tiktok' | 'twitch' | 'linkedin' | 'instagram' | 'x' | 'kick';
export type PlatformHealthStatus = 'healthy' | 'warning' | 'offline';
export interface PlatformMetadata { id:string; platform:SocialPlatform; displayName:string; status:PlatformHealthStatus; connected:boolean; viewerCount:number; followers:number; subscribers?:number; commentsToday:number; sharesToday:number; likesToday:number; giftsToday?:number; healthMessage:string; }
/** Identity domain: connected platform and channel identity, never SDK objects. */
export interface SocialIdentity { id:string; platform:SocialPlatform; displayName:string; accountLabel:string; connected:boolean; }
/** Audience domain: a platform-agnostic person or audience segment. */
export interface AudienceMember { id:string; displayName:string; segments:AudienceSegment[]; region:string; engagementScore:number; }
export type AudienceSegment = 'vip'|'subscriber'|'donor'|'moderator'|'guest'|'sponsor'|'returning'|'future-lead';
/** Engagement domain: comments, reactions, moderation, polls, gifts, shares and mentions. */
export interface SocialEngagement { id:string; platform:SocialPlatform; kind:'comment'|'reaction'|'poll'|'gift'|'share'|'mention'|'moderation'; createdAt:string; }
/** Distribution domain: platform-neutral delivery and publishing metadata. */
export interface SocialDistribution { id:string; platform:SocialPlatform; direction:'input'|'output'; status:PlatformHealthStatus; summary:string; }
