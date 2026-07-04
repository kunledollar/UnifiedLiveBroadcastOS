import type {
  BroadcastDevice,
  DeviceCapability,
  DeviceManifest,
  DevicePluginDefinition,
  ProtocolDefinition,
  RoutingEndpoint,
} from './types.js';

const now = () => new Date().toISOString();

function capability(type: DeviceCapability['type'], supported: boolean, notes?: string): DeviceCapability {
  return { type, supported, ...(notes ? { notes } : {}) };
}

export function createDefaultProtocolDefinitions(): ProtocolDefinition[] {
  return [
    {
      id: 'proto-ndi',
      name: 'NDI',
      protocol: 'ndi',
      version: '5.x metadata',
      transport: 'IP LAN',
      authentication: 'none',
      capabilities: ['preview', 'routing', 'stream'],
      supportedCommands: ['discover', 'preview_source'],
    },
    {
      id: 'proto-atem',
      name: 'ATEM',
      protocol: 'atem',
      version: '1.0 metadata',
      transport: 'UDP',
      authentication: 'unavailable',
      capabilities: ['routing', 'macros', 'tally', 'audio'],
      supportedCommands: ['cut', 'auto', 'macro_run'],
    },
    {
      id: 'proto-visca-ip',
      name: 'VISCA over IP',
      protocol: 'visca_over_ip',
      version: '1.0 metadata',
      transport: 'TCP',
      authentication: 'none',
      capabilities: ['ptz', 'camera_shading'],
      supportedCommands: ['pan_tilt', 'zoom', 'preset_recall'],
    },
    {
      id: 'proto-rosstalk',
      name: 'RossTalk',
      protocol: 'rosstalk',
      version: 'metadata',
      transport: 'TCP',
      authentication: 'unavailable',
      capabilities: ['routing', 'graphics', 'macros'],
      supportedCommands: ['route', 'take'],
    },
    {
      id: 'proto-hyperdeck',
      name: 'HyperDeck',
      protocol: 'hyperdeck',
      version: 'metadata',
      transport: 'TCP',
      authentication: 'none',
      capabilities: ['record', 'replay'],
      supportedCommands: ['play', 'stop', 'record'],
    },
    {
      id: 'proto-osc',
      name: 'OSC',
      protocol: 'osc',
      version: '1.0 metadata',
      transport: 'UDP',
      authentication: 'none',
      capabilities: ['audio', 'lighting', 'graphics'],
      supportedCommands: ['send_message'],
    },
    {
      id: 'proto-nmos',
      name: 'NMOS',
      protocol: 'nmos',
      version: 'IS-04 metadata',
      transport: 'HTTP/REST',
      authentication: 'unavailable',
      capabilities: ['routing', 'preview'],
      supportedCommands: ['discover', 'register'],
    },
    {
      id: 'proto-custom',
      name: 'Custom Plugin',
      protocol: 'custom_plugin',
      version: 'future',
      transport: 'plugin',
      authentication: 'unavailable',
      capabilities: ['macros'],
      supportedCommands: ['metadata_only'],
    },
  ];
}

export function createSampleBroadcastDevices(): BroadcastDevice[] {
  const timestamp = now();
  return [
    {
      id: 'dev-bmd-atem',
      name: 'ATEM Mini Pro',
      manufacturer: 'Blackmagic',
      model: 'ATEM Mini Pro ISO',
      category: 'automation',
      deviceType: 'switcher',
      protocol: 'atem',
      ipAddress: '192.168.1.50',
      port: 9910,
      status: 'unavailable',
      health: 'unavailable',
      capabilities: [
        capability('routing', true),
        capability('macros', true),
        capability('tally', true),
      ],
      firmware: '9.3 metadata',
      lastSeen: timestamp,
      notes: 'Metadata only · No device detected',
    },
    {
      id: 'dev-sony-ptz',
      name: 'Studio PTZ 1',
      manufacturer: 'Sony',
      model: 'BRC-X400',
      category: 'ptz',
      deviceType: 'ptz_camera',
      protocol: 'visca_over_ip',
      ipAddress: '192.168.1.61',
      port: 52381,
      status: 'disconnected',
      health: 'unknown',
      capabilities: [
        capability('ptz', true),
        capability('camera_shading', false, 'Unavailable'),
        capability('preview', false),
      ],
      firmware: 'unavailable',
      lastSeen: timestamp,
    },
    {
      id: 'dev-ndi-cam',
      name: 'NDI Camera A',
      manufacturer: 'BirdDog',
      model: 'P400',
      category: 'cameras',
      deviceType: 'ndi_device',
      protocol: 'ndi',
      status: 'unavailable',
      health: 'unavailable',
      capabilities: [
        capability('preview', true),
        capability('stream', true),
        capability('ptz', true),
      ],
      notes: 'NDI discovery unavailable',
    },
    {
      id: 'dev-aja-capture',
      name: 'KONA Capture 1',
      manufacturer: 'AJA',
      model: 'KONA 5',
      category: 'capture_cards',
      deviceType: 'capture_card',
      protocol: 'sdi',
      status: 'ready',
      health: 'healthy',
      capabilities: [capability('routing', true), capability('preview', true)],
      firmware: '16.2 metadata',
    },
    {
      id: 'dev-ross-router',
      name: 'Video Router',
      manufacturer: 'Ross',
      model: 'Ultrix',
      category: 'networking',
      deviceType: 'video_router',
      protocol: 'rosstalk',
      ipAddress: '192.168.1.70',
      port: 7788,
      status: 'disconnected',
      health: 'degraded',
      capabilities: [capability('routing', true)],
      firmware: 'firmware metadata unavailable',
      lastSeen: timestamp,
    },
    {
      id: 'dev-hyperdeck',
      name: 'HyperDeck Studio',
      manufacturer: 'Blackmagic',
      model: 'HyperDeck Studio HD Plus',
      category: 'recording',
      deviceType: 'hyperdeck',
      protocol: 'hyperdeck',
      ipAddress: '192.168.1.80',
      port: 9993,
      status: 'unavailable',
      health: 'unavailable',
      capabilities: [capability('record', true), capability('replay', true)],
    },
    {
      id: 'dev-audio-console',
      name: 'Audio Console',
      manufacturer: 'Calrec',
      model: 'Type R',
      category: 'audio',
      deviceType: 'audio_console',
      protocol: 'osc',
      ipAddress: '192.168.1.90',
      port: 8000,
      status: 'disconnected',
      health: 'unknown',
      capabilities: [capability('audio', true), capability('tally', false)],
    },
    {
      id: 'dev-tally-gpio',
      name: 'Tally GPIO Box',
      manufacturer: 'Custom',
      model: 'GPIO-8',
      category: 'custom',
      deviceType: 'gpio',
      protocol: 'gpio',
      status: 'disabled',
      health: 'unavailable',
      capabilities: [capability('tally', true), capability('lighting', false)],
    },
  ] as BroadcastDevice[];
}

export function createSampleRoutingEndpoints(): RoutingEndpoint[] {
  return [
    { id: 'in-cam-1', label: 'CAM 1', direction: 'input', status: 'ready' },
    { id: 'in-cam-2', label: 'CAM 2', direction: 'input', status: 'ready' },
    { id: 'in-ndi-1', label: 'NDI 1', direction: 'input', status: 'unavailable' },
    { id: 'in-sdi-1', label: 'SDI 1', direction: 'input', status: 'ready' },
    { id: 'in-replay', label: 'Replay', direction: 'input', status: 'assigned', assignedRouteId: 'route-replay-pgm' },
    { id: 'out-pgm', label: 'Program', direction: 'output', status: 'assigned', sourceId: 'in-cam-1', assignedRouteId: 'route-cam1-pgm' },
    { id: 'out-pvw', label: 'Preview', direction: 'output', status: 'assigned', sourceId: 'in-cam-2', assignedRouteId: 'route-cam2-pvw' },
    { id: 'out-multiview', label: 'Multiview', direction: 'output', status: 'warning' },
    { id: 'out-clean', label: 'Clean Feed', direction: 'output', status: 'unassigned' },
  ];
}

export function createSampleDevicePlugins(): DevicePluginDefinition[] {
  return [
    { id: 'plugin-bmd', name: 'Blackmagic', manufacturer: 'Blackmagic Design', protocols: ['atem', 'hyperdeck'], status: 'unavailable', description: 'ATEM, HyperDeck metadata' },
    { id: 'plugin-ross', name: 'Ross', manufacturer: 'Ross Video', protocols: ['rosstalk'], status: 'unavailable' },
    { id: 'plugin-viz', name: 'Vizrt', manufacturer: 'Vizrt', protocols: ['mos', 'tcp'], status: 'coming_soon' },
    { id: 'plugin-sony', name: 'Sony', manufacturer: 'Sony', protocols: ['visca_over_ip', 'onvif'], status: 'unavailable' },
    { id: 'plugin-canon', name: 'Canon', manufacturer: 'Canon', protocols: ['visca_over_ip'], status: 'coming_soon' },
    { id: 'plugin-panasonic', name: 'Panasonic', manufacturer: 'Panasonic', protocols: ['visca_over_ip'], status: 'coming_soon' },
    { id: 'plugin-newtek', name: 'NewTek', manufacturer: 'NewTek', protocols: ['ndi', 'tcp'], status: 'unavailable' },
    { id: 'plugin-birddog', name: 'BirdDog', manufacturer: 'BirdDog', protocols: ['ndi', 'visca_over_ip'], status: 'unavailable' },
    { id: 'plugin-magewell', name: 'Magewell', manufacturer: 'Magewell', protocols: ['ndi', 'sdi'], status: 'unavailable' },
    { id: 'plugin-aja', name: 'AJA', manufacturer: 'AJA', protocols: ['sdi'], status: 'unavailable' },
    { id: 'plugin-evs', name: 'EVS', manufacturer: 'EVS', protocols: ['tcp', 'rest'], status: 'coming_soon' },
    { id: 'plugin-obs', name: 'OBS', manufacturer: 'OBS Project', protocols: ['websocket', 'rest'], status: 'unavailable' },
    { id: 'plugin-vmix', name: 'vMix', manufacturer: 'vMix', protocols: ['tcp', 'rest'], status: 'unavailable' },
    { id: 'plugin-wirecast', name: 'Wirecast', manufacturer: 'Telestream', protocols: ['rest'], status: 'coming_soon' },
    { id: 'plugin-tricaster', name: 'TriCaster', manufacturer: 'NewTek', protocols: ['tcp', 'ndi'], status: 'coming_soon' },
    { id: 'plugin-future', name: 'Future Plugin', manufacturer: 'Custom', protocols: ['custom_plugin'], status: 'disabled' },
  ];
}

export function createDeviceManifest(input?: {
  devices?: BroadcastDevice[];
  protocols?: ProtocolDefinition[];
  routingEndpoints?: RoutingEndpoint[];
  plugins?: DevicePluginDefinition[];
}): DeviceManifest {
  return {
    devices: input?.devices ?? createSampleBroadcastDevices(),
    protocols: input?.protocols ?? createDefaultProtocolDefinitions(),
    routingEndpoints: input?.routingEndpoints ?? createSampleRoutingEndpoints(),
    plugins: input?.plugins ?? createSampleDevicePlugins(),
    containsRuntimeHandles: false,
  };
}

export function isDeviceManifestReplaySafe(manifest: DeviceManifest): boolean {
  return manifest.containsRuntimeHandles === false;
}
