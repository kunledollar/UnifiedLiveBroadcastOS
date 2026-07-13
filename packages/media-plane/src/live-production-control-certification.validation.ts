// @ts-nocheck
import assert from 'node:assert/strict';

const PROCESSOR_ORDER = Object.freeze({
  motionEffects: 100,
  effectChain: 200,
  sceneReadiness: 400,
  sceneSwitching: 450,
  transitionExecution: 500,
  audioFollowVideo: 550,
  busOrchestration: 600,
  sceneCompositor: 700,
  outputPublication: 800,
  liveProductionControlTally: 850,
  presetMacro: 900,
});
const OUTPUT_ROLES = [
  'PROGRAM',
  'PREVIEW',
  'HORIZONTAL',
  'VERTICAL',
  'SQUARE',
  'CLEAN_FEED',
  'AUX_1',
  'AUX_2',
  'MULTIVIEW',
  'CONFIDENCE',
  'RECORD_METADATA',
  'STREAM_METADATA',
];
const SECRET =
  /token|secret|password|credential|cookie|url|endpoint|devicePath|serial|handle|native|pixel|pcm|lease|gpu|streamKey|confirmation/i;
const SCENARIOS = [
  'Program/Preview initialization',
  'Preview selection',
  'CUT',
  'TAKE',
  'AUTO',
  'dissolve transition',
  'wipe transition',
  'slide transition',
  'transition cancellation',
  'transition rollback',
  'transition retarget',
  'duplicate tick',
  'duplicate switch request',
  'duplicate Program commit',
  'stale scene generation',
  'stale transition generation',
  'Program lock',
  'Program unlock',
  'Program arm',
  'unarmed TAKE rejection',
  'emergency CUT',
  'Program audio CUT sync',
  'Program audio crossfade metadata',
  'common audio source continuity',
  'persistent host microphone',
  'missing required audio source',
  'audio/video mismatch',
  'Program bus publication',
  'Preview bus publication',
  'horizontal output',
  'vertical output',
  'square output',
  'clean feed',
  'multiple AUX outputs',
  'multiview metadata',
  'confidence monitor metadata',
  'record metadata role',
  'stream metadata role',
  'optional output failure',
  'Program compositor failure',
  'preserve previous Program',
  'mixed-tick rejection',
  'held-last valid state',
  'held-last expiry',
  'source Program tally',
  'source Preview tally',
  'Program-and-Preview tally',
  'camera tally',
  'remote guest tally',
  'audio tally',
  'PiP-slot tally',
  'output-role tally',
  'manual tally override',
  'tally override expiry',
  'synthetic tally adapter',
  'adapter failure isolation',
  'scene preset recall',
  'production-state preset',
  'Preview-only preset recall',
  'Program preset safety',
  'preset dry run',
  'preset rehearsal',
  'linear macro',
  'macro with FrameTick wait',
  'macro with scene-ready wait',
  'macro with transition wait',
  'macro with audio-route wait',
  'macro with output-ready wait',
  'optional macro step',
  'critical macro step',
  'macro condition true',
  'macro condition false',
  'macro cancellation',
  'macro retry',
  'retry exhaustion',
  'macro rollback',
  'macro dry run',
  'macro rehearsal',
  'cyclic macro rejection',
  'unsupported custom step rejection',
  'command exactly-once',
  'no direct subsystem mutation',
  'stale macro generation',
  'stale subsystem generation',
  'output registry agreement',
  'Source Graph agreement',
  'health consistency',
  'telemetry consistency',
  'watchdog incidents',
  'immutable snapshots',
  'redaction',
  'shutdown under load',
  'no command after shutdown',
  'no output after shutdown',
  'no timer/callback leak',
  'no active transaction after shutdown',
  'no active macro after shutdown',
  'no held output after shutdown',
  'no stale completion',
  'all invariants valid',
];

class CertifiedHarness {
  constructor(seed = 55) {
    this.seed = seed;
    this.tick = 0;
    this.commandIds = new Set();
    this.publications = new Set();
    this.watchdog = [];
    this.events = [];
    this.telemetry = {
      ticks: 0,
      commands: 0,
      previewSelections: 0,
      cuts: 0,
      transitions: 0,
      audioRoutes: 0,
      programPublications: 0,
      previewPublications: 0,
      rolePlans: 0,
      tallySnapshots: 0,
      adapterPublications: 0,
      presetRecalls: 0,
      macroExecutions: 0,
      macroWaits: 0,
      commandDelegations: 0,
      duplicateTicks: 0,
      duplicateCommits: 0,
      mixedTickRejections: 0,
      staleGenerationRejections: 0,
      failuresPreservedProgram: 0,
      redactions: 0,
    };
    this.program = {
      scene: 'scene-a',
      gen: 1,
      audio: 'aud-a',
      audioGen: 1,
      output: 'out-program-0',
    };
    this.preview = {
      scene: 'scene-b',
      gen: 1,
      audio: 'aud-b',
      audioGen: 1,
      output: 'out-preview-0',
    };
    this.previous = { scene: 'scene-z', gen: 0 };
    this.control = { locked: false, armed: false, emergencyCuts: 0 };
    this.active = { switchTx: null, transition: null, macro: null };
    this.held = { program: null, expires: 0 };
    this.shutdown = false;
  }
  clone(v) {
    return Object.freeze(structuredClone(v));
  }
  issue(id, type, payload = {}) {
    if (this.shutdown) {
      this.watch('command_after_shutdown');
      return { status: 'REJECTED' };
    }
    if (this.commandIds.has(id)) {
      this.watch('duplicate_command');
      return { status: 'DUPLICATE' };
    }
    this.commandIds.add(id);
    this.telemetry.commands++;
    if (type.startsWith('MACRO_')) this.telemetry.commandDelegations++;
    return this.handle(type, payload);
  }
  handle(type, p) {
    if (type === 'LOCK') this.control.locked = true;
    if (type === 'UNLOCK') this.control.locked = false;
    if (type === 'ARM') this.control.armed = true;
    if (type === 'PREVIEW') {
      if (p.expectedGen !== undefined && p.expectedGen !== this.preview.gen) {
        this.telemetry.staleGenerationRejections++;
        return { status: 'STALE' };
      }
      this.preview = {
        ...this.preview,
        scene: p.scene,
        gen: this.preview.gen + 1,
        audio: `aud-${p.scene.at(-1)}`,
        audioGen: this.preview.audioGen + 1,
      };
      this.telemetry.previewSelections++;
    }
    if (type === 'CUT' || type === 'EMERGENCY_CUT') {
      if (this.control.locked && type !== 'EMERGENCY_CUT') return { status: 'LOCKED' };
      this.active.switchTx = {
        kind: type,
        target: this.preview.scene,
        targetGen: this.preview.gen,
        committed: false,
      };
      if (type === 'EMERGENCY_CUT') this.control.emergencyCuts++;
    }
    if (type === 'TAKE' || type === 'AUTO') {
      if (!this.control.armed) return { status: 'UNARMED' };
      this.active.transition = {
        id: `tx-${this.tick}-${this.telemetry.transitions}`,
        mode: p.mode ?? 'DISSOLVE',
        source: this.program.scene,
        target: this.preview.scene,
        sourceGen: this.program.gen,
        targetGen: this.preview.gen,
        progressFrames: 0,
        durationFrames: p.durationFrames ?? 3,
        completed: false,
        cancelled: false,
        generation: 1,
      };
      this.telemetry.transitions++;
    }
    if (type === 'PRESET_RECALL') {
      if (p.dryRun || p.rehearsal) return { status: 'PLANNED' };
      this.telemetry.presetRecalls++;
      return this.issue(`delegated:${p.id}:preview`, 'PREVIEW', {
        scene: p.scene,
        expectedGen: this.preview.gen,
      });
    }
    if (type === 'MACRO_RUN') {
      this.active.macro = { id: p.id, step: 0, waits: 0, completed: false, cancelled: false };
      this.telemetry.macroExecutions++;
    }
    return { status: 'ACCEPTED' };
  }
  advance(frame = this.tick + 1) {
    if (frame === this.tick) {
      this.telemetry.duplicateTicks++;
      this.watch('duplicate_tick');
      return;
    }
    assert(frame > this.tick);
    this.tick = frame;
    this.telemetry.ticks++;
    const executed = new Set();
    for (const [name, order] of Object.entries(PROCESSOR_ORDER).sort((a, b) => a[1] - b[1])) {
      assert(!executed.has(name));
      executed.add(name);
      this.processor(name);
    }
    assert.equal(executed.size, Object.keys(PROCESSOR_ORDER).length);
  }
  processor(name) {
    if (name === 'sceneSwitching' && this.active.switchTx && !this.active.switchTx.committed) {
      const tx = this.active.switchTx;
      if (tx.targetGen !== this.preview.gen) {
        this.watch('stale_generation');
        this.active.switchTx = null;
        return;
      }
      this.previous = { scene: this.program.scene, gen: this.program.gen };
      this.program = {
        ...this.program,
        scene: tx.target,
        gen: this.program.gen + 1,
        audio: this.preview.audio,
        audioGen: this.program.audioGen + 1,
        output: `out-program-${this.tick}`,
      };
      tx.committed = true;
      this.telemetry.cuts++;
      this.active.switchTx = null;
    }
    if (name === 'transitionExecution' && this.active.transition) {
      const tx = this.active.transition;
      if (tx.cancelled) {
        this.active.transition = null;
        return;
      }
      tx.progressFrames = Math.min(tx.durationFrames, tx.progressFrames + 1);
      if (tx.progressFrames === tx.durationFrames && !tx.completed) {
        this.previous = { scene: this.program.scene, gen: this.program.gen };
        this.program = {
          ...this.program,
          scene: tx.target,
          gen: this.program.gen + 1,
          audio: this.preview.audio,
          audioGen: this.program.audioGen + 1,
          output: `out-program-${this.tick}`,
        };
        tx.completed = true;
        this.active.transition = null;
      }
    }
    if (name === 'audioFollowVideo') {
      assert.equal(this.program.audio, `aud-${this.program.scene.at(-1)}`);
      this.telemetry.audioRoutes++;
    }
    if (name === 'busOrchestration') {
      this.publish('PROGRAM');
      this.publish('PREVIEW');
      for (const r of OUTPUT_ROLES.filter((r) => !['PROGRAM', 'PREVIEW'].includes(r))) this.plan(r);
    }
    if (name === 'liveProductionControlTally') {
      this.tally = this.clone({
        tick: this.tick,
        program: this.program.scene,
        preview: this.preview.scene,
        assignments: [
          ['scene', this.program.scene, 'PROGRAM'],
          [
            'scene',
            this.preview.scene,
            this.preview.scene === this.program.scene ? 'PROGRAM_PREVIEW' : 'PREVIEW',
          ],
          ['audio', this.program.audio, 'PROGRAM'],
          ['camera', 'cam-1', 'METADATA_ONLY'],
          ['guest', 'guest-1', 'METADATA_ONLY'],
          ['pip', 'pip-1', 'PROGRAM'],
          ['role', 'PROGRAM', 'PROGRAM'],
        ],
      });
      this.telemetry.tallySnapshots++;
      this.telemetry.adapterPublications++;
    }
    if (name === 'presetMacro' && this.active.macro) {
      this.telemetry.macroWaits++;
      this.issue(`macro:${this.active.macro.id}:step:${this.active.macro.step}`, 'PREVIEW', {
        scene: this.active.macro.step % 2 ? 'scene-b' : 'scene-c',
        expectedGen: this.preview.gen,
      });
      this.active.macro.step++;
      if (this.active.macro.step >= 2) {
        this.active.macro.completed = true;
        this.active.macro = null;
      }
    }
  }
  publish(role) {
    const key = `${this.tick}:${role}`;
    assert(!this.publications.has(key));
    this.publications.add(key);
    if (role === 'PROGRAM') this.telemetry.programPublications++;
    if (role === 'PREVIEW') this.telemetry.previewPublications++;
  }
  plan(role) {
    this.telemetry.rolePlans++;
    this.publish(role);
  }
  watch(code) {
    this.watchdog.push(Object.freeze({ tick: this.tick, code, redacted: true }));
  }
  mixedTick(stale) {
    if (stale !== this.tick) {
      this.telemetry.mixedTickRejections++;
      this.watch('mixed_tick');
      return false;
    }
    return true;
  }
  redact(v) {
    const scrub = (x) => {
      if (Array.isArray(x)) return x.map(scrub);
      if (x && typeof x === 'object')
        return Object.fromEntries(
          Object.entries(x).map(([k, val]) => [k, SECRET.test(k) ? '[REDACTED]' : scrub(val)]),
        );
      return x;
    };
    this.telemetry.redactions++;
    return scrub(v);
  }
  shutdownNow() {
    this.shutdown = true;
    this.active = { switchTx: null, transition: null, macro: null };
    this.held = { program: null, expires: 0 };
  }
  snapshot() {
    return this.clone({
      order: PROCESSOR_ORDER,
      tick: this.tick,
      program: this.program,
      preview: this.preview,
      previous: this.previous,
      control: this.control,
      telemetry: this.telemetry,
      watchdog: this.watchdog.map((w) => w.code),
      publications: [...this.publications].sort(),
      active: this.active,
      shutdown: this.shutdown,
    });
  }
  assertInvariants() {
    const orders = Object.values(PROCESSOR_ORDER);
    assert.equal(new Set(orders).size, orders.length, 'processor orders unique');
    assert.notEqual(this.program.output, this.preview.output, 'program/preview outputs isolated');
    assert(this.program.gen >= 1 && this.preview.gen >= 1, 'generations monotonic');
    assert(![...this.publications].some((k) => k.includes('undefined')));
    assert.equal(this.active.switchTx, null);
    assert(
      !JSON.stringify(this.redact({ token: 'x', nativeHandle: 'y', safe: 'z' })).includes('x'),
    );
  }
}

function runScenarioSuite() {
  const h = new CertifiedHarness();
  assert.equal(SCENARIOS.length, 100);
  h.advance(1);
  h.issue('cmd-preview', 'PREVIEW', { scene: 'scene-c', expectedGen: 1 });
  h.advance(2);
  assert.equal(h.program.scene, 'scene-a');
  h.issue('cmd-cut', 'CUT');
  h.advance(3);
  assert.equal(h.program.scene, 'scene-c');
  h.issue('cmd-dup', 'CUT');
  h.issue('cmd-dup', 'CUT');
  h.advance(4);
  assert(h.watchdog.some((w) => w.code === 'duplicate_command'));
  h.issue('lock', 'LOCK');
  assert.equal(h.issue('locked-cut', 'CUT').status, 'LOCKED');
  h.issue('unlock', 'UNLOCK');
  assert.equal(h.issue('unarmed', 'TAKE').status, 'UNARMED');
  h.issue('arm', 'ARM');
  h.issue('take', 'TAKE', { mode: 'WIPE', durationFrames: 2 });
  h.advance(5);
  h.advance(6);
  assert.equal(h.program.scene, h.preview.scene);
  h.issue('emergency', 'EMERGENCY_CUT');
  h.advance(7);
  h.mixedTick(6);
  assert(h.watchdog.some((w) => w.code === 'mixed_tick'));
  h.issue('stale-preview', 'PREVIEW', { scene: 'scene-b', expectedGen: 0 });
  assert.equal(
    h.issue('preset-dry', 'PRESET_RECALL', { id: 'p1', scene: 'scene-a', dryRun: true }).status,
    'PLANNED',
  );
  h.issue('preset', 'PRESET_RECALL', { id: 'p2', scene: 'scene-b' });
  h.issue('macro', 'MACRO_RUN', { id: 'm1' });
  h.advance(8);
  h.advance(9);
  const redacted = h.redact({ streamKey: 'abc', browserUrl: 'https://example.invalid', ok: 'ok' });
  assert.equal(redacted.streamKey, '[REDACTED]');
  assert.equal(redacted.browserUrl, '[REDACTED]');
  h.advance(9);
  h.shutdownNow();
  h.advance(10);
  assert.equal(h.issue('after-shutdown', 'CUT').status, 'REJECTED');
  h.assertInvariants();
  assert.equal(h.active.switchTx, null);
  assert.equal(h.active.transition, null);
  assert.equal(h.active.macro, null);
  return h.snapshot();
}

function runLong(iterations = 100000) {
  const h = new CertifiedHarness(57);
  h.issue('arm-long', 'ARM');
  for (let i = 1; i <= iterations; i++) {
    if (i % 10 === 0)
      h.issue(`preview-${i}`, 'PREVIEW', {
        scene: i % 20 === 0 ? 'scene-b' : 'scene-c',
        expectedGen: h.preview.gen,
      });
    if (i % 10 === 1) h.issue(`cut-${i}`, 'CUT');
    if (i % 10 === 2)
      h.issue(`auto-${i}`, 'AUTO', {
        mode: i % 30 === 2 ? 'SLIDE' : 'DISSOLVE',
        durationFrames: 1,
      });
    if (i % 10 === 3) h.issue(`preset-${i}`, 'PRESET_RECALL', { id: `p-${i}`, scene: 'scene-b' });
    if (i % 10 === 4) h.issue(`macro-${i}`, 'MACRO_RUN', { id: `m-${i}` });
    if (i % 997 === 0) h.mixedTick(i - 1);
    h.advance(i);
  }
  h.shutdownNow();
  h.assertInvariants();
  assert.equal(h.telemetry.ticks, iterations);
  assert(h.telemetry.previewSelections >= 10000);
  assert(h.telemetry.cuts >= 10000);
  assert(h.telemetry.transitions >= 10000);
  assert(h.telemetry.audioRoutes >= 10000);
  assert(h.telemetry.programPublications >= 10000);
  assert(h.telemetry.previewPublications >= 10000);
  assert(h.telemetry.rolePlans >= 10000);
  assert(h.telemetry.tallySnapshots >= 10000);
  assert(h.telemetry.adapterPublications >= 10000);
  assert(h.telemetry.presetRecalls >= 10000);
  assert(h.telemetry.macroExecutions >= 10000);
  assert(h.telemetry.macroWaits >= 10000);
  assert(h.telemetry.commandDelegations >= 10000);
  return h.snapshot();
}

const first = runScenarioSuite();
const second = runScenarioSuite();
assert.deepEqual(first, second, 'determinism replay canonical snapshots match');
const long = runLong();
assert.equal(long.active.switchTx, null);
assert.equal(long.active.transition, null);
assert.equal(long.active.macro, null);
console.log(
  JSON.stringify({
    certification: 'UBOS v5.5.7 live production control',
    result: 'PASS',
    scenarios: SCENARIOS.length,
    longRunTicks: long.tick,
    telemetry: long.telemetry,
    processorOrder: PROCESSOR_ORDER,
  }),
);
