'use client';

import type { DistributionState } from './distribution-state';
import { StatusBadge, cn, ubosTypographyClasses } from '@ubos/ui';
import { ResizableSplit } from '../workspaces/ResizableSplit';
import { DestinationManager } from './DestinationManager';
import { DistributionInspector } from './DistributionInspector';
import { OutputHealthPanel } from './OutputHealthPanel';
import { OutputRoutingMatrix } from './OutputRoutingMatrix';
import { PlatformPreviewPanel } from './PlatformPreviewPanel';
import { RecordingDestinationsPanel } from './RecordingDestinationsPanel';
import { StreamProfilePanel } from './StreamProfilePanel';
import type { DistributionAction } from './distribution-state';
import { outputHealthSummaryLabel } from './distribution-utils';

export function DistributionWorkspace({
  state,
  dispatch,
  className,
}: {
  state: DistributionState;
  dispatch: (action: DistributionAction) => void;
  className?: string;
}) {
  const selectedDestination =
    state.destinations.find((destination) => destination.id === state.selectedDestinationId) ??
    state.destinations[0] ??
    null;

  return (
    <div className={cn('flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden', className)}>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-ubos-2 border-b border-ubos-border-subtle px-ubos-2 py-1.5">
        <div>
          <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>
            Distribution Workspace
          </h2>
          <p className={cn(ubosTypographyClasses.metadata, 'text-ubos-fg-muted')}>
            Destinations · Routing · Stream profiles · Metadata only
          </p>
        </div>
        <StatusBadge variant="warning">
          {outputHealthSummaryLabel({
            destinations: state.destinations,
            health: state.outputHealth,
          })}
        </StatusBadge>
      </div>

      <ResizableSplit
        initialRatio={0.34}
        minPrimary={0.24}
        maxPrimary={0.5}
        primary={
          <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
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
              className="min-h-0 flex-1"
            />
            <StreamProfilePanel
              profiles={state.streamProfiles}
              selectedProfileId={state.selectedProfileId}
              onSelectProfile={(profileId) => dispatch({ type: 'SELECT_PROFILE', profileId })}
              className="shrink-0"
            />
          </div>
        }
        secondary={
          <ResizableSplit
            initialRatio={0.55}
            primary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <OutputRoutingMatrix
                  destinations={state.destinations}
                  outputRoutes={state.outputRoutes}
                  className="min-h-0 flex-1"
                />
                <PlatformPreviewPanel destinations={state.destinations} className="shrink-0" />
              </div>
            }
            secondary={
              <div className="flex h-full min-h-0 flex-col gap-ubos-2 overflow-hidden p-ubos-1">
                <OutputHealthPanel
                  destinations={state.destinations}
                  outputHealth={state.outputHealth}
                  className="min-h-0 flex-1"
                />
                <RecordingDestinationsPanel destinations={state.destinations} />
                <DistributionInspector
                  destination={selectedDestination}
                  streamProfiles={state.streamProfiles}
                  outputRoutes={state.outputRoutes}
                  outputHealth={state.outputHealth}
                />
              </div>
            }
          />
        }
      />
    </div>
  );
}
