import { BroadcastGraphicsError, createBroadcastGraphicsEngine, createBroadcastGraphicsProcessor, type BroadcastGraphicsDefinition, type BroadcastGraphicsRole } from './broadcast-graphics-foundation.js';
const assert = { equal:(a:unknown,e:unknown)=>{if(a!==e)throw new Error(`Expected ${String(a)} to equal ${String(e)}`);}, ok:(v:unknown)=>{if(!v)throw new Error('Expected truthy value');}, throws:(fn:()=>unknown,t:new (...args: never[])=>Error)=>{try{fn();}catch(e){if(e instanceof t)return;throw e;}throw new Error('Expected throw');} };
const tick = (frame: number) => ({ frameNumber: BigInt(frame), startedAtNs: BigInt(frame), deadlineAtNs: BigInt(frame), scheduledTimeNs: BigInt(frame), actualTimeNs: BigInt(frame), presentationTimeNs: BigInt(frame), frameDurationNs: 16_666_667n, driftNs: 0n, latenessNs: 0n, late: false, missedFrames: 0n, discontinuity: false });
const def = (id:string, kind:BroadcastGraphicsDefinition['kind'], role:BroadcastGraphicsRole='PROGRAM', fields:Record<string, string|number|boolean>={}): BroadcastGraphicsDefinition => ({ id, generation:1, kind, packageType:id.split(':')[0] ?? kind, templateId:`template:${kind.toLowerCase()}`, templateGeneration:1, outputRole:role, variant:role, lifecycle:'CREATED', fields, bindings:{ headline:'TEXT_CONTENT', score:'SAFE_METADATA' }, metadataOnly:true, realRendering:false, safeMetadata:{ token:'redacted', department:'graphics' } });
const engine = createBroadcastGraphicsEngine();
const lower = engine.create(def('lower:single','LOWER_THIRD','PROGRAM',{ line1:'Anchor' }));
assert.equal(lower.safeMetadata.token, undefined); // 1 lower third creation + metadata safety
assert.equal(engine.update(lower.id,2,{ line1:'Updated Anchor' }).fields.line1,'Updated Anchor'); // 2 update
engine.show(lower.id,3); assert.equal(engine.snapshot().visibleGraphics.length,1); // 3 visibility
engine.clear(lower.id,4); assert.equal(engine.snapshot().activeGraphics.some((g)=>g.id===lower.id),false); // 4 clear
engine.create(def('title:opening','TITLE','PROGRAM',{ title:'Opening' })); // 5 title
engine.create(def('title:full','TITLE','PROGRAM',{ title:'Full Screen', fullScreen:true })); // 6 full screen
engine.create(def('title:credits','TITLE','PROGRAM',{ title:'Credits', roll:'end' })); // 7 credits
const score = engine.create(def('scorebug:main','SCOREBUG','PROGRAM',{ homeTeam:'HOME', awayTeam:'AWAY', homeScore:0, awayScore:0, period:'Q1', clock:'12:00' })); // 8 scorebug
engine.update(score.id,2,{ homeScore:7, awayScore:3 }); assert.equal(engine.snapshot().telemetry.scoreUpdates,1); // 9 score updates
const timer = engine.create(def('timer:segment','TIMER','PROGRAM',{ mode:'SEGMENT_TIMER', currentMs:0 })); engine.update(timer.id,2,{ currentMs:1000 }); assert.equal(engine.snapshot().timers[0]?.currentMs,1000); // 10 timer update
engine.create(def('timer:countdown','TIMER','PROGRAM',{ mode:'COUNT_DOWN', currentMs:10000 })); // 11 countdown
engine.create(def('timer:match','TIMER','PROGRAM',{ mode:'MATCH_CLOCK', currentMs:45000 })); // 12 match clock
engine.create(def('timer:wall','TIMER','PROGRAM',{ mode:'WALL_CLOCK', currentMs:0 })); // 13 live clock metadata
const ticker = engine.create(def('ticker:headlines','TICKER','PROGRAM',{ mode:'SCROLL_LEFT', category:'HEADLINES' })); // 14/15 ticker/headline
engine.create(def('ticker:financial','TICKER','PROGRAM',{ category:'FINANCIAL', rowCount:1 })); // 16 financial
engine.create(def('ticker:multi','TICKER','PROGRAM',{ category:'SPORTS', rowCount:3 })); // 17 multi-row
engine.create(def('status:live','STATUS_GRAPHIC','PROGRAM',{ status:'LIVE' })); // 18 status
engine.create(def('status:breaking','STATUS_GRAPHIC','PROGRAM',{ status:'BREAKING NEWS' })); // 19 breaking
engine.create(def('status:replay','STATUS_GRAPHIC','PROGRAM',{ status:'REPLAY' })); // 20 replay
assert.equal(engine.snapshot().telemetry.bindingResolutions > 0,true); // 21 dynamic bindings metadata
assert.throws(()=>engine.create(def('scorebug:main','SCOREBUG')), BroadcastGraphicsError); // 22 duplicate
assert.throws(()=>engine.update(score.id,1,{ homeScore:8 }), BroadcastGraphicsError); // 23 generation
engine.create(def('lower:preview','LOWER_THIRD','PREVIEW',{ line1:'Preview' })); engine.create(def('lower:horizontal','LOWER_THIRD','HORIZONTAL',{ line1:'Horizontal' })); engine.create(def('lower:vertical','LOWER_THIRD','VERTICAL',{ line1:'Vertical' })); engine.create(def('lower:square','LOWER_THIRD','SQUARE',{ line1:'Square' })); // 24-26 isolation
const snap = engine.processFrame(tick(1)); if(!snap) throw new Error('snapshot missing'); assert.ok(snap.health); assert.ok(snap.telemetry); assert.ok(snap.watchdog); assert.ok(snap.sourceGraph); // 27-30
assert.throws(()=>{ (snap.activeGraphics as BroadcastGraphicsDefinition[]).push(def('mutate','TITLE')); }, TypeError); // 31 immutability
for(let i=2;i<=100_000;i++) engine.processFrame(tick(i), false); assert.equal(engine.snapshot().telemetry.ticksProcessed,100000); // 32 long run
const replayA = JSON.stringify(engine.snapshot().sourceGraph); const replayB = JSON.stringify(engine.snapshot().sourceGraph); assert.equal(replayA,replayB); // 33 deterministic replay
assert.equal(engine.snapshot().sourceGraph.visiblePublications.length,0); // 34 zero visible leak after only explicit show was cleared
const processor = createBroadcastGraphicsProcessor(engine); assert.equal(processor.initialize().status,'READY'); assert.equal(processor.shutdown().status,'STOPPED'); // 35 shutdown
console.log('UBOS v5.9.3 broadcast graphics foundation validation passed');
