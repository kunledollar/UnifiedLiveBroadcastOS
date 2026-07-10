'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  defaultDevicePreferences,
  enumerateMediaDevices,
  hasMediaDevices,
  loadDevicePreferences,
  mediaErrorMessage,
  requestCameraStream,
  requestMicrophoneStream,
  requestPreviewStream,
  requestScreenShareStream,
  saveDevicePreferences,
  stopMediaStream,
  supportsAudioOutputSelection,
  type ActiveStreamStatus,
  type DevicePreferenceState,
  type MediaPermissionState,
} from './device-capture';

function describeMediaError(error: unknown) {
  if (error instanceof DOMException) return `${error.name}: ${error.message}`;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

function logMediaRuntime(stage: string, details?: Record<string, unknown>) {
  console.info(`[UBOS media runtime] ${stage}`, details ?? {});
}

function permissionFromError(error: unknown): MediaPermissionState {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') return 'denied';
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') return 'not-found';
  }
  return 'error';
}

export function useMediaCapture() {
  const [preferences, setPreferences] = useState<DevicePreferenceState>(defaultDevicePreferences);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [permissionState, setPermissionState] = useState<MediaPermissionState>('idle');
  const [activeStreamStatus, setActiveStreamStatus] = useState<ActiveStreamStatus>('inactive');
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);
  const lastErrorRef = useRef('');

  const updatePreferences = useCallback((patch: Partial<DevicePreferenceState>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      saveDevicePreferences(next);
      return next;
    });
  }, []);

  const refreshDevices = useCallback(async () => {
    if (!hasMediaDevices()) {
      setPermissionState('unsupported');
      lastErrorRef.current = 'This browser does not support camera or microphone capture.';
      setErrorMessage(lastErrorRef.current);
      return;
    }
    try {
      const next = await enumerateMediaDevices();
      setCameras(next.cameras);
      setMicrophones(next.microphones);
      setSpeakers(next.speakers);
      if (next.cameras.length === 0 && next.microphones.length === 0)
        setPermissionState('not-found');
    } catch (error) {
      setPermissionState('error');
      lastErrorRef.current = mediaErrorMessage(error);
      setErrorMessage(lastErrorRef.current);
    }
  }, []);

  const replaceStream = useCallback((next: MediaStream | null, status: ActiveStreamStatus) => {
    const previous = streamRef.current;
    if (previous) {
      logMediaRuntime('stream stopped', { streamId: previous.id });
      stopMediaStream(previous);
    }
    streamRef.current = next;
    setStream(next);
    setActiveStreamStatus(status);
    if (next) {
      logMediaRuntime('stream active', {
        streamId: next.id,
        active: next.active,
        videoTrackCount: next.getVideoTracks().length,
        audioTrackCount: next.getAudioTracks().length,
      });
      next.getTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          logMediaRuntime('stream stopped', {
            streamId: next.id,
            trackId: track.id,
            kind: track.kind,
            readyState: track.readyState,
          });
        });
      });
    }
  }, []);

  const startCamera = useCallback(async () => {
    setPermissionState('prompt');
    try {
      const next = await requestCameraStream(preferences.selectedCameraId);
      replaceStream(next, 'camera');
      setPermissionState('granted');
      setErrorMessage('');
      await refreshDevices();
      return next;
    } catch (error) {
      setPermissionState(
        error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'error',
      );
      setErrorMessage(mediaErrorMessage(error));
      return null;
    }
  }, [preferences.selectedCameraId, refreshDevices, replaceStream]);

  const startMicrophone = useCallback(async () => {
    setPermissionState('prompt');
    try {
      const next = await requestMicrophoneStream(preferences.selectedMicrophoneId);
      replaceStream(next, 'microphone');
      setPermissionState('granted');
      setErrorMessage('');
      await refreshDevices();
      return next;
    } catch (error) {
      setPermissionState(
        error instanceof DOMException && error.name === 'NotAllowedError' ? 'denied' : 'error',
      );
      setErrorMessage(mediaErrorMessage(error));
      return null;
    }
  }, [preferences.selectedMicrophoneId, refreshDevices, replaceStream]);

  const startPreview = useCallback(
    async (options: { withAudio?: boolean } = {}) => {
      if (!hasMediaDevices()) {
        setPermissionState('unsupported');
        lastErrorRef.current = 'This browser does not support camera or microphone capture.';
        setErrorMessage(lastErrorRef.current);
        return null;
      }
      const withAudio = options.withAudio ?? preferences.microphoneEnabled;
      setPermissionState('prompt');
      lastErrorRef.current = '';
      setErrorMessage('');
      setNotice('');
      logMediaRuntime('requesting permissions', { withAudio });
      try {
        const { stream: next, audioMissing } = await requestPreviewStream({
          cameraId: preferences.selectedCameraId,
          microphoneId: preferences.selectedMicrophoneId,
          withAudio,
        });
        logMediaRuntime('permission granted', { withAudio, audioMissing });
        logMediaRuntime('stream received', { streamId: next.id, active: next.active });
        const hasVideo = next.getVideoTracks().length > 0;
        const hasAudio = next.getAudioTracks().length > 0;
        logMediaRuntime('video track count', { count: next.getVideoTracks().length });
        logMediaRuntime('audio track count', { count: next.getAudioTracks().length });
        replaceStream(
          next,
          hasVideo && hasAudio ? 'camera-microphone' : hasVideo ? 'camera' : 'microphone',
        );
        setPermissionState('granted');
        setNotice(
          audioMissing
            ? 'No microphone detected. Started camera-only preview — connect a mic to add audio.'
            : '',
        );
        await refreshDevices();
        return next;
      } catch (error) {
        const actualError = describeMediaError(error);
        logMediaRuntime('getUserMedia failed', { error: actualError });
        setPermissionState(permissionFromError(error));
        lastErrorRef.current = actualError;
        setErrorMessage(actualError);
        return null;
      }
    },
    [
      preferences.microphoneEnabled,
      preferences.selectedCameraId,
      preferences.selectedMicrophoneId,
      refreshDevices,
      replaceStream,
    ],
  );

  const startScreenShare = useCallback(async () => {
    try {
      const next = await requestScreenShareStream();
      stopMediaStream(screenRef.current);
      screenRef.current = next;
      setScreenStream(next);
      updatePreferences({});
      next.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopMediaStream(screenRef.current);
        screenRef.current = null;
        setScreenStream(null);
      });
      return next;
    } catch (error) {
      setErrorMessage(mediaErrorMessage(error));
      return null;
    }
  }, [updatePreferences]);

  const stopPreview = useCallback(() => {
    replaceStream(null, 'inactive');
    setNotice('');
  }, [replaceStream]);
  const stopScreenShare = useCallback(() => {
    stopMediaStream(screenRef.current);
    screenRef.current = null;
    setScreenStream(null);
  }, []);
  const stopAll = useCallback(() => {
    stopPreview();
    stopScreenShare();
  }, [stopPreview, stopScreenShare]);

  useEffect(() => {
    setPreferences(loadDevicePreferences());
    void refreshDevices();
    const handler = () => void refreshDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', handler);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
      stopMediaStream(streamRef.current);
      stopMediaStream(screenRef.current);
    };
  }, [refreshDevices]);

  return {
    cameras,
    microphones,
    speakers,
    supportsAudioOutputSelection: supportsAudioOutputSelection(),
    preferences,
    updatePreferences,
    permissionState,
    activeStreamStatus,
    errorMessage,
    notice,
    stream,
    screenStream,
    cameraReady: Boolean(stream?.getVideoTracks().some((track) => track.readyState === 'live')),
    microphoneReady: Boolean(stream?.getAudioTracks().some((track) => track.readyState === 'live')),
    screenShareEnabled: Boolean(screenStream),
    refreshDevices,
    startCamera,
    startMicrophone,
    startPreview,
    startScreenShare,
    stopPreview,
    stopScreenShare,
    stopAll,
    getLastErrorMessage: () => lastErrorRef.current,
  };
}
