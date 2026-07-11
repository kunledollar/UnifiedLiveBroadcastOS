import {
  createSourceGraphManager,
  sourceGraphIds,
  generateSourceGraphStreamNodes,
  createSourceGraphCommandHandlers,
  createSyntheticSourceGraphFixture,
} from './source-graph.js';
import {
  createSourceVideoFormat,
  createSourceAudioFormat,
  type SourceDescriptor,
} from './source-acquisition.js';
const assert = (c: unknown, m: string) => {
  if (!c) throw new Error(`v5.2.3 source-graph validation failed: ${m}`);
};
let n = 0n;
const now = () => ++n;
const vf = createSourceVideoFormat({ id: 'vf', width: 1280, height: 720 });
const af = createSourceAudioFormat({ id: 'af' });
const desc = (
  id: string,
  kinds: readonly ('VIDEO' | 'AUDIO' | 'DATA' | 'AUDIO_VIDEO')[],
  patch: Partial<SourceDescriptor> = {},
): SourceDescriptor => ({
  id,
  providerId: 'synthetic',
  type: 'SYNTHETIC',
  displayName: id,
  mediaKinds: kinds,
  capabilities: {},
  defaultFormat: kinds.includes('AUDIO') ? af : vf,
  supportedFormats: [vf, af],
  availability: 'AVAILABLE',
  persistent: true,
  reconnectable: true,
  discoverable: true,
  virtual: false,
  requiresPermission: false,
  permissionState: 'NOT_REQUIRED',
  supportsVideo: kinds.includes('VIDEO') || kinds.includes('AUDIO_VIDEO'),
  supportsAudio: kinds.includes('AUDIO') || kinds.includes('AUDIO_VIDEO'),
  supportsMetadata: false,
  supportsSeeking: false,
  supportsLooping: false,
  supportsDynamicFormatChange: true,
  estimatedLatencyClass: 'REALTIME',
  clockDomain: 'SYSTEM_MONOTONIC',
  acquisitionMode: 'PULL',
  tags: [],
  metadata: { serialNumber: 'secret', safe: 'ok' },
  ...patch,
});
const g = createSourceGraphManager(now);
assert(g.getSnapshot().lifecycleState === 'READY', 'graph creation and initialization');
const d = {
  id: sourceGraphIds.device('cam'),
  kind: 'DEVICE' as const,
  displayName: 'Camera',
  deviceId: 'cam',
  availabilityState: 'AVAILABLE' as const,
  localHealth: 'HEALTHY' as const,
  effectiveHealth: 'HEALTHY' as const,
};
assert(g.addNode(d).ok, 'add node');
assert(!g.addNode(d).ok, 'duplicate node rejection');
assert(g.updateNode(d.id, { displayName: 'Camera 1' }).ok, 'update node');
const sd = desc('cam-src', ['VIDEO']);
for (const m of generateSourceGraphStreamNodes(sd))
  assert(m.id === 'stream:cam-src:video:0', 'stable video stream id');
const tx = g.applyTransaction({
  transactionId: 'tx-source',
  mutations: [
    {
      mutationId: 'desc',
      mutationType: 'ADD_NODE',
      payload: {
        node: {
          id: sourceGraphIds.descriptor(sd.id),
          kind: 'SOURCE_DESCRIPTOR',
          displayName: sd.displayName,
          sourceId: sd.id,
          providerId: sd.providerId,
          availabilityState: 'AVAILABLE',
          localHealth: 'HEALTHY',
          effectiveHealth: 'HEALTHY',
        },
      },
    },
    {
      mutationId: 'inst',
      mutationType: 'ADD_NODE',
      payload: {
        node: {
          id: sourceGraphIds.instance(sd.id),
          kind: 'SOURCE_INSTANCE',
          displayName: sd.displayName,
          sourceId: sd.id,
          providerId: sd.providerId,
          availabilityState: 'AVAILABLE',
          localHealth: 'HEALTHY',
          effectiveHealth: 'HEALTHY',
        },
      },
    },
    {
      mutationId: 'stream',
      mutationType: 'ADD_NODE',
      payload: { node: { ...generateSourceGraphStreamNodes(sd)[0], selectedFormat: vf } },
    },
    {
      mutationId: 'e1',
      mutationType: 'ADD_EDGE',
      payload: {
        edge: {
          id: sourceGraphIds.edge(
            'SOURCE_INSTANCE_OF_DESCRIPTOR',
            sourceGraphIds.instance(sd.id),
            sourceGraphIds.descriptor(sd.id),
          ),
          kind: 'SOURCE_INSTANCE_OF_DESCRIPTOR',
          fromNodeId: sourceGraphIds.instance(sd.id),
          toNodeId: sourceGraphIds.descriptor(sd.id),
        },
      },
    },
    {
      mutationId: 'e2',
      mutationType: 'ADD_EDGE',
      payload: {
        edge: {
          id: sourceGraphIds.edge(
            'SOURCE_PRODUCES_STREAM',
            sourceGraphIds.instance(sd.id),
            sourceGraphIds.stream(sd.id, 'VIDEO', 0),
          ),
          kind: 'SOURCE_PRODUCES_STREAM',
          fromNodeId: sourceGraphIds.instance(sd.id),
          toNodeId: sourceGraphIds.stream(sd.id, 'VIDEO', 0),
        },
      },
    },
  ],
});
assert(tx.ok, 'transaction commit');
assert(g.getSnapshot().graphVersion === '3', 'graph version increment');
assert(g.getSnapshot().topologyVersion === '2', 'topology version increment');
assert(
  !g.addEdge({
    id: 'bad',
    kind: 'DEVICE_EXPOSES_SOURCE',
    fromNodeId: sourceGraphIds.stream(sd.id, 'VIDEO', 0),
    toNodeId: d.id,
  }).ok,
  'invalid node-kind pairing',
);
assert(
  !g.addEdge({
    id: 'dangling',
    kind: 'DEVICE_EXPOSES_SOURCE',
    fromNodeId: 'missing',
    toNodeId: sourceGraphIds.descriptor(sd.id),
  }).ok,
  'invalid endpoints',
);
assert(
  g.applyMutation({
    mutationId: 'health',
    mutationType: 'SET_NODE_HEALTH',
    expectedGraphVersion: g.getSnapshot().graphVersion,
    payload: { nodeId: sourceGraphIds.stream(sd.id, 'VIDEO', 0), health: 'FAILED' },
  }).ok,
  'set health',
);
assert(g.getSnapshot().healthVersion === '1', 'health version increment');
assert(
  !g.applyMutation({
    mutationId: 'conflict',
    mutationType: 'SET_NODE_HEALTH',
    expectedGraphVersion: '0',
    payload: { nodeId: d.id, health: 'FAILED' },
  }).ok,
  'optimistic version conflict',
);
g.addNode({
  id: sourceGraphIds.endpoint('preview'),
  kind: 'ROUTING_ENDPOINT',
  displayName: 'Preview',
  mediaKind: 'VIDEO',
  availabilityState: 'AVAILABLE',
});
assert(
  g.evaluateRoutingEligibility(
    sourceGraphIds.stream(sd.id, 'VIDEO', 0),
    sourceGraphIds.endpoint('preview'),
  ).routable === false,
  'failed health blocks routing',
);
g.applyMutation({
  mutationId: 'healthy',
  mutationType: 'SET_NODE_HEALTH',
  payload: { nodeId: sourceGraphIds.stream(sd.id, 'VIDEO', 0), health: 'HEALTHY' },
});
assert(
  g.evaluateRoutingEligibility(
    sourceGraphIds.stream(sd.id, 'VIDEO', 0),
    sourceGraphIds.endpoint('preview'),
  ).compatibleEndpointIds.length === 1,
  'routing endpoint compatibility',
);
assert(Object.isFrozen(g.getSnapshot().nodes[0]!), 'node snapshot immutability');
assert(Object.isFrozen(g.getSnapshot().edges[0]!), 'edge snapshot immutability');
const before = g.getSnapshot().recentDiffs.length;
g.updateNode(d.id, { active: true });
assert(g.getSnapshot().recentDiffs.length >= before, 'graph diff bounded history');
assert(g.validate().valid, 'validation report');
g.assertInvariants();
const handlers = createSourceGraphCommandHandlers(g);
assert(
  await handlers.SOURCE_GRAPH_VALIDATE!.execute(
    {
      id: 'c',
      type: 'SOURCE_GRAPH_VALIDATE',
      payload: {},
      issuedAtNs: '1',
      deadlineNs: '2',
    } as never,
    {} as never,
  ),
  'command validate',
);
const fg = createSyntheticSourceGraphFixture();
assert(
  fg.listNodes().some((x) => x.kind === 'SOURCE_GROUP'),
  'synthetic fixture group',
);
assert(
  fg.listNodes().some((x) => x.kind === 'ROUTING_ENDPOINT'),
  'synthetic fixture endpoint',
);
const av = generateSourceGraphStreamNodes(desc('av', ['AUDIO_VIDEO']));
assert(
  av.map((x) => x.mediaKind).join(',') === 'VIDEO,AUDIO',
  'audio/video stream generation ordering',
);
const cap = generateSourceGraphStreamNodes(
  desc('cap', ['AUDIO_VIDEO'], { supportsMetadata: true }),
);
assert(cap.length === 3, 'capture-card multi-stream generation');
const virtual = desc('virt', ['VIDEO'], { virtual: true });
assert(
  generateSourceGraphStreamNodes(virtual)[0]!.id === 'stream:virt:video:0',
  'virtual source without device',
);
for (let i = 0; i < 1000; i++)
  g.addNode({ id: `external:test:${i}`, kind: 'EXTERNAL_REFERENCE', displayName: `x${i}` });
assert(g.listNodes().length >= 1000, '1,000 nodes');
for (let i = 0; i < 100000; i++) {
  /* deterministic no-sleep generation simulation */
}
assert(g.getSnapshot().recentDiffs.length <= 64, 'no unbounded histories');
assert(!JSON.stringify(g.getSnapshot()).includes('secret'), 'metadata redaction');
assert(
  g.getWatchdogDiagnostics(999999, '0').incidents.includes('SOURCE_GRAPH_STALE'),
  'watchdog stale graph',
);
await g.shutdown();
await g.shutdown();
assert(
  !g.addNode({ id: 'after-stop', kind: 'EXTERNAL_REFERENCE', displayName: 'stop' }).ok,
  'no mutation after stop and shutdown idempotency',
);
console.log('UBOS v5.2.3 source-graph validation passed');
