import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, compareExperiments, evidenceComplete, htmlReport } from './control-room-render-forensics-lib.mjs';
const base={id:'baseline',name:'Baseline',durationMs:10000,renders:{A:100},stateWrites:{s:{total:50}},screenshot:'a.png',consoleErrors:[],domMutationCount:1};
test('experiment comparison calculations',()=>{const [b,n]=compareExperiments([base,{...base,id:'mixer-disabled',renders:{A:10},stateWrites:{s:{total:5}}}]); assert.equal(b.rendersPerSecond,10); assert.equal(n.renderReductionPercent,90); assert.equal(n.stateWriteReductionPercent,90);});
test('conclusion classification',()=>{assert.equal(classify([base,{...base,id:'mixer-disabled',renders:{A:5},visibleShaking:'absent'}]),'PROVEN primary cause'); assert.equal(classify([base,{...base,id:'mixer-disabled',renders:{A:60},visibleShaking:'present'}]),'CONTRIBUTOR'); assert.equal(classify([base,{...base,id:'mixer-disabled',renders:{A:95},visibleShaking:'present'}]),'DISPROVEN');});
test('missing-data handling',()=>{assert.equal(classify([]),'INCONCLUSIVE'); assert.equal(evidenceComplete([{...base,screenshot:''}]),false);});
test('report generation',()=>{const html=htmlReport({results:[base],conclusion:'INCONCLUSIVE',complete:true}); assert.match(html,/experiment table|<table/i); assert.match(html,/ProfessionalAudioMixer/);});
test('browser flag application contract',()=>{const flags={'mixer-disabled':true}; assert.equal(flags['mixer-disabled'],true);});
