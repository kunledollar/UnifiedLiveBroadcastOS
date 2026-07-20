# UBOS Next Metadata Schema

`WorkspaceDefinition` is versioned, serializable data with ID, role, mission, layout, panel IDs, commands, responsive policy, and accessibility notes. `Binding` includes status (`unwired`, `prototype`, `read-only`, or `planned`), future domain, selector/command, permission, and safety. Registries contain data only—no JSX, DOM references, store references, or command dispatchers.

Migration is additive: increment `version` for incompatible metadata meaning and retain adapters at the future runtime-binding boundary.
