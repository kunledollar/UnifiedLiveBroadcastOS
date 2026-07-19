# Workspace Manager v2 contracts

`WorkspaceDefinition` is the canonical built-in catalog. The legacy `workspacePresets` API is a compatibility projection from that catalog, so existing layout consumers retain their stable interface without becoming a second source of configuration.

The nine immutable built-ins are Director, Technical Director, Audio Engineer, Graphics Operator, Replay Operator, Streaming Operator, Solo Streamer, Monitor Wall, and Compact. Runtime values are deliberately not defined by these contracts: status labels appear only when the owning runtime supplies a value.

Factory, Saved, and Unsaved are layout states. Save and Reset affect only layout metadata; Reset removes the saved entry for the active workspace and restores its factory contract. Lock prevents panel movement, resizing, and layout editing while leaving production controls and shortcuts available.

Built-ins are immutable. A versioned custom-workspace registry stores only normalized presentation snapshots, source references, names, and timestamps; malformed browser data is rejected safely. The Command Center applies a custom snapshot through the existing panel registry, supports rename/delete/duplicate, and returns an active deleted custom workspace to its valid source (or Director) without touching runtime production state. Runtime status contracts are resolved through an honest resolver that reports `Unavailable` unless a runtime adapter supplies a supported value.
