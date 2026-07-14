import { ShowControlActionDispatchEngine, ShowControlActionDispatchError, ShowControlActionDispatchProcessor } from './show-control-action-dispatch.js';
const assertEqual=(actual:unknown,expected:unknown)=>{ if(actual!==expected) throw new Error(`Expected ${String(expected)} but received ${String(actual)}`); };
const assertDeepEqual=(actual:unknown,expected:unknown)=>{ if(JSON.stringify(actual)!==JSON.stringify(expected)) throw new Error('Expected values to be deeply equal'); };
const assertThrows=(fn:()=>unknown,errorType:unknown)=>{ try{ fn(); } catch(error){ if(error instanceof (errorType as typeof Error)) return; throw error; } throw new Error('Expected function to throw'); };
const tick=(frameNumber:bigint)=>({frameNumber,startedAtNs:0n,deadlineAtNs:0n,scheduledTimeNs:0n,actualTimeNs:0n,presentationTimeNs:0n,frameDurationNs:0n,driftNs:0n,latenessNs:0n,late:false,missedFrames:0n,discontinuity:false});

const target={targetId:'pgm-bus',generation:1,kind:'SCENE_BUS' as const,state:'AVAILABLE' as const,capabilities:['take','preview'],metadata:{label:'Program',secretToken:'redacted'}};
const action={actionId:'take-main',generation:1,kind:'TAKE' as const,targetIds:['pgm-bus'],requiredCapabilities:['take'],priority:10,timeoutFrames:5,metadata:{note:'safe',endpoint:'hidden'}};
const request={requestId:'req-1',actionId:'take-main',generation:1,queuedFrame:1,notBeforeFrame:1,payload:{operator:'td',password:'hidden'}};

const engine=new ShowControlActionDispatchEngine();
engine.registerTarget(target);
engine.registerAction(action);
engine.queueAction(request);
let snapshot=engine.dispatchReady(1);
assertEqual(snapshot.dispatches[0]?.state,'DISPATCHED');
assertEqual(snapshot.dispatches[0]?.exactOnceDispatchCount,1);
assertEqual(snapshot.dispatches[0]?.payload.password,undefined);
assertEqual(snapshot.targets[0]?.metadata.secretToken,undefined);
snapshot=engine.dispatchReady(2);
assertEqual(snapshot.dispatches[0]?.exactOnceDispatchCount,1);
engine.ackAction('req-1',3);
assertEqual(engine.snapshot().health.acknowledgedCount,1);

assertThrows(()=>engine.registerTarget({...target,generation:1}),ShowControlActionDispatchError);
assertThrows(()=>engine.queueAction({...request,requestId:'req-stale',generation:0}),ShowControlActionDispatchError);
const blocked=new ShowControlActionDispatchEngine();
blocked.registerTarget({...target,targetId:'gfx',capabilities:['play'],state:'DEGRADED'});
blocked.registerAction({...action,actionId:'gfx-take',targetIds:['gfx'],requiredCapabilities:['take']});
blocked.queueAction({...request,requestId:'req-block',actionId:'gfx-take'});
assertEqual(blocked.dispatchReady(1).dispatches[0]?.state,'BLOCKED');
blocked.registerTarget({...target,targetId:'gfx',generation:2,capabilities:['take'],state:'AVAILABLE'});
assertEqual(blocked.dispatchReady(2).dispatches[0]?.state,'DISPATCHED');
const expired=new ShowControlActionDispatchEngine();
expired.registerTarget(target);
expired.registerAction({...action,timeoutFrames:0});
expired.queueAction({...request,requestId:'req-expire'});
assertEqual(expired.dispatchReady(2).dispatches[0]?.state,'EXPIRED');
expired.failAction('req-expire','manual-fail',3);
assertEqual(expired.snapshot().dispatches[0]?.state,'FAILED');

const processorEngine=new ShowControlActionDispatchEngine();
processorEngine.registerTarget(target);
processorEngine.registerAction(action);
processorEngine.queueAction({...request,requestId:'req-processor'});
const processor=new ShowControlActionDispatchProcessor(processorEngine);
processor.initialize();
processor.processTick(tick(1n));
assertEqual(processorEngine.snapshot().dispatches[0]?.state,'DISPATCHED');
processor.shutdown();

const replayA=new ShowControlActionDispatchEngine();
const replayB=new ShowControlActionDispatchEngine();
for(const replay of [replayA,replayB]){ replay.registerTarget(target); replay.registerAction(action); replay.queueAction({...request,requestId:'req-replay'}); replay.dispatchReady(1); }
assertDeepEqual(replayA.snapshot().dispatches,replayB.snapshot().dispatches);
for(let i=0;i<10000;i++) replayA.processFrame(tick(BigInt(i+10)));
assertEqual(replayA.snapshot().telemetry.realDeviceControl,false);
assertEqual(replayA.snapshot().sourceGraph.metadataOnly,true);
console.log('show-control-action-dispatch validation passed');
