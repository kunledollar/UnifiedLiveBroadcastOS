import type { PluginManifest } from '../plugin-sdk/index.js';

export type ReleaseChannel = 'dev' | 'alpha' | 'beta' | 'release-candidate' | 'stable' | 'lts';
export type ProductEditionId = 'studio' | 'pro' | 'enterprise' | 'cloud';
export type InstallerPlatform = 'windows' | 'macos' | 'linux';
export type ValidationStatus = 'pending' | 'passed' | 'failed' | 'warning' | 'not-applicable';
export type LicenseMode = 'unlicensed' | 'community' | 'commercial-placeholder' | 'enterprise-placeholder';

export interface SemanticVersion { major: number; minor: number; patch: number; prerelease?: string; build?: string }
export class SemanticVersionManager {
  static parse(version: string): SemanticVersion {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/.exec(version);
    if (!match) throw new Error(`Invalid semantic version: ${version}`);
    const parsed: SemanticVersion = { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
    if (match[4]) parsed.prerelease = match[4];
    if (match[5]) parsed.build = match[5];
    return parsed;
  }
  static format(version: SemanticVersion): string {
    return `${version.major}.${version.minor}.${version.patch}${version.prerelease ? `-${version.prerelease}` : ''}${version.build ? `+${version.build}` : ''}`;
  }
  static compare(a: string, b: string): number {
    const left = SemanticVersionManager.parse(a); const right = SemanticVersionManager.parse(b);
    for (const key of ['major', 'minor', 'patch'] as const) if (left[key] !== right[key]) return left[key] - right[key];
    if (left.prerelease === right.prerelease) return 0;
    if (!left.prerelease) return 1;
    if (!right.prerelease) return -1;
    return left.prerelease.localeCompare(right.prerelease);
  }
}

export interface PackagingTarget { id: string; platform: InstallerPlatform; format: 'msi' | 'dmg' | 'pkg' | 'appimage' | 'deb' | 'rpm' | 'tar.gz'; architecture: 'x64' | 'arm64' | 'universal'; signing: 'required' | 'optional' | 'not-configured'; notarization?: 'required' | 'not-applicable' | 'not-configured'; metadataOnly: true }
export interface BuildManifest { id: string; version: string; channel: ReleaseChannel; commit: string; createdAt: string; packages: Record<string, string>; artifacts: PackagingTarget[]; environment: { node: string; packageManager: string; os: string }; metadataOnly: true }
export interface ReleaseManifest { id: string; product: 'UBOS'; version: string; channel: ReleaseChannel; buildManifestId: string; editions: ProductEditionId[]; releaseNotesId: string; upgradeGuideId: string; validationChecklistId: string; updatePolicy: AutoUpdatePolicy; createdAt: string; metadataOnly: true }
export interface AutoUpdatePolicy { channel: ReleaseChannel; feedUrl?: string; strategy: 'disabled' | 'manual-check' | 'metadata-feed'; allowDowngrade: false; externalInfrastructure: false }
export interface ValidationChecklistItem { id: string; title: string; category: 'build' | 'package' | 'runtime' | 'qa' | 'security' | 'docs' | 'compatibility' | 'release'; required: boolean; status: ValidationStatus; evidence?: string }
export interface ValidationChecklist { id: string; releaseVersion: string; items: ValidationChecklistItem[]; approvedBy?: string; approvedAt?: string }
export interface RegressionSuite { id: string; name: string; cases: Array<{ id: string; area: string; command?: string; expected: string; status: ValidationStatus }> }
export interface SmokeTestPlan { id: string; scenarios: Array<{ id: string; title: string; steps: string[]; expected: string; status: ValidationStatus }> }
export interface PluginCompatibilityValidation { pluginId: string; pluginVersion: string; hostVersion: string; sdkVersion: string; compatible: boolean; reasons: string[] }
export interface HardwareCompatibilityMetadata { id: string; vendor: string; model: string; category: 'camera' | 'capture-card' | 'audio-interface' | 'control-surface' | 'gpu' | 'encoder'; os: InstallerPlatform[]; driverVersion?: string; validationStatus: ValidationStatus; notes?: string; metadataOnly: true }
export interface DocumentationPlan { id: string; outputs: Array<{ id: string; title: string; source: string; format: 'markdown' | 'html' | 'pdf-placeholder'; generated: boolean }> }
export interface ProductEdition { id: ProductEditionId; name: string; description: string; capabilities: string[]; limits: Record<string, number | 'unlimited'>; licensing: LicenseMode; commercialImplementation: false }
export interface AboutDialogMetadata { product: 'UBOS'; version: string; edition: ProductEditionId; channel: ReleaseChannel; buildNumber: string; copyright: string; links: Record<string, string> }
export interface ReleaseNotes { id: string; version: string; highlights: string[]; fixes: string[]; knownIssues: string[]; breakingChanges: string[] }
export interface UpgradeGuide { id: string; fromVersion: string; toVersion: string; steps: string[]; rollback: string[]; compatibilityNotes: string[] }
export interface DemoReleaseWorkflow { id: string; steps: Array<{ id: string; title: string; owner: 'engineering' | 'qa' | 'docs' | 'release'; status: ValidationStatus }> }

export const productEditions: ProductEdition[] = [
  { id: 'studio', name: 'UBOS Studio', description: 'Single-operator production edition.', capabilities: ['switching', 'graphics', 'recording'], limits: { users: 1, outputs: 2, plugins: 10 }, licensing: 'commercial-placeholder', commercialImplementation: false },
  { id: 'pro', name: 'UBOS Pro', description: 'Professional production teams.', capabilities: ['multiview', 'streaming', 'hardware-metadata', 'plugin-sdk'], limits: { users: 5, outputs: 8, plugins: 50 }, licensing: 'commercial-placeholder', commercialImplementation: false },
  { id: 'enterprise', name: 'UBOS Enterprise', description: 'Organization-scale broadcast operations.', capabilities: ['collaboration', 'admin', 'audit', 'compatibility-validation'], limits: { users: 'unlimited', outputs: 'unlimited', plugins: 'unlimited' }, licensing: 'enterprise-placeholder', commercialImplementation: false },
  { id: 'cloud', name: 'UBOS Cloud', description: 'Cloud-readiness metadata edition without cloud services.', capabilities: ['cloud-metadata', 'remote-production', 'release-channels'], limits: { users: 'unlimited', outputs: 'unlimited', plugins: 'unlimited' }, licensing: 'commercial-placeholder', commercialImplementation: false },
];

export class ReleaseManager {
  constructor(private readonly build: BuildManifest, private readonly checklist: ValidationChecklist) {}
  generateReleaseManifest(input: Omit<ReleaseManifest, 'buildManifestId' | 'editions' | 'metadataOnly'>): ReleaseManifest {
    return { ...input, buildManifestId: this.build.id, editions: productEditions.map((edition) => edition.id), metadataOnly: true };
  }
  validateReleaseCandidate(): ValidationChecklist {
    const items = this.checklist.items.map((item) => ({ ...item, status: item.status === 'pending' && item.required ? 'failed' as const : item.status }));
    return { ...this.checklist, items };
  }
  validatePluginCompatibility(manifest: PluginManifest, hostVersion: string, sdkVersion: string): PluginCompatibilityValidation {
    const compatible = manifest.compatibility.minHostApi <= hostVersion && manifest.compatibility.sdkVersionRange.includes(sdkVersion.split('.')[0] ?? sdkVersion);
    return { pluginId: manifest.id, pluginVersion: manifest.version, hostVersion, sdkVersion, compatible, reasons: compatible ? ['Declared compatibility metadata accepted.'] : ['Plugin compatibility metadata does not match host metadata.'] };
  }
  static createBuildManifest(input: BuildManifest): BuildManifest { SemanticVersionManager.parse(input.version); return { ...input, metadataOnly: true }; }
}

export const defaultPackagingTargets: PackagingTarget[] = [
  { id: 'windows-msi-x64', platform: 'windows', format: 'msi', architecture: 'x64', signing: 'required', notarization: 'not-applicable', metadataOnly: true },
  { id: 'macos-dmg-universal', platform: 'macos', format: 'dmg', architecture: 'universal', signing: 'required', notarization: 'required', metadataOnly: true },
  { id: 'linux-appimage-x64', platform: 'linux', format: 'appimage', architecture: 'x64', signing: 'optional', notarization: 'not-applicable', metadataOnly: true },
  { id: 'linux-deb-x64', platform: 'linux', format: 'deb', architecture: 'x64', signing: 'optional', notarization: 'not-applicable', metadataOnly: true },
];
