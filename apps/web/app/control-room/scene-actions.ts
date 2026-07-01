'use server';

import { prisma } from '@ubos/db';
import {
  addSceneSourceSchema,
  createSceneSchema,
  renameSceneSchema,
  renameSceneSourceSchema,
  SceneType,
  sourceSettingsSchema,
  sourceTransformSchema,
  type Scene,
  type SceneLayout,
  type SceneSource,
  type SceneSourceType,
  type ProductionSwitchingState,
  type TransitionType,
} from '@ubos/shared';
import { revalidatePath } from 'next/cache';
import { emitRealtimeEvent } from './realtime-actions';

const DEMO_WORKSPACE_ID = 'demo-workspace';
const DEMO_BROADCAST_ID = 'demo-broadcast';

const typeToDb = (type: SceneType) => type.toUpperCase() as never;
const dbToType = (type: string) => type.toLowerCase() as SceneType;

type DbScene = {
  id: string;
  broadcastId: string;
  name: string;
  type: string;
  order: number;
  isActive: boolean;
  thumbnailUrl: string | null;
  background: unknown;
  layout: string | null;
  sources: unknown;
  sceneSources?: DbSceneSource[];
  overlays: unknown;
  audioConfig: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type DbSceneSource = {
  id: string;
  workspaceId: string;
  broadcastId: string;
  sceneId: string;
  name: string;
  type: string;
  order: number;
  isVisible: boolean;
  isLocked: boolean;
  settings: unknown;
  transform: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function sourceTypeToDb(type: SceneSourceType) {
  return type.toUpperCase() as never;
}

function dbToSourceType(type: string) {
  return type.toLowerCase() as SceneSourceType;
}

function objectOrEmpty(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function jsonObject(value: unknown) {
  return objectOrEmpty(value) as never;
}

function toSource(source: DbSceneSource): SceneSource {
  return {
    id: source.id,
    workspaceId: source.workspaceId,
    broadcastId: source.broadcastId,
    sceneId: source.sceneId,
    name: source.name,
    label: source.name,
    type: dbToSourceType(source.type),
    order: source.order,
    visible: source.isVisible,
    isVisible: source.isVisible,
    isLocked: source.isLocked,
    settings: objectOrEmpty(source.settings),
    transform: objectOrEmpty(source.transform),
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

function layoutFor(type: SceneType): SceneLayout {
  if (type === SceneType.Interview) return 'interview';
  if (type === SceneType.ScreenShare) return 'screen_share';
  if (type === SceneType.Camera) return 'solo';
  return 'picture_in_picture';
}

function canvases(type: SceneType) {
  return [
    {
      id: 'program',
      label: 'Program',
      aspectRatio: '16:9' as const,
      destinationHint: type === SceneType.ScreenShare ? 'Screen output' : 'Primary destinations',
    },
    {
      id: 'vertical',
      label: 'Vertical',
      aspectRatio: '9:16' as const,
      destinationHint: 'Short-form destinations',
    },
  ];
}

function toJsonArray(value: unknown): SceneSource[] {
  return Array.isArray(value) ? (value as unknown as SceneSource[]) : [];
}

const transitionTypes: TransitionType[] = ['cut', 'fade', 'dip', 'wipe'];

function productionConfig(
  value: unknown,
  scenes: Array<{ id: string; isActive: boolean }>,
): ProductionSwitchingState {
  const config = objectOrEmpty(value);
  const fallbackSceneId = scenes.find((scene) => scene.isActive)?.id ?? scenes[0]?.id ?? '';
  const previewSceneId =
    typeof config.previewSceneId === 'string' &&
    scenes.some((scene) => scene.id === config.previewSceneId)
      ? config.previewSceneId
      : fallbackSceneId;
  const programSceneId =
    typeof config.programSceneId === 'string' &&
    scenes.some((scene) => scene.id === config.programSceneId)
      ? config.programSceneId
      : fallbackSceneId;
  const transitionType = transitionTypes.includes(config.transitionType as TransitionType)
    ? (config.transitionType as TransitionType)
    : 'cut';
  const rawDuration = Number(config.transitionDuration);
  const transitionDuration = Number.isFinite(rawDuration)
    ? Math.min(Math.max(Math.round(rawDuration), 0), 5000)
    : 500;
  return { previewSceneId, programSceneId, transitionType, transitionDuration };
}

function toScene(scene: DbScene): Scene {
  const type = dbToType(scene.type);
  return {
    id: scene.id,
    broadcastId: scene.broadcastId,
    name: scene.name,
    type,
    order: scene.order,
    isActive: scene.isActive,
    thumbnailUrl: scene.thumbnailUrl,
    background: scene.background as Record<string, unknown> | null,
    layout: (scene.layout as SceneLayout | null) ?? layoutFor(type),
    sources: scene.sceneSources ? scene.sceneSources.map(toSource) : toJsonArray(scene.sources),
    overlays: Array.isArray(scene.overlays) ? (scene.overlays as Record<string, unknown>[]) : [],
    audioConfig:
      typeof scene.audioConfig === 'object' &&
      scene.audioConfig !== null &&
      !Array.isArray(scene.audioConfig)
        ? (scene.audioConfig as Record<string, unknown>)
        : {},
    canvases: canvases(type),
    createdAt: scene.createdAt.toISOString(),
    updatedAt: scene.updatedAt.toISOString(),
  };
}

export async function ensureDemoBroadcast() {
  await prisma.workspace.upsert({
    where: { id: DEMO_WORKSPACE_ID },
    create: { id: DEMO_WORKSPACE_ID, name: 'Demo Workspace' },
    update: {},
  });
  await prisma.broadcastSession.upsert({
    where: { id: DEMO_BROADCAST_ID },
    create: {
      id: DEMO_BROADCAST_ID,
      workspaceId: DEMO_WORKSPACE_ID,
      title: 'Launch Day Broadcast',
    },
    update: {},
  });
  const count = await prisma.scene.count({ where: { broadcastId: DEMO_BROADCAST_ID } });
  if (count === 0) {
    await prisma.scene.createMany({
      data: [
        {
          broadcastId: DEMO_BROADCAST_ID,
          name: 'Opening Countdown',
          type: 'COUNTDOWN',
          order: 0,
          isActive: false,
          layout: 'screen_share',
        },
        {
          broadcastId: DEMO_BROADCAST_ID,
          name: 'Host + Guest Interview',
          type: 'INTERVIEW',
          order: 1,
          isActive: true,
          layout: 'interview',
        },
        {
          broadcastId: DEMO_BROADCAST_ID,
          name: 'Product Demo + PiP',
          type: 'SCREEN_SHARE',
          order: 2,
          isActive: false,
          layout: 'picture_in_picture',
        },
      ],
    });
  }
}

async function assertWorkspaceAccess(broadcastId: string) {
  const session = await prisma.broadcastSession.findFirst({
    where: { id: broadcastId, workspaceId: DEMO_WORKSPACE_ID },
  });
  if (!session) throw new Error('Broadcast not found in this workspace.');
}

async function normalizeOrder(broadcastId: string) {
  const scenes = await prisma.scene.findMany({
    where: { broadcastId },
    orderBy: { order: 'asc' },
    include: { sceneSources: { orderBy: { order: 'asc' } } },
  });
  await prisma.$transaction(
    scenes.map((scene, index) =>
      prisma.scene.update({ where: { id: scene.id }, data: { order: index } }),
    ),
  );
}

export async function getScenes(broadcastId = DEMO_BROADCAST_ID) {
  await ensureDemoBroadcast();
  await assertWorkspaceAccess(broadcastId);
  const scenes = await prisma.scene.findMany({
    where: { broadcastId },
    orderBy: { order: 'asc' },
    include: { sceneSources: { orderBy: { order: 'asc' } } },
  });
  return scenes.map(toScene);
}

export async function getProductionState(broadcastId = DEMO_BROADCAST_ID) {
  await ensureDemoBroadcast();
  await assertWorkspaceAccess(broadcastId);
  const [broadcast, scenes] = await Promise.all([
    prisma.broadcastSession.findUnique({
      where: { id: broadcastId },
      select: { productionConfig: true },
    }),
    prisma.scene.findMany({
      where: { broadcastId },
      orderBy: { order: 'asc' },
      select: { id: true, isActive: true },
    }),
  ]);
  const state = productionConfig(broadcast?.productionConfig, scenes);
  if (!objectOrEmpty(broadcast?.productionConfig).programSceneId && state.programSceneId) {
    await prisma.broadcastSession.update({
      where: { id: broadcastId },
      data: { productionConfig: state as never },
    });
  }
  return state;
}

export async function updateProductionState(
  input: Partial<ProductionSwitchingState> & {
    broadcastId?: string;
    action?: 'stage' | 'take' | 'cut' | 'fade';
  },
) {
  const broadcastId = input.broadcastId ?? DEMO_BROADCAST_ID;
  await assertWorkspaceAccess(broadcastId);
  const [broadcast, scenes] = await Promise.all([
    prisma.broadcastSession.findUnique({
      where: { id: broadcastId },
      select: { productionConfig: true },
    }),
    prisma.scene.findMany({
      where: { broadcastId },
      orderBy: { order: 'asc' },
      select: { id: true, isActive: true },
    }),
  ]);
  const current = productionConfig(broadcast?.productionConfig, scenes);
  const sceneIds = new Set(scenes.map((scene) => scene.id));
  const next: ProductionSwitchingState = {
    previewSceneId:
      input.previewSceneId && sceneIds.has(input.previewSceneId)
        ? input.previewSceneId
        : current.previewSceneId,
    programSceneId:
      input.programSceneId && sceneIds.has(input.programSceneId)
        ? input.programSceneId
        : current.programSceneId,
    transitionType: transitionTypes.includes(input.transitionType as TransitionType)
      ? (input.transitionType as TransitionType)
      : current.transitionType,
    transitionDuration:
      typeof input.transitionDuration === 'number'
        ? Math.min(Math.max(Math.round(input.transitionDuration), 0), 5000)
        : current.transitionDuration,
  };
  const programChanged = next.programSceneId !== current.programSceneId;
  await prisma.$transaction([
    prisma.broadcastSession.update({
      where: { id: broadcastId },
      data: { productionConfig: next as never },
    }),
    ...(programChanged
      ? [
          prisma.scene.updateMany({ where: { broadcastId }, data: { isActive: false } }),
          prisma.scene.update({ where: { id: next.programSceneId }, data: { isActive: true } }),
        ]
      : []),
  ]);
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId,
    eventType: programChanged ? 'production:programChanged' : 'production:previewChanged',
    entityType: 'scene',
    entityId: programChanged ? next.programSceneId : next.previewSceneId,
    payload: { ...next, action: input.action ?? 'stage' },
  });
  revalidatePath('/control-room');
  return next;
}

export async function addScene(formData: FormData) {
  const broadcastId = String(formData.get('broadcastId') ?? DEMO_BROADCAST_ID);
  await assertWorkspaceAccess(broadcastId);
  const input = createSceneSchema.parse({
    name: formData.get('name'),
    type: formData.get('type') || SceneType.Custom,
  });
  const nextOrder = await prisma.scene.count({ where: { broadcastId } });
  const created = await prisma.scene.create({
    data: {
      broadcastId,
      name: input.name,
      type: typeToDb(input.type),
      layout: layoutFor(input.type),
      order: nextOrder,
    },
  });
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId,
    eventType: 'scene:created',
    entityType: 'scene',
    entityId: created.id,
    payload: { name: created.name },
  });
  revalidatePath('/control-room');
}

export async function renameScene(formData: FormData) {
  const sceneId = String(formData.get('sceneId'));
  const input = renameSceneSchema.parse({ name: formData.get('name') });
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw new Error('Scene not found.');
  await assertWorkspaceAccess(scene.broadcastId);
  await prisma.scene.update({ where: { id: sceneId }, data: { name: input.name } });
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: scene.broadcastId,
    eventType: 'scene:renamed',
    entityType: 'scene',
    entityId: sceneId,
    payload: { name: input.name },
  });
  revalidatePath('/control-room');
}

export async function switchScene(sceneId: string) {
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw new Error('Scene not found.');
  await assertWorkspaceAccess(scene.broadcastId);
  await prisma.$transaction([
    prisma.scene.updateMany({
      where: { broadcastId: scene.broadcastId },
      data: { isActive: false },
    }),
    prisma.scene.update({ where: { id: sceneId }, data: { isActive: true } }),
  ]);
  await updateProductionState({
    broadcastId: scene.broadcastId,
    previewSceneId: sceneId,
    programSceneId: sceneId,
    action: 'take',
  });
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: scene.broadcastId,
    eventType: 'scene:switched',
    entityType: 'scene',
    entityId: sceneId,
    payload: { activeSceneId: sceneId },
  });
  revalidatePath('/control-room');
}

export async function duplicateScene(sceneId: string) {
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw new Error('Scene not found.');
  await assertWorkspaceAccess(scene.broadcastId);
  const nextOrder = await prisma.scene.count({ where: { broadcastId: scene.broadcastId } });
  const sceneCopyData = {
    broadcastId: scene.broadcastId,
    name: `${scene.name} Copy`,
    type: scene.type,
    order: nextOrder,
    layout: scene.layout,
    sources: jsonObject(scene.sources),
    overlays: jsonObject(scene.overlays),
    audioConfig: jsonObject(scene.audioConfig),
    thumbnailUrl: scene.thumbnailUrl,
    ...(scene.background === null ? {} : { background: jsonObject(scene.background) }),
  };
  const copy = await prisma.scene.create({ data: sceneCopyData });
  const sources = await prisma.sceneSource.findMany({
    where: { sceneId: scene.id, broadcastId: scene.broadcastId, workspaceId: DEMO_WORKSPACE_ID },
    orderBy: { order: 'asc' },
  });
  if (sources.length)
    await prisma.sceneSource.createMany({
      data: sources.map((source) => ({
        workspaceId: source.workspaceId,
        broadcastId: copy.broadcastId,
        sceneId: copy.id,
        name: source.name,
        type: source.type,
        order: source.order,
        isVisible: source.isVisible,
        isLocked: source.isLocked,
        settings: jsonObject(source.settings),
        transform: jsonObject(source.transform),
      })),
    });
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: scene.broadcastId,
    eventType: 'scene:created',
    entityType: 'scene',
    entityId: copy.id,
    payload: { name: copy.name, duplicatedFrom: scene.id },
  });
  revalidatePath('/control-room');
}

export async function deleteScene(sceneId: string) {
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw new Error('Scene not found.');
  await assertWorkspaceAccess(scene.broadcastId);
  const remaining = await prisma.scene.count({ where: { broadcastId: scene.broadcastId } });
  if (remaining <= 1) throw new Error('A broadcast must keep at least one scene.');
  await prisma.scene.delete({ where: { id: sceneId } });
  if (scene.isActive) {
    const next = await prisma.scene.findFirst({
      where: { broadcastId: scene.broadcastId },
      orderBy: { order: 'asc' },
    });
    if (next) await prisma.scene.update({ where: { id: next.id }, data: { isActive: true } });
  }
  await normalizeOrder(scene.broadcastId);
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: scene.broadcastId,
    eventType: 'scene:deleted',
    entityType: 'scene',
    entityId: sceneId,
    payload: { name: scene.name },
  });
  revalidatePath('/control-room');
}

export async function moveScene(sceneId: string, direction: 'up' | 'down') {
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw new Error('Scene not found.');
  await assertWorkspaceAccess(scene.broadcastId);
  const swap = await prisma.scene.findFirst({
    where: {
      broadcastId: scene.broadcastId,
      order: direction === 'up' ? scene.order - 1 : scene.order + 1,
    },
  });
  if (!swap) return;
  await prisma.$transaction([
    prisma.scene.update({ where: { id: scene.id }, data: { order: swap.order } }),
    prisma.scene.update({ where: { id: swap.id }, data: { order: scene.order } }),
  ]);
  revalidatePath('/control-room');
}

async function getScopedScene(sceneId: string) {
  const scene = await prisma.scene.findFirst({
    where: { id: sceneId, broadcast: { workspaceId: DEMO_WORKSPACE_ID } },
  });
  if (!scene) throw new Error('Scene not found in this workspace.');
  return scene;
}

async function getScopedSource(sourceId: string) {
  const source = await prisma.sceneSource.findFirst({
    where: {
      id: sourceId,
      workspaceId: DEMO_WORKSPACE_ID,
      broadcast: { workspaceId: DEMO_WORKSPACE_ID },
      scene: { broadcast: { workspaceId: DEMO_WORKSPACE_ID } },
    },
  });
  if (!source) throw new Error('Source not found in this workspace.');
  return source;
}

async function normalizeSourceOrder(sceneId: string) {
  const sources = await prisma.sceneSource.findMany({
    where: { sceneId, workspaceId: DEMO_WORKSPACE_ID },
    orderBy: { order: 'asc' },
  });
  await prisma.$transaction(
    sources.map((source, index) =>
      prisma.sceneSource.update({ where: { id: source.id }, data: { order: index } }),
    ),
  );
}

export async function loadSourcesForActiveScene(broadcastId = DEMO_BROADCAST_ID) {
  await ensureDemoBroadcast();
  await assertWorkspaceAccess(broadcastId);
  const active = await prisma.scene.findFirst({
    where: { broadcastId, broadcast: { workspaceId: DEMO_WORKSPACE_ID }, isActive: true },
    orderBy: { order: 'asc' },
  });
  if (!active) return [];
  const sources = await prisma.sceneSource.findMany({
    where: { workspaceId: DEMO_WORKSPACE_ID, broadcastId, sceneId: active.id },
    orderBy: { order: 'asc' },
  });
  return sources.map(toSource);
}

export async function addSource(formData: FormData) {
  const input = addSceneSourceSchema.parse({
    sceneId: formData.get('sceneId'),
    name: formData.get('name'),
    type: formData.get('type'),
  });
  const scene = await getScopedScene(input.sceneId);
  const nextOrder = await prisma.sceneSource.count({
    where: { workspaceId: DEMO_WORKSPACE_ID, broadcastId: scene.broadcastId, sceneId: scene.id },
  });
  const created = await prisma.sceneSource.create({
    data: {
      workspaceId: DEMO_WORKSPACE_ID,
      broadcastId: scene.broadcastId,
      sceneId: scene.id,
      name: input.name,
      type: sourceTypeToDb(input.type),
      order: nextOrder,
    },
  });
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: scene.broadcastId,
    eventType: 'source:created',
    entityType: 'source',
    entityId: created.id,
    payload: { sceneId: scene.id, name: created.name },
  });
  revalidatePath('/control-room');
}

export async function renameSource(formData: FormData) {
  const input = renameSceneSourceSchema.parse({
    sourceId: formData.get('sourceId'),
    name: formData.get('name'),
  });
  const source = await getScopedSource(input.sourceId);
  await prisma.sceneSource.update({ where: { id: input.sourceId }, data: { name: input.name } });
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: source.broadcastId,
    eventType: 'source:renamed',
    entityType: 'source',
    entityId: input.sourceId,
    payload: { sceneId: source.sceneId, name: input.name },
  });
  revalidatePath('/control-room');
}

export async function duplicateSource(sourceId: string) {
  const source = await getScopedSource(sourceId);
  const nextOrder = await prisma.sceneSource.count({
    where: {
      workspaceId: DEMO_WORKSPACE_ID,
      broadcastId: source.broadcastId,
      sceneId: source.sceneId,
    },
  });
  await prisma.sceneSource.create({
    data: {
      workspaceId: source.workspaceId,
      broadcastId: source.broadcastId,
      sceneId: source.sceneId,
      name: `${source.name} Copy`,
      type: source.type,
      order: nextOrder,
      isVisible: source.isVisible,
      isLocked: source.isLocked,
      settings: jsonObject(source.settings),
      transform: jsonObject(source.transform),
    },
  });
  revalidatePath('/control-room');
}

export async function deleteSource(sourceId: string) {
  const source = await getScopedSource(sourceId);
  await prisma.sceneSource.delete({ where: { id: sourceId } });
  await normalizeSourceOrder(source.sceneId);
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: source.broadcastId,
    eventType: 'source:deleted',
    entityType: 'source',
    entityId: sourceId,
    payload: { sceneId: source.sceneId, name: source.name },
  });
  revalidatePath('/control-room');
}

export async function moveSource(sourceId: string, direction: 'up' | 'down') {
  const source = await getScopedSource(sourceId);
  const swap = await prisma.sceneSource.findFirst({
    where: {
      workspaceId: DEMO_WORKSPACE_ID,
      broadcastId: source.broadcastId,
      sceneId: source.sceneId,
      order: direction === 'up' ? source.order - 1 : source.order + 1,
    },
  });
  if (!swap) return;
  await prisma.$transaction([
    prisma.sceneSource.update({ where: { id: source.id }, data: { order: swap.order } }),
    prisma.sceneSource.update({ where: { id: swap.id }, data: { order: source.order } }),
  ]);
  revalidatePath('/control-room');
}

export async function toggleSourceVisibility(sourceId: string) {
  const source = await getScopedSource(sourceId);
  await prisma.sceneSource.update({
    where: { id: sourceId },
    data: { isVisible: !source.isVisible },
  });
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: source.broadcastId,
    eventType: 'source:visibilityChanged',
    entityType: 'source',
    entityId: sourceId,
    payload: { sceneId: source.sceneId, isVisible: !source.isVisible },
  });
  revalidatePath('/control-room');
}

export async function toggleSourceLock(sourceId: string) {
  const source = await getScopedSource(sourceId);
  await prisma.sceneSource.update({
    where: { id: sourceId },
    data: { isLocked: !source.isLocked },
  });
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: source.broadcastId,
    eventType: 'source:lockChanged',
    entityType: 'source',
    entityId: sourceId,
    payload: { sceneId: source.sceneId, isLocked: !source.isLocked },
  });
  revalidatePath('/control-room');
}

export async function updateSourceSettings(sourceId: string, settings: Record<string, unknown>) {
  const source = await getScopedSource(sourceId);
  const parsed = sourceSettingsSchema.parse(settings);
  await prisma.sceneSource.update({
    where: { id: source.id },
    data: { settings: parsed as never },
  });
  revalidatePath('/control-room');
}

export async function updateSourceTransform(sourceId: string, transform: Record<string, unknown>) {
  const source = await getScopedSource(sourceId);
  const parsed = sourceTransformSchema.parse(transform);
  await prisma.sceneSource.update({
    where: { id: source.id },
    data: { transform: parsed as never },
  });
  revalidatePath('/control-room');
}
