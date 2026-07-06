'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AssetList,
  AssetRow,
  StatusBadge,
} from '@ubos/ui';
import type { Guest, Scene, SceneSource, SceneSourceType } from '@ubos/shared';
import type { TallyState } from '@ubos/ui';
import {
  BrowserSection,
  BrowserToolbar,
  CompactRowActions,
  RowIconButton,
  SceneThumbnail,
} from './BrowserChrome';
import {
  deriveSourceHealth,
  filterSources,
  getSourceTelemetry,
  getSourceTypeLabel,
  sourceAddTypes,
  sourceHealthLabel,
  sourceHealthVariant,
  type SourceHealthFilter,
} from './source-browser-utils';

const sourceTypeIcons: Record<SceneSourceType, string> = {
  camera: '📷',
  screen: '🖥',
  media: '▣',
  overlay: '◈',
  browser: '🌐',
  audio: '🔊',
  guest: '◉',
};

const healthFilters: Array<{ id: SourceHealthFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'ready', label: 'Ready' },
  { id: 'offline', label: 'Offline' },
  { id: 'unavailable', label: 'Unavailable' },
  { id: 'mock', label: 'Mock' },
];

export function SourceBrowser({
  scene,
  sceneName,
  guests,
  sourceTypes,
  isPending = false,
  compact = false,
  tallyState = 'idle',
  directCameraLive = false,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onToggleLock,
  onReloadBrowserSource,
  onToggleMute,
  selectedSourceId,
  onSelectSource,
}: {
  scene: Scene;
  sceneName: string;
  guests: Guest[];
  sourceTypes: SceneSourceType[];
  isPending?: boolean;
  compact?: boolean;
  tallyState?: TallyState;
  directCameraLive?: boolean;
  onAdd?: (input: { sceneId: string; name: string; type: SceneSourceType; url?: string; settings?: Record<string, unknown> }) => void;
  onRename?: (sourceId: string, name: string) => void;
  onDuplicate?: (sourceId: string) => void;
  onDelete?: (sourceId: string) => void;
  onToggleVisibility?: (sourceId: string) => void;
  onToggleLock?: (sourceId: string) => void;
  onReloadBrowserSource?: (sourceId: string) => void;
  onToggleMute?: (sourceId: string) => void;
  selectedSourceId?: string | null;
  onSelectSource?: (sourceId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<SceneSourceType | 'all'>('all');
  const [healthFilter, setHealthFilter] = useState<SourceHealthFilter>('all');
  const [browserUrl, setBrowserUrl] = useState('https://example.com');
  const [browserUrlError, setBrowserUrlError] = useState('');
  const [showBrowserUrlForm, setShowBrowserUrlForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMediaFiles = (fileList: FileList | File[]) => {
    Array.from(fileList).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const kind = file.type.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(ext)
        ? 'video'
        : file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(ext)
          ? 'image'
          : null;
      if (!kind) return;
      const mediaUrl = URL.createObjectURL(file);
      onAdd?.({
        sceneId: scene.id,
        name: file.name,
        type: 'media',
        settings: {
          runtimeStatus: 'live',
          mediaUrl,
          mediaKind: kind,
          filename: file.name,
          fileSize: file.size,
          fileType: file.type || file.name.split('.').pop()?.toLowerCase(),
          autoplay: kind === 'video',
          loop: false,
        },
      });
    });
  };

  const sources = useMemo(
    () => [...scene.sources].sort((a, b) => a.order - b.order),
    [scene.sources],
  );

  const visibleSources = useMemo(
    () =>
      filterSources({
        sources,
        search,
        typeFilter,
        healthFilter,
        guests,
      }),
    [sources, search, typeFilter, healthFilter, guests],
  );

  const typeFilters = useMemo(
    () => [
      { id: 'all', label: 'All' },
      ...sourceTypes.map((type) => ({ id: type, label: getSourceTypeLabel(type) })),
    ],
    [sourceTypes],
  );

  return (
    <BrowserSection {...(compact ? { className: 'gap-1' } : { title: 'Sources' })}>
      {!compact ? (
        <p className="text-ubos-metadata text-ubos-fg-muted">
          Preview scene: <span className="text-ubos-fg-secondary">{sceneName}</span>
        </p>
      ) : (
        <p className="text-[9px] text-ubos-fg-muted">
          PVW: <span className="text-ubos-fg-secondary">{sceneName}</span>
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".mp4,.mov,.webm,.jpg,.jpeg,.png,.gif,video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/gif"
        onChange={(event) => {
          if (event.currentTarget.files) importMediaFiles(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
      <div
        className="flex flex-wrap gap-0.5 rounded-ubos-md border border-dashed border-transparent p-0.5"
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
        onDrop={(event) => { event.preventDefault(); importMediaFiles(event.dataTransfer.files); }}
      >
        {sourceAddTypes
          .filter((type) => sourceTypes.includes(type))
          .map((type) => (
            <RowIconButton
              key={type}
              label={compact ? getSourceTypeLabel(type) : `+ ${getSourceTypeLabel(type)}`}
              {...(compact ? { icon: sourceTypeIcons[type], compact: true } : {})}
              disabled={isPending}
              onClick={() => {
                if (type === 'media') { fileInputRef.current?.click(); return; }
                if (type === 'browser') {
                  setShowBrowserUrlForm(true);
                  setBrowserUrlError('');
                  return;
                }
                onAdd?.({
                  sceneId: scene.id,
                  name: `${getSourceTypeLabel(type)} Source`,
                  type,
                });
              }}
            />
          ))}
      </div>

      {showBrowserUrlForm ? (
        <form
          className="rounded-ubos-md border border-ubos-border-subtle bg-ubos-midnight p-ubos-2"
          onSubmit={(event) => {
            event.preventDefault();
            const rawUrl = browserUrl.trim();
            let normalizedUrl: string;
            try {
              const parsed = new URL(rawUrl);
              if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol');
              normalizedUrl = parsed.toString();
            } catch {
              setBrowserUrlError('Enter a valid http:// or https:// URL for this Browser source.');
              return;
            }
            onAdd?.({
              sceneId: scene.id,
              name: 'Browser Source',
              type: 'browser',
              url: normalizedUrl,
              settings: {
                runtimeStatus: 'loading',
                url: normalizedUrl,
                muted: true,
                lastLoadedAt: null,
                iframeBlockedWarning: 'Some sites block iframe embedding. If the preview stays blank, try another page or use screen capture.',
              },
            });
            setShowBrowserUrlForm(false);
            setBrowserUrlError('');
          }}
        >
          <label className="block text-ubos-metadata font-bold text-ubos-fg-secondary" htmlFor="browser-source-url">
            Browser source URL
          </label>
          <div className="mt-1 flex gap-1">
            <input
              id="browser-source-url"
              value={browserUrl}
              onChange={(event) => setBrowserUrl(event.currentTarget.value)}
              className="min-w-0 flex-1 rounded-ubos-sm border border-ubos-border-subtle bg-ubos-carbon px-2 py-1 text-ubos-caption text-ubos-fg-primary"
              placeholder="https://example.com"
            />
            <button type="submit" disabled={isPending} className="rounded-ubos-sm border border-ubos-border-subtle bg-transparent px-1.5 text-ubos-metadata font-semibold text-ubos-fg-secondary hover:bg-ubos-midnight disabled:opacity-40">Add</button>
            <RowIconButton label="Cancel" onClick={() => { setShowBrowserUrlForm(false); setBrowserUrlError(''); }} />
          </div>
          {browserUrlError ? <p className="mt-1 text-ubos-metadata text-ubos-error-text">{browserUrlError}</p> : null}
        </form>
      ) : null}

      <BrowserToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sources"
        filters={typeFilters}
        activeFilter={typeFilter}
        onFilterChange={(id) => setTypeFilter(id as SceneSourceType | 'all')}
        {...(compact ? { className: 'space-y-1' } : {})}
      />

      {!compact ? (
        <div className="flex flex-wrap gap-1">
          {healthFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setHealthFilter(item.id)}
              className={
                healthFilter === item.id
                  ? 'rounded-ubos-sm bg-ubos-selection-muted px-2 py-0.5 text-ubos-metadata text-ubos-selection-text'
                  : 'rounded-ubos-sm bg-ubos-midnight px-2 py-0.5 text-ubos-metadata text-ubos-fg-muted'
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <AssetList isEmpty={visibleSources.length === 0} emptyMessage="No sources added">
        {visibleSources.map((source) => (
          <SourceBrowserRow
            key={source.id}
            source={source}
            sceneName={sceneName}
            guests={guests}
            tallyState={tallyState}
            directCameraLive={directCameraLive}
            {...(compact ? { compact: true } : {})}
            {...(onRename ? { onRename } : {})}
            {...(onDuplicate ? { onDuplicate } : {})}
            {...(onDelete ? { onDelete } : {})}
            {...(onToggleVisibility ? { onToggleVisibility } : {})}
            {...(onToggleLock ? { onToggleLock } : {})}
            {...(onReloadBrowserSource ? { onReloadBrowserSource } : {})}
            {...(onToggleMute ? { onToggleMute } : {})}
            selected={selectedSourceId === source.id}
            {...(onSelectSource ? { onSelectSource } : {})}
          />
        ))}
      </AssetList>
    </BrowserSection>
  );
}

function SourceBrowserRow({
  source,
  sceneName,
  guests,
  tallyState,
  directCameraLive = false,
  compact = false,
  onRename,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onToggleLock,
  onReloadBrowserSource,
  onToggleMute,
  selected = false,
  onSelectSource,
}: {
  source: SceneSource;
  sceneName: string;
  guests: Guest[];
  tallyState: TallyState;
  directCameraLive?: boolean;
  compact?: boolean;
  onRename?: (sourceId: string, name: string) => void;
  onDuplicate?: (sourceId: string) => void;
  onDelete?: (sourceId: string) => void;
  onToggleVisibility?: (sourceId: string) => void;
  onToggleLock?: (sourceId: string) => void;
  onReloadBrowserSource?: (sourceId: string) => void;
  onToggleMute?: (sourceId: string) => void;
  selected?: boolean;
  onSelectSource?: (sourceId: string) => void;
}) {
  const health =
    directCameraLive && source.type === 'camera' ? 'live' : deriveSourceHealth(source, guests);
  const telemetry = getSourceTelemetry(source);
  const telemetryParts = compact
    ? []
    : [
        telemetry.resolution ? `${telemetry.resolution}` : null,
        telemetry.fps ? `${telemetry.fps} fps` : null,
        telemetry.audioEnabled === true ? 'audio on' : telemetry.audioEnabled === false ? 'audio off' : null,
      ].filter(Boolean);

  const statusVariant =
    health === 'live'
      ? 'live'
      : health === 'offline' || health === 'hidden' || health === 'failed'
        ? 'offline'
        : health === 'permission_required' || health === 'loading' || health === 'unavailable'
          ? 'warning'
          : sourceHealthVariant(health);

  const statusLabel =
    health === 'live'
      ? 'Live'
      : health === 'offline' || health === 'hidden'
        ? 'Offline'
        : health === 'permission_required' || health === 'loading' || health === 'unavailable'
          ? 'Warning'
          : sourceHealthLabel(health);

  return (
    <AssetRow
      thumbnail={
        <SceneThumbnail
          label={compact ? sourceTypeIcons[source.type] : getSourceTypeLabel(source.type).slice(0, 3).toUpperCase()}
          {...(compact ? { compact: true } : {})}
        />
      }
      title={source.name}
      subtitle={
        compact
          ? getSourceTypeLabel(source.type)
          : `${getSourceTypeLabel(source.type)} · ${sceneName}${telemetryParts.length ? ` · ${telemetryParts.join(' · ')}` : ''}`
      }
      selected={selected}
      {...(compact ? { className: 'gap-1.5 px-1 py-1' } : {})}
      {...(onSelectSource ? { onClick: () => onSelectSource(source.id) } : {})}
      status={
        <div className="flex flex-col items-end gap-0.5">
          <StatusBadge variant={statusVariant} dot={health === 'live'}>
            {statusLabel}
          </StatusBadge>
          <StatusBadge variant={source.isVisible ? (tallyState === 'preview' ? 'preview' : 'neutral') : 'offline'}>
            {source.isVisible ? 'Visible' : 'Hidden'}
          </StatusBadge>
        </div>
      }
      action={
        <CompactRowActions>
          <RowIconButton
            label={source.isVisible ? 'Hide' : 'Show'}
            {...(compact ? { compact: true } : {})}
            onClick={() => onToggleVisibility?.(source.id)}
          />
          <RowIconButton
            label={source.isLocked ? 'Unlock' : 'Lock'}
            {...(compact ? { compact: true } : {})}
            onClick={() => onToggleLock?.(source.id)}
          />
          {source.type === 'browser' ? (
            <RowIconButton
              label="Reload"
              {...(compact ? { compact: true } : {})}
              onClick={() => onReloadBrowserSource?.(source.id)}
            />
          ) : null}
          {source.type === 'browser' ? (
            <RowIconButton
              label={source.muted || source.settings?.muted !== false ? 'Unmute' : 'Mute'}
              {...(compact ? { compact: true } : {})}
              onClick={() => onToggleMute?.(source.id)}
            />
          ) : null}
          {!compact ? (
            <>
              <RowIconButton label="Dup" onClick={() => onDuplicate?.(source.id)} />
              <RowIconButton
                label="Ren"
                onClick={() => {
                  const name = window.prompt('Rename source', source.name);
                  if (name) onRename?.(source.id, name);
                }}
              />
            </>
          ) : null}
          <RowIconButton
            label="Del"
            {...(compact ? { compact: true } : {})}
            variant="danger"
            onClick={() => {
              if (window.confirm(`Delete ${source.name}?`)) {
                const mediaUrl = typeof source.settings?.mediaUrl === 'string' ? source.settings.mediaUrl : null;
                if (mediaUrl) URL.revokeObjectURL(mediaUrl);
                onDelete?.(source.id);
              }
            }}
          />
        </CompactRowActions>
      }
    />
  );
}
