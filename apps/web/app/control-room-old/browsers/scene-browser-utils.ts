import { GuestStatus, type Guest, type Scene, type SceneType } from '@ubos/shared';

export type SceneBrowserFilter = 'all' | 'live' | 'preview' | 'ready' | 'issues';
export type SceneBrowserSort = 'order' | 'name' | 'type' | 'status';
export type SceneRowStatus = 'ready' | 'empty' | 'missing' | 'offline' | 'issues';

const layoutLabels = {
  solo: 'Solo Host',
  interview: 'Interview',
  grid: 'Guest Grid',
  screen_share: 'Screen Share',
  vertical_split: 'Vertical Split',
  picture_in_picture: 'Picture-in-Picture',
} as const;

const typeLabels: Record<SceneType, string> = {
  intro: 'Intro',
  countdown: 'Countdown',
  camera: 'Camera',
  interview: 'Interview',
  screen_share: 'Screen Share',
  break: 'Break',
  outro: 'Outro',
  custom: 'Custom',
};

export function getSceneLayoutLabel(scene: Scene) {
  const layout = scene.layout ?? 'picture_in_picture';
  return layoutLabels[layout as keyof typeof layoutLabels] ?? layout;
}

export function getSceneTypeLabel(scene: Scene) {
  return typeLabels[scene.type] ?? scene.type;
}

export function deriveSceneRowStatus(scene: Scene, guests: Guest[]): SceneRowStatus {
  const visibleSources = scene.sources.filter((source) => source.isVisible);
  if (!scene.sources.length) return 'empty';
  if (!visibleSources.length) return 'missing';

  const hasOfflineGuest = visibleSources.some((source) => {
    if (source.type !== 'guest') return false;
    const guestId = String(source.settings?.guestId ?? '');
    const guest = guests.find((item) => item.id === guestId);
    return (
      guest &&
      [GuestStatus.Disconnected, GuestStatus.Removed, GuestStatus.Rejected].includes(guest.status)
    );
  });
  if (hasOfflineGuest) return 'offline';

  const hasIssue = visibleSources.some((source) => {
    const runtimeStatus = String(source.settings?.runtimeStatus ?? '');
    return ['unavailable', 'permission_required', 'offline'].includes(runtimeStatus);
  });
  if (hasIssue) return 'issues';

  return 'ready';
}

export function sceneStatusLabel(status: SceneRowStatus) {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'empty':
      return 'Empty';
    case 'missing':
      return 'Missing sources';
    case 'offline':
      return 'Offline source';
    case 'issues':
      return 'Issues';
  }
}

export function sceneStatusVariant(status: SceneRowStatus) {
  switch (status) {
    case 'ready':
      return 'success' as const;
    case 'empty':
    case 'missing':
      return 'neutral' as const;
    case 'offline':
    case 'issues':
      return 'warning' as const;
  }
}

export function getSceneAspectBadges(scene: Scene) {
  const ratios = scene.canvases.map((canvas) => canvas.aspectRatio);
  if (!ratios.length) return ['16:9'];
  return [...new Set(ratios)];
}

export function filterScenes({
  scenes,
  search,
  filter,
  programSceneId,
  previewSceneId,
  guests,
}: {
  scenes: Scene[];
  search: string;
  filter: SceneBrowserFilter;
  programSceneId: string;
  previewSceneId: string;
  guests: Guest[];
}) {
  const query = search.trim().toLowerCase();
  return scenes.filter((scene) => {
    const isProgram = scene.id === programSceneId || scene.isActive;
    const isPreview = scene.id === previewSceneId;
    const status = deriveSceneRowStatus(scene, guests);

    if (filter === 'live' && !isProgram) return false;
    if (filter === 'preview' && !isPreview) return false;
    if (filter === 'ready' && status !== 'ready') return false;
    if (filter === 'issues' && status === 'ready') return false;

    if (!query) return true;
    return (
      scene.name.toLowerCase().includes(query) ||
      getSceneLayoutLabel(scene).toLowerCase().includes(query) ||
      getSceneTypeLabel(scene).toLowerCase().includes(query)
    );
  });
}

export function sortScenes(scenes: Scene[], sort: SceneBrowserSort, guests: Guest[]) {
  const next = [...scenes];
  switch (sort) {
    case 'name':
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case 'type':
      return next.sort((a, b) => getSceneTypeLabel(a).localeCompare(getSceneTypeLabel(b)));
    case 'status':
      return next.sort(
        (a, b) =>
          sceneStatusLabel(deriveSceneRowStatus(a, guests)).localeCompare(
            sceneStatusLabel(deriveSceneRowStatus(b, guests)),
          ),
      );
    case 'order':
    default:
      return next.sort((a, b) => a.order - b.order);
  }
}
