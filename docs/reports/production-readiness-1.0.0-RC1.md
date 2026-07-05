# UBOS 1.0.0-RC1 Production Readiness Report

- **Release date:** 2026-07-05
- **Build number:** rc1.20260705
- **Git commit:** b5eff3e13ef1
- **Channel:** release-candidate
- **Package manager:** pnpm@10.28.1
- **Minimum Node.js:** 20.9.0

## Package Versions

| Package | Version | Manifest |
| --- | --- | --- |
| ubos | 1.0.0-rc.1 | package.json |
| @ubos/api | 1.0.0-rc.1 | apps/api/package.json |
| @ubos/web | 1.0.0-rc.1 | apps/web/package.json |
| @ubos/config | 1.0.0-rc.1 | packages/config/package.json |
| @ubos/db | 1.0.0-rc.1 | packages/db/package.json |
| @ubos/media-plane | 1.0.0-rc.1 | packages/media-plane/package.json |
| @ubos/shared | 1.0.0-rc.1 | packages/shared/package.json |
| @ubos/ui | 1.0.0-rc.1 | packages/ui/package.json |

## Validation Reports

- system-health: required for RC1 gate
- performance: required for RC1 gate
- dependency: required for RC1 gate
- memory: required for RC1 gate
- build: required for RC1 gate
- package: required for RC1 gate
- validation: required for RC1 gate
- compatibility: required for RC1 gate
- accessibility: required for RC1 gate
- production-readiness: required for RC1 gate

## Packaging Targets

- windows-msi
- macos-dmg
- linux-appimage
- linux-deb
- linux-rpm
- electron

## Release Gates

- Monorepo lint, typecheck, build, and tests must pass before promotion.
- Runtime, reducer, serializer, manifest, schema, command, event, transaction, and snapshot validations are RC blockers.
- Workspace, docking, and layout persistence remain part of the operator acceptance checklist.
- Accessibility and keyboard navigation regressions are RC blockers for Control Room workflows.
