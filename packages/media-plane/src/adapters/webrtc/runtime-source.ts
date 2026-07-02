export type WebRTCRuntimeSourceKind = 'camera' | 'screen' | 'guest' | 'browser' | 'media';
export type WebRTCRuntimeSourceStatus = 'idle' | 'requesting' | 'connected' | 'disconnected' | 'error';

export interface WebRTCRuntimeSource {
  readonly sourceId: string;
  readonly guestId?: string;
  readonly kind: WebRTCRuntimeSourceKind;
  readonly streamId: string;
  readonly hasVideo: boolean;
  readonly hasAudio: boolean;
  readonly status: WebRTCRuntimeSourceStatus;
  readonly lastUpdatedAt: string;
  readonly error?: string;
}

export type WebRTCMediaErrorCode =
  | 'MEDIA_PERMISSION_DENIED'
  | 'MEDIA_DEVICE_NOT_FOUND'
  | 'MEDIA_API_UNAVAILABLE'
  | 'MEDIA_TRACK_ENDED'
  | 'STREAM_NOT_REGISTERED'
  | 'UNSUPPORTED_INTENT';

export interface WebRTCDiagnostics {
  readonly isAvailable: boolean;
  readonly supportsCamera: boolean;
  readonly supportsMicrophone: boolean;
  readonly supportsScreenShare: boolean;
  readonly activeLocalStreamCount: number;
  readonly sources: readonly WebRTCRuntimeSource[];
  readonly lastExecutionResult?: unknown;
}
