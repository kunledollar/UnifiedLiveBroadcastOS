# Control Room Scene Routing and Native Recording UI Trace

Status: PARTIAL — final Windows-host browser certification could not be executed in this container.

## Required commit gate

The requested certification required the current branch to contain commit `590e5b4`. The check `git merge-base --is-ancestor 590e5b4 HEAD` failed because `590e5b4` is not a valid object in this shallow checkout. `git remote -v` returned no configured remotes, so the missing object could not be fetched from this workspace.

Current branch: `work`
Current HEAD: `16a36b94ed3bead7a9bf37fc81cd2457724197b0`

## Browser gate

The requested evidence must come from a locally installed Windows-host Microsoft Edge or Google Chrome executable. This runtime is Linux (`uname -a`: `Linux a433c1373773 6.12.47 #1 SMP Mon Oct 27 10:01:15 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux`). No Edge or Chrome executable was found on PATH, and no `/mnt/c/Program Files...` Windows browser path was available.

Because no required host browser executable was available, Playwright was not installed and no browser was launched. Per the certification instructions, screenshots and MP4 files were not generated, fabricated, rendered, or substituted.

## Genuine browser evidence

No new genuine browser evidence artifacts were created in this run.

The following pre-existing files remain in the artifact directory but were not recertified by this run and are not being claimed as fresh Windows-host browser evidence:

- `artifacts/scene-routing-recording-ui/program-a-preview-b.png`
- `artifacts/scene-routing-recording-ui/program-a-preview-c.png`
- `artifacts/scene-routing-recording-ui/program-c-after-take.png`
- `artifacts/scene-routing-recording-ui/native-recording-panel.png`

## Scene routing verification status

Code-level focused scene-routing and Program ownership tests passed. Real browser validation remains blocked, so the following required browser-only assertions are still unverified in this run:

- Program Scene A and Preview Scene B rendered as genuine pixels.
- Preview changed from Scene B to Scene C without altering Program.
- CUT/TAKE changed Program to Scene C in the real browser.
- Actual Program and Preview `<video>` elements reported distinct `srcObject` ownership for different sources.
- `srcObjectSame` was observed as `false` when Program and Preview used different sources.
- Browser console errors, uncaught exceptions, media errors, and React hydration errors were captured.

## Native Recording verification status

The Native Recording panel was not opened in a real browser in this run. Recording readiness or visible blocked reason could not be inspected. No `recording-running.png`, `recording-finished.png`, or `recording-sample.mp4` was created.

## Checks completed

- PASS: `pnpm --filter @ubos/shared build`
- PASS: `pnpm --filter @ubos/web typecheck`
- PASS: `pnpm --filter @ubos/web exec tsc -p tsconfig.test.json && node --test apps/web/dist-test/app/control-room/workspace/scene-routing.test.js apps/web/dist-test/lib/program-pipeline/program-ownership.test.js` (Node emitted a module type warning, but all 33 tests passed.)
- PASS: `git diff --check`

## Result

PARTIAL — remaining blocker: the workspace lacks both the required commit object `590e5b4` and a locally installed Windows-host Edge/Chrome executable, so the requested genuine browser certification cannot be completed from this environment.
