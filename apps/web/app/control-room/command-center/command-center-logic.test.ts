/**
 * UBOS 3.15B — Command Center layout logic tests.
 *
 * Validates the pure metadata bridge between the shared Workspace Manager
 * foundation and the Control Room's existing tab / nav identifiers, plus
 * the safety invariants (monitors always visible, presets map to real
 * tabs, persisted prefs stay serializable metadata).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  WORKSPACE_PANEL_IDS,
  WorkspacePanelRegistry,
  calculateWorkspaceLayout,
  createDefaultPanelDefinitions,
  validateLayoutResult,
  validatePanelDefinition,
  workspacePresetList,
  workspacePresets,
} from '@ubos/shared';
import {
  applyPresetToRegistry,
  bottomTabForPanel,
  commandCenterRailItems,
  createCommandCenterExtraPanelDefinitions,
  createDefaultCommandCenterPrefs,
  effectivePresetForLayout,
  operationsTabForPanel,
  panelForRightDockSection,
  panelGatingBottomTab,
  panelGatingSourceTab,
  parseCommandCenterPrefs,
  presetBottomTab,
  serializeCommandCenterPrefs,
  workspaceModeForPreset,
} from './command-center-logic.js';

function createRegistry(): WorkspacePanelRegistry {
  const registry = new WorkspacePanelRegistry();
  for (const definition of [
    ...createDefaultPanelDefinitions(),
    ...createCommandCenterExtraPanelDefinitions(),
  ]) {
    registry.registerPanel(definition);
  }
  return registry;
}

test('extra panel definitions are valid workspace-manager metadata', () => {
  for (const definition of createCommandCenterExtraPanelDefinitions()) {
    const issues = validatePanelDefinition(definition);
    assert.deepEqual(issues, [], `panel ${definition.id} should be valid: ${JSON.stringify(issues)}`);
  }
});

test('every preset resolves to an existing bottom workspace tab', () => {
  for (const preset of workspacePresetList) {
    const tab = presetBottomTab(preset);
    assert.ok(tab.length > 0, `preset ${preset.id} must map to a dock tab`);
  }
});

test('applying a preset never hides Program or Preview monitors', () => {
  const registry = createRegistry();
  for (const preset of workspacePresetList) {
    applyPresetToRegistry(registry, preset);
    for (const monitorId of [WORKSPACE_PANEL_IDS.programMonitor, WORKSPACE_PANEL_IDS.previewMonitor]) {
      const state = registry.getPanelState(monitorId);
      assert.ok(state, `monitor ${monitorId} must stay registered`);
      assert.equal(state.visible, true, `preset ${preset.id} must keep ${monitorId} visible`);
      assert.equal(state.collapsed, false, `preset ${preset.id} must keep ${monitorId} expanded`);
    }
  }
});

test('applying a preset shows its visible panels and hides its hidden panels', () => {
  const registry = createRegistry();
  const preset = workspacePresets['technical-director'];
  applyPresetToRegistry(registry, preset);
  for (const panelId of preset.visiblePanels) {
    assert.equal(registry.getPanelState(panelId)?.visible, true, `${panelId} should be visible`);
  }
  for (const panelId of preset.hiddenPanels) {
    assert.equal(registry.getPanelState(panelId)?.visible, false, `${panelId} should be hidden`);
  }
});

test('preset switching is reversible layout metadata (round-trips to director)', () => {
  const registry = createRegistry();
  applyPresetToRegistry(registry, workspacePresets.director);
  const directorStates = JSON.stringify(registry.getPanelStates());
  applyPresetToRegistry(registry, workspacePresets['monitor-wall']);
  applyPresetToRegistry(registry, workspacePresets.director);
  assert.equal(JSON.stringify(registry.getPanelStates()), directorStates);
});

test('layout stays valid (no monitor overlap) for every preset at common viewports', () => {
  for (const preset of workspacePresetList) {
    for (const [width, height] of [
      [1920, 1080],
      [1536, 864],
      [1280, 800],
      [1024, 768],
    ] as const) {
      const layout = calculateWorkspaceLayout({
        viewportWidth: width,
        viewportHeight: height,
        preset,
      });
      const issues = validateLayoutResult(layout);
      assert.deepEqual(
        issues,
        [],
        `preset ${preset.id} @ ${width}x${height} produced layout issues: ${JSON.stringify(issues)}`,
      );
    }
  }
});

test('operator zone expansion removes the zone from a preset collapse list', () => {
  const compact = workspacePresets.compact;
  const effective = effectivePresetForLayout(compact, ['right-dock']);
  assert.ok(!effective.collapsedZones.includes('right-dock'));
  assert.ok(effective.collapsedZones.includes('left-dock'));
  // Original preset object is untouched.
  assert.ok(compact.collapsedZones.includes('right-dock'));
});

test('right dock sections all map to registered panels', () => {
  const registry = createRegistry();
  for (const section of [
    'unified-chat',
    'guests',
    'inspector',
    'recording',
    'streaming',
    'outputs',
    'telemetry',
    'system-health',
  ] as const) {
    const panelId = panelForRightDockSection(section);
    assert.ok(registry.getPanel(panelId), `section ${section} maps to unregistered panel ${panelId}`);
    assert.ok(operationsTabForPanel(panelId), `panel ${panelId} needs an operations tab mapping`);
  }
});

test('bottom tab and source tab gates reference registered panels', () => {
  const registry = createRegistry();
  for (const tab of [
    'layers',
    'audio',
    'graphics',
    'replay',
    'automation',
    'routing',
    'production-graph',
    'logs',
    'system-status',
  ] as const) {
    const gate = panelGatingBottomTab(tab);
    if (gate !== null) {
      assert.ok(registry.getPanel(gate), `bottom tab ${tab} gate ${gate} is not registered`);
    }
  }
  for (const tab of ['scenes', 'sources', 'media', 'graphics', 'guests', 'diagnostics'] as const) {
    const gate = panelGatingSourceTab(tab);
    if (gate !== null) {
      assert.ok(registry.getPanel(gate), `source tab ${tab} gate ${gate} is not registered`);
    }
  }
});

test('every preset maps to a legacy workspace mode', () => {
  for (const preset of workspacePresetList) {
    assert.ok(workspaceModeForPreset(preset.id).length > 0);
  }
});

test('rail items only reference known activation targets', () => {
  const registry = createRegistry();
  for (const item of commandCenterRailItems) {
    if (item.bottomTab) {
      const gate = panelGatingBottomTab(item.bottomTab);
      if (gate !== null) assert.ok(registry.getPanel(gate));
    }
    assert.ok(item.label.length > 0 && item.icon.length > 0);
  }
});

test('bottomTabForPanel covers every preset activeBottomTab', () => {
  for (const preset of workspacePresetList) {
    assert.notEqual(
      bottomTabForPanel(preset.activeBottomTab),
      null,
      `activeBottomTab ${preset.activeBottomTab} of ${preset.id} has no dock tab`,
    );
  }
});

test('command center prefs round-trip as plain serializable metadata', () => {
  const prefs = createDefaultCommandCenterPrefs();
  prefs.activeBottomTab = 'audio';
  prefs.expandedZones = ['right-dock'];
  prefs.layoutLocked = true;
  prefs.safeAreasVisible = true;
  prefs.zoneSizes = { 'left-dock': 400, 'right-dock': 320, 'bottom-workspace': 220 };
  const parsed = parseCommandCenterPrefs(serializeCommandCenterPrefs(prefs));
  assert.deepEqual(parsed, prefs);
});

test('malformed prefs are rejected instead of breaking the shell', () => {
  assert.equal(parseCommandCenterPrefs('not json'), null);
  assert.equal(parseCommandCenterPrefs('{"version":99}'), null);
  const partial = parseCommandCenterPrefs('{"version":1,"activeBottomTab":"bogus"}');
  assert.ok(partial);
  assert.equal(partial.activeBottomTab, 'layers');
});

test('command center prefs migrate v1 and clamp valid zone sizes', () => {
  const parsed = parseCommandCenterPrefs(JSON.stringify({
    version: 1,
    activeBottomTab: 'graphics',
    expandedZones: ['left-dock', 'invalid-zone'],
    zoneSizes: {
      'left-dock': 999,
      'right-dock': 100,
      'bottom-workspace': 240,
      floating: 1000,
      bad: 300,
    },
  }));
  assert.ok(parsed);
  assert.equal(parsed.version, 2);
  assert.deepEqual(parsed.expandedZones, ['left-dock']);
  assert.equal(parsed.zoneSizes['left-dock'], 440);
  assert.equal(parsed.zoneSizes['right-dock'], 260);
  assert.equal(parsed.zoneSizes['bottom-workspace'], 240);
  assert.equal('floating' in parsed.zoneSizes, false);
  assert.equal('bad' in parsed.zoneSizes, false);
});
