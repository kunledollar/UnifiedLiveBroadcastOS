# AI Broadcast Assistant

Phase 13 introduces a **metadata-first** AI broadcast assistant foundation for UBOS. The assistant sits on top of automation and production metadata — it observes, summarizes, suggests, and flags risks without executing production actions.

## Purpose

UBOS AI assistance should feel like a modern broadcast producer copilot (newsroom rundown awareness, risk monitoring, scene and guest recommendations) while remaining:

- Advisory-only in this phase
- Honest when inference, analysis, or persistence is unavailable
- Safe for future supervised execution integration
- Metadata-only — no runtime handles in assistant state

AI builds on Phase 12 automation metadata rather than replacing it.

## Assistant State Model

`AIAssistantState` tracks assistant metadata:

| Field | Description |
|-------|-------------|
| `status` | `disabled` · `idle` · `analyzing` · `unavailable` |
| `mode` | `advisory` · `supervised` · `automatic_disabled` |
| `lastUpdated` | ISO timestamp of last metadata update |
| `containsRuntimeHandles` | Always `false` |

**Status bar labels:**

| State | Label |
|-------|-------|
| `disabled` | AI Disabled |
| `unavailable` | AI Unavailable |
| `analyzing` or advisory idle | AI Advisory |
| Other idle | AI Idle |

## Recommendation Model

`AIRecommendation` describes a suggested operator action:

| Field | Description |
|-------|-------------|
| `type` | scene, graphics, audio, media, guest, replay, automation, risk, highlight |
| `title` / `description` | Human-readable suggestion text (sanitized) |
| `confidence` | 0–1 metadata score |
| `riskLevel` | info, warning, critical |
| `targetType` / `targetId` | Metadata reference to production target |
| `requiresApproval` | Always `true` |
| `status` | suggested, accepted, dismissed, unavailable |

Accept and dismiss actions update UI reducer metadata only. **No production commands are dispatched.**

## Risk Signal Model

`AIRiskSignal` surfaces production risk metadata:

- `severity`: info, warning, critical
- `message`: sanitized risk description
- `targetType` / `targetId`: affected production object
- `suggestedAction`: optional operator guidance (metadata only)

Acknowledge removes the signal from the UI list without autonomous response.

## Automation Suggestions

AI recommendations of type `automation` reference Phase 12 cue and segment metadata (for example, arming an intro graphics cue). The assistant suggests; the automation operator executes manually.

## Safety Rules

AI must **never** in Phase 13:

- Switch Program
- Start/stop stream or recording
- Remove guests
- Publish graphics
- Execute automation
- Change routing

All recommendations display **"Requires operator approval"**. `createAICommandIntent()` stubs log metadata actions with `requiresApproval: true`.

## Validation

Implemented in `packages/shared/src/broadcast-ai/validation.ts`:

- Reject runtime handle keys (streams, timers, WebRTC, LLM handles, etc.)
- Unique recommendation IDs
- Sanitized text (no unsafe HTML)
- Confidence bounds 0–1
- All recommendations must require approval
- `automatic_disabled` mode cannot imply autonomous execution

## Control Room UI

AI workspace lives under `apps/web/app/control-room/ai/`:

| Component | Role |
|-----------|------|
| `AIAssistantWorkspace` | Full operator workstation |
| `AIAssistantPanel` | Compact panel for operations console |
| `AIRecommendationList` / `AIRecommendationRow` | Suggested actions browser |
| `AIRiskMonitor` | Production risk signal list |
| `AISafetyPanel` | Forbidden actions and approval rules |
| `AIProductionSummary` | Current production metadata summary |
| `AIEmptyState` | Honest empty states |

## Integration Points

- **Workspace profile:** `ai-operator` with `ai-focus` layout
- **Operations console:** AI tab with `AIAssistantPanel`
- **Status bar:** AI status badge (`AI Disabled`, `AI Idle`, `AI Advisory`, `AI Unavailable`)

Phase 13 does **not** modify Production Graph guarantees, switching, WebRTC, recording, streaming, media, graphics, or automation execution.

## Runtime Limitations (Phase 13)

- No LLM or inference runtime
- No autonomous production execution
- No recommendation persistence across sessions
- No backend API or database schema changes
- Accept/dismiss updates UI reducer state only
- Existing graph `AgentSuggestionNode` infrastructure is not wired in this phase

## Future Integration

Planned follow-on work:

1. Connect to production graph `agentSuggestions` and `MockAgentPlaneAdapter`
2. Wire accept recommendations to existing handler callbacks with explicit operator approval
3. Integrate live telemetry for audio, guest, and output health summaries
4. Add supervised mode policies with authority integration
5. Persist recommendation history and operator decisions
6. Optional highlight/clip suggestion integration with replay buffer metadata

Until inference and execution infrastructure is available, all AI surfaces show honest advisory metadata-only states.
