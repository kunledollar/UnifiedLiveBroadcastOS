'use client';

/**
 * Pop-out window manager for external monitor zones.
 *
 * Opens Program, Preview, or Multiview panels in a dedicated chromeless
 * browser window via /external/<panel> routes. No shell, no dock, no
 * workspace chrome — only the panel content.
 *
 * window.open() target names are stable so re-clicking the button
 * focuses an already-open window instead of opening a duplicate.
 */

export type PopOutPanelType = 'program' | 'preview' | 'multiview';

const WINDOW_TARGETS: Record<PopOutPanelType, string> = {
  program: 'ubos-external-program',
  preview: 'ubos-external-preview',
  multiview: 'ubos-external-multiview',
};

const WINDOW_FEATURES = [
  'menubar=no',
  'toolbar=no',
  'location=no',
  'status=no',
  'scrollbars=no',
  'resizable=yes',
  'width=1280',
  'height=720',
].join(',');

/**
 * Opens or focuses the external monitor window for the given panel type.
 *
 * Returns the opened Window reference, or null if the browser blocked the
 * pop-up (e.g. not triggered from a user gesture or pop-ups blocked).
 */
export function openPopOutWindow(panel: PopOutPanelType): Window | null {
  const url = `/external/${panel}`;
  const target = WINDOW_TARGETS[panel];

  const win = window.open(url, target, WINDOW_FEATURES);

  if (win) {
    win.focus();
  }

  return win;
}
