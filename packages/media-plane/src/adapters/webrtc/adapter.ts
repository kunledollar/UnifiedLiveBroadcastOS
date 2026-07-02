import type { ProductionGraph } from '../../../../shared/src/production-graph.js';
import type { MediaExecutionAdapter, MediaExecutionAdapterResponse, MediaExecutionIntent, MediaExecutionIntentType } from '../../index.js';
import { isBrowserMediaApiAvailable, isScreenShareAvailable } from './capture.js';
import { BrowserMediaSourceManager } from './source-manager.js';
import type { WebRTCDiagnostics } from './runtime-source.js';

const SUPPORTED = ['UPDATE_PREVIEW_SCENE', 'SWITCH_PROGRAM_SCENE', 'RENDER_MULTIVIEW', 'UPDATE_AUDIO_MIX', 'APPLY_LAYOUT'] as const satisfies readonly MediaExecutionIntentType[];

export class WebRTCMediaExecutionAdapter implements MediaExecutionAdapter {
  private lastExecutionResult?: MediaExecutionAdapterResponse;
  constructor(private readonly sources = new BrowserMediaSourceManager()) {}
  getName() { return 'WebRTCMediaExecutionAdapter'; }
  canHandle(intent: MediaExecutionIntent) { return SUPPORTED.includes(intent.type as (typeof SUPPORTED)[number]); }
  getCapabilities() { return [...SUPPORTED]; }
  getSourceManager() { return this.sources; }
  getDiagnostics(): WebRTCDiagnostics {
    return {
      isAvailable: isBrowserMediaApiAvailable(),
      supportsCamera: isBrowserMediaApiAvailable(),
      supportsMicrophone: isBrowserMediaApiAvailable(),
      supportsScreenShare: isScreenShareAvailable(),
      activeLocalStreamCount: this.sources.listSources().filter((source) => source.status === 'connected').length,
      sources: this.sources.listSources(),
      ...(this.lastExecutionResult ? { lastExecutionResult: this.lastExecutionResult } : {}),
    };
  }
  execute(intent: MediaExecutionIntent, _graph: ProductionGraph): MediaExecutionAdapterResponse {
    const started = Date.now();
    if (!this.canHandle(intent)) return this.respond(intent, started, false, [], [`UNSUPPORTED_INTENT:${intent.type}`]);
    const sourceId = typeof intent.payload.sourceId === 'string' ? intent.payload.sourceId : typeof intent.payload.sceneId === 'string' ? intent.payload.sceneId : undefined;
    const stream = sourceId ? this.sources.getStream(sourceId) : undefined;
    const warnings = sourceId && !stream ? [`STREAM_NOT_REGISTERED:${sourceId}`] : [];
    const sourceSummary = this.sources.listSources().map((source) => `${source.sourceId}:${source.status}`).join(', ') || 'no registered streams';
    return this.respond(intent, started, true, [`WebRTC local route resolved (${sourceSummary})`, ...warnings], []);
  }
  private respond(intent: MediaExecutionIntent, started: number, success: boolean, warnings: string[], errors: string[]) {
    const response = { adapterName: this.getName(), success, timestamp: new Date().toISOString(), latencyMs: Date.now() - started, warnings, errors } satisfies MediaExecutionAdapterResponse;
    this.lastExecutionResult = response;
    return response;
  }
}

export function createWebRTCAdapterMetadata(adapter: WebRTCMediaExecutionAdapter) {
  const available = isBrowserMediaApiAvailable();
  return {
    id: 'webrtc-media-execution-adapter',
    name: 'WebRTC Media Execution Adapter',
    type: 'webrtc',
    status: available ? 'enabled' : 'unavailable',
    capabilities: adapter.getCapabilities(),
    isMock: false,
    isLive: true,
  } as const;
}
