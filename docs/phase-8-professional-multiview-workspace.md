# Phase 8 — Professional MultiView & Workspace System

Phase 8 transforms the UBOS Control Room from a single fixed layout into a **role-based broadcast operating system**. All changes are presentation-layer only; production graph, switching, routing, guests, media, persistence, and APIs are unchanged.

## What Changed

### Before

- One center layout (`OutputViewRenderer`) for every operator.
- Five legacy workspace presets (`default`, `broadcast`, `compact`, `interview`, `streaming`) in a Tools dropdown.
- Simple safe-area on/off toggle.

### After

- **11 professional workspaces** selectable from the status bar without interrupting production.
- **Workspace-specific center layouts** with program-dominant grids, resizable splits, and honest unavailable states.
- **Reusable workspace architecture** for multiview cells, panels, persistence snapshots, and future saved layouts.

## Built-in Workspaces

| Workspace | Center layout | Default focus |
| --------- | ------------- | ------------- |
| Director | Program + operations stack + preview | Program switching |
| Producer | Program + guests/outputs/graphics/inspector/chat | Production management |
| Audio Engineer | Compact program + digital audio console | Mixing |
| Podcast | Program + guest monitors + audio/chat | Multi-guest |
| Interview | Program + preview dual view | Dual monitoring |
| Vertical Creator | Vertical + horizontal + preview + comments/media | 9:16 social |
| Sports | Program + replay/scoreboard/clock/graphics/stats | Live sports |
| News | Program + teleprompter/breaking/ticker/graphics/outputs | Newsroom |
| Replay | Program + replay/clip browser/playlist/slow-mo/markers | Replay operator |
| Remote Production | Confidence + program/preview/aux quad | Distributed prod |
| Custom | User-selected output view mode | Operator baseline |

Shared chrome is preserved on every workspace: status bar, left navigation, switcher, bottom dock, and right operations console.

## Reusable Components

| Component | Purpose |
| --------- | ------- |
| `WorkspaceSelector` | Header workspace picker |
| `WorkspaceManager` / `applyWorkspaceProfile` | Apply role defaults (view mode, nav, ops tab, dock tab) |
| `WorkspaceLayout` | Fade transition wrapper on workspace switch |
| `WorkspaceCenterLayout` | Routes to role-specific center content |
| `MultiViewRenderer` | Single monitor cell (program, preview, guest, replay, etc.) |
| `MonitorGrid` | Grid layouts (dual, quad, podcast, producer, replay) |
| `ResizableSplit` | Program/preview and console splits |
| `WorkspacePanel` | Reusable titled panel shell |
| `SafeAreaControls` | Action/title/crosshair/9:16/4:3 toggles |
| `workspace-persistence.ts` | Snapshot schema for future saved workspaces |

## Safe Areas

Monitors support toggles for:

- Action safe
- Title safe
- Center crosshair
- Vertical (9:16) guide
- 4:3 guide

Unavailable subsystems always show honest empty states (`Unavailable`, `Offline`, `Not configured`) — never simulated production data.

## Adding a New Workspace

1. Add an id to `ProfessionalWorkspaceId` in `workspace-types.ts`.
2. Add a profile in `workspace-presets.ts` with defaults for view mode, nav, operations tab, dock tab, and `centerLayout`.
3. Implement center content in `WorkspaceCenterLayout.tsx` (or extract a dedicated `*Workspace.tsx` file).
4. Register the profile in `workspaceProfileList` — it appears automatically in `WorkspaceSelector`.

Persistence can later serialize panel sizes and visibility via `WorkspacePersistenceSnapshot` without changing workspace components.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Open `/control-room`, switch workspaces from the status bar, and confirm:

- Production state (program/preview scenes, switcher) is unchanged across switches.
- Program monitor remains visually dominant.
- No page-level scrolling is introduced.
- Center content fades between workspaces without layout shift in the shell chrome.

## Storage

- Workspace state key: `ubos.controlRoom.workspace.v2`
- Legacy `v1` presets are migrated via `normalizeWorkspaceId`
