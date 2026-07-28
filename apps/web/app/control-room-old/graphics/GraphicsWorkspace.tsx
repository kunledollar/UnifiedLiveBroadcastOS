'use client';

import { useMemo, useState } from 'react';
import type {
  BrandKit,
  GraphicsAsset,
  GraphicsAssetType,
  GraphicsLayer,
  LowerThirdTemplate,
  ProductionAsset,
  SceneGraphicsComposition,
} from '@ubos/shared';
import { BroadcastPanel, cn, StatusBadge, ubosTypographyClasses } from '@ubos/ui';
import { ResizableSplit } from '../workspaces/ResizableSplit';
import { BrandKitPanel } from './BrandKitPanel';
import { GraphicsBrowser } from './GraphicsBrowser';
import { GraphicsInspector } from './GraphicsInspector';
import { GraphicsLayerStack } from './GraphicsLayerStack';
import { GraphicsPreviewControls } from './GraphicsPreviewControls';
import { LowerThirdDesigner } from './LowerThirdDesigner';
import { OverlayManager } from './OverlayManager';
import type { GraphicsCompositionAction } from './graphics-state';
import { productionAssetToGraphicsAsset } from './graphics-utils';

export function GraphicsWorkspace({
  sceneId,
  sceneName,
  composition,
  assets,
  templates,
  brandKit,
  selectedLayerId,
  onSelectLayer,
  dispatch,
  className,
}: {
  sceneId: string;
  sceneName: string;
  composition: SceneGraphicsComposition;
  assets: ProductionAsset[];
  templates: LowerThirdTemplate[];
  brandKit?: BrandKit | null;
  selectedLayerId?: string | null;
  onSelectLayer?: (layerId: string | null) => void;
  dispatch: (action: GraphicsCompositionAction) => void;
  className?: string;
}) {
  const [browserCategory, setBrowserCategory] = useState<GraphicsAssetType | 'templates' | 'brand'>(
    'lower_third',
  );

  const graphicsAssets = useMemo(() => assets.map(productionAssetToGraphicsAsset), [assets]);
  const selectedLayer =
    composition.layers.find((layer) => layer.id === selectedLayerId) ?? null;

  const previewCount = composition.previewLayerIds.length;
  const programCount = composition.programLayerIds.length;

  const handleAddAsset = (asset: GraphicsAsset) => {
    dispatch({ type: 'ADD_LAYER', sceneId, asset });
  };

  const handleLowerThirdPreview = (template: LowerThirdTemplate) => {
    const asset: GraphicsAsset = {
      id: template.id,
      name: template.name,
      type: 'lower_third',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        title: template.title,
        subtitle: template.subtitle,
        role: template.role,
        organization: template.organization,
      },
    };
    dispatch({ type: 'ADD_LAYER', sceneId, asset });
  };

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>
            Graphics Workspace
          </h2>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Scene: {sceneName} · Metadata staged · CSS animation runtime ready
          </p>
        </div>
        <StatusBadge variant="warning">Graphics metadata staged</StatusBadge>
      </div>

      <GraphicsPreviewControls
        previewCount={previewCount}
        programCount={programCount}
        onSendToPreview={() => {
          if (selectedLayerId) dispatch({ type: 'SEND_TO_PREVIEW', sceneId, layerId: selectedLayerId });
        }}
        onTakeLive={() => {
          if (selectedLayerId) dispatch({ type: 'TAKE_TO_PROGRAM', sceneId, layerId: selectedLayerId });
        }}
        onRemoveFromProgram={() => {
          if (selectedLayerId) dispatch({ type: 'REMOVE_FROM_PROGRAM', sceneId, layerId: selectedLayerId });
        }}
        onAutoBoth={() => {
          if (selectedLayerId) {
            dispatch({ type: 'SEND_TO_PREVIEW', sceneId, layerId: selectedLayerId });
            dispatch({ type: 'TAKE_TO_PROGRAM', sceneId, layerId: selectedLayerId });
          }
        }}
        onClearPreview={() => dispatch({ type: 'CLEAR_PREVIEW', sceneId })}
        onClearProgram={() => dispatch({ type: 'CLEAR_PROGRAM', sceneId })}
        className="shrink-0 px-ubos-2"
      />

      <ResizableSplit
        initialRatio={0.28}
        minPrimary={0.2}
        maxPrimary={0.4}
        primary={
          <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
            <GraphicsBrowser
              assets={assets}
              templates={templates}
              activeCategory={browserCategory}
              onCategoryChange={setBrowserCategory}
              onAddAssetToScene={handleAddAsset}
              className="min-h-0 flex-1"
            />
            <BrandKitPanel {...(brandKit !== undefined ? { brandKit } : {})} />
          </div>
        }
        secondary={
          <ResizableSplit
            initialRatio={0.55}
            primary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <GraphicsLayerStack
                  layers={composition.layers}
                  assets={graphicsAssets}
                  {...(selectedLayerId !== undefined ? { selectedLayerId } : {})}
                  onSelectLayer={(layerId) => onSelectLayer?.(layerId)}
                  onToggleVisibility={(layerId) =>
                    dispatch({ type: 'TOGGLE_VISIBILITY', sceneId, layerId })
                  }
                  onToggleLock={(layerId) => dispatch({ type: 'TOGGLE_LOCK', sceneId, layerId })}
                  onMoveUp={(layerId) => dispatch({ type: 'MOVE_LAYER', sceneId, layerId, direction: 'up' })}
                  onMoveDown={(layerId) =>
                    dispatch({ type: 'MOVE_LAYER', sceneId, layerId, direction: 'down' })
                  }
                  onDuplicate={(layerId) => dispatch({ type: 'DUPLICATE_LAYER', sceneId, layerId })}
                  onRemove={(layerId) => {
                    dispatch({ type: 'REMOVE_LAYER', sceneId, layerId });
                    if (selectedLayerId === layerId) onSelectLayer?.(null);
                  }}
                  className="min-h-0 flex-1"
                />
                <BroadcastPanel variant="inset" padding={false} className="shrink-0 border-0 shadow-none">
                  <div className="p-ubos-2">
                    <div className="mb-ubos-2 grid grid-cols-3 gap-1 text-center text-ubos-metadata text-ubos-fg-muted">
                      <span className="rounded-ubos-sm border border-ubos-border-subtle py-1">Title Safe</span>
                      <span className="rounded-ubos-sm border border-ubos-border-subtle py-1">Action Safe</span>
                      <span className="rounded-ubos-sm border border-ubos-border-subtle py-1">Grid</span>
                    </div>
                    <OverlayManager layers={composition.layers} assets={graphicsAssets} />
                  </div>
                </BroadcastPanel>
              </div>
            }
            secondary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <GraphicsInspector
                  layer={selectedLayer}
                  layers={composition.layers}
                  assets={graphicsAssets}
                  sceneName={sceneName}
                />
                <LowerThirdDesigner
                  {...(templates[0] ? { template: templates[0] } : {})}
                  onSendToPreview={handleLowerThirdPreview}
                  onTakeLive={handleLowerThirdPreview}
                />
              </div>
            }
          />
        }
      />
    </div>
  );
}
