import { z } from 'zod';

export const UBOS_RELEASE_VERSION = '1.0.0-RC1' as const;
export const UBOS_RELEASE_DATE = '2026-07-05' as const;
export const UBOS_RELEASE_CHANNEL = 'release-candidate' as const;
export const UBOS_BUILD_NUMBER = 'rc1.20260705' as const;

export const ubosReleaseMetadataSchema = z.object({
  product: z.literal('UBOS'),
  version: z.literal(UBOS_RELEASE_VERSION),
  npmVersion: z.literal('1.0.0-rc.1'),
  releaseDate: z.literal(UBOS_RELEASE_DATE),
  channel: z.literal(UBOS_RELEASE_CHANNEL),
  buildNumber: z.literal(UBOS_BUILD_NUMBER),
  minimumNodeVersion: z.literal('20.9.0'),
  packageManager: z.literal('pnpm@10.28.1'),
  packages: z.record(z.string(), z.literal('1.0.0-rc.1')),
  validationReports: z.array(z.string()).min(1),
  packagingTargets: z.array(z.string()).min(1),
  readinessGates: z.record(z.string(), z.boolean()),
});

export type UbosReleaseMetadata = z.infer<typeof ubosReleaseMetadataSchema>;

export const ubosReleaseMetadata: UbosReleaseMetadata = ubosReleaseMetadataSchema.parse({
  product: 'UBOS',
  version: UBOS_RELEASE_VERSION,
  npmVersion: '1.0.0-rc.1',
  releaseDate: UBOS_RELEASE_DATE,
  channel: UBOS_RELEASE_CHANNEL,
  buildNumber: UBOS_BUILD_NUMBER,
  minimumNodeVersion: '20.9.0',
  packageManager: 'pnpm@10.28.1',
  packages: {
    ubos: '1.0.0-rc.1',
    '@ubos/api': '1.0.0-rc.1',
    '@ubos/web': '1.0.0-rc.1',
    '@ubos/config': '1.0.0-rc.1',
    '@ubos/db': '1.0.0-rc.1',
    '@ubos/media-plane': '1.0.0-rc.1',
    '@ubos/shared': '1.0.0-rc.1',
    '@ubos/ui': '1.0.0-rc.1',
  },
  validationReports: [
    'system-health',
    'performance',
    'dependency',
    'memory',
    'build',
    'package',
    'validation',
    'compatibility',
    'accessibility',
    'production-readiness',
  ],
  packagingTargets: ['windows-msi', 'macos-dmg', 'linux-appimage', 'linux-deb', 'linux-rpm', 'electron'],
  readinessGates: {
    monorepoBuild: true,
    runtimeValidation: true,
    packageDocumentation: true,
    workspacePersistence: true,
    releaseNotes: true,
    versionMetadata: true,
    productionReadinessReport: true,
  },
});

export function assertUbosReleaseMetadata(metadata: UbosReleaseMetadata = ubosReleaseMetadata) {
  return ubosReleaseMetadataSchema.parse(metadata);
}
