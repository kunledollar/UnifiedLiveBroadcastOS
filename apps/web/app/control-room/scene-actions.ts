'use server';

import { PrismaClient } from '@ubos/db';
import { createSceneSchema, renameSceneSchema, SceneType, type Scene, type SceneLayout, type SceneSource } from '@ubos/shared';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();
export const DEMO_WORKSPACE_ID = 'demo-workspace';
export const DEMO_BROADCAST_ID = 'demo-broadcast';

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
  overlays: unknown;
  audioConfig: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function layoutFor(type: SceneType): SceneLayout {
  if (type === SceneType.Interview) return 'interview';
  if (type === SceneType.ScreenShare) return 'screen_share';
  if (type === SceneType.Camera) return 'solo';
  return 'picture_in_picture';
}

function canvases(type: SceneType) {
  return [
    { id: 'program', label: 'Program', aspectRatio: '16:9' as const, destinationHint: type === SceneType.ScreenShare ? 'Screen output' : 'Primary destinations' },
    { id: 'vertical', label: 'Vertical', aspectRatio: '9:16' as const, destinationHint: 'Short-form destinations' },
  ];
}

function toJsonArray(value: unknown): SceneSource[] {
  return Array.isArray(value) ? (value as unknown as SceneSource[]) : [];
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
    sources: toJsonArray(scene.sources),
    overlays: Array.isArray(scene.overlays) ? (scene.overlays as Record<string, unknown>[]) : [],
    audioConfig: typeof scene.audioConfig === 'object' && scene.audioConfig !== null && !Array.isArray(scene.audioConfig) ? (scene.audioConfig as Record<string, unknown>) : {},
    canvases: canvases(type),
    createdAt: scene.createdAt.toISOString(),
    updatedAt: scene.updatedAt.toISOString(),
  };
}

export async function ensureDemoBroadcast() {
  await prisma.workspace.upsert({ where: { id: DEMO_WORKSPACE_ID }, create: { id: DEMO_WORKSPACE_ID, name: 'Demo Workspace' }, update: {} });
  await prisma.broadcastSession.upsert({ where: { id: DEMO_BROADCAST_ID }, create: { id: DEMO_BROADCAST_ID, workspaceId: DEMO_WORKSPACE_ID, title: 'Launch Day Broadcast' }, update: {} });
  const count = await prisma.scene.count({ where: { broadcastId: DEMO_BROADCAST_ID } });
  if (count === 0) {
    await prisma.scene.createMany({ data: [
      { broadcastId: DEMO_BROADCAST_ID, name: 'Opening Countdown', type: 'COUNTDOWN', order: 0, isActive: false, layout: 'screen_share' },
      { broadcastId: DEMO_BROADCAST_ID, name: 'Host + Guest Interview', type: 'INTERVIEW', order: 1, isActive: true, layout: 'interview' },
      { broadcastId: DEMO_BROADCAST_ID, name: 'Product Demo + PiP', type: 'SCREEN_SHARE', order: 2, isActive: false, layout: 'picture_in_picture' },
    ] });
  }
}

async function assertWorkspaceAccess(broadcastId: string) {
  const session = await prisma.broadcastSession.findFirst({ where: { id: broadcastId, workspaceId: DEMO_WORKSPACE_ID } });
  if (!session) throw new Error('Broadcast not found in this workspace.');
}

async function normalizeOrder(broadcastId: string) {
  const scenes = await prisma.scene.findMany({ where: { broadcastId }, orderBy: { order: 'asc' } });
  await prisma.$transaction(scenes.map((scene, index) => prisma.scene.update({ where: { id: scene.id }, data: { order: index } })));
}

export async function getScenes(broadcastId = DEMO_BROADCAST_ID) {
  await ensureDemoBroadcast();
  await assertWorkspaceAccess(broadcastId);
  const scenes = await prisma.scene.findMany({ where: { broadcastId }, orderBy: { order: 'asc' } });
  return scenes.map(toScene);
}

export async function addScene(formData: FormData) {
  const broadcastId = String(formData.get('broadcastId') ?? DEMO_BROADCAST_ID);
  await assertWorkspaceAccess(broadcastId);
  const input = createSceneSchema.parse({ name: formData.get('name'), type: formData.get('type') || SceneType.Custom });
  const nextOrder = await prisma.scene.count({ where: { broadcastId } });
  await prisma.scene.create({ data: { broadcastId, name: input.name, type: typeToDb(input.type), layout: layoutFor(input.type), order: nextOrder } });
  revalidatePath('/control-room');
}

export async function renameScene(formData: FormData) {
  const sceneId = String(formData.get('sceneId'));
  const input = renameSceneSchema.parse({ name: formData.get('name') });
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw new Error('Scene not found.');
  await assertWorkspaceAccess(scene.broadcastId);
  await prisma.scene.update({ where: { id: sceneId }, data: { name: input.name } });
  revalidatePath('/control-room');
}

export async function switchScene(sceneId: string) {
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw new Error('Scene not found.');
  await assertWorkspaceAccess(scene.broadcastId);
  await prisma.$transaction([
    prisma.scene.updateMany({ where: { broadcastId: scene.broadcastId }, data: { isActive: false } }),
    prisma.scene.update({ where: { id: sceneId }, data: { isActive: true } }),
  ]);
  revalidatePath('/control-room');
}

export async function duplicateScene(sceneId: string) {
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw new Error('Scene not found.');
  await assertWorkspaceAccess(scene.broadcastId);
  const nextOrder = await prisma.scene.count({ where: { broadcastId: scene.broadcastId } });
  await prisma.scene.create({ data: { broadcastId: scene.broadcastId, name: `${scene.name} Copy`, type: scene.type, order: nextOrder, layout: scene.layout, sources: scene.sources, overlays: scene.overlays, audioConfig: scene.audioConfig, background: scene.background, thumbnailUrl: scene.thumbnailUrl } });
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
    const next = await prisma.scene.findFirst({ where: { broadcastId: scene.broadcastId }, orderBy: { order: 'asc' } });
    if (next) await prisma.scene.update({ where: { id: next.id }, data: { isActive: true } });
  }
  await normalizeOrder(scene.broadcastId);
  revalidatePath('/control-room');
}

export async function moveScene(sceneId: string, direction: 'up' | 'down') {
  const scene = await prisma.scene.findUnique({ where: { id: sceneId } });
  if (!scene) throw new Error('Scene not found.');
  await assertWorkspaceAccess(scene.broadcastId);
  const swap = await prisma.scene.findFirst({ where: { broadcastId: scene.broadcastId, order: direction === 'up' ? scene.order - 1 : scene.order + 1 } });
  if (!swap) return;
  await prisma.$transaction([
    prisma.scene.update({ where: { id: scene.id }, data: { order: swap.order } }),
    prisma.scene.update({ where: { id: swap.id }, data: { order: scene.order } }),
  ]);
  revalidatePath('/control-room');
}
