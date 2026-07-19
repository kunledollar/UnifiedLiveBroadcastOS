import type { DiagnosticScenarioId } from '../diagnostic-types';
export const scenarios: Record<
  DiagnosticScenarioId,
  { label: string; params: Record<string, string> }
> = {
  baseline: { label: 'Baseline', params: { diagnostic: 'baseline' } },
  'static-shell': { label: 'Static shell', params: { diagnostic: 'static' } },
  'audio-disabled': {
    label: 'Audio disabled',
    params: { diagnostic: 'baseline', disableAudio: '1' },
  },
  'video-disabled': {
    label: 'Video disabled',
    params: { diagnostic: 'baseline', disableVideo: '1' },
  },
  'scenes-disabled': {
    label: 'Scenes disabled',
    params: { diagnostic: 'baseline', disableScenes: '1' },
  },
  'recording-disabled': {
    label: 'Recording disabled',
    params: { diagnostic: 'baseline', disableRecording: '1' },
  },
  'runtime-disabled': {
    label: 'Runtime disabled',
    params: { diagnostic: 'baseline', disableRuntime: '1' },
  },
  'animations-disabled': {
    label: 'Animations disabled',
    params: { diagnostic: 'baseline', disableAnimations: '1' },
  },
  'canvas-video-hidden': {
    label: 'Canvas/video hidden',
    params: { diagnostic: 'baseline', hideVideoCanvas: '1' },
  },
  'all-live-subsystems-disabled': {
    label: 'All live subsystems disabled',
    params: {
      diagnostic: 'baseline',
      disableAudio: '1',
      disableVideo: '1',
      disableScenes: '1',
      disableRecording: '1',
      disableRuntime: '1',
    },
  },
};
export function scenarioUrl(scenario: DiagnosticScenarioId) {
  const query = new URLSearchParams(scenarios[scenario].params);
  return `/control-room?${query}`;
}
export function parseIsolationFlags(params: URLSearchParams) {
  return Object.fromEntries(
    [
      'disableAudio',
      'disableVideo',
      'disableScenes',
      'disableRecording',
      'disableRuntime',
      'disableAnimations',
      'hideVideoCanvas',
    ].map((key) => [key, params.get(key) === '1']),
  );
}
