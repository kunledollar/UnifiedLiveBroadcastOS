import type { PluginDescriptor } from '@ubos/shared';

const checkedAt = '2026-07-05T00:00:00.000Z';

export const pluginDashboardDescriptors: PluginDescriptor[] = [
  {
    manifest: {
      id: 'ubos.graphics-pack',
      version: '1.0.0',
      metadata: {
        name: 'Graphics Pack',
        description: 'Lower thirds, scoreboards, and overlay metadata.',
        tags: ['graphics', 'overlay'],
      },
      author: { name: 'UBOS' },
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
      runtime: { kind: 'metadata-only', handles: ['manifest', 'graphics-package'] },
      panels: [
        { id: 'graphics.inspector', title: 'Graphics Inspector', capabilityId: 'graphics.panels' },
      ],
      graphicsPackages: [
        { id: 'broadcast-basics', name: 'Broadcast Basics', templateIds: [], assetIds: [] },
      ],
    },
    lifecycle: 'running',
    health: { status: 'healthy', message: 'Metadata registered', checkedAt },
    metrics: { events: 18, commands: 4, panels: 1, healthChecks: 12 },
    installedAt: checkedAt,
    updatedAt: checkedAt,
  },
  {
    manifest: {
      id: 'ubos.ai-provider',
      version: '1.2.0',
      metadata: {
        name: 'AI Provider Bridge',
        description: 'AI provider and automation command metadata.',
        tags: ['ai', 'automation'],
      },
      author: { name: 'UBOS' },
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
      runtime: { kind: 'metadata-only', handles: ['manifest', 'provider-metadata'] },
      aiProviders: [
        {
          id: 'metadata-ai',
          name: 'Metadata AI',
          modelFamilies: ['planning'],
          capabilityIds: ['ai.suggestions'],
        },
      ],
    },
    lifecycle: 'enabled',
    health: { status: 'degraded', message: 'Awaiting provider configuration metadata', checkedAt },
    metrics: { events: 7, commands: 2, panels: 0, healthChecks: 5 },
    installedAt: checkedAt,
    updatedAt: checkedAt,
  },
];
