import { CaptionAccessibilityError, createCaptionAccessibilityEngine, createCaptionAccessibilityProcessor, type CaptionCue, type CaptionOutputRole, type CaptionRegion, type CaptionTrack } from './caption-accessibility-graphics.js';
const assert = { equal:(a:unknown,e:unknown)=>{if(a!==e)throw new Error(`Expected ${String(a)} to equal ${String(e)}`);}, ok:(v:unknown)=>{if(!v)throw new Error('Expected truthy value');}, throws:(fn:()=>unknown,t:new (...args: never[])=>Error)=>{try{fn();}catch(e){if(e instanceof t)return;throw e;}throw new Error('Expected throw');} };
const tick = (frame: number, ns = frame * 1_000_000_000) => ({ frameNumber: BigInt(frame), startedAtNs: BigInt(ns), deadlineAtNs: BigInt(ns), scheduledTimeNs: BigInt(ns), actualTimeNs: BigInt(ns), presentationTimeNs: BigInt(ns), frameDurationNs: 16_666_667n, driftNs: 0n, latenessNs: 0n, late: false, missedFrames: 0n, discontinuity: false });
const region = (role: CaptionOutputRole='PROGRAM'): CaptionRegion => ({ id:`region:${role}`, anchor:'LOWER', outputRole:role, maxLines:2, maxCharsPerLine:32, safeArea:'CAPTION_SAFE', metadataOnly:true });
const track = (id:string, kind:CaptionTrack['kind']='CLOSED_CAPTION', role:CaptionOutputRole='PROGRAM'): CaptionTrack => ({ id, generation:1, kind, language:'en-US', outputRole:role, region:region(role), lifecycle:'ACTIVE', metadataOnly:true, realEncoding:false, safeMetadata:{ owner:'caption', token:'redacted' } });
const cue = (id:string, trackId='cc:main', text='Hello world', start=0n, end=4_000_000_000n): CaptionCue => ({ id, trackId, generation:1, startNs:start, endNs:end, text, speakerLabel:'HOST', nonSpeechDescription:'music', readingSpeedCps:0, lifecycle:'QUEUED', overflow:'NONE', metadataOnly:true, realRendering:false, safeMetadata:{ department:'accessibility', html:'redacted' } });
const engine = createCaptionAccessibilityEngine();
const main = engine.createTrack(track('cc:main')); assert.equal(main.safeMetadata.token, undefined); // 1 track creation/redaction
engine.createTrack(track('sub:es','SUBTITLE','PROGRAM')); // 2 subtitles
engine.createTrack(track('sdh:en','SDH','PREVIEW')); // 3 SDH/preview
engine.createTrack(track('open:aux','OPEN_CAPTION','AUX')); // 4 open captions/AUX
const c1 = engine.addCue(cue('cue:1')); assert.equal(c1.readingSpeedCps, 2.75); // 5 cue + reading speed
engine.showCue('cue:1',2); assert.equal(engine.snapshot().visibleCues.length,1); // 6 show
engine.hideCue('cue:1',3); assert.equal(engine.snapshot().visibleCues.length,0); // 7 hide
engine.showCue('cue:1',4); engine.processFrame(tick(5,5_000_000_000)); assert.equal(engine.snapshot().health.expiredCues,1); // 8 expiry
engine.addCue(cue('cue:fast','cc:main','This is too fast for reading',0n,500_000_000n)); assert.equal(engine.snapshot().health.readingSpeedWarnings,1); // 9 reading warning
engine.addCue(cue('cue:overflow','cc:main','This line is deliberately longer than thirty two characters for overflow testing',0n,5_000_000_000n)); assert.equal(engine.snapshot().health.overflowWarnings,1); // 10 overflow
engine.updateAccessibilityGraphic({ id:'access:speaker', generation:1, kind:'SPEAKER_LABEL', outputRole:'PROGRAM', text:'HOST', regionId:'region:PROGRAM', metadataOnly:true, realRendering:false, safeMetadata:{ speech:'redacted', safe:'yes' } }); // 11 accessibility graphic
assert.equal(engine.snapshot().accessibilityGraphics[0]?.safeMetadata.speech, undefined); // 12 no speech/translation claim
assert.throws(()=>engine.createTrack(track('cc:main')), CaptionAccessibilityError); // 13 duplicate track
assert.throws(()=>engine.addCue(cue('cue:bad','cc:main','bad',2n,1n)), CaptionAccessibilityError); // 14 invalid timing
assert.throws(()=>engine.showCue('cue:1',1), CaptionAccessibilityError); // 15 stale generation
engine.createTrack(track('cc:clean','CLOSED_CAPTION','CLEAN_FEED')); engine.createTrack(track('cc:iso','CLOSED_CAPTION','ISO')); engine.createTrack(track('cc:vertical','CLOSED_CAPTION','VERTICAL')); engine.createTrack(track('cc:square','CLOSED_CAPTION','SQUARE')); // 16-19 roles
engine.addCue(cue('cue:clean','cc:clean','Clean feed captions')); engine.showCue('cue:clean',2); // 20 role publication
const snap = engine.snapshot(); assert.ok(snap.health); assert.ok(snap.telemetry); assert.ok(snap.watchdog); assert.ok(snap.sourceGraph); // 21-24
assert.equal(snap.telemetry.realCaptionEncoding,false); assert.equal(snap.sourceGraph.realRendering,false); // 25-26 metadata honesty
assert.throws(()=>{ (snap.cues as CaptionCue[]).push(cue('mutate')); }, TypeError); // 27 immutability
engine.clearTrack('cc:clean',2); assert.equal(engine.snapshot().cues.find((c)=>c.id==='cue:clean')?.lifecycle,'CLEARED'); // 28 clear track
for(let i=6;i<=100_000;i++) engine.processFrame(tick(i), false); assert.equal(engine.snapshot().telemetry.ticksProcessed,99996); // 29 long run
const replayA = JSON.stringify(engine.snapshot().sourceGraph); const replayB = JSON.stringify(engine.snapshot().sourceGraph); assert.equal(replayA,replayB); // 30 deterministic replay
const processor = createCaptionAccessibilityProcessor(engine); assert.equal(processor.initialize().status,'READY'); const result = processor.processTick(tick(100001)); assert.equal(result.status,'SUCCEEDED'); assert.equal(processor.shutdown().status,'STOPPED'); // 31-33 processor
assert.equal(engine.snapshot().tracks.length,0); // 34 cleanup
assert.equal(createCaptionAccessibilityEngine().snapshot().health.processorHealth,'HEALTHY'); // 35 fresh health
console.log('UBOS v5.9.4 caption accessibility graphics validation passed');
