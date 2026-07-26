import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AutonomousConfidenceEngine,
  clamp01,
  defaultConfidenceThresholds,
  defaultConfidenceWeights,
  defaultAutonomousConfidenceEngineConfig,
  DEFAULT_DECAY_RATE_PER_SECOND,
} from './autonomousConfidenceEngine.js';

// ── clamp01 ──────────────────────────────────────────────────────────────────

test('ACE: clamp01 keeps in-range values, clamps out-of-range, and treats non-finite as 0', () => {
  assert.equal(clamp01(0.5), 0.5);
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(clamp01(Number.NaN), 0);
});

// ── 1. Confidence scoring / fusion ──────────────────────────────────────────

test('ACE: score() matches the Step 113 spec sample exactly — weighted average, clamped', () => {
  const engine = new AutonomousConfidenceEngine({
    weights: { scene: 2, audio: 1 },
    decayRate: 0,
    thresholds: defaultConfidenceThresholds(),
  });
  // (0.9*2 + 0.6*1) / (2+1) = 2.4/3 = 0.8
  assert.ok(Math.abs(engine.score({ scene: 0.9, audio: 0.6 }) - 0.8) < 1e-9);
});

test('ACE: score() defaults unweighted signals to weight 1', () => {
  const engine = new AutonomousConfidenceEngine({
    weights: { known: 3 },
    decayRate: 0,
    thresholds: defaultConfidenceThresholds(),
  });
  // (0.9*3 + 0.5*1) / (3+1) = 3.2/4 = 0.8
  assert.ok(Math.abs(engine.score({ known: 0.9, unknown: 0.5 }) - 0.8) < 1e-9);
});

test('ACE: fuse() weightedAverage matches score() exactly (the default strategy)', () => {
  const engine = new AutonomousConfidenceEngine();
  const signals = { prediction: 0.9, systemHealth: 0.7 };
  assert.equal(engine.fuse(signals), engine.score(signals));
  assert.equal(engine.fuse(signals, 'weightedAverage'), engine.score(signals));
});

test('ACE: fuse() max/min return the strongest/weakest signal respectively', () => {
  const engine = new AutonomousConfidenceEngine();
  const signals = { a: 0.9, b: 0.3, c: 0.6 };
  assert.equal(engine.fuse(signals, 'max'), 0.9);
  assert.equal(engine.fuse(signals, 'min'), 0.3);
});

test('ACE: fuse() harmonicMean is pulled down more by a low outlier than a plain average would be', () => {
  const engine = new AutonomousConfidenceEngine();
  const signals = { a: 0.9, b: 0.9, c: 0.1 };
  const harmonic = engine.fuse(signals, 'harmonicMean');
  const plainAverage = (0.9 + 0.9 + 0.1) / 3;
  assert.ok(harmonic < plainAverage, `harmonic mean (${harmonic}) should be lower than the plain average (${plainAverage})`);
});

test('ACE: fuse() safetyAware discounts the weighted average by the weakest signal present', () => {
  const engine = new AutonomousConfidenceEngine({
    weights: { a: 1, b: 1 },
    decayRate: 0,
    thresholds: defaultConfidenceThresholds(),
  });
  const highConfidenceBothStrong = engine.fuse({ a: 0.9, b: 0.9 }, 'safetyAware');
  const sameAverageOneWeak = engine.fuse({ a: 0.9, b: 0.9 - 0.001 }, 'safetyAware'); // still ~0.9 avg
  const oneVeryWeak = engine.fuse({ a: 0.9, b: 0.1 }, 'safetyAware');
  assert.ok(oneVeryWeak < highConfidenceBothStrong, 'a weak signal should discount the fused result');
  assert.ok(oneVeryWeak < sameAverageOneWeak);
});

test('ACE: fuse() with no signals returns 0 for every strategy, never throws', () => {
  const engine = new AutonomousConfidenceEngine();
  for (const strategy of ['weightedAverage', 'max', 'min', 'harmonicMean', 'safetyAware'] as const) {
    assert.equal(engine.fuse({}, strategy), 0);
  }
});

// ── 2. Confidence decay ──────────────────────────────────────────────────────

test('ACE: decay() matches the Step 113 spec sample exactly — linear reduction, floored at 0', () => {
  const engine = new AutonomousConfidenceEngine({
    weights: defaultConfidenceWeights(),
    decayRate: 0.05,
    thresholds: defaultConfidenceThresholds(),
  });
  assert.equal(engine.decay(0.9, 2), 0.8); // 0.9 - 0.05*2
  assert.equal(engine.decay(0.05, 10), 0); // would go negative, floors at 0
});

test('ACE: decay() never increases confidence and treats negative elapsed time as zero', () => {
  const engine = new AutonomousConfidenceEngine();
  assert.equal(engine.decay(0.8, -5), 0.8);
  assert.equal(engine.decay(0.8, 0), 0.8);
});

test('ACE: default decay rate barely moves a fresh score within one tick, but fully decays a stale one', () => {
  const engine = new AutonomousConfidenceEngine();
  assert.equal(DEFAULT_DECAY_RATE_PER_SECOND, 0.01);
  const after1s = engine.decay(0.85, 1);
  assert.ok(after1s > 0.83, 'one second of decay should barely move a fresh, confident score');
  const after90s = engine.decay(0.85, 90);
  assert.equal(after90s, 0, 'a decision stale by 90 seconds should be fully decayed');
});

// ── 4. Confidence thresholds ─────────────────────────────────────────────────

test('ACE: meetsThreshold defaults to the toAct threshold, matching the spec sample\'s single-threshold behavior', () => {
  const engine = new AutonomousConfidenceEngine();
  assert.equal(engine.meetsThreshold(0.9), true);
  assert.equal(engine.meetsThreshold(0.5), false);
});

test('ACE: the four named thresholds are ordered toPredict <= toOverride <= toRecover <= toAct by default', () => {
  const t = defaultConfidenceThresholds();
  assert.ok(t.toPredict <= t.toOverride);
  assert.ok(t.toOverride <= t.toRecover);
  assert.ok(t.toRecover <= t.toAct);
});

test('ACE: meetsThreshold with an explicit name checks that specific threshold, independent of the others', () => {
  const engine = new AutonomousConfidenceEngine();
  // 0.55 clears toPredict/toOverride but not toRecover/toAct.
  assert.equal(engine.meetsThreshold(0.55, 'toPredict'), true);
  assert.equal(engine.meetsThreshold(0.55, 'toOverride'), false);
  assert.equal(engine.meetsThreshold(0.55, 'toRecover'), false);
  assert.equal(engine.meetsThreshold(0.55, 'toAct'), false);
});

// ── Configuration mutation ──────────────────────────────────────────────────

test('ACE: setWeights merges partial updates over the current weights', () => {
  const engine = new AutonomousConfidenceEngine();
  engine.setWeights({ prediction: 5 });
  assert.equal(engine.getConfig().weights.prediction, 5);
  assert.equal(engine.getConfig().weights.systemHealth, defaultConfidenceWeights().systemHealth);
});

test('ACE: setThresholds merges partial updates over the current thresholds', () => {
  const engine = new AutonomousConfidenceEngine();
  engine.setThresholds({ toAct: 0.95 });
  assert.equal(engine.getConfig().thresholds.toAct, 0.95);
  assert.equal(engine.getConfig().thresholds.toPredict, defaultConfidenceThresholds().toPredict);
});

test('ACE: setDecayRate replaces the decay rate outright', () => {
  const engine = new AutonomousConfidenceEngine();
  engine.setDecayRate(0.5);
  assert.equal(engine.decay(1, 1), 0.5);
});

test('ACE: reset() restores the default configuration exactly', () => {
  const engine = new AutonomousConfidenceEngine();
  engine.setWeights({ prediction: 99 });
  engine.setThresholds({ toAct: 0.1 });
  engine.setDecayRate(0.9);
  engine.reset();

  assert.deepEqual(engine.getConfig(), defaultAutonomousConfidenceEngineConfig());
});
