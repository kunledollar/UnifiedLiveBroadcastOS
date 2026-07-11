export type GpuApi = 'Mock' | 'Direct3D12' | 'Vulkan' | 'Metal' | 'OpenGL' | 'WebGPU';
export type GpuResourceState =
  'UNINITIALIZED' | 'ALLOCATED' | 'READY' | 'IN_USE' | 'PENDING_RELEASE' | 'RELEASED' | 'LOST';
export type GpuFormat =
  'RGBA8' | 'BGRA8' | 'RGBA16F' | 'RGBA32F' | 'NV12' | 'P010' | 'YUV420' | 'YUV422';
export type GpuMemoryKind = 'GPU' | 'CPU_VISIBLE' | 'SHARED' | 'UPLOAD_HEAP' | 'READBACK_HEAP';
export type GpuTextureUsage =
  | 'VIDEO'
  | 'INTERMEDIATE'
  | 'FRAMEBUFFER'
  | 'DEPTH'
  | 'RENDER_TARGET'
  | 'SAMPLED'
  | 'UPLOAD'
  | 'READBACK';
export type GpuPoolKind =
  | 'videoTextures'
  | 'intermediateTextures'
  | 'framebuffers'
  | 'depthBuffers'
  | 'uploadBuffers'
  | 'readbackBuffers'
  | 'commandAllocators'
  | 'descriptorHeaps';

export interface GpuAdapterInfo {
  readonly id: string;
  readonly api: GpuApi;
  readonly name: string;
  readonly dedicatedMemoryBytes: number;
  readonly software: boolean;
}
export interface TextureDescriptor {
  readonly width: number;
  readonly height: number;
  readonly format: GpuFormat;
  readonly usage: readonly GpuTextureUsage[];
  readonly mipLevels: number;
  readonly sampleCount: number;
  readonly colorSpace: 'SRGB' | 'REC709' | 'REC2020' | 'DISPLAY_P3' | 'LINEAR';
  readonly memory: GpuMemoryKind;
}
export interface BufferDescriptor {
  readonly byteLength: number;
  readonly usage: 'UPLOAD' | 'READBACK' | 'STAGING' | 'COMMAND' | 'DESCRIPTOR';
  readonly memory: GpuMemoryKind;
}
export interface FramebufferDescriptor {
  readonly width: number;
  readonly height: number;
  readonly format: GpuFormat;
  readonly sampleCount: number;
}
export interface PipelineDescriptor {
  readonly id: string;
  readonly label: string;
  readonly stages: readonly string[];
}
export interface SamplerDescriptor {
  readonly filter: 'NEAREST' | 'LINEAR';
  readonly addressMode: 'CLAMP' | 'REPEAT';
}
export interface RenderTargetDescriptor extends FramebufferDescriptor {
  readonly colorSpace: TextureDescriptor['colorSpace'];
}
export type ResourceDescriptor =
  | TextureDescriptor
  | BufferDescriptor
  | FramebufferDescriptor
  | PipelineDescriptor
  | SamplerDescriptor
  | RenderTargetDescriptor;
export interface GpuTextureMetadata extends TextureDescriptor {
  readonly timestampNs: bigint;
  readonly generation: number;
}
export interface ResourceHandle<T extends ResourceDescriptor = ResourceDescriptor> {
  readonly id: string;
  readonly pool: GpuPoolKind;
  readonly descriptor: T;
  readonly state: GpuResourceState;
  readonly generation: number;
  readonly refCount: number;
  readonly ownerFrameId?: number;
  readonly leased: boolean;
  readonly bytes: number;
}
export interface FrameContext {
  readonly frameId: number;
  readonly commandList: ResourceHandle<BufferDescriptor>;
  readonly temporaryTextures: readonly ResourceHandle<TextureDescriptor>[];
  readonly uploadSpace: ResourceHandle<BufferDescriptor>;
  readonly fenceValue: number;
}
export interface GpuFence {
  readonly id: string;
  readonly completedValue: number;
  readonly signaledValue: number;
}
export interface GpuQueue {
  readonly id: string;
  readonly submitted: number;
  readonly fence: GpuFence;
}
export interface GpuDeviceSnapshot {
  readonly initialized: boolean;
  readonly lost: boolean;
  readonly adapter?: GpuAdapterInfo;
  readonly queue: GpuQueue;
}
export interface GpuBackend {
  enumerateAdapters(): readonly GpuAdapterInfo[];
  createDevice(adapter: GpuAdapterInfo): GpuDeviceSnapshot;
  resetDevice(): GpuDeviceSnapshot;
  shutdown(): void;
}
export interface GpuResourcePool {
  readonly kind: GpuPoolKind;
  readonly capacity: number;
  readonly leased: number;
  readonly available: number;
}
export interface GpuHealthTelemetry {
  allocatedTextures: number;
  peakTextures: number;
  gpuMemoryBytes: number;
  poolUsage: Record<GpuPoolKind, { capacity: number; leased: number; available: number }>;
  failedAllocations: number;
  resourceReuse: number;
  lostResources: number;
  frameUploads: number;
  textureReuse: number;
  gpuUtilizationEstimate: number;
  uploadLatencyNs: bigint;
  poolPressure: number;
  memoryUsageBytes: number;
  allocationFailures: number;
  recoveryEvents: number;
  watchdogEvents: readonly string[];
}
export interface VideoFrameImport {
  readonly mode: 'IMPORTED' | 'COPIED' | 'SHARED' | 'EXTERNAL_HANDLE' | 'SYNTHETIC';
  readonly width: number;
  readonly height: number;
  readonly format: GpuFormat;
  readonly timestampNs: bigint;
  readonly externalHandle?: string;
}

const bytesPerPixel: Record<GpuFormat, number> = {
  RGBA8: 4,
  BGRA8: 4,
  RGBA16F: 8,
  RGBA32F: 16,
  NV12: 2,
  P010: 2,
  YUV420: 2,
  YUV422: 2,
};
const poolKinds: readonly GpuPoolKind[] = [
  'videoTextures',
  'intermediateTextures',
  'framebuffers',
  'depthBuffers',
  'uploadBuffers',
  'readbackBuffers',
  'commandAllocators',
  'descriptorHeaps',
];
const clone = <T>(value: T): T => Object.freeze({ ...(value as object) }) as T;

export class MockGpuBackend implements GpuBackend {
  private lost = false;
  enumerateAdapters(): readonly GpuAdapterInfo[] {
    return [
      {
        id: 'mock-adapter:0',
        api: 'Mock',
        name: 'UBOS deterministic mock GPU',
        dedicatedMemoryBytes: 512 * 1024 * 1024,
        software: true,
      },
    ];
  }
  createDevice(adapter: GpuAdapterInfo): GpuDeviceSnapshot {
    this.lost = false;
    return {
      initialized: true,
      lost: false,
      adapter,
      queue: {
        id: 'mock-queue:graphics',
        submitted: 0,
        fence: { id: 'mock-fence:graphics', completedValue: 0, signaledValue: 0 },
      },
    };
  }
  resetDevice(): GpuDeviceSnapshot {
    return this.createDevice(this.enumerateAdapters()[0]!);
  }
  loseDevice() {
    this.lost = true;
  }
  shutdown(): void {
    this.lost = true;
  }
}

export class GpuResourceManager {
  private device: GpuDeviceSnapshot = {
    initialized: false,
    lost: false,
    queue: {
      id: 'queue:none',
      submitted: 0,
      fence: { id: 'fence:none', completedValue: 0, signaledValue: 0 },
    },
  };
  private seq = 0;
  private fence = 0;
  private pools = new Map<GpuPoolKind, ResourceHandle[]>();
  private leased = new Map<string, ResourceHandle>();
  private generations = new Map<string, number>();
  private watchdogEvents: string[] = [];
  private telemetry = {
    allocatedTextures: 0,
    peakTextures: 0,
    gpuMemoryBytes: 0,
    failedAllocations: 0,
    resourceReuse: 0,
    lostResources: 0,
    frameUploads: 0,
    textureReuse: 0,
    gpuUtilizationEstimate: 0,
    uploadLatencyNs: 0n,
    allocationFailures: 0,
    recoveryEvents: 0,
  };
  constructor(
    private readonly backend: GpuBackend = new MockGpuBackend(),
    private readonly capacities: Record<GpuPoolKind, number> = {
      videoTextures: 16,
      intermediateTextures: 16,
      framebuffers: 8,
      depthBuffers: 4,
      uploadBuffers: 8,
      readbackBuffers: 4,
      commandAllocators: 8,
      descriptorHeaps: 4,
    },
  ) {
    for (const k of poolKinds) this.pools.set(k, []);
  }
  enumerateAdapters() {
    return this.backend.enumerateAdapters();
  }
  initialize(adapterId = this.enumerateAdapters()[0]?.id) {
    const adapter = this.enumerateAdapters().find((a) => a.id === adapterId);
    if (!adapter) throw new Error('GpuAdapterNotFound');
    this.device = this.backend.createDevice(adapter);
    return this.snapshotDevice();
  }
  shutdown() {
    for (const id of [...this.leased.keys()]) this.release(id);
    this.backend.shutdown();
    this.device = { ...this.device, initialized: false, lost: true };
  }
  reset() {
    this.telemetry.recoveryEvents++;
    this.device = this.backend.resetDevice();
    for (const item of this.leased.values()) this.markLost(item.id);
    return this.snapshotDevice();
  }
  recover() {
    return this.reset();
  }
  allocateTexture(
    descriptor: TextureDescriptor,
    pool: GpuPoolKind = 'videoTextures',
    ownerFrameId?: number,
  ) {
    return this.allocate(descriptor, pool, ownerFrameId);
  }
  allocateBuffer(
    descriptor: BufferDescriptor,
    pool: GpuPoolKind = 'uploadBuffers',
    ownerFrameId?: number,
  ) {
    return this.allocate(descriptor, pool, ownerFrameId);
  }
  importVideoFrame(frame: VideoFrameImport, ownerFrameId: number) {
    const texture = this.allocateTexture(
      {
        width: frame.width,
        height: frame.height,
        format: frame.format,
        usage: ['VIDEO', 'SAMPLED'],
        mipLevels: 1,
        sampleCount: 1,
        colorSpace: 'REC709',
        memory: frame.mode === 'COPIED' ? 'GPU' : 'SHARED',
      },
      'videoTextures',
      ownerFrameId,
    );
    this.telemetry.frameUploads++;
    this.telemetry.uploadLatencyNs += frame.mode === 'SYNTHETIC' ? 0n : 1_000n;
    return texture;
  }
  createFrameContext(frameId: number): FrameContext {
    const commandList = this.allocateBuffer(
      { byteLength: 4096, usage: 'COMMAND', memory: 'CPU_VISIBLE' },
      'commandAllocators',
      frameId,
    );
    const uploadSpace = this.allocateBuffer(
      { byteLength: 1024 * 1024, usage: 'UPLOAD', memory: 'UPLOAD_HEAP' },
      'uploadBuffers',
      frameId,
    );
    return { frameId, commandList, temporaryTextures: [], uploadSpace, fenceValue: ++this.fence };
  }
  submitFrame(ctx: FrameContext) {
    this.device = {
      ...this.device,
      queue: {
        ...this.device.queue,
        submitted: this.device.queue.submitted + 1,
        fence: { ...this.device.queue.fence, signaledValue: ctx.fenceValue },
      },
    };
  }
  signalFence(value = this.device.queue.fence.signaledValue) {
    this.device = {
      ...this.device,
      queue: { ...this.device.queue, fence: { ...this.device.queue.fence, completedValue: value } },
    };
  }
  release(id: string) {
    const h = this.leased.get(id);
    if (!h) {
      this.watchdogEvents.push(`Invalid ownership release ${id}`);
      throw new Error('GpuDoubleReleaseOrUnknownResource');
    }
    const { ownerFrameId: _ownerFrameId, ...rest } = h;
    const released = { ...rest, state: 'READY' as const, leased: false, refCount: 0 };
    this.leased.delete(id);
    this.pools.get(h.pool)!.push(released);
  }
  validateInvariants() {
    const errors: string[] = [];
    for (const [id, h] of this.leased) {
      if (!h.leased || h.refCount !== 1) errors.push(`Invalid leased handle ${id}`);
      if ((this.generations.get(id) ?? 0) !== h.generation) errors.push(`Stale generation ${id}`);
    }
    for (const k of poolKinds)
      if (this.leasedByPool(k) > this.capacities[k]) errors.push(`Pool exhaustion ${k}`);
    return { valid: errors.length === 0, errors, watchdogEvents: [...this.watchdogEvents] };
  }
  getTelemetry(): GpuHealthTelemetry {
    const poolUsage = Object.fromEntries(
      poolKinds.map((k) => [
        k,
        {
          capacity: this.capacities[k],
          leased: this.leasedByPool(k),
          available: this.pools.get(k)!.length,
        },
      ]),
    ) as GpuHealthTelemetry['poolUsage'];
    const poolPressure = Math.max(
      ...poolKinds.map((k) => this.leasedByPool(k) / this.capacities[k]),
    );
    return {
      ...this.telemetry,
      poolUsage,
      poolPressure,
      memoryUsageBytes: this.telemetry.gpuMemoryBytes,
      gpuUtilizationEstimate: Math.min(1, poolPressure),
      allocationFailures: this.telemetry.failedAllocations,
      watchdogEvents: [...this.watchdogEvents],
    };
  }
  snapshotDevice() {
    return clone(this.device);
  }
  private allocate<T extends ResourceDescriptor>(
    descriptor: T,
    pool: GpuPoolKind,
    ownerFrameId?: number,
  ): ResourceHandle<T> {
    if (!this.device.initialized || this.device.lost) throw new Error('GpuDeviceNotReady');
    const free = this.pools
      .get(pool)!
      .findIndex((h) => JSON.stringify(h.descriptor) === JSON.stringify(descriptor));
    let handle: ResourceHandle<T>;
    if (free >= 0) {
      handle = this.pools.get(pool)!.splice(free, 1)[0]! as ResourceHandle<T>;
      this.telemetry.resourceReuse++;
      if (pool === 'videoTextures') this.telemetry.textureReuse++;
    } else {
      if (this.leasedByPool(pool) + this.pools.get(pool)!.length >= this.capacities[pool]) {
        this.telemetry.failedAllocations++;
        this.watchdogEvents.push(`Pool exhaustion ${pool}`);
        throw new Error('GpuPoolExhausted');
      }
      const bytes =
        'width' in descriptor && 'height' in descriptor && 'format' in descriptor
          ? descriptor.width * descriptor.height * bytesPerPixel[descriptor.format]
          : 'byteLength' in descriptor
            ? descriptor.byteLength
            : 0;
      const id = `gpu:${pool}:${++this.seq}`;
      const generation = (this.generations.get(id) ?? 0) + 1;
      this.generations.set(id, generation);
      handle = {
        id,
        pool,
        descriptor: clone(descriptor),
        state: 'ALLOCATED',
        generation,
        refCount: 0,
        leased: false,
        bytes,
      };
      this.telemetry.gpuMemoryBytes += bytes;
      if (pool === 'videoTextures') this.telemetry.allocatedTextures++;
      this.telemetry.peakTextures = Math.max(
        this.telemetry.peakTextures,
        this.telemetry.allocatedTextures,
      );
    }
    const generation = (this.generations.get(handle.id) ?? handle.generation) + 1;
    this.generations.set(handle.id, generation);
    const leased = {
      ...handle,
      state: 'IN_USE' as const,
      generation,
      refCount: 1,
      leased: true,
      ...(ownerFrameId !== undefined ? { ownerFrameId } : {}),
    };
    this.leased.set(leased.id, leased);
    return clone(leased);
  }
  private leasedByPool(pool: GpuPoolKind) {
    return [...this.leased.values()].filter((h) => h.pool === pool).length;
  }
  private markLost(id: string) {
    const h = this.leased.get(id);
    if (h) {
      this.leased.set(id, { ...h, state: 'LOST' });
      this.telemetry.lostResources++;
    }
  }
}

export const createGpuResourceManager = (
  backend?: GpuBackend,
  capacities?: Record<GpuPoolKind, number>,
) => new GpuResourceManager(backend, capacities);
export const describeTextureMetadata = (
  descriptor: TextureDescriptor,
  timestampNs: bigint,
  generation: number,
): GpuTextureMetadata => Object.freeze({ ...descriptor, timestampNs, generation });
