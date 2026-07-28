'use client';

import type { DistributionState } from './distribution-state';
import { BroadcastPanel, StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { DestinationManager } from './DestinationManager';
import { OutputHealthPanel } from './OutputHealthPanel';
import { OutputRoutingMatrix } from './OutputRoutingMatrix';
import { PlatformPreviewPanel } from './PlatformPreviewPanel';
import { RecordingDestinationsPanel } from './RecordingDestinationsPanel';
import { StreamProfilePanel } from './StreamProfilePanel';
import type { DistributionAction } from './distribution-state';
import { outputHealthSummaryLabel } from './distribution-utils';

export function DistributionPanel({
  state,
  dispatch,
  className,
}: {
  state: DistributionState;
  dispatch: (action: DistributionAction) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <BroadcastPanel variant="inset" padding={false} className="border-0 shadow-none">
        <div className="border-b border-ubos-border-subtle px-ubos-2 py-1.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className={cn(ubosTypographyClasses.panel, 'text-ubos-fg-primary')}>Outputs</h3>
              <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
                Distribution metadata · No publishing
              </p>
            </div>
            <StatusBadge variant="neutral">
              {outputHealthSummaryLabel({
                destinations: state.destinations,
                health: state.outputHealth,
              })}
            </StatusBadge>
          </div>
        </div>
        <div className="space-y-ubos-2 overflow-y-auto p-ubos-2">
          <DestinationManager
            destinations={state.destinations}
            streamProfiles={state.streamProfiles}
            outputRoutes={state.outputRoutes}
            selectedDestinationId={state.selectedDestinationId}
            onSelectDestination={(destinationId) =>
              dispatch({ type: 'SELECT_DESTINATION', destinationId })
            }
            onToggleDestination={(destinationId) =>
              dispatch({ type: 'TOGGLE_DESTINATION', destinationId })
            }
            onAssignRoute={(destinationId) =>
              dispatch({ type: 'ASSIGN_ROUTE', destinationId, sourceView: 'program' })
            }
            onRemoveDestination={(destinationId) =>
              dispatch({ type: 'REMOVE_DESTINATION', destinationId })
            }
          />
          <StreamProfilePanel
            profiles={state.streamProfiles}
            selectedProfileId={state.selectedProfileId}
            onSelectProfile={(profileId) => dispatch({ type: 'SELECT_PROFILE', profileId })}
          />
          <OutputRoutingMatrix
            destinations={state.destinations}
            outputRoutes={state.outputRoutes}
          />
          <OutputHealthPanel destinations={state.destinations} outputHealth={state.outputHealth} />
          <RecordingDestinationsPanel destinations={state.destinations} />
          <PlatformPreviewPanel destinations={state.destinations} />
        </div>
      </BroadcastPanel>
    </div>
  );
}
