function equal(actual: unknown, expected: unknown): void { if (actual !== expected) throw new Error(`expected ${String(expected)}, got ${String(actual)}`); }
function notEqual(actual: unknown, expected: unknown): void { if (actual === expected) throw new Error(`did not expect ${String(expected)}`); }
function ok(value: unknown): void { if (!value) throw new Error('assertion failed'); }
function throws(fn: () => unknown, pattern: RegExp): void { try { fn(); } catch (error) { if (pattern.test(String((error as Error).message))) return; throw error; } throw new Error('expected throw'); }
import { SecurityOperationsCenter, SecurityCategory, SecuritySeverity, VulnerabilitySeverity, ThreatLevel, ContainmentActionType, DeviceTrustLevel, scoreThreat, evaluateDeviceTrust } from './index.js';

const soc = new SecurityOperationsCenter(100, 100);
soc.recordEvent({ id:'e1', timestamp:1, source:'auth', category:SecurityCategory.Authentication, severity:SecuritySeverity.High, confidence:0.9, identityId:'operator@example.com', sessionId:'secret-session', description:'repeated failed login from secret token', evidence:['token:abc'], attributes:{ ip:'10.0.0.1', secret:'abc' } });
soc.recordEvent({ id:'e2', timestamp:2, source:'auth', category:SecurityCategory.Authorization, severity:SecuritySeverity.High, confidence:0.9, identityId:'operator@example.com', description:'privilege escalation attempt', evidence:['role-change'], attributes:{} });
soc.recordEvent({ id:'e3', timestamp:3, source:'plugins', category:SecurityCategory.Plugin, severity:SecuritySeverity.Critical, confidence:0.95, deviceId:'workstation-1', description:'unsigned plugin loaded', evidence:['hash-a','hash-b'], attributes:{ pluginId:'gfx' } });
const threat = scoreThreat(soc.snapshot().events);
equal(threat.level, ThreatLevel.Critical);
const incident = soc.correlate('sec-1', 'Credential compromise and malicious plugin', ['e1','e2','e3'], 4);
equal(incident.level, ThreatLevel.Critical);
const risk = soc.evaluateIdentity('operator@example.com', 5);
ok(risk.score >= 60);
const trust = soc.registerEndpointHealth({ deviceId:'workstation-1', osHealthy:true, patchesCurrent:false, antivirusActive:true, diskEncrypted:true, secureBoot:true, firewallEnabled:true, clockSynchronized:true, certificateValid:true, malwareScanClean:false, evaluatedAt:6 });
notEqual(trust.level, DeviceTrustLevel.Trusted);
equal(evaluateDeviceTrust('unknown').level, DeviceTrustLevel.Untrusted);
const patch = soc.ingestVulnerability({ id:'vuln-1', component:'encoder-plugin', version:'1.0.0', severity:VulnerabilitySeverity.Critical, exploitability:0.9, affectedSystems:['node-a','node-b'], remediation:'upgrade to 1.0.1', patchAvailable:true, compensatingControls:['isolate plugin'], status:'open', detectedAt:7 });
equal(patch.operationalRisk, SecuritySeverity.Critical);
soc.registerContainmentPolicy({ id:'contain-critical', name:'Critical containment', minimumLevel:ThreatLevel.High, allowedActions:[ContainmentActionType.IsolatePlugin, ContainmentActionType.RequireReauthentication], requireAuthorization:true, productionContinuityRequired:true, audit:[] });
const blocked = soc.executeContainment('sec-1', 'contain-critical', ContainmentActionType.IsolatePlugin, 'gfx', 8);
equal(blocked.status, 'blocked');
const executed = soc.executeContainment('sec-1', 'contain-critical', ContainmentActionType.IsolatePlugin, 'gfx', 9, 'secops-lead');
equal(executed.status, 'executed');
soc.preserveEvidence({ id:'ev-1', incidentId:'sec-1', type:'audit', hash:'sha256:1', capturedAt:10, chainOfCustody:['secops-lead'], metadata:{ path:'/redacted' } });
throws(()=>soc.preserveEvidence({ id:'ev-1', incidentId:'sec-1', type:'audit', hash:'sha256:2', capturedAt:11, chainOfCustody:[], metadata:{} }), /immutable/);
soc.recordCompliance({ id:'mfa-1', policy:'MFA enforcement', passed:false, severity:SecuritySeverity.High, evidence:['identity-policy'], evaluatedAt:12 });
const report = soc.generateReport('report-1', 'Daily Security Summary', 13);
equal(report.activeIncidentCount, 1);
const snap = soc.snapshot();
ok(snap.health.reasons.length > 0);
equal(snap.telemetry.threatLevel, ThreatLevel.Critical);
ok(snap.events.every(e => !JSON.stringify(e).includes('abc')));
ok(snap.audit.length <= 100);
console.log('v5.11.6 security operations validation passed');
