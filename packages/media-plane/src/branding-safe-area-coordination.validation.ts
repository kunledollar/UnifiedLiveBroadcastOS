const assert = { equal:(a:unknown,e:unknown)=>{if(a!==e)throw new Error(`Expected ${String(a)} to equal ${String(e)}`);}, deepEqual:(a:unknown,e:unknown)=>{if(a!==e)throw new Error('Expected deep equal');}, throws:(fn:()=>unknown,p:(e:unknown)=>boolean)=>{try{fn();}catch(e){if(p(e))return;throw e;}throw new Error('Expected throw');} };
import { BrandingSafeAreaError, createBrandingSafeAreaCoordinatorEngine, createBrandingSafeAreaCoordinatorProcessor, type BrandDefinition, type BrandPlacementPolicy, type BrandProfileDefinition, type BrandVariantDefinition, type BrandingCoordinationRequest, type BrandingCoordinationSessionDefinition, type GraphicsExclusionZoneDefinition, type GraphicsSafeAreaDefinition } from './branding-safe-area-coordination.js';

const ns = 1n;
const brand = (id: string, priority = 1, parentBrandId?: string): BrandDefinition => { const base = { brandId:id, brandVersion:'1', brandGeneration:1, displayName:id, type:id.includes('sponsor')?'SPONSOR' as const:'NETWORK' as const, priority, precedencePolicy:'EXPLICIT_PRIORITY' as const, inheritancePolicy:parentBrandId?'INHERIT_MISSING_ASSETS' as const:'NO_INHERITANCE' as const, enabled:true, safeMetadata:{ path:'/redacted', ok:true }, createdAtNs:ns, updatedAtNs:ns }; return parentBrandId ? { ...base, parentBrandId, parentBrandGeneration:1 } : base; };
const safeArea = (id = 'safe'): GraphicsSafeAreaDefinition => ({ safeAreaId:id, safeAreaVersion:'1', safeAreaGeneration:1, displayName:id, safeAreaClass:'LOGO_SAFE', outputRole:'PROGRAM', aspectRatioRole:'HORIZONTAL_16_9', bounds:{ left:0.05, top:0.05, right:0.95, bottom:0.95 }, reservedRegions:[], priority:1, enabled:true, safeMetadata:{}, createdAtNs:ns, updatedAtNs:ns });
const policy = (id = 'place', collisionBehavior: BrandPlacementPolicy['collisionBehavior'] = 'PRIORITY_WINS'): BrandPlacementPolicy => ({ placementPolicyId:id, policyVersion:'1', policyGeneration:1, anchor:'TOP_RIGHT', offsetX:0, offsetY:0, maximumWidth:0.1, maximumHeight:0.1, scalingPolicy:'CONTAIN_METADATA', cropPolicy:'NO_CROP', opacityPolicy:'FIXED_METADATA', opacityValue:0.8, zOrder:10, safeAreaClass:'LOGO_SAFE', collisionBehavior, safeMetadata:{} });
const profile = (id = 'profile', brandId = 'network'): BrandProfileDefinition => ({ brandProfileId:id, profileVersion:'1', profileGeneration:1, brandId, brandGeneration:1, displayName:id, outputRoleVariants:['variant'], aspectRatioVariants:['variant'], enabled:true, safeMetadata:{}, createdAtNs:ns, updatedAtNs:ns });
const variant = (id = 'variant', profileId = 'profile', placementPolicyId = 'place'): BrandVariantDefinition => ({ variantId:id, variantVersion:'1', variantGeneration:1, brandProfileId:profileId, profileGeneration:1, outputRole:'PROGRAM', aspectRatioRole:'HORIZONTAL_16_9', backgroundClass:'DARK', placementPolicyId, safeAreaPolicyId:'safe', enabled:true, priority:1, safeMetadata:{} });
const session = (): BrandingCoordinationSessionDefinition => ({ sessionId:'session', sessionVersion:'1', sessionGeneration:1, activeBrandIds:['network'], activeProfileIds:['profile'], outputRoles:['PROGRAM','PREVIEW','CLEAN_FEED'], aspectRatioRoles:['HORIZONTAL_16_9'], precedencePolicy:'EXPLICIT_PRIORITY', enabled:true, safeMetadata:{}, createdAtNs:ns, updatedAtNs:ns });
const request = (id = 'req'): BrandingCoordinationRequest => ({ requestId:id, sessionId:'session', expectedSessionGeneration:1, brandId:'network', brandGeneration:1, profileId:'profile', profileGeneration:1, outputRole:'PROGRAM', aspectRatioRole:'HORIZONTAL_16_9', requestedAction:'ACTIVATE', requestedRuntimeFrame:1, correlationId:id, safeMetadata:{ animationGeneration:1, url:'redacted' } });
function throws(code: string, fn: () => unknown) { assert.throws(fn, (e) => e instanceof BrandingSafeAreaError && e.code === code); }
function ready() { const e=createBrandingSafeAreaCoordinatorEngine(); e.registerBrand(brand('network')); e.registerAsset({ assetRefId:'asset', assetRefVersion:'1', assetRefGeneration:1, assetType:'PRIMARY_LOGO', logicalAssetId:'logo', contentHashMetadata:'abc', available:true, safeMetadata:{ payload:'bad', ok:true }, createdAtNs:ns, updatedAtNs:ns }); e.registerSafeArea(safeArea()); e.registerPlacementPolicy(policy()); e.registerProfile(profile()); e.registerVariant(variant()); e.createSession(session()); return e; }

const e = ready();
const { plan, result } = e.coordinate(request());
assert.equal(plan.selectedVariantId, 'variant');
assert.equal(result.safeAreaCompliant, true);
assert.equal(result.realRendering, false);
assert.equal(e.snapshot().assets[0]?.contentHashMetadata, 'hash-redacted');
assert.equal('url' in plan.safeMetadata, false);
assert.equal(e.assertInvariants(), true);

throws('DUPLICATE_ID', () => e.registerBrand(brand('network')));
throws('STALE_GENERATION', () => e.coordinate({ ...request('stale'), expectedSessionGeneration:0 }));
throws('MISSING_REFERENCE', () => e.coordinate({ ...request('missing'), variantId:'missing' }));
const bad = createBrandingSafeAreaCoordinatorEngine();
throws('MISSING_REFERENCE', () => bad.registerBrand(brand('child', 1, 'parent')));
const badBounds = createBrandingSafeAreaCoordinatorEngine();
throws('INVALID_BOUNDS', () => badBounds.registerSafeArea({ ...safeArea('bad'), bounds:{ left:0.9, top:0, right:0.1, bottom:1 } }));
const zoneEngine = ready();
const zone: GraphicsExclusionZoneDefinition = { exclusionZoneId:'zone', zoneVersion:'1', zoneGeneration:1, displayName:'zone', outputRole:'PROGRAM', aspectRatioRole:'HORIZONTAL_16_9', zoneType:'PLATFORM_UI_REGION', rect:{ left:0.85, top:0.05, right:0.95, bottom:0.15 }, priority:1, hardExclusion:true, safeMetadata:{} };
zoneEngine.registerExclusionZone(zone);
throws('EXCLUSION_ZONE_VIOLATION', () => zoneEngine.coordinate(request('zone')));
const reject = createBrandingSafeAreaCoordinatorEngine();
reject.registerBrand(brand('network')); reject.registerSafeArea(safeArea()); reject.registerPlacementPolicy(policy('reject','REJECT')); reject.registerProfile(profile()); reject.registerVariant(variant('variant','profile','reject')); reject.createSession(session()); reject.coordinate(request('a')); throws('COLLISION_UNRESOLVED', () => reject.coordinate(request('b')));
const processor = createBrandingSafeAreaCoordinatorProcessor(ready());
assert.equal(processor.initialize().status, 'READY');
assert.equal(processor.processTick({ frameNumber:1n, startedAtNs:1n, deadlineAtNs:1n, scheduledTimeNs:1n, actualTimeNs:1n, presentationTimeNs:1n, frameDurationNs:1n, driftNs:0n, latenessNs:0n, late:false, missedFrames:0n, discontinuity:false }).status, 'SUCCEEDED');
const canonical = (v: unknown) => JSON.stringify(v, (_k, x) => typeof x === 'bigint' ? x.toString() : x);
assert.deepEqual(canonical(ready().snapshot()), canonical(ready().snapshot()));
for (let i = 0; i < 10000; i++) ready().processFrame();
processor.shutdown();
console.log('branding-safe-area-coordination validation passed');
