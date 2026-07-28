import type {
  BroadcastDestination,
  OutputHealth,
  OutputRoute,
  StreamProfile,
} from '@ubos/shared';
import { createDistributionCommandIntent } from '@ubos/shared';

export type DistributionState = {
  destinations: BroadcastDestination[];
  streamProfiles: StreamProfile[];
  outputRoutes: OutputRoute[];
  outputHealth: OutputHealth[];
  selectedDestinationId: string | null;
  selectedProfileId: string | null;
  commandLog: ReturnType<typeof createDistributionCommandIntent>[];
};

export type DistributionAction =
  | { type: 'SELECT_DESTINATION'; destinationId: string | null }
  | { type: 'SELECT_PROFILE'; profileId: string | null }
  | { type: 'TOGGLE_DESTINATION'; destinationId: string }
  | { type: 'ASSIGN_ROUTE'; destinationId: string; sourceView: OutputRoute['sourceView'] }
  | { type: 'REMOVE_DESTINATION'; destinationId: string }
  | { type: 'ACKNOWLEDGE_WARNING'; destinationId: string };

export function createInitialDistributionState(manifest: {
  destinations: BroadcastDestination[];
  streamProfiles: StreamProfile[];
  outputRoutes: OutputRoute[];
  outputHealth: OutputHealth[];
}): DistributionState {
  return {
    destinations: manifest.destinations,
    streamProfiles: manifest.streamProfiles,
    outputRoutes: manifest.outputRoutes,
    outputHealth: manifest.outputHealth,
    selectedDestinationId: manifest.destinations[0]?.id ?? null,
    selectedProfileId: manifest.streamProfiles[0]?.id ?? null,
    commandLog: [],
  };
}

export function distributionReducer(
  state: DistributionState,
  action: DistributionAction,
): DistributionState {
  const appendCommand = (command: ReturnType<typeof createDistributionCommandIntent>) => ({
    commandLog: [command, ...state.commandLog].slice(0, 50),
  });

  const touchDestination = (destination: BroadcastDestination): BroadcastDestination => ({
    ...destination,
    updatedAt: new Date().toISOString(),
  });

  switch (action.type) {
    case 'SELECT_DESTINATION':
      return { ...state, selectedDestinationId: action.destinationId };
    case 'SELECT_PROFILE':
      return { ...state, selectedProfileId: action.profileId };
    case 'TOGGLE_DESTINATION': {
      const current = state.destinations.find((destination) => destination.id === action.destinationId);
      const nextStatus =
        current?.status === 'disabled' ? ('disconnected' as const) : ('disabled' as const);
      return {
        ...state,
        destinations: state.destinations.map((destination) =>
          destination.id === action.destinationId
            ? touchDestination({ ...destination, status: nextStatus })
            : destination,
        ),
        ...appendCommand(
          createDistributionCommandIntent(
            nextStatus === 'disabled' ? 'DISABLE_DESTINATION' : 'ENABLE_DESTINATION',
            { destinationId: action.destinationId },
          ),
        ),
      };
    }
    case 'ASSIGN_ROUTE': {
      const routeId = `route-${action.sourceView}-${action.destinationId}`;
      const existing = state.outputRoutes.find((route) => route.destinationId === action.destinationId);
      const nextRoute: OutputRoute = existing
        ? { ...existing, sourceView: action.sourceView, status: 'assigned' }
        : {
            id: routeId,
            destinationId: action.destinationId,
            sourceView: action.sourceView,
            status: 'assigned',
          };
      const outputRoutes = existing
        ? state.outputRoutes.map((route) =>
            route.destinationId === action.destinationId ? nextRoute : route,
          )
        : [...state.outputRoutes, nextRoute];
      return {
        ...state,
        outputRoutes,
        destinations: state.destinations.map((destination) =>
          destination.id === action.destinationId
            ? touchDestination({ ...destination, routeId: nextRoute.id })
            : destination,
        ),
        ...appendCommand(
          createDistributionCommandIntent('ASSIGN_ROUTE', {
            destinationId: action.destinationId,
            sourceView: action.sourceView,
          }),
        ),
      };
    }
    case 'REMOVE_DESTINATION':
      return {
        ...state,
        destinations: state.destinations.filter((destination) => destination.id !== action.destinationId),
        outputRoutes: state.outputRoutes.filter(
          (route) => route.destinationId !== action.destinationId,
        ),
        outputHealth: state.outputHealth.filter(
          (health) => health.destinationId !== action.destinationId,
        ),
        selectedDestinationId:
          state.selectedDestinationId === action.destinationId
            ? null
            : state.selectedDestinationId,
        ...appendCommand(
          createDistributionCommandIntent('REMOVE_DESTINATION', {
            destinationId: action.destinationId,
          }),
        ),
      };
    case 'ACKNOWLEDGE_WARNING':
      return {
        ...state,
        destinations: state.destinations.map((destination) =>
          destination.id === action.destinationId
            ? touchDestination({ ...destination, warnings: [] })
            : destination,
        ),
      };
    default:
      return state;
  }
}
