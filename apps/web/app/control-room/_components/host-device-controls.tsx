'use client';

import { Badge, Panel } from '@ubos/ui';
import { useEffect, useRef } from 'react';
import { useMediaCapture } from '../../../lib/media/use-media-capture';

export function HostDeviceControls() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = useMediaCapture();
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = media.stream;
  }, [media.stream]);
  const muted = !media.preferences.microphoneEnabled;
  return (
    <Panel
      title="Host Devices"
      action={
        <Badge tone={media.activeStreamStatus === 'inactive' ? 'neutral' : 'success'}>
          {media.activeStreamStatus === 'inactive' ? 'Local test' : 'Preview Active'}
        </Badge>
      }
    >
      <div className="space-y-3">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-video w-full rounded-2xl border border-white/10 bg-slate-900 object-cover"
        />
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone={media.cameraReady ? 'success' : 'neutral'}>Camera Ready</Badge>
          <Badge tone={media.microphoneReady && !muted ? 'success' : 'warning'}>
            {muted ? 'Mic Muted' : 'Mic Ready'}
          </Badge>
          {media.permissionState === 'denied' ? (
            <Badge tone="danger">Permission Denied</Badge>
          ) : null}
          {media.permissionState === 'not-found' ? (
            <Badge tone="danger">No Device Found</Badge>
          ) : null}
        </div>
        {media.errorMessage ? (
          <p className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-2 text-sm text-rose-100">
            {media.errorMessage}
          </p>
        ) : null}
        <select
          value={media.preferences.selectedCameraId}
          onChange={(event) => media.updatePreferences({ selectedCameraId: event.target.value })}
          className="w-full rounded-xl border border-white/10 bg-slate-800 p-2 text-sm"
        >
          <option value="">Default camera</option>
          {media.cameras.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${index + 1}`}
            </option>
          ))}
        </select>
        <select
          value={media.preferences.selectedMicrophoneId}
          onChange={(event) =>
            media.updatePreferences({ selectedMicrophoneId: event.target.value })
          }
          className="w-full rounded-xl border border-white/10 bg-slate-800 p-2 text-sm"
        >
          <option value="">Default microphone</option>
          {media.microphones.map((device, index) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Microphone ${index + 1}`}
            </option>
          ))}
        </select>
        <div className="grid gap-2 md:grid-cols-3">
          <button
            className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300"
            type="button"
            onClick={() => void media.startCameraMicrophone()}
          >
            Start preview
          </button>
          <button
            className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-slate-100 hover:bg-slate-700"
            type="button"
            onClick={media.stopAll}
          >
            Stop preview
          </button>
          <button
            className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-slate-100 hover:bg-slate-700"
            type="button"
            onClick={() => {
              const enabled = !media.preferences.microphoneEnabled;
              media.updatePreferences({ microphoneEnabled: enabled });
              media.stream?.getAudioTracks().forEach((track) => {
                track.enabled = enabled;
              });
            }}
          >
            {muted ? 'Unmute mic' : 'Mute mic'}
          </button>
        </div>
        <p className="text-xs text-slate-400">
          Local host test only. No WebRTC peer transport, recording, or RTMP output is started.
        </p>
      </div>
    </Panel>
  );
}
