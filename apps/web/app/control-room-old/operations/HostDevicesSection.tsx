'use client';

import { BroadcastButton, ConsoleSection, InspectorRow, StatusBadge, cn } from '@ubos/ui';
import { useEffect, useRef } from 'react';
import { useMediaCapture } from '../../../lib/media/use-media-capture';

export function HostDevicesSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const media = useMediaCapture();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = media.stream;
    if (media.stream) void video.play().catch(() => undefined);
  }, [media.stream]);

  const muted = !media.preferences.microphoneEnabled;

  return (
    <ConsoleSection title="Host Devices" className="mt-ubos-2 border-t border-ubos-border-subtle">
      <div className="mb-ubos-2 h-24 overflow-hidden rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
      </div>
      <InspectorRow
        label="Preview"
        value={
          <StatusBadge variant={media.activeStreamStatus === 'inactive' ? 'neutral' : 'preview'}>
            {media.activeStreamStatus === 'inactive' ? 'Local test' : 'Active'}
          </StatusBadge>
        }
      />
      <InspectorRow
        label="Camera"
        value={
          <StatusBadge variant={media.cameraReady ? 'success' : 'neutral'}>
            {media.cameraReady ? 'Ready' : 'Unavailable'}
          </StatusBadge>
        }
      />
      <InspectorRow
        label="Microphone"
        value={
          <StatusBadge variant={media.microphoneReady && !muted ? 'success' : 'warning'}>
            {muted ? 'Muted' : media.microphoneReady ? 'Ready' : 'Unavailable'}
          </StatusBadge>
        }
      />
      {media.permissionState === 'denied' ? (
        <p className="text-ubos-metadata text-ubos-fg-muted">Permission required for host devices.</p>
      ) : null}
      {media.errorMessage ? (
        <p className={cn('text-ubos-metadata text-ubos-error-text')}>{media.errorMessage}</p>
      ) : null}
      <div className="mt-ubos-2 flex flex-wrap gap-1">
        <BroadcastButton size="sm" variant="primary" type="button" onClick={() => void media.startPreview()}>
          Start
        </BroadcastButton>
        <BroadcastButton size="sm" variant="secondary" type="button" onClick={media.stopAll}>
          Stop
        </BroadcastButton>
        <BroadcastButton
          size="sm"
          variant="secondary"
          type="button"
          onClick={() => {
            const enabled = !media.preferences.microphoneEnabled;
            media.updatePreferences({ microphoneEnabled: enabled });
            const audioTracks = media.stream?.getAudioTracks() ?? [];
            if (enabled && audioTracks.length === 0) {
              void media.startPreview({ withAudio: true });
              return;
            }
            audioTracks.forEach((track) => {
              track.enabled = enabled;
            });
          }}
        >
          {muted ? 'Unmute' : 'Mute'}
        </BroadcastButton>
      </div>
    </ConsoleSection>
  );
}
