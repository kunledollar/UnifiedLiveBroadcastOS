import { CapacityEnforcement, CapacityPlanner, ResourceState, ResourceType, TrendDirection, analyzeTrend, calculateCapacity, detectSaturation, SaturationState } from './index.js';
function ok(v:unknown,m:string){ if(!v) throw new Error(m); }
const p=new CapacityPlanner();
p.registerResource({resourceId:'gpu-a',resourceType:ResourceType.GPU,logicalName:'GPU A',state:ResourceState.Available,generation:1,metadata:{apiToken:'secret'},capacity:{resourceId:'gpu-a',resourceType:ResourceType.GPU,total:100,reserved:10,allocated:50,safeLimitPercent:70,warningLimitPercent:60,criticalLimitPercent:90,measuredAt:1000}});
p.registerResource({resourceId:'enc-a',resourceType:ResourceType.Encoder,logicalName:'Encoder Pool',state:ResourceState.Shared,generation:1,capacity:{resourceId:'enc-a',resourceType:ResourceType.Encoder,total:4,reserved:1,allocated:1,safeLimitPercent:75,warningLimitPercent:50,criticalLimitPercent:100,measuredAt:1000}});
ok(calculateCapacity({resourceId:'x',resourceType:ResourceType.CPU,total:10,reserved:2,allocated:3,safeLimitPercent:70,warningLimitPercent:60,criticalLimitPercent:90,measuredAt:1}).available===5,'capacity calculation');
ok(detectSaturation(p.snapshot().inventory[0]!.capacity)===SaturationState.Approaching,'saturation detection');
p.defineBudget({productionId:'show',createdAt:1,updatedAt:1,limits:[{resourceType:ResourceType.GPU,maximumUtilizationPercent:65,enforcementMode:CapacityEnforcement.Block},{resourceType:ResourceType.Encoder,maximumUtilizationPercent:75,minimumAvailable:1,enforcementMode:CapacityEnforcement.Warning}]});
ok(p.validateProduction('show',1100).passed,'preflight should pass at current load');
p.reserve({id:'r1',productionId:'show',resourceType:ResourceType.Encoder,quantity:1,startsAt:2000,endsAt:4000,createdBy:'operator-token'});
try{ p.reserve({id:'r2',productionId:'show',resourceType:ResourceType.Encoder,quantity:10,startsAt:2500,endsAt:3000,createdBy:'operator'}); throw new Error('expected oversubscription'); }catch(e){ ok(String(e).includes('oversubscription'),'reservation conflict'); }
const trend=analyzeTrend('gpu',[0,1,2,3].map(i=>({metricName:'gpu',timestamp:i*1000,value:50+i*2,labels:{service:'capacity'}})));
ok(trend.direction===TrendDirection.Increasing,'trend analysis'); p.updateTrend(trend); const f=p.forecast(ResourceType.GPU, Date.now()+1000); ok(f.assumptions.length>0,'forecast assumptions');
const sim=p.simulate({id:'s',productionId:'show',startsAt:1,endsAt:2,resourceDeltas:{[ResourceType.GPU]:40},assumptions:['add replay']}); ok(!sim.passed,'scenario blocks unsafe load');
const recs=p.optimize(); ok(recs.length>0,'optimization recommendation'); ok(p.bottleneck()!==undefined,'bottleneck'); ok(p.efficiencyScore()>0,'efficiency');
const up=p.upgradePlan({id:'gpu',title:'Add GPU',addedResources:{[ResourceType.GPU]:1},estimatedBenefits:['more outputs'],risks:['rack capacity']}); ok(up.expectedBenefit.includes('more outputs'),'upgrade plan');
const cmp=p.compare('c','gpu',[{metricName:'gpu',timestamp:1,value:10,labels:{service:'capacity'}}],[{metricName:'gpu',timestamp:2,value:20,labels:{service:'capacity'}}]); ok(cmp.percentChange===100,'comparison');
const snap=p.snapshot(); ok(Object.isFrozen(snap)===false && snap.inventory.length===2,'snapshot'); ok(!JSON.stringify(snap).includes('secret'),'redaction');
try{ p.registerResource({resourceId:'gpu-a',resourceType:ResourceType.GPU,logicalName:'GPU A',state:ResourceState.Available,generation:1,capacity:{resourceId:'gpu-a',resourceType:ResourceType.GPU,total:100,reserved:0,allocated:0,safeLimitPercent:70,warningLimitPercent:60,criticalLimitPercent:90,measuredAt:2}}); throw new Error('expected stale'); }catch(e){ ok(String(e).includes('stale'),'stale generation'); }
console.log('UBOS v5.11.3 capacity validation PASS');
