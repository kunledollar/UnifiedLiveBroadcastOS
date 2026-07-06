# Phase 2.20 — Native Desktop Platform

UBOS now includes a native desktop shell that preserves the existing web-first Control Room architecture. The desktop app embeds the `/control-room` route rather than duplicating studio functionality.

## Scope

- **Shell:** Tauri v2 app in `apps/desktop` for Windows, macOS, and Linux.
- **Native menus:** UBOS, File, Production, and View menus mirror broadcast workflow actions.
- **File dialogs:** A typed `open_file_dialog` command and TypeScript bridge are ready for native open/save workflows.
- **Settings storage:** Shared settings model covers theme, Control Room URL, recent files, crash-reporting opt-in state, and update channel.
- **Auto-update abstraction:** Update state is modeled without binding UBOS to cloud sync or telemetry uploads.
- **Installer configuration:** Tauri bundle targets include MSI/NSIS, DMG/App, Deb/RPM, and AppImage.
- **Crash hooks:** Local breadcrumb hooks capture renderer/native context without uploading telemetry.
- **Demo launch:** `pnpm --filter @ubos/desktop desktop:demo` launches the desktop Control Room shell.

## Architecture

The desktop shell uses Tauri as a thin native host. During development it starts the existing Next.js app and opens `http://localhost:3000/control-room`; production builds run the existing web build as the desktop frontend. Shared TypeScript contracts in `@ubos/shared` keep menus, settings, file dialog requests, updater status, and crash breadcrumb behavior testable outside the native runtime.

## Constraints

- No cloud synchronization is included.
- No telemetry upload endpoint is configured.
- Plugin loading remains out of scope.
- No hardware-specific installers or driver packaging are included.
