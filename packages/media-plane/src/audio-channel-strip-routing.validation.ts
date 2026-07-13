/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
const assert = {
  ok(v: any, m = 'assert') {
    if (!v) throw new Error(m);
  },
  equal(a: any, b: any) {
    if (a !== b) throw new Error(`${a} !== ${b}`);
  },
  throws(fn: any) {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('expected throw');
  },
  deepEqual(a: any, b: any) {
    const ja = JSON.stringify(a),
      jb = JSON.stringify(b);
    if (ja !== jb) throw new Error(`${ja} !== ${jb}`);
  },
};
import {
  AUDIO_CHANNEL_STRIP_GAIN_STAGE_ORDER,
  AUDIO_CHANNEL_STRIP_OUTPUT_KEYS,
  AudioChannelStripRoutingProcessor,
  createAudioChannelStripRoutingEngine,
  createSyntheticAudioChannelStripBackend,
  dbToLinear,
  resolvePanCoefficients,
  validateRoutingGraph,
} from './audio-channel-strip-routing.js';
const endpoint = (type: string, id: string) => ({
  endpointType: type,
  endpointId: id,
  endpointGeneration: 1,
});
const edge = (id: string, s: any, d: any) => ({
  edgeId: id,
  edgeVersion: '5.6.2',
  edgeGeneration: 1,
  source: s,
  destination: d,
  tapPoint: 'POST_FADER',
  gain: 1,
  enabled: true,
  priority: 0,
  feedbackAllowed: false,
  latencyMetadata: {},
  audioFollowVideo: true,
  transitionContribution: true,
  cleanFeedEligible: true,
  metadata: {},
});
const makeEngine = () => {
  const e = createAudioChannelStripRoutingEngine({ engineId: 'test' });
  e.registerBackend(createSyntheticAudioChannelStripBackend());
  return e;
};
const req = (e: any, id = 'r1', block = 1) => ({
  requestId: id,
  runtimeFrame: String(block),
  blockSequence: block,
  samplePosition: block * 480,
  sampleCount: 480,
  inputBufferRefs: [],
  expectedStripGenerations: Object.fromEntries(
    [...e.strips.values()].map((s: any) => [s.stripId, s.stripGeneration]),
  ),
  expectedGroupGenerations: Object.fromEntries(
    [...e.groups.values()].map((g: any) => [g.groupId, g.generation]),
  ),
  expectedSendGenerations: Object.fromEntries(
    [...e.sends.values()].map((s: any) => [s.sendId, s.generation]),
  ),
  expectedRoutingGraphGeneration: e.currentGraph.graphGeneration,
  expectedAudioFollowGeneration: 1,
  expectedTransitionGeneration: 1,
  expectedMixerGeneration: 1,
  outputBusIds: ['program', 'preview', 'aux-1', 'clean-feed', 'monitor'],
  deadlineNs: '0',
  metadata: {},
});

for (let i = 1; i <= 141; i++) {
  const e = makeEngine();
  e.registerStrip({ stripId: 's1', channelId: 'c1', sourceId: 'src1', role: 'host microphone' });
  e.registerStrip({
    stripId: 's2',
    channelId: 'c2',
    sourceId: 'src2',
    role: 'guest microphone',
    panMode: 'MONO_PAN',
    pan: -1,
  });
  assert.throws(() => e.registerBackend(createSyntheticAudioChannelStripBackend()));
  assert.throws(() => e.registerStrip({ stripId: 's1', channelId: 'c', sourceId: 'x' }));
  const s1 = e.strips.get('s1');
  e.updateStrip('s1', {
    expectedGeneration: s1.stripGeneration,
    inputTrimDb: -6,
    inputTrimLinear: dbToLinear(-6),
    faderDb: -3,
    faderLinear: dbToLinear(-3),
    phaseInvert: { mode: 'ALL', channelLabels: ['L', 'R'] },
    mute: i % 25 === 0,
    solo: i % 29 === 0 ? 'SOLO_IN_PLACE' : 'NONE',
  });
  assert.throws(() => e.updateStrip('s1', { expectedGeneration: 1, mute: true }));
  assert.ok(Object.isFrozen(e.strips.get('s1')));
  assert.equal(resolvePanCoefficients('MONO_PAN', -1, 'LINEAR', 'MONO').left, 1);
  assert.ok(resolvePanCoefficients('MONO_PAN', 0, 'CONSTANT_POWER', 'MONO').left > 0.7);
  assert.throws(() => resolvePanCoefficients('MONO_PAN', 0, 'LINEAR', 'SURROUND_5_1'));
  e.registerGroup({
    groupId: 'g1',
    groupType: 'MUTE_GROUP',
    memberStripIds: ['s1'],
    masterValue: 1,
  });
  assert.throws(() =>
    e.registerGroup({ groupId: 'g1', groupType: 'SOLO_GROUP', memberStripIds: [] }),
  );
  e.registerGroup({
    groupId: 'g2',
    groupType: 'FADER_GROUP',
    memberStripIds: ['s1', 's2'],
    masterValue: 0.8,
  });
  e.registerVca({ vcaId: 'v1', memberStripIds: ['s1', 's2'], controlGain: 0.5 });
  assert.throws(() => e.registerVca({ vcaId: 'v2', memberStripIds: ['s1', 's1'] }));
  e.addSend({
    sendId: 'send1',
    sourceStripId: 's1',
    destination: endpoint('AUX_BUS', 'aux-1'),
    tapPoint: i % 2 ? 'PRE_FADER' : 'POST_MUTE',
  });
  assert.throws(() =>
    e.addSend({
      sendId: 'send2',
      sourceStripId: 's1',
      destination: endpoint('AUX_BUS', 'aux-1'),
      tapPoint: i % 2 ? 'PRE_FADER' : 'POST_MUTE',
    }),
  );
  const graph = {
    graphId: 'g',
    graphVersion: '5.6.2',
    graphGeneration: 1,
    nodes: [
      endpoint('CHANNEL_STRIP', 's1'),
      endpoint('CHANNEL_STRIP', 's2'),
      endpoint('PROGRAM_BUS', 'program'),
      endpoint('PREVIEW_BUS', 'preview'),
      endpoint('AUX_BUS', 'aux-1'),
      endpoint('CLEAN_FEED_BUS', 'clean-feed'),
      endpoint('MONITOR_BUS', 'monitor'),
    ],
    edges: [
      edge('e1', endpoint('CHANNEL_STRIP', 's1'), endpoint('PROGRAM_BUS', 'program')),
      edge('e2', endpoint('CHANNEL_STRIP', 's2'), endpoint('PREVIEW_BUS', 'preview')),
      edge('e3', endpoint('CHANNEL_STRIP', 's2'), endpoint('CLEAN_FEED_BUS', 'clean-feed')),
      edge('e4', endpoint('CHANNEL_STRIP', 's1'), endpoint('MONITOR_BUS', 'monitor')),
    ],
    cyclePolicy: 'REJECT_ALL_CYCLES',
    metadata: {},
  };
  const report = validateRoutingGraph(graph);
  assert.ok(report.valid);
  e.commitGraph(graph, 1);
  assert.throws(() =>
    e.commitGraph(
      {
        ...graph,
        edges: [
          ...graph.edges,
          edge('dup', endpoint('CHANNEL_STRIP', 's1'), endpoint('PROGRAM_BUS', 'program')),
        ],
      },
      e.currentGraph.graphGeneration,
    ),
  );
  assert.ok(
    !validateRoutingGraph({
      ...graph,
      edges: [
        edge('a', endpoint('CHANNEL_STRIP', 's1'), endpoint('SUBGROUP', 'sub')),
        edge('b', endpoint('SUBGROUP', 'sub'), endpoint('CHANNEL_STRIP', 's1')),
      ],
    }).valid,
  );
  const r = req(e, `r${i}`, i);
  const plan = e.createPlan(r);
  assert.ok(plan.operationOrder.includes('INPUT_TRIM'));
  const result = e.backend().process(plan, r);
  assert.ok(result.outputReferences.length);
  e.processedRequests.add(r.requestId);
  e.processedBlocks.add(`${r.runtimeFrame}:${r.blockSequence}`);
  assert.throws(() => e.createPlan(r));
  e.assertInvariants();
  const snap = e.snapshot();
  assert.ok(!JSON.stringify(snap).includes('payloadRef'));
  assert.ok(snap.health);
  assert.ok(snap.telemetry);
}
{
  const e1 = makeEngine();
  const e2 = makeEngine();
  for (const e of [e1, e2]) {
    e.registerStrip({ stripId: 'a', channelId: 'a', sourceId: 'a' });
    e.registerStrip({ stripId: 'b', channelId: 'b', sourceId: 'b' });
    e.commitGraph(
      {
        graphId: 'stable',
        graphVersion: '5.6.2',
        graphGeneration: 1,
        nodes: [
          endpoint('CHANNEL_STRIP', 'a'),
          endpoint('CHANNEL_STRIP', 'b'),
          endpoint('PROGRAM_BUS', 'program'),
        ],
        edges: [
          edge('z', endpoint('CHANNEL_STRIP', 'b'), endpoint('PROGRAM_BUS', 'program')),
          edge('a', endpoint('CHANNEL_STRIP', 'a'), endpoint('PROGRAM_BUS', 'program')),
        ],
        cyclePolicy: 'REJECT_ALL_CYCLES',
        metadata: {},
      },
      1,
    );
  }
  assert.deepEqual(
    e1.createPlan(req(e1, 'det', 1)).deterministicScore,
    e2.createPlan(req(e2, 'det', 1)).deterministicScore,
  );
}
{
  const e = makeEngine();
  e.registerStrip({ stripId: 'load', channelId: 'load', sourceId: 'load' });
  e.commitGraph(
    {
      graphId: 'load',
      graphVersion: '5.6.2',
      graphGeneration: 1,
      nodes: [endpoint('CHANNEL_STRIP', 'load'), endpoint('PROGRAM_BUS', 'program')],
      edges: [
        edge('load-edge', endpoint('CHANNEL_STRIP', 'load'), endpoint('PROGRAM_BUS', 'program')),
      ],
      cyclePolicy: 'REJECT_ALL_CYCLES',
      metadata: {},
    },
    1,
  );
  for (let i = 0; i < 10000; i++) e.createPlan(req(e, `p${i}`, i + 1));
  for (let i = 0; i < 10000; i++) assert.ok(validateRoutingGraph(e.currentGraph).valid);
  const processor = new AudioChannelStripRoutingProcessor(e);
  const pub: any[] = [];
  const ctx: any = {
    outputs: {
      readDependencyOutput: () => ({ generation: 1, transitionGeneration: 1 }),
      publish: (...x: any[]) => pub.push(x),
    },
  };
  for (let i = 10001; i < 11001; i++)
    processor.processTick({ frameNumber: BigInt(i), deadlineAtNs: 0n } as any, ctx);
  assert.ok(pub.some((x) => x[1] === AUDIO_CHANNEL_STRIP_OUTPUT_KEYS.processResult));
  e.shutdown();
  assert.equal(e.planCache.size, 0);
  assert.equal(e.state, 'SHUTDOWN');
  e.shutdown();
}
assert.equal(AUDIO_CHANNEL_STRIP_GAIN_STAGE_ORDER.length, 12);
console.log('UBOS v5.6.2 channel strip/audio routing validation passed');
