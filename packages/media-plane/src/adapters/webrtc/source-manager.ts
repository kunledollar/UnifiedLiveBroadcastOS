import type { WebRTCRuntimeSource, WebRTCRuntimeSourceKind, WebRTCRuntimeSourceStatus } from './runtime-source.js';

type StreamLike = Pick<MediaStream, 'id' | 'getAudioTracks' | 'getVideoTracks' | 'getTracks'>;

export interface RegisterWebRTCSourceOptions {
  readonly sourceId: string;
  readonly guestId?: string;
  readonly kind: WebRTCRuntimeSourceKind;
  readonly status?: WebRTCRuntimeSourceStatus;
}

export class BrowserMediaSourceManager {
  private readonly streams = new Map<string, StreamLike>();
  private readonly guestIndex = new Map<string, string>();
  private sources = new Map<string, WebRTCRuntimeSource>();

  registerStream(stream: StreamLike, options: RegisterWebRTCSourceOptions) {
    const metadata = this.toMetadata(stream, options, options.status ?? 'connected');
    this.streams.set(options.sourceId, stream);
    if (options.guestId) this.guestIndex.set(options.guestId, options.sourceId);
    this.sources.set(options.sourceId, metadata);
    this.attachEndedHandlers(stream, options.sourceId);
    return metadata;
  }

  unregisterStream(sourceId: string) {
    const source = this.sources.get(sourceId);
    this.streams.delete(sourceId);
    if (source?.guestId) this.guestIndex.delete(source.guestId);
    this.sources.delete(sourceId);
    return source;
  }

  getStream(sourceId: string) {
    return this.streams.get(sourceId);
  }

  getStreamByGuestId(guestId: string) {
    const sourceId = this.guestIndex.get(guestId);
    return sourceId ? this.getStream(sourceId) : undefined;
  }

  getSource(sourceId: string) {
    return this.sources.get(sourceId);
  }

  listSources() {
    return [...this.sources.values()];
  }

  updateSourceStatus(sourceId: string, status: WebRTCRuntimeSourceStatus, error?: string) {
    const current = this.sources.get(sourceId);
    if (!current) return undefined;
    const next: WebRTCRuntimeSource = {
      ...current,
      status,
      lastUpdatedAt: new Date().toISOString(),
      ...(error ? { error } : {}),
    };
    this.sources.set(sourceId, next);
    return next;
  }

  private toMetadata(
    stream: StreamLike,
    options: RegisterWebRTCSourceOptions,
    status: WebRTCRuntimeSourceStatus,
  ): WebRTCRuntimeSource {
    return {
      sourceId: options.sourceId,
      ...(options.guestId ? { guestId: options.guestId } : {}),
      kind: options.kind,
      streamId: stream.id,
      hasVideo: stream.getVideoTracks().some((track) => track.readyState !== 'ended'),
      hasAudio: stream.getAudioTracks().some((track) => track.readyState !== 'ended'),
      status,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  private attachEndedHandlers(stream: StreamLike, sourceId: string) {
    stream.getTracks().forEach((track) => {
      track.addEventListener?.('ended', () => this.updateSourceStatus(sourceId, 'disconnected'));
    });
  }
}
