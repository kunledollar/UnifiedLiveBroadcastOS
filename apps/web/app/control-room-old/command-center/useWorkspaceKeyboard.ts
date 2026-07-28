'use client';

/**
 * UBOS 3.15D-3 — Global keyboard shortcut handler for the Command Center.
 *
 * Shortcuts:
 *   Ctrl+K           Open Command Palette
 *   Ctrl+S           Save Layout
 *   Ctrl+1           Director workspace
 *   Ctrl+2           Audio Engineer workspace
 *   Ctrl+3           Graphics Operator workspace
 *   Ctrl+4           Replay Operator workspace
 *   Ctrl+5           Streaming Operator workspace
 *   Ctrl+Shift+L     Reset Layout
 *   Esc              Close overlays / palette
 *   F1               Cut (production transition)
 *   F2               Take (production transition)
 *   F3               Auto (production transition)
 *
 * Rules:
 * - Browser-critical shortcuts are not overridden (Ctrl+W, Ctrl+T, Ctrl+R,
 *   Ctrl+F, Ctrl+P are explicitly skipped).
 * - Input, textarea, select elements keep normal keyboard behaviour when
 *   focused unless the shortcut is a non-text key (Esc, F1–F3, Ctrl+…).
 * - F1/F2/F3 fire even inside form fields (same policy as Esc) so operators
 *   can trigger transitions without moving focus away from a scene name field.
 * - All actions delegate to Workspace Manager only.
 */
import { useEffect } from 'react';
import type { WorkspacePresetId } from '@ubos/shared';

type WorkspaceKeyboardOptions = {
  layoutLocked: boolean;
  onSelectPreset: (presetId: WorkspacePresetId) => void;
  onResetLayout: () => void;
  onOpenCommandPalette: () => void;
  onCloseOverlays: () => void;
  /** Save the current layout to browser storage (Ctrl+S). */
  onSaveLayout?: (() => void) | undefined;
  /** Production transition shortcuts (F1 / F2 / F3). */
  onCut?: (() => void) | undefined;
  onTake?: (() => void) | undefined;
  onAuto?: (() => void) | undefined;
};

/** Preset keyboard map: Ctrl+digit → preset id */
const DIGIT_TO_PRESET: Record<string, WorkspacePresetId> = {
  '1': 'director',
  '2': 'audio-engineer',
  '3': 'graphics-operator',
  '4': 'replay-operator',
  '5': 'streaming-operator',
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target as HTMLElement;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
}

export function useWorkspaceKeyboard({
  layoutLocked,
  onSelectPreset,
  onResetLayout,
  onOpenCommandPalette,
  onCloseOverlays,
  onSaveLayout,
  onCut,
  onTake,
  onAuto,
}: WorkspaceKeyboardOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event;

      // Use either Ctrl or Cmd (macOS)
      const mod = ctrlKey || metaKey;

      // Esc: close overlays — always fires, even in inputs
      if (key === 'Escape' && !mod && !shiftKey && !altKey) {
        onCloseOverlays();
        return;
      }

      // F1/F2/F3 — Cut / Take / Auto production transitions.
      // Fire even in editable targets so operators can trigger transitions
      // without leaving a form field (same policy as Esc).
      if (!mod && !shiftKey && !altKey) {
        if (key === 'F1') { event.preventDefault(); onCut?.(); return; }
        if (key === 'F2') { event.preventDefault(); onTake?.(); return; }
        if (key === 'F3') { event.preventDefault(); onAuto?.(); return; }
      }

      // For all Ctrl/Cmd shortcuts, skip if an editable element is focused
      // so operators can still type in form fields.
      if (mod && isEditableTarget(document.activeElement)) return;

      // Ctrl+K — Command Palette
      if (mod && !shiftKey && !altKey && key === 'k') {
        event.preventDefault();
        onOpenCommandPalette();
        return;
      }

      // Ctrl+S — Save Layout
      if (mod && !shiftKey && !altKey && key === 's') {
        event.preventDefault();
        onSaveLayout?.();
        return;
      }

      // Ctrl+Shift+L — Reset Layout (not blocked by layout lock — lock only
      // prevents manual drag-resize, not authoritative layout reset).
      if (mod && shiftKey && !altKey && key.toLowerCase() === 'l') {
        event.preventDefault();
        onResetLayout();
        return;
      }

      // Ctrl+1…5 — Workspace presets (always allowed; lock only prevents drag-resize)
      if (mod && !shiftKey && !altKey) {
        const preset = DIGIT_TO_PRESET[key];
        if (preset) {
          event.preventDefault();
          onSelectPreset(preset);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [layoutLocked, onSelectPreset, onResetLayout, onOpenCommandPalette, onCloseOverlays, onSaveLayout, onCut, onTake, onAuto]);
}
