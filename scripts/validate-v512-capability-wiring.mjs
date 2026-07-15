import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const appRoot = join(root, 'apps/web/app');
const filesToScan = [
  'apps/web/app/control-room/menu/UbosMenuBar.tsx',
  'apps/web/app/control-room/command-center/CommandCenterTopMenu.tsx',
];
const forbiddenEnabledHrefs = [
  '/control-room/settings',
  '/control-room/streaming-runtime',
  '/control-room/compositor',
];

const failures = [];
for (const route of forbiddenEnabledHrefs) {
  const page = join(appRoot, route.replace(/^\//, ''), 'page.tsx');
  if (existsSync(page)) continue;
  for (const file of filesToScan) {
    const text = readFileSync(join(root, file), 'utf8');
    if (text.includes(`href: '${route}'`) || text.includes(`href=\"${route}\"`)) {
      failures.push(`${file} exposes missing route ${route}`);
    }
  }
}

const auditPath = join(root, 'docs/architecture/ubos-v5.12.0-capability-wiring-audit.md');
if (!existsSync(auditPath)) failures.push('missing v5.12.0 capability audit document');
else {
  const audit = readFileSync(auditPath, 'utf8');
  for (const term of ['LIVE', 'SIMULATED', 'UNAVAILABLE', 'DEAD', 'Primary vertical workflow status']) {
    if (!audit.includes(term)) failures.push(`audit missing required term: ${term}`);
  }
}

if (failures.length) {
  console.error('UBOS v5.12.0 capability wiring validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('UBOS v5.12.0 capability wiring validation passed.');
