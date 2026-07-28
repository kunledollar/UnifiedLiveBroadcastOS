import { pluginDashboardDescriptors } from '../plugins/plugin-fixtures';

export function PluginPanel() {
  return (
    <div className="space-y-ubos-2">
      <header className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-3">
        <h3 className="font-semibold text-ubos-fg-primary">Plugin Console</h3>
        <p className="mt-1 text-xs text-ubos-fg-muted">
          Installed plugins, enabled lifecycle state, health, version, dependencies, and extension
          points.
        </p>
      </header>
      {pluginDashboardDescriptors.map((plugin) => (
        <article
          key={plugin.manifest.id}
          className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-3 text-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium text-ubos-fg-primary">
                {plugin.manifest.metadata.name}
              </div>
              <div className="text-xs text-ubos-fg-muted">
                v{plugin.manifest.version} · {plugin.manifest.id}
              </div>
            </div>
            <span className="rounded-full bg-ubos-selection-muted px-2 py-0.5 text-[10px] uppercase text-ubos-selection-text">
              {plugin.lifecycle}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Info label="Health" value={plugin.health.status} />
            <Info
              label="Dependencies"
              value={
                plugin.manifest.dependencies.map((dependency) => dependency.pluginId).join(', ') ||
                'None'
              }
            />
            <Info
              label="Extension Points"
              value={plugin.manifest.capabilities
                .map((capability) => capability.extensionPoint)
                .join(', ')}
            />
            <Info label="Capabilities" value={plugin.manifest.capabilities.length.toString()} />
          </dl>
        </article>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="uppercase text-ubos-fg-muted">{label}</dt>
      <dd className="mt-0.5 text-ubos-fg-secondary">{value}</dd>
    </div>
  );
}
