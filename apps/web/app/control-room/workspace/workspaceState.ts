/**
 * UBOS Workspace State — Step 62
 *
 * Singleton that holds the live Scene Graph Engine instance.
 * Zone components import this directly to access scene graph data
 * without having to thread the engine through props.
 *
 * workspaceManager feeds scene data here via setScenes/setCurrentScene
 * whenever the production state changes.
 */
import {
  SceneGraphEngine,
  type Scene,
} from '../scene-graph/sceneGraphEngine';

export const workspaceState = {
  sceneGraph: new SceneGraphEngine(),

  /** Called by WorkspaceManager when scenes are updated. */
  setScenes(scenes: Scene[]): void {
    this.sceneGraph.setScenes(scenes);
  },

  /** Called by WorkspaceManager when the active program scene changes. */
  setCurrentScene(id: string | null): void {
    this.sceneGraph.setCurrentScene(id);
  },

  /** Called by WorkspaceManager when the preview scene changes. */
  setPreviewScene(id: string | null): void {
    this.sceneGraph.setPreviewScene(id);
  },
};
