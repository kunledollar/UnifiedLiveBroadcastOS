# Broadcast Automation & Run of Show

Phase 12 introduces a **metadata-first** broadcast automation and run-of-show foundation for UBOS. This layer prepares professional rundown, cue sheet, macro, and timed-segment workflows without injecting runtime handles into the Production Graph or executing production actions.

## Purpose

UBOS automation should feel like a modern broadcast operating system for show callers and producers (newsroom rundowns, Ross OverDrive / Viz Mosart-style cueing, vMix shortcuts, ATEM macros, theater cue sheets) while remaining:

- Metadata-only in the presentation layer
- Honest when timers, execution, or persistence are unavailable
- Safe for future automation execution integration
- Compatible with existing switching, media, graphics, and collaboration phases

## Run of Show Model

`RunOfShow` is the top-level rundown document:

| Field | Description |
|-------|-------------|
| `id` | Stable rundown identifier |
| `name` | Display name |
| `status` | `draft` · `ready` · `active` · `paused` · `completed` |
| `segments` | Ordered `ShowSegment` list |
| `currentSegmentId` | Metadata pointer to active segment |
| `nextSegmentId` | Metadata pointer to next segment |
| `estimatedDurationMs` | Sum of segment durations |
| `startedAt` | ISO timestamp metadata only |
| `updatedAt` | Last metadata update |

**Honest states:** No run of show configured, Rundown unavailable, No active segment, Automation disabled.

Default sample rundown (`createDefaultRunOfShow()`) includes opening, countdown, intro, guest, media, sponsor, replay, and closing segments for UI development.

## Segment Timeline

`ShowSegment` represents a rundown row:

- `type`: opening, countdown, intro, guest, media, graphics, replay, sponsor, break, closing, custom
- `durationMs`: planned segment length (non-negative)
- `status`: pending, active, completed, skipped
- `notes`: optional producer notes (sanitized text)
- `cues`: attached `ProductionCue` list
- `order`: unique segment order index

`SegmentTimeline` displays current/next segment, estimated show duration, automation mode, and remaining time metadata. **No real timers** are started in Phase 12 — the UI shows "Timer unavailable" when countdown state is not active.

## Cue Model

`ProductionCue` describes a single production action intent:

| Field | Description |
|-------|-------------|
| `type` | scene, graphics, media, replay, audio, output, note, wait, manual |
| `targetType` / `targetId` | Metadata reference to production target |
| `timing` | manual, at_segment_start, offset, countdown |
| `offsetMs` | Offset from segment start or countdown anchor |
| `status` | pending, armed, executed, skipped, failed |
| `requiresConfirmation` | Manual confirmation required before execution |
| `safeForAuto` | Explicitly marked safe for automatic mode |

Cue actions in Phase 12 are **metadata-only**: arm, skip, and mark executed update UI reducer state only. Preview actions call existing preview handlers only when explicitly available.

## Macro Metadata

`AutomationMacro` groups ordered `AutomationMacroStep` entries:

- `mode`: manual, semi_auto, automatic
- `status`: draft, ready, disabled
- `containsRuntimeHandles`: always `false`

Macro panel actions (preview metadata, arm, disable) do **not** execute macro chains in Phase 12.

## Automation Modes

`AutomationMode` values:

| Mode | Behavior in Phase 12 |
|------|----------------------|
| `manual` | Default. All cues require explicit operator action. |
| `semi_auto` | Display mode only. Cues with `requiresConfirmation` stay manual. |
| `automatic` | Display mode only. Only cues marked `safeForAuto` would auto-fire in future phases. |

The UI never pretends automation is actively executing. Status bar and program monitor overlays show the selected mode label as metadata.

## Automation Manifest

`AutomationManifest` bundles:

```typescript
{
  runOfShow: RunOfShow;
  macros: AutomationMacro[];
  cues: ProductionCue[];  // flattened cue index
  automationMode: AutomationMode;
  containsRuntimeHandles: false;
}
```

Created via `createAutomationManifest()` with validation applied.

## Safety Validation

Implemented in `packages/shared/src/broadcast-automation/validation.ts`:

- Reject runtime handle keys (`MediaStream`, `WebRTC`, DOM nodes, timers, file handles, etc.)
- Unique cue IDs across the manifest
- Unique segment order values
- Non-negative durations and offsets
- Sanitized notes and names (unsafe HTML rejected)
- Unknown targets flagged for operator review
- Automatic cues must be explicitly marked `safeForAuto`
- Risky actions require `requiresConfirmation`

Command intents are logged via `createAutomationCommandIntent()` stubs only — no Production Graph dispatch.

## Control Room UI

Automation workspace lives under `apps/web/app/control-room/automation/`:

| Component | Role |
|-----------|------|
| `AutomationWorkspace` | Full operator workstation |
| `RunOfShowPanel` | Vertical rundown list |
| `SegmentTimeline` | Horizontal timeline metadata |
| `CueList` / `CueRow` | Segment cue browser |
| `MacroPanel` / `MacroRow` | Macro metadata browser |
| `CountdownPanel` | Segment/show/cue countdown metadata |
| `AutomationModeSelector` | Manual / Semi-Auto / Auto |
| `AutomationInspector` | Selected segment/cue/macro detail |
| `AutomationMetadataOverlay` | Program monitor rundown strip |
| `AutomationPanel` | Compact panel for dock and operations console |
| `AutomationEmptyState` | Honest empty states |

## Integration Points

- **Workspace profiles:** `automation-operator` (dedicated layout), producer defaults to automation tab/dock
- **Bottom dock:** ROS tab with compact `AutomationPanel`
- **Operations console:** Automation tab
- **Status bar:** Automation mode badge
- **Program monitor:** Current/next segment overlay via `AutomationMetadataOverlay`

Phase 12 does **not** modify Production Graph guarantees, switching logic, WebRTC, recording, streaming, media, or graphics runtimes.

## Runtime Limitations (Phase 12)

- No real segment or show timers
- No cue or macro execution against production subsystems
- No rundown persistence across sessions
- No backend API or database schema changes
- No Production Graph reducer changes
- UI reducer state is ephemeral (metadata actions only)

## Future Automation Execution Integration

Planned follow-on work:

1. Wire `ARM_CUE` / `EXECUTE_CUE` intents to existing scene, graphics, media, and replay handlers
2. Connect segment advancement to show clock and rundown transport
3. Persist run-of-show documents and macro libraries
4. Enforce automation mode policies with authority and lock integration
5. Add countdown sync via production clock / media sync when available
6. Integrate with ENPS/iNEWS-style rundown import/export

Until execution infrastructure is available, all automation UI surfaces honest metadata-only states.
