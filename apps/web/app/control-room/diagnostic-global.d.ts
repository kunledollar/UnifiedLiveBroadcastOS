import type { ControlRoomDiagnostics } from './diagnostic-types';
declare global {
  interface Window {
    __UBOS_CONTROL_ROOM_DIAGNOSTICS__?: ControlRoomDiagnostics;
    __UBOS_RENDER_FORENSICS_FLAGS__?: Record<string, boolean>;
  }
}
export {};
