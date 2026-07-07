'use client';

/**
 * UBOS 3.15D-3 — Global keyboard shortcut handler for the Command Center.
 *
 * Shortcuts:
 *   Ctrl+K           Open Command Palette
 *   Ctrl+1           Director workspace
 *   Ctrl+2           Audio Engineer workspace
 *   Ctrl+3           Graphics Operator workspace
 *   Ctrl+4           Replay Operator workspace
 *   Ctrl+5           Streaming Operator workspace
 *   Ctrl+Shift+L     Reset Layout
 *   Esc              Close overlays / palette
 *
 * Rules:
 * - Browser-critical shortcuts are not overridden (Ctrl+W, Ctrl+T, Ctrl+R,
 *   Ctrl+F, Ctrl+P are explicitly skipped).
 * - Input, textarea, select elements keep normal keyboard behaviour when
 *   focused unless the shortcut is a non-text key (Esc, F1-F5, Ctrl+…).
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

      // For all Ctrl/Cmd shortcuts, skip if an editable element is focused
      // so operators can still type in form fields.
      if (mod && isEditableTarget(document.activeElement)) return;

      // Ctrl+K — Command Palette
      if (mod && !shiftKey && !altKey && key === 'k') {
        event.preventDefault();
        onOpenCommandPalette();
        return;
      }

      // Ctrl+Shift+L — Reset Layout
      if (mod && shiftKey && !altKey && key.toLowerCase() === 'l') {
        event.preventDefault();
        if (!layoutLocked) onResetLayout();
        return;
      }

      // Ctrl+1…5 — Workspace presets
      if (mod && !shiftKey && !altKey) {
        const preset = DIGIT_TO_PRESET[key];
        if (preset) {
          event.preventDefault();
          if (!layoutLocked) onSelectPreset(preset);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [layoutLocked, onSelectPreset, onResetLayout, onOpenCommandPalette, onCloseOverlays]);
}
