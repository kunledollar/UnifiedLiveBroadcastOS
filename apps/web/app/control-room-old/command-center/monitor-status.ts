export type MonitorStatusInfo = {
  resolution: string;
  fps: string;
  sourceName: string;
  state: 'live' | 'program' | 'preview' | 'standby';
  audioLevel?: number | null;
  audioMuted?: boolean;
};
