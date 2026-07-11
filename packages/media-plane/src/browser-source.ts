import { RuntimeEngineError, type FrameTick } from './execution-engine.js';
import {
  DeterministicSourceTimestampNormalizer,
  type MediaSource,
  type SourceDescriptor,
  type SourceMediaKind,
  type SourceOperationResult,
  type SourcePayloadRef,
  type SourceProvider,
  type SourceProviderContext,
  type SourceProviderDescriptor,
  type SourceRuntimeContext,
  type SourceSampleBatch,
  type SourceVideoFormat,
  type VideoFrameEnvelope,
  createSourceVideoFormat,
} from './source-acquisition.js';

const clone = <T>(v: T): T => structuredClone(v) as T;
export const browserDeepFreeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object') {
    Object.freeze(v);
    for (const x of Object.values(v as Record<string, unknown>)) browserDeepFreeze(x);
  }
  return v as Readonly<T>;
};
const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
};
const nowIso = () => new Date(0).toISOString();
const secretKey =
  /authorization|cookie|token|secret|password|credential|set-cookie|x-api-key|session|form|body|private|path|process|pid/i;
export const redactBrowserValue = (v: unknown): unknown => {
  if (typeof v === 'string')
    return v
      .replace(/Authorization:/gi, 'redacted-header:')
      .replace(/(Bearer\s+)[^\s]+/gi, '$1<redacted>')
      .replace(/([?&](token|key|password|secret|auth|code)=)[^&#]+/gi, '$1<redacted>')
      .replace(/\/\/[^/@\s]+@/g, '//<redacted>@')
      .slice(0, 256);
  if (Array.isArray(v)) return v.slice(0, 16).map(redactBrowserValue);
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 32))
      out[secretKey.test(k) ? `redacted_${hash(k)}` : k] = secretKey.test(k)
        ? '<redacted>'
        : redactBrowserValue(val);
    return out;
  }
  return v;
};

export type BrowserSourceCategory =
  | 'WEB_PAGE'
  | 'LOCAL_HTML'
  | 'HTML_OVERLAY'
  | 'DASHBOARD'
  | 'REMOTE_GRAPHICS'
  | 'AUTHENTICATED_WEB_APP'
  | 'EMBEDDED_WIDGET'
  | 'SYNTHETIC_BROWSER'
  | 'CUSTOM_BROWSER'
  | 'BROWSER_TAB'
  | 'WEBRTC_GUEST_PAGE'
  | 'CLOUD_RENDERED_BROWSER'
  | 'AUTOMATION_CONTROLLED_PAGE';
export type BrowserPageState =
  | 'CREATED'
  | 'NAVIGATING'
  | 'LOADING'
  | 'DOM_READY'
  | 'RENDER_READY'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CRASHED'
  | 'FAILED'
  | 'CLOSED';
export type BrowserReadinessState =
  | 'NAVIGATION_STARTED'
  | 'RESPONSE_RECEIVED'
  | 'DOM_READY'
  | 'LOAD_EVENT'
  | 'NETWORK_IDLE'
  | 'APPLICATION_READY'
  | 'FIRST_PAINT'
  | 'FIRST_CONTENTFUL_PAINT'
  | 'FIRST_FRAME'
  | 'CUSTOM_SIGNAL'
  | 'TIMEOUT';
export type BrowserSessionPolicy =
  | 'EPHEMERAL_ISOLATED'
  | 'PERSISTENT_ISOLATED'
  | 'SHARED_TRUSTED_PROFILE'
  | 'READ_ONLY_PROFILE'
  | 'SYNTHETIC_SESSION';
export type BrowserPermission =
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'clipboardRead'
  | 'clipboardWrite'
  | 'midi'
  | 'usb'
  | 'serial'
  | 'bluetooth'
  | 'screenCapture'
  | 'fileAccess'
  | 'downloads'
  | 'popups'
  | 'fullscreen';
export type BrowserPermissionDecision = 'DENY' | 'ALLOW';
export type BrowserOverflowPolicy = 'DROP_OLDEST' | 'DROP_NEWEST' | 'KEEP_LATEST_VIDEO' | 'REJECT';
export type BrowserFrameOwnership =
  | 'OWNED_BY_BACKEND'
  | 'OWNED_BY_SOURCE'
  | 'OWNED_BY_RUNTIME'
  | 'BORROWED'
  | 'EXTERNAL_HANDLE'
  | 'RELEASED';
export type BrowserContentKind =
  | 'HTTPS_URL'
  | 'HTTP_URL'
  | 'LOCAL_ASSET'
  | 'REPOSITORY_ASSET'
  | 'SANDBOXED_LOCAL_CONTENT'
  | 'SYNTHETIC_PAGE'
  | 'CLOUD_BROWSER_ASSET';
export type BrowserCommandType =
  | 'BROWSER_REGISTER'
  | 'BROWSER_OPEN'
  | 'BROWSER_NAVIGATE'
  | 'BROWSER_START'
  | 'BROWSER_STOP'
  | 'BROWSER_CLOSE'
  | 'BROWSER_RELOAD'
  | 'BROWSER_SET_VIEWPORT'
  | 'BROWSER_SET_URL'
  | 'BROWSER_SET_HEADERS_PROFILE'
  | 'BROWSER_SET_AUTH_PROFILE'
  | 'BROWSER_CLEAR_SESSION'
  | 'BROWSER_SET_AUDIO'
  | 'BROWSER_INTERACT'
  | 'BROWSER_ENABLE'
  | 'BROWSER_DISABLE'
  | 'BROWSER_RECOVER';
export const BROWSER_COMMAND_TYPES = browserDeepFreeze([
  'BROWSER_REGISTER',
  'BROWSER_OPEN',
  'BROWSER_NAVIGATE',
  'BROWSER_START',
  'BROWSER_STOP',
  'BROWSER_CLOSE',
  'BROWSER_RELOAD',
  'BROWSER_SET_VIEWPORT',
  'BROWSER_SET_URL',
  'BROWSER_SET_HEADERS_PROFILE',
  'BROWSER_SET_AUTH_PROFILE',
  'BROWSER_CLEAR_SESSION',
  'BROWSER_SET_AUDIO',
  'BROWSER_INTERACT',
  'BROWSER_ENABLE',
  'BROWSER_DISABLE',
  'BROWSER_RECOVER',
] as const);
export const BROWSER_EVENT_TYPES = browserDeepFreeze([
  'BrowserSourceRegistered',
  'BrowserOpening',
  'BrowserOpened',
  'BrowserOpenFailed',
  'BrowserNavigationStarted',
  'BrowserNavigationRedirected',
  'BrowserNavigationBlocked',
  'BrowserNavigationCompleted',
  'BrowserNavigationFailed',
  'BrowserDomReady',
  'BrowserRenderReady',
  'BrowserRenderStarted',
  'BrowserRenderStopped',
  'BrowserFrameReceived',
  'BrowserFramePublished',
  'BrowserFrameDropped',
  'BrowserQueuePressure',
  'BrowserViewportChanged',
  'BrowserAudioChanged',
  'BrowserInteractionExecuted',
  'BrowserInteractionFailed',
  'BrowserPermissionDenied',
  'BrowserConsoleError',
  'BrowserNetworkFailure',
  'BrowserCrashed',
  'BrowserRecovering',
  'BrowserRecovered',
  'BrowserRecoveryFailed',
  'BrowserSessionCleared',
  'BrowserClosing',
  'BrowserClosed',
  'BrowserHealthChanged',
] as const);
export const BROWSER_WATCHDOG_INCIDENTS = browserDeepFreeze([
  'BROWSER_NAVIGATION_FAILED',
  'BROWSER_NAVIGATION_BLOCKED',
  'BROWSER_RENDER_NOT_READY',
  'BROWSER_NO_FRAMES',
  'BROWSER_RENDER_STALLED',
  'BROWSER_QUEUE_OVERFLOW',
  'BROWSER_FRAME_DROP_RATE_HIGH',
  'BROWSER_RENDER_PROCESS_CRASHED',
  'BROWSER_NETWORK_FAILURE_RATE_HIGH',
  'BROWSER_REDIRECT_LOOP',
  'BROWSER_RELOAD_LOOP',
  'BROWSER_PERMISSION_VIOLATION',
  'BROWSER_SECRET_LEAK_RISK',
  'BROWSER_STORAGE_QUOTA_EXCEEDED',
  'BROWSER_BACKEND_FAILED',
  'BROWSER_GRAPH_MISMATCH',
  'BROWSER_INVARIANT_FAILURE',
] as const);

export class BrowserSourceError extends RuntimeEngineError {
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(code, message, redactBrowserValue(details) as Record<string, unknown>);
  }
}
const berr = (c: string, m: string, d: Record<string, unknown> = {}) =>
  new BrowserSourceError(c, m, d);
export class BrowserUrlInvalid extends BrowserSourceError {
  constructor(m = 'Invalid browser URL') {
    super('BrowserUrlInvalid', m);
  }
}
export class BrowserSchemeUnsupported extends BrowserSourceError {
  constructor(s: string) {
    super('BrowserSchemeUnsupported', `Unsupported browser URL scheme ${s}`, { scheme: s });
  }
}
export class BrowserOriginDenied extends BrowserSourceError {
  constructor(o: string) {
    super('BrowserOriginDenied', `Browser origin denied ${o}`, { origin: o });
  }
}
export class BrowserPrivateNetworkDenied extends BrowserSourceError {
  constructor(h: string) {
    super('BrowserPrivateNetworkDenied', 'Private-network browser navigation denied', {
      hostHash: hash(h),
    });
  }
}

export interface BrowserViewport {
  readonly width: number;
  readonly height: number;
  readonly deviceScaleFactor: number;
  readonly mobile: boolean;
  readonly orientation: 'LANDSCAPE' | 'PORTRAIT';
  readonly transparentBackground: boolean;
  readonly preferredFrameRate: number;
  readonly colorScheme: 'LIGHT' | 'DARK' | 'NO_PREFERENCE';
  readonly reducedMotion: boolean;
  readonly userAgentProfileRef?: string;
  readonly locale?: string;
  readonly timezoneRef?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface BrowserContentReference {
  readonly kind: BrowserContentKind;
  readonly referenceId: string;
  readonly safeUrl?: string;
  readonly safeOrigin?: string;
  readonly assetId?: string;
  readonly localRootRef?: string;
  readonly syntheticPageId?: string;
  readonly credentialRefs?: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface BrowserNavigationPolicy {
  readonly allowedOrigins: readonly string[];
  readonly deniedOrigins: readonly string[];
  readonly allowedDomains: readonly string[];
  readonly deniedDomains: readonly string[];
  readonly allowedSchemes: readonly string[];
  readonly sameOriginOnly: boolean;
  readonly allowHttp: boolean;
  readonly allowPrivateNetwork: boolean;
  readonly allowLocalhost: boolean;
  readonly allowIpLiterals: boolean;
  readonly allowInternalHostnames: boolean;
  readonly redirectLimit: number;
  readonly navigationTimeoutMs: number;
  readonly popups: 'BLOCK' | 'ALLOW';
  readonly newWindows: 'BLOCK' | 'ALLOW';
  readonly externalProtocols: 'BLOCK' | 'ALLOW';
  readonly mixedContent: 'DENY' | 'ALLOW';
  readonly certificateErrors: 'DENY' | 'ALLOW';
  readonly downloads: 'BLOCK' | 'ALLOW';
  readonly localFileAccess: 'DENY' | 'ALLOW';
  readonly maximumNavigationDepth: number;
  readonly maximumPageReloads: number;
}
export interface BrowserPermissionPolicy {
  readonly defaultDecision: BrowserPermissionDecision;
  readonly grants: Readonly<Partial<Record<BrowserPermission, BrowserPermissionDecision>>>;
}
export interface BrowserSessionIsolationPolicy {
  readonly policy: BrowserSessionPolicy;
  readonly profileId?: string;
  readonly storageQuotaBytes: number;
  readonly cleanupOnClose: boolean;
}
export interface BrowserIdentity {
  readonly sourceId: string;
  readonly providerId: string;
  readonly browserProfileId: string;
  readonly contentReferenceId: string;
  readonly category: BrowserSourceCategory;
  readonly displayName: string;
  readonly safeOrigin: string;
  readonly persistentIdentity: string;
  readonly sessionIdentity: string;
  readonly isolationPartitionId: string;
  readonly viewportProfileId: string;
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
  readonly tags: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface BrowserSourceDescriptor {
  readonly identity: BrowserIdentity;
  readonly providerId: string;
  readonly category: BrowserSourceCategory;
  readonly displayName: string;
  readonly contentReference: BrowserContentReference;
  readonly mediaKinds: readonly SourceMediaKind[];
  readonly supportedViewports: readonly BrowserViewport[];
  readonly defaultViewport: BrowserViewport;
  readonly deviceScaleFactor: number;
  readonly preferredFrameRate: number;
  readonly supportsTransparentBackground: boolean;
  readonly supportsBrowserAudio: boolean;
  readonly supportsInteraction: boolean;
  readonly navigationPolicy: BrowserNavigationPolicy;
  readonly originPolicy: BrowserNavigationPolicy;
  readonly sessionPolicy: BrowserSessionIsolationPolicy;
  readonly storagePolicy: BrowserSessionIsolationPolicy;
  readonly permissionPolicy: BrowserPermissionPolicy;
  readonly reconnectable: boolean;
  readonly acquisitionMode: 'PUSH' | 'PULL' | 'HYBRID';
  readonly clockDomain: 'RUNTIME_MASTER' | 'SYSTEM_MONOTONIC' | 'UNKNOWN';
  readonly latencyClass: 'REALTIME' | 'LOW' | 'STANDARD' | 'BUFFERED' | 'UNKNOWN';
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface BrowserOpenRequest {
  readonly viewport?: BrowserViewport;
  readonly credentialRefs?: readonly string[];
  readonly timeoutMs?: number;
}
export interface BrowserNavigationRequest {
  readonly contentReference?: BrowserContentReference;
  readonly url?: string;
  readonly readinessPolicy?: BrowserReadinessState;
  readonly expectedNavigationGeneration?: number;
  readonly timeoutMs?: number;
  readonly headerProfileRef?: string;
  readonly authProfileRef?: string;
}
export interface BrowserOperationResult {
  readonly ok: boolean;
  readonly code: string;
  readonly message: string;
  readonly generation?: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export type BrowserOpenResult = BrowserOperationResult;
export type BrowserNavigationResult = BrowserOperationResult & {
  readonly safeOrigin?: string;
  readonly readinessState?: BrowserReadinessState;
};
export interface BrowserInteractionRequest {
  readonly kind:
    | 'mouseMove'
    | 'mouseClick'
    | 'scroll'
    | 'keyPress'
    | 'textInput'
    | 'focus'
    | 'blur'
    | 'reload'
    | 'zoom'
    | 'javascript';
  readonly x?: number;
  readonly y?: number;
  readonly text?: string;
  readonly key?: string;
  readonly scriptRef?: string;
  readonly allowJavaScript?: boolean;
}
export type BrowserInteractionResult = BrowserOperationResult;
export interface BrowserFrameEnvelope extends VideoFrameEnvelope {
  readonly browserSessionIdRef: string;
  readonly navigationGeneration: number;
  readonly renderGeneration: number;
  readonly viewport: BrowserViewport;
  readonly contentSize: { readonly width: number; readonly height: number };
  readonly scrollOffset: { readonly x: number; readonly y: number };
  readonly transparentBackground: boolean;
  readonly pageReadyState: BrowserPageState;
  readonly currentSafeOrigin: string;
  readonly backendId: string;
  readonly ownership: BrowserFrameOwnership;
}
export interface BrowserQueueConfiguration {
  readonly maximumFrames: number;
  readonly highWaterMark: number;
  readonly lowWaterMark: number;
  readonly overflowPolicy: BrowserOverflowPolicy;
  readonly maximumFrameAgeNs: bigint;
  readonly targetLatencyFrames: number;
  readonly preserveLatestFrame: boolean;
  readonly releaseDroppedFrames: boolean;
}
export interface BrowserQueueSnapshot {
  readonly depth: number;
  readonly maximumFrames: number;
  readonly enqueued: number;
  readonly dequeued: number;
  readonly droppedOldest: number;
  readonly droppedNewest: number;
  readonly droppedStale: number;
  readonly wrongGeneration: number;
  readonly rejected: number;
  readonly highWaterEvents: number;
  readonly maximumDepth: number;
  readonly oldestFrameAgeNs: string;
}
export interface BrowserDiagnosticSummary {
  readonly consoleMessages: readonly Record<string, unknown>[];
  readonly networkEvents: readonly Record<string, unknown>[];
  readonly errors: readonly Record<string, unknown>[];
  readonly truncated: number;
  readonly suppressedDuplicates: number;
}
export interface BrowserSourceHealthSnapshot {
  readonly sourceId: string;
  readonly lifecycleState: string;
  readonly pageState: BrowserPageState;
  readonly healthState: string;
  readonly connected: boolean;
  readonly active: boolean;
  readonly renderReady: boolean;
  readonly available: boolean;
  readonly safeCurrentOrigin: string;
  readonly viewport: BrowserViewport;
  readonly audioEnabled: boolean;
  readonly backendId: string;
  readonly navigationGeneration: number;
  readonly renderGeneration: number;
  readonly lastFrameSequence?: string;
  readonly queueDepth: number;
  readonly maximumQueueDepth: number;
  readonly droppedFrames: number;
  readonly staleFrames: number;
  readonly wrongGenerationFrames: number;
  readonly consoleErrorCount: number;
  readonly networkFailureCount: number;
  readonly blockedNavigationCount: number;
  readonly redirectCount: number;
  readonly reloadCount: number;
  readonly renderCrashes: number;
  readonly backendRestarts: number;
  readonly permissionDenials: number;
  readonly storageQuotaEvents: number;
  readonly consecutiveFailures: number;
  readonly lastError?: string;
  readonly updatedAtNs: string;
}
export interface BrowserTelemetrySnapshot {
  readonly registeredBrowserSourceCount: number;
  readonly openBrowserSourceCount: number;
  readonly activeBrowserSourceCount: number;
  readonly renderReadyBrowserSourceCount: number;
  readonly degradedBrowserSourceCount: number;
  readonly failedBrowserSourceCount: number;
  readonly crashedBrowserSourceCount: number;
  readonly browserAudioSourceCount: number;
  readonly totalBrowserFramesReceived: number;
  readonly totalBrowserFramesPublished: number;
  readonly totalBrowserFramesDropped: number;
  readonly totalBrowserFramesStale: number;
  readonly totalBrowserWrongGenerationFrames: number;
  readonly totalBrowserNavigations: number;
  readonly successfulBrowserNavigations: number;
  readonly failedBrowserNavigations: number;
  readonly blockedBrowserNavigations: number;
  readonly totalBrowserRedirects: number;
  readonly totalBrowserReloads: number;
  readonly totalBrowserCrashes: number;
  readonly totalBrowserRecoveries: number;
  readonly totalConsoleErrors: number;
  readonly totalNetworkFailures: number;
  readonly totalPermissionDenials: number;
  readonly totalStorageQuotaEvents: number;
  readonly totalBrowserQueueOverflows: number;
  readonly averageBrowserRenderLatencyNs: string;
  readonly maximumBrowserRenderLatencyNs: string;
  readonly averageBrowserNavigationLatencyNs: string;
  readonly maximumBrowserNavigationLatencyNs: string;
  readonly maximumBrowserQueueDepth: number;
  readonly currentBrowserSourceIds: readonly string[];
  readonly lastBrowserEvent?: string;
  readonly browserHealthSummary: Readonly<Record<string, number>>;
}
export interface BrowserBackendHealthSnapshot {
  readonly backendId: string;
  readonly healthy: boolean;
  readonly openInstances: number;
  readonly activeInstances: number;
  readonly crashes: number;
  readonly lastError?: string;
}
export interface BrowserSourceSnapshot {
  readonly descriptor: BrowserSourceDescriptor;
  readonly health: BrowserSourceHealthSnapshot;
  readonly queue: BrowserQueueSnapshot;
  readonly diagnostics: BrowserDiagnosticSummary;
}
export interface BrowserProviderSnapshot {
  readonly providerId: string;
  readonly descriptor: SourceProviderDescriptor;
  readonly backendHealth: BrowserBackendHealthSnapshot;
}
export type BrowserPageStateSnapshot = BrowserSourceHealthSnapshot;
export interface BrowserSessionSnapshot {
  readonly sourceId: string;
  readonly policy: BrowserSessionPolicy;
  readonly profileId?: string;
  readonly isolationPartitionId: string;
  readonly sessionGeneration: number;
  readonly cleanupOnClose: boolean;
}
export type BrowserViewportSnapshot = BrowserViewport;

export interface BrowserBackendCreateRequest {
  readonly sourceId: string;
  readonly viewport: BrowserViewport;
  readonly sessionPartitionId: string;
}
export interface BrowserBackendCreateResult {
  readonly ok: boolean;
  readonly browserSessionIdRef: string;
}
export interface BrowserBackendNavigationRequest {
  readonly sourceId: string;
  readonly contentReference: BrowserContentReference;
  readonly navigationGeneration: number;
  readonly readinessPolicy: BrowserReadinessState;
}
export interface BrowserBackendNavigationResult {
  readonly ok: boolean;
  readonly readinessState: BrowserReadinessState;
  readonly safeOrigin: string;
  readonly redirects: readonly string[];
}
export interface BrowserBackendContext {
  readonly nowNs: () => bigint;
  readonly sourceId: string;
  readonly navigationGeneration: number;
  readonly renderGeneration: number;
}
export type BrowserFrameCallback = (frame: BrowserFrameEnvelope) => void;
export type BrowserStateChangedCallback = (state: BrowserPageState) => void;
export type BrowserConsoleCallback = (message: Record<string, unknown>) => void;
export type BrowserNetworkCallback = (event: Record<string, unknown>) => void;
export type BrowserBackendErrorCallback = (error: BrowserSourceError) => void;
export interface BrowserRenderBackend {
  readonly backendId: string;
  create(
    request: BrowserBackendCreateRequest,
    context: BrowserBackendContext,
  ): Promise<BrowserBackendCreateResult>;
  navigate(
    request: BrowserBackendNavigationRequest,
    context: BrowserBackendContext,
  ): Promise<BrowserBackendNavigationResult>;
  start(
    onFrame: BrowserFrameCallback,
    onStateChanged: BrowserStateChangedCallback,
    onConsoleMessage: BrowserConsoleCallback,
    onNetworkEvent: BrowserNetworkCallback,
    onError: BrowserBackendErrorCallback,
    context: BrowserBackendContext,
  ): Promise<void>;
  stop(context: BrowserBackendContext): Promise<void>;
  resize?(
    request: { readonly viewport: BrowserViewport; readonly renderGeneration: number },
    context: BrowserBackendContext,
  ): Promise<void>;
  executeInteraction?(
    request: BrowserInteractionRequest,
    context: BrowserBackendContext,
  ): Promise<BrowserInteractionResult>;
  clearSession?(context: BrowserBackendContext): Promise<void>;
  close(context: BrowserBackendContext): Promise<void>;
  getHealth?(): BrowserBackendHealthSnapshot;
}
export const BROWSER_ENGINE_ADAPTER_BOUNDARIES = browserDeepFreeze([
  'CEF',
  'ELECTRON_BROWSER_WINDOW',
  'PLAYWRIGHT_CHROMIUM',
  'PUPPETEER_CHROMIUM',
  'WEBVIEW2',
  'WKWEBVIEW',
  'WEBKITGTK',
  'CLOUD_RENDERED_BROWSER',
] as const);

export const DEFAULT_BROWSER_VIEWPORT: BrowserViewport = browserDeepFreeze({
  width: 1280,
  height: 720,
  deviceScaleFactor: 1,
  mobile: false,
  orientation: 'LANDSCAPE',
  transparentBackground: false,
  preferredFrameRate: 30,
  colorScheme: 'NO_PREFERENCE',
  reducedMotion: false,
  metadata: {},
}) as BrowserViewport;
export const DEFAULT_BROWSER_NAVIGATION_POLICY: BrowserNavigationPolicy = browserDeepFreeze({
  allowedOrigins: [],
  deniedOrigins: [],
  allowedDomains: [],
  deniedDomains: [],
  allowedSchemes: ['https'],
  sameOriginOnly: false,
  allowHttp: false,
  allowPrivateNetwork: false,
  allowLocalhost: false,
  allowIpLiterals: false,
  allowInternalHostnames: false,
  redirectLimit: 5,
  navigationTimeoutMs: 30000,
  popups: 'BLOCK',
  newWindows: 'BLOCK',
  externalProtocols: 'BLOCK',
  mixedContent: 'DENY',
  certificateErrors: 'DENY',
  downloads: 'BLOCK',
  localFileAccess: 'DENY',
  maximumNavigationDepth: 16,
  maximumPageReloads: 3,
}) as BrowserNavigationPolicy;
export const DEFAULT_BROWSER_QUEUE_CONFIG: BrowserQueueConfiguration = browserDeepFreeze({
  maximumFrames: 3,
  highWaterMark: 2,
  lowWaterMark: 1,
  overflowPolicy: 'KEEP_LATEST_VIDEO',
  maximumFrameAgeNs: 1_000_000_000n,
  targetLatencyFrames: 1,
  preserveLatestFrame: true,
  releaseDroppedFrames: true,
}) as BrowserQueueConfiguration;
export const DEFAULT_BROWSER_PERMISSION_POLICY: BrowserPermissionPolicy = browserDeepFreeze({
  defaultDecision: 'DENY',
  grants: {},
}) as BrowserPermissionPolicy;

export const validateBrowserViewport = (v: BrowserViewport, maxPixels = 3840 * 2160) => {
  if (!Number.isInteger(v.width) || !Number.isInteger(v.height) || v.width <= 0 || v.height <= 0)
    throw berr('BrowserViewportInvalid', 'Browser viewport dimensions must be positive integers');
  if (v.width * v.height > maxPixels)
    throw berr('BrowserViewportTooLarge', 'Browser viewport exceeds maximum pixel count');
  if (v.deviceScaleFactor <= 0 || v.deviceScaleFactor > 4)
    throw berr('BrowserViewportInvalid', 'Browser viewport scale is invalid');
  return browserDeepFreeze(clone(v)) as BrowserViewport;
};
const isIp = (h: string) => /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':');
const privateHost = (h: string) =>
  h === 'localhost' ||
  h.endsWith('.localhost') ||
  h === '169.254.169.254' ||
  h === 'metadata.google.internal' ||
  /^127\./.test(h) ||
  /^10\./.test(h) ||
  /^192\.168\./.test(h) ||
  /^172\.(1[6-9]|2\d|3[0-1])\./.test(h) ||
  /^169\.254\./.test(h) ||
  h === '::1' ||
  /^fc|^fd|^fe80/i.test(h);
export const evaluateBrowserUrl = (
  raw: string,
  policy: BrowserNavigationPolicy = DEFAULT_BROWSER_NAVIGATION_POLICY,
  baseOrigin?: string,
): BrowserContentReference => {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new BrowserUrlInvalid();
  }
  if (u.username || u.password)
    throw new BrowserUrlInvalid('Credential-bearing browser URLs are rejected');
  const scheme = u.protocol.slice(0, -1).toLowerCase();
  if (!policy.allowedSchemes.includes(scheme) || (!policy.allowHttp && scheme === 'http'))
    throw new BrowserSchemeUnsupported(scheme);
  if (['javascript', 'data', 'blob', 'file', 'chrome', 'about'].includes(scheme))
    throw new BrowserSchemeUnsupported(scheme);
  const host = u.hostname.toLowerCase();
  const origin = u.origin.toLowerCase();
  if (policy.sameOriginOnly && baseOrigin && origin !== baseOrigin)
    throw new BrowserOriginDenied(origin);
  if ((host === 'localhost' || host.endsWith('.localhost')) && !policy.allowLocalhost)
    throw new BrowserPrivateNetworkDenied(host);
  if (privateHost(host) && !policy.allowPrivateNetwork) throw new BrowserPrivateNetworkDenied(host);
  if (isIp(host) && !policy.allowIpLiterals) throw new BrowserPrivateNetworkDenied(host);
  if (!host.includes('.') && !policy.allowInternalHostnames)
    throw new BrowserPrivateNetworkDenied(host);
  if (policy.deniedOrigins.includes(origin)) throw new BrowserOriginDenied(origin);
  if (policy.deniedDomains.some((d) => host === d || host.endsWith(`.${d}`)))
    throw new BrowserOriginDenied(origin);
  if (policy.allowedOrigins.length && !policy.allowedOrigins.includes(origin))
    throw new BrowserOriginDenied(origin);
  if (
    policy.allowedDomains.length &&
    !policy.allowedDomains.some((d) => host === d || host.endsWith(`.${d}`))
  )
    throw new BrowserOriginDenied(origin);
  for (const [k, v] of u.searchParams)
    if (/token|key|password|secret|auth|code/i.test(k) && v)
      throw new BrowserUrlInvalid('Secret-bearing query parameters are rejected');
  return browserDeepFreeze({
    kind: scheme === 'https' ? 'HTTPS_URL' : 'HTTP_URL',
    referenceId: `url-${hash(origin + u.pathname)}`,
    safeUrl: `${origin}${u.pathname}`,
    safeOrigin: origin,
    metadata: {},
  }) as BrowserContentReference;
};
export const createBrowserIdentity = (
  providerId: string,
  category: BrowserSourceCategory,
  displayName: string,
  ref: BrowserContentReference,
  nowNs: bigint = 0n,
): BrowserIdentity => {
  const safeOrigin =
    ref.safeOrigin ?? (ref.kind === 'SYNTHETIC_PAGE' ? 'synthetic://browser' : 'local://asset');
  const stable = `${providerId}:${category}:${ref.referenceId}:${safeOrigin}`;
  return browserDeepFreeze({
    sourceId: `browser-${hash(stable)}`,
    providerId,
    browserProfileId: `profile-${hash(providerId)}`,
    contentReferenceId: ref.referenceId,
    category,
    displayName,
    safeOrigin,
    persistentIdentity: `browser-persistent-${hash(stable)}`,
    sessionIdentity: `browser-session-${hash(stable)}-${nowNs.toString()}`,
    isolationPartitionId: `partition-${hash(stable)}`,
    viewportProfileId: `viewport-${hash(JSON.stringify(DEFAULT_BROWSER_VIEWPORT))}`,
    createdAtNs: nowNs.toString(),
    updatedAtNs: nowNs.toString(),
    tags: [],
    metadata: {},
  }) as BrowserIdentity;
};
export const createBrowserDescriptor = (args: {
  providerId: string;
  category?: BrowserSourceCategory;
  displayName: string;
  contentReference: BrowserContentReference;
  nowNs?: bigint;
  navigationPolicy?: BrowserNavigationPolicy;
  viewport?: BrowserViewport;
  supportsAudio?: boolean;
  supportsInteraction?: boolean;
}): BrowserSourceDescriptor => {
  const viewport = validateBrowserViewport(args.viewport ?? DEFAULT_BROWSER_VIEWPORT);
  const identity = createBrowserIdentity(
    args.providerId,
    args.category ?? 'WEB_PAGE',
    args.displayName,
    args.contentReference,
    args.nowNs ?? 0n,
  );
  return browserDeepFreeze({
    identity,
    providerId: args.providerId,
    category: args.category ?? 'WEB_PAGE',
    displayName: args.displayName,
    contentReference: {
      ...args.contentReference,
      metadata: redactBrowserValue(args.contentReference.metadata) as Record<string, unknown>,
    },
    mediaKinds: args.supportsAudio ? ['AUDIO_VIDEO'] : ['VIDEO'],
    supportedViewports: [viewport],
    defaultViewport: viewport,
    deviceScaleFactor: viewport.deviceScaleFactor,
    preferredFrameRate: viewport.preferredFrameRate,
    supportsTransparentBackground: viewport.transparentBackground,
    supportsBrowserAudio: Boolean(args.supportsAudio),
    supportsInteraction: Boolean(args.supportsInteraction),
    navigationPolicy: args.navigationPolicy ?? DEFAULT_BROWSER_NAVIGATION_POLICY,
    originPolicy: args.navigationPolicy ?? DEFAULT_BROWSER_NAVIGATION_POLICY,
    sessionPolicy: {
      policy:
        args.contentReference.kind === 'SYNTHETIC_PAGE'
          ? 'SYNTHETIC_SESSION'
          : 'EPHEMERAL_ISOLATED',
      storageQuotaBytes: 64 * 1024 * 1024,
      cleanupOnClose: true,
    },
    storagePolicy: {
      policy: 'EPHEMERAL_ISOLATED',
      storageQuotaBytes: 64 * 1024 * 1024,
      cleanupOnClose: true,
    },
    permissionPolicy: DEFAULT_BROWSER_PERMISSION_POLICY,
    reconnectable: true,
    acquisitionMode: 'PUSH',
    clockDomain: 'SYSTEM_MONOTONIC',
    latencyClass: 'LOW',
    metadata: redactBrowserValue(args.contentReference.metadata) as Record<string, unknown>,
  }) as BrowserSourceDescriptor;
};

class BrowserFrameHandleTracker {
  private released = new Set<string>();
  private retained = new Set<string>();
  retain(id: string) {
    if (this.released.has(id))
      throw berr('BrowserOwnershipViolation', 'Cannot retain released browser frame');
    this.retained.add(id);
  }
  release(ref: SourcePayloadRef) {
    if (this.released.has(ref.handleId))
      throw berr('BrowserOwnershipViolation', 'Browser frame double release detected');
    this.retained.delete(ref.handleId);
    this.released.add(ref.handleId);
  }
  retainedCount() {
    return this.retained.size;
  }
}
export class BrowserFrameQueue {
  private frames: BrowserFrameEnvelope[] = [];
  readonly tracker: BrowserFrameHandleTracker;
  private stats = {
    enqueued: 0,
    dequeued: 0,
    droppedOldest: 0,
    droppedNewest: 0,
    droppedStale: 0,
    wrongGeneration: 0,
    rejected: 0,
    highWaterEvents: 0,
    maximumDepth: 0,
  };
  constructor(
    readonly config: BrowserQueueConfiguration = DEFAULT_BROWSER_QUEUE_CONFIG,
    tracker = new BrowserFrameHandleTracker(),
  ) {
    this.tracker = tracker;
    if (config.maximumFrames < 1)
      throw berr('BrowserQueueOverflow', 'Browser frame queue capacity must be positive');
  }
  enqueue(frame: BrowserFrameEnvelope, nav: number, render: number, nowNs: bigint) {
    if (frame.navigationGeneration !== nav || frame.renderGeneration !== render) {
      this.stats.wrongGeneration++;
      this.tracker.release(frame.payload);
      return false;
    }
    if (nowNs - frame.normalizedTimestampNs > this.config.maximumFrameAgeNs) {
      this.stats.droppedStale++;
      this.tracker.release(frame.payload);
      return false;
    }
    if (this.frames.length >= this.config.maximumFrames) {
      if (this.config.overflowPolicy === 'DROP_NEWEST' || this.config.overflowPolicy === 'REJECT') {
        this.stats.droppedNewest++;
        this.tracker.release(frame.payload);
        return false;
      }
      if (this.config.overflowPolicy === 'DROP_OLDEST') {
        const old = this.frames.shift();
        if (old) {
          this.stats.droppedOldest++;
          this.tracker.release(old.payload);
        }
      } else {
        while (this.frames.length) {
          const old = this.frames.shift();
          if (old) {
            this.stats.droppedOldest++;
            this.tracker.release(old.payload);
          }
        }
      }
    }
    this.frames.push(browserDeepFreeze(clone(frame)) as BrowserFrameEnvelope);
    this.tracker.retain(frame.payload.handleId);
    this.stats.enqueued++;
    if (this.frames.length >= this.config.highWaterMark) this.stats.highWaterEvents++;
    this.stats.maximumDepth = Math.max(this.stats.maximumDepth, this.frames.length);
    return true;
  }
  select(tick: FrameTick, nav: number, render: number): BrowserFrameEnvelope | undefined {
    let chosen = -1;
    for (let i = 0; i < this.frames.length; i++) {
      const f = this.frames[i]!;
      if (f.navigationGeneration !== nav || f.renderGeneration !== render) {
        this.stats.wrongGeneration++;
        this.tracker.release(f.payload);
        this.frames.splice(i--, 1);
        continue;
      }
      if (f.presentationTimestampNs <= tick.presentationTimeNs) chosen = i;
    }
    if (chosen < 0) return undefined;
    const [f] = this.frames.splice(chosen, 1);
    this.stats.dequeued++;
    return f;
  }
  clear() {
    for (const f of this.frames) this.tracker.release(f.payload);
    this.frames = [];
  }
  snapshot(nowNs: bigint): BrowserQueueSnapshot {
    const oldest = this.frames[0]?.normalizedTimestampNs;
    return browserDeepFreeze({
      depth: this.frames.length,
      maximumFrames: this.config.maximumFrames,
      ...this.stats,
      oldestFrameAgeNs: oldest ? (nowNs - oldest).toString() : '0',
    }) as BrowserQueueSnapshot;
  }
}

class BoundedBrowserDiagnostics {
  private console: Record<string, unknown>[] = [];
  private network: Record<string, unknown>[] = [];
  private errors: Record<string, unknown>[] = [];
  truncated = 0;
  suppressedDuplicates = 0;
  constructor(private max = 16) {}
  append(kind: 'console' | 'network' | 'errors', value: Record<string, unknown>) {
    const arr = kind === 'console' ? this.console : kind === 'network' ? this.network : this.errors;
    const safe = redactBrowserValue(value) as Record<string, unknown>;
    if (arr.length && JSON.stringify(arr[arr.length - 1]) === JSON.stringify(safe)) {
      this.suppressedDuplicates++;
      return;
    }
    if (arr.length >= this.max) {
      arr.shift();
      this.truncated++;
    }
    arr.push(safe);
  }
  snapshot(): BrowserDiagnosticSummary {
    return browserDeepFreeze({
      consoleMessages: this.console.map((x) => ({ ...x })),
      networkEvents: this.network.map((x) => ({ ...x })),
      errors: this.errors.map((x) => ({ ...x })),
      truncated: this.truncated,
      suppressedDuplicates: this.suppressedDuplicates,
    }) as BrowserDiagnosticSummary;
  }
}

export class SyntheticBrowserRenderBackend implements BrowserRenderBackend {
  readonly backendId = 'synthetic-browser-backend';
  private open = false;
  private active = false;
  private crashes = 0;
  private callbacks:
    | {
        f: BrowserFrameCallback;
        s: BrowserStateChangedCallback;
        c: BrowserConsoleCallback;
        n: BrowserNetworkCallback;
        e: BrowserBackendErrorCallback;
        ctx: BrowserBackendContext;
      }
    | undefined;
  async create(_r: BrowserBackendCreateRequest) {
    this.open = true;
    return { ok: true, browserSessionIdRef: `synthetic-session-${hash(_r.sourceId)}` };
  }
  async navigate(r: BrowserBackendNavigationRequest): Promise<BrowserBackendNavigationResult> {
    if (!this.open) throw berr('BrowserNotOpen', 'Browser backend is not open');
    const page = r.contentReference.syntheticPageId ?? r.contentReference.referenceId;
    if (page.includes('blocked'))
      throw berr('BrowserNavigationBlocked', 'Synthetic navigation blocked');
    if (page.includes('never-ready'))
      return {
        ok: false,
        readinessState: 'TIMEOUT' as const,
        safeOrigin: r.contentReference.safeOrigin ?? 'synthetic://browser',
        redirects: [],
      };
    if (page.includes('redirect-loop'))
      return {
        ok: false,
        readinessState: 'TIMEOUT' as const,
        safeOrigin: r.contentReference.safeOrigin ?? 'synthetic://browser',
        redirects: Array(8).fill('synthetic://redirect'),
      };
    if (page.includes('crash')) {
      this.crashes++;
      return {
        ok: true,
        readinessState: 'FIRST_FRAME' as const,
        safeOrigin: r.contentReference.safeOrigin ?? 'synthetic://browser',
        redirects: [],
      };
    }
    return {
      ok: true,
      readinessState: 'FIRST_FRAME' as const,
      safeOrigin: r.contentReference.safeOrigin ?? 'synthetic://browser',
      redirects: page.includes('redirect') ? ['https://example.com/redirected'] : [],
    };
  }
  async start(
    f: BrowserFrameCallback,
    s: BrowserStateChangedCallback,
    c: BrowserConsoleCallback,
    n: BrowserNetworkCallback,
    e: BrowserBackendErrorCallback,
    ctx: BrowserBackendContext,
  ) {
    this.active = true;
    this.callbacks = { f, s, c, n, e, ctx };
    s('ACTIVE');
  }
  emitFrame(frame: BrowserFrameEnvelope) {
    if (this.active) this.callbacks?.f(frame);
  }
  emitConsole(m: Record<string, unknown>) {
    this.callbacks?.c(m);
  }
  emitNetwork(m: Record<string, unknown>) {
    this.callbacks?.n(m);
  }
  crash() {
    this.active = false;
    this.crashes++;
    this.callbacks?.e(berr('BrowserRenderProcessCrashed', 'Synthetic render process crashed'));
    this.callbacks?.s('CRASHED');
  }
  async stop(_context?: BrowserBackendContext) {
    this.active = false;
  }
  async resize() {}
  async executeInteraction(r: BrowserInteractionRequest, _c?: BrowserBackendContext) {
    if (r.kind === 'javascript' && !r.allowJavaScript)
      throw berr('BrowserJavaScriptExecutionDenied', 'Browser JavaScript execution denied');
    return {
      ok: true,
      code: 'BrowserInteractionExecuted',
      message: 'Browser interaction executed',
      metadata:
        r.kind === 'textInput' ? { kind: 'textInput', text: '<redacted>' } : { kind: r.kind },
    };
  }
  async clearSession() {}
  async close(_c?: BrowserBackendContext) {
    this.open = false;
    this.active = false;
    this.callbacks = undefined;
  }
  getHealth() {
    return {
      backendId: this.backendId,
      healthy: true,
      openInstances: this.open ? 1 : 0,
      activeInstances: this.active ? 1 : 0,
      crashes: this.crashes,
    };
  }
}

export interface BrowserMediaSource extends MediaSource {
  readonly browserDescriptor: BrowserSourceDescriptor;
  open(request: BrowserOpenRequest, context: SourceRuntimeContext): Promise<BrowserOpenResult>;
  navigate(
    request: BrowserNavigationRequest,
    context: SourceRuntimeContext,
  ): Promise<BrowserNavigationResult>;
  startRendering(context: SourceRuntimeContext): Promise<BrowserOperationResult>;
  stopRendering(context: SourceRuntimeContext): Promise<BrowserOperationResult>;
  executeInteraction?(
    request: BrowserInteractionRequest,
    context: SourceRuntimeContext,
  ): Promise<BrowserInteractionResult>;
  close(context: SourceRuntimeContext): Promise<BrowserOperationResult>;
  getBrowserSnapshot(): BrowserSourceSnapshot;
  assertInvariants(): void;
}

const toSourceDescriptor = (d: BrowserSourceDescriptor): SourceDescriptor =>
  browserDeepFreeze({
    id: d.identity.sourceId,
    providerId: d.providerId,
    type: 'BROWSER',
    displayName: d.displayName,
    mediaKinds: d.mediaKinds,
    capabilities: { browser: true, category: d.category, safeOrigin: d.identity.safeOrigin },
    defaultFormat: createSourceVideoFormat({
      id: `${d.identity.sourceId}-video`,
      width: d.defaultViewport.width,
      height: d.defaultViewport.height,
      frameRate: { numerator: d.preferredFrameRate, denominator: 1 },
    }),
    supportedFormats: [
      createSourceVideoFormat({
        id: `${d.identity.sourceId}-video`,
        width: d.defaultViewport.width,
        height: d.defaultViewport.height,
        frameRate: { numerator: d.preferredFrameRate, denominator: 1 },
      }),
    ],
    availability: 'AVAILABLE',
    persistent: true,
    reconnectable: d.reconnectable,
    discoverable: false,
    virtual: d.category === 'SYNTHETIC_BROWSER',
    requiresPermission: false,
    permissionState: 'NOT_REQUIRED',
    supportsVideo: true,
    supportsAudio: d.supportsBrowserAudio,
    supportsMetadata: true,
    supportsSeeking: false,
    supportsLooping: false,
    supportsDynamicFormatChange: true,
    tags: ['browser'],
    estimatedLatencyClass: d.latencyClass,
    clockDomain: d.clockDomain,
    acquisitionMode: d.acquisitionMode,
    metadata: { safeOrigin: d.identity.safeOrigin, browserSource: true },
  }) as unknown as SourceDescriptor;

export class DefaultBrowserMediaSource implements BrowserMediaSource {
  readonly descriptor: SourceDescriptor;
  private pageState: BrowserPageState = 'CREATED';
  private lifecycle = 'REGISTERED';
  private navGen = 0;
  private renderGen = 0;
  private sessionGen = 0;
  private sessionId = 'unopened';
  private viewport: BrowserViewport;
  private currentOrigin: string;
  private renderReady = false;
  private active = false;
  private lastSeq?: bigint;
  private telemetry: Partial<BrowserTelemetrySnapshot> = {};
  private diagnostics = new BoundedBrowserDiagnostics();
  private normalizer = new DeterministicSourceTimestampNormalizer();
  private queue = new BrowserFrameQueue();
  private publishedTicks = new Set<string>();
  constructor(
    readonly browserDescriptor: BrowserSourceDescriptor,
    private backend: BrowserRenderBackend = new SyntheticBrowserRenderBackend(),
    private nowNs: () => bigint = () => 0n,
  ) {
    this.descriptor = toSourceDescriptor(browserDescriptor);
    this.viewport = browserDescriptor.defaultViewport;
    this.currentOrigin = browserDescriptor.identity.safeOrigin;
  }
  private ctx(): BrowserBackendContext {
    return {
      nowNs: this.nowNs,
      sourceId: this.descriptor.id,
      navigationGeneration: this.navGen,
      renderGeneration: this.renderGen,
    };
  }
  async initialize(): Promise<SourceOperationResult> {
    this.lifecycle = 'READY';
    return { ok: true, sourceId: this.descriptor.id, state: 'READY', metadata: {} };
  }
  async connect(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    const r = await this.open({}, c);
    return {
      ok: r.ok,
      sourceId: this.descriptor.id,
      state: this.lifecycle as SourceOperationResult['state'],
      metadata: r.metadata,
    };
  }
  async activate(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    const r = await this.startRendering(c);
    return {
      ok: r.ok,
      sourceId: this.descriptor.id,
      state: this.lifecycle as SourceOperationResult['state'],
      metadata: r.metadata,
    };
  }
  async deactivate(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    const r = await this.stopRendering(c);
    return {
      ok: r.ok,
      sourceId: this.descriptor.id,
      state: this.lifecycle as SourceOperationResult['state'],
      metadata: r.metadata,
    };
  }
  async disconnect(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    const r = await this.close(c);
    return {
      ok: r.ok,
      sourceId: this.descriptor.id,
      state: this.lifecycle as SourceOperationResult['state'],
      metadata: r.metadata,
    };
  }
  async shutdown(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    const r = await this.close(c);
    return { ok: r.ok, sourceId: this.descriptor.id, state: 'STOPPED', metadata: r.metadata };
  }
  async open(req: BrowserOpenRequest, _c: SourceRuntimeContext) {
    if (this.lifecycle === 'CONNECTED' || this.lifecycle === 'ACTIVE')
      return {
        ok: false,
        code: 'BrowserAlreadyOpen',
        message: 'Browser source is already open',
        metadata: {},
      };
    this.viewport = validateBrowserViewport(req.viewport ?? this.browserDescriptor.defaultViewport);
    this.lifecycle = 'CONNECTING';
    const r = await this.backend.create(
      {
        sourceId: this.descriptor.id,
        viewport: this.viewport,
        sessionPartitionId: this.browserDescriptor.identity.isolationPartitionId,
      },
      this.ctx(),
    );
    this.sessionId = r.browserSessionIdRef;
    this.lifecycle = 'CONNECTED';
    this.pageState = 'CREATED';
    return {
      ok: true,
      code: 'BrowserOpened',
      message: 'Browser opened without navigation',
      generation: this.sessionGen,
      metadata: {},
    };
  }
  async navigate(req: BrowserNavigationRequest, _c: SourceRuntimeContext) {
    if (this.lifecycle !== 'CONNECTED' && this.lifecycle !== 'ACTIVE')
      throw berr('BrowserNotOpen', 'Browser source must be open before navigation');
    if (
      req.expectedNavigationGeneration !== undefined &&
      req.expectedNavigationGeneration !== this.navGen
    )
      throw berr('BrowserGenerationMismatch', 'Browser navigation generation mismatch');
    const ref = req.url
      ? evaluateBrowserUrl(req.url, this.browserDescriptor.navigationPolicy, this.currentOrigin)
      : (req.contentReference ?? this.browserDescriptor.contentReference);
    if (ref.safeUrl)
      evaluateBrowserUrl(ref.safeUrl, this.browserDescriptor.navigationPolicy, this.currentOrigin);
    this.navGen++;
    this.renderReady = false;
    this.pageState = 'NAVIGATING';
    this.queue.clear();
    this.normalizer.reset('DISCONTINUITY');
    const result = await this.backend.navigate(
      {
        sourceId: this.descriptor.id,
        contentReference: ref,
        navigationGeneration: this.navGen,
        readinessPolicy: req.readinessPolicy ?? 'FIRST_FRAME',
      },
      this.ctx(),
    );
    if (!result.ok) {
      this.pageState = 'FAILED';
      return {
        ok: false,
        code: 'BrowserRenderNotReady',
        message: 'Browser navigation did not reach render-ready',
        safeOrigin: result.safeOrigin,
        readinessState: result.readinessState,
        generation: this.navGen,
        metadata: { redirects: result.redirects.length },
      };
    }
    if (result.redirects.length > this.browserDescriptor.navigationPolicy.redirectLimit)
      throw berr('BrowserRedirectLimitExceeded', 'Browser redirect limit exceeded');
    this.currentOrigin = result.safeOrigin;
    this.pageState = 'RENDER_READY';
    this.renderReady = true;
    return {
      ok: true,
      code: 'BrowserNavigationCompleted',
      message: 'Browser navigation completed',
      safeOrigin: this.currentOrigin,
      readinessState: result.readinessState,
      generation: this.navGen,
      metadata: { redirects: result.redirects.length },
    };
  }
  async startRendering(_c: SourceRuntimeContext) {
    if (this.lifecycle !== 'CONNECTED' && this.lifecycle !== 'ACTIVE')
      throw berr('BrowserNotOpen', 'Browser source must be open before rendering');
    if (this.active)
      return {
        ok: false,
        code: 'BrowserAlreadyRendering',
        message: 'Browser source is already rendering',
        metadata: {},
      };
    this.lifecycle = 'ACTIVATING';
    await this.backend.start(
      (f) => this.onFrame(f),
      (s) => {
        this.pageState = s;
        if (s === 'CRASHED') this.active = false;
      },
      (m) => this.diagnostics.append('console', m),
      (n) => this.diagnostics.append('network', n),
      (e) => {
        this.diagnostics.append('errors', { code: e.code, message: e.message });
        this.pageState = 'CRASHED';
        this.active = false;
        this.queue.clear();
      },
      this.ctx(),
    );
    this.active = true;
    this.lifecycle = 'ACTIVE';
    return {
      ok: true,
      code: 'BrowserRenderStarted',
      message: 'Browser rendering started',
      generation: this.renderGen,
      metadata: {},
    };
  }
  async stopRendering(_c?: SourceRuntimeContext) {
    if (!this.active)
      return {
        ok: true,
        code: 'BrowserRenderStopped',
        message: 'Browser rendering already stopped',
        metadata: {},
      };
    this.active = false;
    await this.backend.stop(this.ctx());
    this.queue.clear();
    this.lifecycle = 'CONNECTED';
    this.pageState = this.pageState === 'CRASHED' ? 'CRASHED' : 'SUSPENDED';
    return {
      ok: true,
      code: 'BrowserRenderStopped',
      message: 'Browser rendering stopped',
      metadata: {},
    };
  }
  async close(_c?: SourceRuntimeContext) {
    if (this.lifecycle === 'DISCONNECTED')
      return {
        ok: true,
        code: 'BrowserClosed',
        message: 'Browser source already closed',
        metadata: {},
      };
    this.active = false;
    this.renderReady = false;
    this.queue.clear();
    await this.backend.close(this.ctx());
    this.lifecycle = 'DISCONNECTED';
    this.pageState = 'CLOSED';
    return { ok: true, code: 'BrowserClosed', message: 'Browser source closed', metadata: {} };
  }
  async executeInteraction(r: BrowserInteractionRequest, _c?: SourceRuntimeContext) {
    if (!this.browserDescriptor.supportsInteraction)
      throw berr('BrowserInteractionDenied', 'Browser interactions are disabled');
    if (r.kind === 'javascript' && !r.allowJavaScript)
      throw berr('BrowserJavaScriptExecutionDenied', 'Browser JavaScript execution denied');
    if (
      (r.x !== undefined && (r.x < 0 || r.x > this.viewport.width)) ||
      (r.y !== undefined && (r.y < 0 || r.y > this.viewport.height))
    )
      throw berr('BrowserInteractionInvalid', 'Browser interaction coordinate outside viewport');
    return this.backend.executeInteraction
      ? this.backend.executeInteraction(r, this.ctx())
      : {
          ok: true,
          code: 'BrowserInteractionExecuted',
          message: 'Browser interaction executed',
          metadata: { kind: r.kind },
        };
  }
  setViewport(v: BrowserViewport) {
    this.viewport = validateBrowserViewport(v);
    this.renderGen++;
    this.queue.clear();
    this.backend.resize?.(
      { viewport: this.viewport, renderGeneration: this.renderGen },
      this.ctx(),
    );
  }
  private onFrame(frame: BrowserFrameEnvelope) {
    if (!this.active || this.pageState === 'CRASHED' || this.pageState === 'CLOSED') {
      this.queue.tracker.release(frame.payload);
      return;
    }
    const n = this.normalizer.normalize(
      {
        sourceId: this.descriptor.id,
        clockDomain: 'SYSTEM_MONOTONIC',
        timestampNs: frame.sourceTimestampNs,
        sequenceNumber: frame.sequenceNumber,
        discontinuity: frame.discontinuity,
      },
      undefined,
    );
    const normalized = browserDeepFreeze({
      ...frame,
      normalizedTimestampNs: n.normalizedTimestampNs,
      renderGeneration: this.renderGen,
      navigationGeneration: this.navGen,
      ownership: 'OWNED_BY_SOURCE' as const,
    }) as BrowserFrameEnvelope;
    if (this.queue.enqueue(normalized, this.navGen, this.renderGen, this.nowNs()))
      this.lastSeq = frame.sequenceNumber;
  }
  async pull(
    req: { frameNumber: bigint; scheduledTimeNs: bigint },
    _c: SourceRuntimeContext,
  ): Promise<SourceSampleBatch> {
    if (
      !this.active ||
      !this.renderReady ||
      this.pageState === 'CRASHED' ||
      this.pageState === 'CLOSED'
    )
      return { videoFrames: [], audioBuffers: [], metadataSamples: [] };
    const key = req.frameNumber.toString();
    if (this.publishedTicks.has(key))
      return { videoFrames: [], audioBuffers: [], metadataSamples: [] };
    const f = this.queue.select(
      {
        frameNumber: req.frameNumber,
        presentationTimeNs: req.scheduledTimeNs,
        scheduledTimeNs: req.scheduledTimeNs,
      } as FrameTick,
      this.navGen,
      this.renderGen,
    );
    if (!f) return { videoFrames: [], audioBuffers: [], metadataSamples: [] };
    this.publishedTicks.add(key);
    return { videoFrames: [f], audioBuffers: [], metadataSamples: [] };
  }
  getBrowserSnapshot(): BrowserSourceSnapshot {
    return browserDeepFreeze({
      descriptor: this.browserDescriptor,
      health: this.health(),
      queue: this.queue.snapshot(this.nowNs()),
      diagnostics: this.diagnostics.snapshot(),
    }) as BrowserSourceSnapshot;
  }
  private health(): BrowserSourceHealthSnapshot {
    const q = this.queue.snapshot(this.nowNs());
    return browserDeepFreeze({
      sourceId: this.descriptor.id,
      lifecycleState: this.lifecycle,
      pageState: this.pageState,
      healthState:
        this.pageState === 'CRASHED'
          ? 'FAILED'
          : this.active && this.renderReady
            ? 'HEALTHY'
            : this.lifecycle === 'DISCONNECTED'
              ? 'STOPPED'
              : 'UNKNOWN',
      connected: this.lifecycle === 'CONNECTED' || this.lifecycle === 'ACTIVE',
      active: this.active,
      renderReady: this.renderReady,
      available: this.pageState !== 'CRASHED' && this.pageState !== 'FAILED',
      safeCurrentOrigin: this.currentOrigin,
      viewport: this.viewport,
      audioEnabled: false,
      backendId: this.backend.backendId,
      navigationGeneration: this.navGen,
      renderGeneration: this.renderGen,
      lastFrameSequence: this.lastSeq?.toString(),
      queueDepth: q.depth,
      maximumQueueDepth: q.maximumDepth,
      droppedFrames: q.droppedNewest + q.droppedOldest,
      staleFrames: q.droppedStale,
      wrongGenerationFrames: q.wrongGeneration,
      consoleErrorCount: this.getBrowserSnapshotNoRecurse().diagnostics.consoleMessages.length,
      networkFailureCount: this.getBrowserSnapshotNoRecurse().diagnostics.networkEvents.length,
      blockedNavigationCount: 0,
      redirectCount: 0,
      reloadCount: 0,
      renderCrashes: this.pageState === 'CRASHED' ? 1 : 0,
      backendRestarts: 0,
      permissionDenials: 0,
      storageQuotaEvents: 0,
      consecutiveFailures: this.pageState === 'CRASHED' || this.pageState === 'FAILED' ? 1 : 0,
      updatedAtNs: this.nowNs().toString(),
    }) as BrowserSourceHealthSnapshot;
  }
  private getBrowserSnapshotNoRecurse() {
    return { diagnostics: this.diagnostics.snapshot() };
  }
  assertInvariants() {
    const snap = this.getBrowserSnapshot();
    if (snap.queue.depth > snap.queue.maximumFrames)
      throw berr('BrowserInvariantViolation', 'Browser queue exceeded bounds');
    if (
      /super-secret-value|Bearer\s+[^<]|Authorization:\s*Bearer\s+abc|password=|token=abc/i.test(
        JSON.stringify(snap),
      )
    )
      throw berr('BrowserInvariantViolation', 'Browser snapshot leaked secret-bearing metadata');
    if ((this.pageState === 'CLOSED' || this.pageState === 'CRASHED') && snap.queue.depth)
      throw berr('BrowserInvariantViolation', 'Closed or crashed browser retained frames');
  }
}

export interface BrowserSourceProvider extends SourceProvider {
  createBrowserSource(
    descriptor: BrowserSourceDescriptor,
    context: SourceProviderContext,
  ): Promise<BrowserMediaSource>;
  getBackendHealth(): Readonly<BrowserBackendHealthSnapshot>;
}
export class SyntheticBrowserSourceProvider implements BrowserSourceProvider {
  readonly descriptor: SourceProviderDescriptor = browserDeepFreeze({
    id: 'synthetic-browser-provider',
    displayName: 'Synthetic Browser Source Provider',
    version: '5.2.7',
    sourceTypes: ['BROWSER'],
    acquisitionModes: ['PUSH'],
  }) as SourceProviderDescriptor;
  private backend = new SyntheticBrowserRenderBackend();
  constructor(
    private descriptors: BrowserSourceDescriptor[] = [
      createBrowserDescriptor({
        providerId: 'synthetic-browser-provider',
        category: 'SYNTHETIC_BROWSER',
        displayName: 'Synthetic Browser',
        contentReference: {
          kind: 'SYNTHETIC_PAGE',
          referenceId: 'synthetic-static',
          safeOrigin: 'synthetic://browser',
          syntheticPageId: 'static',
          metadata: {},
        },
      }),
    ],
  ) {}
  async discover() {
    return {
      descriptors: this.descriptors.map(toSourceDescriptor),
      unavailable: [],
      warnings: [],
      providerErrors: [],
      durationNs: '0',
      partial: false,
    };
  }
  async createSource(d: SourceDescriptor, c: SourceProviderContext) {
    const bd = this.descriptors.find((x) => x.identity.sourceId === d.id);
    if (!bd) throw berr('BrowserSourceNotFound', 'Browser source descriptor was not found');
    return this.createBrowserSource(bd, c);
  }
  async createBrowserSource(d: BrowserSourceDescriptor, c: SourceProviderContext) {
    return new DefaultBrowserMediaSource(d, this.backend, c.nowNs);
  }
  getBackendHealth() {
    return browserDeepFreeze(this.backend.getHealth()) as BrowserBackendHealthSnapshot;
  }
  async shutdown() {
    await this.backend.close({
      nowNs: () => 0n,
      sourceId: 'provider',
      navigationGeneration: 0,
      renderGeneration: 0,
    });
  }
}

export class BrowserSourceRegistry {
  private providers = new Map<string, BrowserSourceProvider>();
  private sources = new Map<string, BrowserMediaSource>();
  registerProvider(p: BrowserSourceProvider) {
    if (this.providers.has(p.descriptor.id))
      throw berr('DuplicateBrowserProvider', 'Duplicate browser provider', {
        providerId: p.descriptor.id,
      });
    this.providers.set(p.descriptor.id, p);
  }
  async registerSource(
    d: BrowserSourceDescriptor,
    backend?: BrowserRenderBackend,
    nowNs: () => bigint = () => 0n,
  ) {
    if (this.sources.has(d.identity.sourceId))
      throw berr('DuplicateBrowserSource', 'Duplicate browser source', {
        sourceId: d.identity.sourceId,
      });
    const s = new DefaultBrowserMediaSource(d, backend, nowNs);
    this.sources.set(d.identity.sourceId, s);
    return s;
  }
  getSource(id: string) {
    const s = this.sources.get(id);
    if (!s) throw berr('BrowserSourceNotFound', 'Browser source not found', { sourceId: id });
    return s;
  }
  listSnapshots() {
    return [...this.sources.values()]
      .sort((a, b) => a.descriptor.id.localeCompare(b.descriptor.id))
      .map((s) => s.getBrowserSnapshot());
  }
  getTelemetry(): BrowserTelemetrySnapshot {
    const snaps = this.listSnapshots();
    return browserDeepFreeze({
      registeredBrowserSourceCount: snaps.length,
      openBrowserSourceCount: snaps.filter((s) => s.health.connected).length,
      activeBrowserSourceCount: snaps.filter((s) => s.health.active).length,
      renderReadyBrowserSourceCount: snaps.filter((s) => s.health.renderReady).length,
      degradedBrowserSourceCount: snaps.filter((s) => s.health.healthState === 'DEGRADED').length,
      failedBrowserSourceCount: snaps.filter((s) => s.health.healthState === 'FAILED').length,
      crashedBrowserSourceCount: snaps.filter((s) => s.health.pageState === 'CRASHED').length,
      browserAudioSourceCount: snaps.filter((s) => s.descriptor.supportsBrowserAudio).length,
      totalBrowserFramesReceived: snaps.reduce((n, s) => n + s.queue.enqueued, 0),
      totalBrowserFramesPublished: snaps.reduce((n, s) => n + s.queue.dequeued, 0),
      totalBrowserFramesDropped: snaps.reduce((n, s) => n + s.health.droppedFrames, 0),
      totalBrowserFramesStale: snaps.reduce((n, s) => n + s.queue.droppedStale, 0),
      totalBrowserWrongGenerationFrames: snaps.reduce((n, s) => n + s.queue.wrongGeneration, 0),
      totalBrowserNavigations: snaps.reduce((n, s) => n + s.health.navigationGeneration, 0),
      successfulBrowserNavigations: snaps.filter((s) => s.health.renderReady).length,
      failedBrowserNavigations: snaps.filter((s) => s.health.pageState === 'FAILED').length,
      blockedBrowserNavigations: 0,
      totalBrowserRedirects: 0,
      totalBrowserReloads: 0,
      totalBrowserCrashes: snaps.reduce((n, s) => n + s.health.renderCrashes, 0),
      totalBrowserRecoveries: 0,
      totalConsoleErrors: snaps.reduce((n, s) => n + s.diagnostics.consoleMessages.length, 0),
      totalNetworkFailures: snaps.reduce((n, s) => n + s.diagnostics.networkEvents.length, 0),
      totalPermissionDenials: 0,
      totalStorageQuotaEvents: 0,
      totalBrowserQueueOverflows: snaps.reduce((n, s) => n + s.queue.highWaterEvents, 0),
      averageBrowserRenderLatencyNs: '0',
      maximumBrowserRenderLatencyNs: '0',
      averageBrowserNavigationLatencyNs: '0',
      maximumBrowserNavigationLatencyNs: '0',
      maximumBrowserQueueDepth: Math.max(0, ...snaps.map((s) => s.queue.maximumDepth)),
      currentBrowserSourceIds: snaps.map((s) => s.descriptor.identity.sourceId),
      lastBrowserEvent: 'BrowserTelemetrySnapshot',
      browserHealthSummary: snaps.reduce(
        (a, s) => {
          a[s.health.healthState] = (a[s.health.healthState] ?? 0) + 1;
          return a;
        },
        {} as Record<string, number>,
      ),
    }) as BrowserTelemetrySnapshot;
  }
  assertInvariants() {
    for (const s of this.sources.values()) s.assertInvariants();
  }
}
export const createBrowserSourceRegistry = () => new BrowserSourceRegistry();

export const createSyntheticBrowserFrame = (
  source: DefaultBrowserMediaSource,
  seq: bigint,
  ts: bigint,
  overrides: Partial<BrowserFrameEnvelope> = {},
): BrowserFrameEnvelope => {
  const snap = source.getBrowserSnapshot();
  const fmt = source.descriptor.defaultFormat as SourceVideoFormat;
  const payload: SourcePayloadRef = {
    handleId: `browser-frame-${snap.health.sourceId}-${seq}`,
    kind: 'OPAQUE_TEST_HANDLE',
    release: 'SOURCE',
  };
  return browserDeepFreeze({
    sourceId: snap.health.sourceId,
    streamId: `${snap.health.sourceId}:video`,
    browserSessionIdRef: 'synthetic-session-ref',
    navigationGeneration: snap.health.navigationGeneration,
    renderGeneration: snap.health.renderGeneration,
    sequenceNumber: seq,
    sourceTimestampNs: ts,
    normalizedTimestampNs: ts,
    presentationTimestampNs: ts,
    durationNs: 33_333_333n,
    viewport: snap.health.viewport,
    contentSize: { width: snap.health.viewport.width, height: snap.health.viewport.height },
    scrollOffset: { x: 0, y: 0 },
    transparentBackground: snap.health.viewport.transparentBackground,
    pageReadyState: snap.health.pageState,
    currentSafeOrigin: snap.health.safeCurrentOrigin,
    discontinuity: false,
    corrupted: false,
    droppedBefore: 0,
    captureReceivedAtNs: ts,
    backendId: snap.health.backendId,
    payload,
    ownership: 'OWNED_BY_BACKEND',
    format: fmt,
    keyFrame: true,
    memoryDomain: 'OPAQUE',
    metadata: { safeOrigin: snap.health.safeCurrentOrigin },
    ...overrides,
  }) as BrowserFrameEnvelope;
};
