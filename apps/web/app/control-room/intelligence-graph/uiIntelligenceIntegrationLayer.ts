/**
 * UI Intelligence Integration Layer (UIIL) — Step 90
 *
 * Connects Workspace Intelligence Engine (WIE) signals to actual UI state.
 * Applies highlight / dim / warn / pulse / prepare / suppress / elevate
 * onto Control Room panels, zones, and the workspace shell.
 *
 * Transforms UBOS from "I know what matters" into
 * "I visually show you what matters."
 */

import type {
  UiPanelId,
  UiSignalAction,
  WorkspaceUiSignal,
} from './workspaceIntelligenceEngine.js';

export type UiPanelVisualState = {
  highlighted: boolean;
  dimmed: boolean;
  warned: boolean;
  pulsing: boolean;
  prepared: boolean;
  suppressed: boolean;
  elevated: boolean;
};

export type UiIntelligencePanel = {
  id: UiPanelId;
  state: UiPanelVisualState;
  lastUpdate: number;
  /** Winning WIE action after apply (if any). */
  action: UiSignalAction | null;
  reason: string | null;
};

export type UiIntelligenceState = {
  panels: Record<UiPanelId, UiIntelligencePanel>;
  lastApply: number;
  signalCount: number;
};

/** CSS class names consumed by Control Room wrappers (Phase 1). */
export const UI_ACTION_CLASS: Record<UiSignalAction, string> = {
  highlight: 'ubos-highlight',
  dim: 'ubos-dim',
  warn: 'ubos-warn',
  pulse: 'ubos-pulse',
  prepare: 'ubos-prepare',
  suppress: 'ubos-suppress',
  elevate: 'ubos-elevated',
};

const PANEL_IDS: UiPanelId[] = [
  'scenePanel',
  'graphicsPanel',
  'audioPanel',
  'routingPanel',
  'programOutputPanel',
  'replayPanel',
  'automationPanel',
  'operatorPanel',
  'systemPanel',
  'guidancePanel',
  'workspaceShell',
];

/**
 * Geometry zone id → WIE panel candidates (highest-priority action wins).
 * Triad maps to both program output and scene because it hosts both surfaces.
 * Inspector (Step 101) maps to every domain it diagnoses — scene, graphics,
 * audio, routing, and output — plus operator/guidance, since Inspector 2.0
 * is explicitly the cross-domain "diagnostic heart" of UBOS, not scoped to
 * one surface the way Triad or a single composer zone is. Output (Step 102)
 * maps to program output, scene (its Preview region), routing (its Routing
 * & Destination region), and guidance (its Intelligence Timeline region),
 * since Program Output 2.0 now surfaces all four in one zone.
 */
export const ZONE_TO_PANELS: Readonly<Record<string, readonly UiPanelId[]>> = {
  scene: ['scenePanel'],
  triad: ['programOutputPanel', 'scenePanel'],
  inspector: [
    'operatorPanel',
    'guidancePanel',
    'scenePanel',
    'graphicsPanel',
    'audioPanel',
    'routingPanel',
    'programOutputPanel',
  ],
  output: ['programOutputPanel', 'scenePanel', 'routingPanel', 'guidancePanel'],
  'graphics-composer': ['graphicsPanel'],
  'audio-mixer': ['audioPanel'],
  'routing-map': ['routingPanel'],
  'replay-monitor': ['replayPanel'],
  'automation-graph': ['automationPanel'],
  'rule-list': ['automationPanel'],
  'ai-crew-overlay': ['operatorPanel', 'guidancePanel'],
  'system-health': ['systemPanel'],
  graph: ['guidancePanel'],
  'intelligence-graph': ['guidancePanel'],
  'destination-monitor': ['programOutputPanel'],
  'output-health': ['programOutputPanel'],
  workbench: ['guidancePanel'],
};

function emptyVisualState(): UiPanelVisualState {
  return {
    highlighted: false,
    dimmed: false,
    warned: false,
    pulsing: false,
    prepared: false,
    suppressed: false,
    elevated: false,
  };
}

function makePanel(id: UiPanelId): UiIntelligencePanel {
  return {
    id,
    state: emptyVisualState(),
    lastUpdate: 0,
    action: null,
    reason: null,
  };
}

function actionPriority(action: UiSignalAction): number {
  switch (action) {
    case 'highlight':
      return 5;
    case 'warn':
      return 4;
    case 'pulse':
      return 3;
    case 'prepare':
      return 2;
    case 'elevate':
      return 2;
    case 'dim':
      return 1;
    case 'suppress':
      return 0;
    default:
      return 0;
  }
}

function applyActionToState(state: UiPanelVisualState, action: UiSignalAction): void {
  switch (action) {
    case 'highlight':
      state.highlighted = true;
      break;
    case 'dim':
      state.dimmed = true;
      break;
    case 'warn':
      state.warned = true;
      break;
    case 'pulse':
      state.pulsing = true;
      break;
    case 'prepare':
      state.prepared = true;
      break;
    case 'suppress':
      state.suppressed = true;
      break;
    case 'elevate':
      state.elevated = true;
      break;
  }
}

/** Build CSS class string from a panel visual state. */
export function uiStateClassName(state: UiPanelVisualState): string {
  return [
    state.highlighted && UI_ACTION_CLASS.highlight,
    state.dimmed && UI_ACTION_CLASS.dim,
    state.warned && UI_ACTION_CLASS.warn,
    state.pulsing && UI_ACTION_CLASS.pulse,
    state.prepared && UI_ACTION_CLASS.prepare,
    state.suppressed && UI_ACTION_CLASS.suppress,
    state.elevated && UI_ACTION_CLASS.elevate,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Map a single WIE action to its CSS class. */
export function uiActionClassName(action: UiSignalAction | null | undefined): string {
  if (!action) return '';
  return UI_ACTION_CLASS[action] ?? '';
}

export class UIIntegrationLayer {
  private uiState: UiIntelligenceState;
  private workspaceSignals: readonly WorkspaceUiSignal[] = [];

  constructor(workspaceSignals: readonly WorkspaceUiSignal[] = []) {
    this.uiState = this.createEmptyState();
    this.workspaceSignals = workspaceSignals;
  }

  /** Replace the signal batch used by the next apply(). */
  setSignals(workspaceSignals: readonly WorkspaceUiSignal[]): void {
    this.workspaceSignals = workspaceSignals;
  }

  /**
   * Apply current (or provided) WIE signals onto panel UI state.
   * Resets prior flags so stale highlights do not linger across ticks.
   */
  apply(workspaceSignals?: readonly WorkspaceUiSignal[]): UiIntelligenceState {
    if (workspaceSignals) this.workspaceSignals = workspaceSignals;

    const now = Date.now();
    const panels = this.createEmptyPanels();

    // Track best action per panel (WIE already dedupes, but stay safe)
    const best = new Map<UiPanelId, WorkspaceUiSignal>();
    for (const signal of this.workspaceSignals) {
      const existing = best.get(signal.panel);
      if (
        !existing ||
        actionPriority(signal.action) > actionPriority(existing.action) ||
        (actionPriority(signal.action) === actionPriority(existing.action) &&
          signal.confidence > existing.confidence)
      ) {
        best.set(signal.panel, signal);
      }
    }

    for (const signal of best.values()) {
      const panel = panels[signal.panel];
      applyActionToState(panel.state, signal.action);
      panel.action = signal.action;
      panel.reason = signal.reason;
      panel.lastUpdate = now;
    }

    this.uiState = {
      panels,
      lastApply: now,
      signalCount: best.size,
    };
    return this.uiState;
  }

  getState(): UiIntelligenceState {
    return this.uiState;
  }

  getPanel(panelId: UiPanelId): UiIntelligencePanel {
    return this.uiState.panels[panelId];
  }

  getPanelState(panelId: UiPanelId): UiPanelVisualState {
    return this.uiState.panels[panelId].state;
  }

  getPanelAction(panelId: UiPanelId): UiSignalAction | null {
    return this.uiState.panels[panelId].action;
  }

  /** CSS classes for a WIE panel id. */
  classNameForPanel(panelId: UiPanelId): string {
    return uiStateClassName(this.uiState.panels[panelId].state);
  }

  /**
   * CSS classes for a geometry zone id.
   * Picks the highest-priority panel action among mapped candidates.
   */
  classNameForZone(zoneId: string): string {
    const action = this.actionForZone(zoneId);
    return uiActionClassName(action);
  }

  actionForZone(zoneId: string): UiSignalAction | null {
    const candidates = ZONE_TO_PANELS[zoneId];
    if (!candidates || candidates.length === 0) return null;

    let best: UiSignalAction | null = null;
    let bestPriority = -1;
    for (const panelId of candidates) {
      const action = this.uiState.panels[panelId]?.action ?? null;
      if (!action) continue;
      const priority = actionPriority(action);
      if (priority > bestPriority) {
        best = action;
        bestPriority = priority;
      }
    }
    return best;
  }

  /** Whether the workspace shell should show elevation. */
  isWorkspaceElevated(): boolean {
    return this.uiState.panels.workspaceShell.state.elevated;
  }

  reset(): void {
    this.workspaceSignals = [];
    this.uiState = this.createEmptyState();
  }

  private createEmptyPanels(): Record<UiPanelId, UiIntelligencePanel> {
    const panels = {} as Record<UiPanelId, UiIntelligencePanel>;
    for (const id of PANEL_IDS) {
      panels[id] = makePanel(id);
    }
    return panels;
  }

  private createEmptyState(): UiIntelligenceState {
    return {
      panels: this.createEmptyPanels(),
      lastApply: 0,
      signalCount: 0,
    };
  }
}

/** Alias matching Step 90 skeleton naming. */
export { UIIntegrationLayer as UiIntelligenceIntegrationLayer };
