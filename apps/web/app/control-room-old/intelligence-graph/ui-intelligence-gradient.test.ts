import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * UBDS depth + gradient system integration (Step 95).
 *
 * ui-intelligence.css is not compiled/copied into dist-test, so it is read
 * directly from its source location and asserted on as a golden file. This
 * guards the Step 95 gradient-shape mapping — highlight/pulse/elevate use
 * the Radial Highlight Gradient (not a generic linear one), warn uses the
 * Critical Gradient, and prepare uses the Linear Depth Gradient — against
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

test('UBDS: highlight, pulse, and elevate use the Radial Highlight Gradient (Step 95)', () => {
  for (const selector of ['.ubos-highlight', '.ubos-pulse', '.ubos-elevated']) {
    assert.match(
      ruleBody(selector),
      /background-image:\s*var\(--ubos-gradient-radial-highlight\)/,
      `${selector} should use the Radial Highlight Gradient`,
    );
  }
});

test('UBDS: warn uses the Critical Gradient, not the Radial Highlight Gradient (Step 95)', () => {
  const warn = ruleBody('.ubos-warn');
  assert.match(warn, /background-image:\s*var\(--ubos-gradient-critical\)/);
  assert.doesNotMatch(warn, /--ubos-gradient-radial-highlight/);
});

test('UBDS: prepare uses the Linear Depth Gradient (Step 95)', () => {
  assert.match(
    ruleBody('.ubos-prepare'),
    /background-image:\s*var\(--ubos-gradient-linear\)/,
  );
});

test('UBDS: dim and suppress have no gradient — they recede, they do not light up (Step 95)', () => {
  for (const selector of ['.ubos-dim', '.ubos-suppress']) {
    assert.doesNotMatch(ruleBody(selector), /background-image/, `${selector} should have no gradient`);
  }
});
