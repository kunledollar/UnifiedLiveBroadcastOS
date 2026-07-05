/** UBOS GPU Compositor metadata contracts. Phase 19 is architecture only: no rendering, shaders, textures, GPU handles, FFmpeg, WebGL, WebGPU, canvas, or video decoding. */
export const COMPOSITOR_SCHEMA_VERSION = '19.0.0' as const;
export type CompositorStatus = 'unavailable' | 'renderer_inactive' | 'metadata_only';
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'add' | 'subtract';
export type LayerType = 'background' | 'video' | 'image' | 'browser' | 'text' | 'graphics' | 'replay' | 'clock' | 'ticker' | 'logo' | 'scoreboard' | 'camera' | 'remote_guest' | 'scene' | 'overlay' | 'lower_third' | 'picture_in_picture' | 'audio_visualization' | 'custom_layer';
export type LayerGroupKind = 'graphics' | 'replay' | 'media' | 'guests' | 'branding' | 'lower_thirds' | 'sponsors' | 'sports' | 'news' | 'virtual_sets' | 'custom';
export type RenderPassType = 'background' | 'scene' | 'media' | 'graphics' | 'effects' | 'transition' | 'output' | 'preview' | 'confidence' | 'aux';
export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'wipe' | 'slide' | 'push' | 'zoom' | 'stinger' | 'dip' | 'custom';
export type EffectType = 'opacity' | 'blur' | 'shadow' | 'glow' | 'mask' | 'chroma_key' | 'luma_key' | 'crop' | 'color_correction' | 'transform' | 'perspective' | 'gaussian_blur' | 'sharpen' | 'brightness' | 'contrast' | 'saturation';
export type ShaderStage = 'vertex' | 'fragment' | 'compute';
export interface VersionedMetadata { id: string; name: string; version: string; description: string; metadataOnly: true; }
export interface Transform2D { x: number; y: number; }
export interface CropRect { top: number; right: number; bottom: number; left: number; }
export interface Resolution { width: number; height: number; }
export interface CompositionLayer extends VersionedMetadata { layerType: LayerType; visible: boolean; opacity: number; blendMode: BlendMode; position: Transform2D; scale: Transform2D; rotation: number; crop: CropRect; anchor: Transform2D; zOrder: number; locked: boolean; muted: boolean; selected: boolean; programVisible: boolean; previewVisible: boolean; sourceRef?: string; effectIds: string[]; }
export interface LayerGroup extends VersionedMetadata { kind: LayerGroupKind; layerIds: string[]; locked: boolean; visible: boolean; }
export interface EffectDefinition extends VersionedMetadata { type: EffectType; parameters: Record<string, string | number | boolean>; enabled: boolean; }
export interface TransitionDefinition extends VersionedMetadata { type: TransitionType; durationMs: number; parameters: Record<string, string | number | boolean>; }
export interface ShaderDefinition extends VersionedMetadata { stage: ShaderStage; parameters: string[]; uniforms: string[]; textures: string[]; inputs: string[]; outputs: string[]; language: 'metadata_only'; }
export interface RenderTarget extends VersionedMetadata { resolution: Resolution; colorSpace: string; pixelFormat: string; surfaceId?: string; }
export interface OutputSurface extends VersionedMetadata { targetId: string; destination: 'program' | 'preview' | 'confidence' | 'aux' | 'encoder'; status: CompositorStatus; }
export interface RenderSurface extends VersionedMetadata { resolution: Resolution; colorSpace: string; pixelFormat: string; status: CompositorStatus; }
export interface RenderPass extends VersionedMetadata { passType: RenderPassType; inputNodeIds: string[]; outputTargetId?: string; effectIds: string[]; transitionId?: string; enabled: boolean; }
export interface RenderNode extends VersionedMetadata { nodeType: 'scene' | 'layer_stack' | 'effects' | 'transition' | 'output' | 'encoder' | 'pass'; inputIds: string[]; outputIds: string[]; passId?: string; }
export interface RenderGraph extends VersionedMetadata { nodes: RenderNode[]; passes: RenderPass[]; edges: Array<{ from: string; to: string }>; executionEnabled: false; }
export interface Composition extends VersionedMetadata { layers: CompositionLayer[]; groups: LayerGroup[]; effects: EffectDefinition[]; transitions: TransitionDefinition[]; activeTransitionId?: string; renderGraphId: string; }
export interface RenderPipeline extends VersionedMetadata { graphId: string; passIds: string[]; targetIds: string[]; outputSurfaceIds: string[]; executionEnabled: false; }
export interface RenderContext extends VersionedMetadata { productionEngineRef?: string; executionEngineRef?: string; graphicsEngineRef?: string; mediaRuntimeRef?: string; readOnlyIntegration: true; rendererStatus: CompositorStatus; }
export interface RenderFrame extends VersionedMetadata { frameNumber: number; timestamp: string; resolution: Resolution; frameRate: number; colorSpace: string; pixelFormat: string; renderDurationMs?: number; dropped: boolean; presented: boolean; }
export interface RenderStatistics extends VersionedMetadata { layerCount: number; effectCount: number; transitionCount: number; outputTargetCount: number; frameQueueStatus: 'unavailable'; rendererStatus: CompositorStatus; }
export interface RenderHealth extends VersionedMetadata { status: CompositorStatus; gpuConnected: false; rendererActive: false; messages: string[]; }
export interface SceneRenderer extends VersionedMetadata { rendererStatus: CompositorStatus; supportedPasses: RenderPassType[]; }
export interface FrameRenderer extends VersionedMetadata { rendererStatus: CompositorStatus; acceptsRuntimeFrames: false; }
export interface Compositor extends VersionedMetadata { status: CompositorStatus; composition: Composition; graph: RenderGraph; pipeline: RenderPipeline; context: RenderContext; statistics: RenderStatistics; health: RenderHealth; }
export interface CompositorManifest extends VersionedMetadata { compositor: Compositor; renderTargets: RenderTarget[]; renderSurfaces: RenderSurface[]; outputSurfaces: OutputSurface[]; shaders: ShaderDefinition[]; sceneRenderer: SceneRenderer; frameRenderer: FrameRenderer; containsRuntimeHandles: false; }
