CREATE TYPE "SceneType" AS ENUM ('INTRO', 'COUNTDOWN', 'CAMERA', 'INTERVIEW', 'SCREEN_SHARE', 'BREAK', 'OUTRO', 'CUSTOM');

CREATE TABLE "Scene" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SceneType" NOT NULL DEFAULT 'CUSTOM',
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "thumbnailUrl" TEXT,
    "background" JSONB,
    "layout" TEXT,
    "sources" JSONB NOT NULL DEFAULT '[]',
    "overlays" JSONB NOT NULL DEFAULT '[]',
    "audioConfig" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Scene_broadcastId_idx" ON "Scene"("broadcastId");
CREATE INDEX "Scene_broadcastId_order_idx" ON "Scene"("broadcastId", "order");
CREATE INDEX "Scene_broadcastId_isActive_idx" ON "Scene"("broadcastId", "isActive");
ALTER TABLE "Scene" ADD CONSTRAINT "Scene_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "BroadcastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
