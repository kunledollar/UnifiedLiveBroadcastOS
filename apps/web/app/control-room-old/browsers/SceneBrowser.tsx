'use client';

import { useMemo, useState } from 'react';
import {
  AssetList,
  AssetRow,
  BroadcastButton,
  StatusBadge,
} from '@ubos/ui';
import { SceneType, type Guest, type Scene } from '@ubos/shared';
import {
  BrowserSection,
  BrowserToolbar,
  SceneRowOverflowMenu,
  SceneThumbnail,
} from './BrowserChrome';
import {
  deriveSceneRowStatus,
  filterScenes,
  getSceneLayoutLabel,
  getSceneTypeLabel,
  sceneStatusLabel,
  sceneStatusVariant,
  sortScenes,
  type SceneBrowserFilter,
  type SceneBrowserSort,
} from './scene-browser-utils';

const sceneFilters: Array<{ id: SceneBrowserFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'preview', label: 'Preview' },
  { id: 'ready', label: 'Ready' },
  { id: 'issues', label: 'Issues' },
];

const sceneSortOptions: Array<{ value: SceneBrowserSort; label: string }> = [
  { value: 'order', label: 'Order' },
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
  { value: 'status', label: 'Status' },
];

export function SceneBrowser({
  scenes,
  sceneTypes,
  guests,
  programSceneId,
  previewSceneId,
  isPending = false,
  compact = false,
  onAdd,
  onRename,
  onSwitch,
  onDuplicate,
  onDelete,
}: {
  scenes: Scene[];
  sceneTypes: SceneType[];
  guests: Guest[];
  programSceneId: string;
  previewSceneId: string;
  isPending?: boolean;
  compact?: boolean;
  onAdd?: (input: { name: string; type: SceneType }) => void;
  onRename?: (sceneId: string, name: string) => void;
  onSwitch?: (sceneId: string) => void;
  onDuplicate?: (sceneId: string) => void;
  onDelete?: (sceneId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SceneBrowserFilter>('all');
  const [sort, setSort] = useState<SceneBrowserSort>('order');

  const visibleScenes = useMemo(() => {
    const filtered = filterScenes({
      scenes,
      search,
      filter,
      programSceneId,
      previewSceneId,
      guests,
    });
    return sortScenes(filtered, sort, guests);
  }, [scenes, search, filter, sort, programSceneId, previewSceneId, guests]);

  return (
    <BrowserSection
      {...(compact ? { className: 'gap-1' } : {})}
      {...(!compact ? { title: 'Scenes' } : {})}
      action={
        onAdd ? (
          <BroadcastButton
            size="sm"
            variant="primary"
            disabled={isPending}
            onClick={() => {
              const name = window.prompt('New scene name', 'New Scene');
              if (name) onAdd({ name, type: sceneTypes[0] ?? SceneType.Custom });
            }}
          >
            {compact ? '+' : '+ Add'}
          </BroadcastButton>
        ) : null
      }
    >
      <BrowserToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search scenes"
        filters={compact ? sceneFilters.slice(0, 4) : sceneFilters}
        activeFilter={filter}
        onFilterChange={(id) => setFilter(id as SceneBrowserFilter)}
        {...(!compact
          ? {
              sort,
              onSortChange: (value: string) => setSort(value as SceneBrowserSort),
              sortOptions: sceneSortOptions,
            }
          : {})}
        {...(compact ? { className: 'space-y-1' } : {})}
      />

      <AssetList isEmpty={visibleScenes.length === 0} emptyMessage="No scenes created">
        {visibleScenes.map((scene, index) => {
          const isProgram = scene.id === programSceneId || scene.isActive;
          const isPreview = scene.id === previewSceneId;
          const status = deriveSceneRowStatus(scene, guests);
          const selected = isPreview;
          const tally = isProgram ? 'program' : isPreview ? 'preview' : null;

          return (
            <AssetRow
              key={scene.id}
              selected={selected}
              onClick={() => onSwitch?.(scene.id)}
              {...(compact ? { className: 'gap-1.5 px-1 py-1' } : {})}
              thumbnail={
                <SceneThumbnail
                  label={String(index + 1)}
                  tally={tally}
                  {...(compact ? { compact: true } : {})}
                />
              }
              title={scene.name}
              subtitle={
                compact
                  ? `${scene.sources.length} src`
                  : `${getSceneLayoutLabel(scene)} · ${getSceneTypeLabel(scene)} · ${scene.sources.length} source${scene.sources.length === 1 ? '' : 's'}`
              }
              status={
                <div className="flex flex-col items-end gap-0.5">
                  {isProgram ? (
                    <StatusBadge variant="program" dot>
                      Program
                    </StatusBadge>
                  ) : null}
                  {isPreview && !isProgram ? (
                    <StatusBadge variant="preview" dot>
                      Preview
                    </StatusBadge>
                  ) : null}
                  {status === 'offline' || status === 'issues' ? (
                    <StatusBadge variant="warning">
                      {status === 'offline' ? 'Offline' : 'Warning'}
                    </StatusBadge>
                  ) : status === 'ready' && isProgram ? (
                    <StatusBadge variant="live" dot>
                      Live
                    </StatusBadge>
                  ) : (
                    <StatusBadge variant={sceneStatusVariant(status)}>
                      {sceneStatusLabel(status)}
                    </StatusBadge>
                  )}
                </div>
              }
              action={
                <SceneRowOverflowMenu
                  {...(compact ? { compact: true } : {})}
                  onDuplicate={() => onDuplicate?.(scene.id)}
                  onRename={() => {
                    const name = window.prompt('Rename scene', scene.name);
                    if (name) onRename?.(scene.id, name);
                  }}
                  onDelete={() => {
                    if (window.confirm(`Delete ${scene.name}?`)) onDelete?.(scene.id);
                  }}
                  deleteDisabled={scenes.length <= 1}
                />
              }
            />
          );
        })}
      </AssetList>
    </BrowserSection>
  );
}
