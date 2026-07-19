# UBOS Completion Report

## 2026-07-17 — Forensic Repair of Global Scene Flicker and Continuous State Writes

Status: PARTIAL

### Exact Repeated State Writer

The repeated state writer was the Control Room scene refresh boundary that accepted semantically identical cloned scene graphs. `patchCaptureSourceStatus()` and reconciliation callers could propose a new top-level scenes array with equivalent scene/source state; the old guard only rejected identical scene references, so equivalent clones still reached `setScenes()`.

A second no-op writer was native recording runtime polling: unchanged `/api/native-runtime/status` responses produced newly allocated `NativeRecordingPanelState` objects every poll.

### Calls Per 10 Seconds Before / After

| State writer                                          |                                                                    Before |                                                                                   After |
| ----------------------------------------------------- | ------------------------------------------------------------------------: | --------------------------------------------------------------------------------------: |
| `setScenes` through cloned no-op scene reconciliation | 100 simulated no-op reconciliation writes were accepted across 100 cycles | 0 committed scene writes across 100 cycles; the same scene graph reference is preserved |
| `setNativeRecordingState` runtime polling             |       2 equivalent object writes per 10 seconds when status was unchanged |                              0 committed writes per 10 seconds when status is unchanged |
| `setLiveSourceStreams` same-stream retention          |      Possible equivalent same-stream replacement on repeated retain calls |                                                        0 same-stream replacement writes |

### Exact Competing Owner / Effect

The competing ownership was not a second UI owner of Program/Preview geometry. It was scene runtime health reconciliation (`patchCaptureSourceStatus:*`, local media restore/screen permission state, and scene refresh) competing with derived scene readiness by persisting unchanged source status back into scene state. Native runtime polling was a separate unchanged-state polling writer.

### Files Changed

- `apps/web/app/control-room/scene-workspace.tsx`
- `apps/web/app/control-room/scene-runtime-patching.ts`
- `apps/web/app/control-room/scene-runtime-patching.test.ts`
- `docs/handover/implementation/13-UBOS-IMPLEMENTATION-JOURNAL.md`
- `.codex/COMPLETION-REPORT.md`

### Tests

- PASS: `pnpm --filter @ubos/shared test`
- PASS: `pnpm --filter @ubos/web test`
- PASS: `pnpm --filter @ubos/web typecheck`
- PASS: `git diff --check`

### Local Diagnostic Instructions

Enable the browser write summary locally:

```js
localStorage.setItem('ubos.debug.stateWrites', '1');
```

Then reload `/control-room`. The console prints a concise state-write table every five seconds. Disable it with:

```js
localStorage.removeItem('ubos.debug.stateWrites');
```

### Browser Acceptance

PENDING in this container. A Windows operator must verify `/control-room` remains visually still and interactive for two minutes, then switch scenes, start screen capture, and relink media with no renewed continuous loop.

### Commit

Recorded in current branch history after local commit.
