'use client';

import {
  AssetList,
  AssetRow,
  BroadcastButton,
  StatusBadge,
} from '@ubos/ui';
import { GuestStatus, createGuestRuntimeState, createGuestRuntimeSession, type Guest, type GuestInvite, type MediaRoute } from '@ubos/shared';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useBroadcastRealtime } from '../../../lib/realtime';
import type { BroadcastRealtimeEvent } from '@ubos/shared';
import { emitWebRtcSignal, webRtcIceServers } from '../../../lib/webrtc-signaling';
import {
  admitGuest,
  inviteGuest,
  muteGuest,
  removeGuest,
  revokeInvite,
} from '../guest-actions';
import {
  setOnProgramRoute,
  setOnVerticalRoute,
  setRouteMuted,
  setRoutePinned,
} from '../media-route-actions';
import { CompactOpsActions, OperationsPanel } from './OperationsChrome';
import { SceneThumbnail } from '../browsers/BrowserChrome';

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

function guestConnectionVariant(status: GuestStatus) {
  const label = connectionLabel(status);
  if (label === 'Connected') return 'success' as const;
  if (label === 'Connecting') return 'warning' as const;
  return 'offline' as const;
}

function deriveGuestMediaState(
  guest: Guest,
  indicators: GuestMediaIndicators,
) {
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

  let cameraStatus = cameraOn ? 'Ready' : connected ? 'Unavailable' : 'Offline';
  let micStatus = micLive ? 'Ready' : guest.isMuted ? 'Muted' : connected ? 'Unavailable' : 'Offline';

  if (guest.status === GuestStatus.Invited || guest.status === GuestStatus.Waiting) {
    cameraStatus = 'Waiting for camera';
  }
  if (guest.status === GuestStatus.Disconnected) {
    cameraStatus = 'Offline';
    micStatus = 'Offline';
  }

  return { cameraStatus, micStatus, screenActive, connected };
}

export function GuestsPanel({
  guests,
  invites,
  broadcastId,
  routes = [],
}: {
  guests: Guest[];
  invites: GuestInvite[];
  broadcastId: string;
  routes?: MediaRoute[];
}) {
  const [isPending, startTransition] = useTransition();
  const [mediaIndicators, setMediaIndicators] = useState<Record<string, GuestMediaIndicators>>({});
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});
  const routesByGuest = new Map(
    routes.filter((route) => route.guestId).map((route) => [route.guestId!, route]),
  );
  const guestRuntimeState = createGuestRuntimeState({
    sessions: Object.fromEntries(
      guests.map((guest) => [
        guest.id,
        createGuestRuntimeSession({
          id: guest.id,
          displayName: guest.displayName,
          connectionState: connectionLabel(guest.status).toLowerCase() === 'connected' ? 'connected' : guest.status === GuestStatus.Invited ? 'invited' : guest.status === GuestStatus.Disconnected ? 'disconnected' : 'waiting',
          muted: Boolean(guest.isMuted),
        }),
      ]),
    ),
  });

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
    <div className="space-y-ubos-3">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-4 text-sm text-cyan-50">
        <div className="font-semibold">WebRTC runtime health</div>
        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <span>{guestRuntimeState.invitedGuestIds.length} invited</span>
          <span>{guestRuntimeState.waitingGuestIds.length} waiting</span>
          <span>{guestRuntimeState.connectedGuestIds.length} connected</span>
          <span>{guestRuntimeState.disconnectedGuestIds.length} disconnected</span>
        </div>
        <p className="mt-2 text-cyan-200">WebRTC runtime unavailable · Guest transport not connected · Media stream unavailable · Metadata only</p>
      </div>
    <OperationsPanel
      title="Guests"
      action={
        <span className="text-ubos-metadata text-ubos-fg-muted">
          {isPending ? 'Updating…' : `${guests.length} connected`}
        </span>
      }
    >
      <form
        action={(formData) =>
          startTransition(async () => {
            await inviteGuest(formData);
          })
        }
        className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight p-ubos-2"
      >
        <input type="hidden" name="broadcastId" value={broadcastId} />
        <div className="flex items-center gap-ubos-2">
          <input
            name="displayName"
            className="min-w-0 flex-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-ubos-2 py-1.5 text-ubos-caption text-ubos-fg-primary placeholder:text-ubos-fg-muted"
            placeholder="Invite link name"
          />
          <BroadcastButton type="submit" size="sm" variant="primary">
            Invite
          </BroadcastButton>
        </div>
        {invites.length ? (
          <div className="mt-ubos-2 space-y-1">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-ubos-2 rounded-ubos-sm bg-ubos-carbon px-ubos-2 py-1 text-ubos-metadata"
              >
                <span className="ubos-truncate font-mono text-ubos-fg-secondary">
                  /guest?token={invite.token}
                </span>
                <BroadcastButton
                  size="sm"
                  variant="danger"
                  formAction={() =>
                    startTransition(async () => {
                      await revokeInvite(invite.id);
                    })
                  }
                >
                  Revoke
                </BroadcastButton>
              </div>
            ))}
          </div>
        ) : null}
      </form>

      <AssetList isEmpty={guests.length === 0} emptyMessage="No guests connected">
        {guests.map((guest) => {
          const indicators =
            mediaIndicators[guest.id] ?? mediaIndicators['green-room-device'] ?? {};
          const route = routesByGuest.get(guest.id);
          const media = deriveGuestMediaState(guest, indicators);
          const onVertical = route?.metadata?.onVertical === true;
          const slotLabel = route?.layoutSlot ? `Slot ${route.layoutSlot}` : null;

          return (
            <AssetRow
              key={guest.id}
              thumbnail={<SceneThumbnail label={guest.displayName.slice(0, 3).toUpperCase()} />}
              title={guest.displayName}
              subtitle={`${labels[guest.status]} · CAM ${media.cameraStatus} · MIC ${media.micStatus}${slotLabel ? ` · ${slotLabel}` : ''}`}
              status={
                <div className="flex flex-col items-end gap-0.5">
                  <StatusBadge variant={guestConnectionVariant(guest.status)}>
                    {connectionLabel(guest.status)}
                  </StatusBadge>
                  {route?.isOnProgram ? <StatusBadge variant="live">PROGRAM</StatusBadge> : null}
                  {guest.isSpotlighted ? <StatusBadge variant="preview">PREVIEW</StatusBadge> : null}
                  {onVertical ? <StatusBadge variant="warning">VERTICAL</StatusBadge> : null}
                  {media.screenActive ? <StatusBadge variant="neutral">Screen</StatusBadge> : null}
                </div>
              }
              action={
                <CompactOpsActions>
                  <BroadcastButton
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      startTransition(async () => {
                        await admitGuest(guest.id);
                      })
                    }
                  >
                    Admit
                  </BroadcastButton>
                  {route ? (
                    <BroadcastButton
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        startTransition(async () => {
                          await setOnProgramRoute(route.id);
                        })
                      }
                    >
                      Program
                    </BroadcastButton>
                  ) : null}
                  {route ? (
                    <BroadcastButton
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        startTransition(async () => {
                          await setOnVerticalRoute(route.id);
                        })
                      }
                    >
                      Vertical
                    </BroadcastButton>
                  ) : null}
                  {route ? (
                    <BroadcastButton
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        startTransition(async () => {
                          await setRoutePinned(route.id);
                        })
                      }
                    >
                      {route.isPinned ? 'Unpin' : 'Pin'}
                    </BroadcastButton>
                  ) : null}
                  <BroadcastButton
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      startTransition(async () => {
                        await muteGuest(guest.id);
                      })
                    }
                  >
                    {guest.isMuted ? 'Unmute' : 'Mute'}
                  </BroadcastButton>
                  <BroadcastButton
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      startTransition(async () => {
                        await removeGuest(guest.id);
                      })
                    }
                  >
                    Remove
                  </BroadcastButton>
                </CompactOpsActions>
              }
            />
          );
        })}
      </AssetList>

      {guests.length === 0 && invites.length === 0 ? (
        <p className="text-ubos-metadata text-ubos-fg-muted">
          Guest invited, waiting for camera — generate an invite to add the first guest channel.
        </p>
      ) : null}
    </OperationsPanel>
    </div>
  );
}

/** @deprecated Use GuestsPanel — kept for backward compatibility */
export const GuestManagement = GuestsPanel;
