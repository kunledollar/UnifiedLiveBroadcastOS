import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ubosColors,
  ubosBroadcastHues,
  ubosColorRampStates,
  ubosElevation,
  ubosElevationLevels,
  ubosElevationClasses,
  ubosElevationGradientType,
  ubosGradients,
  ubosIntelligenceElevationMap,
  ubosMotionSystem,
  ubosMotionCurves,
  ubosIntelligenceMotionMap,
  ubosEasing,
  ubosRhythm,
  ubosPadding,
  ubosDensity,
  ubosScaleSpacing,
  ubosIntelligenceSpacingMap,
  ubosShadows,
  ubosTypographyClasses,
  ubdsTypographyRoles,
  ubosGrid,
  ubosApplyGridDensity,
  ubosWorkspaceGridTemplates,
  ubosIntelligenceGridMap,
  ubosWorkspaceTemplates,
  ubosWorkspaceTemplateNames,
  ubosThemes,
  ubosThemeNames,
  ubosIntelligenceThemeMap,
  UBOS_DESIGN_SYSTEM_VERSION,
  UBDS_FOUNDATION_STEP,
} from './index.js';

test('UBDS: every broadcast hue exposes the full base/hover/active/elevated/dimmed ramp', () => {
  for (const hue of ubosBroadcastHues) {
    const token = ubosColors[hue] as Record<string, string>;
    for (const state of ubosColorRampStates) {
      assert.ok(
        typeof token[state] === 'string' && token[state].length > 0,
        `${hue}.${state} should be a non-empty color value`,
      );
    }
  }
});

test('UBDS: broadcast color language includes the seven required hues', () => {
  const required = ['program', 'preview', 'selection', 'automation', 'graphics', 'replay', 'warning'];
  for (const hue of required) {
    assert.ok(ubosBroadcastHues.includes(hue as (typeof ubosBroadcastHues)[number]), `missing hue: ${hue}`);
  }
});

test('UBDS: warning and critical are universal override tones, not per-hue states', () => {
  // warning exists once as a shared token (not duplicated per hue)
  assert.ok(ubosColors.warning);
  // critical is represented by the shared `error` token, distinct from Program Red
  assert.ok(ubosColors.error);
  assert.notEqual(ubosColors.error.DEFAULT, ubosColors.program.DEFAULT);
});

test('UBDS: elevation model defines exactly levels 0-4', () => {
  assert.deepEqual([...ubosElevationLevels], [0, 1, 2, 3, 4]);
  for (const level of ubosElevationLevels) {
    const token = ubosElevation[level];
    assert.ok(typeof token.background === 'string');
    assert.ok(typeof token.shadow === 'string');
    assert.ok(typeof token.border === 'string');
  }
});

test('UBDS: elevation increases in visual weight from level 0 to level 4', () => {
  assert.equal(ubosElevation[0].shadow, 'none');
  assert.notEqual(ubosElevation[1].shadow, 'none');
  // Level 3 and 4 layer additional emphasis (selection/critical glow) on top of the raised shadow.
  assert.ok(ubosElevation[3].shadow.length > ubosElevation[1].shadow.length);
  assert.ok(ubosElevation[4].shadow.length > ubosElevation[1].shadow.length);
});

test('UBDS: motion system defines the six canonical primitives (Step 96 adds elevate)', () => {
  const primitives = ['pulse', 'glow', 'slide', 'fade', 'shake', 'elevate'] as const;
  for (const primitive of primitives) {
    assert.ok(
      typeof ubosMotionSystem[primitive] === 'string' && ubosMotionSystem[primitive].length > 0,
      `motion primitive missing: ${primitive}`,
    );
  }
});

test('UBDS: motion timing curves are named by the state they serve, not just their shape (Step 96)', () => {
  assert.deepEqual(Object.keys(ubosMotionCurves).sort(), [
    'fade',
    'highlight',
    'pulse',
    'warning',
    'workspaceTransition',
  ]);
  // Fast-in / slow-out for highlights = ease-out.
  assert.equal(ubosMotionCurves.highlight, ubosEasing.out);
  // Slow-in / fast-out for warnings = ease-in.
  assert.equal(ubosMotionCurves.warning, ubosEasing.in);
  // Linear for fades.
  assert.equal(ubosMotionCurves.fade, 'linear');
  // Elastic overshoot for pulses.
  assert.equal(ubosMotionCurves.pulse, ubosEasing.spring);
  assert.match(ubosEasing.spring, /cubic-bezier/);
  // Ease-in for workspace transitions.
  assert.equal(ubosMotionCurves.workspaceTransition, ubosEasing.in);
});

test('UBDS: motion + intelligence integration maps all seven WIE signals to their spec-defined primitive(s) (Step 96)', () => {
  assert.deepEqual(ubosIntelligenceMotionMap, {
    highlight: ['glow', 'elevate'],
    warn: ['shake'],
    pulse: ['pulse'],
    prepare: ['glow'],
    dim: ['fade'],
    suppress: ['fade'],
    elevate: ['elevate'],
  });
  // Every referenced primitive must actually exist in the motion system.
  for (const primitives of Object.values(ubosIntelligenceMotionMap)) {
    for (const primitive of primitives) {
      assert.ok(primitive in ubosMotionSystem, `unknown motion primitive: ${primitive}`);
    }
  }
});

test('UBDS: spacing scale matches the 4/8/12/16/24/32px six-level grid (Step 97 adds xxlarge)', () => {
  assert.equal(ubosRhythm.micro, '0.25rem');
  assert.equal(ubosRhythm.small, '0.5rem');
  assert.equal(ubosRhythm.medium, '0.75rem');
  assert.equal(ubosRhythm.large, '1rem');
  assert.equal(ubosRhythm.xlarge, '1.5rem');
  assert.equal(ubosRhythm.xxlarge, '2rem');
  assert.deepEqual(Object.keys(ubosRhythm), ['micro', 'small', 'medium', 'large', 'xlarge', 'xxlarge']);
});

test('UBDS: padding hierarchy exposes the four canonical tiers, most-to-least tight (Step 97)', () => {
  assert.deepEqual(Object.keys(ubosPadding), ['tight', 'standard', 'spacious', 'cinematic']);
  assert.equal(ubosPadding.tight, ubosRhythm.small);
  assert.equal(ubosPadding.standard, ubosRhythm.medium);
  assert.equal(ubosPadding.spacious, ubosRhythm.large);
  assert.equal(ubosPadding.cinematic, ubosRhythm.xlarge);
  const order = ['tight', 'standard', 'spacious', 'cinematic'] as const;
  for (let i = 1; i < order.length; i += 1) {
    const prev = parseFloat(ubosPadding[order[i - 1]!]);
    const current = parseFloat(ubosPadding[order[i]!]);
    assert.ok(current > prev, `${order[i]} (${current}rem) should be larger than ${order[i - 1]} (${prev}rem)`);
  }
});

test('UBDS: density modes are multipliers on the same scale, not a second parallel scale (Step 97)', () => {
  assert.deepEqual(ubosDensity, { compact: 0.75, standard: 1, director: 1.2 });
  assert.equal(ubosScaleSpacing(ubosRhythm.large, 'compact'), '0.75rem'); // 16px * 0.75 = 12px
  assert.equal(ubosScaleSpacing(ubosRhythm.large, 'standard'), '1rem');
  assert.equal(ubosScaleSpacing(ubosRhythm.large, 'director'), '1.2rem'); // 16px * 1.2 = 19.2px
});

test('UBDS: spacing + intelligence integration maps signals to their spec-defined padding tier (Step 97)', () => {
  assert.deepEqual(ubosIntelligenceSpacingMap, {
    highlight: ubosPadding.spacious,
    warn: ubosPadding.cinematic,
    prepare: ubosRhythm.medium,
    dim: ubosRhythm.small,
    suppress: ubosRhythm.micro,
    elevate: ubosRhythm.large,
  });
  // highlight and elevate are both Level 3 in the elevation map, and both land
  // on the same 16px value here too — spacing and elevation agree.
  assert.equal(ubosIntelligenceSpacingMap.highlight, ubosIntelligenceSpacingMap.elevate);
});

test('UBDS: typography hierarchy exposes all six canonical roles (Step 93)', () => {
  const required = ['title', 'sectionLabel', 'body', 'microText', 'hud', 'intelligence'];
  assert.deepEqual([...ubdsTypographyRoles].sort(), [...required].sort());
  for (const role of ubdsTypographyRoles) {
    assert.ok(
      typeof ubosTypographyClasses[role] === 'string' && ubosTypographyClasses[role].length > 0,
      `typography role missing: ${role}`,
    );
  }
  assert.match(ubosTypographyClasses.title, /uppercase/);
  assert.match(ubosTypographyClasses.sectionLabel, /uppercase/);
});

test('UBDS: HUD Text is bold with a legibility shadow and no baked-in color', () => {
  assert.match(ubosTypographyClasses.hud, /font-bold/);
  assert.match(ubosTypographyClasses.hud, /text-shadow/);
  assert.doesNotMatch(ubosTypographyClasses.hud, /text-ubos-fg-/);
});

test('UBDS: Intelligence Text is medium weight, distinct from Body and HUD Text', () => {
  assert.match(ubosTypographyClasses.intelligence, /font-medium/);
  assert.notEqual(ubosTypographyClasses.intelligence, ubosTypographyClasses.body);
  assert.notEqual(ubosTypographyClasses.intelligence, ubosTypographyClasses.hud);
});

test('UBDS: only Level 4 (Critical Panel) uses a thick 2px border (Step 94)', () => {
  for (const level of ubosElevationLevels) {
    assert.equal(ubosElevation[level].borderWidth, level === 4 ? 2 : 1, `level ${level} border width`);
  }
  assert.match(ubosElevationClasses[4], /border-2\b/);
  for (const level of [0, 1, 2, 3] as const) {
    assert.doesNotMatch(ubosElevationClasses[level], /border-2\b/);
  }
});

test('UBDS: Level 0/1 are flat (no gradient), Level 2-4 each have a gradient (Step 94)', () => {
  assert.equal(ubosElevation[0].gradient, undefined);
  assert.equal(ubosElevation[1].gradient, undefined);
  for (const level of [2, 3, 4] as const) {
    assert.ok(
      typeof ubosElevation[level].gradient === 'string' && ubosElevation[level].gradient!.length > 0,
      `level ${level} should have a gradient`,
    );
  }
});

test('UBDS: each elevation level uses its Step 95 canonical gradient shape', () => {
  assert.deepEqual(ubosElevationGradientType, {
    0: 'flat',
    1: 'flat',
    2: 'linear',
    3: 'radialHighlight',
    4: 'critical',
  });
  for (const level of ubosElevationLevels) {
    assert.equal(ubosElevation[level].gradientType, ubosElevationGradientType[level]);
  }
  // Level 2 = Linear Depth Gradient (top-down).
  assert.match(ubosElevation[2].gradient!, /^linear-gradient/);
  assert.equal(ubosElevation[2].gradient, ubosGradients.linear);
  // Level 3 = Radial Highlight Gradient, not linear — this is the key Step 95
  // change from Step 94, where every level used a linear gradient.
  assert.match(ubosElevation[3].gradient!, /^radial-gradient/);
  assert.equal(ubosElevation[3].gradient, ubosGradients.radialHighlight);
  // Level 4 = Critical Gradient, tinted with the shared critical/error tone
  // (not Program Red — a warning is not the same meaning as a live tally).
  assert.match(ubosElevation[4].gradient!, /^linear-gradient/);
  assert.equal(ubosElevation[4].gradient, ubosGradients.critical);
  assert.ok(ubosElevation[4].gradient!.includes(ubosColors.error.muted));
});

test('UBDS: the Gradient System exposes exactly the three canonical shapes (Step 95)', () => {
  assert.deepEqual(Object.keys(ubosGradients).sort(), ['critical', 'linear', 'radialHighlight']);
  for (const value of Object.values(ubosGradients)) {
    assert.ok(typeof value === 'string' && value.length > 0);
  }
});

test('UBDS: shadow strength follows the soft/medium/strong/hard progression (Step 94)', () => {
  assert.equal(ubosElevation[1].shadow, ubosShadows.soft);
  assert.match(ubosElevation[2].shadow, new RegExp(ubosShadows.medium.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(ubosElevation[3].shadow, new RegExp(ubosShadows.strong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(ubosElevation[4].shadow, new RegExp(ubosShadows.hard.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('UBDS: elevation + intelligence integration maps all seven WIE signals to their spec-defined level (Step 94)', () => {
  assert.deepEqual(ubosIntelligenceElevationMap, {
    highlight: 3,
    warn: 4,
    pulse: 3,
    prepare: 2,
    dim: 1,
    suppress: 0,
    elevate: 3,
  });
});

test('UBDS: the broadcast rhythm grid is a 12-column grid built from existing rhythm tokens, not a duplicate scale (Step 98)', () => {
  assert.equal(ubosGrid.columns, 12);
  // rhythm/gutter/margin must literally equal the existing named tokens —
  // Step 98 must not introduce a second, drifting set of magic numbers.
  assert.equal(ubosGrid.rhythm, ubosRhythm.micro); // 4px
  assert.equal(ubosGrid.gutter, ubosRhythm.xlarge); // 24px
  assert.equal(ubosGrid.margin, ubosRhythm.xxlarge); // 32px
});

test('UBDS: grid density reuses the Step 97 density multipliers via ubosApplyGridDensity (Step 98)', () => {
  assert.equal(ubosApplyGridDensity(ubosGrid.margin, 'compact'), ubosScaleSpacing(ubosGrid.margin, 'compact'));
  assert.equal(ubosApplyGridDensity(ubosGrid.margin, 'director'), '2.4rem'); // 32px * 1.2 = 38.4px
  assert.equal(ubosApplyGridDensity(ubosGrid.margin, 'compact'), '1.5rem'); // 32px * 0.75 = 24px
});

test('UBDS: the three canonical workspace grid templates each define left/center/right/bottom regions (Step 98)', () => {
  assert.deepEqual(Object.keys(ubosWorkspaceGridTemplates).sort(), ['inspector', 'programOutput', 'triad']);
  for (const template of Object.values(ubosWorkspaceGridTemplates)) {
    for (const region of ['left', 'center', 'right', 'bottom'] as const) {
      assert.ok(typeof template[region] === 'string' && template[region].length > 0, `missing region: ${region}`);
    }
  }
  assert.equal(ubosWorkspaceGridTemplates.triad.center, 'graphics');
  assert.equal(ubosWorkspaceGridTemplates.programOutput.center, 'program');
});

test('UBDS: grid + intelligence integration maps all seven WIE signals to their spec-defined grid action (Step 98)', () => {
  assert.deepEqual(ubosIntelligenceGridMap, {
    highlight: 'expandColumn',
    warn: 'increaseGutter',
    pulse: 'rhythmicShift',
    prepare: 'alignmentNudge',
    dim: 'reduceColumn',
    suppress: 'collapseRegion',
    elevate: 'increaseMargin',
  });
});

test('UBDS: the workspace template library defines exactly the eight canonical workspaces (Step 99)', () => {
  assert.deepEqual([...ubosWorkspaceTemplateNames].sort(), [
    'audio',
    'compact',
    'director',
    'graphics',
    'replay',
    'solo',
    'streaming',
    'technicalDirector',
  ]);
  assert.deepEqual(Object.keys(ubosWorkspaceTemplates).sort(), [...ubosWorkspaceTemplateNames].sort());
});

test('UBDS: every workspace template declares a valid density mode and non-empty accents (Step 99)', () => {
  const validDensity = Object.keys(ubosDensity);
  const validAccent = [...ubosBroadcastHues, 'neutral'];
  for (const name of ubosWorkspaceTemplateNames) {
    const template = ubosWorkspaceTemplates[name];
    assert.ok(validDensity.includes(template.density), `${name}: invalid density ${template.density}`);
    assert.ok(template.accents.length > 0, `${name}: accents must not be empty`);
    for (const accent of template.accents) {
      assert.ok(validAccent.includes(accent), `${name}: unknown accent ${accent}`);
    }
    assert.ok(Object.keys(template.layout).length > 0, `${name}: layout must define at least one region`);
  }
});

test('UBDS: workspace templates reuse the Step 98 grid region vocabulary, not literal CSS Grid areas (Step 99)', () => {
  // Director's center explicitly hosts the canonical Triad template, and
  // several workspaces' right region hosts the canonical Program Output
  // template — these values must match real ubosWorkspaceGridTemplates keys.
  const canonicalPanelNames = Object.keys(ubosWorkspaceGridTemplates);
  assert.ok(canonicalPanelNames.includes(ubosWorkspaceTemplates.director.layout.center!));
  assert.equal(ubosWorkspaceTemplates.director.layout.center, 'triad');
  for (const name of ['director', 'technicalDirector', 'replay', 'streaming'] as const) {
    assert.equal(ubosWorkspaceTemplates[name].layout.right, 'programOutput');
    assert.ok(canonicalPanelNames.includes(ubosWorkspaceTemplates[name].layout.right!));
  }
});

test('UBDS: only Compact collapses panels and floats its intelligence HUD (Step 99)', () => {
  for (const name of ubosWorkspaceTemplateNames) {
    const template = ubosWorkspaceTemplates[name];
    if (name === 'compact') {
      assert.equal(template.collapsiblePanels, true);
      assert.equal(template.floatingHud, true);
    } else {
      assert.ok(!template.collapsiblePanels, `${name} should not collapse panels`);
      assert.ok(!template.floatingHud, `${name} should not float its HUD`);
    }
  }
});

test('UBDS: Director and Solo Streamer are the only director-mode-density workspaces reserved for cinematic control (Step 99)', () => {
  assert.equal(ubosWorkspaceTemplates.director.density, 'director');
  assert.equal(ubosWorkspaceTemplates.solo.density, 'compact');
  const standardDensityWorkspaces = ubosWorkspaceTemplateNames.filter(
    (name) => ubosWorkspaceTemplates[name].density === 'standard',
  );
  assert.deepEqual(standardDensityWorkspaces.sort(), ['audio', 'graphics', 'replay', 'streaming', 'technicalDirector']);
});

test('UBDS: the theme library defines exactly the six canonical intelligence themes (Step 103)', () => {
  assert.deepEqual([...ubosThemeNames].sort(), ['audio', 'director', 'graphics', 'replay', 'solo', 'streaming']);
  assert.deepEqual(Object.keys(ubosThemes).sort(), [...ubosThemeNames].sort());
});

test('UBDS: each theme reuses its matching Step 99 workspace template accents/density exactly, not a second copy (Step 103)', () => {
  for (const name of ubosThemeNames) {
    const theme = ubosThemes[name];
    const template = ubosWorkspaceTemplates[name];
    assert.equal(theme.accents, template.accents, `${name}: theme.accents should be the same reference as the workspace template's`);
    assert.equal(theme.density, template.density, `${name}: theme.density should match the workspace template's`);
  }
});

test('UBDS: every theme motion is one of the six canonical motion primitives, every depth is a valid elevation level (Step 103)', () => {
  for (const name of ubosThemeNames) {
    const theme = ubosThemes[name];
    assert.ok(theme.motion in ubosMotionSystem, `${name}: unknown motion primitive ${theme.motion}`);
    assert.ok([1, 2, 3].includes(theme.depth), `${name}: depth must be elevation level 1, 2, or 3`);
  }
  // Director and Streaming carry the most severe stakes (live transitions,
  // output health) — both get "strong" depth (Level 3).
  assert.equal(ubosThemes.director.depth, 3);
  assert.equal(ubosThemes.streaming.depth, 3);
  // Solo Streamer is explicitly minimal — the lightest depth (Level 1).
  assert.equal(ubosThemes.solo.depth, 1);
});

test('UBDS: theme + intelligence integration maps all seven WIE signals to a named theme modifier (Step 103)', () => {
  assert.deepEqual(ubosIntelligenceThemeMap, {
    highlight: 'increaseAccentIntensity',
    warn: 'switchToCriticalVariant',
    pulse: 'enablePredictiveMotion',
    prepare: 'enableGradientShift',
    dim: 'reduceAccentIntensity',
    suppress: 'collapseOverlays',
    elevate: 'increaseDepthAndSpacing',
  });
});

test('UBDS: foundation version markers are exposed', () => {
  assert.equal(UBDS_FOUNDATION_STEP, 103);
  assert.equal(typeof UBOS_DESIGN_SYSTEM_VERSION, 'string');
});
