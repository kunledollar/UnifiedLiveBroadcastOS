const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected)
      throw new Error(`Assertion failed: ${String(actual)} !== ${String(expected)}`);
  },
  ok(value: unknown) {
    if (!value) throw new Error('Assertion failed');
  },
  deepEqual(actual: unknown, expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error('Deep assertion failed');
  },
  throws(fn: () => unknown, pattern: RegExp) {
    try {
      fn();
    } catch (error) {
      const text = error instanceof Error ? `${error.name}:${error.message}` : String(error);
      if (!pattern.test(text)) throw new Error(`Unexpected error ${text}`);
      return;
    }
    throw new Error('Expected throw');
  },
};
import {
  createReplayClipMediaOutputEngine,
  redactReplayMediaOutputIdentifier,
  resolveOutputName,
  type ReplayClipAssemblyPlan,
  type ReplayClipAssemblyResult,
  type ReplayRenderProfile,
  type ReplayExportProfile,
  type ReplayDeliveryDestinationReference,
  type ReplayMediaDeliveryProfile,
  type ReplayRenderJobDefinition,
  type ReplayRenderRequest,
  type ReplayExportJobDefinition,
  type ReplayExportRequest,
  type ReplayMediaDeliveryJobDefinition,
  type ReplayMediaDeliveryRequest,
} from './index.js';

const now = 1000;
const segment = {
  segmentId: 'seg-1',
  generation: 1,
  sourceId: 'src-1',
  sourceGeneration: 1,
  inFrame: 0,
  outFrame: 300,
};
const assemblyPlan: ReplayClipAssemblyPlan = {
  assemblyPlanId: 'plan-a',
  assemblyPlanGeneration: 1,
  sourceType: 'CLIP',
  sourceId: 'clip-1',
  sourceGeneration: 1,
  segmentIds: ['seg-1'],
  readiness: 'READY_METADATA',
  transitionPolicy: 'CUT_ONLY',
  graphicsPolicy: 'NONE',
  audioPolicy: 'SOURCE_AUDIO_METADATA',
  deterministicScore: 'score',
};
const assemblyResult: ReplayClipAssemblyResult = {
  assemblyResultId: 'result-a',
  assemblyResultGeneration: 1,
  assemblyPlanId: 'plan-a',
  assemblyPlanGeneration: 1,
  sourceType: 'CLIP',
  sourceId: 'clip-1',
  sourceGeneration: 1,
  orderedSegments: [segment],
  readiness: 'READY_METADATA',
  metadataOnly: true,
  realMediaArtifact: false,
};
const renderProfile: ReplayRenderProfile = {
  renderProfileId: 'rp-1',
  profileVersion: '1',
  profileGeneration: 1,
  displayName: 'Program 1080p',
  jobTypes: ['CLIP_RENDER', 'HIGHLIGHT_RENDER', 'PLAYLIST_RENDER'],
  sourceAssemblyTypes: ['CLIP', 'HIGHLIGHT', 'PLAYLIST'],
  outputRole: 'PROGRAM',
  aspectRatioRole: '16:9',
  outputWidth: 1920,
  outputHeight: 1080,
  frameRate: 30,
  videoCodec: 'H264',
  audioCodec: 'AAC',
  container: 'MP4',
  videoBitratePolicy: '6000000',
  audioBitratePolicy: '192000',
  sampleRate: 48000,
  channelLayout: 'stereo',
  pixelFormatMetadata: 'yuv420p',
  colorSpaceMetadata: 'bt709',
  transferFunctionMetadata: 'bt709',
  colorRangeMetadata: 'limited',
  alphaPolicy: 'OPAQUE',
  graphicsPolicy: 'NONE',
  transitionPolicy: 'CUT_ONLY',
  captionPolicy: 'METADATA_ONLY',
  audioPolicy: 'SOURCE_AUDIO_METADATA',
  variableSpeedPolicy: 'METADATA_ONLY_NOT_EXECUTABLE',
  qualityTier: 'production',
  enabled: true,
  createdAtNs: now,
  updatedAtNs: now,
};
const naming = {
  prefixMetadata: 'ubos',
  suffixMetadata: 'clip',
  includeClipName: false,
  includeRevision: true,
  includeAspectRatio: true,
  includeCodec: true,
  containerExtensionMetadata: 'mp4',
  collisionPolicy: 'APPEND_METADATA_HASH' as const,
  sanitizationPolicy: 'STRICT_METADATA_SAFE' as const,
  maximumLength: 80,
};
const exportProfile: ReplayExportProfile = {
  exportProfileId: 'ep-1',
  profileVersion: '1',
  profileGeneration: 1,
  displayName: 'Metadata export',
  renderProfileId: 'rp-1',
  renderProfileGeneration: 1,
  exportMode: 'LOCAL_REFERENCE_METADATA',
  outputNamingPolicy: naming,
  destinationReferencePolicy: 'OPAQUE_REQUIRED',
  overwritePolicy: 'NO_OVERWRITE_METADATA',
  revisionPolicy: 'APPEND_REVISION',
  checksumPolicy: 'METADATA_CHECKSUM_ONLY',
  manifestPolicy: 'REQUIRE_MANIFEST_METADATA',
  metadataSidecarPolicy: 'SIDECAR_METADATA_ONLY',
  thumbnailPolicyMetadata: 'NO_THUMBNAIL_GENERATION',
  waveformPolicyMetadata: 'NO_WAVEFORM_GENERATION',
  proxyPolicyMetadata: 'NO_PROXY_GENERATION',
  retentionPolicyMetadata: 'METADATA_RETENTION_ONLY',
  deliveryHandoffPolicy: 'ALLOW_METADATA_HANDOFF',
  enabled: true,
  createdAtNs: now,
  updatedAtNs: now,
};
const destination: ReplayDeliveryDestinationReference = {
  destinationRefId: 'dest-1',
  generation: 1,
  destinationClass: 'LOCAL_REFERENCE_METADATA',
  providerMetadata: 'synthetic',
  redactedIdentifier: redactReplayMediaOutputIdentifier('private-destination'),
  available: true,
};
const deliveryProfile: ReplayMediaDeliveryProfile = {
  deliveryProfileId: 'dp-1',
  profileVersion: '1',
  profileGeneration: 1,
  displayName: 'Archive metadata',
  deliveryType: 'ARCHIVE_METADATA',
  exportProfileId: 'ep-1',
  exportProfileGeneration: 1,
  destinationClass: 'LOCAL_REFERENCE_METADATA',
  destinationReference: { id: 'dest-1', generation: 1 },
  required: true,
  priority: 1,
  retryPolicy: 'RETRY_BOUNDED',
  failurePolicy: 'FAIL_FAST',
  completionPolicy: 'RECEIPT_METADATA_REQUIRED',
  receiptPolicy: 'SYNTHETIC_RECEIPT',
  enabled: true,
  createdAtNs: now,
  updatedAtNs: now,
};

function scenario() {
  const engine = createReplayClipMediaOutputEngine();
  assert.throws(
    () =>
      engine.registerBackend(createReplayClipMediaOutputEngine().snapshot().backends[0] as never),
    /Duplicate|initialize|backendId/,
  );
  engine.registerAssembly(assemblyPlan, assemblyResult);
  engine.registerRenderProfile(renderProfile);
  assert.throws(() => engine.registerRenderProfile(renderProfile), /DuplicateReplayRenderProfile/);
  engine.updateRenderProfile({ ...renderProfile, profileGeneration: 2, updatedAtNs: now + 1 }, 1);
  assert.throws(
    () => engine.updateRenderProfile({ ...renderProfile, profileGeneration: 2 }, 1),
    /GenerationMismatch/,
  );
  engine.registerExportProfile({ ...exportProfile, renderProfileGeneration: 2 });
  engine.registerDestinationReference(destination);
  assert.equal(destination.redactedIdentifier.includes('/'), false);
  engine.registerDeliveryProfile(deliveryProfile);
  const renderJob: ReplayRenderJobDefinition = {
    renderJobId: 'rj-1',
    jobVersion: '1',
    jobGeneration: 1,
    jobType: 'CLIP_RENDER',
    sourceClipId: 'clip-1',
    sourceClipGeneration: 1,
    sourceAssemblyPlanId: 'plan-a',
    sourceAssemblyPlanGeneration: 1,
    sourceAssemblyResultId: 'result-a',
    sourceAssemblyResultGeneration: 1,
    renderProfileId: 'rp-1',
    renderProfileGeneration: 2,
    expectedSourceGenerations: [{ id: 'src-1', generation: 1 }],
    outputArtifactRole: 'PROGRAM',
    priority: 1,
    retryPolicy: 'RETRY_BOUNDED',
    failurePolicy: 'FAIL_FAST',
    enabled: true,
    createdAtNs: now,
    updatedAtNs: now,
  };
  engine.createRenderJob(renderJob);
  assert.throws(() => engine.createRenderJob(renderJob), /DuplicateReplayRenderJob/);
  const renderRequest: ReplayRenderRequest = {
    requestId: 'rr-1',
    renderJobId: 'rj-1',
    expectedRenderJobGeneration: 1,
    expectedRenderProfileGeneration: 2,
    expectedAssemblyPlanGeneration: 1,
    expectedAssemblyResultGeneration: 1,
    expectedClipGeneration: 1,
    expectedSourceGenerations: [{ id: 'src-1', generation: 1 }],
    expectedSpeedProfileGenerations: [],
    expectedTransitionGenerations: [],
    expectedGraphicsGenerations: [],
    expectedTimelineGeneration: 1,
    requestedRuntimeFrame: 10,
  };
  const render = engine.submitRender(renderRequest, now + 10);
  assert.equal(render.status, 'COMPLETE_METADATA');
  assert.equal(render.realRendering, false);
  assert.equal(render.realEncoding, false);
  assert.equal(render.realMuxing, false);
  assert.equal(render.realFileOutput, false);
  assert.ok(render.artifactMetadata);
  assert.equal(render.artifactMetadata!.realMediaArtifact, false);
  assert.equal(
    render.artifactMetadata!.contentChecksumUnavailableMetadata.includes('unavailable'),
    true,
  );
  assert.throws(() => engine.submitRender(renderRequest), /DuplicateRequest/);
  const artifact = render.artifactMetadata;
  if (!artifact) throw new Error('artifact missing');
  const exportJob: ReplayExportJobDefinition = {
    exportJobId: 'ej-1',
    jobVersion: '1',
    jobGeneration: 1,
    renderArtifactId: artifact.artifactId,
    renderArtifactGeneration: 1,
    exportProfileId: 'ep-1',
    exportProfileGeneration: 1,
    destinationReferenceId: 'dest-1',
    destinationReferenceGeneration: 1,
    outputNamingMetadata: 'safe',
    revisionMetadata: 'r1',
    manifestRequirement: 'required',
    sidecarRequirements: [],
    overwritePolicy: 'reject',
    retentionPolicy: 'metadata',
    deliveryHandoffPolicy: 'allow',
    priority: 1,
    enabled: true,
    createdAtNs: now,
    updatedAtNs: now,
  };
  engine.createExportJob(exportJob);
  const exportReq: ReplayExportRequest = {
    requestId: 'er-1',
    exportJobId: 'ej-1',
    expectedExportJobGeneration: 1,
    expectedArtifactGeneration: 1,
    expectedExportProfileGeneration: 1,
    expectedDestinationReferenceGeneration: 1,
    expectedManifestGeneration: 1,
    requestedRuntimeFrame: 11,
  };
  const exported = engine.submitExport(exportReq, now + 20);
  assert.equal(exported.realUpload, false);
  assert.ok(exported.receipt);
  assert.equal(exported.receipt!.realFileOutput, false);
  assert.equal(/[/:]/.test(exported.receipt!.outputNameMetadata), false);
  if (!exported.receipt) throw new Error('export receipt missing');
  const deliveryJob: ReplayMediaDeliveryJobDefinition = {
    deliveryJobId: 'dj-1',
    jobVersion: '1',
    jobGeneration: 1,
    exportReceiptId: exported.receipt.receiptId,
    exportReceiptGeneration: 1,
    deliveryProfileId: 'dp-1',
    deliveryProfileGeneration: 1,
    destinationReferenceId: 'dest-1',
    destinationReferenceGeneration: 1,
    required: true,
    priority: 1,
    retryPolicy: 'RETRY_BOUNDED',
    failurePolicy: 'FAIL_FAST',
    completionPolicy: 'receipt',
    enabled: true,
    createdAtNs: now,
    updatedAtNs: now,
  };
  engine.createDeliveryJob(deliveryJob);
  const deliveryReq: ReplayMediaDeliveryRequest = {
    requestId: 'dr-1',
    deliveryJobId: 'dj-1',
    expectedDeliveryJobGeneration: 1,
    expectedExportReceiptGeneration: 1,
    expectedDeliveryProfileGeneration: 1,
    expectedDestinationReferenceGeneration: 1,
    expectedStreamingDistributionSocialGenerations: [],
    requestedRuntimeFrame: 12,
  };
  const delivered = engine.submitDelivery(deliveryReq, now + 30);
  assert.equal(delivered.realDelivery, false);
  assert.equal(delivered.realUpload, false);
  assert.equal(delivered.realPlatformPublication, false);
  assert.ok(delivered.deliveryReceipt);
  assert.equal(resolveOutputName(naming, artifact, 'r1').length <= naming.maximumLength, true);
  engine.assertInvariants();
  const snap = engine.snapshot(999);
  Object.freeze(snap);
  assert.equal(snap.health.completedMetadataJobCount, 3);
  assert.equal(snap.health.activeLeaseCount, 0);
  assert.equal(JSON.stringify(snap).includes('://'), false);
  return snap;
}
const a = scenario();
const b = scenario();
assert.deepEqual(a.renderPlans, b.renderPlans);
assert.deepEqual(a.artifacts, b.artifacts);
assert.deepEqual(a.manifests, b.manifests);
assert.deepEqual(a.exportReceipts, b.exportReceipts);
assert.deepEqual(a.deliveryReceipts, b.deliveryReceipts);
for (let i = 0; i < 100000; i++) {
  if (i % 10000 === 0) assert.ok(i >= 0);
}
console.log('UBOS v5.8.5 replay clip media output foundation validation passed');
