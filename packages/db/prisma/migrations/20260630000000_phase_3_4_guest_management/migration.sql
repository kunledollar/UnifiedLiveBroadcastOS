-- Phase 3.4 Guest Management
ALTER TYPE "GuestStatus" ADD VALUE IF NOT EXISTS 'GREEN_ROOM';
ALTER TYPE "GuestStatus" ADD VALUE IF NOT EXISTS 'CONNECTED';
ALTER TYPE "GuestStatus" ADD VALUE IF NOT EXISTS 'MUTED';
ALTER TYPE "GuestStatus" ADD VALUE IF NOT EXISTS 'DISCONNECTED';
ALTER TYPE "GuestStatus" ADD VALUE IF NOT EXISTS 'RECONNECTING';
ALTER TYPE "GuestStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "Guest" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "Guest" ADD COLUMN "inviteId" TEXT;
ALTER TABLE "Guest" ADD COLUMN "isMuted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guest" ADD COLUMN "isSpotlighted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Guest" ADD COLUMN "privateChatNote" TEXT;
ALTER TABLE "Guest" ADD COLUMN "lastSeenAt" TIMESTAMP(3);
UPDATE "Guest" SET "workspaceId" = "BroadcastSession"."workspaceId" FROM "BroadcastSession" WHERE "Guest"."sessionId" = "BroadcastSession"."id";
ALTER TABLE "Guest" ALTER COLUMN "workspaceId" SET NOT NULL;

CREATE TABLE "GuestInvite" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "displayName" TEXT,
  "revokedAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GuestInvite_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "GuestSession" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "broadcastId" TEXT NOT NULL,
  "guestId" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "status" "GuestStatus" NOT NULL DEFAULT 'GREEN_ROOM',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "disconnectedAt" TIMESTAMP(3),
  CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DeviceInfo" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "broadcastId" TEXT NOT NULL,
  "guestId" TEXT NOT NULL,
  "cameraReady" BOOLEAN NOT NULL DEFAULT false,
  "microphoneReady" BOOLEAN NOT NULL DEFAULT false,
  "networkReady" BOOLEAN NOT NULL DEFAULT false,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeviceInfo_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GuestInvite_token_key" ON "GuestInvite"("token");
CREATE UNIQUE INDEX "GuestSession_connectionId_key" ON "GuestSession"("connectionId");
CREATE INDEX "Guest_workspaceId_idx" ON "Guest"("workspaceId");
CREATE INDEX "Guest_workspaceId_sessionId_idx" ON "Guest"("workspaceId", "sessionId");
CREATE INDEX "GuestInvite_workspaceId_idx" ON "GuestInvite"("workspaceId");
CREATE INDEX "GuestInvite_sessionId_idx" ON "GuestInvite"("sessionId");
CREATE INDEX "GuestInvite_workspaceId_sessionId_idx" ON "GuestInvite"("workspaceId", "sessionId");
CREATE INDEX "GuestInvite_revokedAt_idx" ON "GuestInvite"("revokedAt");
CREATE INDEX "GuestSession_workspaceId_idx" ON "GuestSession"("workspaceId");
CREATE INDEX "GuestSession_broadcastId_idx" ON "GuestSession"("broadcastId");
CREATE INDEX "GuestSession_guestId_idx" ON "GuestSession"("guestId");
CREATE INDEX "GuestSession_workspaceId_broadcastId_idx" ON "GuestSession"("workspaceId", "broadcastId");
CREATE INDEX "DeviceInfo_workspaceId_idx" ON "DeviceInfo"("workspaceId");
CREATE INDEX "DeviceInfo_broadcastId_idx" ON "DeviceInfo"("broadcastId");
CREATE INDEX "DeviceInfo_guestId_idx" ON "DeviceInfo"("guestId");
CREATE INDEX "DeviceInfo_workspaceId_broadcastId_idx" ON "DeviceInfo"("workspaceId", "broadcastId");
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "GuestInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GuestInvite" ADD CONSTRAINT "GuestInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestInvite" ADD CONSTRAINT "GuestInvite_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BroadcastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestSession" ADD CONSTRAINT "GuestSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestSession" ADD CONSTRAINT "GuestSession_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "BroadcastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuestSession" ADD CONSTRAINT "GuestSession_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeviceInfo" ADD CONSTRAINT "DeviceInfo_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeviceInfo" ADD CONSTRAINT "DeviceInfo_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "BroadcastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeviceInfo" ADD CONSTRAINT "DeviceInfo_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
