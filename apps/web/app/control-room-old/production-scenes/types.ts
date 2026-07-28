export type ProductionSceneOperationalState = 'program' | 'preview' | 'ready' | 'standby' | 'warning' | 'error' | 'disabled' | 'scheduled';
export type SceneReadinessState = 'ready' | 'warning' | 'error' | 'not-configured' | 'armed' | 'inactive';
export type ProductionSceneType = 'opening' | 'interview' | 'panel' | 'audience-qa' | 'sponsor-break' | 'closing' | 'podcast' | 'sports' | 'worship' | 'news' | 'webinar' | 'classroom' | 'gaming' | 'live-shopping' | 'replay' | 'custom';
export type ProductionSceneDensity = 'compact' | 'standard' | 'expanded';
export type ProductionSceneCardPerspective = 'director' | 'solo-streamer' | 'technical-director' | 'audio-engineer' | 'graphics-operator' | 'replay-operator' | 'streaming-operator' | 'monitor-wall' | 'compact';
export type SceneReadiness = Readonly<Record<'video' | 'audio' | 'guests' | 'graphics' | 'outputs' | 'recording' | 'automation' | 'ai', SceneReadinessState>>;
export interface ProductionSceneCardMetadata {
  readonly id: string; readonly sequence: number; readonly name: string; readonly sceneType: ProductionSceneType; readonly description?: string; readonly operationalState: ProductionSceneOperationalState;
  readonly layout: { readonly name: string; readonly participantSlots: number; readonly activeParticipants: number; readonly sourceCount: number; readonly aspectVariants: readonly ('16:9' | '9:16' | '1:1')[]; readonly thumbnailVariant: 'fullscreen' | 'side-by-side' | 'picture-in-picture' | 'grid-2x2' | 'product-focus' | 'scoreboard' | 'media-roll' | 'custom' };
  readonly timing: { readonly mode: 'elapsed' | 'planned' | 'countdown' | 'scheduled' | 'none'; readonly seconds?: number; readonly rundownPosition?: number; readonly rundownTotal?: number; readonly scheduledTime?: string };
  readonly readiness: SceneReadiness;
  readonly destinations: readonly { readonly id: string; readonly label: string; readonly platform: 'youtube' | 'facebook' | 'tiktok' | 'instagram' | 'linkedin' | 'twitch' | 'recording' | 'custom'; readonly state: 'included' | 'active' | 'excluded' | 'warning' | 'error' | 'vertical' | 'horizontal' }[];
  readonly participants: readonly { readonly id: string; readonly name: string; readonly role: string; readonly state: 'ready' | 'waiting' | 'offline' | 'muted' | 'warning' }[];
  readonly graphics: readonly { readonly id: string; readonly name: string; readonly type: string; readonly state: 'armed' | 'active' | 'disabled' | 'warning' }[];
  readonly automation: { readonly enabled: boolean; readonly actionCount: number; readonly labels: readonly string[] };
  readonly intelligence: { readonly speakerTracking: boolean; readonly clipDetection: boolean; readonly autoCamera: boolean; readonly moderationAssist: boolean };
  readonly issueCount: number; readonly warningSummary?: string;
  readonly primaryAction: 'inspect' | 'prepare' | 'send-to-preview' | 'take' | 'review-issues' | 'repair' | 'enable' | 'rehearse';
}
