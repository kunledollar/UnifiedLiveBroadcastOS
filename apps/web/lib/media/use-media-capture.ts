'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  defaultDevicePreferences,
  enumerateMediaDevices,
  hasMediaDevices,
  loadDevicePreferences,
  mediaErrorMessage,
  requestCameraMicrophoneStream,
  requestCameraStream,
  requestMicrophoneStream,
  requestScreenShareStream,
  saveDevicePreferences,
  stopMediaStream,
  supportsAudioOutputSelection,
  type ActiveStreamStatus,
  type DevicePreferenceState,
  type MediaPermissionState,
} from './device-capture';

export function useMediaCapture() {
  const [preferences, setPreferences] = useState<DevicePreferenceState>(defaultDevicePreferences);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [permissionState, setPermissionState] = useState<MediaPermissionState>('idle');
  const [activeStreamStatus, setActiveStreamStatus] = useState<ActiveStreamStatus>('inactive');
  const [errorMessage, setErrorMessage] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const screenRef = useRef<MediaStream | null>(null);

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
      setErrorMessage('This browser does not support camera or microphone capture.');
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
      setErrorMessage(mediaErrorMessage(error));
    }
  }, []);

  const replaceStream = useCallback((next: MediaStream | null, status: ActiveStreamStatus) => {
    stopMediaStream(streamRef.current);
    streamRef.current = next;
    setStream(next);
    setActiveStreamStatus(status);
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

  const startCameraMicrophone = useCallback(async () => {
    setPermissionState('prompt');
    try {
      const next = await requestCameraMicrophoneStream(
        preferences.selectedCameraId,
        preferences.selectedMicrophoneId,
      );
      replaceStream(next, 'camera-microphone');
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
  }, [
    preferences.selectedCameraId,
    preferences.selectedMicrophoneId,
    refreshDevices,
    replaceStream,
  ]);

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

  const stopPreview = useCallback(() => replaceStream(null, 'inactive'), [replaceStream]);
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
    stream,
    screenStream,
    cameraReady: Boolean(stream?.getVideoTracks().some((track) => track.readyState === 'live')),
    microphoneReady: Boolean(stream?.getAudioTracks().some((track) => track.readyState === 'live')),
    screenShareEnabled: Boolean(screenStream),
    refreshDevices,
    startCamera,
    startMicrophone,
    startCameraMicrophone,
    startScreenShare,
    stopPreview,
    stopScreenShare,
    stopAll,
  };
}
