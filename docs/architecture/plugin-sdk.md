# UBOS Plugin SDK and Extension Framework

Phase 29 introduces a metadata-first plugin SDK for UBOS. Plugins describe what they add to the broadcast operating system, but they do not load or execute third-party code.

## Plugin architecture

The SDK lives in `packages/shared/src/plugin-sdk/` and centers on `PluginManifest`, `PluginDescriptor`, `PluginRegistry`, `PluginValidator`, and `PluginManager`. A manifest can register metadata for commands, menus, panels, workspaces, themes, assets, templates, device drivers, graphics packages, automations, AI providers, events, hooks, and extension points.

All runtimes are deterministic. `PluginRuntime.kind` must be `metadata-only`, and runtime handles are validated to reject dynamic imports, eval, Function constructors, Node VM references, WASM, DLLs, native code, npm installation, browser APIs, and remote downloads.

## Registration lifecycle

Plugins move through these lifecycle states:

- Installed
- Registered
- Enabled
- Disabled
- Loading
- Running
- Stopped
- Failed
- Updating
- Uninstalled

`PluginRegistry.register` validates a manifest, rejects duplicate IDs, indexes extension points, and checks dependency cycles. `PluginManager` provides deterministic install, enable, disable, start, and stop transitions.

## Capabilities

Capabilities describe what a plugin contributes and where it integrates. Categories include graphics, audio, media, replay, recording, streaming, automation, AI, analytics, monitoring, device driver, protocol, layout, theme, workspace, output, input, overlay, scoreboard, lower third, social, chat, cloud, and utility.

## Permissions

Permissions are explicit metadata records with an ID, scope, reason, and required flag. They are not runtime grants and do not permit code execution. The validator requires every permission to include both a scope and reason so operators can inspect why a plugin needs metadata access.

## Extension points

Supported extension points are Control Room, Operations Console, Production Engine, Media Runtime, Audio Runtime, Graphics Runtime, Rendering Runtime, Cluster Runtime, Monitoring Runtime, Recording Runtime, Automation Runtime, AI Runtime, Distribution Runtime, Security Runtime, and Device Runtime.

The registry exports extension-point indexes so the Control Room plugin workspace and Operations Console Plugin tab can show where installed plugins integrate.

## Dependency resolution

Dependencies are declared by plugin ID and optional version range. Required dependencies must be present during resolution. The registry walks dependency metadata and rejects circular dependency graphs.

## Future marketplace

The Plugin Marketplace panel is metadata only. Phase 29 does not implement a marketplace backend, remote plugin downloads, package installation, or dynamic loading.

## Future signed plugins

Future phases can add signature metadata and trust policy validation to manifests. Signature checks should remain deterministic and separate from code execution.

## Future sandbox execution

Future sandbox execution is explicitly out of scope for Phase 29. Any future runtime must be designed as a separate security architecture and must not weaken the metadata-only guarantees introduced here.
