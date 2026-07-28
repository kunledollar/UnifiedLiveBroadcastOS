import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * UBDS elevation + intelligence integration (Step 94).
 *
 * ui-intelligence.css is not compiled/copied into dist-test, so it is read
 * directly from its source location and asserted on as a golden file. This
 * guards the Step 94 mapping (highlight/pulse/elevate -> Level 3,
 * warn -> Level 4 with a thick outline, prepare -> Level 2, dim -> Level 1,
 * suppress -> Level 0/no shadow) against silent regressions without
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

test('UBDS: highlight, pulse, and elevate render at Level 3 depth (Step 94)', () => {
  for (const selector of ['.ubos-highlight', '.ubos-pulse', '.ubos-elevated']) {
    assert.match(ruleBody(selector), /var\(--ubos-depth-3\)/);
    assert.match(ruleBody(selector), /z-index:\s*3/);
  }
});

test('UBDS: warn renders at Level 4 depth with a thick 2px outline (Step 94)', () => {
  const warn = ruleBody('.ubos-warn');
  assert.match(warn, /var\(--ubos-depth-4\)/);
  assert.match(warn, /z-index:\s*4/);
  assert.match(warn, /outline:\s*2px/);
});

test('UBDS: prepare renders at Level 2 depth with a subtle gradient (Step 94)', () => {
  const prepare = ruleBody('.ubos-prepare');
  assert.match(prepare, /var\(--ubos-depth-2\)/);
  assert.match(prepare, /z-index:\s*2/);
  assert.match(prepare, /background-image:\s*var\(--ubos-gradient-linear\)/);
});

test('UBDS: dim renders at Level 1 depth, suppress recedes to Level 0 with no shadow (Step 94)', () => {
  const dim = ruleBody('.ubos-dim');
  assert.match(dim, /var\(--ubos-depth-1\)/);
  assert.match(dim, /z-index:\s*1/);

  const suppress = ruleBody('.ubos-suppress');
  assert.match(suppress, /box-shadow:\s*none/);
  assert.match(suppress, /z-index:\s*0/);
});

test('UBDS: the CSS elevation mapping matches the Step 94 spec exactly (highlight/pulse/elevate → 3, warn → 4, prepare → 2, dim → 1, suppress → 0)', () => {
  // Mirrors `ubosIntelligenceElevationMap` in packages/ui/design-system/tokens/elevation.ts,
  // which has its own dedicated assertion in ubds-foundation.test.ts. Duplicated here as a
  // literal (rather than imported) because this test runs via plain `node --test` on compiled
  // output outside of Next.js's webpack/transpilePackages pipeline, where @ubos/ui's own
  // package-relative build output is not guaranteed to resolve.
  const depthVarBySelector: Record<string, string> = {
    '.ubos-highlight': '--ubos-depth-3',
    '.ubos-warn': '--ubos-depth-4',
    '.ubos-pulse': '--ubos-depth-3',
    '.ubos-prepare': '--ubos-depth-2',
    '.ubos-dim': '--ubos-depth-1',
    '.ubos-elevated': '--ubos-depth-3',
  };
  for (const [selector, depthVar] of Object.entries(depthVarBySelector)) {
    assert.match(ruleBody(selector), new RegExp(`var\\(${depthVar}\\)`), `${selector} should use ${depthVar}`);
  }
  assert.match(ruleBody('.ubos-suppress'), /box-shadow:\s*none/, '.ubos-suppress should have no shadow (Level 0)');
});
