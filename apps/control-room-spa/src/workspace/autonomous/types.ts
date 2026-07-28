import type { AutonomousState, AutonomyLevel } from './AutonomousProvider';

export type SignalMap = Record<string, number>;
export type EngineConfig = {
  weights?: Record<string, number>;
  decayRate?: number;
};

export type Decision = 'ACT' | 'PREDICT' | 'PAUSE' | 'FALLBACK' | 'REQUEST_APPROVAL';
export type AutonomousAction = unknown;
export type DecisionContext = Pick<
  AutonomousState,
  'confidence' | 'severity' | 'permissions' | 'system'
> & {
  autonomyLevel: AutonomyLevel;
  action: AutonomousAction;
  systemState: AutonomousState['system'];
};

export type EventSink = {
  log: (event: string, action?: AutonomousAction) => void;
};
export type TimelineSink = {
  add: (event: string, action?: AutonomousAction) => void;
};
