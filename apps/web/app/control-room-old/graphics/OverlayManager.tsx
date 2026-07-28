'use client';

import type { GraphicsAsset, GraphicsLayer } from '@ubos/shared';
import { AssetList, AssetRow, StatusBadge } from '@ubos/ui';
import { GraphicsEmptyState } from './GraphicsEmptyState';
import { layerStateLabel, layerStateVariant } from './graphics-utils';

export function OverlayManager({
  layers,
  assets,
}: {
  layers: GraphicsLayer[];
  assets: GraphicsAsset[];
}) {
  const overlayTypes = new Set(['logo', 'watermark', 'ticker', 'lower_third', 'sponsor_card', 'countdown']);
  const overlays = layers.filter((layer) => {
    const asset = assets.find((item) => item.id === layer.assetId);
    return asset ? overlayTypes.has(asset.type) : false;
  });

  if (!overlays.length) {
    return <GraphicsEmptyState message="No overlays active" />;
  }

  return (
    <AssetList isEmpty={false}>
      {overlays.map((layer) => {
        const asset = assets.find((item) => item.id === layer.assetId);
        const state =
          layer.programState === 'live'
            ? layer.programState
            : layer.previewState === 'preview'
              ? layer.previewState
              : layer.visible
                ? 'hidden'
                : 'unavailable';
        return (
          <AssetRow
            key={layer.id}
            title={layer.name}
            subtitle={asset?.type.replace(/_/g, ' ') ?? 'asset reference missing'}
            status={
              <StatusBadge variant={layerStateVariant(state)}>{layerStateLabel(state)}</StatusBadge>
            }
          />
        );
      })}
    </AssetList>
  );
}
