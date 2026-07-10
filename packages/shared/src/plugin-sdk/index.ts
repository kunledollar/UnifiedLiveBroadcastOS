export type PluginVersion =
  `${number}.${number}.${number}` | `${number}.${number}.${number}-${string}`;

export interface PluginAuthor {
  name: string;
  email?: string;
  url?: string;
}
export interface PluginMetadata {
  name: string;
  description: string;
  tags: string[];
  homepage?: string;
  repository?: string;
}
export interface PluginDependency {
  pluginId: string;
  versionRange?: string;
  optional?: boolean;
}
export interface PluginCompatibility {
  ubosVersionRange: string;
  sdkVersionRange: string;
  minHostApi: PluginVersion;
}
export interface PluginSignature {
  algorithm: 'ed25519' | 'rsa-pss-sha256';
  publicKeyId: string;
  digest: string;
  signature: string;
}
export interface PluginCapability {
  id: string;
  name: string;
  category: PluginCategory;
  extensionPoint: PluginExtensionPoint;
  description: string;
}
export interface PluginPermission {
  id: string;
  scope: string;
  reason: string;
  required: boolean;
}
export interface PluginRuntime {
  kind: 'sandboxed-declarative';
  sandbox: {
    network: 'none';
    filesystem: 'none' | 'plugin-settings-only';
    process: 'none';
    privateRuntimeInternals: false;
  };
  entrypoint: 'manifest';
  handles: string[];
  browserApis?: string[];
  nativeReferences?: string[];
  remoteCode?: string[];
}
export interface PluginCommand {
  id: string;
  title: string;
  capabilityId: string;
  category?: PluginCategory;
  defaultShortcut?: string;
}
export interface PluginPanel {
  id: string;
  title: string;
  workspaceId?: string;
  capabilityId: string;
  component: 'declarative-panel';
  layout: {
    minWidth: number;
    minHeight: number;
    preferredDock: 'left' | 'right' | 'bottom' | 'modal';
  };
}
export interface PluginProvider {
  id: string;
  name: string;
  capabilityId: string;
  configSchema: Record<string, unknown>;
}
export interface PluginSourceProvider extends PluginProvider {
  sourceKinds: Array<'camera' | 'screen' | 'media-file' | 'network' | 'generated'>;
}
export interface PluginOutputProvider extends PluginProvider {
  outputKinds: Array<'recording' | 'stream' | 'monitor' | 'file' | 'transport'>;
}
export interface PluginGraphicsProvider extends PluginProvider {
  graphicsKinds: Array<'lower-third' | 'scoreboard' | 'bug' | 'ticker' | 'template'>;
}
export interface PluginEventSubscription {
  id: string;
  eventType: string;
  capabilityId: string;
  delivery: 'host-dispatched-command' | 'settings-update' | 'panel-notification';
}
export interface PluginSettingsNamespace {
  namespace: string;
  schema: Record<string, unknown>;
  defaults: Record<string, unknown>;
  encryptedKeys?: string[];
}
export interface PluginMenu {
  id: string;
  label: string;
  commandIds: string[];
}
export interface PluginWorkspace {
  id: string;
  title: string;
  panelIds: string[];
}
export interface PluginAsset {
  id: string;
  name: string;
  type: 'image' | 'font' | 'preset' | 'metadata';
  uri: string;
}
export interface PluginHook {
  id: string;
  extensionPoint: PluginExtensionPoint;
  capabilityId: string;
  priority: number;
}
export const pluginCategories = [
  'graphics',
  'audio',
  'media',
  'replay',
  'recording',
  'streaming',
  'automation',
  'ai',
  'analytics',
  'monitoring',
  'device-driver',
  'protocol',
  'layout',
  'theme',
  'workspace',
  'output',
  'input',
  'overlay',
  'scoreboard',
  'lower-third',
  'social',
  'chat',
  'cloud',
  'utility',
] as const;
export type PluginCategory = (typeof pluginCategories)[number];
export const pluginExtensionPoints = [
  'control-room',
  'operations-console',
  'production-engine',
  'media-runtime',
  'audio-runtime',
  'graphics-runtime',
  'rendering-runtime',
  'cluster-runtime',
  'monitoring-runtime',
  'recording-runtime',
  'automation-runtime',
  'ai-runtime',
  'distribution-runtime',
  'security-runtime',
  'device-runtime',
] as const;
export type PluginExtensionPoint = (typeof pluginExtensionPoints)[number];
export const pluginLifecycles = [
  'installed',
  'loaded',
  'enabled',
  'disabled',
  'unloaded',
  'failed',
] as const;
export type PluginLifecycle = (typeof pluginLifecycles)[number];
export interface PluginManifest {
  manifestVersion: '2.21';
  id: string;
  version: PluginVersion;
  metadata: PluginMetadata;
  author: PluginAuthor;
  compatibility: PluginCompatibility;
  signature: PluginSignature;
  categories: PluginCategory[];
  dependencies: PluginDependency[];
  capabilities: PluginCapability[];
  permissions: PluginPermission[];
  runtime: PluginRuntime;
  commands?: PluginCommand[];
  panels?: PluginPanel[];
  sourceProviders?: PluginSourceProvider[];
  outputProviders?: PluginOutputProvider[];
  graphicsProviders?: PluginGraphicsProvider[];
  eventSubscriptions?: PluginEventSubscription[];
  settings?: PluginSettingsNamespace;
  menus?: PluginMenu[];
  workspaces?: PluginWorkspace[];
  assets?: PluginAsset[];
  hooks?: PluginHook[];
}
export interface PluginHealth {
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  message?: string;
  checkedAt: string;
}
export interface PluginMetrics {
  events: number;
  commands: number;
  panels: number;
  providers: number;
  healthChecks: number;
}
export interface PluginDescriptor {
  manifest: PluginManifest;
  lifecycle: PluginLifecycle;
  health: PluginHealth;
  metrics: PluginMetrics;
  installedAt: string;
  updatedAt: string;
}
export interface PluginRegistration {
  manifest: PluginManifest;
  enabled?: boolean;
}
export interface PluginContext {
  pluginId: string;
  extensionPoints: PluginExtensionPoint[];
  capabilities: string[];
  permissions: string[];
  settingsNamespace?: string;
}
export interface HostCompatibility {
  ubosVersion: PluginVersion;
  sdkVersion: PluginVersion;
  hostApi: PluginVersion;
  trustedPublicKeyIds: string[];
}

const now = () => new Date(0).toISOString();
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;
function parseVersionParts(version: string) {
  const [major = 0, minor = 0, patch = 0] = version.split('-')[0]?.split('.').map(Number) ?? [
    0, 0, 0,
  ];
  return [major, minor, patch] as const;
}
function versionAtLeast(actual: string, minimum: string) {
  const actualParts = parseVersionParts(actual);
  const minimumParts = parseVersionParts(minimum);
  for (const index of [0, 1, 2] as const)
    if (actualParts[index] !== minimumParts[index]) return actualParts[index] > minimumParts[index];
  return true;
}
function rangeAllows(version: string, range: string) {
  if (range === '*' || range === version) return true;
  if (range.startsWith('>=')) return versionAtLeast(version, range.slice(2));
  if (range.startsWith('^'))
    return (
      version.split('.')[0] === range.slice(1).split('.')[0] &&
      versionAtLeast(version, range.slice(1))
    );
  return false;
}

export class PluginValidator {
  static validate(manifest: PluginManifest, host?: HostCompatibility): string[] {
    const errors: string[] = [];
    if (manifest.manifestVersion !== '2.21') errors.push('Manifest version must be 2.21');
    if (!/^[a-z0-9][a-z0-9.-]*$/u.test(manifest.id))
      errors.push(`Invalid plugin id: ${manifest.id}`);
    if (!semver.test(manifest.version))
      errors.push(`Invalid semantic version: ${manifest.version}`);
    if (!manifest.signature?.signature || !manifest.signature.publicKeyId)
      errors.push('Unsigned plugins are not allowed');
    if (manifest.runtime.kind !== 'sandboxed-declarative')
      errors.push('Plugin runtime must be sandboxed-declarative');
    if (manifest.runtime.entrypoint !== 'manifest')
      errors.push('Plugin entrypoint must be manifest');
    if (manifest.runtime.sandbox.network !== 'none')
      errors.push('Plugins cannot access the network');
    if (manifest.runtime.sandbox.process !== 'none') errors.push('Plugins cannot spawn processes');
    if (manifest.runtime.sandbox.privateRuntimeInternals !== false)
      errors.push('Plugins cannot access private runtime internals');
    for (const handle of manifest.runtime.handles)
      if (
        [
          'eval',
          'function',
          'dynamic-import',
          'import()',
          'node:vm',
          'vm',
          'wasm',
          'dll',
          'native',
          'npm-install',
          'http',
          'https',
        ].some((token) => handle.toLowerCase().includes(token))
      )
        errors.push(`Unsafe runtime handle: ${handle}`);
    for (const api of manifest.runtime.browserApis ?? [])
      errors.push(`Browser API references are not allowed: ${api}`);
    for (const ref of [
      ...(manifest.runtime.nativeReferences ?? []),
      ...(manifest.runtime.remoteCode ?? []),
    ])
      errors.push(`Executable or remote code references are not allowed: ${ref}`);
    for (const category of manifest.categories)
      if (!pluginCategories.includes(category)) errors.push(`Unknown category: ${category}`);
    const capabilityIds = new Set(manifest.capabilities.map((capability) => capability.id));
    for (const capability of manifest.capabilities)
      if (!pluginExtensionPoints.includes(capability.extensionPoint))
        errors.push(`Unknown extension point: ${capability.extensionPoint}`);
    for (const command of manifest.commands ?? [])
      if (!capabilityIds.has(command.capabilityId))
        errors.push(`Command ${command.id} references missing capability ${command.capabilityId}`);
    for (const item of [
      ...(manifest.panels ?? []),
      ...(manifest.sourceProviders ?? []),
      ...(manifest.outputProviders ?? []),
      ...(manifest.graphicsProviders ?? []),
      ...(manifest.eventSubscriptions ?? []),
    ])
      if (!capabilityIds.has(item.capabilityId))
        errors.push(`${item.id} references missing capability ${item.capabilityId}`);
    for (const permission of manifest.permissions)
      if (!permission.scope || !permission.reason)
        errors.push(`Permission ${permission.id} must include scope and reason`);
    if (manifest.settings && manifest.settings.namespace !== manifest.id)
      errors.push('Plugin settings namespace must match plugin id');
    if (host) {
      if (!rangeAllows(host.ubosVersion, manifest.compatibility.ubosVersionRange))
        errors.push(`Incompatible UBOS version: ${host.ubosVersion}`);
      if (!rangeAllows(host.sdkVersion, manifest.compatibility.sdkVersionRange))
        errors.push(`Incompatible SDK version: ${host.sdkVersion}`);
      if (!versionAtLeast(host.hostApi, manifest.compatibility.minHostApi))
        errors.push(`Host API ${host.hostApi} is below ${manifest.compatibility.minHostApi}`);
      if (!host.trustedPublicKeyIds.includes(manifest.signature.publicKeyId))
        errors.push(`Untrusted plugin signing key: ${manifest.signature.publicKeyId}`);
    }
    return errors;
  }
}

export class ExtensionRegistry {
  readonly panels = new Map<string, PluginPanel>();
  readonly commands = new Map<string, PluginCommand>();
  readonly sourceProviders = new Map<string, PluginSourceProvider>();
  readonly outputProviders = new Map<string, PluginOutputProvider>();
  readonly graphicsProviders = new Map<string, PluginGraphicsProvider>();
  readonly eventSubscriptions = new Map<string, PluginEventSubscription>();
  readonly settings = new Map<string, PluginSettingsNamespace>();
  register(manifest: PluginManifest) {
    for (const p of manifest.panels ?? []) this.panels.set(p.id, p);
    for (const c of manifest.commands ?? []) this.commands.set(c.id, c);
    for (const p of manifest.sourceProviders ?? []) this.sourceProviders.set(p.id, p);
    for (const p of manifest.outputProviders ?? []) this.outputProviders.set(p.id, p);
    for (const p of manifest.graphicsProviders ?? []) this.graphicsProviders.set(p.id, p);
    for (const e of manifest.eventSubscriptions ?? []) this.eventSubscriptions.set(e.id, e);
    if (manifest.settings) this.settings.set(manifest.settings.namespace, manifest.settings);
  }
  unregister(manifest: PluginManifest) {
    for (const p of manifest.panels ?? []) this.panels.delete(p.id);
    for (const c of manifest.commands ?? []) this.commands.delete(c.id);
    for (const p of manifest.sourceProviders ?? []) this.sourceProviders.delete(p.id);
    for (const p of manifest.outputProviders ?? []) this.outputProviders.delete(p.id);
    for (const p of manifest.graphicsProviders ?? []) this.graphicsProviders.delete(p.id);
    for (const e of manifest.eventSubscriptions ?? []) this.eventSubscriptions.delete(e.id);
    if (manifest.settings) this.settings.delete(manifest.settings.namespace);
  }
  snapshot() {
    return {
      panels: [...this.panels.keys()].sort(),
      commands: [...this.commands.keys()].sort(),
      sourceProviders: [...this.sourceProviders.keys()].sort(),
      outputProviders: [...this.outputProviders.keys()].sort(),
      graphicsProviders: [...this.graphicsProviders.keys()].sort(),
      eventSubscriptions: [...this.eventSubscriptions.keys()].sort(),
      settingsNamespaces: [...this.settings.keys()].sort(),
    };
  }
}

export class PluginRegistry {
  private descriptors = new Map<string, PluginDescriptor>();
  private extensionPoints = new Map<PluginExtensionPoint, Set<string>>();
  readonly extensions = new ExtensionRegistry();
  constructor(private readonly host?: HostCompatibility) {}
  install(manifest: PluginManifest) {
    return this.add(manifest, 'installed');
  }
  load(id: string) {
    const descriptor = this.transition(id, 'loaded');
    this.extensions.register(descriptor.manifest);
    return descriptor;
  }
  enable(id: string) {
    this.resolveDependencies(id);
    return this.transition(id, 'enabled');
  }
  disable(id: string) {
    return this.transition(id, 'disabled');
  }
  unload(id: string) {
    const descriptor = this.transition(id, 'unloaded');
    this.extensions.unregister(descriptor.manifest);
    return descriptor;
  }
  register(registration: PluginRegistration) {
    const descriptor = this.install(registration.manifest);
    if (registration.enabled) {
      this.load(descriptor.manifest.id);
      this.enable(descriptor.manifest.id);
    }
    return this.require(descriptor.manifest.id);
  }
  list() {
    return [...this.descriptors.values()];
  }
  get(id: string) {
    return this.descriptors.get(id);
  }
  transition(id: string, lifecycle: PluginLifecycle) {
    const descriptor = this.require(id);
    descriptor.lifecycle = lifecycle;
    descriptor.updatedAt = now();
    return descriptor;
  }
  updateHealth(id: string, health: Omit<PluginHealth, 'checkedAt'> & { checkedAt?: string }) {
    const descriptor = this.require(id);
    descriptor.health = { ...health, checkedAt: health.checkedAt ?? now() };
    descriptor.metrics.healthChecks += 1;
    return descriptor.health;
  }
  discover(manifests: PluginManifest[]) {
    return manifests.map((manifest) => ({
      manifest,
      errors: PluginValidator.validate(manifest, this.host),
    }));
  }
  exportMetadata() {
    return {
      plugins: this.list().map(({ manifest, lifecycle, health, metrics }) => ({
        manifest,
        lifecycle,
        health,
        metrics,
      })),
      extensionPoints: Object.fromEntries(
        [...this.extensionPoints].map(([point, ids]) => [point, [...ids].sort()]),
      ),
      extensions: this.extensions.snapshot(),
    };
  }
  serialize() {
    return JSON.stringify(this.exportMetadata(), null, 2);
  }
  resolveDependencies(id: string): string[] {
    const seen = new Set<string>();
    const visit = (pluginId: string) => {
      const descriptor = this.require(pluginId);
      for (const dependency of descriptor.manifest.dependencies)
        if (!dependency.optional) {
          const dep = this.require(dependency.pluginId);
          if (
            dependency.versionRange &&
            !rangeAllows(dep.manifest.version, dependency.versionRange)
          )
            throw new Error(
              `Dependency ${dependency.pluginId} does not satisfy ${dependency.versionRange}`,
            );
          if (!seen.has(dependency.pluginId)) {
            seen.add(dependency.pluginId);
            visit(dependency.pluginId);
          }
        }
    };
    visit(id);
    return [...seen];
  }
  private add(manifest: PluginManifest, lifecycle: PluginLifecycle) {
    const errors = PluginValidator.validate(manifest, this.host);
    if (errors.length) throw new Error(errors.join('; '));
    if (this.descriptors.has(manifest.id)) throw new Error(`Duplicate plugin id: ${manifest.id}`);
    const descriptor: PluginDescriptor = {
      manifest,
      lifecycle,
      health: { status: 'unknown', checkedAt: now() },
      metrics: {
        events: manifest.eventSubscriptions?.length ?? 0,
        commands: manifest.commands?.length ?? 0,
        panels: manifest.panels?.length ?? 0,
        providers:
          (manifest.sourceProviders?.length ?? 0) +
          (manifest.outputProviders?.length ?? 0) +
          (manifest.graphicsProviders?.length ?? 0),
        healthChecks: 0,
      },
      installedAt: now(),
      updatedAt: now(),
    };
    this.descriptors.set(manifest.id, descriptor);
    for (const capability of manifest.capabilities)
      this.addExtensionPoint(capability.extensionPoint, manifest.id);
    try {
      this.assertNoCircularDependencies();
    } catch (error) {
      this.descriptors.delete(manifest.id);
      throw error;
    }
    return descriptor;
  }
  private addExtensionPoint(point: PluginExtensionPoint, id: string) {
    const ids = this.extensionPoints.get(point) ?? new Set<string>();
    ids.add(id);
    this.extensionPoints.set(point, ids);
  }
  private require(id: string) {
    const descriptor = this.descriptors.get(id);
    if (!descriptor) throw new Error(`Unknown plugin: ${id}`);
    return descriptor;
  }
  private assertNoCircularDependencies() {
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visiting.has(id)) throw new Error(`Circular dependency detected at ${id}`);
      if (visited.has(id)) return;
      visiting.add(id);
      for (const dep of this.require(id).manifest.dependencies)
        if (this.descriptors.has(dep.pluginId)) visit(dep.pluginId);
      visiting.delete(id);
      visited.add(id);
    };
    for (const id of this.descriptors.keys()) visit(id);
  }
}
export class PluginManager {
  constructor(private readonly registry = new PluginRegistry()) {}
  install(manifest: PluginManifest) {
    return this.registry.install(manifest);
  }
  load(id: string) {
    return this.registry.load(id);
  }
  enable(id: string) {
    return this.registry.enable(id);
  }
  disable(id: string) {
    return this.registry.disable(id);
  }
  unload(id: string) {
    return this.registry.unload(id);
  }
  getRegistry() {
    return this.registry;
  }
}
export class PluginDiscoveryService {
  constructor(private readonly manifests: PluginManifest[]) {}
  scan() {
    return [...this.manifests].sort((a, b) => a.id.localeCompare(b.id));
  }
  validate(registry: PluginRegistry) {
    return registry.discover(this.scan());
  }
}
export function createPluginContext(descriptor: PluginDescriptor): PluginContext {
  const context: PluginContext = {
    pluginId: descriptor.manifest.id,
    extensionPoints: [
      ...new Set(descriptor.manifest.capabilities.map((capability) => capability.extensionPoint)),
    ],
    capabilities: descriptor.manifest.capabilities.map((capability) => capability.id),
    permissions: descriptor.manifest.permissions.map((permission) => permission.id),
  };
  if (descriptor.manifest.settings)
    context.settingsNamespace = descriptor.manifest.settings.namespace;
  return context;
}
