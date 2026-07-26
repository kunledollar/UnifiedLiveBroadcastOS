'use client';

/**
 * Autonomous Studio Mode Control Panel (ASMCP) — Step 111.
 *
 * The operator cockpit for Studio Automation: level selector,
 * per-category permissions, safety settings, visualization settings,
 * override controls, logs, and timeline — the seven modules named in
 * the Step 111 spec, each wired to `StudioAutomation`'s real,
 * instance-configurable state (added in this same step —
 * `setSafetySettings`/`setPermissions`/`setConflictResolutionMode`) via
 * `autonomyControlPanel.ts`'s pure decision functions.
 *
 * Reads/writes `workspaceState.intelligenceGraph.studioAutomationEngine`
 * directly, the same singleton-access pattern `OperatorHUD`/
 * `WorkspaceShell` already use, rather than prop-drilling — this is a
 * live control surface for a live singleton, not a form with its own
 * separate draft state.
 *
 * Opened from the top bar's Settings button (`WorkspaceShell`'s
 * `onOpenSettings`, previously unwired — see that file) as an overlay
 * above the HUD, not a separate route: `/control-room/automation`
 * already exists for the legacy rundown/macro automation UI, and
 * standalone Control Room routes render behind an
 * `opacity-0 pointer-events-none` layer under `WorkspaceShell` today, so
 * a new route would not actually be operator-reachable without a larger,
 * unrelated shell change.
 */
import { useState } from 'react';
import { ubosTypographyClasses, ubosElevationClasses } from '@ubos/ui';
import { workspaceState } from '../workspace/workspaceState';
import { autonomousStudioModeController } from './autonomousStudioMode';
import { autonomyVisualizationSettingsStore } from './autonomyControlPanel';
import type { StudioAutomation, AutonomyPermissionKey } from '../intelligence-graph/studioAutomation';
import { AUTONOMY_PERMISSION_KEYS } from '../intelligence-graph/studioAutomation';
import {
  AUTONOMY_LEVELS,
  AUTONOMY_LEVEL_LABELS,
  applyAutonomyLevel,
  deriveAutonomyConfiguration,
  applyOverrideAction,
  type AutonomyLevel,
  type AutonomyOverrideAction,
  type AutonomyVisualizationSettings,
} from './autonomyControlPanel';
import './autonomous-control-panel.css';

const PERMISSION_LABEL: Record<AutonomyPermissionKey, string> = {
  sceneTransitions: 'Scene Transitions',
  graphicsActivation: 'Graphics Activation',
  audioMixing: 'Audio Mixing',
  routingRecovery: 'Routing Recovery',
  outputStabilization: 'Output Stabilization',
  replayTriggers: 'Replay Triggers',
  streamingRecovery: 'Streaming Recovery',
};

function AutonomyLevelSelector({
  level,
  onChange,
}: {
  level: AutonomyLevel | 'custom';
  onChange: (level: AutonomyLevel) => void;
}) {
  return (
    <section className="asmcp-module">
      <h3 className={ubosTypographyClasses.sectionLabel}>1. Autonomy Level</h3>
      <div className="asmcp-level-row">
        {AUTONOMY_LEVELS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className={`asmcp-level-button ${level === candidate ? 'asmcp-level-button-active' : ''}`}
            onClick={() => onChange(candidate)}
            aria-pressed={level === candidate}
          >
            <span className={ubosTypographyClasses.microText}>L{candidate}</span>
            <span className={ubosTypographyClasses.body}>{AUTONOMY_LEVEL_LABELS[candidate]}</span>
          </button>
        ))}
      </div>
      {level === 'custom' && (
        <p className={ubosTypographyClasses.microText}>Current configuration is custom (does not match a named level).</p>
      )}
    </section>
  );
}

function AutonomyPermissionsModule({
  permissions,
  onToggle,
}: {
  permissions: Record<AutonomyPermissionKey, boolean>;
  onToggle: (key: AutonomyPermissionKey, enabled: boolean) => void;
}) {
  return (
    <section className="asmcp-module">
      <h3 className={ubosTypographyClasses.sectionLabel}>2. Autonomy Permissions</h3>
      <div className="asmcp-permission-grid">
        {AUTONOMY_PERMISSION_KEYS.map((key) => (
          <label key={key} className={`flex items-center gap-2 ${ubosTypographyClasses.body}`}>
            <input
              type="checkbox"
              checked={permissions[key]}
              onChange={(e) => onToggle(key, e.target.checked)}
            />
            {PERMISSION_LABEL[key]}
          </label>
        ))}
      </div>
    </section>
  );
}

function AutonomySafetySettingsModule({
  automation,
  onChanged,
}: {
  automation: StudioAutomation;
  onChanged: () => void;
}) {
  const safety = automation.getSafetySettings();
  const conflictMode = automation.getConflictResolutionMode();

  return (
    <section className="asmcp-module">
      <h3 className={ubosTypographyClasses.sectionLabel}>3. Autonomy Safety Settings</h3>
      <label className="asmcp-field">
        <span className={ubosTypographyClasses.microText}>Minimum confidence ({Math.round(safety.minConfidence * 100)}%)</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={safety.minConfidence}
          className="h-1 w-full cursor-pointer accent-ubos-selection"
          onChange={(e) => {
            automation.setSafetySettings({ minConfidence: Number(e.target.value) });
            onChanged();
          }}
        />
      </label>
      <label className="asmcp-field">
        <span className={ubosTypographyClasses.microText}>Maximum severity ({Math.round(safety.maxSeverity * 100)}%)</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={safety.maxSeverity}
          className="h-1 w-full cursor-pointer accent-ubos-warning"
          onChange={(e) => {
            automation.setSafetySettings({ maxSeverity: Number(e.target.value) });
            onChanged();
          }}
        />
      </label>
      <label className="asmcp-field">
        <span className={ubosTypographyClasses.microText}>Conflict resolution mode</span>
        <select
          className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1.5 text-ubos-caption text-ubos-fg-primary"
          value={conflictMode}
          onChange={(e) => {
            automation.setConflictResolutionMode(e.target.value as typeof conflictMode);
            onChanged();
          }}
        >
          <option value="severityFirst">Safest first</option>
          <option value="confidenceFirst">Most confident first</option>
          <option value="roleFirst">Operator role first</option>
        </select>
      </label>
    </section>
  );
}

function AutonomyVisualizationSettingsModule({
  visualization,
  onChange,
}: {
  visualization: AutonomyVisualizationSettings;
  onChange: (partial: Partial<AutonomyVisualizationSettings>) => void;
}) {
  return (
    <section className="asmcp-module">
      <h3 className={ubosTypographyClasses.sectionLabel}>4. Autonomy Visualization</h3>
      <label className={`flex items-center gap-2 ${ubosTypographyClasses.body}`}>
        <input
          type="checkbox"
          checked={visualization.themeEnabled}
          onChange={(e) => onChange({ themeEnabled: e.target.checked })}
        />
        Autonomous Studio Theme
      </label>
      <label className="asmcp-field">
        <span className={ubosTypographyClasses.microText}>Motion intensity ({Math.round(visualization.motionIntensityScale * 100)}%)</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={visualization.motionIntensityScale}
          className="h-1 w-full cursor-pointer accent-ubos-selection"
          onChange={(e) => onChange({ motionIntensityScale: Number(e.target.value) })}
        />
      </label>
      <label className={`flex items-center gap-2 ${ubosTypographyClasses.body}`}>
        <input
          type="checkbox"
          checked={visualization.elevationEnabled}
          onChange={(e) => onChange({ elevationEnabled: e.target.checked })}
        />
        Autonomous panel elevation
      </label>
      <label className={`flex items-center gap-2 ${ubosTypographyClasses.body}`}>
        <input
          type="checkbox"
          checked={visualization.overlaysEnabled}
          onChange={(e) => onChange({ overlaysEnabled: e.target.checked })}
        />
        Safety overlays
      </label>
      <label className="asmcp-field">
        <span className={ubosTypographyClasses.microText}>HUD mode</span>
        <select
          className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1.5 text-ubos-caption text-ubos-fg-primary"
          value={visualization.hudMode}
          onChange={(e) => onChange({ hudMode: e.target.value as AutonomyVisualizationSettings['hudMode'] })}
        >
          <option value="autonomous">Autonomous</option>
          <option value="minimal">Minimal</option>
        </select>
      </label>
    </section>
  );
}

function AutonomyOverrideControlsModule({
  automationEnabled,
  onAction,
}: {
  automationEnabled: boolean;
  onAction: (action: AutonomyOverrideAction) => void;
}) {
  return (
    <section className="asmcp-module">
      <h3 className={ubosTypographyClasses.sectionLabel}>5. Autonomy Override Controls</h3>
      <div className="asmcp-override-row">
        <button type="button" className="asmcp-override-button" disabled={!automationEnabled} onClick={() => onAction('pause')}>
          Pause Autonomy
        </button>
        <button type="button" className="asmcp-override-button" disabled={automationEnabled} onClick={() => onAction('resume')}>
          Resume Autonomy
        </button>
      </div>
      <p className={ubosTypographyClasses.microText}>
        Approve/override/reject individual automation decisions from the HUD&apos;s Override Prompt (Step 110).
      </p>
    </section>
  );
}

function AutonomyLogsModule({ logs }: { logs: readonly { id: string; kind: string; message: string; confidence: number; timestamp: number }[] }) {
  return (
    <section className="asmcp-module">
      <h3 className={ubosTypographyClasses.sectionLabel}>6. Autonomy Logs</h3>
      {logs.length === 0 ? (
        <p className={ubosTypographyClasses.microText}>No autonomy events yet</p>
      ) : (
        <ul className="asmcp-log-list">
          {logs.map((entry) => (
            <li key={entry.id} className="asmcp-log-item">
              <span className={`shrink-0 ${ubosTypographyClasses.microText} uppercase`}>{entry.kind}</span>
              <span className={ubosTypographyClasses.intelligence} title={entry.message}>
                {entry.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AutonomyTimelineModule({ timeline }: { timeline: readonly { id: string; kind: string; message: string; confidence: number; timestamp: number }[] }) {
  return (
    <section className="asmcp-module">
      <h3 className={ubosTypographyClasses.sectionLabel}>7. Autonomy Timeline</h3>
      {timeline.length === 0 ? (
        <p className={ubosTypographyClasses.microText}>No timeline activity yet</p>
      ) : (
        <ol className="asmcp-timeline-list">
          {timeline.map((entry) => (
            <li key={entry.id} className="asmcp-timeline-item" title={entry.message}>
              <span className={`shrink-0 ${ubosTypographyClasses.microText} uppercase`}>{entry.kind}</span>
              <span className={`truncate ${ubosTypographyClasses.intelligence}`}>{entry.message}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function AutonomousControlPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, forceRender] = useState(0);
  if (!open) return null;

  const graph = workspaceState.intelligenceGraph;
  const automation = graph.studioAutomationEngine;
  const autonomous = autonomousStudioModeController.getResult();
  const visualization = autonomyVisualizationSettingsStore.get();
  const config = deriveAutonomyConfiguration(automation, autonomous, visualization);

  const refresh = () => forceRender((n) => n + 1);

  return (
    <div className="asmcp-backdrop" data-testid="autonomous-control-panel" role="dialog" aria-label="Autonomous Studio Mode Control Panel">
      <div className={`asmcp-panel ${ubosElevationClasses[3]}`}>
        <header className="asmcp-header">
          <span className={ubosTypographyClasses.hud}>Autonomous Studio Mode Control Panel</span>
          <button type="button" className="asmcp-close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="asmcp-body">
          <AutonomyLevelSelector
            level={config.level}
            onChange={(level) => {
              applyAutonomyLevel(automation, level);
              automation.compute();
              refresh();
            }}
          />

          <AutonomyPermissionsModule
            permissions={config.permissions}
            onToggle={(key, enabled) => {
              automation.setPermissions({ [key]: enabled });
              automation.compute();
              refresh();
            }}
          />

          <AutonomySafetySettingsModule automation={automation} onChanged={refresh} />

          <AutonomyVisualizationSettingsModule
            visualization={config.visualization}
            onChange={(partial) => {
              autonomyVisualizationSettingsStore.set(partial);
              refresh();
            }}
          />

          <AutonomyOverrideControlsModule
            automationEnabled={automation.isAutomationEnabled()}
            onAction={(action) => {
              applyOverrideAction(automation, action);
              automation.compute();
              refresh();
            }}
          />

          <AutonomyLogsModule logs={config.logs} />

          <AutonomyTimelineModule timeline={config.timeline} />
        </div>
      </div>
    </div>
  );
}
