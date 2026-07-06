# Phase 2.21 – Plugin & Extension SDK

UBOS 2.21 adds a secure, backend-independent plugin architecture for extending the application without changing core runtime code. The SDK is declarative: plugins register capabilities, UI panels, providers, commands, events, and settings through a signed manifest. UBOS does **not** download code, does **not** expose private runtime internals, and does **not** execute unsigned plugins.

## Deliverables

- **Plugin SDK:** `packages/shared/src/plugin-sdk/index.ts` defines the public manifest, lifecycle, registry, discovery, validation, extension, and settings types.
- **Plugin manager:** `PluginManager` coordinates install, load, enable, disable, and unload operations.
- **Manifest schema:** `PluginManifest` version `2.21` is the canonical TypeScript schema.
- **Extension registry:** `ExtensionRegistry` indexes panels, commands, source providers, output providers, graphics providers, event subscriptions, and settings namespaces.
- **Demo plugin:** `examples/plugins/lower-third-demo/ubos.plugin.json` demonstrates a signed declarative lower-third plugin.
- **Tests:** `packages/shared/src/plugin-sdk/validation.ts` validates lifecycle, security policy, compatibility, dependency resolution, discovery, and extension registration.

## Manifest format

A plugin manifest contains:

- `manifestVersion: "2.21"`
- stable plugin `id` and semantic `version`
- human-readable metadata and author information
- compatibility ranges for UBOS, SDK, and host API versions
- signing metadata (`algorithm`, `publicKeyId`, `digest`, and `signature`)
- explicit capabilities and permissions
- a sandboxed declarative runtime declaration
- optional extension contributions: panels, commands, providers, events, settings, menus, workspaces, assets, and hooks

The validator rejects malformed IDs, invalid semantic versions, missing signatures, untrusted signing keys, unknown categories, unknown extension points, missing capabilities, and settings namespaces that do not match the plugin ID.

## Lifecycle

The plugin manager supports the required Phase 2.21 lifecycle:

1. **Install** – validate and persist manifest metadata.
2. **Load** – register extensions in the host-owned `ExtensionRegistry`.
3. **Enable** – verify required dependencies and mark the plugin active.
4. **Disable** – leave metadata installed but inactive.
5. **Unload** – unregister extensions while keeping install metadata available.

The lifecycle is intentionally metadata-only. Loading a plugin registers declarations; it never imports plugin code.

## Version compatibility

`PluginCompatibility` declares:

- `ubosVersionRange`
- `sdkVersionRange`
- `minHostApi`

`PluginValidator.validate(manifest, host)` checks those values against the host and rejects incompatible plugins before install. Dependency version ranges are also enforced when resolving required dependencies.

## Sandboxed execution model

Phase 2.21 uses a **sandboxed declarative** runtime model:

- `network` must be `none`.
- `process` must be `none`.
- `filesystem` is either `none` or `plugin-settings-only`.
- `privateRuntimeInternals` must be `false`.
- `entrypoint` must be `manifest`.

The validator rejects dynamic imports, `eval`, Function constructors, Node VM references, WASM/native references, package installation handles, browser API access, HTTP(S) handles, remote code references, and native references. This provides a backend-independent security boundary and ensures plugins can extend UBOS only through public extension metadata.

## Extension registration API

`ExtensionRegistry` exposes deterministic registration for:

- Control Room panels
- Commands
- Custom source providers
- Custom output providers
- Custom graphics providers
- Event subscriptions
- Settings namespaces

`PluginRegistry.load(id)` registers all declared extensions. `PluginRegistry.unload(id)` removes them. `snapshot()` returns sorted IDs for UI and test assertions.

## Custom Control Room panels

Panels use `PluginPanel` with `component: "declarative-panel"`, layout constraints, a capability reference, and an optional workspace ID. The host owns rendering; plugins provide metadata only.

## Providers

Provider declarations describe integration points without granting runtime access:

- `PluginSourceProvider` supports camera, screen, media-file, network, and generated source kinds.
- `PluginOutputProvider` supports recording, stream, monitor, file, and transport output kinds.
- `PluginGraphicsProvider` supports lower-third, scoreboard, bug, ticker, and template graphics kinds.

Each provider includes a JSON-compatible `configSchema` so the host can render safe configuration UI.

## Event and command APIs

Commands are registered with IDs, titles, capability references, categories, and optional default shortcuts. Event subscriptions declare an event type and a safe delivery mechanism such as host-dispatched commands, settings updates, or panel notifications.

## Settings namespaces

A plugin can declare one `PluginSettingsNamespace`. Its namespace must exactly match the plugin ID. This prevents cross-plugin settings access and keeps persistence scoped to the plugin-owned keyspace.

## Discovery service

`PluginDiscoveryService` accepts locally available manifests and returns a deterministic ID-sorted scan. It performs no marketplace calls, code downloads, or package installation. Discovery validation delegates to the registry/validator so host trust policy is applied consistently.

## Demo plugin

The demo plugin at `examples/plugins/lower-third-demo/ubos.plugin.json` contributes:

- a Control Room panel
- a Take Lower Third command
- a generated source provider
- a monitor output provider
- a lower-third graphics provider
- a `program.changed` event subscription
- a plugin-scoped settings namespace

It is signed with fixture signing metadata for validation and local development only.
