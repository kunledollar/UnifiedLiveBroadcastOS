import type { LayoutFocusMode } from '../workspaces/workspace-types';

export const DOCK_TAB_HEIGHT_PX = 44;
export const DOCK_CONTENT_MIN_PX = 120;
export const DOCK_CONTENT_MAX_PX = 360;
export const DOCK_CONTENT_DEFAULT_PX = 160;
export const DOCK_TOTAL_DEFAULT_PX = DOCK_TAB_HEIGHT_PX + DOCK_CONTENT_DEFAULT_PX;

export function clampDockContentHeight(value: number) {
  return Math.min(Math.max(Math.round(value), DOCK_CONTENT_MIN_PX), DOCK_CONTENT_MAX_PX);
}

export function dockTotalHeightPx(contentHeightPx: number) {
  return DOCK_TAB_HEIGHT_PX + clampDockContentHeight(contentHeightPx);
}

export function dockContentFromTotal(totalPx: number) {
  return clampDockContentHeight(totalPx - DOCK_TAB_HEIGHT_PX);
}

export function switcherHeightForLayout(layoutFocus: LayoutFocusMode, compactChrome: boolean) {
  if (compactChrome) return '9rem';
  if (layoutFocus === 'audio') return '8rem';
  if (layoutFocus === 'switcher') return '12rem';
  return '11.5rem';
}

export function statusBarHeightForLayout(compactChrome: boolean) {
  return compactChrome ? '1.75rem' : '2rem';
}

export function shouldShowBottomDock(layoutFocus: LayoutFocusMode) {
  return layoutFocus !== 'switcher';
}

export function shouldShowRightConsole(layoutFocus: LayoutFocusMode) {
  return layoutFocus !== 'switcher';
}

export function preferredDockContentHeight(
  layoutFocus: LayoutFocusMode,
  storedContentHeightPx: number,
) {
  if (layoutFocus === 'audio') {
    return Math.max(storedContentHeightPx, 240);
  }
  return storedContentHeightPx;
}
