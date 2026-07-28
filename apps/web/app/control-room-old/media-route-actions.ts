'use server';

import { prisma } from '@ubos/db';
import { MediaRouteType, type MediaLayoutPreset, type MediaRoute } from '@ubos/shared';
import { revalidatePath } from 'next/cache';
import { ensureDemoBroadcast } from './scene-actions';
import { emitRealtimeEvent } from './realtime-actions';

const DEMO_WORKSPACE_ID = 'demo-workspace';
const DEMO_BROADCAST_ID = 'demo-broadcast';
const layoutPresets = [
  'full_screen',
  'side_by_side',
  'picture_in_picture',
  '2x2_grid',
  'speaker_focus',
] as const;
const routeTypes = Object.values(MediaRouteType);
function assertRouteId(routeId: string) {
  if (!routeId) throw new Error('Route id is required.');
}
const toDbType = (type: MediaRouteType) => type.toUpperCase() as never;
const dbToType = (type: string) => type.toLowerCase() as MediaRouteType;
const objectOrEmpty = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

type DbRoute = Awaited<ReturnType<typeof prisma.mediaRoute.findFirstOrThrow>> & {
  guest?: {
    id: string;
    workspaceId: string;
    sessionId: string;
    inviteId: string | null;
    displayName: string;
    status: string;
    role: string;
    isMuted: boolean;
    isSpotlighted: boolean;
    lastSeenAt: Date | null;
    privateChatNote: string | null;
  } | null;
};
function toRoute(route: DbRoute): MediaRoute {
  return {
    ...route,
    routeType: dbToType(String(route.routeType)),
    metadata: objectOrEmpty(route.metadata),
    guest: route.guest
      ? {
          ...route.guest,
          status: route.guest.status.toLowerCase() as never,
          role: route.guest.role.toLowerCase() as never,
          lastSeenAt: route.guest.lastSeenAt?.toISOString() ?? null,
        }
      : null,
    createdAt: route.createdAt.toISOString(),
    updatedAt: route.updatedAt.toISOString(),
  };
}
async function assertBroadcast(broadcastId = DEMO_BROADCAST_ID) {
  await ensureDemoBroadcast();
  const broadcast = await prisma.broadcastSession.findFirst({
    where: { id: broadcastId, workspaceId: DEMO_WORKSPACE_ID },
  });
  if (!broadcast) throw new Error('Broadcast not found in this workspace.');
  return broadcast;
}
async function getRoute(routeId: string) {
  const route = await prisma.mediaRoute.findFirst({
    where: { id: routeId, workspaceId: DEMO_WORKSPACE_ID, broadcastId: DEMO_BROADCAST_ID },
    include: { guest: true },
  });
  if (!route) throw new Error('Media route not found in this broadcast.');
  return route;
}
async function emit(
  eventType: Parameters<typeof emitRealtimeEvent>[0]['eventType'],
  routeId: string,
  payload: Record<string, unknown> = {},
) {
  await emitRealtimeEvent({
    workspaceId: DEMO_WORKSPACE_ID,
    broadcastId: DEMO_BROADCAST_ID,
    eventType,
    entityType: 'route',
    entityId: routeId,
    payload,
  });
  revalidatePath('/control-room');
}
export async function loadMediaRoutes(broadcastId = DEMO_BROADCAST_ID) {
  await assertBroadcast(broadcastId);
  const routes = await prisma.mediaRoute.findMany({
    where: { workspaceId: DEMO_WORKSPACE_ID, broadcastId },
    include: { guest: true },
    orderBy: [{ isPinned: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
  });
  return routes.map(toRoute);
}
export async function createRoute(formData: FormData) {
  const broadcast = await assertBroadcast(String(formData.get('broadcastId') ?? DEMO_BROADCAST_ID));
  const rawType = String(formData.get('routeType') || MediaRouteType.Placeholder);
  const displayName = String(formData.get('displayName') || '').trim();
  if (!displayName || displayName.length > 80) throw new Error('Route display name is required.');
  const input = {
    routeType: routeTypes.includes(rawType as MediaRouteType)
      ? (rawType as MediaRouteType)
      : MediaRouteType.Placeholder,
    displayName,
    guestId: formData.get('guestId') ? String(formData.get('guestId')) : undefined,
    sceneId: formData.get('sceneId') ? String(formData.get('sceneId')) : undefined,
  };
  if (input.guestId) await assertGuest(input.guestId, broadcast.id);
  const order = await prisma.mediaRoute.count({
    where: { workspaceId: DEMO_WORKSPACE_ID, broadcastId: broadcast.id },
  });
  const route = await prisma.mediaRoute.create({
    data: {
      workspaceId: DEMO_WORKSPACE_ID,
      broadcastId: broadcast.id,
      guestId: input.guestId ?? null,
      sceneId: input.sceneId ?? null,
      routeType: toDbType(input.routeType),
      displayName: input.displayName,
      order,
      metadata: { layoutPreset: 'full_screen' },
    },
    include: { guest: true },
  });
  await emit('route:created', route.id, { displayName: route.displayName });
  return toRoute(route);
}
async function assertGuest(guestId: string, broadcastId = DEMO_BROADCAST_ID) {
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, workspaceId: DEMO_WORKSPACE_ID, sessionId: broadcastId },
  });
  if (!guest) throw new Error('Guest not found in this broadcast.');
  return guest;
}
export async function assignGuestToRoute(routeId: string, guestId: string) {
  assertRouteId(routeId);
  const route = await getRoute(routeId);
  const guest = await assertGuest(guestId, route.broadcastId);
  const updated = await prisma.mediaRoute.update({
    where: { id: route.id },
    data: { guestId: guest.id, displayName: guest.displayName, routeType: 'GUEST_CAMERA' },
    include: { guest: true },
  });
  await emit('route:created', updated.id, { guestId });
  return toRoute(updated);
}
export async function removeRoute(routeId: string) {
  assertRouteId(routeId);
  const route = await getRoute(routeId);
  await prisma.mediaRoute.delete({ where: { id: route.id } });
  await emit('route:removed', route.id);
}
export async function setRoutePinned(routeId: string, pinned?: boolean) {
  const route = await getRoute(routeId);
  const updated = await prisma.mediaRoute.update({
    where: { id: route.id },
    data: { isPinned: pinned ?? !route.isPinned },
    include: { guest: true },
  });
  await emit('route:pinned', route.id, { isPinned: updated.isPinned });
  return toRoute(updated);
}
export async function setRouteMuted(routeId: string, muted?: boolean) {
  const route = await getRoute(routeId);
  const updated = await prisma.mediaRoute.update({
    where: { id: route.id },
    data: { isMuted: muted ?? !route.isMuted },
    include: { guest: true },
  });
  await emit('route:muted', route.id, { isMuted: updated.isMuted });
  return toRoute(updated);
}
export async function setOnProgramRoute(routeId: string | null) {
  if (routeId) await getRoute(routeId);
  await prisma.$transaction([
    prisma.mediaRoute.updateMany({
      where: { workspaceId: DEMO_WORKSPACE_ID, broadcastId: DEMO_BROADCAST_ID },
      data: { isOnProgram: false },
    }),
    ...(routeId
      ? [
          prisma.mediaRoute.update({
            where: { id: routeId },
            data: { isOnProgram: true, isActive: true },
          }),
        ]
      : []),
  ]);
  await emit('route:programChanged', routeId ?? 'program', { routeId });
}
export async function setOnVerticalRoute(routeId: string | null) {
  if (routeId) await getRoute(routeId);
  const routes = await prisma.mediaRoute.findMany({
    where: { workspaceId: DEMO_WORKSPACE_ID, broadcastId: DEMO_BROADCAST_ID },
  });
  await prisma.$transaction(
    routes.map((route) => {
      const onVertical = routeId === route.id;
      const metadata = { ...objectOrEmpty(route.metadata), onVertical };
      return prisma.mediaRoute.update({
        where: { id: route.id },
        data: onVertical ? { metadata, isActive: true } : { metadata },
      });
    }),
  );
  await emit('route:layoutChanged', routeId ?? 'vertical', { onVertical: routeId });
}
export async function assignRouteToScene(routeId: string, sceneId: string | null) {
  const route = await getRoute(routeId);
  if (sceneId) {
    const scene = await prisma.scene.findFirst({
      where: { id: sceneId, broadcastId: route.broadcastId },
    });
    if (!scene) throw new Error('Scene not found in this broadcast.');
  }
  const updated = await prisma.mediaRoute.update({
    where: { id: route.id },
    data: { sceneId },
    include: { guest: true },
  });
  await emit('route:sceneAssigned', route.id, { sceneId });
  return toRoute(updated);
}
export async function reorderRoutes(routeIds: string[]) {
  const ids = routeIds.filter(Boolean);
  if (ids.length !== routeIds.length) throw new Error('Route ids are required.');
  await Promise.all(
    ids.map((id, order) =>
      prisma.mediaRoute.updateMany({
        where: { id, workspaceId: DEMO_WORKSPACE_ID, broadcastId: DEMO_BROADCAST_ID },
        data: { order },
      }),
    ),
  );
  await emit('route:layoutChanged', 'routes', { routeIds: ids });
}
export async function updateLayoutSlot(routeId: string, layoutSlot: string | null) {
  const route = await getRoute(routeId);
  const updated = await prisma.mediaRoute.update({
    where: { id: route.id },
    data: { layoutSlot: layoutSlot ? layoutSlot.trim().slice(0, 32) : null },
    include: { guest: true },
  });
  await emit('route:layoutChanged', route.id, { layoutSlot });
  return toRoute(updated);
}
export async function updateRouteLayoutPreset(routeId: string, layoutPreset: MediaLayoutPreset) {
  const route = await getRoute(routeId);
  const preset = layoutPresets.includes(layoutPreset) ? layoutPreset : 'full_screen';
  const updated = await prisma.mediaRoute.update({
    where: { id: route.id },
    data: { metadata: { ...objectOrEmpty(route.metadata), layoutPreset: preset } },
    include: { guest: true },
  });
  await emit('route:layoutChanged', route.id, { layoutPreset: preset });
  return toRoute(updated);
}

export async function seedDemoProductionState() {
  await assertBroadcast(DEMO_BROADCAST_ID);
  const guests = await prisma.guest.findMany({
    where: { workspaceId: DEMO_WORKSPACE_ID, sessionId: DEMO_BROADCAST_ID },
  });
  if (guests.length === 0) {
    await prisma.guest.createMany({
      data: [
        {
          workspaceId: DEMO_WORKSPACE_ID,
          sessionId: DEMO_BROADCAST_ID,
          displayName: 'Avery Host',
          status: 'CONNECTED',
          role: 'HOST',
          isSpotlighted: true,
          lastSeenAt: new Date(),
        },
        {
          workspaceId: DEMO_WORKSPACE_ID,
          sessionId: DEMO_BROADCAST_ID,
          displayName: 'Jordan Guest',
          status: 'CONNECTED',
          role: 'GUEST',
          lastSeenAt: new Date(),
        },
      ],
    });
  }
  const scenes = await prisma.scene.findMany({
    where: { broadcastId: DEMO_BROADCAST_ID },
    orderBy: { order: 'asc' },
  });
  const routes = await prisma.mediaRoute.findMany({
    where: { workspaceId: DEMO_WORKSPACE_ID, broadcastId: DEMO_BROADCAST_ID },
  });
  if (routes.length === 0) {
    const [host, guest] = await prisma.guest.findMany({
      where: { workspaceId: DEMO_WORKSPACE_ID, sessionId: DEMO_BROADCAST_ID },
      orderBy: { createdAt: 'asc' },
      take: 2,
    });
    await prisma.mediaRoute.createMany({
      data: [
        {
          workspaceId: DEMO_WORKSPACE_ID,
          broadcastId: DEMO_BROADCAST_ID,
          guestId: host?.id ?? null,
          sceneId: scenes[1]?.id ?? scenes[0]?.id ?? null,
          routeType: 'HOST_CAMERA',
          displayName: host?.displayName ?? 'Avery Host',
          isOnProgram: true,
          order: 0,
          metadata: { layoutPreset: 'side_by_side', demo: true, activeSpeaker: true },
        },
        {
          workspaceId: DEMO_WORKSPACE_ID,
          broadcastId: DEMO_BROADCAST_ID,
          guestId: guest?.id ?? null,
          sceneId: scenes[1]?.id ?? scenes[0]?.id ?? null,
          routeType: 'GUEST_CAMERA',
          displayName: guest?.displayName ?? 'Jordan Guest',
          order: 1,
          metadata: { demo: true },
        },
        {
          workspaceId: DEMO_WORKSPACE_ID,
          broadcastId: DEMO_BROADCAST_ID,
          sceneId: scenes[2]?.id ?? scenes[0]?.id ?? null,
          routeType: 'SCREEN_SHARE',
          displayName: 'Product Screen Share',
          order: 2,
          metadata: { demo: true, onVertical: true },
        },
      ],
    });
  }
  await emit('production:demoSeeded', 'demo', {});
}

export async function simulateDemoProduction() {
  await assertBroadcast(DEMO_BROADCAST_ID);
  const routes = await prisma.mediaRoute.findMany({
    where: { workspaceId: DEMO_WORKSPACE_ID, broadcastId: DEMO_BROADCAST_ID },
    orderBy: { order: 'asc' },
  });
  const activeIndex = routes.findIndex(
    (route) => objectOrEmpty(route.metadata).activeSpeaker === true,
  );
  const next = routes[(activeIndex + 1 + routes.length) % Math.max(routes.length, 1)];
  await Promise.all([
    prisma.mediaRoute.updateMany({
      where: { workspaceId: DEMO_WORKSPACE_ID, broadcastId: DEMO_BROADCAST_ID },
      data: { metadata: { demo: true } },
    }),
    ...(next
      ? [
          prisma.mediaRoute.update({
            where: { id: next.id },
            data: {
              isActive: true,
              metadata: { ...objectOrEmpty(next.metadata), demo: true, activeSpeaker: true },
            },
          }),
        ]
      : []),
    prisma.guest.updateMany({
      where: { workspaceId: DEMO_WORKSPACE_ID, sessionId: DEMO_BROADCAST_ID },
      data: { status: 'CONNECTED', lastSeenAt: new Date() },
    }),
  ]);
  await emit('production:demoSimulated', next?.id ?? 'demo', { activeSpeakerRouteId: next?.id });
}

export async function resetDemoProductionState() {
  await assertBroadcast(DEMO_BROADCAST_ID);
  await prisma.mediaRoute.deleteMany({
    where: {
      workspaceId: DEMO_WORKSPACE_ID,
      broadcastId: DEMO_BROADCAST_ID,
      metadata: { path: ['demo'], equals: true },
    },
  });
  await prisma.guest.deleteMany({
    where: {
      workspaceId: DEMO_WORKSPACE_ID,
      sessionId: DEMO_BROADCAST_ID,
      displayName: { in: ['Avery Host', 'Jordan Guest'] },
    },
  });
  await emit('production:demoReset', 'demo', {});
}
