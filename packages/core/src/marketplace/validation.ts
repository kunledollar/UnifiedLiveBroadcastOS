function equal(actual: unknown, expected: unknown): void { if (actual !== expected) throw new Error(`expected ${String(expected)}, got ${String(actual)}`); }
function ok(value: unknown): void { if (!value) throw new Error('assertion failed'); }
function throws(fn: () => unknown): void { try { fn(); } catch { return; } throw new Error('expected throw'); }
import { HealthStatus } from '../observability/index.js';
import { MarketplaceExtensionPlatform, ExtensionCategory, ExtensionType, ExtensionRuntimeType, ExtensionRiskLevel, TenantIsolationMode, MarketplacePricingModel, CertificationLevel, MarketplaceListingStatus, CertificationStatus, SubmissionStatus, ExtensionLicenseStatus, PluginLifecycleState } from './index.js';

const at=1_000;
const platform=new MarketplaceExtensionPlatform('5.11.9',1000);
platform.registerDeveloper({id:'pub-a',name:'Device Maker',verificationStatus:'organization_verified',administratorIds:['dev-admin'],signingKeyIds:['key-a'],supportContact:'support@example.test',createdAt:at});
platform.createSigningKey('pub-a','key-b');
const manifest={id:'com.vendor.atem-driver',name:'ATEM Driver',description:'Safe device control',publisherId:'pub-a',version:'1.2.3',type:ExtensionType.DevicePlugin,category:ExtensionCategory.DeviceDriver,entrypoints:[{id:'driver',runtime:ExtensionRuntimeType.WebAssembly,module:'driver.wasm',processType:'device',startupMode:'on_enable'}],capabilities:[{capability:'device.register',reason:'register device',required:true,riskLevel:ExtensionRiskLevel.Moderate},{capability:'production.state.read',reason:'status',required:false,riskLevel:ExtensionRiskLevel.Low},{capability:'production.program.change',reason:'optional take',required:false,riskLevel:ExtensionRiskLevel.High}],supportedUBOSVersions:'>=5.11 <5.12',supportedEnvironments:['cloud','edge'],tenantIsolationMode:TenantIsolationMode.MultiTenantIsolated,riskLevel:ExtensionRiskLevel.High,dependencies:[{type:'sdk',id:'ubos-sdk',versionRange:'^1.0.0',required:true}],networkRequirements:[{hostPattern:'192.168.0.0/16',protocol:'tcp',ports:[9910],direction:'outbound' as const,required:false,justification:'device lan'}],support:{contact:'support@example.test',responseTargetHours:24,policy:'business hours'},license:{license:'commercial',pricingModel:MarketplacePricingModel.Subscription},integrity:{packageHash:'sha256:abcdef123456',manifestHash:'sha256:123456abcdef',signature:'sig',signingKeyId:'key-a',provenanceHash:'sha256:987654abcdef'}};
platform.registerExtension(manifest);
throws(()=>platform.registerExtension({...manifest,id:'bad.semver',version:'1.0'}));
throws(()=>platform.registerExtension({...manifest,id:'com.vendor.bad',capabilities:[{capability:'stream.stop',reason:'bad',required:true,riskLevel:ExtensionRiskLevel.Low}]}));
platform.submit({id:'sub-a',extensionId:manifest.id,version:manifest.version,publisherId:'pub-a',packageReference:'ubospkg://atem',submittedAt:at,requestedCertificationLevel:CertificationLevel.BroadcastCertified,status:SubmissionStatus.Uploaded,reviewFindings:[]});
const cert=platform.certify('sub-a',CertificationLevel.BroadcastCertified,[{name:'manifest',passed:true,details:'ok'},{name:'sandbox',passed:true,details:'ok'},{name:'tenant isolation',passed:true,details:'ok'}],['device.register','production.state.read'],at+10);
equal(cert.status,CertificationStatus.Approved);
const listing=platform.publish({id:'listing-a',extensionId:manifest.id,title:'ATEM Driver',summary:'Driver',description:'Certified driver',publisherId:'pub-a',category:ExtensionCategory.Custom,currentVersion:manifest.version,pricingModel:MarketplacePricingModel.Subscription,supportPolicy:manifest.support,certificationStatus:CertificationStatus.Draft,listingStatus:MarketplaceListingStatus.Draft});
equal(listing.listingStatus,MarketplaceListingStatus.Published);
const ctx={organizationId:'org-a',tenantId:'tenant-a',workspaceId:'ws-a',productionId:'prod-a',actingIdentityId:'admin-a',permissions:['device.register','production.state.read'],at:at+20};
throws(()=>platform.install('listing-a',ctx,{apiToken:'plain'},at+20));
throws(()=>platform.install('listing-a',ctx,{refresh:30},at+20));
platform.activateLicense({id:'lic-a',extensionId:manifest.id,tenantId:'tenant-a',pricingModel:MarketplacePricingModel.Subscription,entitlement:{token:'secret',seats:1},activatedAt:at+19,status:ExtensionLicenseStatus.Active});
const install=platform.install('listing-a',ctx,{refresh:30},at+20);
equal(install.identity.grantedCapabilities.includes('production.program.change'),false);
platform.enable(install.id);
equal(platform.requestCommand(install.id,'device.register','tenant-a'),true);
equal(platform.requestCommand(install.id,'production.program.change','tenant-a'),false);
equal(platform.requestCommand(install.id,'device.register','tenant-b'),false);
for(let i=0;i<5;i++) platform.crash(install.id,at+30+i);
equal(platform.snapshot().installations[0]?.state,PluginLifecycleState.Suspended);
platform.meter({extensionId:manifest.id,installationId:install.id,tenantId:'tenant-a',metric:'api_calls',quantity:10,unit:'count',periodStart:at,periodEnd:at+60,recordedAt:at+60});
platform.publishAdvisory({id:'adv-a',extensionId:manifest.id,affectedVersions:['1.2.3'],severity:'high',description:'network issue',remediation:'update',fixedVersion:'1.2.4',publishedAt:at+70});
throws(()=>platform.uninstall(install.id,true));
platform.uninstall(install.id,false);
platform.revokePublisher('pub-a');
const snap=platform.snapshot();
equal(snap.developers.length,1); equal(snap.manifests.length,1); equal(snap.listings.length,1); equal(snap.usage.length,1); ok(snap.audit.some(a=>a.startsWith('PublisherRevoked'))); equal(snap.licenses[0]?.entitlement?.token,'[REDACTED]'); equal(snap.health.status,HealthStatus.Warning);
console.log('v5.11.9 marketplace extension platform validation passed');
