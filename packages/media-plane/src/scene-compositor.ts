import {
  RuntimeEngineError,
  type RuntimeCommand,
  type RuntimeCommandHandler,
  type FrameTick,
  type ProcessorInitializationContext,
  type ProcessorRuntimeContext,
  type ProcessorShutdownContext,
  type ProcessorTickResult,
  type TickProcessor,
  type TickProcessorDescriptor,
} from './execution-engine.js';
import type { FrameMemoryManager } from './frame-memory.js';
import type { GpuResourceManager } from './gpu-resource-manager.js';
import {
  createLayerCompositor,
  type LayerBackgroundDescriptor,
  type LayerCompositionCanvas,
  type LayerCompositionRequest,
  type LayerCompositionResult,
  type LayerCompositor,
  type LayerDescriptor,
  type LayerRect,
} from './layer-compositor.js';
import type { VideoPipelineFrameReference } from './video-frame-pipeline.js';

type JsonSafe =
  | string
  | number
  | boolean
  | null
  | readonly JsonSafe[]
  | { readonly [key: string]: JsonSafe };

const redactKey = /token|secret|password|credential|cookie|url|path|handle|pointer|native|device/i;
const nowDefault = () => BigInt(Date.now()) * 1_000_000n;
const DEFAULT_REGISTRY_LIMIT = 10_000;
const DEFAULT_EVENT_LIMIT = 512;

const safe = (value: unknown, depth = 0): JsonSafe => {
  if (depth > 4) return '[Truncated]';
  if (value === null || typeof value === 'boolean') return value;
  if (value === undefined) return '[Undefined]';
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') return value.length > 256 ? `${value.slice(0, 256)}…` : value;
  if (Array.isArray(value)) return value.slice(0, 64).map((item) => safe(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 64)
        .map(([key, child]) => [key, redactKey.test(key) ? '[REDACTED]' : safe(child, depth + 1)]),
    );
  }
  return String(value);
};

export const deepFreezeSceneCompositor = <T>(value: T): Readonly<T> => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreezeSceneCompositor(child);
    }
  }
  return value as Readonly<T>;
};

const cloneFreeze = <T>(value: T): Readonly<T> => deepFreezeSceneCompositor(structuredClone(value));

const stableHash = (input: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
};

const deterministicId = (prefix: string, parts: readonly unknown[]): string =>
  `${prefix}:${stableHash(parts.map((part) => JSON.stringify(safe(part))).join('|'))}`;

export type SceneOutputRole =
  | 'PREVIEW'
  | 'PROGRAM'
  | 'AUX'
  | 'CLEAN_FEED'
  | 'MULTIVIEW'
  | 'CUSTOM';
export type SceneOutputAspect = 'HORIZONTAL' | 'VERTICAL' | 'SQUARE' | 'CUSTOM';
export type SceneBindingKind = 'SOURCE' | 'NESTED_SCENE' | 'PLACEHOLDER';
export type SceneActivationState =
  | 'REGISTERED'
  | 'INACTIVE'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DESTROYED';
export type SceneHealthState = 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'STOPPED';
export type SceneBackgroundPolicy = 'TRANSPARENT' | 'OPAQUE_BLACK' | 'OPAQUE_WHITE' | 'CANVAS_DEFAULT';
export type SceneMissingSourcePolicy = 'FAIL_REQUIRED' | 'SKIP_OPTIONAL' | 'BACKGROUND' | 'HOLD_LAST_VALID';
export type SceneFrozenSourcePolicy = 'ALLOW' | 'SKIP_OPTIONAL' | 'FAIL_REQUIRED' | 'HOLD_LAST_VALID';
export type SceneRenderStatus = 'PLANNED' | 'PASSED_THROUGH' | 'COMPLETED' | 'BACKGROUND_ONLY' | 'EMPTY' | 'DEGRADED' | 'FAILED' | 'REJECTED';

export type SceneDependencyKind =
  | 'SOURCE_ACQUISITION'
  | 'FRAME_MEMORY'
  | 'GPU_RESOURCE_MANAGER'
  | 'VIDEO_FRAME_PIPELINE'
  | 'SCALING_ENGINE'
  | 'COLOR_CONVERSION'
  | 'COLOR_CORRECTION'
  | 'GEOMETRY_ENGINE'
  | 'LAYER_COMPOSITOR';

export interface SceneIdentity {
  readonly sceneId: string;
  readonly collectionId: string;
  readonly templateId?: string;
  readonly variantId?: string;
  readonly stableId: string;
  readonly version: bigint;
  readonly generation: bigint;
}

export interface SceneBinding {
  readonly bindingId: string;
  readonly kind: SceneBindingKind;
  readonly sourceId?: string;
  readonly streamId?: string;
  readonly nestedSceneId?: string;
  readonly role: string;
  readonly order: number;
  readonly zIndex: number;
  readonly required: boolean;
  readonly enabled: boolean;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}

export interface SceneOutputProfile {
  readonly outputProfileId: string;
  readonly role: SceneOutputRole;
  readonly aspect: SceneOutputAspect;
  readonly order: number;
  readonly canvas?: Readonly<LayerCompositionCanvas>;
  readonly registryKey: string;
  readonly cleanFeed: boolean;
  readonly multiview: boolean;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}

export interface SceneDefinition {
  readonly identity: SceneIdentity;
  readonly displayName: string;
  readonly bindings: readonly SceneBinding[];
  readonly outputProfiles: readonly SceneOutputProfile[];
  readonly dependencyKinds: readonly SceneDependencyKind[];
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}

export interface SceneCollection {
  readonly collectionId: string;
  readonly displayName: string;
  readonly order: number;
  readonly generation: bigint;
  readonly sceneIds: readonly string[];
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}

export interface SceneTemplate {
  readonly templateId: string;
  readonly collectionId?: string;
  readonly displayName: string;
  readonly generation: bigint;
  readonly defaultBindings: readonly SceneBinding[];
  readonly defaultOutputProfiles: readonly SceneOutputProfile[];
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}

export interface SceneVariant {
  readonly variantId: string;
  readonly sceneId: string;
  readonly templateId?: string;
  readonly displayName: string;
  readonly generation: bigint;
  readonly bindingOverrides: readonly SceneBinding[];
  readonly outputProfileOverrides: readonly SceneOutputProfile[];
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}

export interface SceneInstance {
  readonly instanceId: string;
  readonly sceneId: string;
  readonly role: SceneOutputRole;
  readonly activationState: SceneActivationState;
  readonly generation: bigint;
  readonly createdAtNs: bigint;
  readonly updatedAtNs: bigint;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}

export interface SceneValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly orderedBindingIds: readonly string[];
  readonly orderedOutputProfileIds: readonly string[];
  readonly dependencyKinds: readonly SceneDependencyKind[];
}


export interface SceneDependencyGraphNode {
  readonly sceneId: string;
  readonly generation: bigint;
  readonly nestedSceneIds: readonly string[];
  readonly depth: number;
}

export interface SceneDependencyGraph {
  readonly rootSceneId: string;
  readonly nodes: readonly Readonly<SceneDependencyGraphNode>[];
  readonly orderedSceneIds: readonly string[];
  readonly maxDepth: number;
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly dependencyGenerations: Readonly<Record<string, string>>;
  readonly deterministicKey: string;
}

export interface SceneParameterOverride {
  readonly targetId: string;
  readonly parameter: string;
  readonly value: JsonSafe;
}

export interface SceneSourceFrameState {
  readonly sourceId: string;
  readonly streamId: string;
  readonly frame?: Readonly<VideoPipelineFrameReference>;
  readonly frozen?: boolean;
  readonly missing?: boolean;
}

export interface SceneRenderRequest {
  readonly requestId: string;
  readonly sceneId: string;
  readonly outputProfileId: string;
  readonly runtimeFrameNumber: bigint;
  readonly frameTick: Readonly<Record<string, unknown>>;
  readonly expectedSceneGeneration?: bigint;
  readonly maxNestedDepth?: number;
  readonly sources: readonly Readonly<SceneSourceFrameState>[];
  readonly parameterOverrides?: readonly Readonly<SceneParameterOverride>[];
  readonly backgroundPolicy: SceneBackgroundPolicy;
  readonly missingSourcePolicy: SceneMissingSourcePolicy;
  readonly frozenSourcePolicy: SceneFrozenSourcePolicy;
  readonly pipelineConfigurationGeneration: bigint;
}

export interface SceneRenderContext {
  readonly nowNs: () => bigint;
  readonly frameMemory?: FrameMemoryManager;
  readonly gpuResourceManager?: GpuResourceManager;
  readonly layerCompositor?: LayerCompositor;
}

export interface SceneRenderPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly sceneId: string;
  readonly outputProfile: Readonly<SceneOutputProfile>;
  readonly dependencyGraph: Readonly<SceneDependencyGraph>;
  readonly orderedSceneIds: readonly string[];
  readonly orderedBindingIds: readonly string[];
  readonly layerRequest: Readonly<LayerCompositionRequest>;
  readonly passThrough: boolean;
  readonly backgroundPolicy: SceneBackgroundPolicy;
  readonly missingSourcePolicy: SceneMissingSourcePolicy;
  readonly frozenSourcePolicy: SceneFrozenSourcePolicy;
  readonly dependencyGenerations: Readonly<Record<string, string>>;
  readonly warnings: readonly string[];
  readonly deterministicKey: string;
}

export interface SceneRenderResult {
  readonly requestId: string;
  readonly planId: string;
  readonly status: SceneRenderStatus;
  readonly outputProfileId: string;
  readonly role: SceneOutputRole;
  readonly aspect: SceneOutputAspect;
  readonly passThrough: boolean;
  readonly layerResult?: Readonly<LayerCompositionResult>;
  readonly outputFrame?: Readonly<VideoPipelineFrameReference>;
  readonly frameIdentity?: Readonly<Record<string, JsonSafe>>;
  readonly warnings: readonly string[];
  readonly completedAtNs: string;
}

export interface ScenePublishedOutput {
  readonly outputKey: string;
  readonly profileId: string;
  readonly sceneId: string;
  readonly status: SceneRenderStatus;
  readonly frameIdentity?: Readonly<Record<string, JsonSafe>>;
  readonly generation: bigint;
  readonly publishedAtNs: bigint;
}


export type SceneProcessorOverloadPolicy = 'SKIP_WHEN_OVERLOADED' | 'RENDER_ANYWAY' | 'FAIL_WHEN_OVERLOADED';
export type SceneProcessorFailurePolicy = 'DEGRADE' | 'FAIL' | 'SKIP';

export interface SceneProcessorOptions {
  readonly compositor?: SceneCompositor;
  readonly layerCompositor?: LayerCompositor;
  readonly frameMemory?: FrameMemoryManager;
  readonly gpuResourceManager?: GpuResourceManager;
  readonly budgetNs?: bigint;
  readonly timeoutNs?: bigint;
  readonly overloadPolicy?: SceneProcessorOverloadPolicy;
  readonly failurePolicy?: SceneProcessorFailurePolicy;
  readonly maximumQueueDepth?: number;
}

export interface SceneProcessorTickSummary {
  readonly tickFrameNumber: string;
  readonly status: 'IDLE' | 'RENDERED' | 'SKIPPED' | 'FAILED' | 'TIMED_OUT';
  readonly requestId?: string;
  readonly outputKey?: string;
  readonly durationNs: string;
  readonly queueDepth: number;
}

export interface SceneCompositorHealthSnapshot {
  readonly healthState: SceneHealthState;
  readonly registeredScenes: number;
  readonly registeredCollections: number;
  readonly registeredTemplates: number;
  readonly registeredVariants: number;
  readonly liveInstances: number;
  readonly activeInstances: number;
  readonly suspendedInstances: number;
  readonly failedValidationCount: number;
  readonly lifecycleErrorCount: number;
  readonly registryPressure: boolean;
  readonly lastIncident?: string;
}

export interface SceneCompositorTelemetrySnapshot {
  readonly sceneRegistrations: number;
  readonly collectionRegistrations: number;
  readonly templateRegistrations: number;
  readonly variantRegistrations: number;
  readonly sceneUpdates: number;
  readonly atomicCommits: number;
  readonly instanceCreates: number;
  readonly instanceDestroys: number;
  readonly activations: number;
  readonly deactivations: number;
  readonly suspends: number;
  readonly resumes: number;
  readonly validationFailures: number;
  readonly lifecycleFailures: number;
  readonly generationRejections: number;
  readonly dependencyRejections: number;
  readonly registryEvictions: number;
  readonly planCacheInvalidations: number;
  readonly renderPlans: number;
  readonly renders: number;
  readonly publications: number;
  readonly releasedLeases: number;
  readonly lastEvent?: string;
  readonly lastEventAtNs?: string;
}

export interface SceneCompositorSnapshot {
  readonly engineState: 'READY' | 'SHUTDOWN';
  readonly scenes: readonly Readonly<SceneDefinition>[];
  readonly collections: readonly Readonly<SceneCollection>[];
  readonly templates: readonly Readonly<SceneTemplate>[];
  readonly variants: readonly Readonly<SceneVariant>[];
  readonly instances: readonly Readonly<SceneInstance>[];
  readonly publishedOutputs: readonly Readonly<ScenePublishedOutput>[];
  readonly health: Readonly<SceneCompositorHealthSnapshot>;
  readonly telemetry: Readonly<SceneCompositorTelemetrySnapshot>;
  readonly recentEvents: readonly JsonSafe[];
  readonly containsPixels: false;
  readonly containsRuntimeHandles: false;
}

export interface SceneCompositorOptions {
  readonly nowNs?: () => bigint;
  readonly registryLimit?: number;
  readonly eventHistoryLimit?: number;
  readonly frameMemory?: FrameMemoryManager;
  readonly gpuResourceManager?: GpuResourceManager;
  readonly layerCompositor?: LayerCompositor;
  readonly planCacheLimit?: number;
  readonly maxNestedDepth?: number;
}

export interface SceneCompositor {
  createSceneIdentity(input: {
    readonly sceneId?: string;
    readonly collectionId: string;
    readonly templateId?: string;
    readonly variantId?: string;
    readonly version?: bigint;
  }): Readonly<SceneIdentity>;
  registerCollection(collection: SceneCollection): Readonly<SceneCollection>;
  registerTemplate(template: SceneTemplate): Readonly<SceneTemplate>;
  registerVariant(variant: SceneVariant): Readonly<SceneVariant>;
  registerScene(scene: SceneDefinition): Readonly<SceneDefinition>;
  validateScene(scene: SceneDefinition): Readonly<SceneValidationReport>;
  updateScene(scene: SceneDefinition, expectedGeneration: bigint): Readonly<SceneDefinition>;
  commitSceneUpdate(scene: SceneDefinition, expectedGeneration: bigint): Readonly<SceneDefinition>;
  createSceneInstance(input: {
    readonly sceneId: string;
    readonly role: SceneOutputRole;
    readonly instanceId?: string;
    readonly metadata?: Readonly<Record<string, JsonSafe>>;
  }): Readonly<SceneInstance>;
  destroySceneInstance(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance>;
  activateScene(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance>;
  deactivateScene(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance>;
  suspendScene(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance>;
  resumeScene(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance>;
  buildDependencyGraph(sceneId: string, maxDepth?: number): Readonly<SceneDependencyGraph>;
  createRenderPlan(request: SceneRenderRequest): Readonly<SceneRenderPlan>;
  renderScene(request: SceneRenderRequest, context?: SceneRenderContext): Promise<Readonly<SceneRenderResult>>;
  publishSceneOutput(result: SceneRenderResult): Readonly<ScenePublishedOutput>;
  getSnapshot(): Readonly<SceneCompositorSnapshot>;
  getHealthSnapshot(): Readonly<SceneCompositorHealthSnapshot>;
  assertInvariants(): void;
  shutdown(): Promise<void>;
}

export const SCENE_COMPOSITOR_COMMAND_TYPES = [
  'SCENE_REGISTER_COLLECTION',
  'SCENE_REGISTER_TEMPLATE',
  'SCENE_REGISTER_VARIANT',
  'SCENE_REGISTER',
  'SCENE_UPDATE',
  'SCENE_COMMIT_ATOMIC',
  'SCENE_INSTANCE_CREATE',
  'SCENE_INSTANCE_DESTROY',
  'SCENE_ACTIVATE',
  'SCENE_DEACTIVATE',
  'SCENE_SUSPEND',
  'SCENE_RESUME',
  'SCENE_VALIDATE',
  'SCENE_PLAN_RENDER',
  'SCENE_RENDER',
  'SCENE_PUBLISH_OUTPUT',
] as const;

export const SCENE_COMPOSITOR_OUTPUT_KEYS = Object.freeze({
  preview: 'scene.preview',
  program: 'scene.program',
  aux: 'scene.aux',
  cleanFeed: 'scene.cleanFeed',
  multiview: 'scene.multiview',
  horizontal: 'scene.horizontal',
  vertical: 'scene.vertical',
  square: 'scene.square',
  health: 'scene.health',
  snapshots: 'scene.snapshots',
});

export const SCENE_COMPOSITOR_EVENTS = Object.freeze([
  'SceneCollectionRegistered',
  'SceneTemplateRegistered',
  'SceneVariantRegistered',
  'SceneRegistered',
  'SceneUpdated',
  'SceneCommittedAtomically',
  'SceneInstanceCreated',
  'SceneInstanceDestroyed',
  'SceneActivated',
  'SceneDeactivated',
  'SceneSuspended',
  'SceneResumed',
  'SceneValidationFailed',
  'SceneProcessorTick',
  'SceneOutputPublished',
] as const);

export const SCENE_COMPOSITOR_WATCHDOG_INCIDENTS = Object.freeze([
  'SCENE_REGISTRY_PRESSURE',
  'SCENE_DUPLICATE_ID',
  'SCENE_VALIDATION_FAILED',
  'SCENE_DEPENDENCY_INVALID',
  'SCENE_STALE_GENERATION',
  'SCENE_LIFECYCLE_INVALID',
  'SCENE_INVARIANT_FAILURE',
  'SCENE_PROCESSOR_TIMEOUT',
  'SCENE_PROCESSOR_OVERLOAD',
  'SCENE_GPU_LOSS',
  'SCENE_LEASE_LEAK',
] as const);

export class SceneCompositorError extends RuntimeEngineError {}

const sceneError = (code: string, message: string, details: Record<string, unknown> = {}) =>
  new SceneCompositorError(code, message, details);

const orderedBindings = (bindings: readonly SceneBinding[]) =>
  [...bindings].sort(
    (a, b) =>
      a.zIndex - b.zIndex ||
      a.order - b.order ||
      a.role.localeCompare(b.role) ||
      a.bindingId.localeCompare(b.bindingId),
  );

const orderedProfiles = (profiles: readonly SceneOutputProfile[]) =>
  [...profiles].sort(
    (a, b) => a.order - b.order || a.role.localeCompare(b.role) || a.outputProfileId.localeCompare(b.outputProfileId),
  );

const bumpInstance = (
  instance: Readonly<SceneInstance>,
  activationState: SceneActivationState,
  nowNs: bigint,
): Readonly<SceneInstance> =>
  cloneFreeze({
    ...instance,
    activationState,
    generation: instance.generation + 1n,
    updatedAtNs: nowNs,
  });

export class DefaultSceneCompositor implements SceneCompositor {
  private readonly scenes = new Map<string, Readonly<SceneDefinition>>();
  private readonly collections = new Map<string, Readonly<SceneCollection>>();
  private readonly templates = new Map<string, Readonly<SceneTemplate>>();
  private readonly variants = new Map<string, Readonly<SceneVariant>>();
  private readonly instances = new Map<string, Readonly<SceneInstance>>();
  private readonly planCache = new Map<string, Readonly<SceneRenderPlan>>();
  private readonly publishedOutputs = new Map<string, Readonly<ScenePublishedOutput>>();
  private readonly events: JsonSafe[] = [];
  private activeFrameMemory: FrameMemoryManager | undefined;
  private engineState: 'READY' | 'SHUTDOWN' = 'READY';
  private healthState: SceneHealthState = 'HEALTHY';
  private lastIncident: string | undefined;
  private readonly registryLimit: number;
  private readonly eventHistoryLimit: number;
  private readonly planCacheLimit: number;
  private readonly maxNestedDepth: number;
  private telemetry: SceneCompositorTelemetrySnapshot = deepFreezeSceneCompositor({
    sceneRegistrations: 0,
    collectionRegistrations: 0,
    templateRegistrations: 0,
    variantRegistrations: 0,
    sceneUpdates: 0,
    atomicCommits: 0,
    instanceCreates: 0,
    instanceDestroys: 0,
    activations: 0,
    deactivations: 0,
    suspends: 0,
    resumes: 0,
    validationFailures: 0,
    lifecycleFailures: 0,
    generationRejections: 0,
    dependencyRejections: 0,
    registryEvictions: 0,
    planCacheInvalidations: 0,
    renderPlans: 0,
    renders: 0,
    publications: 0,
    releasedLeases: 0,
  });

  constructor(private readonly options: SceneCompositorOptions = {}) {
    this.registryLimit = options.registryLimit ?? DEFAULT_REGISTRY_LIMIT;
    this.eventHistoryLimit = options.eventHistoryLimit ?? DEFAULT_EVENT_LIMIT;
    this.planCacheLimit = options.planCacheLimit ?? DEFAULT_REGISTRY_LIMIT;
    this.maxNestedDepth = options.maxNestedDepth ?? 8;
  }

  createSceneIdentity(input: {
    readonly sceneId?: string;
    readonly collectionId: string;
    readonly templateId?: string;
    readonly variantId?: string;
    readonly version?: bigint;
  }): Readonly<SceneIdentity> {
    const sceneId =
      input.sceneId ?? deterministicId('scene', [input.collectionId, input.templateId, input.variantId]);
    return cloneFreeze({
      sceneId,
      collectionId: input.collectionId,
      ...(input.templateId ? { templateId: input.templateId } : {}),
      ...(input.variantId ? { variantId: input.variantId } : {}),
      stableId: deterministicId('scene-stable', [input.collectionId, input.templateId, input.variantId, sceneId]),
      version: input.version ?? 1n,
      generation: 1n,
    });
  }

  registerCollection(collection: SceneCollection): Readonly<SceneCollection> {
    this.ensureReady();
    this.ensureCapacity(this.collections, 'collection');
    if (this.collections.has(collection.collectionId)) {
      throw sceneError('DuplicateSceneCollection', `Duplicate collection ${collection.collectionId}`);
    }
    const frozen = cloneFreeze(collection);
    this.collections.set(collection.collectionId, frozen);
    this.note('SceneCollectionRegistered', { collectionId: collection.collectionId }, 'collectionRegistrations');
    return frozen;
  }

  registerTemplate(template: SceneTemplate): Readonly<SceneTemplate> {
    this.ensureReady();
    this.ensureCapacity(this.templates, 'template');
    if (this.templates.has(template.templateId)) {
      throw sceneError('DuplicateSceneTemplate', `Duplicate template ${template.templateId}`);
    }
    if (template.collectionId && !this.collections.has(template.collectionId)) {
      this.rejectDependency(`missing collection ${template.collectionId}`);
    }
    const frozen = cloneFreeze(template);
    this.templates.set(template.templateId, frozen);
    this.note('SceneTemplateRegistered', { templateId: template.templateId }, 'templateRegistrations');
    return frozen;
  }

  registerVariant(variant: SceneVariant): Readonly<SceneVariant> {
    this.ensureReady();
    this.ensureCapacity(this.variants, 'variant');
    if (this.variants.has(variant.variantId)) {
      throw sceneError('DuplicateSceneVariant', `Duplicate variant ${variant.variantId}`);
    }
    if (!this.scenes.has(variant.sceneId)) {
      this.rejectDependency(`missing scene ${variant.sceneId}`);
    }
    if (variant.templateId && !this.templates.has(variant.templateId)) {
      this.rejectDependency(`missing template ${variant.templateId}`);
    }
    const frozen = cloneFreeze(variant);
    this.variants.set(variant.variantId, frozen);
    this.note('SceneVariantRegistered', { variantId: variant.variantId }, 'variantRegistrations');
    return frozen;
  }

  registerScene(scene: SceneDefinition): Readonly<SceneDefinition> {
    this.ensureReady();
    this.ensureCapacity(this.scenes, 'scene');
    if (this.scenes.has(scene.identity.sceneId)) {
      throw sceneError('DuplicateScene', `Duplicate scene ${scene.identity.sceneId}`);
    }
    this.assertSceneValid(scene);
    const frozen = this.normalizeScene(scene);
    this.scenes.set(scene.identity.sceneId, frozen);
    this.invalidatePlanCache(scene.identity.sceneId);
    this.note('SceneRegistered', { sceneId: scene.identity.sceneId }, 'sceneRegistrations');
    return frozen;
  }

  validateScene(scene: SceneDefinition): Readonly<SceneValidationReport> {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!scene.identity.sceneId) errors.push('sceneId is required');
    if (!scene.identity.collectionId) errors.push('collectionId is required');
    if (!this.collections.has(scene.identity.collectionId)) {
      errors.push(`collection ${scene.identity.collectionId} is not registered`);
    }
    if (scene.identity.templateId && !this.templates.has(scene.identity.templateId)) {
      errors.push(`template ${scene.identity.templateId} is not registered`);
    }
    if (scene.identity.variantId && !this.variants.has(scene.identity.variantId)) {
      warnings.push(`variant ${scene.identity.variantId} is not registered yet`);
    }
    const bindingIds = new Set<string>();
    for (const binding of scene.bindings) {
      if (bindingIds.has(binding.bindingId)) errors.push(`duplicate binding ${binding.bindingId}`);
      bindingIds.add(binding.bindingId);
      if (binding.kind === 'SOURCE' && !binding.sourceId) errors.push(`source binding ${binding.bindingId} has no sourceId`);
      if (binding.kind === 'NESTED_SCENE') {
        if (!binding.nestedSceneId) errors.push(`nested binding ${binding.bindingId} has no nestedSceneId`);
        if (binding.nestedSceneId === scene.identity.sceneId) errors.push('scene cannot directly nest itself');
        if (binding.nestedSceneId && !this.scenes.has(binding.nestedSceneId)) {
          errors.push(`nested scene ${binding.nestedSceneId} is not registered`);
        }
      }
      if (!Number.isInteger(binding.order) || !Number.isInteger(binding.zIndex)) {
        errors.push(`binding ${binding.bindingId} order and zIndex must be integers`);
      }
    }
    const outputIds = new Set<string>();
    for (const output of scene.outputProfiles) {
      if (outputIds.has(output.outputProfileId)) errors.push(`duplicate output profile ${output.outputProfileId}`);
      outputIds.add(output.outputProfileId);
      if (!output.registryKey.startsWith('scene.')) {
        errors.push(`output profile ${output.outputProfileId} registryKey must use scene.* namespace`);
      }
    }
    if (scene.outputProfiles.length === 0) warnings.push('scene has no output profiles');
    const report = cloneFreeze({
      valid: errors.length === 0,
      errors,
      warnings,
      orderedBindingIds: orderedBindings(scene.bindings).map((binding) => binding.bindingId),
      orderedOutputProfileIds: orderedProfiles(scene.outputProfiles).map((profile) => profile.outputProfileId),
      dependencyKinds: [...scene.dependencyKinds].sort(),
    });
    if (!report.valid) this.countValidationFailure(errors.join('; '));
    return report;
  }

  updateScene(scene: SceneDefinition, expectedGeneration: bigint): Readonly<SceneDefinition> {
    this.ensureReady();
    const current = this.requireScene(scene.identity.sceneId);
    this.requireGeneration(current.identity.generation, expectedGeneration, 'SceneGenerationMismatch');
    this.assertSceneValid(scene);
    const next = this.normalizeScene({
      ...scene,
      identity: { ...scene.identity, generation: current.identity.generation + 1n },
    });
    this.scenes.set(scene.identity.sceneId, next);
    this.invalidatePlanCache(scene.identity.sceneId);
    this.note('SceneUpdated', { sceneId: scene.identity.sceneId }, 'sceneUpdates');
    return next;
  }

  commitSceneUpdate(scene: SceneDefinition, expectedGeneration: bigint): Readonly<SceneDefinition> {
    const committed = this.updateScene(scene, expectedGeneration);
    this.note('SceneCommittedAtomically', { sceneId: scene.identity.sceneId }, 'atomicCommits');
    return committed;
  }

  createSceneInstance(input: {
    readonly sceneId: string;
    readonly role: SceneOutputRole;
    readonly instanceId?: string;
    readonly metadata?: Readonly<Record<string, JsonSafe>>;
  }): Readonly<SceneInstance> {
    this.ensureReady();
    this.ensureCapacity(this.instances, 'instance');
    this.requireScene(input.sceneId);
    const instanceId = input.instanceId ?? deterministicId('scene-instance', [input.sceneId, input.role]);
    if (this.instances.has(instanceId)) throw sceneError('DuplicateSceneInstance', `Duplicate instance ${instanceId}`);
    const nowNs = this.now();
    const instance = cloneFreeze({
      instanceId,
      sceneId: input.sceneId,
      role: input.role,
      activationState: 'INACTIVE' as const,
      generation: 1n,
      createdAtNs: nowNs,
      updatedAtNs: nowNs,
      metadata: safe(input.metadata ?? {}) as Readonly<Record<string, JsonSafe>>,
    });
    this.instances.set(instanceId, instance);
    this.note('SceneInstanceCreated', { instanceId, sceneId: input.sceneId }, 'instanceCreates');
    return instance;
  }

  destroySceneInstance(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance> {
    const instance = this.requireInstance(instanceId);
    this.requireGeneration(instance.generation, expectedGeneration, 'SceneInstanceGenerationMismatch');
    if (instance.activationState === 'DESTROYED') {
      this.rejectLifecycle(instance, 'DESTROYED');
    }
    const next = bumpInstance(instance, 'DESTROYED', this.now());
    this.instances.set(instanceId, next);
    this.note('SceneInstanceDestroyed', { instanceId }, 'instanceDestroys');
    return next;
  }

  activateScene(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance> {
    return this.transitionInstance(instanceId, expectedGeneration, ['INACTIVE', 'SUSPENDED'], 'ACTIVE', 'activations', 'SceneActivated');
  }

  deactivateScene(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance> {
    return this.transitionInstance(instanceId, expectedGeneration, ['ACTIVE', 'SUSPENDED'], 'INACTIVE', 'deactivations', 'SceneDeactivated');
  }

  suspendScene(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance> {
    return this.transitionInstance(instanceId, expectedGeneration, ['ACTIVE'], 'SUSPENDED', 'suspends', 'SceneSuspended');
  }

  resumeScene(instanceId: string, expectedGeneration: bigint): Readonly<SceneInstance> {
    return this.transitionInstance(instanceId, expectedGeneration, ['SUSPENDED'], 'ACTIVE', 'resumes', 'SceneResumed');
  }


  buildDependencyGraph(sceneId: string, maxDepth = this.maxNestedDepth): Readonly<SceneDependencyGraph> {
    const errors: string[] = [];
    const nodes: SceneDependencyGraphNode[] = [];
    const ordered: string[] = [];
    const generations: Record<string, string> = {};
    const visit = (id: string, depth: number, stack: readonly string[]): void => {
      const scene = this.scenes.get(id);
      if (!scene) {
        errors.push(`missing scene ${id}`);
        return;
      }
      if (stack.includes(id)) {
        errors.push(`cycle detected ${[...stack, id].join('>')}`);
        return;
      }
      if (depth > maxDepth) {
        errors.push(`nesting depth exceeded at ${id}`);
        return;
      }
      generations[id] = scene.identity.generation.toString();
      const nestedSceneIds = orderedBindings(scene.bindings)
        .filter((binding) => binding.kind === 'NESTED_SCENE' && binding.nestedSceneId)
        .map((binding) => binding.nestedSceneId!)
        .sort();
      nodes.push({ sceneId: id, generation: scene.identity.generation, nestedSceneIds, depth });
      for (const nested of nestedSceneIds) visit(nested, depth + 1, [...stack, id]);
      if (!ordered.includes(id)) ordered.push(id);
    };
    visit(sceneId, 0, []);
    const deterministicKey = deterministicId('scene-dag', [sceneId, ordered, generations, maxDepth]);
    return cloneFreeze({
      rootSceneId: sceneId,
      nodes: nodes.sort((a, b) => a.depth - b.depth || a.sceneId.localeCompare(b.sceneId)),
      orderedSceneIds: ordered,
      maxDepth,
      valid: errors.length === 0,
      errors,
      dependencyGenerations: generations,
      deterministicKey,
    });
  }

  createRenderPlan(request: SceneRenderRequest): Readonly<SceneRenderPlan> {
    this.ensureReady();
    const scene = this.requireScene(request.sceneId);
    this.requireGenerationIfPresent(scene.identity.generation, request.expectedSceneGeneration, 'SceneGenerationMismatch');
    const graph = this.buildDependencyGraph(request.sceneId, request.maxNestedDepth ?? this.maxNestedDepth);
    if (!graph.valid) throw sceneError('SceneDependencyGraphInvalid', graph.errors.join('; '));
    const profile = scene.outputProfiles.find((item) => item.outputProfileId === request.outputProfileId);
    if (!profile) throw sceneError('SceneOutputProfileNotFound', `Output profile ${request.outputProfileId} was not found`);
    if (!profile.canvas) throw sceneError('SceneOutputProfileCanvasMissing', `Output profile ${request.outputProfileId} has no canvas`);
    const cacheKey = deterministicId('scene-render-plan', [request, graph.deterministicKey]);
    const cached = this.planCache.get(cacheKey);
    if (cached) return cached;
    const warnings: string[] = [];
    const layers: LayerDescriptor[] = [];
    const sourceMap = new Map(request.sources.map((source) => [`${source.sourceId}:${source.streamId}`, source]));
    for (const currentSceneId of graph.orderedSceneIds) {
      const current = this.requireScene(currentSceneId);
      for (const binding of orderedBindings(this.applyOverrides(current.bindings, request.parameterOverrides ?? []))) {
        if (!binding.enabled || binding.kind !== 'SOURCE') continue;
        const source = sourceMap.get(`${binding.sourceId}:${binding.streamId ?? 'video'}`);
        if (!source?.frame || source.missing) {
          if (binding.required && request.missingSourcePolicy === 'FAIL_REQUIRED') {
            throw sceneError('SceneRequiredSourceMissing', `Required source ${binding.sourceId} is missing`);
          }
          warnings.push(`missing:${binding.bindingId}`);
          continue;
        }
        if (source.frozen && request.frozenSourcePolicy === 'FAIL_REQUIRED' && binding.required) {
          throw sceneError('SceneRequiredSourceFrozen', `Required source ${binding.sourceId} is frozen`);
        }
        if (source.frozen && request.frozenSourcePolicy === 'SKIP_OPTIONAL' && !binding.required) {
          warnings.push(`frozen-skipped:${binding.bindingId}`);
          continue;
        }
        layers.push(this.layerFromBinding(binding, source.frame, profile.canvas));
      }
    }
    const background = this.backgroundFor(request.backgroundPolicy, profile.canvas.background);
    const layerRequest: LayerCompositionRequest = cloneFreeze({
      requestId: `scene:${request.requestId}`,
      runtimeFrameNumber: request.runtimeFrameNumber,
      frameTick: request.frameTick,
      canvas: { ...profile.canvas, background },
      layers,
      groups: [],
      background,
      outputProfile: { profileId: profile.outputProfileId, role: profile.role, aspect: profile.aspect },
      qualityTier: 'BALANCED',
      emptyCompositionPolicy: request.backgroundPolicy === 'TRANSPARENT' ? 'RETURN_EMPTY' : 'PRODUCE_BACKGROUND',
      alphaPolicy: 'PRESERVE_IF_POSSIBLE',
      missingLayerPolicy: request.missingSourcePolicy === 'FAIL_REQUIRED' ? 'FAIL_IF_CRITICAL' : 'SKIP_OPTIONAL',
      timestampPolicy: 'USE_RUNTIME_TICK_TIME',
      pipelineConfigurationGeneration: request.pipelineConfigurationGeneration,
      metadata: { sceneId: request.sceneId, outputProfileId: profile.outputProfileId, graphKey: graph.deterministicKey },
    });
    const layerPlan = (this.options.layerCompositor ?? createLayerCompositor()).plan(layerRequest);
    const plan: SceneRenderPlan = cloneFreeze({
      planId: cacheKey,
      requestId: request.requestId,
      sceneId: request.sceneId,
      outputProfile: profile,
      dependencyGraph: graph,
      orderedSceneIds: graph.orderedSceneIds,
      orderedBindingIds: layers.map((layer) => layer.layerId),
      layerRequest,
      passThrough: layerPlan.plan?.passThroughEligible ?? false,
      backgroundPolicy: request.backgroundPolicy,
      missingSourcePolicy: request.missingSourcePolicy,
      frozenSourcePolicy: request.frozenSourcePolicy,
      dependencyGenerations: graph.dependencyGenerations,
      warnings: [...warnings, ...layerPlan.errors],
      deterministicKey: cacheKey,
    });
    this.planCache.set(cacheKey, plan);
    while (this.planCache.size > this.planCacheLimit) this.planCache.delete(this.planCache.keys().next().value as string);
    this.patchTelemetry({ renderPlans: this.telemetry.renderPlans + 1 });
    return plan;
  }

  async renderScene(
    request: SceneRenderRequest,
    context: SceneRenderContext = { nowNs: this.now.bind(this) },
  ): Promise<Readonly<SceneRenderResult>> {
    const plan = this.createRenderPlan(request);
    const layerCompositor = context.layerCompositor ?? this.options.layerCompositor ?? createLayerCompositor();
    const frameMemory = context.frameMemory ?? this.options.frameMemory;
    if (frameMemory) this.activeFrameMemory = frameMemory;
    if (context.gpuResourceManager ?? this.options.gpuResourceManager) {
      // GPU resources remain owned by the GPU Resource Manager; the scene layer only records availability.
    }
    const layerResult = await layerCompositor.compose(plan.layerRequest, {
      nowNs: context.nowNs,
      ...(frameMemory ? { frameMemory } : {}),
      ownerId: 'scene-compositor',
    });
    const status: SceneRenderStatus = layerResult.status === 'PASSED_THROUGH'
      ? 'PASSED_THROUGH'
      : layerResult.status === 'COMPLETED'
        ? 'COMPLETED'
        : layerResult.status === 'BACKGROUND_ONLY'
          ? 'BACKGROUND_ONLY'
          : layerResult.status === 'EMPTY'
            ? 'EMPTY'
            : layerResult.status === 'REJECTED'
              ? 'REJECTED'
              : layerResult.status === 'FAILED'
                ? 'FAILED'
                : 'DEGRADED';
    const outputFrame = layerResult.outputFrame;
    const frameIdentity = outputFrame
      ? {
          frameId: outputFrame.frameId,
          storageId: outputFrame.storageId,
          leaseId: outputFrame.leaseId,
          ownerId: outputFrame.ownerId,
          generation: outputFrame.frameGeneration.toString(),
          passThrough: layerResult.passThrough,
        }
      : undefined;
    this.patchTelemetry({ renders: this.telemetry.renders + 1 });
    return cloneFreeze({
      requestId: request.requestId,
      planId: plan.planId,
      status,
      outputProfileId: plan.outputProfile.outputProfileId,
      role: plan.outputProfile.role,
      aspect: plan.outputProfile.aspect,
      passThrough: layerResult.passThrough,
      layerResult,
      ...(outputFrame ? { outputFrame } : {}),
      ...(frameIdentity ? { frameIdentity } : {}),
      warnings: [...plan.warnings, ...layerResult.warnings],
      completedAtNs: context.nowNs().toString(),
    });
  }

  publishSceneOutput(result: SceneRenderResult): Readonly<ScenePublishedOutput> {
    const outputKey = this.outputKeyFor(result);
    this.releasePublishedOutput(outputKey);
    const published = cloneFreeze({
      outputKey,
      profileId: result.outputProfileId,
      sceneId: String(result.layerResult?.canvas.metadata?.sceneId ?? result.outputProfileId),
      status: result.status,
      ...(result.frameIdentity ? { frameIdentity: result.frameIdentity } : {}),
      generation: BigInt(this.telemetry.publications + 1),
      publishedAtNs: this.now(),
    });
    this.publishedOutputs.set(outputKey, published);
    this.patchTelemetry({ publications: this.telemetry.publications + 1 });
    this.pushEvent('SceneOutputPublished', { outputKey, status: result.status });
    return published;
  }

  getSnapshot(): Readonly<SceneCompositorSnapshot> {
    return cloneFreeze({
      engineState: this.engineState,
      scenes: [...this.scenes.values()].sort((a, b) => a.identity.sceneId.localeCompare(b.identity.sceneId)),
      collections: [...this.collections.values()].sort((a, b) => a.collectionId.localeCompare(b.collectionId)),
      templates: [...this.templates.values()].sort((a, b) => a.templateId.localeCompare(b.templateId)),
      variants: [...this.variants.values()].sort((a, b) => a.variantId.localeCompare(b.variantId)),
      instances: [...this.instances.values()].sort((a, b) => a.instanceId.localeCompare(b.instanceId)),
      publishedOutputs: [...this.publishedOutputs.values()].sort((a, b) => a.outputKey.localeCompare(b.outputKey)),
      health: this.getHealthSnapshot(),
      telemetry: this.telemetry,
      recentEvents: this.events,
      containsPixels: false,
      containsRuntimeHandles: false,
    });
  }

  getHealthSnapshot(): Readonly<SceneCompositorHealthSnapshot> {
    const activeInstances = [...this.instances.values()].filter((item) => item.activationState === 'ACTIVE').length;
    const suspendedInstances = [...this.instances.values()].filter(
      (item) => item.activationState === 'SUSPENDED',
    ).length;
    return cloneFreeze({
      healthState: this.engineState === 'SHUTDOWN' ? 'STOPPED' : this.healthState,
      registeredScenes: this.scenes.size,
      registeredCollections: this.collections.size,
      registeredTemplates: this.templates.size,
      registeredVariants: this.variants.size,
      liveInstances: [...this.instances.values()].filter((item) => item.activationState !== 'DESTROYED').length,
      activeInstances,
      suspendedInstances,
      failedValidationCount: this.telemetry.validationFailures,
      lifecycleErrorCount: this.telemetry.lifecycleFailures,
      registryPressure: this.registryPressure(),
      ...(this.lastIncident ? { lastIncident: this.lastIncident } : {}),
    });
  }

  assertInvariants(): void {
    const limit = this.registryLimit;
    if (this.scenes.size > limit || this.collections.size > limit || this.templates.size > limit) {
      throw sceneError('SceneRegistryInvariantFailed', 'Scene registry limit exceeded');
    }
    for (const scene of this.scenes.values()) {
      const report = this.validateScene(scene);
      if (!report.valid) throw sceneError('SceneInvariantFailed', report.errors.join('; '));
    }
    for (const instance of this.instances.values()) {
      this.requireScene(instance.sceneId);
    }
  }

  async shutdown(): Promise<void> {
    this.releasePublishedOutputs();
    this.instances.clear();
    this.planCache.clear();
    this.engineState = 'SHUTDOWN';
    this.healthState = 'STOPPED';
  }


  private applyOverrides(
    bindings: readonly SceneBinding[],
    overrides: readonly Readonly<SceneParameterOverride>[],
  ): readonly SceneBinding[] {
    return bindings.map((binding) => {
      const bindingOverrides = overrides.filter((override) => override.targetId === binding.bindingId);
      if (bindingOverrides.length === 0) return binding;
      const patch: { enabled?: boolean; zIndex?: number; order?: number; role?: string } = {};
      for (const override of bindingOverrides) {
        if (override.parameter === 'enabled' && typeof override.value === 'boolean') patch.enabled = override.value;
        if (override.parameter === 'zIndex' && typeof override.value === 'number') patch.zIndex = override.value;
        if (override.parameter === 'order' && typeof override.value === 'number') patch.order = override.value;
        if (override.parameter === 'role' && typeof override.value === 'string') patch.role = override.value;
      }
      return { ...binding, ...patch };
    });
  }

  private layerFromBinding(
    binding: SceneBinding,
    frame: Readonly<VideoPipelineFrameReference>,
    canvas: Readonly<LayerCompositionCanvas>,
  ): LayerDescriptor {
    const bounds: LayerRect = { x: 0, y: 0, width: canvas.width, height: canvas.height };
    return cloneFreeze({
      layerId: binding.bindingId,
      sourceId: frame.sourceId,
      streamId: frame.streamId,
      frame,
      frameGeneration: frame.frameGeneration,
      storageGeneration: frame.storageGeneration,
      geometry: {
        geometryId: `scene:${binding.bindingId}`,
        frameGeneration: frame.frameGeneration,
        storageGeneration: frame.storageGeneration,
        transformedDestination: bounds,
        visibleBounds: bounds,
      },
      zIndex: binding.zIndex,
      order: binding.order,
      enabled: binding.enabled,
      visible: binding.enabled,
      opacity: 1,
      blendMode: 'NORMAL',
      alphaMode: 'STRAIGHT',
      layerBounds: bounds,
      contentBounds: bounds,
      role: binding.role === 'PRIMARY' ? 'PRIMARY_VIDEO' : 'CUSTOM',
      isolationMode: 'NONE',
      cachePolicy: 'NONE',
      temporalPolicy: 'CURRENT_FRAME_ONLY',
      criticality: binding.required ? 'CRITICAL' : 'OPTIONAL',
      metadata: { sceneBindingId: binding.bindingId },
    });
  }

  private backgroundFor(
    policy: SceneBackgroundPolicy,
    fallback: Readonly<LayerBackgroundDescriptor>,
  ): Readonly<LayerBackgroundDescriptor> {
    if (policy === 'CANVAS_DEFAULT') return fallback;
    if (policy === 'TRANSPARENT') return { mode: 'TRANSPARENT' };
    if (policy === 'OPAQUE_WHITE') return { mode: 'OPAQUE_WHITE' };
    return { mode: 'OPAQUE_BLACK' };
  }

  private outputKeyFor(result: SceneRenderResult): string {
    if (result.role === 'PROGRAM') return `${SCENE_COMPOSITOR_OUTPUT_KEYS.program}.${result.aspect.toLowerCase()}`;
    if (result.role === 'PREVIEW') return `${SCENE_COMPOSITOR_OUTPUT_KEYS.preview}.${result.aspect.toLowerCase()}`;
    if (result.role === 'AUX') return `${SCENE_COMPOSITOR_OUTPUT_KEYS.aux}.${result.outputProfileId}`;
    if (result.role === 'CLEAN_FEED') return `${SCENE_COMPOSITOR_OUTPUT_KEYS.cleanFeed}.${result.aspect.toLowerCase()}`;
    if (result.role === 'MULTIVIEW') return `${SCENE_COMPOSITOR_OUTPUT_KEYS.multiview}.${result.outputProfileId}`;
    return `scene.variant.${result.outputProfileId}`;
  }

  private releasePublishedOutput(outputKey: string): void {
    const existing = this.publishedOutputs.get(outputKey);
    const frameIdentity = existing?.frameIdentity;
    const frameId = typeof frameIdentity?.frameId === 'string' ? frameIdentity.frameId : undefined;
    const ownerId = typeof frameIdentity?.ownerId === 'string' ? frameIdentity.ownerId : undefined;
    const frameMemory = this.options.frameMemory ?? this.activeFrameMemory;
    if (frameId && ownerId === 'scene-compositor' && frameMemory) {
      frameMemory.release(frameId, ownerId);
      this.patchTelemetry({ releasedLeases: this.telemetry.releasedLeases + 1 });
    }
    if (existing) this.publishedOutputs.delete(outputKey);
  }

  private releasePublishedOutputs(): void {
    for (const key of [...this.publishedOutputs.keys()]) this.releasePublishedOutput(key);
  }

  private invalidatePlanCache(sceneId: string): void {
    let invalidated = 0;
    for (const [key, plan] of [...this.planCache.entries()]) {
      if (plan.orderedSceneIds.includes(sceneId)) {
        this.planCache.delete(key);
        invalidated += 1;
      }
    }
    if (invalidated > 0) {
      this.patchTelemetry({ planCacheInvalidations: this.telemetry.planCacheInvalidations + invalidated });
    }
  }

  private requireGenerationIfPresent(actual: bigint, expected: bigint | undefined, code: string): void {
    if (expected !== undefined) this.requireGeneration(actual, expected, code);
  }

  private normalizeScene(scene: SceneDefinition): Readonly<SceneDefinition> {
    return cloneFreeze({
      ...scene,
      bindings: orderedBindings(scene.bindings),
      outputProfiles: orderedProfiles(scene.outputProfiles),
      dependencyKinds: [...scene.dependencyKinds].sort(),
      metadata: safe(scene.metadata ?? {}) as Readonly<Record<string, JsonSafe>>,
    });
  }

  private assertSceneValid(scene: SceneDefinition): void {
    const report = this.validateScene(scene);
    if (!report.valid) throw sceneError('SceneValidationFailed', report.errors.join('; '));
  }

  private transitionInstance(
    instanceId: string,
    expectedGeneration: bigint,
    allowed: readonly SceneActivationState[],
    nextState: SceneActivationState,
    counter: keyof Pick<
      SceneCompositorTelemetrySnapshot,
      'activations' | 'deactivations' | 'suspends' | 'resumes'
    >,
    event: string,
  ): Readonly<SceneInstance> {
    const instance = this.requireInstance(instanceId);
    this.requireGeneration(instance.generation, expectedGeneration, 'SceneInstanceGenerationMismatch');
    if (!allowed.includes(instance.activationState)) this.rejectLifecycle(instance, nextState);
    const next = bumpInstance(instance, nextState, this.now());
    this.instances.set(instanceId, next);
    this.note(event, { instanceId, state: nextState }, counter);
    return next;
  }

  private requireScene(sceneId: string): Readonly<SceneDefinition> {
    const scene = this.scenes.get(sceneId);
    if (!scene) throw sceneError('SceneNotFound', `Scene ${sceneId} was not found`);
    return scene;
  }

  private requireInstance(instanceId: string): Readonly<SceneInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw sceneError('SceneInstanceNotFound', `Scene instance ${instanceId} was not found`);
    return instance;
  }

  private requireGeneration(actual: bigint, expected: bigint, code: string): void {
    if (actual !== expected) {
      this.lastIncident = 'SCENE_STALE_GENERATION';
      this.patchTelemetry({ generationRejections: this.telemetry.generationRejections + 1 });
      throw sceneError(code, `Generation mismatch: expected ${expected.toString()}, got ${actual.toString()}`);
    }
  }

  private rejectLifecycle(instance: Readonly<SceneInstance>, target: SceneActivationState): never {
    this.lastIncident = 'SCENE_LIFECYCLE_INVALID';
    this.healthState = 'DEGRADED';
    this.patchTelemetry({ lifecycleFailures: this.telemetry.lifecycleFailures + 1 });
    throw sceneError('SceneLifecycleInvalid', `Cannot transition ${instance.activationState} to ${target}`, {
      instanceId: instance.instanceId,
      from: instance.activationState,
      to: target,
    });
  }

  private rejectDependency(reason: string): never {
    this.lastIncident = 'SCENE_DEPENDENCY_INVALID';
    this.healthState = 'DEGRADED';
    this.patchTelemetry({ dependencyRejections: this.telemetry.dependencyRejections + 1 });
    throw sceneError('SceneDependencyInvalid', reason);
  }

  private countValidationFailure(reason: string): void {
    this.lastIncident = 'SCENE_VALIDATION_FAILED';
    this.healthState = 'DEGRADED';
    this.patchTelemetry({
      validationFailures: this.telemetry.validationFailures + 1,
      lastEvent: 'SceneValidationFailed',
      lastEventAtNs: this.now().toString(),
    });
    this.pushEvent('SceneValidationFailed', { reason });
  }

  private ensureReady(): void {
    if (this.engineState === 'SHUTDOWN') {
      throw sceneError('SceneCompositorShutdown', 'Scene compositor is shut down');
    }
  }

  private ensureCapacity(map: ReadonlyMap<unknown, unknown>, name: string): void {
    if (map.size >= this.registryLimit) {
      this.lastIncident = 'SCENE_REGISTRY_PRESSURE';
      this.healthState = 'DEGRADED';
      this.patchTelemetry({ registryEvictions: this.telemetry.registryEvictions + 1 });
      throw sceneError('SceneRegistryLimitExceeded', `Bounded ${name} registry exceeded ${this.registryLimit}`);
    }
  }

  private registryPressure(): boolean {
    const limit = this.registryLimit;
    return [this.scenes.size, this.collections.size, this.templates.size, this.variants.size, this.instances.size].some(
      (size) => size >= limit,
    );
  }

  private note(
    event: string,
    metadata: Record<string, unknown>,
    counter: keyof Pick<
      SceneCompositorTelemetrySnapshot,
      | 'sceneRegistrations'
      | 'collectionRegistrations'
      | 'templateRegistrations'
      | 'variantRegistrations'
      | 'sceneUpdates'
      | 'atomicCommits'
      | 'instanceCreates'
      | 'instanceDestroys'
      | 'activations'
      | 'deactivations'
      | 'suspends'
      | 'resumes'
    >,
  ): void {
    this.patchTelemetry({
      [counter]: Number(this.telemetry[counter]) + 1,
      lastEvent: event,
      lastEventAtNs: this.now().toString(),
    });
    this.pushEvent(event, metadata);
  }

  private patchTelemetry(patch: Partial<SceneCompositorTelemetrySnapshot>): void {
    this.telemetry = deepFreezeSceneCompositor({ ...this.telemetry, ...patch });
  }

  private pushEvent(event: string, metadata: Record<string, unknown>): void {
    this.events.push(safe({ event, metadata, atNs: this.now() }));
    while (this.events.length > this.eventHistoryLimit) this.events.shift();
  }

  private now(): bigint {
    return this.options.nowNs?.() ?? nowDefault();
  }
}


export class SceneCompositorProcessor
  implements TickProcessor<Readonly<SceneCompositorSnapshot>, SceneProcessorTickSummary>
{
  readonly id = 'scene-compositor';
  readonly order = 800;
  readonly estimatedBudgetNs: bigint;
  readonly maximumBudgetNs: bigint;
  readonly timeoutNs: bigint;
  readonly maySkipUnderLoad: boolean;
  readonly failurePolicy = 'DEGRADE_RUNTIME' as const;
  readonly descriptor: TickProcessorDescriptor;
  private readonly compositor: SceneCompositor;
  private readonly queue: SceneRenderRequest[] = [];
  private readonly seen = new Set<string>();
  private lastTickFrameNumber: bigint | undefined;
  private shutdownRequested = false;

  constructor(private readonly processorOptions: SceneProcessorOptions = {}) {
    this.compositor = processorOptions.compositor ?? createSceneCompositor({
      ...(processorOptions.frameMemory ? { frameMemory: processorOptions.frameMemory } : {}),
      ...(processorOptions.gpuResourceManager ? { gpuResourceManager: processorOptions.gpuResourceManager } : {}),
      ...(processorOptions.layerCompositor ? { layerCompositor: processorOptions.layerCompositor } : {}),
    });
    this.estimatedBudgetNs = processorOptions.budgetNs ?? 4_000_000n;
    this.maximumBudgetNs = processorOptions.budgetNs ?? 8_000_000n;
    this.timeoutNs = processorOptions.timeoutNs ?? 16_000_000n;
    this.maySkipUnderLoad = processorOptions.overloadPolicy !== 'RENDER_ANYWAY';
    this.descriptor = deepFreezeSceneCompositor({
      id: this.id,
      name: 'Scene Compositor Processor',
      version: '5.3.9',
      order: this.order,
      phase: 'SCENE' as const,
      workloadClass: 'REALTIME' as const,
      enabledByDefault: true,
      dependencies: ['layer-compositor'],
      optionalCapabilities: ['frame-memory', 'gpu-resource-manager'],
      estimatedBudgetNs: this.estimatedBudgetNs,
      maximumBudgetNs: this.maximumBudgetNs,
      timeoutNs: this.timeoutNs,
      maySkipUnderLoad: this.maySkipUnderLoad,
      failurePolicy: this.failurePolicy,
      criticality: 'OPERATIONAL' as const,
      supportsHotDisable: true,
      supportsHotEnable: true,
      supportsHotReplacement: false,
      statePersistencePolicy: 'RETAIN_UNTIL_SHUTDOWN' as const,
      metadata: { ubosVersion: '5.3.9', noSecondRuntimeLoop: true, oneExecutionPerTick: true },
    });
  }

  enqueueRender(request: SceneRenderRequest): boolean {
    if (this.shutdownRequested || this.seen.has(request.requestId)) return false;
    const max = this.processorOptions.maximumQueueDepth ?? 1024;
    if (this.queue.length >= max) return false;
    this.queue.push(request);
    this.queue.sort((a, b) =>
      a.runtimeFrameNumber === b.runtimeFrameNumber
        ? a.requestId.localeCompare(b.requestId)
        : a.runtimeFrameNumber < b.runtimeFrameNumber
          ? -1
          : 1,
    );
    this.seen.add(request.requestId);
    return true;
  }

  initialize(): { readonly status: 'READY'; readonly state: Readonly<SceneCompositorSnapshot> } {
    return { status: 'READY', state: this.compositor.getSnapshot() };
  }

  async processTick(
    tick: FrameTick,
    context: ProcessorRuntimeContext<Readonly<SceneCompositorSnapshot>>,
  ): Promise<ProcessorTickResult<SceneProcessorTickSummary>> {
    const nowNs = () => nowDefault();
    const started = nowNs();
    if (this.lastTickFrameNumber === tick.frameNumber) {
      return { status: 'SKIPPED', reason: 'SCENE_PROCESSOR_DUPLICATE_TICK' };
    }
    this.lastTickFrameNumber = tick.frameNumber;
    if (context.overloadState !== 'NORMAL' && this.processorOptions.overloadPolicy === 'FAIL_WHEN_OVERLOADED') {
      return { status: 'FAILED', error: 'SCENE_PROCESSOR_OVERLOAD', retryable: true };
    }
    if (context.overloadState !== 'NORMAL' && this.processorOptions.overloadPolicy !== 'RENDER_ANYWAY') {
      return { status: 'SKIPPED', reason: 'SCENE_PROCESSOR_OVERLOAD' };
    }
    const request = this.queue.shift();
    if (!request) {
      return {
        status: 'SUCCEEDED',
        value: {
          tickFrameNumber: tick.frameNumber.toString(),
          status: 'IDLE',
          durationNs: (nowNs() - started).toString(),
          queueDepth: this.queue.length,
        },
      };
    }
    try {
      const beforeRender = nowNs();
      const result = await this.compositor.renderScene(request, {
        nowNs,
        ...(this.processorOptions.frameMemory ? { frameMemory: this.processorOptions.frameMemory } : {}),
        ...(this.processorOptions.gpuResourceManager ? { gpuResourceManager: this.processorOptions.gpuResourceManager } : {}),
        ...(this.processorOptions.layerCompositor ? { layerCompositor: this.processorOptions.layerCompositor } : {}),
      });
      const elapsed = nowNs() - beforeRender;
      if (elapsed > this.timeoutNs) {
        return { status: 'TIMED_OUT', error: 'SCENE_PROCESSOR_TIMEOUT' };
      }
      const published = this.compositor.publishSceneOutput(result);
      const summary = deepFreezeSceneCompositor({
        tickFrameNumber: tick.frameNumber.toString(),
        status: 'RENDERED' as const,
        requestId: request.requestId,
        outputKey: published.outputKey,
        durationNs: (nowNs() - started).toString(),
        queueDepth: this.queue.length,
      });
      context.outputs.publish(this.id, SCENE_COMPOSITOR_OUTPUT_KEYS.snapshots, this.compositor.getSnapshot(), 'BORROWED');
      context.outputs.publish(this.id, published.outputKey, published, 'BORROWED');
      return { status: 'SUCCEEDED', value: summary, metadata: { outputKey: published.outputKey } };
    } catch (error) {
      if (this.processorOptions.failurePolicy === 'SKIP') return { status: 'SKIPPED', reason: String(error) };
      if (this.processorOptions.failurePolicy === 'FAIL') return { status: 'FAILED', error: String(error), retryable: true };
      return { status: 'DEGRADED', warning: { code: 'SCENE_PROCESSOR_DEGRADED', message: String(error) } };
    }
  }

  async shutdown(): Promise<{ readonly status: 'STOPPED'; readonly metadata: Readonly<Record<string, unknown>> }> {
    this.shutdownRequested = true;
    this.queue.length = 0;
    this.seen.clear();
    await this.compositor.shutdown();
    return { status: 'STOPPED', metadata: { queueDepth: 0 } };
  }
}

export const createSceneCompositorProcessor = (options?: SceneProcessorOptions): SceneCompositorProcessor =>
  new SceneCompositorProcessor(options);

export const createSceneCompositor = (options?: SceneCompositorOptions): SceneCompositor =>
  new DefaultSceneCompositor(options);

export const createSceneCompositorCommandHandlers = (
  compositor: SceneCompositor,
): readonly RuntimeCommandHandler[] =>
  SCENE_COMPOSITOR_COMMAND_TYPES.map((commandType) => ({
    commandType,
    handlerName: `scene-compositor:${commandType}`,
    idempotent: true,
    execute: (command: RuntimeCommand) => ({
      status: 'SUCCEEDED' as const,
      value: safe({ commandId: command.id, commandType, snapshot: compositor.getSnapshot() }),
      metadata: { completedAtNs: nowDefault().toString() },
    }),
  }));

export const createSceneCompositorSourceGraphMetadata = (snapshot: SceneCompositorSnapshot) =>
  cloneFreeze({
    registeredScenes: snapshot.health.registeredScenes,
    activeInstances: snapshot.health.activeInstances,
    suspendedInstances: snapshot.health.suspendedInstances,
    healthState: snapshot.health.healthState,
    outputKeys: SCENE_COMPOSITOR_OUTPUT_KEYS,
    containsPixels: false,
    containsRuntimeHandles: false,
  });
