function equal(actual: unknown, expected: unknown): void { if (actual !== expected) throw new Error(`expected ${String(expected)}, got ${String(actual)}`); }
function ok(value: unknown): void { if (!value) throw new Error('assertion failed'); }
function throws(fn: () => unknown, pattern: RegExp): void { try { fn(); } catch (error) { if (pattern.test(String((error as Error).message))) return; throw error; } throw new Error('expected throw'); }
import { GovernanceRiskComplianceEngine, PolicyCategory, PolicyStatus, PolicyEnforcementMode, RequirementSeverity, ControlCategory, ControlImplementationType, ControlFrequency, ControlAutomationLevel, ControlStatus, ControlTestMethod, ControlTestStatus, EvidenceType, EvidenceStatus, FrameworkStatus, MappingType, RiskCategory, RiskStatus, RiskTreatmentType, ExceptionStatus, CorrectiveActionStatus, GovernanceGateDecision, scoreRisk } from './index.js';

const grc = new GovernanceRiskComplianceEngine(1000);
grc.registerControl({ id:'recording-control', name:'Recording Control', description:'Verifies public streams are recorded', category:ControlCategory.Preventive, ownerId:'ops@example.com', implementationType:ControlImplementationType.Technical, frequency:ControlFrequency.PerProduction, automationLevel:ControlAutomationLevel.Automated, testIds:['recording-test'], evidenceSources:['recorder'], status:ControlStatus.Operating, version:1 });
grc.registerTest({ id:'recording-test', controlId:'recording-control', name:'Recording active', description:'Recording is active', method:ControlTestMethod.StateValidation, expectedResult:'active recording', failureSeverity:RequirementSeverity.Critical, enabled:true });
grc.recordTestResult({ id:'result-1', controlId:'recording-control', testId:'recording-test', status:ControlTestStatus.Passed, testedAt:10, evidenceIds:['evidence-1'], findings:[], confidence:1 });
grc.collectEvidence({ id:'evidence-1', controlId:'recording-control', type:EvidenceType.RecordingManifest, source:'s3://secret-recording', collectedAt:10, integrityHash:'sha256:abc', status:EvidenceStatus.Current, metadata:{ token:'secret' }, customerId:'cust-a' });
const policy = grc.registerPolicy({ id:'public-recording', name:'Public Stream Recording', description:'Public streams require recording', category:PolicyCategory.Recording, ownerId:'compliance@example.com', status:PolicyStatus.Approved, priority:100, applicability:{ customerIds:['cust-a'], destinationTypes:['public'] }, requirements:[{ id:'req-record', name:'Recording required', description:'Every public stream must have verified recording', controlIds:['recording-control'], severity:RequirementSeverity.Critical, required:true, exceptionAllowed:true, evidenceRequirements:[{ type:EvidenceType.RecordingManifest, maximumAgeMs:1000, minimumCount:1, integrityRequired:true }] }], enforcementMode:PolicyEnforcementMode.Block, effectiveFrom:1, version:1, createdAt:1, updatedAt:1 });
equal(policy.status, PolicyStatus.Approved);
grc.activatePolicy('public-recording', 12, 'approver@example.com');
const subject = { subjectType:'production', subjectId:'prod-1', customerId:'cust-a', destinationType:'public', attributes:{ emergency:false } };
let gate = grc.gate(subject, 20);
equal(gate.decision, GovernanceGateDecision.Allow);
const expired = grc.collectEvidence({ id:'evidence-2', controlId:'recording-control', type:EvidenceType.RecordingManifest, source:'recorder', collectedAt:1, integrityHash:'sha256:def', status:EvidenceStatus.Current });
ok(expired.id === 'evidence-2');
grc.registerControl({ id:'privacy-control', name:'Privacy Control', description:'Privacy review', category:ControlCategory.Preventive, ownerId:'privacy', implementationType:ControlImplementationType.Administrative, frequency:ControlFrequency.PerProduction, automationLevel:ControlAutomationLevel.Manual, testIds:['privacy-test'], evidenceSources:['attestation'], status:ControlStatus.Failed, version:1 });
grc.registerTest({ id:'privacy-test', controlId:'privacy-control', name:'Privacy test', description:'manual check', method:ControlTestMethod.ManualInspection, expectedResult:'approved', failureSeverity:RequirementSeverity.High, enabled:true });
grc.recordTestResult({ id:'privacy-result', controlId:'privacy-control', testId:'privacy-test', status:ControlTestStatus.Failed, testedAt:21, evidenceIds:[], findings:['missing approval'], confidence:0.8 });
grc.registerPolicy({ id:'privacy-policy', name:'Privacy Policy', description:'Privacy approval required', category:PolicyCategory.Privacy, ownerId:'privacy', status:PolicyStatus.Active, priority:90, applicability:{ customerIds:['cust-a'] }, requirements:[{ id:'req-privacy', name:'Privacy', description:'approval required', controlIds:['privacy-control'], severity:RequirementSeverity.High, required:true, exceptionAllowed:true, evidenceRequirements:[{ type:EvidenceType.ApprovalRecord, integrityRequired:true }] }], enforcementMode:PolicyEnforcementMode.RequireApproval, effectiveFrom:1, version:1, createdAt:1, updatedAt:1 });
gate = grc.gate(subject, 22);
equal(gate.decision, GovernanceGateDecision.RequireApproval);
grc.requestException({ id:'ex-1', policyId:'privacy-policy', requirementId:'req-privacy', subjectType:'production', subjectId:'prod-1', requestedBy:'producer', reason:'customer-approved rehearsal', riskScore:70, compensatingControlIds:['recording-control'], requestedAt:23, expiresAt:50, approvedBy:'compliance', status:ExceptionStatus.Active });
gate = grc.gate(subject, 24);
equal(gate.decision, GovernanceGateDecision.Allow);
equal(grc.expireExceptions(51), 1);
gate = grc.gate(subject, 52);
equal(gate.decision, GovernanceGateDecision.RequireApproval);
throws(()=>grc.requestException({ id:'bad-ex', policyId:'privacy-policy', requirementId:'req-privacy', subjectType:'production', subjectId:'prod-1', requestedBy:'same', reason:'self approval', riskScore:90, compensatingControlIds:[], requestedAt:1, expiresAt:2, approvedBy:'same', status:ExceptionStatus.Approved }), /self-approved/);
grc.registerFramework({ id:'internal-framework', name:'Internal Broadcast Controls', version:'2026', requirements:[{ id:'fw-1', reference:'REC-1', title:'Recording', description:'record public streams', controlIds:['recording-control'] }], status:FrameworkStatus.Active });
grc.mapFramework({ controlId:'recording-control', frameworkId:'internal-framework', requirementIds:['fw-1'], mappingType:MappingType.Full, verifiedBy:'auditor', verifiedAt:30 });
const risk = grc.assessRisk({ id:'risk-1', title:'Recovery evidence stale', description:'DR site evidence is stale', category:RiskCategory.Compliance, ownerId:'risk-owner', status:RiskStatus.Assessed, subjectType:'production', subjectId:'prod-1', assessment:{ likelihood:5, impact:5, inherentScore:0, residualScore:100, assessedAt:31, assessedBy:'risk' }, appetiteThreshold:60, treatment:RiskTreatmentType.Mitigate, evidenceIds:[] });
equal(risk.assessment.inherentScore, scoreRisk(5,5));
gate = grc.gate(subject, 53);
equal(gate.decision, GovernanceGateDecision.RequireApproval);
grc.createCorrectiveAction({ id:'ca-1', title:'Fix privacy approval', description:'Collect approval evidence', sourceType:'finding', sourceId:'finding-1', ownerId:'privacy', priority:'high', dueAt:100, verificationCriteria:['approval evidence current'], evidenceIds:[], status:CorrectiveActionStatus.Open });
grc.registerObligation({ id:'obl-1', sourceType:'contract', sourceId:'contract-a', triggerCondition:'privacy incident', action:'notify customer', dueAfterMs:86400000, ownerRoleIds:['compliance'], status:'pending' as never });
const snap = grc.snapshot();
ok(snap.telemetry.activePolicies >= 2);
ok(snap.telemetry.highRisks === 1);
ok(snap.audit.length <= 1000);
ok(!JSON.stringify(snap).includes('secret-recording'));
console.log('v5.11.7 governance risk compliance validation passed');
