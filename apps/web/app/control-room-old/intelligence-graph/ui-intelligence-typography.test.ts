import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * UBDS typography + intelligence integration (Step 93).
 *
 * ui-intelligence.css is not compiled/copied into dist-test, so it is read
 * directly from its source location and asserted on as a golden file. This
 * guards the Step 93 mapping (highlight/warn -> bold, prepare -> italic,
 * pulse -> animated text-shadow glow) against silent regressions without
 * requiring a CSS parser dependency.
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

test('UBDS: highlight and warn signals render as bold text (Step 93)', () => {
  assert.match(ruleBody('.ubos-highlight'), /font-weight:\s*700/);
  assert.match(ruleBody('.ubos-warn'), /font-weight:\s*700/);
});

test('UBDS: prepare signal renders as italic text (Step 93)', () => {
  assert.match(ruleBody('.ubos-prepare'), /font-style:\s*italic/);
});

test('UBDS: pulse signal animates a text glow alongside the box glow (Step 93)', () => {
  assert.match(ruleBody('.ubos-pulse'), /animation:\s*ubos-ui-pulse/);
  assert.match(ruleBody('@keyframes ubos-ui-pulse'), /text-shadow/);
});

test('UBDS: dim and suppress remain color-neutral de-emphasis, not bold/italic (Step 93)', () => {
  const dim = ruleBody('.ubos-dim');
  const suppress = ruleBody('.ubos-suppress');
  for (const rule of [dim, suppress]) {
    assert.doesNotMatch(rule, /font-weight/);
    assert.doesNotMatch(rule, /font-style/);
  }
  // suppress leans toward micro-text sizing per the Step 93 spec
  // ("suppress -> micro-text or hidden").
  assert.match(suppress, /font-size/);
});
