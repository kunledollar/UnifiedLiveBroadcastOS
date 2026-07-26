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

Canonical UBDS roles (`ubosTypographyClasses`, `ubdsTypographyRoles`):

- **Title** (`title`) — uppercase, medium weight. Panel/workspace-level headings.
- **Section Label** (`sectionLabel`) — uppercase, small caps. Groups related controls.
- **Body** (`body`) — readable weight, neutral color. Primary reading text.
- **Micro-text** (`microText`) — minimal weight, for indicators, timestamps, and inline telemetry.
- **HUD Text** (`hud`) — bold, uppercase, with a legibility drop shadow for text rendered over live video (operator HUD overlays, monitor tallies). Deliberately has no baked-in color — it is color-semantic aware, so pair it with the relevant hue's `-text` class (e.g. `text-ubos-program-text`) at the call site.
- **Intelligence Text** (`intelligence`) — medium weight, for fused insights, operator guidance, and predictive hints. Pairs with the UI Intelligence Integration Layer's signal classes (below) for the warning-is-bold / prediction-is-italic treatments rather than baking a single fixed style.

The existing roles `display`, `section`, `panel`, `caption`, `metadata`, `mono`, and `broadcastLabel` remain available for incremental migration. Use `broadcastLabel` only for operational labels such as PROGRAM, PREVIEW, LIVE, and REC.

### Typography + Intelligence Integration

`apps/web/app/control-room/intelligence-graph/ui-intelligence.css` maps each UI Intelligence Integration Layer signal (Step 90) to a color treatment (Step 92), a text treatment (Step 93), an elevation level (Step 94), a gradient shape (Step 95), a motion treatment (Step 96), and a padding tier (Step 97), since these classes are applied to zone wrapper elements and `font-weight`/`font-style`/`text-shadow`/`padding` are either inheritable or a well-behaved inset (the global Tailwind reset applies `box-sizing: border-box`):

- **highlight** → Program Red + bold text + Level 3 depth + Radial Highlight Gradient + glow-in transition and a one-shot elevate rise + spacious (16px) padding (critical severity).
- **warn** → Warning Yellow + bold text + Level 4 depth with a thick 2px outline + Critical Gradient + a one-shot shake + cinematic (24px) padding, the most spacious tier.
- **pulse** → Warning Yellow + an animated glow that includes a `text-shadow` pulse, not just the box glow + Level 3 depth + Radial Highlight Gradient, on the elastic timing curve + a slight padding expansion (12px → 14px) synced to the same animation — breathing, not a fixed tier.
- **prepare** → Warning Yellow + italic text + Level 2 depth + Linear Depth Gradient + a subtle (quicker, less pronounced than highlight's) glow-in transition + standard/medium (12px) padding (a standing prediction, not yet confirmed).
- **elevated** → the existing success tone (no text treatment — elevation is chrome-level, not a text state) + Level 3 depth + Radial Highlight Gradient + a one-shot elevate rise + large/spacious (16px) padding.
- **dim** → reduced opacity + Level 1 depth, flat (no gradient), fading in on a linear curve + tight/small (8px) padding.
- **suppress** → reduced opacity/desaturation plus a size step toward micro-text, per "suppress → micro-text or hidden" + Level 0 (no shadow at all — it recedes to the background), flat (no gradient), same linear fade-in as `dim` + micro (4px) padding, the tightest tier.

An element's own explicit typography class (e.g. `font-semibold` on a heading) still wins over the inherited wrapper value — this is a subtle default, not an override.

## Elevation System

Panels are placed on one of five levels (`ubosElevation`, `ubosElevationClasses`, `ubosElevationLevels`), each combining a background depth color, a shadow, a border (color + width), and — from Level 2 up — a gradient:

| Level | Name | Shadow | Gradient | Border | Used for |
| --- | --- | --- | --- | --- | --- |
| 0 | Background Layer | none | flat | none | Workspace shell, neutral / non-interactive zones |
| 1 | Standard Panel | soft | flat | thin neutral | Normal panels, inactive sections |
| 2 | Active Panel | medium | subtle | thin neutral | Selected panel, operator focus, active workspace |
| 3 | Highlighted Panel | strong | directional | colored (semantic) | Intelligence-highlighted zones, predicted transitions/activations |
| 4 | Critical Panel | hard | high-contrast | thick (2px), critical | Warnings, degraded output, routing failures, audio clipping, live program danger |

The `borderWidth` field on `UbosElevationToken` is `1` for every level except Level 4, which is `2` (the only "thick" border) — this matches `ubosElevationClasses[4]` using `border-2` while every other level uses `border`. Shadow strength follows a `soft → medium → strong → hard` progression (`ubosShadows.soft/medium/strong/hard`) so Level 1 through Level 4 are always visually distinguishable at a glance, independent of hue.

### Elevation + Intelligence Integration

The same `ubos-*` classes described above under Typography + Intelligence Integration also carry an elevation depth (`ubosIntelligenceElevationMap`): `highlight`/`pulse`/`elevate` → Level 3, `warn` → Level 4, `prepare` → Level 2, `dim` → Level 1, `suppress` → Level 0. The depth contribution is a color-neutral shadow (`--ubos-depth-1/2/3/4`, mirroring `ubosShadows.soft/medium/strong/hard`) layered underneath the signal's own colored glow, so elevation and color semantics never fight each other — a warning stays Warning Yellow at Level 4 depth, not "critical red" just because Level 4 is nominally the most severe level.

## Gradient System

Depth is UBDS's visual physics — how panels sit in space, rise above others, or recede into the background — and gradients are its directional lighting. UBDS uses three canonical gradient shapes (`ubosGradients`, `tokens/gradients.ts`), always subtle and cinematic, never neon or glossy:

| Gradient | Shape | Used for | Elevation level |
| --- | --- | --- | --- |
| Linear Depth Gradient (`linear`) | Top-down `linear-gradient` | Elevation, active panels, workspace shells | Level 2 |
| Radial Highlight Gradient (`radialHighlight`) | `radial-gradient` blooming from above | Intelligence highlights, predicted transitions | Level 3 |
| Critical Gradient (`critical`) | Top-down `linear-gradient` toward a critical-red wash | Warnings, degraded output, routing failures | Level 4 |

`ubosElevationGradientType` records which shape each level uses (`0`/`1` are flat — Depth Blacks with no gradient). Level 3 deliberately uses a *radial*, not linear, gradient — a highlighted or predicted-to-change panel should feel like it's glowing from a point, not just lit from above like a merely "active" Level 2 panel. The Critical Gradient tints toward the shared `error`/critical tone (`ubosColors.error.muted`), not Program Red — a warning is not the same meaning as a live program tally, even though both are "red-family" colors.

Three ready-to-use CSS classes apply these directly: `.ubos-gradient-linear`, `.ubos-gradient-radial-highlight`, `.ubos-gradient-critical`.

## Motion System

Six motion primitives (`ubosMotionSystem`) communicate state changes, never decoration:

- **pulse** — predicted activation / recording tally.
- **glow** — active panels, elevated panels, intelligence highlights.
- **slide** — workspace transitions, panel reveals, inspector sections.
- **fade** — dimming, suppression, low-priority UI.
- **shake** — warnings, routing failures, audio clipping.
- **elevate** — a panel rising into an active/critical/emphasized state (Step 96).

### Motion Timing Curves

Cinematic curves, not web-app defaults (`ubosMotionCurves`) — named by the state they serve, since the same curve *shape* means something different depending on context:

| Curve | Shape | Used for |
| --- | --- | --- |
| `highlight` | Fast-in / slow-out (`ubosEasing.out`) | Highlights snap to attention, then settle |
| `warning` | Slow-in / fast-out (`ubosEasing.in`) | Warnings build urgency, then resolve sharply |
| `fade` | Linear | Fades/de-emphasis feel mechanical, not eased |
| `pulse` | Elastic overshoot (`ubosEasing.spring`) | Pulses only |
| `workspaceTransition` | Ease-in (`ubosEasing.in`) | Workspace transitions accelerate into the new state |

### Motion + Intelligence Integration

`ubosIntelligenceMotionMap` records which primitive(s) each UIIL signal uses, applied in `ui-intelligence.css` alongside the color/text/elevation/gradient treatments above: `highlight` → glow + elevate, `warn` → shake, `pulse` → pulse (on the elastic curve), `prepare` → subtle glow, `dim`/`suppress` → fade (on the linear curve), `elevate` → elevate. The one-shot animations (`elevate`, `shake`) play once when a signal class is newly applied to an element — motion must be subtle, so nothing loops except `pulse`, which represents a standing prediction rather than a one-time event. The workspace shell (`.ubos-workspace-shell-v2.ubos-elevated`) explicitly disables the transform-based elevate rise (it would shift the entire viewport) and keeps only the box-shadow transition.

## Spacing System

A six-level, 4px-rooted rhythm grid (`ubosRhythm`): micro `4px`, small `8px`, medium `12px`, large `16px`, xlarge `24px`, xxlarge `32px` (Step 97 added the sixth level). All layout should align to this scale.

### Padding Hierarchy

Padding communicates importance — more important panels get more breathing room (`ubosPadding`):

| Tier | Value | Used for |
| --- | --- | --- |
| `tight` | 8px | Metadata, micro-text, indicators |
| `standard` | 12px | Normal panels, inspector sections |
| `spacious` | 16px | Active panels, highlighted panels |
| `cinematic` | 24px | Director workspace, program output, replay workspace |

### Density Modes

The same spacing scale, scaled by a multiplier for the operator's context (`ubosDensity`, `ubosScaleSpacing`) — not a second parallel scale:

| Mode | Multiplier | Used for |
| --- | --- | --- |
| `compact` | ×0.75 | Solo streamers, laptop setups, small monitors |
| `standard` | ×1.0 | Most operators, standard control rooms |
| `director` | ×1.2 | Large monitors, multi-monitor setups, high-clarity workflows |

`ubosScaleSpacing(remValue, mode)` scales any rem-based spacing token by a density's multiplier and returns a rem string, so density scaling composes with the existing scale rather than requiring a parallel one.

### Spacing + Intelligence Integration

`ubosIntelligenceSpacingMap` records which padding tier each UIIL signal uses (`highlight` → spacious, `warn` → cinematic, `prepare` → medium, `dim` → small, `suppress` → micro, `elevate` → large), applied in `ui-intelligence.css` alongside the color/text/elevation/gradient/motion treatments above. `pulse` has no single static value — its padding animates a slight expansion (12px → 14px) within the same keyframe that already drives its glow, a "breathing" effect rather than a fixed tier, matching motion primitive `pulse` rather than a discrete jump.

## Broadcast Rhythm Grid

The layout engine of UBOS (`ubosGrid`, `tokens/grid.ts`): a 12-column adaptive grid built entirely from existing tokens, not a second parallel scale — `rhythm` is `ubosRhythm.micro` (4px), `gutter` is `ubosRhythm.xlarge` (24px), and `margin` is `ubosRhythm.xxlarge` (32px). Density scaling reuses `ubosScaleSpacing`/`ubosDensity` (Step 97) via the thin wrapper `ubosApplyGridDensity(remValue, mode)` rather than redefining compact/standard/director multipliers a second time.

### Workspace Grid Templates

`ubosWorkspaceGridTemplates` names the three canonical region layouts that Triad 2.0, Inspector 2.0, and Program Output 2.0 apply the rhythm grid to — these are structural vocabulary (a `left`/`center`/`right`/`bottom` region map), not literal CSS Grid areas, since the live geometry engine positions zones with computed pixel rects rather than a declarative CSS grid:

| Template | Left | Center | Right | Bottom |
| --- | --- | --- | --- | --- |
| `triad` | Scene | Graphics | Audio | Program Output (+ an intelligence overlay) |
| `inspector` | Navigation | Inspector body | Metadata | Intelligence bar |
| `programOutput` | Preview | Program | Routing | Intelligence timeline |

### Grid + Intelligence Integration

`ubosIntelligenceGridMap` records which grid action each UIIL signal triggers (`highlight` → expand column, `warn` → increase gutter, `pulse` → rhythmic shift, `prepare` → alignment nudge, `dim` → reduce column, `suppress` → collapse region, `elevate` → increase margin), applied in `ui-intelligence.css` alongside the color/text/elevation/gradient/motion/spacing treatments above. `highlight`, `warn`, and `elevated` already own a `transform`-based motion animation (`ubos-elevate`/`ubos-shake`), so their grid effect uses `outline-offset` instead of a static `transform` — a static `transform` declared alongside a `transform`-animating `forwards` animation would be silently overridden. `prepare`/`dim`/`suppress` have no existing transform, so they use `transform: translateX`/`scaleX`/`scale` directly, and `pulse`'s existing keyframe gains a small `translateX` oscillation alongside its glow.

## Workspace Templates

The assembly step (`ubosWorkspaceTemplates`, `tokens/workspaces.ts`): eight canonical workspace templates, each a named recipe combining a layout (named regions, reusing the Step 98 grid vocabulary), a density mode (Step 97), and accent hues (Step 92):

| Template | Purpose | Layout | Density | Accents |
| --- | --- | --- | --- | --- |
| `director` | Scene control, show flow, transitions, timing | top: HUD, left: scene stack, center: **Triad**, right: **Program Output**, bottom: intelligence timeline | `director` | Program, Preview, Active Blue |
| `technicalDirector` | Routing, switching, multi-camera control | left: camera grid, center: routing matrix, right: **Program Output**, bottom: intelligence warnings | `standard` | Active Blue, Warning |
| `graphics` | Graphics layers, templates, activation, timing | left: graphics library, center: layer stack, right: scene preview, bottom: activation timeline | `standard` | Graphics Cyan, Automation Purple |
| `audio` | Mixing, levels, routing, clipping detection | left: channel list, center: fader grid, right: audio bus routing, bottom: clipping monitor | `standard` | Active Blue, Warning |
| `replay` | Clips, angles, slow-motion, playback control | left: clip bin, center: angle selector, right: **Program Output**, bottom: replay timeline | `standard` | Replay Orange |
| `streaming` | Output health, bitrate, destinations, warnings | left: destination list, center: output health, right: **Program Output**, bottom: warning timeline | `standard` | Warning, Program |
| `solo` | One-person operation, simplified UI | left: scene stack, center: **Program Output**, right: audio/graphics mini panels, bottom: intelligence bar | `compact` | Active Blue, Graphics Cyan |
| `compact` | Small screens, laptops, tablets | center: single-column adaptive stack (collapsible panels, floating intelligence HUD) | `compact` | Neutral, Active Blue |

Regions marked **Triad**/**Program Output** above are literal `ubosWorkspaceGridTemplates` keys (Step 98) — that region hosts the canonical panel template, not a standalone one-off panel. "Routing Blue" and "Audio Blue" from the original brief map onto the existing Active Blue (`selection`) hue rather than introducing new, undefined hues — UBDS has no separate routing/audio color.

This is intentionally a **design-token layer**, not a new runtime workspace registry. The live Control Room already has several overlapping runtime identifiers for "which workspace is active" (`UbosWorkspaceModeId`, `WorkspacePresetId`, `ProfessionalWorkspaceId`, the route catalog's `WorkspaceId`, and `WorkspaceShellRegistry`). Each template's `presetRef` is a documentation-only cross-reference to the closest existing `WorkspacePresetId`, not a functional coupling — wiring a live workspace to render with the matching template's layout/density/accents is application work for a later step, the same relationship Step 92 had to Step 91.

Elevation, motion, spacing, and grid rules are **not** re-specified per workspace, per UBDS principle 6 ("consistency across all workspaces") — every workspace uses the same underlying systems (Steps 94-98); only layout, density, and accent emphasis vary here.

## Workspace Intelligence Themes

Dynamic visual modes (`ubosThemes`, `tokens/themes.ts`) that shift a workspace's color accents, depth, and motion all at once — the six canonical themes (Step 103):

| Theme | Accents | Density | Motion | Depth |
| --- | --- | --- | --- | --- |
| `director` | Program, Preview, Active Blue | `director` | `glow` (predictive transition glow) | Level 3 |
| `graphics` | Graphics Cyan, Automation Purple | `standard` | `pulse` (predicted activations) | Level 2 |
| `audio` | Active Blue, Warning | `standard` | `pulse` (predictive peak pulses) | Level 2 |
| `replay` | Replay Orange | `standard` | `pulse` (predictive clip pulses) | Level 2 |
| `streaming` | Warning, Program | `standard` | `pulse` (predictive frame-drop pulses) | Level 3 |
| `solo` | Active Blue, Graphics Cyan | `compact` | `fade` (reduced motion) | Level 1 |

Each theme's `accents`/`density` are read directly from the matching `ubosWorkspaceTemplates` entry (Step 99) — the *same reference*, not a second copy that could drift — since a theme is what a workspace feels like, not a different set of facts about it. Only `motion` (one of the six canonical primitives) and `depth` (an elevation level, so "strong/medium/light" from the brief maps onto `ubosShadows.strong`/`medium`/`soft`, already-existing tokens, rather than a fourth parallel scale) are genuinely new per-theme decisions. Not every Step 99 workspace gets its own theme: `technicalDirector` shares Director's character, and `compact` is a density mode more than a distinct visual identity.

### Theme + Intelligence Integration

`ubosIntelligenceThemeMap` records how each UIIL signal *modulates* whichever theme is active (`highlight` → increase accent intensity, `warn` → switch to the critical variant, `pulse` → enable predictive motion, `prepare` → enable a gradient shift, `dim` → reduce accent intensity, `suppress` → collapse overlays, `elevate` → increase depth + spacing). These are modifiers, not a second copy of all six themes — `warn`, for example, means "escalate to the existing Level 4 / Critical Gradient treatment" (Step 94/95), which already exists.

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

Step 91 established the UBDS token foundation (color, elevation, motion, spacing, and the first four typography roles). Step 92 applied the broadcast color language to the Triad, Inspector, Program Output, Graphics, Audio, Routing, Replay, Workspace Shell, and Operator HUD surfaces. Step 93 completed the typography hierarchy (HUD Text, Intelligence Text) and wired the intelligence-signal text treatments above. Step 94 refined the elevation model (soft/medium/strong/hard shadow progression, per-level gradients, a thick Level 4 border) and wired the intelligence-signal elevation treatments above. Step 95 formalized the three canonical gradient shapes and assigned one to each elevation level, giving Level 3 a radial highlight bloom and Level 4 a critical-red wash instead of a generic linear gradient. Step 96 completed the motion system with a sixth primitive (`elevate`), named timing curves, and wired the intelligence-signal motion treatments above. Step 97 completed the spacing system (a sixth spacing level, the padding hierarchy, density modes) and wired the intelligence-signal spacing treatments above. Step 98 added the broadcast rhythm grid (a 12-column grid built from the existing rhythm/density tokens, the three canonical workspace grid templates) and wired the intelligence-signal grid treatments above — closing out UBDS's structural physics (color + typography + elevation + depth + motion + spacing + grid). Step 99 is the assembly step: eight canonical workspace templates, each a named recipe of layout + density + accents built entirely from the systems above. Step 103 layers six dynamic Workspace Intelligence Themes on top of those templates (reusing their accents/density directly) plus a motion + depth pairing and an intelligence-driven theme-switching map — completing UBDS's visual intelligence layer. Applying UBDS (and these templates/themes) to Triad 2.0, Inspector 2.0, Program Output 2.0, and the live workspace runtime is scoped to separate application-labeled steps (Steps 100-102 for Triad/Inspector/Program Output specifically) — this package intentionally does not re-skin existing Control Room surfaces beyond the color/typography/elevation/gradient/motion/spacing/grid semantics already applied, nor does it replace the existing runtime workspace identifiers.
