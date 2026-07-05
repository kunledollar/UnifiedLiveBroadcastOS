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
  kind: 'metadata-only';
  handles: string[];
  browserApis?: string[];
  nativeReferences?: string[];
}
export interface PluginCommand {
  id: string;
  title: string;
  capabilityId: string;
  category?: PluginCategory;
}
export interface PluginMenu {
  id: string;
  label: string;
  commandIds: string[];
}
export interface PluginPanel {
  id: string;
  title: string;
  workspaceId?: string;
  capabilityId: string;
}
export interface PluginWorkspace {
  id: string;
  title: string;
  panelIds: string[];
}
export interface PluginTheme {
  id: string;
  name: string;
  tokens: Record<string, string>;
}
export interface PluginAsset {
  id: string;
  name: string;
  type: 'image' | 'font' | 'preset' | 'metadata';
  uri: string;
}
export interface PluginTemplate {
  id: string;
  name: string;
  category: PluginCategory;
  assetIds: string[];
}
export interface PluginDeviceDriver {
  id: string;
  protocol: string;
  deviceClass: string;
  capabilityIds: string[];
}
export interface PluginGraphicsPackage {
  id: string;
  name: string;
  templateIds: string[];
  assetIds: string[];
}
export interface PluginAutomation {
  id: string;
  name: string;
  trigger: string;
  commandIds: string[];
}
export interface PluginAIProvider {
  id: string;
  name: string;
  modelFamilies: string[];
  capabilityIds: string[];
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
  healthChecks: number;
}
export interface PluginEvent {
  id: string;
  pluginId: string;
  type: string;
  createdAt: string;
  metadata: Record<string, unknown>;
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
  'registered',
  'enabled',
  'disabled',
  'loading',
  'running',
  'stopped',
  'failed',
  'updating',
  'uninstalled',
] as const;
export type PluginLifecycle = (typeof pluginLifecycles)[number];
export interface PluginManifest {
  id: string;
  version: PluginVersion;
  metadata: PluginMetadata;
  author: PluginAuthor;
  categories: PluginCategory[];
  dependencies: PluginDependency[];
  capabilities: PluginCapability[];
  permissions: PluginPermission[];
  runtime: PluginRuntime;
  commands?: PluginCommand[];
  menus?: PluginMenu[];
  panels?: PluginPanel[];
  workspaces?: PluginWorkspace[];
  themes?: PluginTheme[];
  assets?: PluginAsset[];
  templates?: PluginTemplate[];
  deviceDrivers?: PluginDeviceDriver[];
  graphicsPackages?: PluginGraphicsPackage[];
  automations?: PluginAutomation[];
  aiProviders?: PluginAIProvider[];
  hooks?: PluginHook[];
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
}
export class PluginValidator {
  static validate(manifest: PluginManifest): string[] {
    const errors: string[] = [];
    if (!/^[a-z0-9][a-z0-9.-]*$/u.test(manifest.id))
      errors.push(`Invalid plugin id: ${manifest.id}`);
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(manifest.version))
      errors.push(`Invalid semantic version: ${manifest.version}`);
    if (manifest.runtime.kind !== 'metadata-only')
      errors.push('Plugin runtime must be metadata-only');
    const unsafe = [
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
    ];
    for (const handle of manifest.runtime.handles)
      if (unsafe.some((token) => handle.toLowerCase().includes(token)))
        errors.push(`Unsafe runtime handle: ${handle}`);
    for (const api of manifest.runtime.browserApis ?? [])
      errors.push(`Browser API references are not allowed: ${api}`);
    for (const ref of manifest.runtime.nativeReferences ?? [])
      errors.push(`Native code references are not allowed: ${ref}`);
    for (const category of manifest.categories)
      if (!pluginCategories.includes(category)) errors.push(`Unknown category: ${category}`);
    for (const capability of manifest.capabilities)
      if (!pluginExtensionPoints.includes(capability.extensionPoint))
        errors.push(`Unknown extension point: ${capability.extensionPoint}`);
    const capabilityIds = new Set(manifest.capabilities.map((capability) => capability.id));
    for (const command of manifest.commands ?? [])
      if (!capabilityIds.has(command.capabilityId))
        errors.push(`Command ${command.id} references missing capability ${command.capabilityId}`);
    for (const permission of manifest.permissions)
      if (!permission.scope || !permission.reason)
        errors.push(`Permission ${permission.id} must include scope and reason`);
    return errors;
  }
}
export class PluginRegistry {
  private descriptors = new Map<string, PluginDescriptor>();
  private extensionPoints = new Map<PluginExtensionPoint, Set<string>>();
  register(registration: PluginRegistration): PluginDescriptor {
    const errors = PluginValidator.validate(registration.manifest);
    if (errors.length) throw new Error(errors.join('; '));
    if (this.descriptors.has(registration.manifest.id))
      throw new Error(`Duplicate plugin id: ${registration.manifest.id}`);
    const now = new Date(0).toISOString();
    const descriptor: PluginDescriptor = {
      manifest: registration.manifest,
      lifecycle: registration.enabled ? 'enabled' : 'registered',
      health: { status: 'unknown', checkedAt: now },
      metrics: {
        events: 0,
        commands: registration.manifest.commands?.length ?? 0,
        panels: registration.manifest.panels?.length ?? 0,
        healthChecks: 0,
      },
      installedAt: now,
      updatedAt: now,
    };
    this.descriptors.set(registration.manifest.id, descriptor);
    for (const capability of registration.manifest.capabilities)
      this.addExtensionPoint(capability.extensionPoint, registration.manifest.id);
    try {
      this.assertNoCircularDependencies();
    } catch (error) {
      this.descriptors.delete(registration.manifest.id);
      throw error;
    }
    return descriptor;
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
    descriptor.updatedAt = new Date(0).toISOString();
    return descriptor;
  }
  updateHealth(id: string, health: Omit<PluginHealth, 'checkedAt'> & { checkedAt?: string }) {
    const descriptor = this.require(id);
    descriptor.health = { ...health, checkedAt: health.checkedAt ?? new Date(0).toISOString() };
    descriptor.metrics.healthChecks += 1;
    return descriptor.health;
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
          this.require(dependency.pluginId);
          if (!seen.has(dependency.pluginId)) {
            seen.add(dependency.pluginId);
            visit(dependency.pluginId);
          }
        }
    };
    visit(id);
    return [...seen];
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
    return this.registry.register({ manifest });
  }
  enable(id: string) {
    return this.registry.transition(id, 'enabled');
  }
  disable(id: string) {
    return this.registry.transition(id, 'disabled');
  }
  start(id: string) {
    this.registry.transition(id, 'loading');
    return this.registry.transition(id, 'running');
  }
  stop(id: string) {
    return this.registry.transition(id, 'stopped');
  }
  getRegistry() {
    return this.registry;
  }
}
export function createPluginContext(descriptor: PluginDescriptor): PluginContext {
  return {
    pluginId: descriptor.manifest.id,
    extensionPoints: [
      ...new Set(descriptor.manifest.capabilities.map((capability) => capability.extensionPoint)),
    ],
    capabilities: descriptor.manifest.capabilities.map((capability) => capability.id),
    permissions: descriptor.manifest.permissions.map((permission) => permission.id),
  };
}
