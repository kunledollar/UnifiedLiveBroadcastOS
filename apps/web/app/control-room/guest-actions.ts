'use server';

import { prisma } from '@ubos/db';
import {
  GuestStatus,
  guestInviteSchema,
  guestJoinSchema,
  renameGuestSchema,
  type Guest,
  type GuestInvite,
  type GuestRole,
} from '@ubos/shared';
import { revalidatePath } from 'next/cache';
import { randomBytes, randomUUID } from 'node:crypto';
import { ensureDemoBroadcast } from './scene-actions';

const DEMO_WORKSPACE_ID = 'demo-workspace';
const DEMO_BROADCAST_ID = 'demo-broadcast';

const statusToDb = (status: GuestStatus) => status.toUpperCase() as never;
const dbToStatus = (status: string) => status.toLowerCase() as GuestStatus;
const dbToRole = (role: string) => role.toLowerCase() as GuestRole;

function toGuest(guest: {
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
}): Guest {
  return {
    id: guest.id,
    workspaceId: guest.workspaceId,
    sessionId: guest.sessionId,
    inviteId: guest.inviteId,
    displayName: guest.displayName,
    status: dbToStatus(guest.status),
    role: dbToRole(guest.role),
    isMuted: guest.isMuted,
    isSpotlighted: guest.isSpotlighted,
    lastSeenAt: guest.lastSeenAt?.toISOString() ?? null,
    privateChatNote: guest.privateChatNote,
  };
}

function toInvite(invite: {
  id: string;
  workspaceId: string;
  sessionId: string;
  token: string;
  displayName: string | null;
  revokedAt: Date | null;
  acceptedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}): GuestInvite {
  return {
    ...invite,
    revokedAt: invite.revokedAt?.toISOString() ?? null,
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    expiresAt: invite.expiresAt?.toISOString() ?? null,
    createdAt: invite.createdAt.toISOString(),
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

async function getScopedGuest(guestId: string) {
  const guest = await prisma.guest.findFirst({
    where: {
      id: guestId,
      workspaceId: DEMO_WORKSPACE_ID,
      session: { workspaceId: DEMO_WORKSPACE_ID },
    },
  });
  if (!guest) throw new Error('Guest not found in this workspace.');
  return guest;
}

export async function listGuests(broadcastId = DEMO_BROADCAST_ID) {
  await assertBroadcast(broadcastId);
  const guests = await prisma.guest.findMany({
    where: { workspaceId: DEMO_WORKSPACE_ID, sessionId: broadcastId },
    orderBy: [{ isSpotlighted: 'desc' }, { createdAt: 'asc' }],
  });
  return guests.map(toGuest);
}

export async function listInvites(broadcastId = DEMO_BROADCAST_ID) {
  await assertBroadcast(broadcastId);
  const invites = await prisma.guestInvite.findMany({
    where: { workspaceId: DEMO_WORKSPACE_ID, sessionId: broadcastId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  return invites.map(toInvite);
}

export async function inviteGuest(formData: FormData) {
  const broadcast = await assertBroadcast(String(formData.get('broadcastId') ?? DEMO_BROADCAST_ID));
  const input = guestInviteSchema.parse({ displayName: formData.get('displayName') || undefined });
  const token = randomBytes(18).toString('base64url');
  const invite = await prisma.guestInvite.create({
    data: {
      workspaceId: DEMO_WORKSPACE_ID,
      sessionId: broadcast.id,
      token,
      displayName: input.displayName ?? null,
    },
  });
  await prisma.guest.create({
    data: {
      workspaceId: DEMO_WORKSPACE_ID,
      sessionId: broadcast.id,
      inviteId: invite.id,
      displayName: input.displayName || 'Invited Guest',
      status: 'INVITED',
      role: 'GUEST',
    },
  });
  revalidatePath('/control-room');
  return toInvite(invite);
}

export async function revokeInvite(inviteId: string) {
  await prisma.guestInvite.updateMany({
    where: {
      id: inviteId,
      workspaceId: DEMO_WORKSPACE_ID,
      session: { workspaceId: DEMO_WORKSPACE_ID },
    },
    data: { revokedAt: new Date() },
  });
  await prisma.guest.updateMany({
    where: { inviteId, workspaceId: DEMO_WORKSPACE_ID, status: 'INVITED' },
    data: { status: 'REMOVED' },
  });
  revalidatePath('/control-room');
}

async function setGuestStatus(
  guestId: string,
  status: GuestStatus,
  extra: Record<string, unknown> = {},
) {
  await getScopedGuest(guestId);
  await prisma.guest.update({
    where: { id: guestId },
    data: { status: statusToDb(status), ...extra },
  });
  revalidatePath('/control-room');
}
export async function admitGuest(id: string) {
  await setGuestStatus(id, GuestStatus.Connected);
}
export async function rejectGuest(id: string) {
  await setGuestStatus(id, GuestStatus.Rejected);
}
export async function muteGuest(id: string) {
  const guest = await getScopedGuest(id);
  await setGuestStatus(id, guest.isMuted ? GuestStatus.Connected : GuestStatus.Muted, {
    isMuted: !guest.isMuted,
  });
}
export async function removeGuest(id: string) {
  await setGuestStatus(id, GuestStatus.Removed);
}
export async function spotlightGuest(id: string) {
  const guest = await getScopedGuest(id);
  await prisma.guest.updateMany({
    where: { workspaceId: DEMO_WORKSPACE_ID, sessionId: guest.sessionId },
    data: { isSpotlighted: false },
  });
  await setGuestStatus(id, GuestStatus.OnAir, { isSpotlighted: true, isMuted: false });
}
export async function reconnectGuest(id: string) {
  await setGuestStatus(id, GuestStatus.Reconnecting);
}
export async function renameGuest(formData: FormData) {
  const input = renameGuestSchema.parse({
    guestId: formData.get('guestId'),
    displayName: formData.get('displayName'),
  });
  await getScopedGuest(input.guestId);
  await prisma.guest.update({
    where: { id: input.guestId },
    data: { displayName: input.displayName },
  });
  revalidatePath('/control-room');
}

export async function joinGreenRoom(formData: FormData) {
  const input = guestJoinSchema.parse({
    token: formData.get('token'),
    displayName: formData.get('displayName'),
    cameraReady: formData.get('cameraReady') === 'on',
    microphoneReady: formData.get('microphoneReady') === 'on',
    networkReady: formData.get('networkReady') === 'on',
    userAgent: formData.get('userAgent') || undefined,
  });
  const invite = await prisma.guestInvite.findFirst({
    where: { token: input.token, revokedAt: null, session: { workspaceId: DEMO_WORKSPACE_ID } },
  });
  if (!invite) throw new Error('Invite token is invalid or revoked.');
  const guest =
    (await prisma.guest.findFirst({
      where: { inviteId: invite.id, workspaceId: invite.workspaceId },
    })) ??
    (await prisma.guest.create({
      data: {
        workspaceId: invite.workspaceId,
        sessionId: invite.sessionId,
        inviteId: invite.id,
        displayName: input.displayName,
        status: 'WAITING',
        role: 'GUEST',
      },
    }));
  await prisma.guest.update({
    where: { id: guest.id },
    data: {
      displayName: input.displayName,
      status:
        input.cameraReady && input.microphoneReady && input.networkReady ? 'GREEN_ROOM' : 'WAITING',
      lastSeenAt: new Date(),
    },
  });
  await prisma.guestInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });
  await prisma.deviceInfo.create({
    data: {
      workspaceId: invite.workspaceId,
      broadcastId: invite.sessionId,
      guestId: guest.id,
      cameraReady: input.cameraReady,
      microphoneReady: input.microphoneReady,
      networkReady: input.networkReady,
      userAgent: input.userAgent ?? null,
    },
  });
  await prisma.guestSession.create({
    data: {
      workspaceId: invite.workspaceId,
      broadcastId: invite.sessionId,
      guestId: guest.id,
      connectionId: randomUUID(),
      status: 'GREEN_ROOM',
    },
  });
  revalidatePath('/control-room');
  revalidatePath('/guest');
}
