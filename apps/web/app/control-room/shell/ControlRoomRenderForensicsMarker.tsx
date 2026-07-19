'use client';

import { useRenderForensics } from '../render-forensics';

/** Records the server shell's client hydration render only in diagnostic mode. */
export function ControlRoomRenderForensicsMarker() {
  useRenderForensics('ControlRoomShell');
  return null;
}
