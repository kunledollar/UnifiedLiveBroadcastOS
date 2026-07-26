import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

/**
 * UBDS broadcast rhythm grid + intelligence integration (Step 98).
 *
 * ui-intelligence.css is not compiled/copied into dist-test, so it is read
 * directly from its source location and asserted on as a golden file. This
 * guards the Step 98 mapping (highlight -> expand column, warn -> increase
 * gutter, pulse -> rhythmic shift, prepare -> alignment nudge, dim ->
 * reduce column, suppress -> collapse region, elevate -> increase margin)
 * against silent regressions without requiring a CSS parser dependency.
 *
 * It also guards the "no transform conflict" invariant: signals that carry
 * a transform-based motion animation (highlight/warn/elevated) must use
 * `outline-offset` for their grid effect, never a static `transform`,
 * since an animation's `forwards` fill mode would silently override any
 * static `transform` declared alongside it.
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

test('UBDS: highlight, warn, and elevated use outline-offset for their grid effect, never a static transform (Step 98)', () => {
  for (const selector of ['.ubos-highlight', '.ubos-warn', '.ubos-elevated']) {
    const rule = ruleBody(selector);
    assert.match(rule, /outline-offset:/, `${selector} should set outline-offset`);
    // A `transform:` *property* declaration (not the unrelated `animation:` line
    // that plays ubos-elevate/ubos-shake, which already animates transform).
    assert.doesNotMatch(
      rule,
      /(?:^|[;{\s])transform:/,
      `${selector} should not declare a static transform (it already owns a transform-based animation)`,
    );
  }
});

test('UBDS: warn has a larger outline-offset than highlight — a bigger gutter for the more severe signal (Step 98)', () => {
  const highlightOffset = parseFloat(/outline-offset:\s*(\d+)px/.exec(ruleBody('.ubos-highlight'))![1]!);
  const warnOffset = parseFloat(/outline-offset:\s*(\d+)px/.exec(ruleBody('.ubos-warn'))![1]!);
  assert.ok(warnOffset > highlightOffset, `warn offset (${warnOffset}px) should exceed highlight offset (${highlightOffset}px)`);
});

test('UBDS: prepare nudges alignment, dim reduces column width, suppress collapses further than dim (Step 98)', () => {
  assert.match(ruleBody('.ubos-prepare'), /transform:\s*translateX\(2px\)/);
  const dimScale = parseFloat(/transform:\s*scaleX\(([\d.]+)\)/.exec(ruleBody('.ubos-dim'))![1]!);
  const suppressScale = parseFloat(/transform:\s*scale\(([\d.]+)\)/.exec(ruleBody('.ubos-suppress'))![1]!);
  assert.ok(dimScale < 1, 'dim should scale down slightly');
  assert.ok(suppressScale < dimScale, `suppress (${suppressScale}) should collapse further than dim (${dimScale})`);
});

test('UBDS: pulse gains a rhythmic horizontal shift synced to its existing glow keyframe (Step 98)', () => {
  const keyframes = balancedBlockBody('@keyframes ubos-ui-pulse');
  const transforms = [...keyframes.matchAll(/transform:\s*([^;]+);/g)].map((m) => m[1]!.trim());
  assert.equal(transforms.length, 2, 'expected a transform declaration in both keyframe stops');
  assert.notEqual(transforms[0], transforms[1], 'transform should change between the two stops (a rhythmic shift)');
  assert.match(transforms[1]!, /translateX/);
});
