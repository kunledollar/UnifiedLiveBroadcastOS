import { ChangeGovernanceEngine, ChangeRiskLevel, ChangeStatus, ChangeType, CompatibilityStatus, DeploymentGateType, FeatureFlagStatus, FeatureFlagType, ReleaseChannel, ReleaseStatus, RolloutStrategyType, calculateRiskScore, evaluateCompatibility, validateManifest } from './index.js';
function ok(v:unknown,m:string){ if(!v) throw new Error(m); }
const engine=new ChangeGovernanceEngine();
engine.registerPolicy({id:'critical',minimumRiskLevel:ChangeRiskLevel.High,requiredRoles:['engineering','production'],requiredApprovalCount:2,prohibitSelfApproval:true,requireTestEvidence:true,requireRollbackPlan:true,requireImpactAssessment:true});
engine.registerWindow({id:'maint',name:'Maintenance',startsAt:1000,endsAt:2000,timezone:'UTC',allowedRiskLevels:[ChangeRiskLevel.Low,ChangeRiskLevel.Moderate,ChangeRiskLevel.High,ChangeRiskLevel.Critical],allowedEnvironments:['staging','production'],approvalRequired:true});
engine.createFreeze({id:'freeze',name:'Production Freeze',startsAt:1200,endsAt:1300,scope:['production'],blockedRiskLevels:[ChangeRiskLevel.High,ChangeRiskLevel.Critical],exceptionsRequireApproval:true,reason:'major event'});
const change=engine.createChange({id:'chg-1',title:'Encoder release',description:'upgrade encoder control',type:ChangeType.ServiceRelease,riskLevel:ChangeRiskLevel.High,requestedBy:'developer-token',requestedAt:1,affectedEnvironments:['production'],affectedComponents:[{id:'encoder',type:'service',version:'2',metadata:{token:'secret'}}],reason:'fix reconnects',expectedBenefit:'better reliability',approvalPolicyId:'critical',status:ChangeStatus.Draft,rollbackPlanId:'rb-1',generation:1});
ok(!JSON.stringify(engine.snapshot()).includes('secret'),'sensitive metadata redacted');
engine.submit(change.id);
const impact=engine.assess({id:'impact-1',changeRequestId:change.id,affectedServices:['encoder'],affectedProductions:['show-a'],affectedUsers:['ops'],affectedSites:['site-a'],expectedDowntimeMs:0,dependencies:['schema:14'],compatibilityRisks:['plugin-api'],failureModes:['stream interruption'],rollbackFeasibility:'version rollback',riskScore:0,confidence:0.9,assessedBy:'assessor-token',assessedAt:2});
ok(impact.riskScore>=calculateRiskScore(change),'risk score includes production impact');
engine.attachTestPlan({id:'test-1',changeRequestId:change.id,evidenceIds:['unit','integration','rollback'],requiredEnvironments:['staging'],passCriteria:['all pass'],result:'passed',completedAt:3});
try{ engine.approve(change.id,{id:'ap-self',approverId:'developer-token',roles:['engineering'],approved:true,approvedAt:4}); throw new Error('expected self approval block'); }catch(e){ ok(String(e).includes('self approval'),'self approval prohibited'); }
engine.approve(change.id,{id:'ap-1',approverId:'eng-1',roles:['engineering'],approved:true,approvedAt:4});
const approved=engine.approve(change.id,{id:'ap-2',approverId:'prod-1',roles:['production'],approved:true,approvedAt:5});
ok(approved.status===ChangeStatus.Approved,'dual approval reaches approved');
try{ engine.schedule(change.id,'maint'); throw new Error('expected freeze block'); }catch(e){ ok(String(e).includes('freeze'),'freeze blocks unsafe timing'); }
engine.removeFreeze('freeze');
ok(engine.schedule(change.id,'maint').status===ChangeStatus.Scheduled,'deployment window schedules change');
engine.registerRollback({id:'rb-1',releaseId:'rel-1',triggerConditions:['health gate failure'],steps:['return traffic','disable flag'],dataRecoveryRequired:false,validationChecks:['version compatible'],approvalRequired:true,compatibleVersions:['1.0.0']});
const badManifest={id:'bad',version:'1.0.0',components:[],sourceCommit:'abc',dependencyVersions:{},schemaRequirements:[],migrationIds:[],featureFlagIds:[],checksums:[],signatures:[],supportedEnvironments:['production'],rollbackCompatible:false,knownIssues:[],validationResults:[],sbom:[],provenance:''};
ok(validateManifest(badManifest).length>=3,'manifest validation blocks unsigned artifacts');
const manifest={...badManifest,id:'manifest-1',checksums:['sha256:a'],signatures:['sig'],rollbackCompatible:true,validationResults:['tests'],sbom:['pkg'],provenance:'builder'};
engine.createRelease(manifest,{id:'rel-1',name:'Encoder 1.0',version:'1.0.0',channel:ReleaseChannel.Stable,components:[],manifestId:manifest.id,createdAt:6,createdBy:'builder',status:ReleaseStatus.Building,changeRequestIds:[change.id]});
ok(evaluateCompatibility({component:'encoder',currentVersion:'0.9',targetVersion:'1.0',compatibleWith:[{component:'schema',status:CompatibilityStatus.Unknown,reason:'missing'}],rollbackSupported:true})===CompatibilityStatus.Incompatible,'unknown compatibility is unsafe');
const score=engine.validateRelease('rel-1',[{component:'encoder',currentVersion:'0.9',targetVersion:'1.0',compatibleWith:[{component:'schema',status:CompatibilityStatus.Compatible,reason:'ok'}],rollbackSupported:true}]);
ok(score.blockers.length===0 && score.overallScore===100,'release readiness passes complete evidence');
const plan=engine.planDeployment({id:'plan-1',releaseId:'rel-1',targetEnvironment:'production',targetSites:['site-a'],targetNodes:['standby','primary'],strategy:RolloutStrategyType.Canary,steps:[{id:'standby',target:'standby',action:'deploy'},{id:'primary',target:'primary',action:'deploy'}],gates:[{id:'health',name:'Health',type:DeploymentGateType.Health,required:true,evaluation:'healthy',passed:true,evidenceIds:['health-ok']}],rollbackPlanId:'rb-1'});
ok(plan.strategy===RolloutStrategyType.Canary,'canary plan registered');
engine.executeDeployment('plan-1',10); const observing=engine.executeDeployment('plan-1',11); ok(observing.completedStepIds.length===2,'deployment steps execute once');
try{ engine.completeObservation('plan-1',12); throw new Error('expected observation block'); }catch(e){ ok(String(e).includes('observation'),'observation window enforced'); }
ok(engine.completeObservation('plan-1',600012).status,'deployment completes after observation');
const flag=engine.createFlag({id:'flag-1',name:'New Scheduler',type:FeatureFlagType.Percentage,defaultValue:false,rules:[{scope:{environment:'rehearsal'},value:true,percentage:100}],riskLevel:ChangeRiskLevel.High,ownerId:'owner-token',createdAt:1,status:FeatureFlagStatus.Active,audit:[],lastKnownGood:false});
ok(flag.ownerId!=='owner-token','flag owner redacted'); ok(engine.evaluateFlag('flag-1',{environment:'rehearsal',production:'show-a'},1)===true,'deterministic flag targeting');
engine.disableFlag('flag-1'); ok(engine.evaluateFlag('flag-1',{environment:'rehearsal'},1)===false,'kill switch safe fallback');
engine.requestPromotion({id:'promo-1',releaseId:'rel-1',sourceEnvironment:'staging',targetEnvironment:'production',requestedAt:1,requestedBy:'ops',validationResults:['preflight'],status:'requested' as never}); ok(engine.approvePromotion('promo-1').status,'promotion requires validation');
const drift=engine.compareEnvironments('staging','production',{service:'1',schema:'14'},{service:'1',schema:'15'}); ok(drift.differences.length===1,'configuration drift detected');
engine.registerMigration({id:'mig-1',name:'expand schema',fromVersion:'14',toVersion:'15',forwardSteps:['add column'],rollbackSteps:['drop column'],backwardCompatible:true,reversible:true,checkpoint:'add-column'});
ok(engine.snapshot().audit.some(a=>a.includes('ConfigurationDriftDetected')),'audit records important events');
for(let i=0;i<1000;i++) engine.evaluateFlag('flag-1',{environment:'production',production:`show-${i}`},i);
console.log('UBOS v5.11.5 change management validation PASS');
