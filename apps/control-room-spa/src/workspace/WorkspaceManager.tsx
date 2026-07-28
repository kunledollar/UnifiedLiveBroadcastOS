import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactElement,
} from 'react';
import { useAutonomous } from './autonomous/AutonomousProvider';
import type { WorkspaceProps } from './workspaces/types';
import DirectorWorkspace from './workspaces/DirectorWorkspace';
import ProductionWorkspace from './workspaces/ProductionWorkspace';
import GraphicsOperatorWorkspace from './workspaces/GraphicsOperatorWorkspace';
import ReplayWorkspace from './workspaces/ReplayWorkspace';
import DistributionWorkspace from './workspaces/DistributionWorkspace';
import AutomationWorkspace from './workspaces/AutomationWorkspace';
import AnalyticsWorkspace from './workspaces/AnalyticsWorkspace';
import MediaWorkspace from './workspaces/MediaWorkspace';
import InspectorWorkspace from './workspaces/InspectorWorkspace';

export const WORKSPACE_IDS = [
  'director',
  'production',
  'graphics',
  'replay',
  'distribution',
  'automation',
  'analytics',
  'media',
  'inspector',
] as const;

export type WorkspaceId = (typeof WORKSPACE_IDS)[number];

const WORKSPACES: Record<WorkspaceId, ComponentType<WorkspaceProps>> = {
  director: DirectorWorkspace,
  production: ProductionWorkspace,
  graphics: GraphicsOperatorWorkspace,
  replay: ReplayWorkspace,
  distribution: DistributionWorkspace,
  automation: AutomationWorkspace,
  analytics: AnalyticsWorkspace,
  media: MediaWorkspace,
  inspector: InspectorWorkspace,
};

export type WorkspaceManagerApi = {
  workspace: WorkspaceId;
  setWorkspace: (workspace: WorkspaceId) => void;
  renderWorkspace: () => ReactElement;
};

export function useWorkspaceManager(): WorkspaceManagerApi {
  const [workspace, setWorkspace] = useState<WorkspaceId>('director');
  const ctx = useAutonomous();

  useEffect(() => {
    console.log('[WorkspaceManager] mounted', { workspace, state: ctx.state });
    return () => console.log('[WorkspaceManager] unmounted');
  }, []);

  useEffect(() => {
    console.log('[WorkspaceManager] active workspace', workspace);
  }, [workspace]);

  const selectWorkspace = useCallback((nextWorkspace: WorkspaceId) => {
    setWorkspace((currentWorkspace) => {
      console.log('[WorkspaceManager] workspace transition', {
        from: currentWorkspace,
        to: nextWorkspace,
      });
      return nextWorkspace;
    });
  }, []);

  const renderedWorkspace = useMemo(
    () => createElement(WORKSPACES[workspace], { autonomy: ctx.state }),
    [ctx.state, workspace],
  );

  return {
    workspace,
    setWorkspace: selectWorkspace,
    renderWorkspace: () => renderedWorkspace,
  };
}

/** @deprecated Use useWorkspaceManager so React can enforce the Rules of Hooks. */
export const WorkspaceManager = useWorkspaceManager;
