import { PluginManager, PluginRegistry, PluginValidator, type PluginManifest } from './index.js';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function manifest(id: string, dependencies: string[] = []): PluginManifest {
  return {
    id,
    version: '1.0.0',
    metadata: { name: id, description: 'Metadata-only plugin fixture', tags: ['test'] },
    author: { name: 'UBOS' },
    categories: ['graphics'],
    dependencies: dependencies.map((pluginId) => ({ pluginId })),
    capabilities: [
      {
        id: `${id}.panel`,
        name: 'Panel capability',
        category: 'graphics',
        extensionPoint: 'control-room',
        description: 'Registers deterministic control-room metadata.',
      },
    ],
    permissions: [
      { id: `${id}.read`, scope: 'metadata:read', reason: 'Read plugin metadata', required: true },
    ],
    runtime: { kind: 'metadata-only', handles: ['manifest'] },
    commands: [{ id: `${id}.command`, title: 'Command', capabilityId: `${id}.panel` }],
    panels: [{ id: `${id}.panel`, title: 'Panel', capabilityId: `${id}.panel` }],
    hooks: [
      {
        id: `${id}.hook`,
        extensionPoint: 'control-room',
        capabilityId: `${id}.panel`,
        priority: 1,
      },
    ],
  };
}

const registry = new PluginRegistry();
const base = registry.register({ manifest: manifest('ubos.base'), enabled: true });
assert(base.lifecycle === 'enabled', 'Plugin registration should preserve enabled lifecycle');
registry.register({ manifest: manifest('ubos.dependent', ['ubos.base']) });
assert(
  registry.resolveDependencies('ubos.dependent').includes('ubos.base'),
  'Dependency resolution failed',
);
assert(
  registry.exportMetadata().extensionPoints['control-room']?.length === 2,
  'Extension point registration failed',
);
registry.transition('ubos.dependent', 'running');
assert(registry.get('ubos.dependent')?.lifecycle === 'running', 'Lifecycle transition failed');
registry.updateHealth('ubos.dependent', { status: 'healthy', message: 'ok' });
assert(registry.get('ubos.dependent')?.metrics.healthChecks === 1, 'Health monitoring failed');
assert(registry.serialize().includes('ubos.dependent'), 'Registry serialization failed');
assert(
  PluginValidator.validate(manifest('ubos.valid')).length === 0,
  'Capability or permission validation failed',
);
assert(
  PluginValidator.validate({
    ...manifest('ubos.bad'),
    version: '1' as PluginManifest['version'],
  }).some((error) => error.includes('semantic')),
  'Invalid semantic versions must be rejected',
);
assert(
  PluginValidator.validate({
    ...manifest('ubos.eval'),
    runtime: { kind: 'metadata-only', handles: ['eval'] },
  }).some((error) => error.includes('Unsafe')),
  'Unsafe runtime handles must be rejected',
);
let duplicateRejected = false;
try {
  registry.register({ manifest: manifest('ubos.base') });
} catch {
  duplicateRejected = true;
}
assert(duplicateRejected, 'Duplicate plugin IDs must be rejected');
const circular = new PluginRegistry();
circular.register({ manifest: manifest('ubos.a', ['ubos.b']) });
let circularRejected = false;
try {
  circular.register({ manifest: manifest('ubos.b', ['ubos.a']) });
} catch {
  circularRejected = true;
}
assert(circularRejected, 'Circular dependencies must be rejected');
const manager = new PluginManager();
manager.install(manifest('ubos.manager'));
manager.enable('ubos.manager');
manager.start('ubos.manager');
assert(
  manager.getRegistry().get('ubos.manager')?.lifecycle === 'running',
  'PluginManager lifecycle failed',
);
console.log('plugin-sdk validation passed');
