export type GpuRuntimeBackend = 'mock' | 'webgl' | 'webgpu';
export type GpuRuntimeStatus = 'unavailable' | 'ready';

export interface GpuRuntimeCapabilities {
  readonly backend: GpuRuntimeBackend;
  readonly status: GpuRuntimeStatus;
  readonly supportsTextures: boolean;
  readonly supportsCompute: boolean;
  readonly reason?: string;
}

export interface GpuRuntimeManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly capabilities: GpuRuntimeCapabilities;
}

export function createGpuRuntimeManifest(
  backend: GpuRuntimeBackend = 'mock',
  available = false,
): GpuRuntimeManifest {
  return {
    id: 'gpu-runtime-foundation',
    name: 'GPU Runtime Foundation',
    version: '9.4',
    capabilities: {
      backend,
      status: available ? 'ready' : 'unavailable',
      supportsTextures: available && backend !== 'mock',
      supportsCompute: available && backend === 'webgpu',
      ...(available ? {} : { reason: 'GPU runtime is a capability manifest until a production backend is available' }),
    },
  };
}

export function isGpuRuntimeAvailable(manifest = createGpuRuntimeManifest()): boolean {
  return manifest.capabilities.status === 'ready';
}
