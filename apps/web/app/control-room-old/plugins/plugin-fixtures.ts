import type { PluginDescriptor, PluginManifest } from '@ubos/shared';

const checkedAt = '2026-07-05T00:00:00.000Z';
const compatibility = {
  ubosVersionRange: '^2.0.0-rc.1',
  sdkVersionRange: '^2.21.0',
  minHostApi: '2.0.0' as const,
};
const signature = {
  algorithm: 'ed25519' as const,
  publicKeyId: 'ubos-demo-fixtures',
  digest: 'demo-fixture-digest',
  signature: 'demo-fixture-signature',
};
const runtime = (handles: string[]): PluginManifest['runtime'] => ({
  kind: 'sandboxed-declarative',
  sandbox: {
    network: 'none',
    filesystem: 'none',
    process: 'none',
    privateRuntimeInternals: false,
  },
  entrypoint: 'manifest',
  handles,
});

export const pluginDashboardDescriptors: PluginDescriptor[] = [
  {
    manifest: {
      manifestVersion: '2.21',
      id: 'ubos.graphics-pack',
      version: '1.0.0',
      metadata: {
        name: 'Graphics Pack',
        description: 'Lower thirds, scoreboards, and overlay metadata.',
        tags: ['graphics', 'overlay'],
      },
      author: { name: 'UBOS' },
      compatibility,
      signature,
      categories: ['graphics', 'lower-third', 'scoreboard'],
      dependencies: [],
      capabilities: [
        {
          id: 'graphics.panels',
          name: 'Graphics panels',
          category: 'graphics',
          extensionPoint: 'graphics-runtime',
          description: 'Registers graphics package metadata.',
        },
      ],
      permissions: [
        {
          id: 'graphics.assets.read',
          scope: 'assets:read',
          reason: 'List packaged graphics assets.',
          required: true,
        },
      ],
      runtime: runtime(['manifest', 'graphics-package']),
      panels: [
        {
          id: 'graphics.inspector',
          title: 'Graphics Inspector',
          capabilityId: 'graphics.panels',
          component: 'declarative-panel',
          layout: { minWidth: 320, minHeight: 240, preferredDock: 'right' },
        },
      ],
      graphicsProviders: [
        {
          id: 'broadcast-basics',
          name: 'Broadcast Basics',
          capabilityId: 'graphics.panels',
          configSchema: {},
          graphicsKinds: ['lower-third', 'scoreboard', 'template'],
        },
      ],
    },
    lifecycle: 'enabled',
    health: { status: 'healthy', message: 'Metadata registered', checkedAt },
    metrics: { events: 18, commands: 4, panels: 1, providers: 1, healthChecks: 12 },
    installedAt: checkedAt,
    updatedAt: checkedAt,
  },
  {
    manifest: {
      manifestVersion: '2.21',
      id: 'ubos.ai-provider',
      version: '1.2.0',
      metadata: {
        name: 'AI Provider Bridge',
        description: 'AI provider and automation command metadata.',
        tags: ['ai', 'automation'],
      },
      author: { name: 'UBOS' },
      compatibility,
      signature,
      categories: ['ai', 'automation'],
      dependencies: [{ pluginId: 'ubos.graphics-pack' }],
      capabilities: [
        {
          id: 'ai.suggestions',
          name: 'AI suggestions',
          category: 'ai',
          extensionPoint: 'ai-runtime',
          description: 'Registers AI provider metadata.',
        },
      ],
      permissions: [
        {
          id: 'ai.metadata.read',
          scope: 'metadata:read',
          reason: 'Read production metadata for suggestions.',
          required: true,
        },
      ],
      runtime: runtime(['manifest', 'provider-metadata']),
      commands: [
        {
          id: 'ai.suggestions.request',
          title: 'Request AI suggestions',
          capabilityId: 'ai.suggestions',
          category: 'ai',
        },
      ],
    },
    lifecycle: 'enabled',
    health: { status: 'degraded', message: 'Awaiting provider configuration metadata', checkedAt },
    metrics: { events: 7, commands: 2, panels: 0, providers: 0, healthChecks: 5 },
    installedAt: checkedAt,
    updatedAt: checkedAt,
  },
];
