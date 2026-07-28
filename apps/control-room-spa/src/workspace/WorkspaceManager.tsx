import { useEffect, type ReactElement } from "react";

import { useAutonomous } from "./autonomous/AutonomousProvider";

import DirectorWorkspace from "./workspaces/DirectorWorkspace";
import ProductionWorkspace from "./workspaces/ProductionWorkspace";
import GraphicsOperatorWorkspace from "./workspaces/GraphicsOperatorWorkspace";
import ReplayWorkspace from "./workspaces/ReplayWorkspace";
import DistributionWorkspace from "./workspaces/DistributionWorkspace";
import AutomationWorkspace from "./workspaces/AutomationWorkspace";
import AnalyticsWorkspace from "./workspaces/AnalyticsWorkspace";
import MediaWorkspace from "./workspaces/MediaWorkspace";
import InspectorWorkspace from "./workspaces/InspectorWorkspace";

type Props = {
  active: string;
};

export function WorkspaceManager({ active }: Props) {
  const ctx = useAutonomous();

  useEffect(() => {
    console.log("[WorkspaceManager] mounted");
    return () => console.log("[WorkspaceManager] unmounted");
  }, []);

  const workspaces: Record<string, ReactElement> = {
    director: <DirectorWorkspace autonomy={ctx.state} />,
    production: <ProductionWorkspace autonomy={ctx.state} />,
    graphics: <GraphicsOperatorWorkspace autonomy={ctx.state} />,
    replay: <ReplayWorkspace autonomy={ctx.state} />,
    distribution: <DistributionWorkspace autonomy={ctx.state} />,
    automation: <AutomationWorkspace autonomy={ctx.state} />,
    analytics: <AnalyticsWorkspace autonomy={ctx.state} />,
    media: <MediaWorkspace autonomy={ctx.state} />,
    inspector: <InspectorWorkspace autonomy={ctx.state} />,
  };

  return workspaces[active] ?? null;
}