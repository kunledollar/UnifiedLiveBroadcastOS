'use client';

import { useRenderForensics } from '../render-forensics';

type ControlRoomRenderForensicsSummary = {
  sceneCount: number;
  sceneIds: string;
  programSceneId: string;
  previewSceneId: string;
  layoutCount: number;
  channelCount: number;
  assetCount: number;
  mediaRouteCount: number;
  guestCount: number;
  inviteCount: number;
  destinationCount: number;
  messageCount: number;
  healthMetricCount: number;
  graphRevision: number | null;
};

/**
 * Client boundary for Server Component shell diagnostics. `summary` contains
 * only primitive values, so it is safe to serialize through React Flight and
 * does not retain production objects or browser/runtime handles.
 */
export function ControlRoomRenderForensicsMarker({
  summary,
}: {
  summary: ControlRoomRenderForensicsSummary;
}) {
  useRenderForensics('ControlRoomShell', summary);
  return null;
}
