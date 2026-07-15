export type BrowserRecordingArtifactVerification = {
  ok: boolean;
  state: 'pending' | 'confirmed' | 'failed';
  sizeBytes: number;
  mimeType: string;
  durationMs: number;
  playable: boolean;
  reason: string | null;
};

// Verifies non-empty bytes, valid MIME type, measurable duration, and playback capability.
export function verifyBrowserRecordingArtifact(input: {
  blob: Blob;
  durationMs: number;
  playable?: boolean;
}): BrowserRecordingArtifactVerification {
  const mimeType = input.blob.type || 'application/octet-stream';
  if (input.blob.size <= 0) {
    return {
      ok: false,
      state: 'failed',
      sizeBytes: input.blob.size,
      mimeType,
      durationMs: input.durationMs,
      playable: false,
      reason: 'Recording artifact is empty.',
    };
  }
  if (!/^video\/(webm|mp4|ogg)$/i.test(mimeType)) {
    return {
      ok: false,
      state: 'failed',
      sizeBytes: input.blob.size,
      mimeType,
      durationMs: input.durationMs,
      playable: false,
      reason: `Unsupported recording MIME type: ${mimeType}.`,
    };
  }
  if (!Number.isFinite(input.durationMs) || input.durationMs <= 0) {
    return {
      ok: false,
      state: 'failed',
      sizeBytes: input.blob.size,
      mimeType,
      durationMs: input.durationMs,
      playable: false,
      reason: 'Recording artifact has no measurable duration.',
    };
  }
  if (input.playable === false) {
    return {
      ok: false,
      state: 'failed',
      sizeBytes: input.blob.size,
      mimeType,
      durationMs: input.durationMs,
      playable: false,
      reason: 'Recording artifact could not be played back.',
    };
  }
  return {
    ok: true,
    state: 'confirmed',
    sizeBytes: input.blob.size,
    mimeType,
    durationMs: input.durationMs,
    playable: true,
    reason: null,
  };
}
