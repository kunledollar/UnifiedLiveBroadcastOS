import { ReleaseManager, SemanticVersionManager, defaultPackagingTargets, productEditions, type BuildManifest, type ValidationChecklist } from './index.js';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

const build: BuildManifest = ReleaseManager.createBuildManifest({
  id: 'build-2.0.0-rc.1', version: '2.0.0-rc.1', channel: 'release-candidate', commit: 'metadata-only', createdAt: '2026-07-06T00:00:00.000Z',
  packages: { '@ubos/shared': '2.0.0-rc.1', ubos: '2.0.0-rc.1' }, artifacts: defaultPackagingTargets,
  environment: { node: '20.9.0', packageManager: 'pnpm@10.28.1', os: 'cross-platform' }, metadataOnly: true,
});
const checklist: ValidationChecklist = { id: 'rc-checklist', releaseVersion: '2.0.0-rc.1', items: [
  { id: 'build', title: 'Monorepo builds', category: 'build', required: true, status: 'passed', evidence: 'pnpm --filter @ubos/shared test' },
  { id: 'smoke', title: 'Smoke test plan exists', category: 'qa', required: true, status: 'passed' },
] };
const manager = new ReleaseManager(build, checklist);
const release = manager.generateReleaseManifest({ id: 'ubos-2.0.0-rc.1', product: 'UBOS', version: '2.0.0-rc.1', channel: 'release-candidate', releaseNotesId: 'notes-2.0.0-rc.1', upgradeGuideId: 'upgrade-1.x-to-2.0', validationChecklistId: checklist.id, updatePolicy: { channel: 'release-candidate', strategy: 'manual-check', allowDowngrade: false, externalInfrastructure: false }, createdAt: '2026-07-06T00:00:00.000Z' });

assert(SemanticVersionManager.compare('2.0.0-rc.1', '2.0.0') < 0, 'prerelease must sort below stable');
assert(release.editions.length === 4, 'all product editions must be represented');
assert(productEditions.every((edition) => edition.commercialImplementation === false), 'editions must not implement commercial licensing');
assert(defaultPackagingTargets.every((target) => target.metadataOnly), 'packaging targets must be metadata only');
assert(manager.validateReleaseCandidate().items.every((item) => item.status === 'passed'), 'required validation items must pass');
console.log('release engineering validation passed');
