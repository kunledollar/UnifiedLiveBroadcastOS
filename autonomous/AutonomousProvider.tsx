import { createContext, useState } from "react";
import { ConfidenceEngine } from "./confidence/ConfidenceEngine";
import { SeverityEngine } from "./severity/SeverityEngine";
import { DecisionEngine } from "./decision/DecisionEngine";
import { RecoveryEngine } from "./recovery/RecoveryEngine";
import { FallbackEngine } from "./fallback/FallbackEngine";
import { AutonomousCoordinator } from "./coordinator/AutonomousCoordinator";

export const AutonomousContext = createContext(null);

export function AutonomousProvider({ children }) {
  const [state, setState] = useState({
    autonomyLevel: 0,
    confidence: 0,
    severity: 0,
    permissions: { allowed: false },
    system: {
      outputHealth: "healthy",
      routingHealth: "stable",
      graphicsLoad: 0,
      audioPeak: 0,
      streamingHealth: "stable"
    },
    logs: [],
    timeline: []
  });

  const engines = {
    confidence: new ConfidenceEngine({ weights: {}, minConfidence: 0.5 }),
    severity: new SeverityEngine({ weights: {}, maxSeverity: 0.5 }),
    decision: new DecisionEngine({
      levels: {
        0: { minConfidence: 1, maxSeverity: 0 },
        1: { minConfidence: 0.4, maxSeverity: 0.3 },
        2: { minConfidence: 0.6, maxSeverity: 0.4 },
        3: { minConfidence: 0.7, maxSeverity: 0.5 },
        4: { minConfidence: 0.8, maxSeverity: 0.6 }
      }
    }),
    recovery: new RecoveryEngine({}),
    fallback: new FallbackEngine({})
  };

  const coordinator = new AutonomousCoordinator({
    decisionEngine: engines.decision,
    actions: { execute: (action) => {} },
    fallback: engines.fallback,
    recovery: engines.recovery,
    logger: { log: () => {} },
    timeline: { add: () => {} }
  });

  return (
    <AutonomousContext.Provider value={{ state, setState, engines, coordinator }}>
      {children}
    </AutonomousContext.Provider>
  );
}
