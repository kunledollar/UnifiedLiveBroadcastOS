CREATE TYPE "SceneSourceType" AS ENUM ('CAMERA', 'SCREEN', 'MEDIA', 'OVERLAY', 'BROWSER', 'AUDIO');

CREATE TABLE "SceneSource" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "sceneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SceneSourceType" NOT NULL,
    "order" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "transform" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SceneSource_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SceneSource_workspaceId_idx" ON "SceneSource"("workspaceId");
CREATE INDEX "SceneSource_broadcastId_idx" ON "SceneSource"("broadcastId");
CREATE INDEX "SceneSource_sceneId_idx" ON "SceneSource"("sceneId");
CREATE INDEX "SceneSource_workspaceId_broadcastId_sceneId_order_idx" ON "SceneSource"("workspaceId", "broadcastId", "sceneId", "order");

ALTER TABLE "SceneSource" ADD CONSTRAINT "SceneSource_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SceneSource" ADD CONSTRAINT "SceneSource_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "BroadcastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SceneSource" ADD CONSTRAINT "SceneSource_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "Scene"("id") ON DELETE CASCADE ON UPDATE CASCADE;
