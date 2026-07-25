import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ubosColors,
  ubosBroadcastHues,
  ubosColorRampStates,
  ubosElevation,
  ubosElevationLevels,
  ubosMotionSystem,
  ubosRhythm,
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

test('UBDS: motion system defines the five canonical primitives', () => {
  const primitives = ['pulse', 'glow', 'slide', 'fade', 'shake'] as const;
  for (const primitive of primitives) {
    assert.ok(
      typeof ubosMotionSystem[primitive] === 'string' && ubosMotionSystem[primitive].length > 0,
      `motion primitive missing: ${primitive}`,
    );
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

test('UBDS: foundation version markers are exposed', () => {
  assert.equal(UBDS_FOUNDATION_STEP, 93);
  assert.equal(typeof UBOS_DESIGN_SYSTEM_VERSION, 'string');
});
