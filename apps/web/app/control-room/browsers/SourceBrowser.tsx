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
  tallyState = 'idle',
  directCameraLive = false,
  onAdd,
  onRename,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onToggleLock,
}: {
  scene: Scene;
  sceneName: string;
  guests: Guest[];
  sourceTypes: SceneSourceType[];
  isPending?: boolean;
  tallyState?: TallyState;
  directCameraLive?: boolean;
  onAdd?: (input: { sceneId: string; name: string; type: SceneSourceType; url?: string; settings?: Record<string, unknown> }) => void;
  onRename?: (sourceId: string, name: string) => void;
  onDuplicate?: (sourceId: string) => void;
  onDelete?: (sourceId: string) => void;
  onToggleVisibility?: (sourceId: string) => void;
  onToggleLock?: (sourceId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<SceneSourceType | 'all'>('all');
  const [healthFilter, setHealthFilter] = useState<SourceHealthFilter>('all');
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
    <BrowserSection title="Sources">
      <p className="text-ubos-metadata text-ubos-fg-muted">
        Preview scene: <span className="text-ubos-fg-secondary">{sceneName}</span>
      </p>

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
        className="flex flex-wrap gap-1 rounded-ubos-md border border-dashed border-transparent p-1"
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
        onDrop={(event) => { event.preventDefault(); importMediaFiles(event.dataTransfer.files); }}
      >
        {sourceAddTypes
          .filter((type) => sourceTypes.includes(type))
          .map((type) => (
            <RowIconButton
              key={type}
              label={`+ ${getSourceTypeLabel(type)}`}
              disabled={isPending}
              onClick={() => {
                if (type === 'media') { fileInputRef.current?.click(); return; }
                const url =
                  type === 'browser'
                    ? window.prompt('Browser source URL', 'https://example.com')
                    : null;
                onAdd?.({
                  sceneId: scene.id,
                  name: `${getSourceTypeLabel(type)} Source`,
                  type,
                  ...(url ? { url } : {}),
                });
              }}
            />
          ))}
      </div>

      <BrowserToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sources"
        filters={typeFilters}
        activeFilter={typeFilter}
        onFilterChange={(id) => setTypeFilter(id as SceneSourceType | 'all')}
      />

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

      <AssetList isEmpty={visibleSources.length === 0} emptyMessage="No sources added">
        {visibleSources.map((source) => (
          <SourceBrowserRow
            key={source.id}
            source={source}
            sceneName={sceneName}
            guests={guests}
            tallyState={tallyState}
            directCameraLive={directCameraLive}
            {...(onRename ? { onRename } : {})}
            {...(onDuplicate ? { onDuplicate } : {})}
            {...(onDelete ? { onDelete } : {})}
            {...(onToggleVisibility ? { onToggleVisibility } : {})}
            {...(onToggleLock ? { onToggleLock } : {})}
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
  onRename,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onToggleLock,
}: {
  source: SceneSource;
  sceneName: string;
  guests: Guest[];
  tallyState: TallyState;
  directCameraLive?: boolean;
  onRename?: (sourceId: string, name: string) => void;
  onDuplicate?: (sourceId: string) => void;
  onDelete?: (sourceId: string) => void;
  onToggleVisibility?: (sourceId: string) => void;
  onToggleLock?: (sourceId: string) => void;
}) {
  const health =
    directCameraLive && source.type === 'camera' ? 'live' : deriveSourceHealth(source, guests);
  const telemetry = getSourceTelemetry(source);
  const telemetryParts = [
    telemetry.resolution ? `${telemetry.resolution}` : null,
    telemetry.fps ? `${telemetry.fps} fps` : null,
    telemetry.audioEnabled === true ? 'audio on' : telemetry.audioEnabled === false ? 'audio off' : null,
  ].filter(Boolean);

  return (
    <AssetRow
      thumbnail={<SceneThumbnail label={getSourceTypeLabel(source.type).slice(0, 3).toUpperCase()} />}
      title={source.name}
      subtitle={`${getSourceTypeLabel(source.type)} · ${sceneName}${telemetryParts.length ? ` · ${telemetryParts.join(' · ')}` : ''}`}
      status={
        <div className="flex flex-col items-end gap-0.5">
          <StatusBadge variant={sourceHealthVariant(health)}>{sourceHealthLabel(health)}</StatusBadge>
          {source.isVisible ? (
            <StatusBadge variant={tallyState === 'preview' ? 'preview' : 'neutral'}>
              {source.isVisible ? 'Visible' : 'Hidden'}
            </StatusBadge>
          ) : (
            <StatusBadge variant="offline">Hidden</StatusBadge>
          )}
        </div>
      }
      action={
        <CompactRowActions>
          <RowIconButton
            label={source.isVisible ? 'Hide' : 'Show'}
            onClick={() => onToggleVisibility?.(source.id)}
          />
          <RowIconButton
            label={source.isLocked ? 'Unlock' : 'Lock'}
            onClick={() => onToggleLock?.(source.id)}
          />
          <RowIconButton label="Dup" onClick={() => onDuplicate?.(source.id)} />
          <RowIconButton
            label="Ren"
            onClick={() => {
              const name = window.prompt('Rename source', source.name);
              if (name) onRename?.(source.id, name);
            }}
          />
          <RowIconButton
            label="Del"
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
