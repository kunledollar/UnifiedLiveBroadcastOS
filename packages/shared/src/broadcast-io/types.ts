export type BroadcastInputProtocol = 'ndi_source' | 'srt_listener' | 'srt_caller' | 'rtmp_input' | 'rtmps_input' | 'rtp' | 'udp' | 'hls' | 'mpeg_ts' | 'webrtc_input' | 'ip_camera' | 'hardware_capture_card' | 'virtual_camera';
export type BroadcastOutputKind = 'program' | 'preview' | 'aux' | 'clean_feed' | 'multiview' | 'replay' | 'graphics' | 'iso' | 'recording' | 'streaming';
export type BroadcastIoProtocol = 'ndi' | 'srt' | 'rtmp' | 'rtmps' | 'udp' | 'hls' | 'rtp' | 'mpeg_ts' | 'webrtc' | 'ip_camera' | 'capture_card' | 'virtual_camera';
export type BroadcastRouteSource = 'program' | 'preview' | 'replay' | 'graphics' | 'aux' | 'camera' | 'media' | 'browser' | 'guest' | 'monitor_wall';
export type DestinationStatus = 'connected' | 'connecting' | 'disconnected';
export type DestinationHealth = 'healthy' | 'degraded' | 'offline' | 'unknown';
export type LatencyMode = 'ultra_low' | 'low' | 'normal' | 'resilient';
export type ReconnectPolicy = 'none' | 'fixed' | 'exponential' | 'operator_manual';

export interface BroadcastInputDefinition { id: string; name: string; protocol: BroadcastInputProtocol; enabled: boolean; metadata: Record<string, unknown>; }
export interface BroadcastProtocolSettings { host: string; port: number; key?: string; passwordConfigured: boolean; encryption: 'none' | 'passphrase' | 'tls' | 'dtls'; latencyMs: number; retries: number; reconnect: boolean; bandwidthKbps: number; }
export interface EncoderSettings { resolution: string; fps: number; bitrateKbps: number; codec: 'h264' | 'h265' | 'av1' | 'prores'; audioChannels: number; }
export interface DestinationRuntimeStatus { status: DestinationStatus; droppedFrames: number; packetsLost: number; currentBitrateKbps: number; currentFps: number; latencyMs: number; reconnectAttempts: number; health: DestinationHealth; healthHistory: { at: string; health: DestinationHealth; message: string }[]; }
export interface BroadcastOutputDestination { id: string; name: string; kind: BroadcastOutputKind; protocol: BroadcastIoProtocol; encoder: EncoderSettings; latencyMode: LatencyMode; reconnectPolicy: ReconnectPolicy; protocolSettings: BroadcastProtocolSettings; status: DestinationStatus; runtime: DestinationRuntimeStatus; createdAt: string; updatedAt: string; }
export interface BroadcastOutputRoute { id: string; source: BroadcastRouteSource; destinationId: string; enabled: boolean; label?: string; }
export interface BroadcastIoSettings { defaultReconnectPolicy: ReconnectPolicy; preserveMetadataOnlyState: true; }
export interface BroadcastIoInspector { destination: BroadcastOutputDestination; protocol: BroadcastIoProtocol; encoder: EncoderSettings; transport: BroadcastProtocolSettings; packetStatistics: Pick<DestinationRuntimeStatus, 'droppedFrames' | 'packetsLost' | 'currentBitrateKbps' | 'currentFps' | 'latencyMs' | 'reconnectAttempts'>; healthHistory: DestinationRuntimeStatus['healthHistory']; }
export interface BroadcastIoManifest { version: '3.13'; inputs: BroadcastInputDefinition[]; destinations: BroadcastOutputDestination[]; routes: BroadcastOutputRoute[]; settings: BroadcastIoSettings; containsRuntimeSockets: false; containsRuntimeTransportObjects: false; }
