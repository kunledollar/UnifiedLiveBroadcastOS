import {
  PluginDiscoveryService,
  PluginManager,
  PluginRegistry,
  PluginValidator,
  type HostCompatibility,
  type PluginManifest,
} from './index.js';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const host: HostCompatibility = {
  ubosVersion: '2.21.0',
  sdkVersion: '2.21.0',
  hostApi: '2.21.0',
  trustedPublicKeyIds: ['ubos-demo-key'],
};

function manifest(
  id: string,
  dependencies: Array<{ pluginId: string; versionRange?: string }> = [],
): PluginManifest {
  const capabilityId = `${id}.capability`;
  return {
    manifestVersion: '2.21',
    id,
    version: '1.0.0',
    metadata: { name: id, description: 'Sandboxed declarative plugin fixture', tags: ['test'] },
    author: { name: 'UBOS' },
    compatibility: {
      ubosVersionRange: '>=2.21.0',
      sdkVersionRange: '^2.21.0',
      minHostApi: '2.21.0',
    },
    signature: {
      algorithm: 'ed25519',
      publicKeyId: 'ubos-demo-key',
      digest: `sha256-${id}`,
      signature: `signed-${id}`,
    },
    categories: ['graphics', 'input', 'output'],
    dependencies,
    capabilities: [
      {
        id: capabilityId,
        name: 'Demo capability',
        category: 'graphics',
        extensionPoint: 'control-room',
        description: 'Registers deterministic extension metadata.',
      },
    ],
    permissions: [
      {
        id: `${id}.settings`,
        scope: 'plugin-settings:read-write',
        reason: 'Persist namespaced plugin preferences',
        required: true,
      },
    ],
    runtime: {
      kind: 'sandboxed-declarative',
      entrypoint: 'manifest',
      sandbox: {
        network: 'none',
        filesystem: 'plugin-settings-only',
        process: 'none',
        privateRuntimeInternals: false,
      },
      handles: ['manifest', 'declarative-panel'],
    },
    commands: [{ id: `${id}.command`, title: 'Command', capabilityId }],
    panels: [
      {
        id: `${id}.panel`,
        title: 'Panel',
        capabilityId,
        component: 'declarative-panel',
        layout: { minWidth: 320, minHeight: 240, preferredDock: 'right' },
      },
    ],
    sourceProviders: [
      {
        id: `${id}.source`,
        name: 'Generated Source',
        capabilityId,
        sourceKinds: ['generated'],
        configSchema: { type: 'object' },
      },
    ],
    outputProviders: [
      {
        id: `${id}.output`,
        name: 'Monitor Output',
        capabilityId,
        outputKinds: ['monitor'],
        configSchema: { type: 'object' },
      },
    ],
    graphicsProviders: [
      {
        id: `${id}.graphics`,
        name: 'Lower Thirds',
        capabilityId,
        graphicsKinds: ['lower-third'],
        configSchema: { type: 'object' },
      },
    ],
    eventSubscriptions: [
      {
        id: `${id}.events`,
        eventType: 'program.changed',
        capabilityId,
        delivery: 'panel-notification',
      },
    ],
    settings: { namespace: id, schema: { type: 'object' }, defaults: { enabled: true } },
    hooks: [{ id: `${id}.hook`, extensionPoint: 'control-room', capabilityId, priority: 1 }],
  };
}

const registry = new PluginRegistry(host);
const base = registry.register({ manifest: manifest('ubos.base'), enabled: true });
assert(base.lifecycle === 'enabled', 'Plugin registration should preserve enabled lifecycle');
registry.register({
  manifest: manifest('ubos.dependent', [{ pluginId: 'ubos.base', versionRange: '^1.0.0' }]),
});
assert(
  registry.resolveDependencies('ubos.dependent').includes('ubos.base'),
  'Dependency resolution failed',
);
registry.load('ubos.dependent');
assert(
  registry.extensions.snapshot().panels.includes('ubos.dependent.panel'),
  'Panel registration failed',
);
assert(
  registry.extensions.snapshot().sourceProviders.includes('ubos.dependent.source'),
  'Source provider registration failed',
);
assert(
  registry.extensions.snapshot().outputProviders.includes('ubos.dependent.output'),
  'Output provider registration failed',
);
assert(
  registry.extensions.snapshot().graphicsProviders.includes('ubos.dependent.graphics'),
  'Graphics provider registration failed',
);
assert(
  registry.extensions.snapshot().eventSubscriptions.includes('ubos.dependent.events'),
  'Event subscription registration failed',
);
assert(
  registry.extensions.snapshot().settingsNamespaces.includes('ubos.dependent'),
  'Settings namespace registration failed',
);
registry.enable('ubos.dependent');
assert(registry.get('ubos.dependent')?.lifecycle === 'enabled', 'Lifecycle transition failed');
registry.updateHealth('ubos.dependent', { status: 'healthy', message: 'ok' });
assert(registry.get('ubos.dependent')?.metrics.healthChecks === 1, 'Health monitoring failed');
registry.unload('ubos.dependent');
assert(
  !registry.extensions.snapshot().panels.includes('ubos.dependent.panel'),
  'Unload should unregister extensions',
);
assert(registry.serialize().includes('ubos.dependent'), 'Registry serialization failed');
assert(
  PluginValidator.validate(manifest('ubos.valid'), host).length === 0,
  'Valid manifest rejected',
);
assert(
  PluginValidator.validate(
    { ...manifest('ubos.bad'), version: '1' as PluginManifest['version'] },
    host,
  ).some((error) => error.includes('semantic')),
  'Invalid semantic versions must be rejected',
);
assert(
  PluginValidator.validate(
    {
      ...manifest('ubos.unsigned'),
      signature: { ...manifest('ubos.unsigned').signature, signature: '' },
    },
    host,
  ).some((error) => error.includes('Unsigned')),
  'Unsigned plugins must be rejected',
);
assert(
  PluginValidator.validate(
    { ...manifest('ubos.eval'), runtime: { ...manifest('ubos.eval').runtime, handles: ['eval'] } },
    host,
  ).some((error) => error.includes('Unsafe')),
  'Unsafe runtime handles must be rejected',
);
assert(
  PluginValidator.validate(
    {
      ...manifest('ubos.browser'),
      runtime: { ...manifest('ubos.browser').runtime, browserApis: ['localStorage'] },
    },
    host,
  ).some((error) => error.includes('Browser API')),
  'Browser APIs must be rejected',
);
assert(
  PluginValidator.validate(
    {
      ...manifest('ubos.old'),
      compatibility: { ...manifest('ubos.old').compatibility, minHostApi: '9.0.0' },
    },
    host,
  ).some((error) => error.includes('below')),
  'Host API compatibility must be enforced',
);
assert(
  new PluginDiscoveryService([manifest('ubos.z'), manifest('ubos.a')]).scan()[0]?.id === 'ubos.a',
  'Discovery should be deterministic',
);
let duplicateRejected = false;
try {
  registry.register({ manifest: manifest('ubos.base') });
} catch {
  duplicateRejected = true;
}
assert(duplicateRejected, 'Duplicate plugin IDs must be rejected');
const circular = new PluginRegistry(host);
circular.register({ manifest: manifest('ubos.a', [{ pluginId: 'ubos.b' }]) });
let circularRejected = false;
try {
  circular.register({ manifest: manifest('ubos.b', [{ pluginId: 'ubos.a' }]) });
} catch {
  circularRejected = true;
}
assert(circularRejected, 'Circular dependencies must be rejected');
const manager = new PluginManager(new PluginRegistry(host));
manager.install(manifest('ubos.manager'));
manager.load('ubos.manager');
manager.enable('ubos.manager');
assert(
  manager.getRegistry().get('ubos.manager')?.lifecycle === 'enabled',
  'PluginManager lifecycle failed',
);
console.log('plugin-sdk validation passed');
