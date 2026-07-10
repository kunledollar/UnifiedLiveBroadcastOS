# UBOS 3.15 Workspace Manager — Foundation

A pure, non-intrusive **layout orchestration layer** for the UBOS Control Room.
It registers panels, describes zones and presets, calculates safe geometry, and
persists layout metadata. It ships **no UI** and changes **no existing behaviour**.

## Safety contract (section 0)

- This layer **wraps** existing Control Room components; it never replaces or
  edits them. Program/Preview monitors, camera/capture/media/browser sources,
  audio mixer, graphics, replay, recording, streaming, guest, automation,
  Monitor Wall, Broadcast I/O, and Pipeline Inspector internals are untouched.
- Existing components will eventually be imported and placed inside
  `DockablePanel` wrappers that consume this metadata. If a component does not
  fit the layout, an **adapter wrapper** is created around it — the component
  itself is never edited.
- The registry stores **layout metadata only**. Definitions are validated on
  registration: functions, class instances, DOM nodes, sockets, and any other
  runtime media objects are rejected (`PANEL_NOT_SERIALIZABLE`).
- `ProductionGraph` and all runtime media features are completely untouched.

## Modules

| File             | Contents                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| `types.ts`       | `WorkspaceZoneId`, `WorkspacePanelKind`, `WorkspacePanelDefinition`, `WorkspaceZoneDefinition`, `WorkspacePreset`, layout/result/snapshot types |
| `zones.ts`       | Zone geometry rules for the 1920x1080 reference viewport, responsive collapse thresholds, `clampZoneSize` |
| `panels.ts`      | Canonical panel ids + default layout metadata describing existing Control Room components        |
| `registry.ts`    | `WorkspacePanelRegistry` and the free-function API (`registerPanel`, `getPanel`, `getPanelsForZone`, `togglePanelVisibility`, `togglePanelCollapsed`, `movePanelToZone`) |
| `presets.ts`     | The nine built-in presets (director, solo-streamer, technical-director, audio-engineer, graphics-operator, replay-operator, streaming-operator, monitor-wall, compact) + preset validation |
| `layout.ts`      | Pure geometry calculation (`calculateWorkspaceLayout`) and invariant checking (`validateLayoutResult`) |
| `persistence.ts` | Storage-agnostic layout snapshots (`createLayoutSnapshot`, `serializeLayoutSnapshot`, `parseLayoutSnapshot`, `applyLayoutSnapshot`) |

## Geometry rules (section 2A)

Reference sizes at 1920x1080: top ribbon 56px fixed, left rail 72px fixed,
left dock 260px (220–360, collapses to 0), center stage flexible with a 900px
floor, right dock 320px (260–420, collapses to 0), bottom workspace 260px
(180–420, collapses to a 42px tab bar). `floating` and `external-monitor` are
placeholders with no screen space yet.

Invariants enforced by `calculateWorkspaceLayout` / `validateLayoutResult`:

- Center-stage receives **all** space freed by collapsing docks.
- Program and Preview live inside center-stage and may never be covered by
  docks or the bottom workspace; docks are force-collapsed (right first, then
  left) rather than squeezing center-stage below 900px.
- Below 1440px viewport width the right dock starts collapsed; below 1200px
  the left dock starts collapsed; below 900px Program/Preview stack vertically.

## Usage sketch

```ts
import {
  WorkspacePanelRegistry,
  createDefaultPanelDefinitions,
  workspacePresets,
  calculateWorkspaceLayout,
} from '@ubos/shared';

const registry = new WorkspacePanelRegistry();
for (const panel of createDefaultPanelDefinitions()) registry.registerPanel(panel);

const layout = calculateWorkspaceLayout({
  viewportWidth: 1920,
  viewportHeight: 1080,
  preset: workspacePresets.director,
});
// layout.zones['center-stage'].rect, layout.programRect, layout.previewRect, ...
```

## Testing

`validation.test.ts` compiles to `dist/workspace-manager/validation.test.js`
and runs as part of `pnpm --filter @ubos/shared test`. It covers panel
registration rules, zone geometry, preset consistency, layout invariants
across viewport widths, and snapshot round-trips.
