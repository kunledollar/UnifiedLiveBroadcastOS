import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('release/ubos-1.0.0-rc1.json', 'utf8'));
let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short=12 HEAD', { encoding: 'utf8' }).trim();
} catch {
  // Keep report generation deterministic outside git archives.
}

const packageFiles = [
  'package.json',
  'apps/api/package.json',
  'apps/web/package.json',
  'packages/config/package.json',
  'packages/db/package.json',
  'packages/media-plane/package.json',
  'packages/shared/package.json',
  'packages/ui/package.json',
];

const packages = packageFiles.map((file) => {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  return `| ${pkg.name} | ${pkg.version} | ${file} |`;
});

const report = `# UBOS ${manifest.version} Production Readiness Report

- **Release date:** ${manifest.releaseDate}
- **Build number:** ${manifest.buildNumber}
- **Git commit:** ${commit}
- **Channel:** ${manifest.channel}
- **Package manager:** ${manifest.packageManager}
- **Minimum Node.js:** ${manifest.minimumNodeVersion}

## Package Versions

| Package | Version | Manifest |
| --- | --- | --- |
${packages.join('\n')}

## Validation Reports

${manifest.reports.map((reportName) => `- ${reportName}: required for RC1 gate`).join('\n')}

## Packaging Targets

${manifest.packagingTargets.map((target) => `- ${target}`).join('\n')}

## Release Gates

- Monorepo lint, typecheck, build, and tests must pass before promotion.
- Runtime, reducer, serializer, manifest, schema, command, event, transaction, and snapshot validations are RC blockers.
- Workspace, docking, and layout persistence remain part of the operator acceptance checklist.
- Accessibility and keyboard navigation regressions are RC blockers for Control Room workflows.
`;

writeFileSync('docs/reports/production-readiness-1.0.0-RC1.md', report);
console.log('Generated docs/reports/production-readiness-1.0.0-RC1.md');
