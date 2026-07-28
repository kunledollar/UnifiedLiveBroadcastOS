'use client';

import { AssetList, AssetRow, StatusBadge } from '@ubos/ui';
import type { ProductionAsset } from '@ubos/shared';
import { BrowserSection } from './BrowserChrome';
import { SceneThumbnail } from './BrowserChrome';

export function MediaBrowser({ assets }: { assets: ProductionAsset[] }) {
  const mediaAssets = assets.filter((asset) => asset.type === 'video' || asset.type === 'image');

  return (
    <BrowserSection title="Media">
      <AssetList isEmpty={mediaAssets.length === 0} emptyMessage="No media assets loaded">
        {mediaAssets.map((asset) => (
          <AssetRow
            key={asset.id}
            thumbnail={<SceneThumbnail label="MED" />}
            title={asset.name}
            subtitle={`${asset.type} · ${asset.status}`}
            status={
              <StatusBadge variant={asset.status === 'ready' ? 'success' : 'warning'}>
                {asset.status}
              </StatusBadge>
            }
          />
        ))}
      </AssetList>
    </BrowserSection>
  );
}

export function GraphicsBrowser({ assets }: { assets: ProductionAsset[] }) {
  const lowerThirds = assets.filter((asset) => asset.type === 'lower_third');
  const overlays = assets.filter((asset) => asset.type === 'overlay' || asset.type === 'background');
  const graphicsAssets = [...lowerThirds, ...overlays];

  if (!graphicsAssets.length) {
    return (
      <BrowserSection title="Graphics">
        <p className="text-ubos-caption text-ubos-fg-muted">No graphics templates configured.</p>
        <p className="text-ubos-metadata text-ubos-fg-muted">
          Lower thirds available: {lowerThirds.length} · Overlay assets available: {overlays.length}
        </p>
      </BrowserSection>
    );
  }

  return (
    <BrowserSection title="Graphics">
      <p className="text-ubos-metadata text-ubos-fg-muted">
        Lower thirds available: {lowerThirds.length} · Overlay assets available: {overlays.length}
      </p>
      <AssetList isEmpty={false}>
        {graphicsAssets.map((asset) => (
          <AssetRow
            key={asset.id}
            thumbnail={<SceneThumbnail label="GFX" />}
            title={asset.name}
            subtitle={asset.type}
            status={
              <StatusBadge variant={asset.status === 'ready' ? 'success' : 'warning'}>
                {asset.status}
              </StatusBadge>
            }
          />
        ))}
      </AssetList>
    </BrowserSection>
  );
}

export function OutputsBrowser({ routeCount }: { routeCount: number }) {
  return (
    <BrowserSection title="Outputs">
      {routeCount ? (
        <p className="text-ubos-caption text-ubos-fg-secondary">
          {routeCount} output route{routeCount === 1 ? '' : 's'} configured.
        </p>
      ) : (
        <p className="text-ubos-caption text-ubos-fg-muted">No outputs configured.</p>
      )}
    </BrowserSection>
  );
}

export function ReplayBrowser() {
  return (
    <BrowserSection title="Replay">
      <p className="text-ubos-caption text-ubos-fg-muted">Replay not active.</p>
    </BrowserSection>
  );
}

export function SettingsBrowser() {
  return (
    <BrowserSection title="Settings">
      <p className="text-ubos-caption text-ubos-fg-muted">
        Workspace, automation, and analytics settings reserved for future release.
      </p>
    </BrowserSection>
  );
}
