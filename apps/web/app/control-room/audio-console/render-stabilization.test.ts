import assert from 'node:assert/strict';
import test from 'node:test';
import { clampMeterLevel, metersSemanticallyEqual } from './audio-stabilization-utils.js';

test('audio meter memo comparator can bucket noisy fractional inputs', () => {
  assert.equal(clampMeterLevel(42.2), clampMeterLevel(42.4));
  assert.equal(clampMeterLevel(-5), 0);
  assert.equal(clampMeterLevel(105), 100);
});

test('mixer meter equality treats identical meter samples as unchanged state', () => {
  const sample = {
    left: 25,
    right: 25,
    peak: 25,
    clipping: false,
    channels: 2,
    sampleRate: 48000,
  };
  assert.equal(metersSemanticallyEqual({ source: sample }, { source: { ...sample } }), true);
  assert.equal(metersSemanticallyEqual({ source: sample }, { source: { ...sample, peak: 26 } }), false);
});
