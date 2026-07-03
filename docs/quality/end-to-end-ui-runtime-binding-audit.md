# End-to-End UI Runtime Binding Audit

## Scope

Audited the Control Room route, monitor/compositor UI, Production Dock, destination/chat/health panels, and collaboration panel for user-visible placeholder, mock, demo, static, and hardcoded production values.

## Placeholder findings and changes

- Removed production-mode demo destination cards such as YouTube Main, Facebook Page, TikTok Vertical, and Custom RTMP from the Control Room page. The destination panel now receives an empty runtime list until real streaming destination state is configured.
- Removed production-mode demo chat messages including canned viewer feedback. Unified Chat now renders an empty connector state when no chat integration is configured.
- Removed production-mode static stream health metrics. Stream Health now renders an honest “No runtime metrics available” state when runtime metrics are absent.
- Removed static audio mixer levels from the Control Room route. Production Dock now displays an empty audio-runtime-channel state until real runtime channel metadata is supplied.
- Replaced static monitor FPS labels with “FPS unavailable” or “Unavailable” so the UI does not imply measured 60 FPS without runtime telemetry.
- Replaced REC/RTMP/YouTube monitor badges that were marked as UI-only with explicit idle/unavailable labels.
- Replaced the source empty-state language so source records are described as metadata until a capture/runtime is available.
- Gated mock Production Team operators, command activity, notifications, and local simulated diagnostics behind explicit demo/operator flags. Production mode now shows no connected operators and empty collaboration states.
- Replaced top-bar static LIVE/REC assertions and computed fake FPS/CPU/upload values with state-derived/live-idle labels and unavailable metric values.

## Intentionally mock/dev-only areas

- Production Team local simulation remains available only when `NEXT_PUBLIC_UBOS_DEMO_MODE=true` or `NEXT_PUBLIC_UBOS_SHOW_MOCK_OPERATORS=true`.
- Existing developer inspectors continue to expose mock/dry-run runtime internals where those runtime foundations are intentionally metadata-only. These are labeled as mock, dry-run, feature disabled, unavailable, or diagnostics-only in the inspector text.
- Media execution still uses the existing mock media adapter by default; this audit did not introduce a new architecture layer or serialize runtime handles into the Production Graph.

## Feature flags for demo/mock UI

- `NEXT_PUBLIC_UBOS_DEMO_MODE`: enables broad demo-mode behavior such as mock Production Team data.
- `NEXT_PUBLIC_UBOS_SHOW_MOCK_OPERATORS`: enables local mock collaboration operators without enabling all demo UI.
- `NEXT_PUBLIC_UBOS_SHOW_MOCK_CHAT`: reserved for explicit mock chat display; production defaults should keep chat empty unless connectors are configured.
- `NEXT_PUBLIC_UBOS_SHOW_MOCK_DESTINATIONS`: reserved for explicit mock destination display; production defaults should keep destinations empty unless streaming runtime destinations are configured.
- `NEXT_PUBLIC_UBOS_SHOW_MOCK_METRICS`: reserved for explicit mock metric display; production defaults should show unavailable metrics unless runtime telemetry exists.

## Known limitations

- Destination, chat, and audio runtime adapters are not fully wired into the Control Room server route in this pass; the visible UI now presents honest empty states instead of fake connected data.
- Browser media capture remains permission- and device-dependent in Host Devices and media execution inspectors.
- Recording and streaming runtime dashboards are diagnostic/metadata-first unless their existing real-runtime feature flags are enabled.
- Collaboration persistence exists, but no live multi-operator transport is connected by default in production mode.

## Manual QA steps

1. Run `pnpm lint`.
2. Run `pnpm typecheck`.
3. Run `pnpm build`.
4. Run `pnpm test`.
5. Run `pnpm dev` and open `http://localhost:3000/control-room`.
6. Confirm no fake chat messages appear in production mode.
7. Confirm no fake destinations appear in production mode.
8. Confirm no fake operators appear unless `NEXT_PUBLIC_UBOS_DEMO_MODE=true` or `NEXT_PUBLIC_UBOS_SHOW_MOCK_OPERATORS=true`.
9. Confirm Add Scene, Select Scene, Preview, TAKE/CUT, and Add Source continue to operate through existing server actions and production state.
10. Confirm Host Devices reports real browser permission/device state or unavailable errors.
11. Confirm REC, LIVE, stream health, audio mixer, and runtime diagnostics are idle, unavailable, disabled, mock, or live based on real runtime state rather than hardcoded production claims.

## Next recommended implementation work

- Add real server-side loaders for configured streaming destinations and chat connectors, then pass those runtime-backed values into the existing panels.
- Feed real audio runtime channel/meter metadata into `ProductionDock` instead of the current empty production default.
- Promote top-bar health metrics from unavailable to runtime telemetry once Production Engine/runtime supervisors expose measured FPS, CPU, dropped frames, and upload bitrate to the route.
- Add automated Playwright coverage for production-mode absence of mock chat, destinations, operators, and static metric labels.
