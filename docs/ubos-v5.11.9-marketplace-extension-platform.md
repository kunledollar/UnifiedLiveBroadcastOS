# UBOS v5.11.9 Marketplace, Extension Framework, SDK, Plugin Ecosystem, and Third-Party Developer Platform

## Architecture Reviewed

This phase reuses the v5.11 operational architecture: metadata-only records, explicit public package exports, bounded in-memory histories, deterministic validation, redaction by default, tenant-scoped identities, and no frame-critical execution loops.

## Package Ownership

- `@ubos/sdk` owns typed extension contracts, manifest validation, compatibility checks, capability authorization, redaction helpers, and the minimal versioned SDK client.
- `@ubos/plugin-runtime` owns installation lifecycle, service identities, sandbox limit metadata, capability-gated command execution, crash containment, health, and uninstall state.
- `@ubos/marketplace` owns listing publication, verified publisher checks, certification metadata, entitlement and offline grace decisions, reviews, suspension, and customer-safe redaction.
- `@ubos/developer-platform` owns developer organizations, verification, signing keys, extension submissions, certification transitions, publication, audit history, and publisher-safe metrics.

## Generation, Lifecycle, and Ownership

All package engines expose immutable snapshot copies. Extension manifests are validated before installation or publication. Installed extensions receive dedicated tenant-scoped service identities and only the declared capabilities explicitly granted during install. Marketplace entitlements are evaluated before installation and support temporary offline grace without interrupting active production.

## Failure Behavior

The plugin runtime records crashes as contained extension failures. Repeated crashes move the installation to `Suspended` instead of destabilizing the UBOS control plane. Command execution is rejected unless an extension is running and holds the requested tenant-scoped capability.

## Security and Redaction

Manifest validation rejects invalid IDs, invalid semantic versions, missing signed integrity, wildcard capabilities, forbidden capabilities, and incorrectly classified native plugins. SDK, marketplace, plugin-runtime, and developer-platform records redact secrets, tokens, passwords, credentials, and keys from externally visible metadata.

## Validation Results

Validation covered SDK manifests and capability gates, plugin installation and crash-loop suspension, marketplace publication and entitlement grace, developer verification and submission certification, typechecking, linting, and Git whitespace checks.

## Known Limitations

This phase provides production-safe metadata-plane foundations. It does not execute untrusted code, perform real billing, perform real package scanning, or provide a UI. Those concerns remain delegated to later product and deployment phases.

## Next-Phase Handoff

The next eligible phase is v5.11.10, focused on developer experience, documentation platform, simulation labs, certification academy, and partner program.
