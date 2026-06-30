import type { WebRtcSignalPayload, WebRtcSignalRole } from '@ubos/shared';

export const webRtcIceServers: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  // TODO: Add workspace-scoped TURN credentials for reliable NAT traversal.
];

export type WebRtcSignalType =
  | 'webrtc:offer'
  | 'webrtc:answer'
  | 'webrtc:iceCandidate'
  | 'webrtc:connectionStateChanged'
  | 'webrtc:trackStarted'
  | 'webrtc:trackStopped'
  | 'webrtc:error';

export async function emitWebRtcSignal(input: {
  workspaceId: string;
  broadcastId: string;
  guestId: string;
  senderRole: WebRtcSignalRole;
  targetRole: WebRtcSignalRole;
  eventType: WebRtcSignalType;
  payload?: WebRtcSignalPayload;
}) {
  await fetch('/api/realtime-proxy', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      workspaceId: input.workspaceId,
      broadcastId: input.broadcastId,
      entityType: 'webrtc',
      entityId: input.guestId,
      eventType: input.eventType,
      payload: {
        guestId: input.guestId,
        senderRole: input.senderRole,
        targetRole: input.targetRole,
        timestamp: new Date().toISOString(),
        ...(input.payload ?? {}),
      },
    }),
  }).catch(() => undefined);
}

export function isBrowserWebRtcAvailable() {
  return typeof window !== 'undefined' && 'RTCPeerConnection' in window;
}
