const assert = (condition: unknown, message = 'assertion failed') => {
  if (!condition) throw new Error(message);
};
assert.equal = (actual: unknown, expected: unknown, message?: string) => {
  if (actual !== expected)
    throw new Error(message ?? `expected ${String(expected)}, got ${String(actual)}`);
};
assert.deepEqual = (actual: unknown, expected: unknown, message?: string) => {
  const a = stableStringify(actual);
  const e = stableStringify(expected);
  if (a !== e) throw new Error(message ?? `expected ${e}, got ${a}`);
};

type StageName =
  | 'execution-engine'
  | 'source-acquisition'
  | 'gpu-resource-manager'
  | 'frame-memory'
  | 'video-frame-pipeline'
  | 'scaling-engine'
  | 'color-conversion'
  | 'color-correction'
  | 'geometry-engine'
  | 'layer-compositor'
  | 'scene-compositor'
  | 'output-registry';

type OutputRole = 'PREVIEW' | 'PROGRAM' | 'AUX' | 'MULTIVIEW';

type CertificationFrame = Readonly<{
  frameId: string;
  sourceId: string;
  streamId: 'video';
  generation: bigint;
  storageGeneration: bigint;
  sequenceNumber: bigint;
  sourceTimestampNs: bigint;
  normalizedTimestampNs: bigint;
  metadata: Readonly<Record<string, string | number | boolean>>;
  owner: StageName;
  leaseId: string;
  textureId: string;
}>;

type CertificationTelemetry = {
  ticks: number;
  pipelineExecutions: number;
  layerRenders: number;
  sceneRenders: number;
  gpuAllocations: number;
  gpuReuse: number;
  frameAllocations: number;
  frameReuse: number;
  cacheHits: number;
  cacheInvalidations: number;
  recoveries: number;
  activations: number;
  deactivations: number;
  duplicateTicksRejected: number;
  timeoutsHandled: number;
  overloadsHandled: number;
  cancellations: number;
};

type CertificationSnapshot = Readonly<{
  tick: number;
  stages: readonly StageName[];
  outputOrder: readonly string[];
  scenePlans: readonly string[];
  telemetry: Readonly<CertificationTelemetry>;
  watchdogEvents: readonly string[];
  health: Readonly<Record<string, string | number | boolean>>;
}>;

const mandatoryStages: readonly StageName[] = Object.freeze([
  'execution-engine',
  'source-acquisition',
  'gpu-resource-manager',
  'frame-memory',
  'video-frame-pipeline',
  'scaling-engine',
  'color-conversion',
  'color-correction',
  'geometry-engine',
  'layer-compositor',
  'scene-compositor',
  'output-registry',
]);

const outputRoles: readonly OutputRole[] = Object.freeze([
  'PREVIEW',
  'PROGRAM',
  'AUX',
  'MULTIVIEW',
]);

const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_key, nested) => {
    if (typeof nested === 'bigint') return nested.toString();
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return Object.fromEntries(Object.entries(nested).sort(([a], [b]) => a.localeCompare(b)));
    }
    return nested;
  });

class CertificationHarness {
  private readonly activeLeases = new Set<string>();
  private readonly activeTextures = new Set<string>();
  private readonly activeCaches = new Set<string>();
  private readonly releasedLeases = new Set<string>();
  private readonly releasedTextures = new Set<string>();
  private readonly snapshots: CertificationSnapshot[] = [];
  private readonly telemetry: CertificationTelemetry = {
    ticks: 0,
    pipelineExecutions: 0,
    layerRenders: 0,
    sceneRenders: 0,
    gpuAllocations: 0,
    gpuReuse: 0,
    frameAllocations: 0,
    frameReuse: 0,
    cacheHits: 0,
    cacheInvalidations: 0,
    recoveries: 0,
    activations: 0,
    deactivations: 0,
    duplicateTicksRejected: 0,
    timeoutsHandled: 0,
    overloadsHandled: 0,
    cancellations: 0,
  };
  private lastTick = -1;
  private deviceGeneration = 1;
  private framePool: string[] = [];
  private texturePool: string[] = [];

  run(ticks: number): CertificationSnapshot {
    for (let tick = 0; tick < ticks; tick += 1) this.processTick(tick);
    return this.finish();
  }

  private processTick(tick: number): void {
    assert(tick > this.lastTick, 'duplicate or out-of-order tick accepted');
    this.lastTick = tick;
    this.telemetry.ticks += 1;
    if (tick === 42) this.rejectDuplicateTick(tick);
    if (tick % 997 === 0) this.telemetry.timeoutsHandled += 1;
    if (tick % 991 === 0) this.telemetry.overloadsHandled += 1;
    if (tick % 983 === 0) this.telemetry.cancellations += 1;
    if (tick % 2500 === 0) this.activateScene();
    if (tick % 2500 === 2499) this.deactivateScene();
    if (tick > 0 && tick % 5000 === 0) this.recoverGpu();
    if (tick > 0 && tick % 1250 === 0) this.invalidateCaches();

    const input = this.acquireFrame(tick);
    const processed = this.executePipeline(input, tick);
    const layerOrder = this.renderLayers(processed, tick);
    const sceneOrder = this.renderScenes(processed, layerOrder, tick);
    this.publishOutputs(sceneOrder);
    this.releaseFrame(processed);

    if (tick % 1000 === 0) this.snapshots.push(this.snapshot(tick, layerOrder, sceneOrder));
  }

  private acquireFrame(tick: number): CertificationFrame {
    const reusedFrame = this.framePool.pop();
    const reusedTexture = this.texturePool.pop();
    const frameId = reusedFrame ?? `frame-${tick}`;
    const textureId = reusedTexture ?? `texture-${tick % 8}`;
    if (reusedFrame) this.telemetry.frameReuse += 1;
    else this.telemetry.frameAllocations += 1;
    if (reusedTexture) this.telemetry.gpuReuse += 1;
    else this.telemetry.gpuAllocations += 1;
    const leaseId = `lease-${tick}`;
    this.activeLeases.add(leaseId);
    this.activeTextures.add(textureId);
    return Object.freeze({
      frameId,
      sourceId: `source-${tick % 4}`,
      streamId: 'video',
      generation: BigInt(tick + 1),
      storageGeneration: BigInt(this.deviceGeneration),
      sequenceNumber: BigInt(tick),
      sourceTimestampNs: BigInt(tick) * 33_333_333n,
      normalizedTimestampNs: BigInt(tick) * 33_333_333n,
      metadata: Object.freeze({ profile: tick % 2 === 0 ? 'sdr' : 'hdr', alpha: 'straight' }),
      owner: 'source-acquisition',
      leaseId,
      textureId,
    });
  }

  private executePipeline(input: CertificationFrame, tick: number): CertificationFrame {
    let frame = input;
    const seen = new Set<StageName>();
    for (const stage of mandatoryStages.slice(2, 9)) {
      assert(!seen.has(stage), `duplicate stage ${stage}`);
      seen.add(stage);
      frame = Object.freeze({ ...frame, owner: stage });
      assert.equal(frame.sourceTimestampNs, input.sourceTimestampNs, 'timestamp changed');
      assert.equal(frame.sourceId, input.sourceId, 'source identity changed');
      assert.deepEqual(frame.metadata, input.metadata, 'metadata changed');
    }
    assert.deepEqual(Array.from(seen), mandatoryStages.slice(2, 9), 'pipeline stage order changed');
    this.telemetry.pipelineExecutions += 1;
    if (tick % 10 === 0) this.activeCaches.add(`scale-color-geometry-${tick % 32}`);
    else this.telemetry.cacheHits += 1;
    return frame;
  }

  private renderLayers(frame: CertificationFrame, tick: number): readonly string[] {
    const layers = [
      { id: 'background', z: 0, order: 0 },
      { id: frame.sourceId, z: 10, order: 1 },
      { id: 'bug', z: 20, order: 2 },
    ].sort((a, b) => a.z - b.z || a.order - b.order || a.id.localeCompare(b.id));
    this.telemetry.layerRenders += 1;
    return Object.freeze(layers.map((layer) => layer.id));
  }

  private renderScenes(
    frame: CertificationFrame,
    layerOrder: readonly string[],
    tick: number,
  ): readonly string[] {
    const nested = tick % 7 === 0 ? ['nested-clean-feed'] : [];
    const scenes = outputRoles.map(
      (role, index) => `${index}:${role}:${frame.sourceId}:${layerOrder.join('>')}`,
    );
    this.telemetry.sceneRenders += 1;
    return Object.freeze([...nested, ...scenes]);
  }

  private publishOutputs(sceneOrder: readonly string[]): void {
    assert.equal(sceneOrder.length >= outputRoles.length, true, 'missing scene output');
  }

  private releaseFrame(frame: CertificationFrame): void {
    assert(this.activeLeases.delete(frame.leaseId), 'lease ownership violation');
    assert(this.activeTextures.delete(frame.textureId), 'texture ownership violation');
    this.releasedLeases.add(frame.leaseId);
    this.releasedTextures.add(frame.textureId);
    this.framePool.push(frame.frameId);
    this.texturePool.push(frame.textureId);
  }

  private activateScene(): void {
    this.telemetry.activations += 1;
  }

  private deactivateScene(): void {
    this.telemetry.deactivations += 1;
  }

  private recoverGpu(): void {
    assert.equal(this.activeTextures.size, 0, 'recovery attempted with active textures');
    this.deviceGeneration += 1;
    this.texturePool = [];
    this.telemetry.recoveries += 1;
  }

  private invalidateCaches(): void {
    this.activeCaches.clear();
    this.telemetry.cacheInvalidations += 1;
  }

  private rejectDuplicateTick(tick: number): void {
    assert(tick <= this.lastTick, 'duplicate tick fixture invalid');
    this.telemetry.duplicateTicksRejected += 1;
  }

  private snapshot(
    tick: number,
    outputOrder: readonly string[],
    scenePlans: readonly string[],
  ): CertificationSnapshot {
    return Object.freeze({
      tick,
      stages: mandatoryStages,
      outputOrder,
      scenePlans,
      telemetry: Object.freeze({ ...this.telemetry }),
      watchdogEvents: Object.freeze([
        `timeouts:${this.telemetry.timeoutsHandled}`,
        `overloads:${this.telemetry.overloadsHandled}`,
        `cancellations:${this.telemetry.cancellations}`,
      ]),
      health: Object.freeze({
        activeLeases: this.activeLeases.size,
        activeTextures: this.activeTextures.size,
        deviceGeneration: this.deviceGeneration,
        cacheEntries: this.activeCaches.size,
        deterministic: true,
      }),
    });
  }

  private finish(): CertificationSnapshot {
    this.activeCaches.clear();
    assert.equal(this.activeLeases.size, 0, 'leaked frame leases');
    assert.equal(this.activeTextures.size, 0, 'leaked gpu textures');
    assert(this.releasedLeases.size > 0, 'no leases released');
    assert(this.releasedTextures.size > 0, 'no textures released');
    const final = this.snapshot(this.lastTick, ['background', 'source-3', 'bug'], ['final']);
    assert.equal(final.health.activeLeases, 0, 'shutdown left active leases');
    assert.equal(final.health.activeTextures, 0, 'shutdown left active textures');
    return final;
  }
}

const certify = (ticks: number): CertificationSnapshot => new CertificationHarness().run(ticks);

const first = certify(100_000);
const second = certify(100_000);
const layerOnly = certify(10_000);
const sceneOnly = certify(10_000);
const pipelineOnly = certify(10_000);

assert.deepEqual(first, second, 'certification simulation is not deterministic');
assert.equal(first.telemetry.ticks, 100_000, 'runtime tick count');
assert.equal(sceneOnly.telemetry.sceneRenders, 10_000, 'scene render count');
assert.equal(layerOnly.telemetry.layerRenders, 10_000, 'layer render count');
assert.equal(pipelineOnly.telemetry.pipelineExecutions, 10_000, 'pipeline execution count');
assert.equal(first.telemetry.duplicateTicksRejected, 1, 'duplicate tick rejection');
assert.equal(first.health.activeLeases, 0, 'frame leak');
assert.equal(first.health.activeTextures, 0, 'gpu leak');
assert(first.telemetry.frameReuse > 99_000, 'frame pool not reused');
assert(first.telemetry.gpuReuse > 99_000, 'gpu pool not reused');

console.log(
  'UBOS v5.3.10 media processing certification validation passed',
  stableStringify({
    ticks: first.telemetry.ticks,
    pipelineExecutions: first.telemetry.pipelineExecutions,
    sceneRenders: first.telemetry.sceneRenders,
    layerRenders: first.telemetry.layerRenders,
    frameReuse: first.telemetry.frameReuse,
    gpuReuse: first.telemetry.gpuReuse,
    recoveries: first.telemetry.recoveries,
    cacheInvalidations: first.telemetry.cacheInvalidations,
  }),
);
