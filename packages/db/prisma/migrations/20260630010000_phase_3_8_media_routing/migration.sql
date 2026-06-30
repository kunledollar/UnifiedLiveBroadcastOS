CREATE TYPE "MediaRouteType" AS ENUM ('GUEST_CAMERA', 'GUEST_SCREEN_SHARE', 'HOST_CAMERA', 'MEDIA_SOURCE', 'SCREEN_SHARE', 'PLACEHOLDER');

CREATE TABLE "MediaRoute" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "broadcastId" TEXT NOT NULL,
  "guestId" TEXT,
  "sourceId" TEXT,
  "sceneId" TEXT,
  "routeType" "MediaRouteType" NOT NULL,
  "displayName" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isOnProgram" BOOLEAN NOT NULL DEFAULT false,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "isMuted" BOOLEAN NOT NULL DEFAULT false,
  "layoutSlot" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaRoute_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MediaRoute" ADD CONSTRAINT "MediaRoute_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaRoute" ADD CONSTRAINT "MediaRoute_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "BroadcastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaRoute" ADD CONSTRAINT "MediaRoute_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaRoute" ADD CONSTRAINT "MediaRoute_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "MediaRoute_workspaceId_idx" ON "MediaRoute"("workspaceId");
CREATE INDEX "MediaRoute_broadcastId_idx" ON "MediaRoute"("broadcastId");
CREATE INDEX "MediaRoute_guestId_idx" ON "MediaRoute"("guestId");
CREATE INDEX "MediaRoute_sceneId_idx" ON "MediaRoute"("sceneId");
CREATE INDEX "MediaRoute_workspaceId_broadcastId_idx" ON "MediaRoute"("workspaceId", "broadcastId");
CREATE INDEX "MediaRoute_workspaceId_broadcastId_order_idx" ON "MediaRoute"("workspaceId", "broadcastId", "order");
