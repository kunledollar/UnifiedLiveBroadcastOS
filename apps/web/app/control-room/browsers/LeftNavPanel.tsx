'use client';

import type { GraphicsAsset, Guest, LowerThirdTemplate, ProductionAsset, Scene, SceneLayout, SceneSourceType, SceneType } from '@ubos/shared';
import type { TallyState } from '@ubos/ui';
import type { NavItemId } from '../shell/types';
import { LayoutBrowser } from './LayoutBrowser';
import { GraphicsBrowser as GraphicsBrowserPanel } from '../graphics/GraphicsBrowser';
import {
  MediaBrowser,
  OutputsBrowser,
  ReplayBrowser,
  SettingsBrowser,
} from './PlaceholderBrowsers';
import { SceneBrowser } from './SceneBrowser';
import { SourceBrowser } from './SourceBrowser';

export function LeftNavPanel({
  activeNav,
  scenes,
  sceneTypes,
  guests,
  programSceneId,
  previewSceneId,
  previewScene,
  previewSceneName,
  sourceTypes,
  tallyState,
  layouts,
  assets,
  mediaRouteCount,
  isPending = false,
  onSceneAdd,
  onSceneRename,
  onSceneSwitch,
  onSceneDuplicate,
  onSceneDelete,
  onSourceAdd,
  onSourceRename,
  onSourceDuplicate,
  onSourceDelete,
  onSourceToggleVisibility,
  onSourceToggleLock,
  onGraphicsAddToScene,
  graphicsTemplates = [],
}: {
  activeNav: NavItemId;
  scenes: Scene[];
  sceneTypes: SceneType[];
  guests: Guest[];
  programSceneId: string;
  previewSceneId: string;
  previewScene: Scene;
  previewSceneName: string;
  sourceTypes: SceneSourceType[];
  tallyState: TallyState;
  layouts: SceneLayout[];
  assets: ProductionAsset[];
  mediaRouteCount: number;
  isPending?: boolean;
  onSceneAdd: (input: { name: string; type: SceneType }) => void;
  onSceneRename: (sceneId: string, name: string) => void;
  onSceneSwitch: (sceneId: string) => void;
  onSceneDuplicate: (sceneId: string) => void;
  onSceneDelete: (sceneId: string) => void;
  onSourceAdd: (input: {
    sceneId: string;
    name: string;
    type: SceneSourceType;
    url?: string;
  }) => void;
  onSourceRename: (sourceId: string, name: string) => void;
  onSourceDuplicate: (sourceId: string) => void;
  onSourceDelete: (sourceId: string) => void;
  onSourceToggleVisibility: (sourceId: string) => void;
  onSourceToggleLock: (sourceId: string) => void;
  onGraphicsAddToScene?: (asset: GraphicsAsset) => void;
  graphicsTemplates?: LowerThirdTemplate[];
}) {
  switch (activeNav) {
    case 'scenes':
      return (
        <SceneBrowser
          scenes={scenes}
          sceneTypes={sceneTypes}
          guests={guests}
          programSceneId={programSceneId}
          previewSceneId={previewSceneId}
          isPending={isPending}
          onAdd={onSceneAdd}
          onRename={onSceneRename}
          onSwitch={onSceneSwitch}
          onDuplicate={onSceneDuplicate}
          onDelete={onSceneDelete}
        />
      );
    case 'sources':
      return (
        <SourceBrowser
          scene={previewScene}
          sceneName={previewSceneName}
          guests={guests}
          sourceTypes={sourceTypes}
          isPending={isPending}
          tallyState={tallyState}
          onAdd={onSourceAdd}
          onRename={onSourceRename}
          onDuplicate={onSourceDuplicate}
          onDelete={onSourceDelete}
          onToggleVisibility={onSourceToggleVisibility}
          onToggleLock={onSourceToggleLock}
        />
      );
    case 'media':
      return <MediaBrowser assets={assets} />;
    case 'graphics':
      return (
        <GraphicsBrowserPanel
          assets={assets}
          templates={graphicsTemplates}
          {...(onGraphicsAddToScene ? { onAddAssetToScene: onGraphicsAddToScene } : {})}
        />
      );
    case 'layouts':
      return <LayoutBrowser layouts={layouts} activeLayout={previewScene.layout ?? null} />;
    case 'replay':
      return <ReplayBrowser />;
    case 'outputs':
      return <OutputsBrowser routeCount={mediaRouteCount} />;
    case 'settings':
      return <SettingsBrowser />;
    default:
      return null;
  }
}
