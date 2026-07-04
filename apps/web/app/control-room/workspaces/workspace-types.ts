import type { DockTabId, NavItemId, OperationsTabId } from '../shell/types';
import type { OutputViewMode } from '../workspace/monitor-state';

export type ProfessionalWorkspaceId =
  | 'director'
  | 'producer'
  | 'audio-engineer'
  | 'podcast'
  | 'interview'
  | 'vertical-creator'
  | 'sports'
  | 'news'
  | 'replay'
  | 'remote-production'
  | 'graphics-operator'
  | 'media-operator'
  | 'automation-operator'
  | 'ai-operator'
  | 'distribution-operator'
  | 'custom';

export type MultiviewLayoutMode =
  | 'program-focus'
  | 'dual-view'
  | 'quad-view'
  | 'six-view'
  | 'eight-view'
  | 'sixteen-view'
  | 'vertical-split'
  | 'podcast-grid'
  | 'producer-dashboard'
  | 'audio-focus'
  | 'replay-focus'
  | 'graphics-focus'
  | 'media-focus'
  | 'collaboration-focus'
  | 'automation-focus'
  | 'ai-focus'
  | 'distribution-focus';

export type WorkspaceProfile = {
  id: ProfessionalWorkspaceId;
  label: string;
  description: string;
  centerLayout: MultiviewLayoutMode;
  defaultViewMode: OutputViewMode;
  defaultOperationsTab: OperationsTabId;
  defaultDockTab: DockTabId;
  defaultNavItem: NavItemId;
  programFlexWeight: number;
};

export type WorkspaceRuntimeState = {
  selectedWorkspace: ProfessionalWorkspaceId;
  centerLayout: MultiviewLayoutMode;
  viewMode: OutputViewMode;
  splitRatio: number;
  operationsWidth: number;
  dockHeight: number;
};

export type SafeAreaToggles = {
  actionSafe: boolean;
  titleSafe: boolean;
  crosshair: boolean;
  verticalGuide: boolean;
  fourThreeGuide: boolean;
};

export const defaultSafeAreaToggles: SafeAreaToggles = {
  actionSafe: true,
  titleSafe: true,
  crosshair: true,
  verticalGuide: false,
  fourThreeGuide: false,
};
