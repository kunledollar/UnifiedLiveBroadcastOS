/**
 * Validation tests for the UBOS 3.15 Workspace Manager foundation.
 * Compiled to dist and executed with node as part of `pnpm --filter @ubos/shared test`.
 */
const assertOk = (value: unknown, message = 'assertion failed') => {
  if (!value) throw new Error(message);
};
const assertEqual = (actual: unknown, expected: unknown, message?: string) => {
  if (actual !== expected)
    throw new Error(message ?? `Expected ${String(expected)}, received ${String(actual)}`);
};
const assertThrows = (fn: () => void, message: string) => {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) throw new Error(message);
};

import {
  WORKSPACE_PANEL_IDS,
  WORKSPACE_PRESET_IDS,
  WORKSPACE_ZONE_IDS,
  WorkspacePanelRegistry,
  applyLayoutSnapshot,
  calculateWorkspaceLayout,
  clampZoneSize,
  createDefaultPanelDefinitions,
  createLayoutSnapshot,
  getResponsiveCollapsedZones,
  parseLayoutSnapshot,
  rectsOverlap,
  serializeLayoutSnapshot,
  splitCenterStage,
  validateLayoutResult,
  validatePanelDefinition,
  validateWorkspacePreset,
  validateWorkspacePresetCatalog,
  workspacePresets,
  workspaceDefinitions,
  workspaceDefinitionLayouts,
  createCustomWorkspace,
  deleteCustomWorkspace,
  duplicateCustomWorkspace,
  createEmptyCustomWorkspaceRegistry,
  parseCustomWorkspaceRegistry,
  presentationsEqual,
  renameCustomWorkspace,
  resetCustomWorkspace,
  resolveWorkspaceStatus,
  serializeCustomWorkspaceRegistry,
  saveCustomWorkspace,
  workspaceState,
  workspaceZoneDefinitions,
} from './index.js';
import type { WorkspacePanelDefinition, WorkspaceZoneId } from './index.js';

// ── Zone geometry rules (2A / PR-F responsive dock) ───────────────────────
// PR-F dock geometry contract:
//   Left Dock:        min 200 / preferred 270 / max 440
//   Right Dock:       min 260 / preferred 270 / max 460
//   Bottom Workspace: min 180 / preferred 280 / max 420
assertEqual(WORKSPACE_ZONE_IDS.length, 8);
assertEqual(workspaceZoneDefinitions['top-ribbon'].defaultSize, 56);
assertEqual(workspaceZoneDefinitions['top-ribbon'].collapsible, false);
assertEqual(workspaceZoneDefinitions['top-ribbon'].resizable, false);
assertEqual(workspaceZoneDefinitions['left-rail'].defaultSize, 72);
assertEqual(workspaceZoneDefinitions['left-rail'].collapsible, false);
assertEqual(workspaceZoneDefinitions['left-dock'].defaultSize, 270);
assertEqual(workspaceZoneDefinitions['left-dock'].minSize, 200);
assertEqual(workspaceZoneDefinitions['left-dock'].maxSize, 440);
assertEqual(workspaceZoneDefinitions['left-dock'].collapsedSize, 0);
assertEqual(workspaceZoneDefinitions['center-stage'].minSize, 900);
assertEqual(workspaceZoneDefinitions['center-stage'].collapsible, false);
assertEqual(workspaceZoneDefinitions['right-dock'].defaultSize, 270);
assertEqual(workspaceZoneDefinitions['right-dock'].minSize, 260);
assertEqual(workspaceZoneDefinitions['right-dock'].maxSize, 460);
assertEqual(workspaceZoneDefinitions['right-dock'].collapsedSize, 0);
assertEqual(workspaceZoneDefinitions['bottom-workspace'].defaultSize, 280);
assertEqual(workspaceZoneDefinitions['bottom-workspace'].minSize, 180);
assertEqual(workspaceZoneDefinitions['bottom-workspace'].maxSize, 420);
assertEqual(workspaceZoneDefinitions['bottom-workspace'].collapsedSize, 42);
assertEqual(workspaceZoneDefinitions.floating.defaultSize, 0, 'floating is a placeholder only');

assertEqual(clampZoneSize('left-dock', 100), 200);
assertEqual(clampZoneSize('left-dock', 500), 440);
assertEqual(clampZoneSize('bottom-workspace', 300), 300);

assertEqual(getResponsiveCollapsedZones(1920).length, 0);
assertOk(
  getResponsiveCollapsedZones(1439).includes('right-dock'),
  'right-dock collapses below 1440px',
);
assertOk(!getResponsiveCollapsedZones(1439).includes('left-dock'));
assertOk(
  getResponsiveCollapsedZones(1199).includes('left-dock'),
  'left-dock collapses below 1200px',
);
assertOk(getResponsiveCollapsedZones(1199).includes('right-dock'));

// ── Panel registry (1A) ─────────────────────────────────────────────────────
const registry = new WorkspacePanelRegistry();
const defaults = createDefaultPanelDefinitions();
for (const panel of defaults) {
  assertEqual(
    validatePanelDefinition(panel).length,
    0,
    `default panel "${panel.id}" must validate`,
  );
  registry.registerPanel(panel);
}
assertEqual(registry.getAllPanels().length, defaults.length);
assertEqual(registry.getPanel(WORKSPACE_PANEL_IDS.programMonitor)?.title, 'Program');
assertEqual(registry.getPanel('does-not-exist'), undefined);

const centerPanels = registry.getPanelsForZone('center-stage');
assertEqual(
  centerPanels[0]?.id,
  WORKSPACE_PANEL_IDS.programMonitor,
  'zone panels sorted by priority',
);
assertEqual(centerPanels[1]?.id, WORKSPACE_PANEL_IDS.previewMonitor);
assertOk(
  registry.getPanelsForZone('left-dock').some((panel) => panel.id === WORKSPACE_PANEL_IDS.scenes),
);

assertThrows(() => registry.registerPanel(defaults[0]!), 'duplicate registration must throw');

const badZone = { ...defaults[2]!, id: 'bad-zone', defaultZone: 'nowhere' as WorkspaceZoneId };
assertOk(
  validatePanelDefinition(badZone).some((issue) => issue.code === 'PANEL_DEFAULT_ZONE_INVALID'),
);
assertThrows(() => registry.registerPanel(badZone), 'invalid zone must be rejected');

const notAllowedDefault = {
  ...defaults[2]!,
  id: 'zone-mismatch',
  defaultZone: 'right-dock' as WorkspaceZoneId,
  allowedZones: ['left-dock'] as WorkspaceZoneId[],
};
assertOk(
  validatePanelDefinition(notAllowedDefault).some(
    (issue) => issue.code === 'PANEL_DEFAULT_ZONE_NOT_ALLOWED',
  ),
);

const withRuntimeObject = {
  ...defaults[2]!,
  id: 'runtime-object',
  mediaStream: { attach: () => undefined },
} as unknown as WorkspacePanelDefinition;
assertOk(
  validatePanelDefinition(withRuntimeObject).some(
    (issue) => issue.code === 'PANEL_NOT_SERIALIZABLE',
  ),
  'runtime media objects must be rejected from the registry',
);
assertThrows(
  () => registry.registerPanel(withRuntimeObject),
  'runtime objects must not be registered',
);

// Visibility, collapse, and movement rules.
assertEqual(registry.getPanelState(WORKSPACE_PANEL_IDS.chat)?.visible, false);
registry.togglePanelVisibility(WORKSPACE_PANEL_IDS.chat);
assertEqual(registry.getPanelState(WORKSPACE_PANEL_IDS.chat)?.visible, true);
assertThrows(
  () => registry.togglePanelVisibility(WORKSPACE_PANEL_IDS.programMonitor),
  'program monitor is not closable',
);
assertThrows(
  () => registry.togglePanelCollapsed(WORKSPACE_PANEL_IDS.programMonitor),
  'program monitor is not collapsible',
);
registry.togglePanelCollapsed(WORKSPACE_PANEL_IDS.scenes);
assertEqual(registry.getPanelState(WORKSPACE_PANEL_IDS.scenes)?.collapsed, true);

registry.movePanelToZone(WORKSPACE_PANEL_IDS.scenes, 'bottom-workspace');
assertEqual(registry.getPanelState(WORKSPACE_PANEL_IDS.scenes)?.zone, 'bottom-workspace');
assertOk(
  registry
    .getPanelsForZone('bottom-workspace')
    .some((panel) => panel.id === WORKSPACE_PANEL_IDS.scenes),
);
assertThrows(
  () => registry.movePanelToZone(WORKSPACE_PANEL_IDS.scenes, 'external-monitor'),
  'zone must be in allowedZones',
);
assertThrows(
  () => registry.movePanelToZone('missing-panel', 'left-dock'),
  'unknown panel must throw',
);

// ── Preset catalog (3A) ─────────────────────────────────────────────────────
assertEqual(WORKSPACE_PRESET_IDS.length, 9);
assertEqual(validateWorkspacePresetCatalog().length, 0, 'built-in presets must all validate');
assertEqual(
  Object.keys(workspaceDefinitions).length,
  9,
  'all operational workspace contracts are present',
);
for (const definition of Object.values(workspaceDefinitions)) {
  assertOk(definition.builtIn, `${definition.id} remains immutable built-in`);
  assertOk(
    definition.role.length > 0 && definition.statusIndicators.length > 0,
    `${definition.id} has role status contract`,
  );
  assertOk(
    definition.persistenceRules.includes('Persist layout metadata only'),
    `${definition.id} protects runtime state`,
  );
}
assertEqual(
  workspaceDefinitionLayouts.director.activeBottomTab,
  workspaceDefinitions.director.activeBottomTab,
  'layout fragments feed canonical definition',
);
assertEqual(
  workspacePresets.director.activeBottomTab,
  workspaceDefinitions.director.activeBottomTab,
  'compatibility presets project canonical definition',
);

const presentation = {
  panelStates: [
    { panelId: 'scenes', zone: 'left-dock' as WorkspaceZoneId, visible: true, collapsed: false },
  ],
  collapsedZones: ['right-dock' as WorkspaceZoneId],
  zoneSizes: { 'left-dock': 270 },
  activeBottomTab: 'layers',
};
const customA = createCustomWorkspace(
  'director',
  'Director custom',
  presentation,
  'custom:a',
  '2026-01-01T00:00:00.000Z',
);
const customB = createCustomWorkspace(
  'director',
  'Director custom 2',
  presentation,
  'custom:b',
  '2026-01-01T00:00:00.000Z',
);
assertOk(customA.id !== customB.id, 'custom ids are unique');
const customRegistry = {
  ...createEmptyCustomWorkspaceRegistry(),
  workspaces: { [customA.id]: customA },
};
assertEqual(
  parseCustomWorkspaceRegistry(serializeCustomWorkspaceRegistry(customRegistry))?.workspaces[
    customA.id
  ]?.name,
  'Director custom',
  'custom workspace persists safely',
);
assertEqual(
  parseCustomWorkspaceRegistry('{bad json'),
  null,
  'malformed custom workspace storage is rejected',
);
assertEqual(
  renameCustomWorkspace(customRegistry, customA.id, 'Renamed').workspaces[customA.id]?.name,
  'Renamed',
  'custom rename does not alter its source',
);
assertEqual(
  duplicateCustomWorkspace(customA, 'Copy', 'custom:copy').sourceWorkspaceId,
  customA.id,
  'custom duplicate records its source',
);
assertEqual(
  resetCustomWorkspace(
    saveCustomWorkspace(customRegistry, customA.id, { ...presentation, activeBottomTab: 'audio' }),
    customA.id,
    presentation,
  ).workspaces[customA.id]?.presentation.activeBottomTab,
  'layers',
  'custom reset restores source presentation',
);
assertEqual(
  deleteCustomWorkspace(customRegistry, customA.id).workspaces[customA.id],
  undefined,
  'custom delete leaves built-in catalog untouched',
);
assertOk(
  presentationsEqual(presentation, { ...presentation, panelStates: [...presentation.panelStates] }),
  'normalized presentation comparison is stable',
);
assertEqual(workspaceState(presentation, presentation, false), 'factory');
assertEqual(workspaceState(presentation, presentation, true), 'saved');
assertEqual(
  workspaceState({ ...presentation, activeBottomTab: 'audio' }, presentation, true),
  'unsaved',
);
assertEqual(
  resolveWorkspaceStatus(workspaceDefinitions.director)[0]?.value,
  'Unavailable',
  'status resolver does not fabricate runtime data',
);

const knownPanelIds = new Set(defaults.map((panel) => panel.id));
for (const preset of Object.values(workspacePresets)) {
  for (const panelId of [
    ...preset.visiblePanels,
    ...preset.collapsedPanels,
    ...preset.hiddenPanels,
    preset.activeBottomTab,
  ]) {
    assertOk(
      knownPanelIds.has(panelId),
      `preset "${preset.id}" references unknown panel "${panelId}"`,
    );
  }
  assertOk(
    preset.visiblePanels.includes(WORKSPACE_PANEL_IDS.programMonitor),
    `preset "${preset.id}" must keep Program visible`,
  );
  assertOk(
    preset.visiblePanels.includes(WORKSPACE_PANEL_IDS.previewMonitor),
    `preset "${preset.id}" must keep Preview visible`,
  );
}

assertEqual(workspacePresets.director.activeBottomTab, WORKSPACE_PANEL_IDS.scenes);
assertOk(workspacePresets.director.visiblePanels.includes(WORKSPACE_PANEL_IDS.inspector));
assertEqual(workspacePresets['solo-streamer'].activeBottomTab, WORKSPACE_PANEL_IDS.sources);
assertOk(
  workspacePresets['solo-streamer'].hiddenPanels.includes(WORKSPACE_PANEL_IDS.routingMatrix),
  'solo streamer hides routing',
);
assertOk(
  workspacePresets['solo-streamer'].hiddenPanels.includes(WORKSPACE_PANEL_IDS.pipelineInspector),
  'solo streamer hides diagnostics',
);
assertEqual(
  workspacePresets['technical-director'].activeBottomTab,
  WORKSPACE_PANEL_IDS.routingMatrix,
);
assertEqual(workspacePresets['audio-engineer'].activeBottomTab, WORKSPACE_PANEL_IDS.audioMixer);
assertEqual(
  workspacePresets['graphics-operator'].activeBottomTab,
  WORKSPACE_PANEL_IDS.graphicsLibrary,
);
assertEqual(
  workspacePresets['replay-operator'].activeBottomTab,
  WORKSPACE_PANEL_IDS.replayTimeline,
);
assertEqual(
  workspacePresets['streaming-operator'].activeBottomTab,
  WORKSPACE_PANEL_IDS.systemStatus,
);
assertEqual(workspacePresets['monitor-wall'].activeBottomTab, WORKSPACE_PANEL_IDS.monitorWall);
for (const zone of ['left-dock', 'right-dock', 'bottom-workspace'] as const) {
  assertOk(workspacePresets.compact.collapsedZones.includes(zone), `compact collapses ${zone}`);
}

const brokenPreset = {
  ...workspacePresets.director,
  hiddenPanels: [WORKSPACE_PANEL_IDS.programMonitor],
};
assertOk(
  validateWorkspacePreset(brokenPreset).some((issue) => issue.code === 'PRESET_MONITOR_HIDDEN'),
);
const conflictPreset = {
  ...workspacePresets.director,
  collapsedPanels: [WORKSPACE_PANEL_IDS.scenes],
  visiblePanels: [...workspacePresets.director.visiblePanels],
};
assertOk(
  validateWorkspacePreset(conflictPreset).some(
    (issue) => issue.code === 'PRESET_PANEL_STATE_CONFLICT',
  ),
);
const badCollapse = {
  ...workspacePresets.director,
  collapsedZones: ['center-stage' as WorkspaceZoneId],
};
assertOk(
  validateWorkspacePreset(badCollapse).some(
    (issue) => issue.code === 'PRESET_ZONE_NOT_COLLAPSIBLE',
  ),
);

// ── Layout calculation (2A / PR-F responsive dock) ───────────────────────────
// Reference: 1920×1080 viewport, Director preset, both docks at PR-F full
// width (270px each), bottom workspace at preferred height 280.
const reference = calculateWorkspaceLayout({
  viewportWidth: 1920,
  viewportHeight: 1080,
  preset: workspacePresets.director,
});
assertEqual(reference.zones['top-ribbon'].rect.height, 56);
assertEqual(reference.zones['left-rail'].rect.width, 72);
assertEqual(reference.zones['left-dock'].rect.width, 270);
assertEqual(reference.zones['right-dock'].rect.width, 270);
assertEqual(reference.zones['bottom-workspace'].rect.height, 280);
assertEqual(reference.zones['center-stage'].rect.width, 1920 - 72 - 270 - 270);
assertOk(
  reference.zones['center-stage'].rect.width >= 900,
  'center-stage honours its 900px minimum',
);
assertEqual(reference.monitorsStacked, false);
assertEqual(
  validateLayoutResult(reference).length,
  0,
  'reference layout must satisfy all safety invariants',
);
assertOk(
  !rectsOverlap(reference.zones['bottom-workspace'].rect, reference.programRect),
  'bottom workspace never covers Program',
);
assertOk(
  !rectsOverlap(reference.zones['left-dock'].rect, reference.previewRect),
  'docks never cover Preview',
);

// Center-stage receives all freed space when docks collapse (compact preset).
const compact = calculateWorkspaceLayout({
  viewportWidth: 1920,
  viewportHeight: 1080,
  preset: workspacePresets.compact,
});
assertEqual(compact.zones['left-dock'].rect.width, 0);
assertEqual(compact.zones['right-dock'].rect.width, 0);
assertEqual(
  compact.zones['bottom-workspace'].rect.height,
  42,
  'collapsed bottom workspace keeps its tab bar',
);
assertEqual(
  compact.zones['center-stage'].rect.width,
  1920 - 72,
  'center-stage absorbs freed dock space',
);
assertOk(
  compact.zones['center-stage'].rect.height > reference.zones['center-stage'].rect.height,
  'center-stage absorbs freed bottom space',
);
assertEqual(validateLayoutResult(compact).length, 0);

// Responsive collapse thresholds.
const at1439 = calculateWorkspaceLayout({
  viewportWidth: 1439,
  viewportHeight: 900,
  preset: workspacePresets.director,
});
assertEqual(at1439.zones['right-dock'].collapsed, true, 'right-dock starts collapsed below 1440px');
assertEqual(at1439.zones['left-dock'].collapsed, false);
const at1199 = calculateWorkspaceLayout({
  viewportWidth: 1199,
  viewportHeight: 800,
  preset: workspacePresets.director,
});
assertEqual(at1199.zones['left-dock'].collapsed, true, 'left-dock starts collapsed below 1200px');
assertEqual(at1199.zones['right-dock'].collapsed, true);
assertEqual(validateLayoutResult(at1199).length, 0);

// PR-F: Compact dock width at 1200–1439px (left dock visible, right dock collapsed).
const compact1300 = calculateWorkspaceLayout({
  viewportWidth: 1300,
  viewportHeight: 900,
  preset: workspacePresets.director,
});
assertEqual(compact1300.zones['left-dock'].collapsed, false, 'left-dock visible at 1300px');
assertEqual(compact1300.zones['right-dock'].collapsed, true, 'right-dock collapsed at 1300px');
assertEqual(
  compact1300.zones['left-dock'].rect.width,
  200,
  'left-dock uses DOCK_COMPACT_WIDTH at 1300px',
);
assertOk(
  compact1300.zones['center-stage'].rect.width >= 900,
  'center-stage honours minimum at compact width',
);
assertEqual(
  validateLayoutResult(compact1300).length,
  0,
  'compact-width layout satisfies all safety invariants',
);

// PR-F: Full dock width at ≥1440px (both docks visible at 270px).
const full1920 = calculateWorkspaceLayout({
  viewportWidth: 1920,
  viewportHeight: 1080,
  preset: workspacePresets.director,
});
assertEqual(
  full1920.zones['left-dock'].rect.width,
  270,
  'left-dock uses DOCK_FULL_WIDTH at 1920px',
);
assertEqual(
  full1920.zones['right-dock'].rect.width,
  270,
  'right-dock uses DOCK_FULL_WIDTH at 1920px',
);

// Force-collapse protects the center-stage minimum between thresholds.
const at1500 = calculateWorkspaceLayout({
  viewportWidth: 1500,
  viewportHeight: 900,
  preset: workspacePresets.director,
});
assertEqual(
  at1500.zones['right-dock'].collapsed,
  true,
  'right-dock force-collapses to protect center minimum',
);
assertOk(at1500.zones['center-stage'].rect.width >= 900);
assertOk(at1500.warnings.some((warning) => warning.includes('right-dock')));
assertEqual(validateLayoutResult(at1500).length, 0);

// Monitors stack vertically below 900px viewport width.
const narrow = calculateWorkspaceLayout({
  viewportWidth: 899,
  viewportHeight: 700,
  preset: workspacePresets.director,
});
assertEqual(narrow.monitorsStacked, true);
assertEqual(
  narrow.programRect.width,
  narrow.previewRect.width,
  'stacked monitors share full center width',
);
assertEqual(narrow.programRect.x, narrow.previewRect.x);
assertOk(
  narrow.previewRect.y >= narrow.programRect.y + narrow.programRect.height,
  'preview stacks below program',
);
assertEqual(validateLayoutResult(narrow).length, 0);

// Center emphasis shifts the program/preview split.
const emphasized = splitCenterStage({ x: 0, y: 0, width: 1000, height: 500 }, 'program', false);
assertOk(
  emphasized.programRect.width > emphasized.previewRect.width,
  'program emphasis widens Program',
);
const balanced = splitCenterStage({ x: 0, y: 0, width: 1000, height: 500 }, 'balanced', false);
assertEqual(balanced.programRect.width, balanced.previewRect.width);

// Operator collapse requests merge with preset/responsive rules; non-collapsible zones are refused.
const operatorCollapsed = calculateWorkspaceLayout({
  viewportWidth: 1920,
  viewportHeight: 1080,
  preset: workspacePresets.director,
  collapsedZones: ['left-dock', 'center-stage'],
});
assertEqual(operatorCollapsed.zones['left-dock'].collapsed, true);
assertEqual(
  operatorCollapsed.zones['center-stage'].collapsed,
  false,
  'center-stage may never collapse',
);
assertOk(operatorCollapsed.warnings.some((warning) => warning.includes('center-stage')));

// ── Persistence (layout metadata only) ──────────────────────────────────────
const snapshot = createLayoutSnapshot(registry, 'director', ['right-dock']);
assertEqual(snapshot.version, 1);
assertEqual(snapshot.panelStates.length, defaults.length);
const serialized = serializeLayoutSnapshot(snapshot);
const parsed = parseLayoutSnapshot(serialized);
assertOk(parsed, 'round-trip parse must succeed');
assertEqual(parsed?.activePresetId, 'director');
assertEqual(parsed?.collapsedZones[0], 'right-dock');
assertEqual(
  parsed?.panelStates.find((state) => state.panelId === WORKSPACE_PANEL_IDS.scenes)?.zone,
  'bottom-workspace',
);

assertEqual(parseLayoutSnapshot('not json'), null);
assertEqual(parseLayoutSnapshot('{"version":99}'), null);
assertEqual(
  parseLayoutSnapshot(
    '{"version":1,"activePresetId":"unknown","collapsedZones":[],"panelStates":[]}',
  ),
  null,
);

const restoreTarget = new WorkspacePanelRegistry();
for (const panel of createDefaultPanelDefinitions()) restoreTarget.registerPanel(panel);
applyLayoutSnapshot(restoreTarget, parsed!);
assertEqual(
  restoreTarget.getPanelState(WORKSPACE_PANEL_IDS.scenes)?.zone,
  'bottom-workspace',
  'snapshot restores panel zones',
);
assertEqual(
  restoreTarget.getPanelState(WORKSPACE_PANEL_IDS.chat)?.visible,
  true,
  'snapshot restores panel visibility',
);
assertEqual(
  restoreTarget.getPanelState(WORKSPACE_PANEL_IDS.programMonitor)?.visible,
  true,
  'non-closable panels stay visible after restore',
);

// Snapshots with unknown panels are applied without error.
const foreignSnapshot = parseLayoutSnapshot(
  JSON.stringify({
    version: 1,
    activePresetId: 'compact',
    collapsedZones: [],
    panelStates: [{ panelId: 'ghost-panel', zone: 'left-dock', visible: true, collapsed: false }],
    savedAt: new Date().toISOString(),
  }),
);
applyLayoutSnapshot(restoreTarget, foreignSnapshot!);
assertEqual(
  restoreTarget.getPanel('ghost-panel'),
  undefined,
  'unknown panels are skipped, never created',
);

console.log('workspace-manager validation passed');
