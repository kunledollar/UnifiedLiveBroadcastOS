import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * UBDS motion + intelligence integration (Step 96).
 *
 * ui-intelligence.css is not compiled/copied into dist-test, so it is read
 * directly from its source location and asserted on as a golden file. This
 * guards the Step 96 mapping (highlight -> glow + elevate, warn -> shake,
 * pulse -> pulse animation on the elastic curve, prepare -> subtle glow,
 * dim/suppress -> linear fadeOut, elevate -> elevate motion) against silent
 * regressions without requiring a CSS parser dependency.
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

test('UBDS: highlight combines a glow transition with a one-shot elevate rise (Step 96)', () => {
  const highlight = ruleBody('.ubos-highlight');
  assert.match(highlight, /transition:\s*box-shadow/);
  assert.match(highlight, /animation:\s*ubos-elevate/);
});

test('UBDS: warn shakes once to demand attention (Step 96)', () => {
  assert.match(ruleBody('.ubos-warn'), /animation:\s*ubos-shake/);
});

test('UBDS: pulse loops on the elastic (spring) timing curve, not a standard ease (Step 96)', () => {
  const pulse = ruleBody('.ubos-pulse');
  assert.match(pulse, /animation:\s*ubos-ui-pulse/);
  assert.match(pulse, /var\(--ubos-easing-spring\)/);
  assert.match(pulse, /infinite/);
});

test('UBDS: prepare gets a subtle glow transition, distinct from highlight\'s (Step 96)', () => {
  const prepare = ruleBody('.ubos-prepare');
  assert.match(prepare, /transition:\s*box-shadow/);
  assert.doesNotMatch(prepare, /animation:\s*ubos-elevate/);
});

test('UBDS: elevated gets the one-shot elevate rise (Step 96)', () => {
  assert.match(ruleBody('.ubos-elevated'), /animation:\s*ubos-elevate/);
});

test('UBDS: dim and suppress fade in on a linear curve — mechanical, not eased (Step 96)', () => {
  for (const selector of ['.ubos-dim', '.ubos-suppress']) {
    const rule = ruleBody(selector);
    assert.match(rule, /transition:\s*opacity[^,]*\blinear\b/, `${selector} should use a linear opacity transition`);
  }
});

test('UBDS: the workspace shell never applies the transform-based elevate rise (Step 96)', () => {
  const shellElevated = ruleBody('.ubos-workspace-shell-v2.ubos-elevated');
  assert.match(shellElevated, /animation:\s*none/);
  assert.doesNotMatch(shellElevated, /ubos-elevate/);
});
