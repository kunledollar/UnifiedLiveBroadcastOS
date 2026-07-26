# UBOS Design System (UBDS)

UBDS is the visual operating system of UBOS. It is the presentation-only language for UBOS workspaces — it does not own monitor elements, MediaStreams, production graphs, source acquisition, or execution state.

## UBDS Core Principles

1. **Broadcast clarity** — every color, shadow, and highlight communicates meaning.
2. **Operator hierarchy** — the UI shows what matters first, not everything at once.
3. **Depth over decoration** — gradients, shadows, and elevation serve clarity, never aesthetics alone.
4. **Motion as intelligence** — animations communicate state changes, not distraction.
5. **Semantic color language** — hues map to broadcast roles, never decoration.
6. **Consistency across all workspaces** — Director, Graphics, Audio, Replay, Streaming all follow the same rules.

## Broadcast Color Language

| Hue | Role |
| --- | --- |
| Program Red (`program`) | Live/on-air output |
| Preview Green (`preview`) | Staged/ready output |
| Active Blue (`selection`) | Operator selection / focus |
| Automation Purple (`automation`) | Automation engine / macros / scheduled actions |
| Graphics Cyan (`graphics`) | Graphics composer / overlays / lower-thirds |
| Replay Orange (`replay`) | Replay engine / instant replay / clip review |
| Warning Yellow (`warning`) | Attention required, non-blocking |
| Neutral Gray Layers (`background.graphite/slate/midnight`) | Panel surfaces at increasing elevation |
| Depth Blacks (`background.carbon`) | App background, the lowest layer |

Each of the seven broadcast hues exposes a state ramp — `base`, `hover`, `active`, `elevated`, `dimmed` — so any panel, chip, or control tinted with that hue can express interaction and depth without inventing new colors. `warning` and `critical` (`error`) are universal override tones any panel can escalate into regardless of its base hue, rather than a per-hue state — e.g. an Automation panel reporting a failed macro uses the shared `critical` tone, not a purple/red blend.

Import `@ubos/ui/design-system` for token maps and import `@ubos/ui/design-system/theme/css-variables.css` once in the application shell. Use semantic status names (`program`, `preview`, `selected`/`focus` for Active Blue, `automation`, `graphics`, `replay`, `ready`, `warning`, `critical`, `recording`, `streaming`, `offline`, `idle`, `disabled`, `information`, `success`, `armed`, and `blocked`) rather than pigment names.

## Typography Hierarchy

Canonical UBDS roles (`ubosTypographyClasses`):

- **Title** (`title`) — uppercase, medium weight. Panel/workspace-level headings.
- **Section Label** (`sectionLabel`) — uppercase, small caps. Groups related controls.
- **Body** (`body`) — light weight, high readability. Primary reading text.
- **Micro-text** (`microText`) — for indicators, timestamps, and inline telemetry.

The existing roles `display`, `section`, `panel`, `caption`, `metadata`, `mono`, and `broadcastLabel` remain available for incremental migration. Use `broadcastLabel` only for operational labels such as PROGRAM, PREVIEW, LIVE, and REC.

## Elevation System

Panels are placed on one of five levels (`ubosElevation`, `ubosElevationClasses`), each combining background, shadow, border, and — from level 2 up — a subtle top-light gradient:

- **Level 0** — background (the app surface itself; nothing floats).
- **Level 1** — standard panel (default resting panel).
- **Level 2** — active panel (focus or an in-progress operation).
- **Level 3** — highlighted panel (operator-selected / emphasized panel).
- **Level 4** — critical panel (failure, blocking alert, or on-air panel).

## Motion System

Five motion primitives (`ubosMotionSystem`) communicate state changes, never decoration:

- **pulse** — predicted activation / recording tally.
- **glow** — active selection / focus.
- **slide** — transitions between states.
- **fade** — dimming / de-emphasis.
- **shake** — warnings requiring immediate attention.

## Spacing System

An 8px-rooted rhythm (`ubosRhythm`): micro `4px`, small `8px`, medium `12px`, large `16px`, extra large `24px`. All layout should align to this scale.

## Components

* **BroadcastPanel** provides a consistent header, icon, title, subtitle, status, actions, body, footer, loading, empty, warning, and error presentation. Collapse/maximize/overflow controls are supplied through `actions` so workspaces retain their local presentation state.
* **EnterpriseCard** standardizes padding, hover, selection, focus, and optional status badges for scene, source, platform, guest, timeline, analytics, and operator cards.
* **StatusBadge** maps operational statuses to accessible semantic colors and can include a tally dot.
* **EnterpriseTable** provides a responsive table frame; consumers supply sortable header controls, selected rows, status cells, actions, loading, and empty content.
* **EnterpriseListRow** is the standard row for rundowns, sources, chat, notifications, logs, operators, and guests.
* **ProgramPreviewOverlay** is metadata-only and can be layered over an existing monitor without changing its ownership or identity.
* **UbosIcon** and `ubosIcons` centralize the workspace icon mapping.

## Usage guidelines

Use CSS variables or design-system utility classes rather than new literal visual values. Keep monitor geometry stable: overlays are absolutely positioned and must never mount, move, or replace Program/Preview nodes. Provide labels for icon-only controls, use native buttons for interactive cards and rows, preserve visible focus, and use `EmptyState` when a collection has no useful content.

## Foundation vs. application

Step 91 established the UBDS foundation described above. Applying UBDS to Triad 2.0, Inspector 2.0, Program Output 2.0, Workspace Themes, and the Operator HUD is scoped to later steps (92–100) — this package intentionally does not re-skin existing Control Room surfaces.
