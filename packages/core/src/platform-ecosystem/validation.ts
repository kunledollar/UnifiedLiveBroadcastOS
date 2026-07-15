import { createDefaultV511EcosystemRegistry, validateEcosystemSnapshot } from './index.js';

const registry = createDefaultV511EcosystemRegistry();
const snapshot = registry.snapshot();
const result = validateEcosystemSnapshot(snapshot);

if (!result.pass) {
  throw new Error(`v5.11.0 ecosystem validation failed: ${result.checks.join('; ')}`);
}

console.log('v5.11.0 platform ecosystem validation PASS');
console.log(result.checks.join('\n'));
