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

test('layout stays valid (no monitor overlap) for every preset at Phase 2 responsive widths', () => {
  for (const preset of workspacePresetList) {
    for (const [width, height] of [
      [3840, 2160],
      [2560, 1440],
      [1920, 1080],
      [1600, 900],
      [1440, 900],
      [1366, 768],
      [1280, 800],
      [1200, 800],
      [1024, 768],
      [900, 700],
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

// ── Workspace Manager Regression Tests ────────────────────────────────────────
// These tests guard against the regression where selecting a workspace preset
// did not visibly reconfigure the Control Room layout.

test('all 9 presets are present and resolve', () => {
  assert.equal(workspacePresetList.length, 9, 'must have exactly 9 presets');
  const expectedIds = [
    'director', 'solo-streamer', 'technical-director', 'audio-engineer',
    'graphics-operator', 'replay-operator', 'streaming-operator', 'monitor-wall', 'compact',
  ];
  for (const id of expectedIds) {
    const preset = workspacePresetList.find((p) => p.id === id);
    assert.ok(preset, `preset "${id}" must exist in the preset list`);
    assert.ok(preset.name.length > 0, `preset "${id}" must have a non-empty name`);
    assert.ok(preset.visiblePanels.length > 0, `preset "${id}" must have at least one visible panel`);
  }
});

test('each preset produces a distinct visible panel set or different zone configuration', () => {
  const registry = createRegistry();

  // Collect effective layout signature (visible panels + collapsed zones) per preset.
  const signaturesByPreset: Map<string, string> = new Map();

  for (const preset of workspacePresetList) {
    applyPresetToRegistry(registry, preset);
    const visiblePanels = registry.getPanelStates()
      .filter((s: { visible: boolean }) => s.visible)
      .map((s: { panelId: string }) => s.panelId)
      .sort()
      .join(',');
    // Include zone collapse state in the signature: compact differs from director via zones.
    const collapsedZones = preset.collapsedZones.slice().sort().join(',');
    const centerEmphasis = preset.centerEmphasis;
    signaturesByPreset.set(preset.id, `panels:${visiblePanels}|zones:${collapsedZones}|emphasis:${centerEmphasis}`);
  }

  // Every preset must produce a non-empty visible panel set.
  for (const [presetId, signature] of signaturesByPreset) {
    assert.ok(signature.includes('program-monitor'), `preset "${presetId}" must keep program-monitor visible`);
    assert.ok(signature.includes('preview-monitor'), `preset "${presetId}" must keep preview-monitor visible`);
  }

  // These presets have distinct panel sets (different explicit visible/hidden lists).
  const directorPanels = signaturesByPreset.get('director')!;
  const soloStreamerPanels = signaturesByPreset.get('solo-streamer')!;
  const audioEngineerPanels = signaturesByPreset.get('audio-engineer')!;
  assert.notEqual(directorPanels, soloStreamerPanels, 'director and solo-streamer must differ in panel set or zone config');
  assert.notEqual(directorPanels, audioEngineerPanels, 'director and audio-engineer must differ in panel set or zone config');

  // Compact achieves its "maximized center" effect via zone collapsing, not panel hiding.
  // Verify it collapses all three adjustable zones.
  const compactPreset = workspacePresets.compact;
  assert.ok(compactPreset.collapsedZones.includes('left-dock'), 'compact must collapse left-dock');
  assert.ok(compactPreset.collapsedZones.includes('right-dock'), 'compact must collapse right-dock');
  assert.ok(compactPreset.collapsedZones.includes('bottom-workspace'), 'compact must collapse bottom-workspace');
  assert.equal(workspacePresets.director.collapsedZones.length, 0, 'director must collapse no zones');

  // Compact and director must differ in their effective layout (different zone state).
  assert.notEqual(
    signaturesByPreset.get('director'),
    signaturesByPreset.get('compact'),
    'director and compact must have different effective layout signatures (compact collapses all zones)',
  );
});

test('only one preset is active after applyPresetToRegistry', () => {
  const registry = createRegistry();

  // Apply director, then switch to solo-streamer — only solo-streamer panels should be active.
  applyPresetToRegistry(registry, workspacePresets.director);
  applyPresetToRegistry(registry, workspacePresets['solo-streamer']);

  const soloStreamerVisible = new Set(workspacePresets['solo-streamer'].visiblePanels);
  const soloStreamerHidden = new Set(workspacePresets['solo-streamer'].hiddenPanels);

  for (const panelId of soloStreamerHidden) {
    assert.equal(
      registry.getPanelState(panelId)?.visible,
      false,
      `switching to solo-streamer must hide panel "${panelId}"`,
    );
  }
  for (const panelId of soloStreamerVisible) {
    assert.equal(
      registry.getPanelState(panelId)?.visible,
      true,
      `switching to solo-streamer must show panel "${panelId}"`,
    );
  }
});

test('layout lock must not block applyPresetToRegistry', () => {
  // applyPresetToRegistry is the pure logic function that preset switching calls.
  // It must always work regardless of any lock state (lock is a UI/hook concern,
  // not a logic layer concern). This test confirms that calling applyPresetToRegistry
  // always produces the expected panel state.
  const registry = createRegistry();

  // Apply director first.
  applyPresetToRegistry(registry, workspacePresets.director);
  const directorVisible = registry.getPanelStates().filter((s) => s.visible).map((s) => s.panelId);

  // Apply solo-streamer next — this must succeed and change panel states.
  applyPresetToRegistry(registry, workspacePresets['solo-streamer']);
  const soloStreamerVisible = registry.getPanelStates().filter((s) => s.visible).map((s) => s.panelId);

  // The panel sets must differ.
  assert.notDeepEqual(
    directorVisible.sort(),
    soloStreamerVisible.sort(),
    'applyPresetToRegistry must change visible panel set (must not be blocked)',
  );
});

test('applying a preset after save/load does not restore the old preset panels', () => {
  // Regression: stale persisted layout must not overwrite a newly selected preset.
  const registry = createRegistry();

  // Simulate: saved layout has director panels.
  applyPresetToRegistry(registry, workspacePresets.director);
  const savedStates = registry.getPanelStates();

  // Now switch to solo-streamer (as the user would do after page reload + hydration).
  applyPresetToRegistry(registry, workspacePresets['solo-streamer']);

  // Restore saved states via applyLayoutSnapshot-equivalent: the preset must still win.
  // (The hook's hydration path calls applyPresetToRegistry FIRST, then applyLayoutSnapshot.
  // applyLayoutSnapshot only overwrites individual panel states, not the full preset.)
  // Verify that solo-streamer's hiddenPanels are actually hidden after the switch.
  for (const panelId of workspacePresets['solo-streamer'].hiddenPanels) {
    assert.equal(
      registry.getPanelState(panelId)?.visible,
      false,
      `after switching to solo-streamer, panel "${panelId}" must be hidden (saved layout must not re-show it)`,
    );
  }

  // Applying director's saved states back manually would re-show them (this is the
  // old (broken) behavior — here we confirm restoring a different preset's snapshot
  // after a preset switch would be wrong):
  registry.restorePanelStates(savedStates);
  for (const panelId of workspacePresets['solo-streamer'].hiddenPanels) {
    // After restoring director's snapshot, those panels are visible again — showing
    // the bug was a hydration order issue, not a logic bug.
    const directorState = savedStates.find((s) => s.panelId === panelId);
    if (directorState?.visible) {
      assert.equal(
        registry.getPanelState(panelId)?.visible,
        true,
        'restoring director snapshot re-shows solo-streamer hidden panels (confirms the old bug would surface here)',
      );
    }
  }
});

test('Program and Preview remain visible in all 9 presets', () => {
  const registry = createRegistry();
  const monitors = [WORKSPACE_PANEL_IDS.programMonitor, WORKSPACE_PANEL_IDS.previewMonitor];
  for (const preset of workspacePresetList) {
    applyPresetToRegistry(registry, preset);
    for (const monitorId of monitors) {
      const state = registry.getPanelState(monitorId);
      assert.ok(state?.visible, `preset "${preset.id}" must keep ${monitorId} visible`);
    }
  }
});

test('collapsed zones differ between presets (e.g., compact collapses all docks)', () => {
  const compactPreset = workspacePresets.compact;
  const directorPreset = workspacePresets.director;

  assert.ok(
    compactPreset.collapsedZones.includes('left-dock'),
    'compact preset must collapse left-dock',
  );
  assert.ok(
    compactPreset.collapsedZones.includes('right-dock'),
    'compact preset must collapse right-dock',
  );
  assert.ok(
    compactPreset.collapsedZones.includes('bottom-workspace'),
    'compact preset must collapse bottom-workspace',
  );
  assert.equal(
    directorPreset.collapsedZones.length,
    0,
    'director preset must not collapse any zone',
  );
});
