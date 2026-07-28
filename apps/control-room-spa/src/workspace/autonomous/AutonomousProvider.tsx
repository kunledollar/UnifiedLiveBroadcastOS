'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export type AutonomousState = {
  autonomyLevel: AutonomyLevel;
  confidence: number;
  severity: number;
  permissions: { allowed: boolean };
  system: {
    outputHealth: 'healthy' | 'degraded' | 'critical';
    routingHealth: 'stable' | 'degraded';
    graphicsLoad: number;
    audioPeak: number;
    streamingHealth: 'stable' | 'degraded';
  };
  logs: string[];
  timeline: string[];
};

type AutonomousContextValue = {
  state: AutonomousState;
  setState: Dispatch<SetStateAction<AutonomousState>>;
};

export const AutonomousContext = createContext<AutonomousContextValue | null>(null);

const initialState: AutonomousState = {
  autonomyLevel: 0,
  confidence: 0,
  severity: 0,
  permissions: { allowed: false },
  system: {
    outputHealth: 'healthy',
    routingHealth: 'stable',
    graphicsLoad: 0,
    audioPeak: 0,
    streamingHealth: 'stable',
  },
  logs: [],
  timeline: [],
};

export function AutonomousProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AutonomousState>(initialState);
  const value = useMemo(() => ({ state, setState }), [state]);

  return (
    <AutonomousContext.Provider value={value}>
      {children}
    </AutonomousContext.Provider>
  );
}

export function useAutonomous() {
  const context = useContext(AutonomousContext);
  if (!context) {
    throw new Error('useAutonomous must be used within AutonomousProvider');
  }
  return context;
}
