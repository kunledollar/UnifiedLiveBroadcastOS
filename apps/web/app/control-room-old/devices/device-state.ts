import type {
  BroadcastDevice,
  DevicePluginDefinition,
  ProtocolDefinition,
  RoutingEndpoint,
} from '@ubos/shared';
import { createDeviceCommandIntent } from '@ubos/shared';

export type DeviceState = {
  devices: BroadcastDevice[];
  protocols: ProtocolDefinition[];
  routingEndpoints: RoutingEndpoint[];
  plugins: DevicePluginDefinition[];
  selectedDeviceId: string | null;
  selectedProtocolId: string | null;
  commandLog: ReturnType<typeof createDeviceCommandIntent>[];
};

export type DeviceAction =
  | { type: 'SELECT_DEVICE'; deviceId: string | null }
  | { type: 'SELECT_PROTOCOL'; protocolId: string | null }
  | { type: 'TOGGLE_DEVICE'; deviceId: string }
  | { type: 'ASSIGN_ROUTE'; inputId: string; outputId: string }
  | { type: 'ACKNOWLEDGE_WARNING'; deviceId: string };

export function createInitialDeviceState(manifest: {
  devices: BroadcastDevice[];
  protocols: ProtocolDefinition[];
  routingEndpoints: RoutingEndpoint[];
  plugins: DevicePluginDefinition[];
}): DeviceState {
  return {
    devices: manifest.devices,
    protocols: manifest.protocols,
    routingEndpoints: manifest.routingEndpoints,
    plugins: manifest.plugins,
    selectedDeviceId: manifest.devices[0]?.id ?? null,
    selectedProtocolId: manifest.protocols[0]?.id ?? null,
    commandLog: [],
  };
}

export function deviceReducer(state: DeviceState, action: DeviceAction): DeviceState {
  const appendCommand = (command: ReturnType<typeof createDeviceCommandIntent>) => ({
    commandLog: [command, ...state.commandLog].slice(0, 50),
  });

  switch (action.type) {
    case 'SELECT_DEVICE':
      return { ...state, selectedDeviceId: action.deviceId };
    case 'SELECT_PROTOCOL':
      return { ...state, selectedProtocolId: action.protocolId };
    case 'TOGGLE_DEVICE': {
      const current = state.devices.find((device) => device.id === action.deviceId);
      const nextStatus = current?.status === 'disabled' ? ('disconnected' as const) : ('disabled' as const);
      return {
        ...state,
        devices: state.devices.map((device) =>
          device.id === action.deviceId ? { ...device, status: nextStatus } : device,
        ),
        ...appendCommand(
          createDeviceCommandIntent(
            nextStatus === 'disabled' ? 'DISABLE_DEVICE' : 'ENABLE_DEVICE',
            { deviceId: action.deviceId },
          ),
        ),
      };
    }
    case 'ASSIGN_ROUTE':
      return {
        ...state,
        routingEndpoints: state.routingEndpoints.map((endpoint) => {
          if (endpoint.id === action.outputId) {
            return {
              ...endpoint,
              status: 'assigned' as const,
              assignedRouteId: `route-${action.inputId}-${action.outputId}`,
              destinationId: action.outputId,
              sourceId: action.inputId,
            };
          }
          return endpoint;
        }),
        ...appendCommand(
          createDeviceCommandIntent('ASSIGN_ROUTE', {
            inputId: action.inputId,
            outputId: action.outputId,
          }),
        ),
      };
    case 'ACKNOWLEDGE_WARNING':
      return {
        ...state,
        ...appendCommand(createDeviceCommandIntent('ACKNOWLEDGE_WARNING', { deviceId: action.deviceId })),
      };
    default:
      return state;
  }
}
