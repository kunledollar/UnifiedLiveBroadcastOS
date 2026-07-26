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
  ubosShadows,
  ubosTypographyClasses,
  ubdsTypographyRoles,
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

test('UBDS: spacing rhythm matches the 4/8/12/16/24px scale', () => {
  assert.equal(ubosRhythm.micro, '0.25rem');
  assert.equal(ubosRhythm.small, '0.5rem');
  assert.equal(ubosRhythm.medium, '0.75rem');
  assert.equal(ubosRhythm.large, '1rem');
  assert.equal(ubosRhythm.xlarge, '1.5rem');
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

test('UBDS: foundation version markers are exposed', () => {
  assert.equal(UBDS_FOUNDATION_STEP, 96);
  assert.equal(typeof UBOS_DESIGN_SYSTEM_VERSION, 'string');
});
