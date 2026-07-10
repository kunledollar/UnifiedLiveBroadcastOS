import type {
  DesktopAutoUpdateStatus,
  DesktopFileDialogRequest,
  DesktopFileDialogResult,
  DesktopSettingsSnapshot,
} from '@ubos/shared';

export interface UbosDesktopBridge {
  openFileDialog(request: DesktopFileDialogRequest): Promise<DesktopFileDialogResult>;
  readSettings(): Promise<DesktopSettingsSnapshot>;
  writeSettings(settings: DesktopSettingsSnapshot): Promise<DesktopSettingsSnapshot>;
  checkForUpdates(): Promise<DesktopAutoUpdateStatus>;
  reportCrashBreadcrumb(message: string, context?: Record<string, unknown>): Promise<void>;
}

async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

export const tauriDesktopBridge: UbosDesktopBridge = {
  openFileDialog(request) {
    return invokeCommand('open_file_dialog', { request });
  },
  readSettings() {
    return invokeCommand('read_settings');
  },
  writeSettings(settings) {
    return invokeCommand('write_settings', { settings });
  },
  checkForUpdates() {
    return invokeCommand('check_for_updates');
  },
  reportCrashBreadcrumb(message, context = {}) {
    return invokeCommand('report_crash_breadcrumb', { message, context });
  },
};
