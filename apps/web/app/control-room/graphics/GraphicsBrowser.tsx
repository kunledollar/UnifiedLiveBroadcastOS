'use client';

import type { GraphicsAsset, GraphicsAssetType, LowerThirdTemplate, ProductionAsset } from '@ubos/shared';
import { AssetList, AssetRow, BroadcastButton, StatusBadge, cn } from '@ubos/ui';
import { BrowserSection } from '../browsers/BrowserChrome';
import { GraphicsEmptyState } from './GraphicsEmptyState';
import { graphicsBrowserCategories, productionAssetToGraphicsAsset } from './graphics-utils';

export function GraphicsBrowser({
  assets,
  templates = [],
  activeCategory = 'lower_third',
  onCategoryChange,
  onAddAssetToScene,
  className,
}: {
  assets: ProductionAsset[];
  templates?: LowerThirdTemplate[];
  activeCategory?: GraphicsAssetType | 'templates' | 'brand';
  onCategoryChange?: (category: GraphicsAssetType | 'templates' | 'brand') => void;
  onAddAssetToScene?: (asset: GraphicsAsset) => void;
  className?: string;
}) {
  const graphicsAssets = assets.map(productionAssetToGraphicsAsset);
  const filtered =
    activeCategory === 'templates'
      ? []
      : activeCategory === 'brand'
        ? []
        : graphicsAssets.filter((asset) => asset.type === activeCategory);

  return (
    <BrowserSection title="Graphics Browser" {...(className ? { className } : {})}>
      <div className="flex flex-wrap gap-1">
        {graphicsBrowserCategories.map((category) => {
          const active = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange?.(category.id)}
              className={cn(
                'rounded-ubos-sm px-2 py-0.5 text-ubos-metadata font-medium transition-colors duration-ubos-fast',
                active
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'bg-ubos-midnight text-ubos-fg-muted hover:text-ubos-fg-secondary',
              )}
            >
              {category.label}
            </button>
          );
        })}
      </div>

      {activeCategory === 'brand' ? (
        <GraphicsEmptyState message="No brand kit configured." />
      ) : null}

      {activeCategory === 'templates' ? (
        <AssetList isEmpty={templates.length === 0} emptyMessage="Template not configured">
          {templates.map((template) => (
            <AssetRow
              key={template.id}
              title={template.name}
              subtitle={`${template.title} · ${template.organization}`}
              status={<StatusBadge variant="neutral">Template</StatusBadge>}
            />
          ))}
        </AssetList>
      ) : null}

      {activeCategory !== 'brand' && activeCategory !== 'templates' ? (
        <AssetList
          isEmpty={filtered.length === 0}
          emptyMessage={
            activeCategory === 'lower_third'
              ? 'No lower thirds created'
              : activeCategory === 'scoreboard'
                ? 'Scoreboard not configured'
                : activeCategory === 'countdown'
                  ? 'Countdown not configured'
                  : 'No graphics assets configured'
          }
        >
          {filtered.map((asset) => (
            <AssetRow
              key={asset.id}
              title={asset.name}
              subtitle={asset.type.replace(/_/g, ' ')}
              status={
                <StatusBadge
                  variant={
                    asset.status === 'ready'
                      ? 'success'
                      : asset.status === 'draft'
                        ? 'warning'
                        : 'offline'
                  }
                >
                  {asset.status}
                </StatusBadge>
              }
              action={
                onAddAssetToScene ? (
                  <BroadcastButton
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddAssetToScene(asset);
                    }}
                  >
                    Add
                  </BroadcastButton>
                ) : undefined
              }
            />
          ))}
        </AssetList>
      ) : null}
    </BrowserSection>
  );
}
