'use client';

import type { GraphicsAsset, GraphicsLayer } from '@ubos/shared';
import { validateGraphicsLayer } from '@ubos/shared';
import { BroadcastButton, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { CompactRowActions, RowIconButton } from '../browsers/BrowserChrome';
import { layerStateLabel, layerStateVariant } from './graphics-utils';

export function GraphicsLayerRow({
  layer,
  layers,
  assets,
  selected = false,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  layer: GraphicsLayer;
  layers: GraphicsLayer[];
  assets: GraphicsAsset[];
  selected?: boolean;
  onSelect?: () => void;
  onToggleVisibility?: () => void;
  onToggleLock?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
}) {
  const asset = assets.find((item) => item.id === layer.assetId);
  const issues = validateGraphicsLayer(layer, layers, assets);
  const displayState =
    layer.programState === 'live'
      ? layer.programState
      : layer.previewState === 'preview'
        ? layer.previewState
        : layer.visible
          ? 'hidden'
          : 'hidden';

  return (
    <div
      className={cn(
        'flex w-full items-center gap-ubos-2 rounded-ubos-sm border px-ubos-2 py-1.5 transition-colors duration-ubos-fast',
        selected
          ? 'border-ubos-selection-border bg-ubos-selection-muted'
          : 'border-transparent bg-ubos-midnight/50 hover:bg-ubos-midnight',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left outline-none focus-visible:ring-1 focus-visible:ring-ubos-selection-border"
      >
        <div className="flex items-center justify-between gap-ubos-2">
          <div className="min-w-0">
            <div className={cn(ubosTypographyClasses.panel, 'ubos-truncate text-ubos-fg-primary')}>
              {layer.name}
            </div>
            <div className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
              {asset?.type.replace(/_/g, ' ') ?? 'missing asset'} · Opacity {Math.round(layer.opacity * 100)}%
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <StatusBadge variant={layerStateVariant(displayState)}>{layerStateLabel(displayState)}</StatusBadge>
            {layer.locked ? <StatusBadge variant="warning">Locked</StatusBadge> : null}
            {!layer.visible ? <StatusBadge variant="offline">Hidden</StatusBadge> : null}
            {issues.length ? <StatusBadge variant="warning">Warning</StatusBadge> : null}
          </div>
        </div>
      </button>
      <CompactRowActions>
        <RowIconButton label={layer.visible ? 'Hide' : 'Show'} onClick={() => onToggleVisibility?.()} />
        <RowIconButton label={layer.locked ? 'Unlock' : 'Lock'} onClick={() => onToggleLock?.()} />
        <RowIconButton label="Up" onClick={() => onMoveUp?.()} />
        <RowIconButton label="Down" onClick={() => onMoveDown?.()} />
        <RowIconButton label="Dup" onClick={() => onDuplicate?.()} />
        <RowIconButton label="Del" variant="danger" onClick={() => onRemove?.()} />
      </CompactRowActions>
    </div>
  );
}
