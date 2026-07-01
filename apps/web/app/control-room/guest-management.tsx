'use client';

import { Badge, Panel, TallyBadge, TallyBorder, type TallyState } from '@ubos/ui';
import { GuestStatus, type Guest, type GuestInvite } from '@ubos/shared';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useBroadcastRealtime } from '../../lib/realtime';
import type { BroadcastRealtimeEvent } from '@ubos/shared';
import { emitWebRtcSignal, webRtcIceServers } from '../../lib/webrtc-signaling';
import {
  admitGuest,
  inviteGuest,
  muteGuest,
  reconnectGuest,
  rejectGuest,
  removeGuest,
  renameGuest,
  revokeInvite,
  spotlightGuest,
} from './guest-actions';

const labels: Record<GuestStatus, string> = {
  invited: 'Invited',
  waiting: 'Waiting',
  green_room: 'Green Room',
  connected: 'Connected',
  on_air: 'On Air',
  muted: 'Muted',
  disconnected: 'Disconnected',
  reconnecting: 'Reconnecting',
  rejected: 'Rejected',
  removed: 'Removed',
};
type GuestMediaIndicators = {
  connectionState?: RTCPeerConnectionState | undefined;
  remoteStream?: MediaStream | undefined;
  cameraReady?: boolean;
  microphoneReady?: boolean;
  screenShareEnabled?: boolean;
  cameraEnabled?: boolean;
  microphoneEnabled?: boolean;
};

const tones: Record<GuestStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'live'> = {
  invited: 'neutral',
  waiting: 'warning',
  green_room: 'warning',
  connected: 'success',
  on_air: 'live',
  muted: 'warning',
  disconnected: 'danger',
  reconnecting: 'warning',
  rejected: 'danger',
  removed: 'danger',
};

function GuestRemotePreview({ stream }: { stream?: MediaStream | undefined }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream ?? null;
    if (stream) void video.play().catch(() => undefined);
  }, [stream]);
  return stream ? (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="aspect-video h-full w-full rounded-md border border-emerald-300/20 bg-slate-950 object-cover"
    />
  ) : (
    <div className="flex aspect-video h-full w-full flex-col items-center justify-center rounded-md border border-white/10 bg-slate-950/80 text-center">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
        Waiting for Camera
      </span>
      <span className="mt-1 text-[10px] text-slate-500">Guest has not enabled video.</span>
    </div>
  );
}

function actionButton(label: string, action: () => void, danger = false, active = false) {
  return (
    <button
      className={`h-7 rounded-md border px-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${
        danger
          ? 'border-rose-400/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25'
          : active
            ? 'border-cyan-300/40 bg-cyan-300/20 text-cyan-50 hover:bg-cyan-300/30'
            : 'border-white/10 bg-slate-900 text-slate-200 hover:border-white/20 hover:bg-slate-800'
      }`}
      onClick={action}
      type="button"
    >
      {label}
    </button>
  );
}

function statusPill(label: string, active: boolean, title: string, activeClass = 'bg-emerald-300') {
  return (
    <span
      className="inline-flex h-6 min-w-11 items-center justify-center gap-1 rounded-md border border-white/10 bg-slate-950 px-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-300"
      title={title}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? activeClass : 'bg-slate-600'}`} />
      {label}
    </span>
  );
}

function connectionLabel(status: GuestStatus) {
  if (
    status === GuestStatus.Connected ||
    status === GuestStatus.OnAir ||
    status === GuestStatus.Muted
  )
    return 'Connected';
  if (
    status === GuestStatus.GreenRoom ||
    status === GuestStatus.Waiting ||
    status === GuestStatus.Reconnecting ||
    status === GuestStatus.Invited
  )
    return 'Connecting';
  return 'Disconnected';
}

export function GuestManagement({
  guests,
  invites,
  broadcastId,
}: {
  guests: Guest[];
  invites: GuestInvite[];
  broadcastId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [mediaIndicators, setMediaIndicators] = useState<Record<string, GuestMediaIndicators>>({});
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const closeGuestPeer = useCallback((guestId: string) => {
    peerConnections.current[guestId]?.close();
    delete peerConnections.current[guestId];
    setMediaIndicators((current) => ({
      ...current,
      [guestId]: {
        ...(current[guestId] ?? {}),
        connectionState: 'closed',
        remoteStream: undefined,
      },
    }));
  }, []);

  const handleRealtimeEvent = useCallback(
    (event: BroadcastRealtimeEvent) => {
      if (event.entityType === 'webrtc') {
        const guestId = event.entityId;
        if (!guestId) return;
        const payload = event.payload as {
          senderRole?: string;
          targetRole?: string;
          description?: RTCSessionDescriptionInit;
          candidate?: RTCIceCandidateInit;
          connectionState?: RTCPeerConnectionState;
        };
        if (payload.targetRole !== 'host' || payload.senderRole !== 'guest') return;
        if (event.eventType === 'webrtc:offer' && payload.description) {
          const existing = peerConnections.current[guestId];
          existing?.close();
          const peer = new RTCPeerConnection({ iceServers: webRtcIceServers });
          peerConnections.current[guestId] = peer;
          const remoteStream = new MediaStream();
          setMediaIndicators((current) => ({
            ...current,
            [guestId]: {
              ...(current[guestId] ?? {}),
              remoteStream,
              connectionState: peer.connectionState,
            },
          }));
          peer.ontrack = (trackEvent) => {
            trackEvent.streams[0]?.getTracks().forEach((track) => remoteStream.addTrack(track));
            setMediaIndicators((current) => ({
              ...current,
              [guestId]: { ...(current[guestId] ?? {}), remoteStream },
            }));
          };
          peer.onicecandidate = (candidateEvent) => {
            if (candidateEvent.candidate)
              void emitWebRtcSignal({
                workspaceId: event.workspaceId,
                broadcastId: event.broadcastId,
                guestId,
                senderRole: 'host',
                targetRole: 'guest',
                eventType: 'webrtc:iceCandidate',
                payload: { candidate: candidateEvent.candidate.toJSON() },
              });
          };
          peer.onconnectionstatechange = () => {
            setMediaIndicators((current) => ({
              ...current,
              [guestId]: { ...(current[guestId] ?? {}), connectionState: peer.connectionState },
            }));
            void emitWebRtcSignal({
              workspaceId: event.workspaceId,
              broadcastId: event.broadcastId,
              guestId,
              senderRole: 'host',
              targetRole: 'guest',
              eventType: 'webrtc:connectionStateChanged',
              payload: { connectionState: peer.connectionState },
            });
          };
          void peer
            .setRemoteDescription(payload.description)
            .then(() => peer.createAnswer())
            .then((answer) => peer.setLocalDescription(answer).then(() => answer))
            .then((answer) =>
              emitWebRtcSignal({
                workspaceId: event.workspaceId,
                broadcastId: event.broadcastId,
                guestId,
                senderRole: 'host',
                targetRole: 'guest',
                eventType: 'webrtc:answer',
                payload: { description: answer },
              }),
            )
            .catch((error: unknown) =>
              emitWebRtcSignal({
                workspaceId: event.workspaceId,
                broadcastId: event.broadcastId,
                guestId,
                senderRole: 'host',
                targetRole: 'guest',
                eventType: 'webrtc:error',
                payload: {
                  message: error instanceof Error ? error.message : 'Failed to answer offer',
                },
              }),
            );
        }
        if (event.eventType === 'webrtc:iceCandidate' && payload.candidate) {
          void peerConnections.current[guestId]
            ?.addIceCandidate(payload.candidate)
            .catch(() => undefined);
        }
        if (event.eventType === 'webrtc:connectionStateChanged' && payload.connectionState) {
          setMediaIndicators((current) => ({
            ...current,
            [guestId]: { ...(current[guestId] ?? {}), connectionState: payload.connectionState },
          }));
        }
        return;
      }
      if (!event.eventType.startsWith('guest:')) return;
      const guestKey = event.entityId ?? 'green-room-device';
      if (
        event.eventType === 'guest:removed' ||
        event.eventType === 'guest:rejected' ||
        event.eventType === 'guest:left'
      )
        closeGuestPeer(guestKey);
      setMediaIndicators((current) => {
        const previous = current[guestKey] ?? {};
        if (event.eventType === 'guest:mediaReady')
          return {
            ...current,
            [guestKey]: {
              ...previous,
              cameraReady: Boolean(event.payload.cameraReady),
              microphoneReady: Boolean(event.payload.microphoneReady),
            },
          };
        if (event.eventType === 'guest:cameraToggled')
          return {
            ...current,
            [guestKey]: { ...previous, cameraEnabled: Boolean(event.payload.enabled) },
          };
        if (event.eventType === 'guest:microphoneToggled')
          return {
            ...current,
            [guestKey]: { ...previous, microphoneEnabled: Boolean(event.payload.enabled) },
          };
        if (event.eventType === 'guest:screenShareStarted')
          return { ...current, [guestKey]: { ...previous, screenShareEnabled: true } };
        if (event.eventType === 'guest:screenShareStopped')
          return { ...current, [guestKey]: { ...previous, screenShareEnabled: false } };
        return current;
      });
    },
    [closeGuestPeer],
  );
  useEffect(
    () => () => {
      Object.values(peerConnections.current).forEach((peer) => peer.close());
      peerConnections.current = {};
    },
    [],
  );
  useBroadcastRealtime({ workspaceId: 'demo-workspace', broadcastId }, handleRealtimeEvent);
  return (
    <Panel
      title="Guests"
      action={
        <span className="text-xs text-slate-400">
          {isPending ? 'Updating…' : `${guests.length} live records`}
        </span>
      }
    >
      <form
        action={(formData) =>
          startTransition(async () => {
            await inviteGuest(formData);
          })
        }
        className="mb-3 rounded-lg border border-white/10 bg-slate-950/70 p-2"
      >
        <input type="hidden" name="broadcastId" value={broadcastId} />
        <div className="flex items-center gap-2">
          <input
            name="displayName"
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 placeholder:text-slate-500"
            placeholder="Invite link name"
          />
          <button
            className="h-8 rounded-md bg-cyan-300 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-950 hover:bg-cyan-200"
            type="submit"
          >
            Generate Invite
          </button>
        </div>
        {invites.length > 0 ? (
          <div className="mt-2 grid gap-1">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-slate-900/70 px-2 py-1 text-[10px]"
              >
                <span className="truncate font-mono text-cyan-200">
                  /guest?token={invite.token}
                </span>
                <button
                  formAction={() =>
                    startTransition(async () => {
                      await revokeInvite(invite.id);
                    })
                  }
                  className="font-bold uppercase tracking-[0.08em] text-rose-300 hover:text-rose-200"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </form>
      <div className="space-y-2">
        {guests.map((guest) => {
          const indicators =
            mediaIndicators[guest.id] ?? mediaIndicators['green-room-device'] ?? {};
          const connected = connectionLabel(guest.status) === 'Connected';
          const cameraOn = Boolean(
            (indicators.cameraReady ||
              indicators.remoteStream?.getVideoTracks().some((track) => track.enabled)) &&
            indicators.cameraEnabled !== false,
          );
          const micLive = Boolean(
            (indicators.microphoneReady ||
              indicators.remoteStream?.getAudioTracks().some((track) => track.enabled)) &&
            indicators.microphoneEnabled !== false &&
            !guest.isMuted,
          );
          const screenActive = Boolean(indicators.screenShareEnabled);
          const speaking = guest.status === GuestStatus.OnAir || micLive;
          const tallyState: TallyState =
            guest.status === GuestStatus.OnAir
              ? 'program'
              : guest.isSpotlighted
                ? 'preview'
                : 'idle';
          return (
            <TallyBorder
              key={guest.id}
              state={tallyState}
              className={`rounded-lg border border-white/10 p-2 transition ${speaking ? 'shadow-[0_0_0_1px_rgba(16,185,129,0.28),0_0_18px_rgba(16,185,129,0.08)]' : ''}`}
            >
              <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                <GuestRemotePreview stream={indicators.remoteStream} />
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-300' : connectionLabel(guest.status) === 'Connecting' ? 'animate-pulse bg-amber-300' : 'bg-rose-400'}`}
                        title={connectionLabel(guest.status)}
                      />
                      <p className="truncate text-sm font-semibold text-white">
                        {guest.displayName}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <TallyBadge state={tallyState} />
                      <Badge tone={tones[guest.status]}>{labels[guest.status]}</Badge>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {statusPill('CAM', cameraOn, cameraOn ? 'Camera on' : 'Camera off')}
                    {statusPill(
                      'MIC',
                      micLive,
                      micLive ? 'Microphone live' : 'Microphone muted',
                      speaking ? 'animate-pulse bg-cyan-300' : 'bg-emerald-300',
                    )}
                    {statusPill(
                      'SCR',
                      screenActive,
                      screenActive ? 'Screen share active' : 'Screen share inactive',
                      'bg-violet-300',
                    )}
                    <span className="ml-auto hidden text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:inline">
                      {guest.role}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1 lg:grid-cols-8">
                    {actionButton('Admit', () =>
                      startTransition(async () => {
                        await admitGuest(guest.id);
                      }),
                    )}
                    {actionButton(guest.isMuted ? 'Unmute' : 'Mute', () =>
                      startTransition(async () => {
                        await muteGuest(guest.id);
                      }),
                    )}
                    {actionButton('Chat', () =>
                      window.alert(
                        `Private chat with ${guest.displayName} is stubbed for Phase 3.4.`,
                      ),
                    )}
                    {actionButton(
                      'Spot',
                      () =>
                        startTransition(async () => {
                          await spotlightGuest(guest.id);
                        }),
                      false,
                      guest.isSpotlighted,
                    )}
                    {actionButton('Rename', () => {
                      const displayName = window.prompt('Rename guest', guest.displayName);
                      if (!displayName) return;
                      const formData = new FormData();
                      formData.set('guestId', guest.id);
                      formData.set('displayName', displayName);
                      startTransition(async () => {
                        await renameGuest(formData);
                      });
                    })}
                    {actionButton('Reconnect', () =>
                      startTransition(async () => {
                        await reconnectGuest(guest.id);
                      }),
                    )}
                    {actionButton(
                      'Reject',
                      () =>
                        startTransition(async () => {
                          await rejectGuest(guest.id);
                        }),
                      true,
                    )}
                    {actionButton(
                      'Remove',
                      () =>
                        startTransition(async () => {
                          await removeGuest(guest.id);
                        }),
                      true,
                    )}
                  </div>
                </div>
              </div>
            </TallyBorder>
          );
        })}
        {guests.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-slate-950/60 p-4 text-center text-sm text-slate-400">
            Generate an invite to add the first guest channel.
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
