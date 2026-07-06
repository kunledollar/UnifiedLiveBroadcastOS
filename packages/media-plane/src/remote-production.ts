import type { SceneCompositor, RenderLayer } from './compositor/index.js';
import { createRenderLayer } from './compositor/index.js';
import type { AudioMixer } from './media-runtime/audio-mixer.js';
import { RingAudioBuffer } from './media-runtime/audio-decoder.js';
import type { PreviewOutput, ProgramOutput } from './output-pipeline.js';
import type { ProductionSwitcher } from './production-switcher.js';

export type GuestLifecycleState =
  'invited' | 'connecting' | 'connected' | 'waiting' | 'live' | 'disconnected';
export type GuestDeviceStatus = 'unknown' | 'enabled' | 'disabled' | 'muted' | 'unavailable';
export type NetworkQuality = 'unknown' | 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
export type ProducerMessageKind = 'instruction' | 'warning' | 'approval' | 'ifb';
export type TallyProgramState = 'off' | 'preview' | 'program';
export type IFBMode = 'disabled' | 'producer_only' | 'program_mix_minus' | 'custom_mix_minus';
export type RemoteProductionEventType =
  | 'manager_created'
  | 'guest_invited'
  | 'guest_updated'
  | 'guest_connecting'
  | 'guest_connected'
  | 'guest_waiting'
  | 'guest_approved'
  | 'guest_live'
  | 'guest_disconnected'
  | 'producer_message_sent'
  | 'tally_updated'
  | 'ifb_updated'
  | 'guest_integrated';

export interface GuestMetadata {
  readonly cameraStatus: GuestDeviceStatus;
  readonly microphoneStatus: GuestDeviceStatus;
  readonly networkQuality: NetworkQuality;
  readonly connectionDurationMs: number;
  readonly displayName?: string;
  readonly role?: string;
  readonly location?: string;
  readonly notes?: string;
}
export interface GuestSession {
  readonly id: string;
  readonly inviteId: string;
  readonly state: GuestLifecycleState;
  readonly metadata: GuestMetadata;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly invitedAt: string;
  readonly connectedAt?: string;
  readonly disconnectedAt?: string;
  readonly approvedAt?: string;
  readonly liveAt?: string;
  readonly producerApproved: boolean;
  readonly sceneLayerId?: string;
  readonly audioChannelId?: string;
  readonly containsRuntimeHandles: false;
  readonly containsMediaPayloads: false;
}
export interface GreenRoom {
  readonly id: string;
  readonly guestIds: readonly string[];
  readonly waitingGuestIds: readonly string[];
  readonly approvedGuestIds: readonly string[];
  readonly liveGuestIds: readonly string[];
  readonly producerApprovalRequired: boolean;
  readonly capacity: number;
  readonly metadata: Record<string, unknown>;
}
export interface ProducerMessage {
  readonly id: string;
  readonly guestId?: string;
  readonly kind: ProducerMessageKind;
  readonly body: string;
  readonly sentAt: string;
  readonly fromProducerId: string;
  readonly delivered: boolean;
  readonly metadata: Record<string, unknown>;
}
export interface TallyState {
  readonly guestId: string;
  readonly state: TallyProgramState;
  readonly previewSceneId?: string;
  readonly programSceneId?: string;
  readonly updatedAt: string;
  readonly metadata: Record<string, unknown>;
}
export interface IFBState {
  readonly guestId: string;
  readonly mode: IFBMode;
  readonly enabled: boolean;
  readonly sourceBusId?: string;
  readonly mixMinus: boolean;
  readonly producerTalkback: boolean;
  readonly updatedAt: string;
  readonly metadata: Record<string, unknown>;
}
export interface RemoteProductionRuntimeEvent {
  readonly id: string;
  readonly type: RemoteProductionEventType;
  readonly timestamp: string;
  readonly guestId?: string;
  readonly message: string;
  readonly metadata: Record<string, unknown>;
}
export interface RemoteProductionSnapshot {
  readonly id: string;
  readonly greenRoom: GreenRoom;
  readonly guests: readonly GuestSession[];
  readonly producerMessages: readonly ProducerMessage[];
  readonly tallyStates: readonly TallyState[];
  readonly ifbStates: readonly IFBState[];
  readonly integration: {
    readonly compositorIds: readonly string[];
    readonly audioMixerId?: string;
    readonly previewOutputId?: string;
    readonly programOutputId?: string;
    readonly productionSwitcherId?: string;
  };
  readonly events: readonly RemoteProductionRuntimeEvent[];
  readonly backend: {
    readonly mode: 'metadata_only';
    readonly webrtcTransport: false;
    readonly signaling: false;
    readonly screenSharing: false;
    readonly guestRecording: false;
    readonly chat: false;
  };
  readonly containsRuntimeHandles: false;
  readonly containsMediaPayloads: false;
}
export interface RemoteProductionManager {
  readonly id: string;
  inviteGuest(input: {
    guestId?: string;
    inviteId?: string;
    displayName?: string;
    role?: string;
    location?: string;
    notes?: string;
  }): GuestSession;
  updateGuestMetadata(guestId: string, metadata: Partial<GuestMetadata>): GuestSession;
  markConnecting(guestId: string): GuestSession;
  markConnected(guestId: string): GuestSession;
  moveToWaiting(guestId: string): GuestSession;
  approveGuest(guestId: string, producerId?: string): GuestSession;
  makeGuestLive(guestId: string): GuestSession;
  disconnectGuest(guestId: string): GuestSession;
  sendProducerMessage(
    message: Omit<ProducerMessage, 'id' | 'sentAt' | 'delivered'> & { id?: string },
  ): ProducerMessage;
  updateTally(
    guestId: string,
    state: TallyProgramState,
    metadata?: Record<string, unknown>,
  ): TallyState;
  configureIFB(guestId: string, patch: Partial<Omit<IFBState, 'guestId' | 'updatedAt'>>): IFBState;
  integrateGuest(
    guestId: string,
    input?: { compositor?: SceneCompositor; audioMixer?: AudioMixer; zIndex?: number },
  ): GuestSession;
  getGuest(guestId: string): GuestSession | undefined;
  getSnapshot(): RemoteProductionSnapshot;
  getRuntimeEvents(): readonly RemoteProductionRuntimeEvent[];
  onRuntimeEvent(callback: (event: RemoteProductionRuntimeEvent) => void): () => void;
}

const now = () => new Date().toISOString();
const eid = (type: string) => `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const defaultMeta = (m: Partial<GuestMetadata> = {}): GuestMetadata =>
  Object.freeze({
    cameraStatus: 'unknown',
    microphoneStatus: 'unknown',
    networkQuality: 'unknown',
    connectionDurationMs: 0,
    ...m,
  });

export function createGuestSession(
  input: {
    id?: string;
    inviteId?: string;
    metadata?: Partial<GuestMetadata>;
    state?: GuestLifecycleState;
  } = {},
): GuestSession {
  const t = now();
  return Object.freeze({
    id: input.id ?? `guest:${Date.now()}`,
    inviteId: input.inviteId ?? `invite:${Date.now()}`,
    state: input.state ?? 'invited',
    metadata: defaultMeta(input.metadata),
    createdAt: t,
    updatedAt: t,
    invitedAt: t,
    producerApproved: false,
    containsRuntimeHandles: false,
    containsMediaPayloads: false,
  });
}
export const createGreenRoom = (input: Partial<GreenRoom> = {}): GreenRoom =>
  Object.freeze({
    id: input.id ?? 'green-room:default',
    guestIds: input.guestIds ?? [],
    waitingGuestIds: input.waitingGuestIds ?? [],
    approvedGuestIds: input.approvedGuestIds ?? [],
    liveGuestIds: input.liveGuestIds ?? [],
    producerApprovalRequired: input.producerApprovalRequired ?? true,
    capacity: input.capacity ?? 8,
    metadata: clone(input.metadata ?? {}),
  });
export const createTallyState = (
  input: Omit<TallyState, 'updatedAt'> & { updatedAt?: string },
): TallyState =>
  Object.freeze({ ...input, updatedAt: input.updatedAt ?? now(), metadata: clone(input.metadata) });
export const createIFBState = (input: Partial<IFBState> & { guestId: string }): IFBState =>
  Object.freeze({
    guestId: input.guestId,
    mode: input.mode ?? 'disabled',
    enabled: input.enabled ?? false,
    ...(input.sourceBusId ? { sourceBusId: input.sourceBusId } : {}),
    mixMinus: input.mixMinus ?? true,
    producerTalkback: input.producerTalkback ?? false,
    updatedAt: input.updatedAt ?? now(),
    metadata: clone(input.metadata ?? {}),
  });

export function createRemoteProductionManager(
  input: {
    id?: string;
    greenRoom?: Partial<GreenRoom>;
    compositors?: readonly SceneCompositor[];
    audioMixer?: AudioMixer;
    previewOutput?: PreviewOutput;
    programOutput?: ProgramOutput;
    productionSwitcher?: ProductionSwitcher;
    metadata?: Record<string, unknown>;
  } = {},
): RemoteProductionManager {
  const id = input.id ?? 'remote-production:default';
  let guests = new Map<string, GuestSession>();
  let messages: ProducerMessage[] = [];
  let tallies = new Map<string, TallyState>();
  let ifbs = new Map<string, IFBState>();
  let events: RemoteProductionRuntimeEvent[] = [];
  const listeners = new Set<(event: RemoteProductionRuntimeEvent) => void>();
  const emit = (
    type: RemoteProductionEventType,
    message: string,
    guestId?: string,
    metadata: Record<string, unknown> = {},
  ) => {
    const e = Object.freeze({
      id: eid(type),
      type,
      timestamp: now(),
      ...(guestId ? { guestId } : {}),
      message,
      metadata: clone(metadata),
    });
    events = [e, ...events].slice(0, 300);
    listeners.forEach((cb) => cb(e));
    return e;
  };
  const put = (guest: GuestSession) => {
    guests.set(guest.id, guest);
    emit('guest_updated', `Guest ${guest.id} updated`, guest.id, { state: guest.state });
    return guest;
  };
  const requireGuest = (guestId: string) => {
    const g = guests.get(guestId);
    if (!g) throw new Error(`Unknown guest ${guestId}`);
    return g;
  };
  const patch = (
    guestId: string,
    state: GuestLifecycleState,
    extra: Partial<GuestSession> = {},
  ) => {
    const g = requireGuest(guestId);
    const meta = g.connectedAt
      ? defaultMeta({ ...g.metadata, connectionDurationMs: Date.now() - Date.parse(g.connectedAt) })
      : g.metadata;
    return put(Object.freeze({ ...g, ...extra, state, metadata: meta, updatedAt: now() }));
  };
  const greenRoom = (): GreenRoom => {
    const list = [...guests.values()];
    return createGreenRoom({
      ...input.greenRoom,
      guestIds: list.map((g) => g.id),
      waitingGuestIds: list.filter((g) => g.state === 'waiting').map((g) => g.id),
      approvedGuestIds: list.filter((g) => g.producerApproved).map((g) => g.id),
      liveGuestIds: list.filter((g) => g.state === 'live').map((g) => g.id),
      metadata: { ...(input.greenRoom?.metadata ?? {}), ...(input.metadata ?? {}) },
    });
  };
  const api: RemoteProductionManager = {
    id,
    inviteGuest(invite) {
      const g = createGuestSession({
        ...(invite.guestId ? { id: invite.guestId } : {}),
        ...(invite.inviteId ? { inviteId: invite.inviteId } : {}),
        metadata: Object.fromEntries(
          Object.entries({
            displayName: invite.displayName,
            role: invite.role,
            location: invite.location,
            notes: invite.notes,
          }).filter(([, value]) => value !== undefined),
        ) as Partial<GuestMetadata>,
      });
      guests.set(g.id, g);
      ifbs.set(g.id, createIFBState({ guestId: g.id }));
      tallies.set(g.id, createTallyState({ guestId: g.id, state: 'off', metadata: {} }));
      emit('guest_invited', `Guest ${g.id} invited`, g.id);
      return g;
    },
    updateGuestMetadata(guestId, metadata) {
      const g = requireGuest(guestId);
      return put(
        Object.freeze({
          ...g,
          metadata: defaultMeta({ ...g.metadata, ...metadata }),
          updatedAt: now(),
        }),
      );
    },
    markConnecting(guestId) {
      const g = patch(guestId, 'connecting');
      emit('guest_connecting', `Guest ${guestId} connecting`, guestId);
      return g;
    },
    markConnected(guestId) {
      const g = patch(guestId, 'connected', { connectedAt: now() });
      emit('guest_connected', `Guest ${guestId} connected`, guestId);
      return g;
    },
    moveToWaiting(guestId) {
      const g = patch(guestId, 'waiting');
      emit('guest_waiting', `Guest ${guestId} moved to green room`, guestId);
      return g;
    },
    approveGuest(guestId, producerId = 'producer') {
      const g = patch(guestId, 'waiting', { producerApproved: true, approvedAt: now() });
      emit('guest_approved', `Guest ${guestId} approved`, guestId, { producerId });
      return g;
    },
    makeGuestLive(guestId) {
      const g0 = requireGuest(guestId);
      if (!g0.producerApproved && greenRoom().producerApprovalRequired)
        throw new Error(`Guest ${guestId} requires producer approval`);
      const g = patch(guestId, 'live', { liveAt: now() });
      api.updateTally(guestId, 'program');
      emit('guest_live', `Guest ${guestId} live`, guestId);
      return g;
    },
    disconnectGuest(guestId) {
      const g = patch(guestId, 'disconnected', { disconnectedAt: now() });
      api.updateTally(guestId, 'off');
      emit('guest_disconnected', `Guest ${guestId} disconnected`, guestId);
      return g;
    },
    sendProducerMessage(message) {
      const m = Object.freeze({
        id: message.id ?? eid('producer-message'),
        ...(message.guestId ? { guestId: message.guestId } : {}),
        kind: message.kind,
        body: message.body,
        sentAt: now(),
        fromProducerId: message.fromProducerId,
        delivered: true,
        metadata: clone(message.metadata),
      });
      messages = [m, ...messages];
      emit('producer_message_sent', `Producer message sent`, message.guestId, {
        kind: message.kind,
      });
      return m;
    },
    updateTally(guestId, state, metadata = {}) {
      requireGuest(guestId);
      const switchSnapshot = input.productionSwitcher?.getSnapshot();
      const t = createTallyState({
        guestId,
        state,
        ...(switchSnapshot?.previewSceneId
          ? { previewSceneId: switchSnapshot.previewSceneId }
          : {}),
        ...(switchSnapshot?.programSceneId
          ? { programSceneId: switchSnapshot.programSceneId }
          : {}),
        metadata,
      });
      tallies.set(guestId, t);
      emit('tally_updated', `Tally for ${guestId} is ${state}`, guestId, metadata);
      return t;
    },
    configureIFB(guestId, patchIfb) {
      requireGuest(guestId);
      const next = createIFBState({ ...ifbs.get(guestId), ...patchIfb, guestId });
      ifbs.set(guestId, next);
      emit('ifb_updated', `IFB updated for ${guestId}`, guestId, {
        mode: next.mode,
        enabled: next.enabled,
      });
      return next;
    },
    integrateGuest(guestId, integration = {}) {
      const g = requireGuest(guestId);
      const compositor = integration.compositor ?? input.compositors?.[0];
      const audioMixer = integration.audioMixer ?? input.audioMixer;
      const sceneLayerId = `remote-guest:${guestId}`;
      if (compositor) {
        const layer: RenderLayer = createRenderLayer({
          id: sceneLayerId,
          label: g.metadata.displayName ?? guestId,
          source: {
            type: 'video',
            sourceId: guestId,
            label: 'Remote guest video placeholder',
            metadata: { remoteGuest: true, backendIndependent: true },
          },
          zIndex: integration.zIndex ?? 100,
          metadata: { guestId, remoteProduction: true },
        });
        compositor.addLayer(layer);
      }
      const audioChannelId = `remote-guest-audio:${guestId}`;
      if (audioMixer)
        audioMixer.addChannel({
          id: audioChannelId,
          label: g.metadata.displayName ?? guestId,
          buffer: new RingAudioBuffer(8),
          controls: { gain: 1, mute: false, solo: false, pan: 0 },
        });
      const next = put(Object.freeze({ ...g, sceneLayerId, audioChannelId, updatedAt: now() }));
      emit('guest_integrated', `Guest ${guestId} integrated with production workflow`, guestId, {
        compositorId: compositor?.id,
        audioMixerId: audioMixer?.id,
        previewOutputId: input.previewOutput?.id,
        programOutputId: input.programOutput?.id,
        productionSwitcherId: input.productionSwitcher?.id,
      });
      return next;
    },
    getGuest: (guestId) => guests.get(guestId),
    getSnapshot() {
      return Object.freeze({
        id,
        greenRoom: greenRoom(),
        guests: Object.freeze([...guests.values()]),
        producerMessages: Object.freeze([...messages]),
        tallyStates: Object.freeze([...tallies.values()]),
        ifbStates: Object.freeze([...ifbs.values()]),
        integration: Object.freeze({
          compositorIds: Object.freeze(input.compositors?.map((c) => c.id) ?? []),
          ...(input.audioMixer?.id ? { audioMixerId: input.audioMixer.id } : {}),
          ...(input.previewOutput?.id ? { previewOutputId: input.previewOutput.id } : {}),
          ...(input.programOutput?.id ? { programOutputId: input.programOutput.id } : {}),
          ...(input.productionSwitcher?.id
            ? { productionSwitcherId: input.productionSwitcher.id }
            : {}),
        }),
        events: Object.freeze([...events]),
        backend: Object.freeze({
          mode: 'metadata_only',
          webrtcTransport: false,
          signaling: false,
          screenSharing: false,
          guestRecording: false,
          chat: false,
        }),
        containsRuntimeHandles: false,
        containsMediaPayloads: false,
      });
    },
    getRuntimeEvents: () => Object.freeze([...events]),
    onRuntimeEvent(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
  emit('manager_created', 'Remote production manager created');
  return api;
}

export async function createDemoGuestWorkflow(
  input: Parameters<typeof createRemoteProductionManager>[0] = {},
) {
  const manager = createRemoteProductionManager({ id: 'remote-production:demo', ...input });
  const guest = manager.inviteGuest({
    guestId: 'guest:demo',
    displayName: 'Demo Guest',
    role: 'Correspondent',
    location: 'Remote',
  });
  manager.markConnecting(guest.id);
  manager.markConnected(guest.id);
  manager.updateGuestMetadata(guest.id, {
    cameraStatus: 'enabled',
    microphoneStatus: 'enabled',
    networkQuality: 'good',
  });
  manager.moveToWaiting(guest.id);
  manager.sendProducerMessage({
    guestId: guest.id,
    kind: 'instruction',
    body: 'Stand by for cue.',
    fromProducerId: 'producer:demo',
    metadata: { demo: true },
  });
  manager.approveGuest(guest.id, 'producer:demo');
  manager.integrateGuest(guest.id);
  manager.configureIFB(guest.id, { enabled: true, mode: 'producer_only', producerTalkback: true });
  const live = manager.makeGuestLive(guest.id);
  return {
    manager,
    guest: live,
    snapshot: manager.getSnapshot(),
    events: manager.getRuntimeEvents(),
  };
}
