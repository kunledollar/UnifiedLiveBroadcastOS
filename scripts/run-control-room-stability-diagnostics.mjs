#!/usr/bin/env node
/**
 * Controlled, repeatable Control Room stability experiments. This is deliberately
 * an observer: URL flags isolate production subtrees and this runner records what
 * the browser actually did; it does not change normal Control Room behaviour.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.UBOS_CONTROL_ROOM_URL || 'http://localhost:3000/control-room';
const output = path.resolve(
  process.env.UBOS_DIAGNOSTICS_OUTPUT || 'artifacts/control-room-stability',
);
const duration = Math.max(10, Number(process.env.UBOS_DIAGNOSTICS_DURATION || 10));
const scenarios = [
  ['baseline', {}],
  ['static-shell', { diagnostic: 'static' }],
  ['audio-disabled', { disableAudio: 1 }],
  ['video-disabled', { disableVideo: 1 }],
  ['scenes-disabled', { disableScenes: 1 }],
  ['recording-disabled', { disableRecording: 1 }],
  ['runtime-disabled', { disableRuntime: 1 }],
  ['animations-disabled', { disableAnimations: 1 }],
  ['canvas-video-hidden', { hideCanvasVideo: 1 }],
  [
    'all-live-subsystems-disabled',
    { disableAudio: 1, disableVideo: 1, disableScenes: 1, disableRecording: 1, disableRuntime: 1 },
  ],
];

async function isUp() {
  try {
    return (await fetch(baseUrl, { signal: AbortSignal.timeout(1500) })).ok;
  } catch {
    return false;
  }
}
class DiagnosticsError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}
class BrowserLaunchError extends DiagnosticsError {}
const pnpmExecutable = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const pnpmArgs = ['--filter', '@ubos/web', 'dev'];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function browserLibrary() {
  for (const name of ['@playwright/test', 'playwright', 'puppeteer', 'puppeteer-core']) {
    try {
      await import(name);
      return name;
    } catch {
      /* inspect each installed option */
    }
  }
  throw Error(
    'No supported browser automation dependency found (@playwright/test, playwright, puppeteer, or puppeteer-core).',
  );
}
function childExitCode(code, signal) {
  return typeof code === 'number' && code !== 0 ? code : signal ? 1 : 1;
}
function waitForServer(child) {
  return new Promise((resolve) => {
    child.once('error', (error) =>
      resolve(
        new DiagnosticsError(
          `Could not start the Control Room server with ${pnpmExecutable}: ${error.message}`,
        ),
      ),
    );
    child.once('exit', (code, signal) =>
      resolve(
        new DiagnosticsError(
          `Control Room server exited before becoming ready (code ${String(code)}, signal ${String(signal)}).`,
          childExitCode(code, signal),
        ),
      ),
    );
  });
}
async function server() {
  if (await isUp()) return null;
  // Windows command shims are .cmd files and require a shell for Node to invoke
  // them. Keep the executable and its arguments separate on every platform; this
  // avoids shell-specific command strings and preserves pnpm's output verbatim.
  const child = spawn(pnpmExecutable, pnpmArgs, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
    windowsHide: true,
  });
  const exited = waitForServer(child);
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await isUp()) return child;
    const earlyExit = await Promise.race([pause(1000), exited]);
    if (earlyExit) throw earlyExit;
  }
  child.kill('SIGTERM');
  throw new DiagnosticsError(`Control Room server did not become available at ${baseUrl}`);
}
function init(flags) {
  // Runs before application JS so timers and observers include hydration.
  const d = (window.__UBOS_CONTROL_ROOM_DIAGNOSTICS__ = {
    enabled: true,
    renders: {},
    stateWrites: {},
    domMutations: 0,
    mutationObserverCallbacks: 0,
    resizeObserverCallbacks: 0,
    layoutShiftCount: 0,
    cumulativeLayoutShift: 0,
    layoutShiftSources: [],
    longTaskCount: 0,
    animationFrames: 0,
    timerCallbacks: { raf: 0, interval: 0, timeout: 0 },
    errors: [],
    visibilityChanges: 0,
    geometry: [],
    scrollChanges: [],
  });
  window.__UBOS_RENDER_FORENSICS__ = d;
  window.__UBOS_RENDER_FORENSICS_FLAGS__ = Object.fromEntries(
    Object.entries(flags).map(([k, v]) => [k, Boolean(v)]),
  );
  const raf = window.requestAnimationFrame.bind(window),
    interval = window.setInterval.bind(window),
    timeout = window.setTimeout.bind(window);
  window.requestAnimationFrame = (cb) =>
    raf((t) => {
      d.animationFrames++;
      d.timerCallbacks.raf++;
      cb(t);
    });
  window.setInterval = (cb, ms, ...args) =>
    interval(
      (...a) => {
        d.timerCallbacks.interval++;
        return typeof cb === 'function' ? cb(...a) : undefined;
      },
      ms,
      ...args,
    );
  window.setTimeout = (cb, ms, ...args) =>
    timeout(
      (...a) => {
        d.timerCallbacks.timeout++;
        return typeof cb === 'function' ? cb(...a) : undefined;
      },
      ms,
      ...args,
    );
  addEventListener('error', (e) => d.errors.push(`window error: ${e.message}`));
  addEventListener('unhandledrejection', (e) =>
    d.errors.push(`unhandled rejection: ${String(e.reason)}`),
  );
  document.addEventListener('visibilitychange', () => d.visibilityChanges++);
  new MutationObserver((m) => {
    d.mutationObserverCallbacks++;
    d.domMutations += m.length;
  }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  const RO = window.ResizeObserver;
  if (RO)
    window.ResizeObserver = class extends RO {
      constructor(cb) {
        super((...a) => {
          d.resizeObserverCallbacks++;
          cb(...a);
        });
      }
    };
  for (const type of ['layout-shift', 'longtask'])
    try {
      new PerformanceObserver((list) =>
        list.getEntries().forEach((e) => {
          if (type === 'longtask') d.longTaskCount++;
          else if (!e.hadRecentInput) {
            d.layoutShiftCount++;
            d.cumulativeLayoutShift += e.value;
            d.layoutShiftSources.push(
              ...(e.sources || []).map((s) => s.node?.outerHTML?.slice(0, 160) || 'unknown'),
            );
          }
        }),
      ).observe({ type, buffered: true });
    } catch {}
  if (flags.disableAnimations) {
    const style = document.createElement('style');
    style.textContent =
      '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}';
    document.documentElement.append(style);
  }
  if (flags.hideCanvasVideo) {
    const style = document.createElement('style');
    style.textContent = 'video,canvas{visibility:hidden!important}';
    document.documentElement.append(style);
  }
}
function urlFor(flags) {
  const u = new URL(baseUrl);
  u.search = new URLSearchParams({
    diagnostic: 'baseline',
    ...Object.fromEntries(Object.entries(flags).map(([k, v]) => [k, String(v)])),
  });
  return u.href;
}
function rate(value, elapsed) {
  return value / Math.max(elapsed, 0.001);
}
function classify(r) {
  return r.consoleErrors.length
    ? 'fail: browser errors'
    : r.layoutShiftCount || r.geometryChanges.length
      ? 'instability observed'
      : 'stable during observation';
}
function report(results) {
  const base = results[0];
  const ranked = results
    .slice(1)
    .map((r) => ({
      name: r.id,
      impact: Math.max(
        0,
        (100 * (base.renderRate - r.renderRate)) / Math.max(base.renderRate, 0.001),
      ),
      geometryReduction: Math.max(
        0,
        (100 * (base.geometryChanges.length - r.geometryChanges.length)) /
          Math.max(base.geometryChanges.length, 1),
      ),
    }))
    .sort(
      (a, b) => Math.max(b.impact, b.geometryReduction) - Math.max(a.impact, a.geometryReduction),
    );
  const rows = results
    .map(
      (r) =>
        `<tr><td>${r.id}</td><td>${r.renderRate.toFixed(2)}</td><td>${r.domMutationRate.toFixed(2)}</td><td>${r.layoutShiftCount}/${r.cumulativeLayoutShift.toFixed(4)}</td><td>${r.geometryChanges.length}</td><td>${r.classification}</td><td><img src="${r.screenshot}" width="220"></td></tr>`,
    )
    .join('');
  return {
    ranked,
    html: `<!doctype html><meta charset="utf-8"><title>Control Room Stability Diagnostics</title><style>body{font:14px system-ui;padding:20px}table{border-collapse:collapse}td,th{border:1px solid #bbb;padding:6px;vertical-align:top}pre{white-space:pre-wrap}</style><h1>Control Room Stability Diagnostics</h1><p><b>Conclusion:</b> ${base.classification === 'stable during observation' ? 'No root cause proven: baseline did not exhibit a measured layout or geometry instability.' : 'Measurements identify contributors below; no root cause is declared without an isolation reduction.'}</p><h2>Scenario comparison</h2><table><tr><th>Scenario</th><th>Renders/s</th><th>DOM mutations/s</th><th>CLS</th><th>Geometry changes</th><th>Classification</th><th>Screenshot</th></tr>${rows}</table><h2>Ranked likely causes (measured isolation impact)</h2><ol>${ranked.map((x) => `<li>${x.name}: render reduction ${x.impact.toFixed(1)}%, geometry reduction ${x.geometryReduction.toFixed(1)}%</li>`).join('')}</ol><h2>Geometry timeline and layout-shift sources</h2><pre>${escapeHtml(
      JSON.stringify(
        results.map((r) => ({
          id: r.id,
          geometryChanges: r.geometryChanges,
          layoutShiftSources: r.layoutShiftSources,
          consoleErrors: r.consoleErrors,
        })),
        null,
        2,
      ),
    )}</pre>`,
  };
}
function escapeHtml(s) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
async function writeOutcome(outcome) {
  const measurements = path.join(output, 'measurements.json');
  const html = path.join(output, 'report.html');
  if (outcome.status === 'completed') {
    const result = report(outcome.results);
    await writeFile(
      measurements,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          status: 'completed',
          browserLibrary: outcome.library,
          durationSeconds: duration,
          scenarios: outcome.results,
          rankedLikelyCauses: result.ranked,
        },
        null,
        2,
      ),
    );
    await writeFile(html, result.html);
  } else {
    await writeFile(
      measurements,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          status: outcome.status,
          reason: outcome.reason,
          scenarios: [],
          rankedLikelyCauses: [],
        },
        null,
        2,
      ),
    );
    await writeFile(
      html,
      `<!doctype html><title>Control Room Stability Diagnostics</title><h1>Diagnostics ${escapeHtml(outcome.status)}</h1><p>${escapeHtml(outcome.reason)}</p><p>No browser evidence, screenshots, issue reproduction, or root-cause conclusion was produced.</p>`,
    );
  }
  console.log(`Wrote ${measurements} and ${html}`);
}
async function main() {
  await mkdir(path.join(output, 'screenshots'), { recursive: true });
  let library, ownedServer, browser;
  try {
    library = await browserLibrary();
    if (!library.includes('playwright'))
      throw Error(
        `${library} is installed but this runner currently requires the installed Playwright API.`,
      );
    const { chromium } = await import('@playwright/test');
    const executable = chromium.executablePath();
    // Playwright's own launch error is useful, but this explicit check lets CI
    // publish a truthful, machine-readable blocked result instead of crashing.
    const { existsSync } = await import('node:fs');
    if (!existsSync(executable))
      throw new BrowserLaunchError(
        `Playwright Chromium executable is missing: ${executable}. Run: pnpm exec playwright install chromium`,
      );
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    await writeOutcome({ status: 'blocked', reason });
    console.warn(`Diagnostics blocked: ${reason}`);
    return;
  }
  const results = [];
  try {
    ownedServer = await server();
    const { chromium } = await import('@playwright/test');
    try {
      browser = await chromium.launch({ headless: true });
    } catch (error) {
      throw new BrowserLaunchError(error instanceof Error ? error.message : String(error));
    }
    for (const [id, flags] of scenarios) {
      const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
      await context.addInitScript(init, flags);
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text());
      });
      page.on('pageerror', (e) => consoleErrors.push(e.message));
      await page.goto(urlFor(flags), { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForTimeout(2_000);
      await page.evaluate(() => {
        const d = window.__UBOS_CONTROL_ROOM_DIAGNOSTICS__;
        const selectors = {
          root: '[data-ubos-control-room-root]',
          sceneWorkspace: '[data-ubos-scene-workspace]',
          program: '[data-ubos-program-monitor]',
          preview: '[data-ubos-preview-monitor]',
          audio: '[data-ubos-audio-panel]',
          leftRail: '[data-ubos-left-rail]',
          rightRail: '[data-ubos-right-rail]',
          stage: '[data-ubos-command-center-stage]',
        };
        const last = {};
        setInterval(() => {
          const scroll = [
            document.documentElement.scrollWidth,
            document.documentElement.scrollHeight,
          ];
          if (JSON.stringify(last.scroll) !== JSON.stringify(scroll)) {
            d.scrollChanges.push({ time: performance.now(), value: scroll });
            last.scroll = scroll;
          }
          for (const [name, selector] of Object.entries(selectors)) {
            const b = document.querySelector(selector)?.getBoundingClientRect();
            if (!b) continue;
            const value = [b.x, b.y, b.width, b.height];
            const previous = last[name];
            if (previous) {
              const delta = Math.max(...value.map((v, i) => Math.abs(v - previous[i])));
              if (delta > 0.5)
                d.geometry.push({ time: performance.now(), name, previous, value, delta });
            }
            last[name] = value;
          }
        }, 100);
      });
      await page.screenshot({
        path: path.join(output, 'screenshots', `${id}-start.png`),
        fullPage: true,
      });
      const start = Date.now();
      await page.waitForTimeout(duration * 1000);
      const data = await page.evaluate(() => {
        const d = window.__UBOS_CONTROL_ROOM_DIAGNOSTICS__;
        const selectors = {
          root: '[data-ubos-control-room-root]',
          sceneWorkspace: '[data-ubos-scene-workspace]',
          program: '[data-ubos-program-monitor]',
          preview: '[data-ubos-preview-monitor]',
          audio: '[data-ubos-audio-panel]',
          leftRail: '[data-ubos-left-rail]',
          rightRail: '[data-ubos-right-rail]',
          stage: '[data-ubos-command-center-stage]',
        };
        const boxes = Object.fromEntries(
          Object.entries(selectors).map(([name, s]) => {
            const b = document.querySelector(s)?.getBoundingClientRect();
            return [name, b && [b.x, b.y, b.width, b.height]];
          }),
        );
        return {
          ...d,
          boxes,
          viewport: [innerWidth, innerHeight],
          scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
          body: (() => {
            const b = document.body.getBoundingClientRect();
            return [b.x, b.y, b.width, b.height];
          })(),
        };
      });
      const geometryChanges = (data.geometry || []).filter((x) => x.delta > 0.5);
      const screenshot = `screenshots/${id}.png`;
      await page.screenshot({ path: path.join(output, screenshot), fullPage: true });
      const elapsed = (Date.now() - start) / 1000;
      results.push({
        id,
        flags,
        duration: elapsed,
        ...data,
        geometryChanges,
        consoleErrors: [...consoleErrors, ...(data.errors || [])],
        screenshot,
        renderRate: rate(
          Object.values(data.renders || {}).reduce((a, v) => a + v, 0),
          elapsed,
        ),
        domMutationRate: rate(data.domMutations || 0, elapsed),
        timerCallbackRate: rate(
          Object.values(data.timerCallbacks || {}).reduce((a, v) => a + v, 0),
          elapsed,
        ),
        classification: classify({ ...data, geometryChanges, consoleErrors }),
      });
      await context.close();
    }
    await writeOutcome({ status: 'completed', library, results });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const blocked = error instanceof BrowserLaunchError;
    await writeOutcome({ status: blocked ? 'blocked' : 'failed', reason });
    console.error(`Diagnostics ${blocked ? 'blocked' : 'failed'}: ${reason}`);
    process.exitCode = error instanceof DiagnosticsError ? error.exitCode : 1;
  } finally {
    await browser?.close();
    if (ownedServer) ownedServer.kill('SIGTERM');
  }
}
await main();
