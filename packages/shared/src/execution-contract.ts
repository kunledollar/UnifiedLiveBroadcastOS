const runtimeMediaConstructorNames = new Set([
  'MediaStream',
  'MediaStreamTrack',
  'VideoFrame',
  'AudioData',
  'EncodedVideoChunk',
  'EncodedAudioChunk',
  'HTMLCanvasElement',
  'HTMLVideoElement',
  'HTMLAudioElement',
  'HTMLElement',
  'CanvasRenderingContext2D',
  'OffscreenCanvas',
  'AudioContext',
  'AudioNode',
  'RTCPeerConnection',
]);

const runtimeMediaKeyPattern = /(^|_|-)(mediaStream|stream|videoFrame|audioSample|audioSamples|encodedPacket|encodedPackets|domElement|canvasRef|adapterInstance|adapter|rendererInstance|audioNode|webglContext)(_|-|$)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getConstructorName(value: unknown) {
  if (!isRecord(value)) return undefined;
  return value.constructor?.name;
}

function fail(message: string): never {
  throw new Error(`[UBOS Execution Contract v1] ${message}`);
}

export interface PlannerBoundaryAssertionInput {
  readonly plannerName: string;
  readonly imports?: readonly string[];
  readonly runtimePorts?: Record<string, unknown>;
}

export interface FramePlanDeterministicShape {
  readonly id?: string;
  readonly frameId?: string;
  readonly frameTimestamp?: number;
  readonly graphRevision?: number;
  readonly steps?: readonly unknown[];
  readonly batches?: Record<string, unknown>;
}

export function assertRuntimeOnlyValue(value: unknown, label = 'runtime value') {
  const constructorName = getConstructorName(value);
  if (constructorName && runtimeMediaConstructorNames.has(constructorName)) return;

  if (typeof value === 'function') return;

  fail(`${label} is not recognized as a runtime-only value`);
}

export function assertNoRuntimeMediaInGraph(graphLike: unknown, path = 'ProductionGraph') {
  const seen = new WeakSet<object>();

  function visit(value: unknown, currentPath: string): void {
    if (!isRecord(value)) return;
    if (seen.has(value)) return;
    seen.add(value);

    const constructorName = getConstructorName(value);
    if (constructorName && runtimeMediaConstructorNames.has(constructorName)) {
      fail(`${currentPath} contains forbidden runtime media value ${constructorName}`);
    }

    for (const [key, nestedValue] of Object.entries(value)) {
      const nestedPath = `${currentPath}.${key}`;
      if (runtimeMediaKeyPattern.test(key)) {
        fail(`${nestedPath} uses a forbidden runtime media key`);
      }
      visit(nestedValue, nestedPath);
    }
  }

  visit(graphLike, path);
}

export function assertFramePlanDeterministicShape(plan: FramePlanDeterministicShape) {
  const stableId = plan.id ?? plan.frameId;
  if (!stableId) fail('MediaFramePlan must expose a stable id or frameId');
  if (typeof plan.frameTimestamp !== 'number') fail('MediaFramePlan must expose numeric frameTimestamp');
  if (typeof plan.graphRevision !== 'number') fail('MediaFramePlan must expose numeric graphRevision');
  if (!Array.isArray(plan.steps)) fail('MediaFramePlan must expose an ordered steps array');
  assertNoRuntimeMediaInGraph(plan, 'MediaFramePlan');
}

export function assertPlannerBoundary(input: PlannerBoundaryAssertionInput) {
  const forbiddenImportPattern = /(adapter|renderer|MediaExecutionEngine|AudioRouter|VideoRouter|OutputEngine|SceneCompositor)/i;
  const forbiddenImport = input.imports?.find((name) => forbiddenImportPattern.test(name));
  if (forbiddenImport) {
    fail(`${input.plannerName} crosses planner boundary by importing ${forbiddenImport}`);
  }

  if (!input.runtimePorts) return;

  for (const [name, value] of Object.entries(input.runtimePorts)) {
    const constructorName = getConstructorName(value);
    if (typeof value === 'function' || (constructorName && forbiddenImportPattern.test(constructorName))) {
      fail(`${input.plannerName} received forbidden runtime port ${name}`);
    }
  }
}
