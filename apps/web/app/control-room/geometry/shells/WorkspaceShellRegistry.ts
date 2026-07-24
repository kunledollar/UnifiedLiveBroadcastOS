/**
 * WorkspaceShellRegistry — Step 49
 *
 * Maps workspace preset ids to their WorkspaceShell geometry definitions.
 * Used by WorkspaceManager.setWorkspace() to look up the correct shell
 * when the operator switches workspaces.
 */
import type { WorkspaceShell } from '@ubos/shared';
import { DirectorShell }      from './DirectorShell';
import { ProductionShell }    from './ProductionShell';
import { GraphicsShell }      from './GraphicsShell';
import { ReplayShell }        from './ReplayShell';
import { DistributionShell }  from './DistributionShell';
import { AutomationShell }    from './AutomationShell';
import { AnalyticsShell }     from './AnalyticsShell';
import { SocialFabricShell }  from './SocialFabricShell';
import { MonitorWallShell }   from './MonitorWallShell';

export const WorkspaceShellRegistry: Record<string, WorkspaceShell> = {
  director:               DirectorShell,
  production:             ProductionShell,
  'graphics-operator':    GraphicsShell,
  'replay-operator':      ReplayShell,
  'distribution-operator': DistributionShell,
  'automation-operator':  AutomationShell,
  analytics:              AnalyticsShell,
  'social-fabric':        SocialFabricShell,
  'monitor-wall':         MonitorWallShell,
};
