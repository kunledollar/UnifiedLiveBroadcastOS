import { AssessmentStatus, AudienceRole, CertificationTrackStatus, EcosystemContentType, LabIsolationMode, LabStatus, PartnerStatus, PartnerTier, PlatformEcosystemRegistry } from './index.js';

const registry=new PlatformEcosystemRegistry(1000);
registry.publishDocumentation({id:'getting-started',version:'v5.11.0',title:'Getting Started',type:EcosystemContentType.Guide,audience:[AudienceRole.Developer],path:'/docs/v5.11/getting-started',body:'Build safely with redacted token secret examples',tags:['start','sdk'],apiSymbols:['PlatformEcosystemRegistry'],updatedAt:1});
registry.registerEndpoint({id:'list-extensions',version:'v5.11.0',method:'GET',path:'/api/extensions',summary:'List extensions',schemaRef:'ExtensionList',safeToExecute:false,simulatedResponse:{items:[]},codeSamples:{typescript:'client.extensions.list()'}});
registry.publishTutorial({id:'first-plugin',version:'v5.11.0',title:'Build your first plugin',prerequisites:['SDK installed'],estimatedMinutes:30,steps:[{id:'s1',title:'Create',content:'Run generator',validation:'Manifest validates'}]});
registry.publishLab({id:'virtual-control-room',version:'v5.11.0',title:'Virtual Control Room',scenario:'Synthetic production rehearsal',isolationMode:LabIsolationMode.SyntheticOnly,status:LabStatus.Published,virtualDevices:['camera','switcher'],syntheticInputs:['bars','tone'],failureModes:['camera disconnect'],learningObjectives:['recover safely'],estimatedMinutes:45});
try{ registry.publishLab({id:'unsafe',version:'v5.11.0',title:'Unsafe',scenario:'real hardware',isolationMode:LabIsolationMode.HardwareEmulated,status:LabStatus.Published,virtualDevices:['camera'],syntheticInputs:['bars'],failureModes:[],learningObjectives:['no'],estimatedMinutes:5}); throw new Error('unsafe lab accepted'); }catch(e){ if((e as Error).message==='unsafe lab accepted') throw e; }
registry.createLearningPath({id:'plugin-dev',version:'v5.11.0',title:'Plugin Development',audience:AudienceRole.Developer,orderedContentIds:['getting-started','first-plugin'],labIds:['virtual-control-room'],certificationTrackIds:['ubos-engineer']});
registry.createCertificationTrack({id:'ubos-engineer',version:'v5.11.0',title:'UBOS Engineer',status:CertificationTrackStatus.Active,requiredLearningPathIds:['plugin-dev'],examBlueprint:['metadata safety','simulation labs'],practicalLabIds:['virtual-control-room'],passingScore:80,validityDays:365});
const attempt=registry.recordAttempt({id:'attempt-a',trackId:'ubos-engineer',candidateId:'candidate-a',status:AssessmentStatus.Scheduled,score:88,practicalLabResults:[{labId:'virtual-control-room',passed:true,evidence:'no credential leak'}],startedAt:2,completedAt:3});
if(attempt.status!==AssessmentStatus.Passed) throw new Error('certification attempt did not pass');
registry.registerPartner({id:'partner-a',organizationId:'org-a',name:'Partner A',tier:PartnerTier.Certified,status:PartnerStatus.Active,certifiedTrackIds:['ubos-engineer'],hardwareCertificationIds:[],solutionValidationIds:[],supportContact:'support@example.invalid'});
registry.certifyHardware({id:'hw-a',partnerId:'partner-a',deviceModel:'Controller',firmwareVersion:'1.0.0',testSuiteVersion:'v5.11.0',passed:true,limitations:['synthetic media only'],certifiedAt:4});
registry.addExample({id:'graphics-plugin',version:'v5.11.0',title:'Graphics Plugin',category:'graphics',repositoryPath:'examples/graphics-plugin',supportedLanguages:['typescript'],securityNotes:['no secrets in source']});
if(!registry.canRunLab('virtual-control-room','v5.11.0')) throw new Error('published synthetic lab denied');
if(registry.canRunLab('missing','v5.11.0')) throw new Error('missing lab allowed');
const snap=registry.snapshot();
if(!snap.docs[0]?.body.includes('[REDACTED]')) throw new Error('documentation redaction failed');
if(snap.telemetry.docs!==1||snap.telemetry.activeCertifications!==1||snap.telemetry.partners!==1) throw new Error('ecosystem telemetry wrong');
console.log('v5.11.0 platform ecosystem validation passed');
