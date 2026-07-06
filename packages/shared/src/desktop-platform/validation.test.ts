import {
  createAutoUpdateStatus,
  createCrashBreadcrumb,
  defaultDesktopSettings,
  normalizeDesktopSettings,
  ubosNativeMenus,
} from './index.js';

function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected)
    throw new Error(`Expected ${String(actual)} to equal ${String(expected)}`);
}

function assertDeepEqual(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
  }
}

function assertOk(value: unknown) {
  if (!value) throw new Error('Expected value to be truthy');
}

const settings = normalizeDesktopSettings({
  controlRoomUrl: '  ',
  recentFiles: ['show.ubos', 'show.ubos', 'intro.mov'],
});
assertEqual(settings.controlRoomUrl, defaultDesktopSettings.controlRoomUrl);
assertDeepEqual(settings.recentFiles, ['show.ubos', 'intro.mov']);

const disabled = createAutoUpdateStatus(
  { ...defaultDesktopSettings, autoUpdateChannel: 'disabled' },
  '2.0.1',
);
assertEqual(disabled.available, false);
assertEqual(disabled.channel, 'disabled');

const available = createAutoUpdateStatus(defaultDesktopSettings, '2.0.1');
assertEqual(available.available, true);
assertEqual(available.version, '2.0.1');

const breadcrumb = createCrashBreadcrumb(
  '  renderer recovered  ',
  { window: 'control-room' },
  '2026-07-06T00:00:00.000Z',
);
assertEqual(breadcrumb.message, 'renderer recovered');
assertEqual(breadcrumb.context.window, 'control-room');

assertOk(ubosNativeMenus.some((menu) => menu.label === 'Production'));
assertOk(ubosNativeMenus.flatMap((menu) => menu.items).some((item) => item.id === 'open_media'));

console.log('desktop platform validation passed');
