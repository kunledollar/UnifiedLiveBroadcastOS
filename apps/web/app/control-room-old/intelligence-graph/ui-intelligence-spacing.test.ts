import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * UBDS spacing + intelligence integration (Step 97).
 *
 * ui-intelligence.css is not compiled/copied into dist-test, so it is read
 * directly from its source location and asserted on as a golden file. This
 * guards the Step 97 mapping (highlight -> spacious, warn -> cinematic,
 * prepare -> standard/medium, dim -> tight/small, suppress -> micro,
 * elevate -> spacious/large, pulse -> an animated slight expansion) against
 * silent regressions without requiring a CSS parser dependency.
 */
const cssPath = path.join(
  process.cwd(),
  'app/control-room/intelligence-graph/ui-intelligence.css',
);
const css = readFileSync(cssPath, 'utf8');

function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(match, `selector not found in ui-intelligence.css: ${selector}`);
  return match[1] ?? '';
}

/** Extracts a full block (e.g. an @keyframes rule) accounting for nested braces. */
function balancedBlockBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const start = new RegExp(`${escaped}\\s*\\{`).exec(css);
  assert.ok(start, `selector not found in ui-intelligence.css: ${selector}`);
  const openIndex = start.index + start[0].length;
  let depth = 1;
  let i = openIndex;
  while (depth > 0 && i < css.length) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') depth -= 1;
    i += 1;
  }
  return css.slice(openIndex, i - 1);
}

test('UBDS: highlight and elevated use spacious padding (Step 97)', () => {
  for (const selector of ['.ubos-highlight', '.ubos-elevated']) {
    assert.match(ruleBody(selector), /padding:\s*var\(--ubos-padding-spacious\)/, selector);
  }
});

test('UBDS: warn uses the most spacious tier — cinematic padding (Step 97)', () => {
  assert.match(ruleBody('.ubos-warn'), /padding:\s*var\(--ubos-padding-cinematic\)/);
});

test('UBDS: prepare uses standard/medium padding (Step 97)', () => {
  assert.match(ruleBody('.ubos-prepare'), /padding:\s*var\(--ubos-padding-standard\)/);
});

test('UBDS: dim uses tight/small padding, suppress uses micro padding — smaller than every named tier (Step 97)', () => {
  assert.match(ruleBody('.ubos-dim'), /padding:\s*var\(--ubos-padding-tight\)/);
  assert.match(ruleBody('.ubos-suppress'), /padding:\s*var\(--ubos-space-1\)/);
});

test('UBDS: pulse animates a slight padding expansion rather than a fixed tier (Step 97)', () => {
  assert.match(ruleBody('.ubos-pulse'), /padding:\s*var\(--ubos-padding-standard\)/);
  const keyframes = balancedBlockBody('@keyframes ubos-ui-pulse');
  const paddingValues = [...keyframes.matchAll(/padding:\s*([^;]+);/g)].map((m) => m[1]!.trim());
  assert.equal(paddingValues.length, 2, 'expected a padding declaration in both keyframe stops');
  assert.notEqual(paddingValues[0], paddingValues[1], 'padding should change between the two stops (a breathing expansion)');
});
