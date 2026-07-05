const developerSections = [
  [
    'API Browser',
    'Metadata catalog for REST, realtime, automation, media, routing, and administration API surfaces.',
  ],
  [
    'SDK Browser',
    'Language package inventory, generated client status, typed helper modules, and compatibility notes.',
  ],
  [
    'CLI Reference',
    'Command groups, flags, examples, and local workflow metadata for future UBOS command-line tooling.',
  ],
  [
    'Schemas',
    'Deterministic schema index for events, commands, snapshots, webhooks, manifests, and plugin descriptors.',
  ],
  [
    'Examples',
    'Curated sample recipes for broadcast automation, scene control, device routing, and output orchestration.',
  ],
  [
    'Version Manager',
    'Release channels, API versions, deprecation windows, and compatibility matrix metadata.',
  ],
];

export default function DeveloperPage() {
  return (
    <main className="min-h-screen bg-ubos-midnight px-8 py-10 text-ubos-fg-primary">
      <section className="mx-auto max-w-7xl space-y-ubos-4">
        <div className="rounded-ubos-lg border border-ubos-border-subtle bg-ubos-carbon p-ubos-4 shadow-2xl shadow-black/30">
          <p className="font-mono text-ubos-metadata font-black uppercase tracking-[0.24em] text-ubos-accent">
            UBOS Developer Platform
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-ubos-fg-primary">Developer Dashboard</h1>
          <p className="mt-3 max-w-3xl text-ubos-body leading-6 text-ubos-fg-secondary">
            Metadata-only developer surface for browsing APIs, SDKs, CLI commands, schemas, examples, and version
            compatibility. This page does not perform networking, authentication, or runtime API calls.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {developerSections.map(([title, description]) => (
            <article
              key={title}
              className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-carbon p-ubos-3 shadow-xl shadow-black/20"
            >
              <p className="text-ubos-metadata font-semibold uppercase tracking-wide text-ubos-fg-muted">
                Developer Platform
              </p>
              <h2 className="mt-2 text-ubos-title font-black text-ubos-fg-primary">{title}</h2>
              <p className="mt-2 text-ubos-body leading-6 text-ubos-fg-secondary">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
