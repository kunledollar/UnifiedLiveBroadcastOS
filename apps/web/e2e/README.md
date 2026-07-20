# UBOS browser validation

Playwright supplements unit, type, lint, and build checks with a real browser: it captures browser console errors, uncaught page errors, request failures, route rendering, responsive evidence, monitor geometry, and same-workspace monitor identity. A successful `curl` or HTTP 200 response is **not** equivalent to browser validation.

## Prerequisites and commands

Install workspace dependencies with `pnpm install`. The default project launches the locally installed **Microsoft Edge** using Playwright's `msedge` channel; Edge must be installed. It deliberately does not require `playwright install chromium` and does not silently select another browser.

```sh
pnpm --filter @ubos/web exec playwright --version
pnpm --filter @ubos/web test:e2e
pnpm --filter @ubos/web test:e2e:headed
pnpm --filter @ubos/web test:e2e:ui
pnpm --filter @ubos/web test:e2e:debug
pnpm --filter @ubos/web test:e2e:report
pnpm --filter @ubos/web test:e2e:stability
```

The configuration starts `pnpm dev --hostname 127.0.0.1 --port 3000`, reusing an existing server only outside CI. CI can later use a separately configured Chromium project after installing its browser; Edge is intentionally the local default.

## Evidence and policy

Screenshots are written under `apps/web/test-results/artifacts/` with descriptive viewport names. Failed tests retain screenshots, video, and traces there; the HTML report is `apps/web/playwright-report/`. These generated paths are ignored. Screenshot tests are viewport evidence rather than committed visual baselines.

`BrowserErrorCollector` fails every `console.error`, uncaught `pageerror`, and non-aborted failed request; it also detects the Next development overlay. This deliberately catches React key, hydration, render-loop, and ResizeObserver messages. The only ignored request failure is the exact browser navigation cleanup message `net::ERR_ABORTED`.

The fast suite covers implemented Control Room, Sources, and Social Fabric routes. Add a new route by adding its route/heading to `workspace-routes.spec.ts`, then add accessible roles/names first and narrowly scoped `data-testid` values only when needed. Keep selectors independent of CSS layout.

Responsive screenshots cover 1920×1080, 1600×900, 1440×900, and 1280×720. The opt-in stability command defaults to ten minutes and samples monitor geometry every 20 seconds; set `UBOS_STABILITY_MINUTES` for a shorter local diagnostic run.

Identity assertions are valid only within a mounted workspace: Program and Preview elements must remain connected after local interactions. A full Next.js route navigation may remount page DOM, so the tests intentionally do not compare element handles across routes. Shared-layout persistence is a future architectural expectation, not asserted here.
