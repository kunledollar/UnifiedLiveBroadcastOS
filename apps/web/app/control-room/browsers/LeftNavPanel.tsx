'use client';

import type {
  GraphicsAsset,
  Guest,
  LowerThirdTemplate,
  MediaAsset,
  ProductionAsset,
  Scene,
  SceneLayout,
  SceneMediaComposition,
  SceneSourceType,
  SceneType,
} from '@ubos/shared';
import type { TallyState } from '@ubos/ui';
import type { NavItemId } from '../shell/types';
import { LayoutBrowser } from './LayoutBrowser';
import { GraphicsBrowser as GraphicsBrowserPanel } from '../graphics/GraphicsBrowser';
import { MediaBrowserPanel, ReplayBrowserPanel } from '../media/MediaBrowserPanels';
import { OutputsBrowser, SettingsBrowser } from './PlaceholderBrowsers';
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
  directCameraLive = false,
  onGraphicsAddToScene,
  graphicsTemplates = [],
  mediaAssets = [],
  mediaComposition,
  selectedMediaAssetId,
  selectedReplayClipId,
  onSelectMediaAsset,
  onSelectReplayClip,
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
  directCameraLive?: boolean;
  onGraphicsAddToScene?: (asset: GraphicsAsset) => void;
  graphicsTemplates?: LowerThirdTemplate[];
  mediaAssets?: MediaAsset[];
  mediaComposition?: SceneMediaComposition;
  selectedMediaAssetId?: string | null;
  selectedReplayClipId?: string | null;
  onSelectMediaAsset?: (assetId: string) => void;
  onSelectReplayClip?: (clipId: string) => void;
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
          directCameraLive={directCameraLive}
          onAdd={onSourceAdd}
          onRename={onSourceRename}
          onDuplicate={onSourceDuplicate}
          onDelete={onSourceDelete}
          onToggleVisibility={onSourceToggleVisibility}
          onToggleLock={onSourceToggleLock}
        />
      );
    case 'media':
      return (
        <MediaBrowserPanel
          assets={mediaAssets}
          {...(selectedMediaAssetId !== undefined ? { selectedAssetId: selectedMediaAssetId } : {})}
          {...(onSelectMediaAsset ? { onSelectAsset: onSelectMediaAsset } : {})}
        />
      );
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
      return mediaComposition ? (
        <ReplayBrowserPanel
          composition={mediaComposition}
          {...(selectedReplayClipId !== undefined ? { selectedReplayClipId } : {})}
          {...(onSelectReplayClip ? { onSelectReplayClip } : {})}
        />
      ) : (
        <ReplayBrowserPanel
          composition={{
            sceneId: previewScene.id,
            assets: [],
            clips: [],
            playlists: [],
            replayClips: [],
            replayBuffer: { active: false, status: 'inactive' },
            programAssetIds: [],
            programClipIds: [],
            previewAssetIds: [],
            previewClipIds: [],
            updatedAt: new Date().toISOString(),
          }}
        />
      );
    case 'outputs':
      return <OutputsBrowser routeCount={mediaRouteCount} />;
    case 'settings':
      return <SettingsBrowser />;
    default:
      return null;
  }
}
