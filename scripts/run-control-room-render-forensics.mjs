#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, compareExperiments, evidenceComplete, htmlReport, markdownFindings } from './control-room-render-forensics-lib.mjs';

export const pnpmExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
export const helpText = `Usage: pnpm validate:control-room-render-forensics [options]

Options:
  --url <url>        Control Room URL to inspect (default: http://localhost:3000/control-room)
  --duration <sec>   Seconds to observe each experiment (default: 10)
  --output <dir>     Artifact output directory (default: artifacts/control-room-render-forensics/runtime)
  --headed           Run Playwright with a visible browser
  --help             Print this help and exit
`;

export function parseArgs(argv = process.argv.slice(2)) {
  return Object.fromEntries(argv.map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : []).filter(Boolean));
}

export function isHelpRequested(args) {
  return Boolean(args.help || args.h);
}

export async function reachable(url, fetchImpl = fetch) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetchImpl(url, { method, signal: AbortSignal.timeout(1500) });
      if (r.ok) return true;
    } catch {}
  }
  return false;
}

export async function ensureServerAvailable(url, { spawnImpl = spawn, fetchImpl = fetch, executable = pnpmExecutable } = {}) {
  if (await reachable(url, fetchImpl)) return undefined;

  let server;
  try {
    server = spawnImpl(executable, ['--filter', '@ubos/web', 'dev'], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      console.warn('Unable to launch pnpm automatically.\nUsing existing server if available.');
      return undefined;
    }
    throw error;
  }

  let spawnFailed;
  server.once?.('error', (error) => {
    if (error?.code === 'ENOENT') {
      console.warn('Unable to launch pnpm automatically.\nUsing existing server if available.');
      spawnFailed = error;
    }
  });

  await new Promise((res, rej) => {
    const t = setTimeout(() => rej(spawnFailed || Error('server timeout')), 60000);
    const poll = async () => {
      if (spawnFailed) {
        clearTimeout(t);
        res();
      } else if (await reachable(url, fetchImpl)) {
        clearTimeout(t);
        res();
      } else {
        setTimeout(poll, 1000);
      }
    };
    poll();
  });

  return server;
}

const experiments=[
['baseline','Experiment A — Baseline','baseline.png',{}],
['mixer-closed','Experiment B — Audio Mixer closed','mixer-closed.png',{closeMixer:true}],
['mixer-disabled','Experiment C — Mixer subtree disabled','mixer-disabled.png',{'mixer-disabled':true}],
['mixer-raf-disabled','Experiment D — Mixer RAF disabled','mixer-raf-disabled.png',{'mixer-raf-disabled':true}],
['mixer-setter-disabled','Experiment E — Mixer state setter disabled','mixer-setter-disabled.png',{'mixer-setter-disabled':true}],
['audio-meter-disabled','Experiment F — AudioMeter animation disabled','audio-meter-disabled.png',{'audio-meter-disabled':true}],
['recording-poll-disabled','Experiment G — Recording polling disabled','recording-poll-disabled.png',{'recording-poll-disabled':true}],
['scene-reconciliation-disabled','Experiment H — Scene reconciliation disabled','scene-reconciliation-disabled.png',{'scene-reconciliation-disabled':true}],
['all-audio-disabled','Experiment I — All audio subsystem disabled','all-audio-disabled.png',{'mixer-disabled':true,'mixer-raf-disabled':true,'mixer-setter-disabled':true,'audio-meter-disabled':true,'all-audio-disabled':true}],
['all-recording-poll-disabled','Experiment J — All recording runtime polling disabled','all-recording-poll-disabled.png',{'recording-poll-disabled':true,'all-recording-poll-disabled':true}],
['audio-and-recording-disabled','Experiment K — All audio and recording disabled','audio-and-recording-disabled.png',{'mixer-disabled':true,'mixer-raf-disabled':true,'mixer-setter-disabled':true,'audio-meter-disabled':true,'all-audio-disabled':true,'recording-poll-disabled':true,'all-recording-poll-disabled':true}],
['scene-state-reconciliation-disabled','Experiment L — SceneWorkspace state reconciliation disabled','scene-state-reconciliation-disabled.png',{'scene-reconciliation-disabled':true,'scene-state-reconciliation-disabled':true}],
['zustand-writes-frozen','Experiment M — Zustand store writes frozen','zustand-writes-frozen.png',{'freeze-zustand-writes':true}],
['all-raf-disabled','Experiment N — All Control Room requestAnimationFrame disabled','all-raf-disabled.png',{'disable-all-raf':true}],
['all-polling-disabled','Experiment O — All Control Room polling disabled','all-polling-disabled.png',{'disable-all-polling':true}],
['polling-and-raf-disabled','Experiment P — All polling and requestAnimationFrame disabled','polling-and-raf-disabled.png',{'disable-all-polling':true,'disable-all-raf':true}]
];

export async function run(args = parseArgs()) {
  if (isHelpRequested(args)) {
    console.log(helpText);
    return;
  }

  const url=args.url||'http://localhost:3000/control-room', duration=Number(args.duration||10), out=args.output||'artifacts/control-room-render-forensics/runtime';
  const shots=path.join(out,'screenshots'); await mkdir(shots,{recursive:true});
  const server = await ensureServerAvailable(url);
  const { chromium } = await import('@playwright/test');
  const browser=await chromium.launch({headless:!args.headed}); const allConsole=[], allErrors=[], results=[];
  for(const [id,name,file,flags] of experiments){const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1}); await context.addInitScript((flags)=>{localStorage.clear(); window.__UBOS_RENDER_FORENSICS__={enabled:true,renders:{},stateWrites:{},timers:{raf:{scheduled:0,fired:0,blocked:0},interval:{scheduled:0,fired:0,blocked:0},timeout:{scheduled:0,fired:0,blocked:0}},events:{}}; window.__UBOS_RENDER_FORENSICS_FLAGS__=flags; for(const [k,v] of Object.entries(flags)) if(v) localStorage.setItem(`ubos:render-forensics:${k}`,'1'); const s=window.__UBOS_RENDER_FORENSICS__; const oraf=window.requestAnimationFrame.bind(window), ointerval=window.setInterval.bind(window), otimeout=window.setTimeout.bind(window); window.requestAnimationFrame=(cb)=>{s.timers.raf.scheduled++; if(flags['disable-all-raf']){s.timers.raf.blocked++; return 0;} return oraf((t)=>{s.timers.raf.fired++; cb(t);});}; window.setInterval=(cb,delay,...rest)=>{s.timers.interval.scheduled++; if(flags['disable-all-polling']){s.timers.interval.blocked++; return 0;} return ointerval((...a)=>{s.timers.interval.fired++; return typeof cb==='function'?cb(...a):eval(cb);},delay,...rest);}; window.setTimeout=(cb,delay,...rest)=>{s.timers.timeout.scheduled++; if(flags['disable-all-polling'] && Number(delay||0)>=250){s.timers.timeout.blocked++; return 0;} return otimeout((...a)=>{s.timers.timeout.fired++; return typeof cb==='function'?cb(...a):eval(cb);},delay,...rest);};},flags); const page=await context.newPage(); let errors=[]; page.on('console',m=>{const line=`[${id}] ${m.type()} ${m.text()}`; allConsole.push(line); if(['error','warning'].includes(m.type())) errors.push(line)}); page.on('pageerror',e=>{const line=`[${id}] ${e.stack||e.message}`; allErrors.push(line); errors.push(line)}); await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000}); await page.evaluate(()=>{document.body.style.zoom='100%'; new MutationObserver(m=>window.__ubosDomMutations=(window.__ubosDomMutations||0)+m.length).observe(document.body,{childList:true,subtree:true,attributes:true}); try{new PerformanceObserver(l=>window.__ubosLayoutShifts=(window.__ubosLayoutShifts||0)+l.getEntries().length).observe({type:'layout-shift',buffered:true});}catch{}}); await page.waitForLoadState('networkidle',{timeout:15000}).catch(()=>{}); if(flags.closeMixer){await page.getByLabel(/Collapse bottom workspace/i).click({timeout:3000}).catch(()=>{});} const start=Date.now(); await page.waitForTimeout(duration*1000); const data=await page.evaluate(()=>({renders:window.__UBOS_RENDER_FORENSICS__?.renders||{},stateWrites:window.__UBOS_RENDER_FORENSICS__?.stateWrites||{},timers:window.__UBOS_RENDER_FORENSICS__?.timers||{},events:window.__UBOS_RENDER_FORENSICS__?.events||{},domMutationCount:window.__ubosDomMutations||0,layoutShiftCount:window.__ubosLayoutShifts||0,activeWorkspace:document.body.innerText.includes('Director')?'Director':'unknown',bottomTab:document.body.innerText.includes('Mixer')?'audio':'unknown'})); const shot=path.join('screenshots',file); await page.screenshot({path:path.join(out,shot),fullPage:true}); results.push({id,name,durationMs:Date.now()-start,screenshot:shot,consoleErrors:errors,visibleShaking:'unknown',...data}); await context.close();}
  await browser.close(); if(server) server.kill('SIGTERM');
  const compared=compareExperiments(results), conclusion=classify(results), complete=evidenceComplete(results);
  await writeFile(path.join(out,'experiment-results.json'),JSON.stringify(compared,null,2)); await writeFile(path.join(out,'render-counts.json'),JSON.stringify(Object.fromEntries(results.map(r=>[r.id,r.renders])),null,2)); await writeFile(path.join(out,'state-writes.json'),JSON.stringify(Object.fromEntries(results.map(r=>[r.id,r.stateWrites])),null,2)); await writeFile(path.join(out,'summary.json'),JSON.stringify({conclusion,evidenceComplete:complete,results:compared},null,2)); await writeFile(path.join(out,'console.log'),allConsole.join('\n')); await writeFile(path.join(out,'errors.log'),allErrors.join('\n')); await writeFile(path.join(out,'report.html'),htmlReport({results,conclusion,complete})); await writeFile(path.join(out,'findings.md'),markdownFindings({results,conclusion,complete})); console.log(`Conclusion: ${conclusion}\nArtifacts: ${out}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run();
}
