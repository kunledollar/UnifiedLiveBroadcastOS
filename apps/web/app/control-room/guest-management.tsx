'use client';

import { Badge, Panel } from '@ubos/ui';
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
    <video ref={videoRef} autoPlay playsInline className="aspect-video w-full rounded-xl border border-emerald-300/20 bg-slate-900 object-cover" />
  ) : (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-900 text-xs text-slate-500">No media connected</div>
  );
}

function actionButton(label: string, action: () => void, danger = false) {
  return (
    <button
      className={`rounded-lg px-2 py-1 text-[11px] font-bold ${danger ? 'bg-rose-500/80 text-white hover:bg-rose-500' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'}`}
      onClick={action}
      type="button"
    >
      {label}
    </button>
  );
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
      [guestId]: { ...(current[guestId] ?? {}), connectionState: 'closed', remoteStream: undefined },
    }));
  }, []);

  const handleRealtimeEvent = useCallback((event: BroadcastRealtimeEvent) => {
    if (event.entityType === 'webrtc') {
      const guestId = event.entityId;
      if (!guestId) return;
      const payload = event.payload as { senderRole?: string; targetRole?: string; description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit; connectionState?: RTCPeerConnectionState };
      if (payload.targetRole !== 'host' || payload.senderRole !== 'guest') return;
      if (event.eventType === 'webrtc:offer' && payload.description) {
        const existing = peerConnections.current[guestId];
        existing?.close();
        const peer = new RTCPeerConnection({ iceServers: webRtcIceServers });
        peerConnections.current[guestId] = peer;
        const remoteStream = new MediaStream();
        setMediaIndicators((current) => ({ ...current, [guestId]: { ...(current[guestId] ?? {}), remoteStream, connectionState: peer.connectionState } }));
        peer.ontrack = (trackEvent) => {
          trackEvent.streams[0]?.getTracks().forEach((track) => remoteStream.addTrack(track));
          setMediaIndicators((current) => ({ ...current, [guestId]: { ...(current[guestId] ?? {}), remoteStream } }));
        };
        peer.onicecandidate = (candidateEvent) => {
          if (candidateEvent.candidate) void emitWebRtcSignal({ workspaceId: event.workspaceId, broadcastId: event.broadcastId, guestId, senderRole: 'host', targetRole: 'guest', eventType: 'webrtc:iceCandidate', payload: { candidate: candidateEvent.candidate.toJSON() } });
        };
        peer.onconnectionstatechange = () => {
          setMediaIndicators((current) => ({ ...current, [guestId]: { ...(current[guestId] ?? {}), connectionState: peer.connectionState } }));
          void emitWebRtcSignal({ workspaceId: event.workspaceId, broadcastId: event.broadcastId, guestId, senderRole: 'host', targetRole: 'guest', eventType: 'webrtc:connectionStateChanged', payload: { connectionState: peer.connectionState } });
        };
        void peer.setRemoteDescription(payload.description)
          .then(() => peer.createAnswer())
          .then((answer) => peer.setLocalDescription(answer).then(() => answer))
          .then((answer) => emitWebRtcSignal({ workspaceId: event.workspaceId, broadcastId: event.broadcastId, guestId, senderRole: 'host', targetRole: 'guest', eventType: 'webrtc:answer', payload: { description: answer } }))
          .catch((error: unknown) => emitWebRtcSignal({ workspaceId: event.workspaceId, broadcastId: event.broadcastId, guestId, senderRole: 'host', targetRole: 'guest', eventType: 'webrtc:error', payload: { message: error instanceof Error ? error.message : 'Failed to answer offer' } }));
      }
      if (event.eventType === 'webrtc:iceCandidate' && payload.candidate) {
        void peerConnections.current[guestId]?.addIceCandidate(payload.candidate).catch(() => undefined);
      }
      if (event.eventType === 'webrtc:connectionStateChanged' && payload.connectionState) {
        setMediaIndicators((current) => ({ ...current, [guestId]: { ...(current[guestId] ?? {}), connectionState: payload.connectionState } }));
      }
      return;
    }
    if (!event.eventType.startsWith('guest:')) return;
    const guestKey = event.entityId ?? 'green-room-device';
    if (event.eventType === 'guest:removed' || event.eventType === 'guest:rejected' || event.eventType === 'guest:left') closeGuestPeer(guestKey);
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
  }, [closeGuestPeer]);
  useEffect(() => () => { Object.values(peerConnections.current).forEach((peer) => peer.close()); peerConnections.current = {}; }, []);
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
        className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-slate-950/50 p-3"
      >
        <input type="hidden" name="broadcastId" value={broadcastId} />
        <input
          name="displayName"
          className="w-full rounded-xl border border-white/10 bg-slate-800 p-2 text-sm"
          placeholder="Guest invite name"
        />
        <button
          className="w-full rounded-xl bg-cyan-400 px-3 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300"
          type="submit"
        >
          Generate Invite
        </button>
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-slate-900 p-2 text-xs"
          >
            <span className="truncate font-mono text-cyan-200">/guest?token={invite.token}</span>
            <button
              formAction={() =>
                startTransition(async () => {
                  await revokeInvite(invite.id);
                })
              }
              className="text-rose-300 hover:text-rose-200"
            >
              Revoke
            </button>
          </div>
        ))}
      </form>
      <div className="space-y-3">
        {guests.map((guest) => {
          const indicators =
            mediaIndicators[guest.id] ?? mediaIndicators['green-room-device'] ?? {};
          return (
            <div key={guest.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${guest.status === GuestStatus.OnAir ? 'animate-pulse bg-emerald-300' : 'bg-slate-500'}`}
                      title="Speaker activity placeholder"
                    />
                    <p className="font-semibold text-white">{guest.displayName}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{guest.role} · private chat ready</p>
                </div>
                <Badge tone={tones[guest.status]}>{labels[guest.status]}</Badge>
              </div>
              <div className="mt-3"><GuestRemotePreview stream={indicators.remoteStream} /></div>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                <Badge
                  tone={
                    indicators.cameraReady && indicators.cameraEnabled !== false
                      ? 'success'
                      : 'neutral'
                  }
                >
                  Cam{' '}
                  {indicators.cameraEnabled === false
                    ? 'Off'
                    : indicators.cameraReady
                      ? 'Ready'
                      : '—'}
                </Badge>
                <Badge
                  tone={
                    indicators.microphoneReady && indicators.microphoneEnabled !== false
                      ? 'success'
                      : 'neutral'
                  }
                >
                  Mic{' '}
                  {indicators.microphoneEnabled === false
                    ? 'Muted'
                    : indicators.microphoneReady
                      ? 'Ready'
                      : '—'}
                </Badge>
                <Badge tone={indicators.screenShareEnabled ? 'success' : 'neutral'}>
                  Screen {indicators.screenShareEnabled ? 'Ready' : '—'}
                </Badge>
                <Badge tone={indicators.connectionState === 'connected' ? 'success' : indicators.connectionState === 'failed' || indicators.connectionState === 'closed' ? 'danger' : indicators.connectionState ? 'warning' : 'neutral'}>
                  WebRTC {indicators.connectionState ?? 'no media'}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {actionButton('Admit', () =>
                  startTransition(async () => {
                    await admitGuest(guest.id);
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
                {actionButton(guest.isMuted ? 'Unmute' : 'Mute', () =>
                  startTransition(async () => {
                    await muteGuest(guest.id);
                  }),
                )}
                {actionButton(
                  'Remove',
                  () =>
                    startTransition(async () => {
                      await removeGuest(guest.id);
                    }),
                  true,
                )}
                {actionButton('Spotlight', () =>
                  startTransition(async () => {
                    await spotlightGuest(guest.id);
                  }),
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
                {actionButton('Chat', () =>
                  window.alert(`Private chat with ${guest.displayName} is stubbed for Phase 3.4.`),
                )}
              </div>
            </div>
          );
        })}
        {guests.length === 0 ? (
          <p className="text-sm text-slate-400">
            Generate an invite to add the first live guest card.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}
