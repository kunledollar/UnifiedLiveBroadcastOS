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
  CompactRowActions,
  RowIconButton,
  SceneThumbnail,
} from './BrowserChrome';
import {
  deriveSceneRowStatus,
  filterScenes,
  getSceneAspectBadges,
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
      title="Scenes"
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
            + Add
          </BroadcastButton>
        ) : null
      }
    >
      <BrowserToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search scenes"
        filters={sceneFilters}
        activeFilter={filter}
        onFilterChange={(id) => setFilter(id as SceneBrowserFilter)}
        sort={sort}
        onSortChange={(value) => setSort(value as SceneBrowserSort)}
        sortOptions={sceneSortOptions}
      />

      <AssetList isEmpty={visibleScenes.length === 0} emptyMessage="No scenes created">
        {visibleScenes.map((scene, index) => {
          const isProgram = scene.id === programSceneId || scene.isActive;
          const isPreview = scene.id === previewSceneId;
          const status = deriveSceneRowStatus(scene, guests);
          const aspectBadges = getSceneAspectBadges(scene);
          const selected = isPreview;

          return (
            <AssetRow
              key={scene.id}
              selected={selected}
              onClick={() => onSwitch?.(scene.id)}
              thumbnail={<SceneThumbnail label={String(index + 1)} />}
              title={scene.name}
              subtitle={`${getSceneLayoutLabel(scene)} · ${getSceneTypeLabel(scene)} · ${scene.sources.length} source${scene.sources.length === 1 ? '' : 's'}`}
              status={
                <div className="flex flex-col items-end gap-0.5">
                  {isProgram ? <StatusBadge variant="live">PROGRAM</StatusBadge> : null}
                  {isPreview && !isProgram ? <StatusBadge variant="preview">PREVIEW</StatusBadge> : null}
                  <StatusBadge variant={sceneStatusVariant(status)}>
                    {sceneStatusLabel(status)}
                  </StatusBadge>
                  <div className="flex flex-wrap justify-end gap-0.5">
                    {aspectBadges.map((ratio) => (
                      <StatusBadge key={`${scene.id}-${ratio}`} variant="neutral">
                        {ratio}
                      </StatusBadge>
                    ))}
                  </div>
                </div>
              }
              action={
                <CompactRowActions>
                  <RowIconButton
                    label="Dup"
                    onClick={() => onDuplicate?.(scene.id)}
                  />
                  <RowIconButton
                    label="Ren"
                    onClick={() => {
                      const name = window.prompt('Rename scene', scene.name);
                      if (name) onRename?.(scene.id, name);
                    }}
                  />
                  <RowIconButton
                    label="Del"
                    variant="danger"
                    disabled={scenes.length <= 1}
                    onClick={() => {
                      if (window.confirm(`Delete ${scene.name}?`)) onDelete?.(scene.id);
                    }}
                  />
                </CompactRowActions>
              }
            />
          );
        })}
      </AssetList>
    </BrowserSection>
  );
}
