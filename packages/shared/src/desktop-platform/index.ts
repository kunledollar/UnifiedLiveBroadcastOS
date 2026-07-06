export type DesktopPlatform = 'windows' | 'macos' | 'linux';
export type DesktopTheme = 'system' | 'light' | 'dark';
export type DesktopAutoUpdateChannel = 'stable' | 'beta' | 'disabled';
export type DesktopFileDialogMode = 'openFile' | 'openDirectory' | 'saveFile';

export interface DesktopFileDialogFilter {
  name: string;
  extensions: string[];
}

export interface DesktopFileDialogRequest {
  title: string;
  mode: DesktopFileDialogMode;
  filters: DesktopFileDialogFilter[];
  defaultPath?: string;
  multiple?: boolean;
}

export interface DesktopFileDialogResult {
  canceled: boolean;
  paths: string[];
}

export interface DesktopSettingsSnapshot {
  theme: DesktopTheme;
  controlRoomUrl: string;
  lastWorkspaceId?: string;
  recentFiles: string[];
  crashReportingEnabled: boolean;
  autoUpdateChannel: DesktopAutoUpdateChannel;
}

export interface DesktopAutoUpdateStatus {
  available: boolean;
  channel: DesktopAutoUpdateChannel;
  version?: string;
  notes: string;
}

export interface CrashBreadcrumb {
  message: string;
  timestamp: string;
  context: Record<string, unknown>;
}

export interface DesktopNativeMenuItem {
  id: string;
  label: string;
  accelerator?: string;
  role?: 'quit' | 'close' | 'fullscreen' | 'separator';
}

export interface DesktopNativeMenu {
  label: string;
  items: DesktopNativeMenuItem[];
}

export const defaultDesktopSettings: DesktopSettingsSnapshot = {
  theme: 'system',
  controlRoomUrl: 'http://localhost:3000/control-room',
  recentFiles: [],
  crashReportingEnabled: false,
  autoUpdateChannel: 'stable',
};

export const ubosNativeMenus: DesktopNativeMenu[] = [
  {
    label: 'UBOS',
    items: [
      { id: 'settings', label: 'Settings…', accelerator: 'CmdOrCtrl+,' },
      { id: 'quit', label: 'Quit UBOS', role: 'quit' },
    ],
  },
  {
    label: 'File',
    items: [
      { id: 'open_media', label: 'Open Media…', accelerator: 'CmdOrCtrl+O' },
      { id: 'open_project', label: 'Open Project…', accelerator: 'CmdOrCtrl+Shift+O' },
      { id: 'close', label: 'Close Window', role: 'close' },
    ],
  },
  {
    label: 'Production',
    items: [
      { id: 'go_live', label: 'Go Live', accelerator: 'CmdOrCtrl+L' },
      { id: 'start_recording', label: 'Start Recording', accelerator: 'CmdOrCtrl+R' },
      { id: 'cut_transition', label: 'Cut Transition', accelerator: 'Space' },
    ],
  },
  {
    label: 'View',
    items: [{ id: 'fullscreen', label: 'Toggle Full Screen', role: 'fullscreen' }],
  },
];

export function normalizeDesktopSettings(
  input: Partial<DesktopSettingsSnapshot> = {},
): DesktopSettingsSnapshot {
  const recentFiles = [...new Set(input.recentFiles ?? defaultDesktopSettings.recentFiles)].slice(
    0,
    10,
  );
  return {
    ...defaultDesktopSettings,
    ...input,
    recentFiles,
    controlRoomUrl: input.controlRoomUrl?.trim() || defaultDesktopSettings.controlRoomUrl,
  };
}

export function createCrashBreadcrumb(
  message: string,
  context: Record<string, unknown> = {},
  timestamp = new Date().toISOString(),
): CrashBreadcrumb {
  return { message: message.trim().slice(0, 240), timestamp, context };
}

export function createAutoUpdateStatus(
  settings: DesktopSettingsSnapshot,
  version?: string,
): DesktopAutoUpdateStatus {
  if (settings.autoUpdateChannel === 'disabled') {
    return { available: false, channel: 'disabled', notes: 'Auto-update checks are disabled.' };
  }
  return {
    available: Boolean(version),
    channel: settings.autoUpdateChannel,
    ...(version ? { version } : {}),
    notes: version
      ? `Update ${version} is staged by the configured provider.`
      : 'No update is currently staged.',
  };
}
