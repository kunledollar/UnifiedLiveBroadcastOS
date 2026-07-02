import type { WebRTCMediaErrorCode } from './runtime-source.js';

export class WebRTCMediaError extends Error {
  constructor(
    readonly code: WebRTCMediaErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'WebRTCMediaError';
  }
}

function mediaDevices() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    throw new WebRTCMediaError('MEDIA_API_UNAVAILABLE', 'Browser media APIs are unavailable');
  }
  return navigator.mediaDevices;
}

function normalizeCaptureError(error: unknown): WebRTCMediaError {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return new WebRTCMediaError('MEDIA_PERMISSION_DENIED', 'Media permission was denied', error);
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return new WebRTCMediaError('MEDIA_DEVICE_NOT_FOUND', 'Requested media device was not found', error);
  if (error instanceof WebRTCMediaError) return error;
  return new WebRTCMediaError('MEDIA_API_UNAVAILABLE', 'Unable to request browser media', error);
}

async function requestMedia(constraints: MediaStreamConstraints) {
  try {
    return await mediaDevices().getUserMedia(constraints);
  } catch (error) {
    throw normalizeCaptureError(error);
  }
}

export function isBrowserMediaApiAvailable() {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

export function isScreenShareAvailable() {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia);
}

export function requestLocalCamera() {
  return requestMedia({ video: true, audio: false });
}

export function requestLocalMicrophone() {
  return requestMedia({ audio: true, video: false });
}

export async function requestScreenShare() {
  try {
    if (!mediaDevices().getDisplayMedia)
      throw new WebRTCMediaError('MEDIA_API_UNAVAILABLE', 'Screen share APIs are unavailable');
    return await mediaDevices().getDisplayMedia({ video: true, audio: true });
  } catch (error) {
    throw normalizeCaptureError(error);
  }
}

export function stopAllTracks(stream?: Pick<MediaStream, 'getTracks'> | null) {
  stream?.getTracks().forEach((track) => {
    if (track.readyState !== 'ended') track.stop();
  });
}

export const stopLocalStream = stopAllTracks;
