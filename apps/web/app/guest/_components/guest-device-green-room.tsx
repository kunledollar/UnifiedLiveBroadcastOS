'use client';

import { Badge } from '@ubos/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useBroadcastRealtime } from '../../../lib/realtime';
import { useMediaCapture } from '../../../lib/media/use-media-capture';
import { emitWebRtcSignal, isBrowserWebRtcAvailable, webRtcIceServers } from '../../../lib/webrtc-signaling';
import { getGuestContextByToken } from '../../control-room/guest-actions';
import { GuestStatus, type BroadcastRealtimeEvent } from '@ubos/shared';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'live';

function StatusBadge({
  active,
  label,
  danger = false,
}: {
  active: boolean;
  label: string;
  danger?: boolean;
}) {
  const tone: Tone = danger ? 'danger' : active ? 'success' : 'neutral';
  return <Badge tone={tone}>{label}</Badge>;
}

function useMicLevel(stream: MediaStream | null) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    const audio = stream?.getAudioTracks().length ? stream : null;
    if (!audio) {
      setLevel(0);
      return;
    }
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    const source = context.createMediaStreamSource(audio);
    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    source.connect(analyser);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      setLevel(
        Math.min(100, Math.round(data.reduce((sum, value) => sum + value, 0) / data.length)),
      );
      frame = window.requestAnimationFrame(tick);
    };
    tick();
    return () => {
      window.cancelAnimationFrame(frame);
      void context.close();
    };
  }, [stream]);
  return level;
}

export function GuestDeviceGreenRoom({ token }: { token: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [guestContext, setGuestContext] = useState<{ workspaceId: string; broadcastId: string; guestId: string; status: GuestStatus } | null>(null);
  const [webrtcState, setWebrtcState] = useState<RTCPeerConnectionState>('new');
  const [hostConnected, setHostConnected] = useState(false);
  const handleRealtimeEvent = useCallback((event: BroadcastRealtimeEvent) => {
    if (!guestContext || event.entityId !== guestContext.guestId) return;
    if (event.entityType === 'guest') {
      if (event.eventType === 'guest:admitted') setGuestContext((current) => current ? { ...current, status: GuestStatus.Connected } : current);
      if (event.eventType === 'guest:removed' || event.eventType === 'guest:rejected' || event.eventType === 'guest:left') {
        peerRef.current?.close();
        peerRef.current = null;
        setWebrtcState('closed');
        setHostConnected(false);
      }
      return;
    }
    if (event.entityType !== 'webrtc') return;
    const payload = event.payload as { senderRole?: string; targetRole?: string; description?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit; connectionState?: RTCPeerConnectionState };
    if (payload.targetRole !== 'guest' || payload.senderRole !== 'host') return;
    if (event.eventType === 'webrtc:answer' && payload.description) {
      void peerRef.current?.setRemoteDescription(payload.description);
      setHostConnected(true);
    }
    if (event.eventType === 'webrtc:iceCandidate' && payload.candidate) {
      void peerRef.current?.addIceCandidate(payload.candidate).catch(() => undefined);
    }
    if (event.eventType === 'webrtc:connectionStateChanged' && payload.connectionState) {
      setHostConnected(payload.connectionState === 'connected' || payload.connectionState === 'connecting');
    }
  }, [guestContext]);
  const { status } = useBroadcastRealtime(guestContext ?? { workspaceId: 'demo-workspace', broadcastId: 'demo-broadcast' }, handleRealtimeEvent);
  const media = useMediaCapture();
  const micLevel = useMicLevel(media.stream);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void getGuestContextByToken(token).then((context) => {
      if (!cancelled) setGuestContext(context);
    });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!guestContext || guestContext.status !== GuestStatus.Connected || !media.stream || !isBrowserWebRtcAvailable()) return;
    if (peerRef.current) return;
    const peer = new RTCPeerConnection({ iceServers: webRtcIceServers });
    peerRef.current = peer;
    media.stream.getTracks().forEach((track) => {
      peer.addTrack(track, media.stream as MediaStream);
      void emitWebRtcSignal({ ...guestContext, guestId: guestContext.guestId, senderRole: 'guest', targetRole: 'host', eventType: 'webrtc:trackStarted', payload: { trackKind: track.kind as 'audio' | 'video' } });
    });
    peer.onicecandidate = (event) => {
      if (event.candidate) void emitWebRtcSignal({ ...guestContext, senderRole: 'guest', targetRole: 'host', eventType: 'webrtc:iceCandidate', payload: { candidate: event.candidate.toJSON() } });
    };
    peer.onconnectionstatechange = () => {
      setWebrtcState(peer.connectionState);
      setHostConnected(peer.connectionState === 'connected');
      void emitWebRtcSignal({ ...guestContext, senderRole: 'guest', targetRole: 'host', eventType: 'webrtc:connectionStateChanged', payload: { connectionState: peer.connectionState } });
    };
    void peer.createOffer()
      .then((offer) => peer.setLocalDescription(offer).then(() => offer))
      .then((offer) => emitWebRtcSignal({ ...guestContext, senderRole: 'guest', targetRole: 'host', eventType: 'webrtc:offer', payload: { description: offer } }))
      .catch((error: unknown) => emitWebRtcSignal({ ...guestContext, senderRole: 'guest', targetRole: 'host', eventType: 'webrtc:error', payload: { message: error instanceof Error ? error.message : 'Failed to create offer' } }));
    const cleanup = () => {
      media.stream?.getTracks().forEach((track) => void emitWebRtcSignal({ ...guestContext, senderRole: 'guest', targetRole: 'host', eventType: 'webrtc:trackStopped', payload: { trackKind: track.kind as 'audio' | 'video' } }));
      peer.close();
      peerRef.current = null;
      setWebrtcState('closed');
    };
    window.addEventListener('beforeunload', cleanup, { once: true });
    return () => { window.removeEventListener('beforeunload', cleanup); cleanup(); };
  }, [guestContext, media.stream]);

  const emit = useCallback(async (eventType: string, payload: Record<string, unknown> = {}) => {
    await fetch('/api/realtime-proxy', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        workspaceId: 'demo-workspace',
        broadcastId: 'demo-broadcast',
        entityType: 'guest',
        eventType,
        payload,
      }),
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = media.stream;
    if (media.stream) void video.play().catch(() => undefined);
  }, [media.stream]);
  useEffect(() => {
    if (media.cameraReady || media.microphoneReady)
      void emit('guest:mediaReady', {
        cameraReady: media.cameraReady,
        microphoneReady: media.microphoneReady,
      });
  }, [emit, media.cameraReady, media.microphoneReady]);

  const toggleCamera = async () => {
    const enabled = !media.preferences.cameraEnabled;
    media.updatePreferences({ cameraEnabled: enabled });
    media.stream?.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });
    if (enabled && !media.cameraReady) await media.startPreview();
    await emit('guest:cameraToggled', { enabled });
  };
  const toggleMic = async () => {
    const enabled = !media.preferences.microphoneEnabled;
    media.updatePreferences({ microphoneEnabled: enabled });
    media.stream?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
    if (enabled && !media.microphoneReady) await media.startPreview({ withAudio: true });
    await emit('guest:microphoneToggled', { enabled });
  };
  const testScreen = async () => {
    const stream = await media.startScreenShare();
    if (stream) {
      await emit('guest:screenShareStarted');
      stream
        .getVideoTracks()[0]
        ?.addEventListener('ended', () => void emit('guest:screenShareStopped'));
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="flex flex-wrap gap-2">
        <StatusBadge active={media.cameraReady} label="Camera Ready" />
        <StatusBadge active={media.microphoneReady} label="Mic Ready" />
        <StatusBadge active={media.screenShareEnabled} label="Screen Share Ready" />
        <StatusBadge active={media.permissionState === 'denied'} danger label="Permission Denied" />
        <StatusBadge
          active={media.permissionState === 'not-found'}
          danger
          label="No Device Found"
        />
        <StatusBadge active={media.activeStreamStatus !== 'inactive'} label="Preview Active" />
      </div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="aspect-video w-full rounded-2xl border border-white/10 bg-slate-900 object-cover"
      />
      {media.errorMessage ? (
        <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-2 text-sm text-rose-100">
          {media.errorMessage}
        </p>
      ) : null}
      {media.notice ? (
        <p className="rounded-xl border border-amber-300/30 bg-amber-500/10 p-2 text-sm text-amber-100">
          {media.notice}
        </p>
      ) : null}
      <div className="grid gap-2 md:grid-cols-3">
        <select
          name="selectedCameraPreview"
          value={media.preferences.selectedCameraId}
          onChange={(event) => media.updatePreferences({ selectedCameraId: event.target.value })}
          className="rounded-xl border border-white/10 bg-slate-800 p-2 text-sm"
        >
          <option value="">Default camera</option>
          {media.cameras.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>
        <select
          name="selectedMicrophonePreview"
          value={media.preferences.selectedMicrophoneId}
          onChange={(event) =>
            media.updatePreferences({ selectedMicrophoneId: event.target.value })
          }
          className="rounded-xl border border-white/10 bg-slate-800 p-2 text-sm"
        >
          <option value="">Default microphone</option>
          {media.microphones.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${index + 1}`}
            </option>
          ))}
        </select>
        <select
          disabled={!media.supportsAudioOutputSelection}
          value={media.preferences.selectedSpeakerId}
          onChange={(event) => media.updatePreferences({ selectedSpeakerId: event.target.value })}
          className="rounded-xl border border-white/10 bg-slate-800 p-2 text-sm disabled:opacity-50"
        >
          <option value="">Default speaker</option>
          {media.speakers.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Speaker ${index + 1}`}
            </option>
          ))}
        </select>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-cyan-300" style={{ width: `${micLevel}%` }} />
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        <button
          className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300"
          type="button"
          onClick={() => void media.startPreview()}
        >
          Start preview
        </button>
        <button
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-slate-100 hover:bg-slate-700"
          type="button"
          onClick={() => void toggleCamera()}
        >
          {media.preferences.cameraEnabled ? 'Camera off' : 'Camera on'}
        </button>
        <button
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-slate-100 hover:bg-slate-700"
          type="button"
          onClick={() => void toggleMic()}
        >
          {media.preferences.microphoneEnabled ? 'Mute mic' : 'Unmute mic'}
        </button>
        <button
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-slate-100 hover:bg-slate-700"
          type="button"
          onClick={() => void testScreen()}
        >
          Test screen share
        </button>
      </div>
      <input name="cameraReady" type="hidden" value={media.cameraReady ? 'on' : ''} />
      <input name="microphoneReady" type="hidden" value={media.microphoneReady ? 'on' : ''} />
      <p className="text-xs text-slate-400">
        Realtime media status: {status}. WebRTC: {webrtcState}. Host {hostConnected ? 'connected' : 'not connected'}. Media streams stay peer-to-peer and are never sent through WebSocket.
      </p>
    </section>
  );
}
