'use client';

export type MediaPermissionState =
  'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported' | 'not-found' | 'error';
export type ActiveStreamStatus =
  'inactive' | 'camera' | 'microphone' | 'camera-microphone' | 'screen';
export type DevicePreferenceState = {
  selectedCameraId: string;
  selectedMicrophoneId: string;
  selectedSpeakerId: string;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
};

export const defaultDevicePreferences: DevicePreferenceState = {
  selectedCameraId: '',
  selectedMicrophoneId: '',
  selectedSpeakerId: '',
  cameraEnabled: true,
  microphoneEnabled: true,
};

const storageKey = 'ubos.mediaDevicePreferences.v1';

export function hasMediaDevices() {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

export function supportsScreenShare() {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getDisplayMedia);
}

export function supportsAudioOutputSelection() {
  return typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
}

export function loadDevicePreferences(): DevicePreferenceState {
  if (typeof window === 'undefined') return defaultDevicePreferences;
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? { ...defaultDevicePreferences, ...JSON.parse(raw) } : defaultDevicePreferences;
  } catch {
    return defaultDevicePreferences;
  }
}

export function saveDevicePreferences(next: DevicePreferenceState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify(next));
}

export async function enumerateMediaDevices() {
  if (!hasMediaDevices())
    throw new Error('This browser does not support camera or microphone capture.');
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    cameras: devices.filter((device) => device.kind === 'videoinput'),
    microphones: devices.filter((device) => device.kind === 'audioinput'),
    speakers: devices.filter((device) => device.kind === 'audiooutput'),
  };
}

export function mediaErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Permission denied. Allow camera and microphone access in your browser settings.';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError')
    return 'No matching camera or microphone device was found.';
  if (name === 'NotReadableError' || name === 'TrackStartError')
    return 'The selected device is already in use or cannot be read.';
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError')
    return 'The selected device does not meet the requested capture settings.';
  return error instanceof Error ? error.message : 'Unable to access local media devices.';
}

function deviceConstraint(deviceId: string) {
  return deviceId ? { deviceId: { exact: deviceId } } : true;
}

export async function requestCameraStream(deviceId = '') {
  if (!hasMediaDevices()) throw new Error('This browser does not support camera capture.');
  return navigator.mediaDevices.getUserMedia({ video: deviceConstraint(deviceId), audio: false });
}

export async function requestMicrophoneStream(deviceId = '') {
  if (!hasMediaDevices()) throw new Error('This browser does not support microphone capture.');
  return navigator.mediaDevices.getUserMedia({ video: false, audio: deviceConstraint(deviceId) });
}

export type PreviewStreamResult = { stream: MediaStream; audioMissing: boolean };

/**
 * Starts a camera preview, optionally with audio. A single
 * `getUserMedia({ video, audio })` call fails entirely when there is no usable
 * microphone, which would block a camera-only preview. To avoid that, when
 * audio is requested but the combined call fails, we retry with camera-only so
 * the camera preview still starts. If the camera-only retry also fails, the
 * original error is surfaced (genuine camera/permission problem).
 */
export async function requestPreviewStream(options: {
  cameraId?: string;
  microphoneId?: string;
  withAudio: boolean;
}): Promise<PreviewStreamResult> {
  if (!hasMediaDevices()) throw new Error('This browser does not support camera capture.');
  const video = deviceConstraint(options.cameraId ?? '');

  if (options.withAudio) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video,
        audio: deviceConstraint(options.microphoneId ?? ''),
      });
      return { stream, audioMissing: false };
    } catch (combinedError) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        return { stream, audioMissing: true };
      } catch {
        throw combinedError;
      }
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
  return { stream, audioMissing: false };
}

export async function requestScreenShareStream() {
  if (!supportsScreenShare()) throw new Error('This browser does not support screen sharing.');
  return navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
}

export function stopMediaStream(stream?: MediaStream | null) {
  stream?.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      /* noop */
    }
  });
}
