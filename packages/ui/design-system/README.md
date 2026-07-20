# UBOS Enterprise Design System

The design system is the presentation-only language for UBOS workspaces. It does not own monitor elements, MediaStreams, production graphs, source acquisition, or execution state.

## Tokens

Import `@ubos/ui/design-system` for token maps and import `@ubos/ui/design-system/theme/css-variables.css` once in the application shell. Use semantic status names (`program`, `preview`, `ready`, `warning`, `critical`, `recording`, `streaming`, `offline`, `idle`, `disabled`, `selected`, `information`, `success`, `armed`, and `blocked`) rather than pigment names. CSS variables include foreground, borders, spacing, elevation, radii, icon size, overlay opacity, motion, and focus-ring tokens.

Typography roles are `display`, `section`, `panel`, `body`, `metadata`, `caption`, `mono`, and `broadcastLabel`. Use `broadcastLabel` only for operational labels such as PROGRAM, PREVIEW, LIVE, and REC.

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
