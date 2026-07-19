import type { ControlRoomDiagnostics } from './diagnostic-types';
declare global {
  interface Window {
    __UBOS_CONTROL_ROOM_DIAGNOSTICS__?: ControlRoomDiagnostics;
  }
}
export {};
