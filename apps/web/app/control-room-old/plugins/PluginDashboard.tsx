import { pluginDashboardDescriptors } from './plugin-fixtures';

const cards = [
  'Plugin Browser',
  'Plugin Registry',
  'Installed Plugins',
  'Plugin Inspector',
  'Capabilities',
  'Permissions',
  'Dependencies',
  'Plugin Health',
  'Plugin Metrics',
  'Plugin Events',
  'Extension Points',
  'Plugin Marketplace (metadata only)',
];

export function PluginDashboard() {
  const enabled = pluginDashboardDescriptors.filter((plugin) =>
    ['enabled', 'running'].includes(plugin.lifecycle),
  );
  const extensionPoints = new Set(
    pluginDashboardDescriptors.flatMap((plugin) =>
      plugin.manifest.capabilities.map((capability) => capability.extensionPoint),
    ),
  );
  return (
    <main className="min-h-screen bg-ubos-midnight p-6 text-ubos-fg-primary">
      <section className="mb-6 rounded-ubos-lg border border-ubos-border-subtle bg-ubos-graphite p-5">
        <p className="text-sm uppercase tracking-wide text-ubos-fg-muted">Control Room Plugins</p>
        <h1 className="mt-2 text-3xl font-semibold">Plugin Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-ubos-fg-secondary">
          Metadata-first extension management for panels, commands, devices, graphics packages,
          automation, AI providers, and runtime extension points. No dynamic code loading, eval, VM,
          or marketplace backend is used.
        </p>
      </section>
      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="Installed Plugins" value={pluginDashboardDescriptors.length} />
        <Metric label="Enabled Plugins" value={enabled.length} />
        <Metric label="Extension Points" value={extensionPoints.size} />
        <Metric label="Runtime" value="Metadata only" />
      </section>
      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card}
            className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4 text-sm font-medium"
          >
            {card}
          </div>
        ))}
      </section>
      <section className="mt-6 space-y-3">
        {pluginDashboardDescriptors.map((plugin) => (
          <article
            key={plugin.manifest.id}
            className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{plugin.manifest.metadata.name}</h2>
                <p className="text-sm text-ubos-fg-muted">
                  {plugin.manifest.id} · v{plugin.manifest.version}
                </p>
              </div>
              <span className="rounded-full bg-ubos-selection-muted px-3 py-1 text-xs uppercase">
                {plugin.lifecycle}
              </span>
            </div>
            <p className="mt-3 text-sm text-ubos-fg-secondary">
              {plugin.manifest.metadata.description}
            </p>
            <dl className="mt-4 grid gap-3 text-sm md:grid-cols-4">
              <Info label="Health" value={plugin.health.status} />
              <Info label="Dependencies" value={plugin.manifest.dependencies.length} />
              <Info label="Capabilities" value={plugin.manifest.capabilities.length} />
              <Info label="Permissions" value={plugin.manifest.permissions.length} />
            </dl>
          </article>
        ))}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-graphite p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs uppercase text-ubos-fg-muted">{label}</div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-ubos-fg-muted">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
