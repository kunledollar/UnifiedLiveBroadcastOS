# Phase 2.24 — Release Engineering & Commercial Readiness

Phase 2.24 prepares UBOS 2.0 for Release Candidate readiness with metadata-first release engineering. It intentionally does not build installer binaries, contact payment systems, implement commercial licensing enforcement, or depend on external release infrastructure.

## Deliverables

- `ReleaseManager` for build manifest creation, release manifest generation, RC checklist validation, and plugin compatibility validation.
- Cross-platform packaging metadata for Windows MSI, macOS DMG, Linux AppImage, and Linux DEB targets.
- Semantic version parsing, formatting, and comparison.
- Product edition metadata for Studio, Pro, Enterprise, and Cloud.
- Licensing abstraction with placeholder license modes only.
- Release notes, upgrade guide, about dialog, documentation plan, smoke test, regression suite, hardware compatibility, and demo workflow models.
- Static release manifest at `release/manifests/ubos-2.0.0-rc.1.json`.
- QA metadata at `qa/release-validation-2.24.json`.

## CI/CD packaging guidance

1. Build and typecheck all packages.
2. Generate metadata-only build manifests from package versions, commit identity, target platforms, and environment metadata.
3. Validate release checklist items before promoting a build to an RC channel.
4. Attach release notes, upgrade guide, hardware compatibility metadata, plugin compatibility reports, and smoke/regression evidence to the release manifest.
5. Keep auto-update behavior abstract. RC builds use manual metadata checks and do not require a real feed service.

## Demo release workflow

1. Create `build-2.0.0-rc.1` metadata.
2. Validate smoke and regression suites.
3. Validate the demo plugin against host and SDK compatibility metadata.
4. Review hardware compatibility metadata.
5. Generate documentation outputs.
6. Generate `ubos-2.0.0-rc.1` release manifest.
7. Mark the release as RC-ready only after required checklist items are passed.
