export {
  UBOS_GRAPHICS_PLATFORM_CERTIFICATION_STATUS,
  UBOS_GRAPHICS_PLATFORM_RELEASE_NAME,
  UBOS_GRAPHICS_PLATFORM_RELEASE_READY,
  UBOS_GRAPHICS_PLATFORM_VERSION,
} from './graphics-platform-release.js';

export {
  MULTI_FORMAT_GRAPHICS_COMMAND_TYPES,
  MULTI_FORMAT_GRAPHICS_PROCESSOR_ORDER,
  MULTI_FORMAT_GRAPHICS_VERSION,
  MultiFormatGraphicsCoordinatorEngine,
  MultiFormatGraphicsCoordinatorProcessor,
  MultiFormatGraphicsError,
  createMultiFormatGraphicsCommandHandlers,
  createMultiFormatGraphicsCoordinatorEngine,
  createMultiFormatGraphicsCoordinatorProcessor,
  type GraphicsAnimationVariantPolicy,
  type GraphicsAssetVariantPolicy,
  type GraphicsBrandingVariantPolicy,
  type GraphicsCaptionVariantPolicy,
  type GraphicsFieldVariantPolicy,
  type GraphicsFormatOrientation,
  type GraphicsFormatType,
  type GraphicsFormatVariantDefinition,
  type GraphicsMultiFormatAction,
  type GraphicsMultiFormatCoordinationPlan,
  type GraphicsMultiFormatCoordinationRequest,
  type GraphicsMultiFormatEngineSnapshot,
  type GraphicsMultiFormatPublicationResult,
  type GraphicsMultiFormatSessionDefinition,
  type GraphicsMultiFormatSessionState,
  type GraphicsMultiFormatStatus,
  type GraphicsMultiOutputGroupDefinition,
  type GraphicsOutputFormatDefinition,
  type GraphicsOutputPublicationEntry,
  type GraphicsOutputRole,
  type GraphicsPublicationPolicy,
  type GraphicsRegionVariantMapping,
  type GraphicsSynchronizationPolicy,
  type GraphicsTextPolicy,
  type GraphicsTypographyVariantPolicy,
  type GraphicsVariantClass,
  type GraphicsVariantCompatibilityResult,
  type GraphicsVariantFallbackPolicy,
  type GraphicsVariantReadinessState,
  type GraphicsVisibilityAction,
  type MultiFormatGraphicsCommandType,
  type MultiFormatWatchdogIncident,
} from './multi-format-graphics-coordination.js';

export {
  BRANDING_SAFE_AREA_COMMAND_TYPES,
  BRANDING_SAFE_AREA_PROCESSOR_ORDER,
  BRANDING_SAFE_AREA_VERSION,
  BrandingSafeAreaCoordinatorEngine,
  BrandingSafeAreaCoordinatorProcessor,
  BrandingSafeAreaError,
  createBrandingSafeAreaCommandHandlers,
  createBrandingSafeAreaCoordinatorEngine,
  createBrandingSafeAreaCoordinatorProcessor,
  type BrandAnchor,
  type BrandAssetReference,
  type BrandAssetType,
  type BrandBackgroundClass,
  type BrandCropPolicy,
  type BrandDefinition,
  type BrandLogoDefinition,
  type BrandOpacityPolicy,
  type BrandPlacementPolicy,
  type BrandProfileDefinition,
  type BrandScalingPolicy,
  type BrandSchedulePolicy,
  type BrandType,
  type BrandVariantDefinition,
  type BrandVisibilityPolicy,
  type BrandWatermarkDefinition,
  type BrandingAction,
  type BrandingAspectRatioRole,
  type BrandingCoordinationPlan,
  type BrandingCoordinationRequest,
  type BrandingCoordinationSessionDefinition,
  type BrandingEngineSnapshot,
  type BrandingInheritancePolicy,
  type BrandingOutputRole,
  type BrandingPrecedencePolicy,
  type BrandingSafeAreaCommandType,
  type BrandingSafeAreaHealthSnapshot,
  type BrandingSafeAreaTelemetrySnapshot,
  type BrandingSessionState,
  type BrandingWatchdogIncident,
  type GraphicsExclusionZoneDefinition,
  type GraphicsExclusionZoneType,
  type GraphicsProtectedRegionDefinition,
  type GraphicsSafeAreaClass,
  type GraphicsSafeAreaDefinition,
  type NormalizedRect,
} from './branding-safe-area-coordination.js';

export {
  GRAPHICS_ANIMATION_CUEING_COMMAND_TYPES,
  GRAPHICS_ANIMATION_CUEING_PROCESSOR_ORDER,
  GRAPHICS_ANIMATION_CUEING_VERSION,
  GraphicsAnimationCueingEngine,
  GraphicsAnimationCueingError,
  GraphicsAnimationCueingProcessor,
  createGraphicsAnimationCueingCommandHandlers,
  createGraphicsAnimationCueingEngine,
  createGraphicsAnimationCueingProcessor,
  type GraphicsAnimationCueingCommandType,
  type GraphicsAnimationDefinition,
  type GraphicsAnimationHealth,
  type GraphicsAnimationKind,
  type GraphicsAnimationLifecycle,
  type GraphicsAnimationRole,
  type GraphicsAnimationSnapshot,
  type GraphicsAnimationSourceGraph,
  type GraphicsAnimationTelemetry,
  type GraphicsAnimationWatchdogIncident,
  type GraphicsCueStack,
  type GraphicsTransitionCoordination,
} from './graphics-animation-cueing.js';

export {
  CAPTION_ACCESSIBILITY_COMMAND_TYPES,
  CAPTION_ACCESSIBILITY_GRAPHICS_VERSION,
  CAPTION_ACCESSIBILITY_PROCESSOR_ORDER,
  CaptionAccessibilityEngine,
  CaptionAccessibilityError,
  CaptionAccessibilityProcessor,
  createCaptionAccessibilityCommandHandlers,
  createCaptionAccessibilityEngine,
  createCaptionAccessibilityProcessor,
  type AccessibilityGraphic,
  type CaptionAccessibilityCommandType,
  type CaptionAccessibilityHealth,
  type CaptionAccessibilitySnapshot,
  type CaptionAccessibilitySourceGraph,
  type CaptionAccessibilityTelemetry,
  type CaptionCue,
  type CaptionCueLifecycle,
  type CaptionOutputRole,
  type CaptionRegion,
  type CaptionTrack,
  type CaptionTrackKind,
  type CaptionWatchdogIncident,
} from './caption-accessibility-graphics.js';

export {
  BROADCAST_GRAPHICS_COMMAND_TYPES,
  BROADCAST_GRAPHICS_FOUNDATION_VERSION,
  BROADCAST_GRAPHICS_PROCESSOR_ORDER,
  BroadcastGraphicsEngine,
  BroadcastGraphicsError,
  BroadcastGraphicsProcessor,
  createBroadcastGraphicsCommandHandlers,
  createBroadcastGraphicsEngine,
  createBroadcastGraphicsProcessor,
  type BroadcastGraphicsCommandType,
  type BroadcastGraphicsDefinition,
  type BroadcastGraphicsHealth,
  type BroadcastGraphicsKind,
  type BroadcastGraphicsLifecycle,
  type BroadcastGraphicsRole,
  type BroadcastGraphicsSnapshot,
  type BroadcastGraphicsSourceGraph,
  type BroadcastGraphicsTelemetry,
  type BroadcastGraphicsTimer,
  type BroadcastGraphicsWatchdogIncident,
} from './broadcast-graphics-foundation.js';

export {
  AUDIO_DETECTOR_CHANNEL_MODES,
  AUDIO_DETECTOR_MODES,
  AUDIO_DYNAMICS_PROCESSOR_TYPES,
  AUDIO_EQ_DYNAMICS_COMMAND_TYPES,
  AUDIO_EQ_DYNAMICS_EVENTS,
  AUDIO_EQ_DYNAMICS_INSERTION_POINTS,
  AUDIO_EQ_DYNAMICS_OUTPUT_KEYS,
  AUDIO_EQ_DYNAMICS_PROCESSOR_ORDER,
  AUDIO_EQ_DYNAMICS_PROCESSOR_TYPES,
  AUDIO_EQ_DYNAMICS_VERSION,
  AUDIO_EQ_DYNAMICS_WATCHDOG_INCIDENTS,
  AUDIO_EQ_FILTER_TYPES,
  AUDIO_PARAMETER_POLICIES,
  AUDIO_PROCESSING_RESULT_STATUSES,
  AudioEqDynamicsEngine,
  AudioEqDynamicsError,
  AudioEqDynamicsProcessor,
  SyntheticAudioEqDynamicsBackend,
  createAudioEqDynamicsCommandHandlers,
  createAudioEqDynamicsEngine,
  createAudioEqDynamicsProcessor,
  createAudioEqDynamicsSourceGraphSnapshot,
  createSyntheticAudioEqDynamicsBackend,
  validateAudioDynamicsProcessorDefinition,
  validateAudioEqBandDefinition,
  type AudioDetectorChannelMode,
  type AudioDetectorMode,
  type AudioDynamicsProcessorDefinition,
  type AudioDynamicsProcessorDefinitionSnapshot,
  type AudioEqBandDefinition,
  type AudioEqBandDefinitionSnapshot,
  type AudioEqChainDefinition,
  type AudioEqChainDefinitionSnapshot,
  type AudioEqDynamicsBackendSnapshot,
  type AudioEqDynamicsCommandType,
  type AudioEqDynamicsConfigurationTransaction,
  type AudioEqDynamicsConfigurationTransactionSnapshot,
  type AudioEqDynamicsEngineSnapshot,
  type AudioEqDynamicsHealthSnapshot,
  type AudioEqDynamicsInsertionPoint,
  type AudioEqDynamicsProcessPlan,
  type AudioEqDynamicsProcessPlanSnapshot,
  type AudioEqDynamicsProcessRequest,
  type AudioEqDynamicsProcessRequestSnapshot,
  type AudioEqDynamicsProcessResult,
  type AudioEqDynamicsProcessResultSnapshot,
  type AudioEqDynamicsProcessStatus,
  type AudioEqDynamicsProcessorType,
  type AudioEqDynamicsTelemetrySnapshot,
  type AudioEqDynamicsValidationReport,
  type AudioProcessingChainDefinition,
  type AudioProcessingChainDefinitionSnapshot,
  type AudioProcessorStateSnapshot,
  type AudioSidechainReference,
  type AudioSidechainReferenceSnapshot,
  type AudioTargetReference,
} from './audio-eq-dynamics-processing.js';

export {
  AUDIO_CHANNEL_STRIP_COMMAND_TYPES,
  AUDIO_CHANNEL_STRIP_EVENTS,
  AUDIO_CHANNEL_STRIP_GAIN_STAGE_ORDER,
  AUDIO_CHANNEL_STRIP_OUTPUT_KEYS,
  AUDIO_CHANNEL_STRIP_PROCESSOR_ORDER,
  AUDIO_CHANNEL_STRIP_VERSION,
  AUDIO_CHANNEL_STRIP_WATCHDOG_INCIDENTS,
  AUDIO_MUTE_PRIORITY,
  AUDIO_PAN_LAWS,
  AUDIO_ROUTING_TAP_POINTS,
  AudioChannelStripRoutingEngine,
  AudioChannelStripRoutingError,
  AudioChannelStripRoutingProcessor,
  SyntheticAudioChannelStripBackend,
  createAudioChannelStripCommandHandlers,
  createAudioChannelStripRoutingEngine,
  createAudioChannelStripSourceGraphSnapshot,
  createSyntheticAudioChannelStripBackend,
  dbToLinear,
  linearToDb,
  resolvePanCoefficients,
  validateRoutingGraph,
  type AudioChannelFormat,
  type AudioChannelGroupDefinition,
  type AudioChannelGroupSnapshot,
  type AudioChannelLinkSnapshot,
  type AudioChannelStripBackend,
  type AudioChannelStripBackendSnapshot,
  type AudioChannelStripDefinition,
  type AudioChannelStripDefinitionSnapshot,
  type AudioChannelStripRoutingEngineSnapshot,
  type AudioChannelStripRoutingHealthSnapshot,
  type AudioChannelStripRoutingTelemetrySnapshot,
  type AudioChannelStripRoutingValidationReport,
  type AudioChannelStripState,
  type AudioChannelStripStateSnapshot,
  type AudioCleanFeedRoutingSnapshot,
  type AudioGroupType,
  type AudioMixMinusSnapshot,
  type AudioPanMode,
  type AudioPhaseInvertMode,
  type AudioRoutingConfigurationTransaction,
  type AudioRoutingConfigurationTransactionSnapshot,
  type AudioRoutingCyclePolicy,
  type AudioRoutingEdge,
  type AudioRoutingEdgeSnapshot,
  type AudioRoutingEndpoint,
  type AudioRoutingEndpointSnapshot,
  type AudioRoutingEndpointType,
  type AudioRoutingGraph,
  type AudioRoutingGraphSnapshot,
  type AudioSendSnapshot,
  type AudioSoloMode,
  type AudioSubgroupDefinition,
  type AudioSubgroupSnapshot,
  type AudioVcaDefinition,
  type AudioVcaSnapshot,
  type ChannelStripProcessPlan,
  type ChannelStripProcessPlanSnapshot,
  type ChannelStripProcessRequest,
  type ChannelStripProcessRequestSnapshot,
  type ChannelStripProcessResult,
  type ChannelStripProcessResultSnapshot,
  type ChannelStripProcessStatus,
} from './audio-channel-strip-routing.js';

export {
  LIVE_CONTROL_COMMAND_MODES,
  LIVE_CONTROL_COMMAND_TYPES,
  LIVE_CONTROL_EVENTS,
  LIVE_CONTROL_WATCHDOG_INCIDENTS,
  LIVE_PRODUCTION_TALLY_OUTPUT_KEYS,
  LIVE_PRODUCTION_TALLY_PROCESSOR_ORDER,
  TALLY_ENTITY_TYPES,
  TALLY_PRIORITY,
  TALLY_REASON_CODES,
  TALLY_STATES,
  LiveProductionControlTallyError,
  LiveProductionTallyCoordinator,
  LiveProductionTallyProcessor,
  SyntheticTallyPublicationAdapter,
  createLiveProductionControlCommandHandlers,
  createLiveProductionTallyCoordinator,
  createSyntheticTallyPublicationAdapter,
  type AudioTallySnapshot,
  type BusTallySnapshot,
  type CameraTallySnapshot,
  type LiveControlCommandRequestSnapshot,
  type LiveControlCommandResultSnapshot,
  type LiveProductionControlEngineSnapshot,
  type LiveProductionControlHealthSnapshot,
  type LiveProductionControlStateSnapshot,
  type LiveProductionControlTelemetrySnapshot,
  type LiveProductionControlValidationReport,
  type LiveProductionTallySnapshot,
  type OutputRoleTallySnapshot,
  type PipSlotTallySnapshot,
  type RemoteGuestTallySnapshot,
  type SceneTallySnapshot,
  type SourceTallySnapshot,
  type TallyAdapterHealthSnapshot,
  type TallyAssignmentSnapshot,
  type TallyEntityReferenceSnapshot,
  type TallyEntityType,
  type TallyOverrideSnapshot,
  type TallyPublicationAdapter,
  type TallyReasonCode,
  type TallyState,
} from './live-production-control-tally.js';

export {
  AUDIO_BUS_TYPES,
  AUDIO_COMMON_SOURCE_POLICIES,
  AUDIO_EASINGS,
  AUDIO_FOLLOW_COMMAND_TYPES,
  AUDIO_FOLLOW_ERRORS,
  AUDIO_FOLLOW_EVENTS,
  AUDIO_FOLLOW_MODES,
  AUDIO_FOLLOW_OUTPUT_KEYS,
  AUDIO_FOLLOW_WATCHDOG_INCIDENTS,
  AUDIO_MISSING_SOURCE_POLICIES,
  AUDIO_PERSISTENT_POLICIES,
  AUDIO_ROLES,
  AUDIO_ROUTING_RESULT_STATUSES,
  AUDIO_ROUTING_TRANSACTION_STATES,
  AUDIO_SWITCH_MODES,
  AUDIO_VIDEO_FAILURE_POLICIES,
  AudioFollowVideoController,
  AudioFollowVideoError,
  AudioFollowVideoProcessor,
  createAudioFollowCommandHandlers,
  createAudioFollowSourceReference,
  createAudioFollowVideoController,
  createAudioTransitionDefinition,
  createSceneAudioMembership,
  type AudioBusType,
  type AudioCommonSourcePolicy,
  type AudioEasing,
  type AudioFollowMode,
  type AudioFollowSourceReference,
  type AudioFollowSourceSnapshot,
  type AudioFollowVideoEngineSnapshot,
  type AudioFollowVideoHealthSnapshot,
  type AudioFollowVideoTelemetrySnapshot,
  type AudioFollowVideoValidationReport,
  type AudioMissingSourcePolicy,
  type AudioPersistentPolicy,
  type AudioRole,
  type AudioRoutingRequest,
  type AudioRoutingRequestSnapshot,
  type AudioRoutingResult,
  type AudioRoutingResultSnapshot,
  type AudioRoutingResultStatus,
  type AudioRoutingTransaction,
  type AudioRoutingTransactionSnapshot,
  type AudioRoutingTransactionState,
  type AudioSwitchMode,
  type AudioTransitionContribution,
  type AudioTransitionContributionSnapshot,
  type AudioTransitionDefinition,
  type AudioTransitionDefinitionSnapshot,
  type AudioVideoFailurePolicy,
  type PreviewAudioRoute,
  type PreviewAudioRouteSnapshot,
  type ProgramAudioRoute,
  type ProgramAudioRouteSnapshot,
  type SceneAudioMembership,
  type SceneAudioMembershipSnapshot,
} from './audio-follow-video.js';

import type {
  ProductionGraph,
  ProductionGraphTransition,
  ProductionEvent,
} from '../../shared/src/production-graph.js';
import {
  CompositionStore,
  createSceneCompositionFromGraph,
  getCompositionWarnings,
  type CompositionRenderTarget,
} from './compositor/index.js';
import {
  VideoRouteStore,
  createVideoRouteGraph,
  createVideoRoutePlan,
  getVideoRouteWarnings,
} from './routing.js';
import { type FrameTickEvent } from './sync/index.js';
import {
  MediaOrchestrationEngine,
  type MediaExecutionPort,
  type MediaFramePlan,
  type MediaIntent,
  type MediaSubsystemStateSnapshot,
  type TargetSubsystem,
} from './orchestration.js';
import { createClock } from './sync/clock.js';
import {
  AudioRouteStore,
  createAudioRouteGraph,
  createAudioRoutePlan,
  getAudioRouteWarnings,
} from './audio-routing/index.js';
import {
  MultiviewStore,
  createMultiviewPlan,
  validateMultiviewPlan,
  createConfidenceMonitor,
  validateConfidenceSignals,
  executeMockMultiview,
} from './multiview/index.js';
import {
  EncoderStore,
  createEncoderPlan,
  prepareEncoder,
  startEncoder,
  pauseEncoder,
  resumeEncoder,
  drainEncoder,
  stopEncoder,
  failEncoder,
  validateEncoderPlan,
  summarizeEncoderHealth,
  type EncoderSession,
} from './encoder/index.js';
import {
  createWebRTCTransportPlan,
  validateWebRTCTransportPlan,
  createWebRTCSession,
  addWebRTCPeer,
  removeWebRTCPeer,
  updateWebRTCPeerState,
  createWebRTCPeer,
  createWebRTCMediaTrackRef,
  summarizeWebRTCHealth,
  createWebRTCManifest,
  type WebRTCSession,
} from './webrtc-runtime/index.js';
import {
  createGpuRuntime,
  createGpuSession,
  createGpuPipeline,
  createGpuSurface,
  createGpuManifest,
  summarizeGpuHealth,
  type GpuSession,
} from './gpu-runtime/index.js';

export {
  GpuResourceManager,
  MockGpuBackend,
  createGpuResourceManager,
  describeTextureMetadata,
  type GpuBackend as GpuResourceBackend,
  type GpuApi,
  type GpuResourceState,
  type GpuFormat,
  type GpuMemoryKind,
  type GpuTextureUsage,
  type GpuPoolKind,
  type GpuAdapterInfo,
  type TextureDescriptor,
  type BufferDescriptor,
  type FramebufferDescriptor,
  type PipelineDescriptor,
  type SamplerDescriptor,
  type RenderTargetDescriptor,
  type ResourceDescriptor,
  type GpuTextureMetadata,
  type ResourceHandle,
  type FrameContext,
  type GpuFence,
  type GpuQueue,
  type GpuDeviceSnapshot,
  type GpuResourcePool,
  type GpuHealthTelemetry,
  type VideoFrameImport,
} from './gpu-resource-manager.js';

export {
  DefaultColorConversionEngine,
  SyntheticColorConversionBackend,
  ColorConversionPipelineStage,
  createColorConversionEngine,
  createColorConversionPipelineStage,
  createColorConversionCommandHandlers,
  createColorMetadata,
  createSourceGraphColorConversionMetadata,
  COLOR_CONVERSION_COMMAND_TYPES,
  COLOR_CONVERSION_OUTPUT_KEYS,
  COLOR_CONVERSION_WATCHDOG_INCIDENTS,
  ColorConversionError,
  DuplicateColorConversionBackend,
  ColorConversionUnsupported,
  type ColorMetadata,
  type ColorPrimaries,
  type ColorTransfer,
  type ColorMatrix,
  type ColorRange,
  type ChromaSiting,
  type ColorAlphaMode,
  type ColorConversionIntent,
  type ColorConversionQualityTier,
  type ChromaResamplingPolicy,
  type ColorConversionDitherPolicy,
  type ColorConversionClippingPolicy,
  type ColorConversionBackendType,
  type ColorConversionBackendPreference,
  type ColorConversionStep,
  type ColorConversionStatus,
  type ColorConversionFailurePolicy,
  type ColorConversionAlphaPolicy,
  type ColorConversionCapability,
  type ColorConversionPlanRequest,
  type ColorConversionPlan,
  type ColorConversionPlanResult,
  type ColorConversionRequest,
  type ColorConversionRuntimeContext,
  type ColorConversionBackendDescriptor,
  type ColorConversionPlanCandidate,
  type ColorConversionBackendResult,
  type ColorConversionBackend,
  type ColorConversionResult,
  type ColorConversionValidationReport,
  type ColorConversionErrorSnapshot,
  type ColorConversionHealthSnapshot,
  type ColorConversionTelemetrySnapshot,
  type ColorConversionEngineSnapshot,
} from './color-conversion.js';

export {
  MaskingEngine,
  SyntheticMaskingBackend,
  MaskingPipelineStage,
  MaskingError,
  createMaskingEngine,
  createMaskingCommandHandlers,
  createMaskingPipelineStage,
  createMaskStack,
  validateMaskingParameters,
  validateShape as validateMaskShape,
  validateTransform as validateMaskTransform,
  IDENTITY_MASK_TRANSFORM,
  MASKING_COMMAND_TYPES,
  MASKING_OUTPUT_KEYS,
  MASKING_WATCHDOG_INCIDENTS,
  type MaskType,
  type MaskCoordinateSpace,
  type PolygonFillRule,
  type FeatherMode,
  type MaskCombineMode,
  type MaskOutputMode,
  type MaskingParameterPolicy,
  type MaskingBackendType,
  type MaskingQualityTier,
  type MaskingStatus,
  type MaskingFailurePolicy,
  type RectangleMask,
  type RoundedRectangleMask,
  type EllipseMask,
  type CircleMask,
  type PolygonMask,
  type MaskShape,
  type MaskTransform,
  type MatteReference,
  type MaskingParameters,
  type MaskStackEntry,
  type MaskStack,
  type MaskingBackendDescriptor,
  type MaskingCapability,
  type MaskingPlanRequest,
  type MaskingPlanCandidate,
  type MaskingPlan,
  type MaskingRequest,
  type MaskingBackendResult,
  type MaskingBackend,
  type MaskingBackendContext,
  type MaskingBackendRuntimeContext,
  type MaskingBackendShutdownContext,
  type MaskingResult,
  type MaskingHealthSnapshot,
  type MaskingTelemetrySnapshot,
  type MaskingEngineSnapshot,
  type MaskingValidationReport,
} from './masking-engine.js';

export {
  BlurSharpenEngine,
  SyntheticBlurSharpenBackend,
  BlurSharpenPipelineStage,
  BlurSharpenError,
  createBlurSharpenEngine,
  createBlurSharpenPipelineStage,
  createBlurSharpenCommandHandlers,
  createBlurSharpenSourceGraphMetadata,
  defaultBlurSharpenParameters,
  validateBlurSharpenParameters,
  BLUR_SHARPEN_COMMAND_TYPES,
  BLUR_SHARPEN_OUTPUT_KEYS,
  BLUR_SHARPEN_WATCHDOG_INCIDENTS,
  type BlurSharpenMode,
  type BlurSharpenParameters,
  type BlurSharpenRequest,
  type BlurSharpenResult,
  type BlurSharpenPlan,
  type BlurSharpenBackend,
  type BlurSharpenMaskReference,
} from './blur-sharpen-engine.js';

export { createDiagnosticsManager, createDiagnosticsDemo } from './diagnostics/index.js';
export {
  MonitoringRuntimeController,
  HealthAggregationManager,
  TelemetryRegistry,
  TelemetryHistoryStore,
  AlertRegistry,
  AlertLifecycleManager,
  AlertRuleEngine,
  IncidentManager,
  DiagnosticSnapshotManager,
  ProductionGraphTelemetryAdapter,
} from './monitoring-runtime.js';
export * from './ingest-runtime.js';
export * from './output-runtime.js';
export * from './session-runtime.js';
export * from './rundown-runtime.js';

export type MediaExecutionIntentType =
  | 'SWITCH_PROGRAM_SCENE'
  | 'UPDATE_PREVIEW_SCENE'
  | 'START_STREAM'
  | 'STOP_STREAM'
  | 'START_RECORDING'
  | 'STOP_RECORDING'
  | 'UPDATE_AUDIO_MIX'
  | 'APPLY_LAYOUT'
  | 'UPDATE_DESTINATION'
  | 'RENDER_MULTIVIEW'
  | 'BUILD_SCENE_COMPOSITION'
  | 'UPDATE_SCENE_COMPOSITION'
  | 'RENDER_PROGRAM_COMPOSITION'
  | 'RENDER_PREVIEW_COMPOSITION'
  | 'RENDER_MULTIVIEW_COMPOSITION'
  | 'BUILD_VIDEO_ROUTE_PLAN'
  | 'UPDATE_VIDEO_ROUTE'
  | 'ACTIVATE_VIDEO_ROUTE'
  | 'DEACTIVATE_VIDEO_ROUTE'
  | 'ROUTE_PROGRAM_VIDEO'
  | 'ROUTE_PREVIEW_VIDEO'
  | 'ROUTE_MULTIVIEW_VIDEO'
  | 'ROUTE_RECORDING_VIDEO'
  | 'ROUTE_STREAM_VIDEO'
  | 'BUILD_AUDIO_ROUTE_PLAN'
  | 'UPDATE_AUDIO_ROUTE'
  | 'ACTIVATE_AUDIO_ROUTE'
  | 'DEACTIVATE_AUDIO_ROUTE'
  | 'MUTE_AUDIO_ROUTE'
  | 'UNMUTE_AUDIO_ROUTE'
  | 'SET_AUDIO_ROUTE_GAIN'
  | 'BUILD_PROGRAM_MIX'
  | 'BUILD_STREAM_MIX'
  | 'BUILD_RECORDING_MIX'
  | 'BUILD_MONITOR_MIX'
  | 'BUILD_GUEST_RETURN_MIX'
  | 'RENDER_BROWSER_COMPOSITION'
  | 'START_BROWSER_RENDERER'
  | 'STOP_BROWSER_RENDERER'
  | 'UPDATE_BROWSER_RENDER_TARGET'
  | 'RENDER_FRAME'
  | 'EXECUTE_FRAME_SYNC'
  | 'SELECT_RENDER_BACKEND'
  | 'CLEAR_RENDER_CACHE'
  | 'FORCE_FULL_RENDER'
  | 'UPDATE_RENDER_PERFORMANCE_MODE'
  | 'REPORT_RENDER_HEALTH'
  | 'BUILD_STREAMING_PLAN'
  | 'PREPARE_STREAMING'
  | 'CONNECT_STREAM'
  | 'PAUSE_STREAM'
  | 'RESUME_STREAM'
  | 'FAIL_STREAM'
  | 'VALIDATE_STREAM_PLAN'
  | 'BUILD_MULTIVIEW_PLAN'
  | 'UPDATE_MULTIVIEW'
  | 'VALIDATE_MULTIVIEW'
  | 'CREATE_CONFIDENCE_MONITOR'
  | 'UPDATE_CONFIDENCE_STATUS'
  | 'BUILD_ENCODER_PLAN'
  | 'PREPARE_ENCODER'
  | 'START_ENCODER'
  | 'PAUSE_ENCODER'
  | 'RESUME_ENCODER'
  | 'DRAIN_ENCODER'
  | 'STOP_ENCODER'
  | 'FAIL_ENCODER'
  | 'VALIDATE_ENCODER_PLAN'
  | 'REPORT_ENCODER_HEALTH'
  | 'BUILD_WEBRTC_TRANSPORT_PLAN'
  | 'PREPARE_WEBRTC_SESSION'
  | 'START_WEBRTC_SESSION'
  | 'STOP_WEBRTC_SESSION'
  | 'ADD_WEBRTC_PEER'
  | 'REMOVE_WEBRTC_PEER'
  | 'UPDATE_WEBRTC_PEER'
  | 'ATTACH_WEBRTC_TRACK'
  | 'DETACH_WEBRTC_TRACK'
  | 'HANDLE_WEBRTC_SIGNAL'
  | 'REPORT_WEBRTC_HEALTH'
  | 'FAIL_WEBRTC_SESSION'
  | 'BUILD_BROWSER_RENDER_PLAN'
  | 'PREPARE_BROWSER_RENDERER'
  | 'UPDATE_RENDER_SURFACE'
  | 'UPDATE_RENDER_LAYER'
  | 'REMOVE_RENDER_LAYER'
  | 'REQUEST_BROWSER_FRAME'
  | 'REPORT_RENDERER_HEALTH'
  | 'FAIL_BROWSER_RENDERER'
  | 'BUILD_PRODUCTION_RUNTIME'
  | 'START_PRODUCTION_RUNTIME'
  | 'STOP_PRODUCTION_RUNTIME'
  | 'PAUSE_PRODUCTION_RUNTIME'
  | 'RESUME_PRODUCTION_RUNTIME'
  | 'RESTART_RUNTIME_SUBSYSTEM'
  | 'REPORT_PRODUCTION_RUNTIME_HEALTH'
  | 'FAIL_PRODUCTION_RUNTIME'
  | 'START_FFMPEG_RUNTIME'
  | 'STOP_FFMPEG_RUNTIME'
  | 'RESTART_FFMPEG_RUNTIME'
  | 'REPORT_FFMPEG_RUNTIME'
  | 'FAIL_FFMPEG_RUNTIME'
  | 'CREATE_RECORDING'
  | 'PREPARE_RECORDING'
  | 'PAUSE_RECORDING'
  | 'RESUME_RECORDING'
  | 'SPLIT_RECORDING'
  | 'FINALIZE_RECORDING'
  | 'ARCHIVE_RECORDING'
  | 'DELETE_RECORDING'
  | 'REPORT_RECORDING_HEALTH'
  | 'START_GPU_RUNTIME'
  | 'STOP_GPU_RUNTIME'
  | 'RESTART_GPU_RUNTIME'
  | 'REPORT_GPU_RUNTIME'
  | 'FAIL_GPU_RUNTIME';

export type ExecutionRuntimeMode = 'disabled' | 'dry_run' | 'mock_live' | 'live_ready';
export type AdapterStatus = 'enabled' | 'disabled' | 'healthy' | 'unhealthy' | 'unavailable';
export type ExecutionEventType =
  | 'EXECUTION_INTENT_CREATED'
  | 'EXECUTION_STARTED'
  | 'EXECUTION_SUCCEEDED'
  | 'EXECUTION_FAILED'
  | 'EXECUTION_SKIPPED'
  | 'ADAPTER_SELECTED'
  | 'ADAPTER_UNAVAILABLE'
  | 'RUNTIME_MODE_CHANGED'
  | 'DRY_RUN_RECORDED';

export interface MediaExecutionIntent<TPayload = Record<string, unknown>> {
  readonly id: string;
  readonly type: MediaExecutionIntentType;
  readonly timestamp: string;
  readonly graphRevision: number;
  readonly payload: Readonly<TPayload>;
}

const videoIntentTypes = new Set<MediaExecutionIntentType>([
  'BUILD_VIDEO_ROUTE_PLAN',
  'UPDATE_VIDEO_ROUTE',
  'ACTIVATE_VIDEO_ROUTE',
  'DEACTIVATE_VIDEO_ROUTE',
  'ROUTE_PROGRAM_VIDEO',
  'ROUTE_PREVIEW_VIDEO',
  'ROUTE_MULTIVIEW_VIDEO',
  'ROUTE_RECORDING_VIDEO',
  'ROUTE_STREAM_VIDEO',
]);
const audioIntentTypes = new Set<MediaExecutionIntentType>([
  'BUILD_AUDIO_ROUTE_PLAN',
  'UPDATE_AUDIO_ROUTE',
  'ACTIVATE_AUDIO_ROUTE',
  'DEACTIVATE_AUDIO_ROUTE',
  'MUTE_AUDIO_ROUTE',
  'UNMUTE_AUDIO_ROUTE',
  'SET_AUDIO_ROUTE_GAIN',
  'BUILD_PROGRAM_MIX',
  'BUILD_STREAM_MIX',
  'BUILD_RECORDING_MIX',
  'BUILD_MONITOR_MIX',
  'BUILD_GUEST_RETURN_MIX',
  'UPDATE_AUDIO_MIX',
]);
const renderIntentTypes = new Set<MediaExecutionIntentType>([
  'BUILD_MULTIVIEW_PLAN',
  'UPDATE_MULTIVIEW',
  'RENDER_MULTIVIEW',
  'VALIDATE_MULTIVIEW',
  'CREATE_CONFIDENCE_MONITOR',
  'UPDATE_CONFIDENCE_STATUS',
  'BUILD_SCENE_COMPOSITION',
  'UPDATE_SCENE_COMPOSITION',
  'RENDER_PROGRAM_COMPOSITION',
  'RENDER_PREVIEW_COMPOSITION',
  'RENDER_MULTIVIEW_COMPOSITION',
  'RENDER_BROWSER_COMPOSITION',
  'START_BROWSER_RENDERER',
  'STOP_BROWSER_RENDERER',
  'UPDATE_BROWSER_RENDER_TARGET',
  'RENDER_FRAME',
  'SELECT_RENDER_BACKEND',
  'CLEAR_RENDER_CACHE',
  'FORCE_FULL_RENDER',
  'UPDATE_RENDER_PERFORMANCE_MODE',
  'REPORT_RENDER_HEALTH',
  'BUILD_BROWSER_RENDER_PLAN',
  'PREPARE_BROWSER_RENDERER',
  'UPDATE_RENDER_SURFACE',
  'UPDATE_RENDER_LAYER',
  'REMOVE_RENDER_LAYER',
  'REQUEST_BROWSER_FRAME',
  'REPORT_RENDERER_HEALTH',
  'FAIL_BROWSER_RENDERER',
  'APPLY_LAYOUT',
]);
const webrtcIntentTypes = new Set<MediaExecutionIntentType>([
  'BUILD_WEBRTC_TRANSPORT_PLAN',
  'PREPARE_WEBRTC_SESSION',
  'START_WEBRTC_SESSION',
  'STOP_WEBRTC_SESSION',
  'ADD_WEBRTC_PEER',
  'REMOVE_WEBRTC_PEER',
  'UPDATE_WEBRTC_PEER',
  'ATTACH_WEBRTC_TRACK',
  'DETACH_WEBRTC_TRACK',
  'HANDLE_WEBRTC_SIGNAL',
  'REPORT_WEBRTC_HEALTH',
  'FAIL_WEBRTC_SESSION',
]);
const productionRuntimeIntentTypes = new Set<MediaExecutionIntentType>([
  'BUILD_PRODUCTION_RUNTIME',
  'START_PRODUCTION_RUNTIME',
  'STOP_PRODUCTION_RUNTIME',
  'PAUSE_PRODUCTION_RUNTIME',
  'RESUME_PRODUCTION_RUNTIME',
  'RESTART_RUNTIME_SUBSYSTEM',
  'REPORT_PRODUCTION_RUNTIME_HEALTH',
  'FAIL_PRODUCTION_RUNTIME',
  'START_FFMPEG_RUNTIME',
  'STOP_FFMPEG_RUNTIME',
  'RESTART_FFMPEG_RUNTIME',
  'REPORT_FFMPEG_RUNTIME',
  'FAIL_FFMPEG_RUNTIME',
  'START_GPU_RUNTIME',
  'STOP_GPU_RUNTIME',
  'RESTART_GPU_RUNTIME',
  'REPORT_GPU_RUNTIME',
  'FAIL_GPU_RUNTIME',
]);
const outputIntentTypes = new Set<MediaExecutionIntentType>([
  'START_STREAM',
  'STOP_STREAM',
  'START_RECORDING',
  'STOP_RECORDING',
  'UPDATE_DESTINATION',
  'BUILD_STREAMING_PLAN',
  'PREPARE_STREAMING',
  'CONNECT_STREAM',
  'PAUSE_STREAM',
  'RESUME_STREAM',
  'FAIL_STREAM',
  'VALIDATE_STREAM_PLAN',
  'BUILD_ENCODER_PLAN',
  'PREPARE_ENCODER',
  'START_ENCODER',
  'PAUSE_ENCODER',
  'RESUME_ENCODER',
  'DRAIN_ENCODER',
  'STOP_ENCODER',
  'FAIL_ENCODER',
  'VALIDATE_ENCODER_PLAN',
  'REPORT_ENCODER_HEALTH',
  'CREATE_RECORDING',
  'PREPARE_RECORDING',
  'PAUSE_RECORDING',
  'RESUME_RECORDING',
  'SPLIT_RECORDING',
  'FINALIZE_RECORDING',
  'ARCHIVE_RECORDING',
  'DELETE_RECORDING',
  'REPORT_RECORDING_HEALTH',
]);
const orchestrationIntentOrder: readonly MediaExecutionIntentType[] = [
  'ROUTE_PROGRAM_VIDEO',
  'ROUTE_PREVIEW_VIDEO',
  'BUILD_VIDEO_ROUTE_PLAN',
  'BUILD_AUDIO_ROUTE_PLAN',
  'UPDATE_AUDIO_MIX',
  'UPDATE_SCENE_COMPOSITION',
  'BUILD_SCENE_COMPOSITION',
  'UPDATE_DESTINATION',
  'ROUTE_STREAM_VIDEO',
  'RENDER_BROWSER_COMPOSITION',
  'RENDER_FRAME',
];
function defaultOrchestrationPriority(type: MediaExecutionIntentType) {
  const index = orchestrationIntentOrder.indexOf(type);
  return index === -1 ? 0 : 1000 - index;
}
export function subsystemForExecutionType(type: MediaExecutionIntentType): TargetSubsystem {
  if (productionRuntimeIntentTypes.has(type)) return 'sync';
  if (webrtcIntentTypes.has(type)) return 'sync';
  if (videoIntentTypes.has(type)) return 'video';
  if (audioIntentTypes.has(type)) return 'audio';
  if (renderIntentTypes.has(type)) return 'render';
  if (outputIntentTypes.has(type)) return 'output';
  return 'sync';
}
export function toMediaIntent(intent: MediaExecutionIntent): MediaIntent {
  const targetSubsystem = subsystemForExecutionType(intent.type);
  return {
    id: intent.id,
    type: targetSubsystem,
    executionType: intent.type,
    sourceGraphRevision: intent.graphRevision,
    dependencies: (intent.payload.dependencies as string[] | undefined) ?? [],
    priority: Number(intent.payload.priority ?? defaultOrchestrationPriority(intent.type)),
    targetSubsystem,
    payload: intent.payload,
    timingConstraint:
      typeof intent.payload.frameTimestamp === 'number'
        ? { requestedFrameTimestamp: intent.payload.frameTimestamp }
        : {},
    submittedAt: intent.timestamp,
  };
}
export function toExecutionIntent(
  intent: MediaIntent,
  frameTimestamp: number,
): MediaExecutionIntent {
  return {
    id: intent.id,
    type: intent.executionType as MediaExecutionIntentType,
    timestamp: new Date(frameTimestamp).toISOString(),
    graphRevision: intent.sourceGraphRevision,
    payload: { ...intent.payload, frameTimestamp, orchestrationSubsystem: intent.targetSubsystem },
  };
}

export interface MediaExecutionAdapterResponse {
  readonly adapterName: string;
  readonly success: boolean;
  readonly timestamp: string;
  readonly latencyMs: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface MediaExecutionResult {
  readonly success: boolean;
  readonly intentId: string;
  readonly timestamp: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly adapterResponses: readonly MediaExecutionAdapterResponse[];
}

export interface MediaExecutionAdapter {
  canHandle(intent: MediaExecutionIntent): boolean;
  execute(
    intent: MediaExecutionIntent,
    graph: ProductionGraph,
  ): Promise<MediaExecutionAdapterResponse> | MediaExecutionAdapterResponse;
  getName(): string;
}

export interface WebRtcMediaExecutionAdapter extends MediaExecutionAdapter {}
export * from './adapters/webrtc/index.js';
export {
  CompositionStore,
  createDefaultCanvas,
  createSceneCompositionFromGraph,
  diffSceneCompositions,
  getAddedLayers,
  getChangedLayers,
  getCompositionWarnings,
  getLayoutBounds,
  getRemovedLayers,
  hasLayoutChanged,
  orderRenderLayers,
  createCompositorStatusEvent,
  createRenderFrameLayer,
  createRenderLayer as createCompositorRenderLayer,
  createRenderLayerFromCompositionLayer,
  createSceneCompositor,
  createSceneCompositorFromComposition,
  validateCanvas,
  validateLayerBounds,
  validateSceneComposition,
} from './compositor/index.js';
export type {
  CompositionBackground,
  CompositionBounds,
  CompositionCanvas,
  CompositionCrop,
  CompositionFitMode,
  CompositionLayer,
  CompositionLayoutPreset,
  CompositionOverlay,
  CompositionRenderTarget,
  CompositionSafeArea,
  CompositionSource,
  CompositionSourceType,
  CompositionStyle,
  CompositionTransform,
  CompositionValidationIssue,
  ComposeFrameOptions,
  RenderFrame,
  RenderFrameLayer,
  RenderLayer,
  RenderLayerGeometry,
  RenderLayerSource,
  RenderLayerSourceType,
  SceneComposition,
  SceneCompositionOptions,
  SceneCompositor,
  SceneCompositorSnapshot,
  SceneCompositorStatusEvent,
  SceneCompositorStatusEventType,
} from './compositor/index.js';
export * from './routing.js';
export * from './audio-routing/index.js';
export * from './browser-renderer/index.js';
export * from './sync/index.js';
export * from './orchestration.js';
export * from './streaming/index.js';
export * from './multiview/index.js';
export * from './encoder/index.js';
export * from './webrtc-runtime/index.js';
export * from './production-runtime/index.js';
export * from './recording-runtime/index.js';
export interface RtmpMediaExecutionAdapter extends MediaExecutionAdapter {}
export interface FfmpegMediaExecutionAdapter extends MediaExecutionAdapter {}
export interface ObsMediaExecutionAdapter extends MediaExecutionAdapter {}

export interface AdapterMetadata {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly status: AdapterStatus;
  readonly capabilities: readonly MediaExecutionIntentType[];
  readonly isMock: boolean;
  readonly isLive: boolean;
  readonly lastExecutedAt?: string;
  readonly lastError?: string;
}

export interface ExecutionEvent {
  readonly id: string;
  readonly type: ExecutionEventType;
  readonly timestamp: string;
  readonly graphRevision: number;
  readonly intentId?: string;
  readonly adapterId?: string;
  readonly mode: ExecutionRuntimeMode;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface ExecutionLogEntry {
  readonly graphRevision: number;
  readonly intent: MediaExecutionIntent;
  readonly result: MediaExecutionResult;
}

export interface MediaExecutionHealth {
  readonly runtimeMode: ExecutionRuntimeMode;
  readonly activeAdapter?: AdapterMetadata;
  readonly adapterCount: number;
  readonly executedIntentCount: number;
  readonly skippedIntentCount: number;
  readonly failedIntentCount: number;
  readonly averageExecutionMs: number;
  readonly lastExecutionAt?: string;
  readonly lastError?: string;
  readonly isHealthy: boolean;
}

export interface MediaExecutionState {
  readonly currentGraphRevision: number;
  readonly runtimeMode: ExecutionRuntimeMode;
  readonly lastIntents: readonly MediaExecutionIntent[];
  readonly lastResults: readonly MediaExecutionResult[];
  readonly latestLog?: ExecutionLogEntry;
  readonly registeredAdapters: readonly string[];
  readonly adapterRegistry: readonly AdapterMetadata[];
  readonly activeAdapter?: AdapterMetadata;
  readonly latestEvents: readonly ExecutionEvent[];
  readonly orchestrationDiagnostics?: ReturnType<MediaOrchestrationEngine['getDiagnostics']>;
  readonly executionHealth: MediaExecutionHealth;
}

export interface MediaExecutionPlane {
  onGraphTransition(transition: ProductionGraphTransition): Promise<MediaExecutionResult[]>;
  executeFrameSync(
    tick: FrameTickEvent,
    graph: ProductionGraph,
    intents?: readonly MediaExecutionIntent[],
  ): Promise<MediaExecutionResult[]>;
  getExecutionState(): MediaExecutionState;
  registerAdapter(adapter: MediaExecutionAdapter, metadata?: Partial<AdapterMetadata>): void;
}

export interface MockExecutionLatencyConfig {
  readonly minLatencyMs: number;
  readonly maxLatencyMs: number;
  readonly failureRate: number;
  readonly warningRate: number;
  readonly seed?: number;
}

const defaultMockLatency: MockExecutionLatencyConfig = Object.freeze({
  minLatencyMs: 0,
  maxLatencyMs: 0,
  failureRate: 0,
  warningRate: 0,
  seed: 1,
});
let globalRuntimeMode: ExecutionRuntimeMode = 'dry_run';
let globalMockLatency: MockExecutionLatencyConfig = defaultMockLatency;
let eventSequence = 0;

export function getExecutionRuntimeMode() {
  return globalRuntimeMode;
}
export function setExecutionRuntimeMode(mode: ExecutionRuntimeMode) {
  globalRuntimeMode = mode;
  return globalRuntimeMode;
}
export function isExecutionEnabled(mode = globalRuntimeMode) {
  return mode === 'mock_live' || mode === 'live_ready';
}
export function isDryRunMode(mode = globalRuntimeMode) {
  return mode === 'dry_run';
}
export function configureMockExecutionLatency(config: Partial<MockExecutionLatencyConfig>) {
  globalMockLatency = { ...globalMockLatency, ...config };
  return globalMockLatency;
}

const commandIntentMap = {
  CUT_TO_PROGRAM: 'SWITCH_PROGRAM_SCENE',
  SET_PREVIEW_SCENE: 'UPDATE_PREVIEW_SCENE',
  START_RECORDING: 'START_RECORDING',
  STOP_RECORDING: 'STOP_RECORDING',
  SET_WORKSPACE_PRESET: 'APPLY_LAYOUT',
  ASSIGN_SOURCE_TO_SCENE: 'UPDATE_SCENE_COMPOSITION',
  UPDATE_SOURCE: 'UPDATE_SCENE_COMPOSITION',
} as const;
const eventIntentMap = {
  AUDIO_MUTED: 'MUTE_AUDIO_ROUTE',
  AUDIO_UNMUTED: 'UNMUTE_AUDIO_ROUTE',
  AUDIO_LEVEL_CHANGED: 'SET_AUDIO_ROUTE_GAIN',
  GUEST_ADDED: 'BUILD_GUEST_RETURN_MIX',
  GUEST_REMOVED: 'BUILD_AUDIO_ROUTE_PLAN',
  DESTINATION_ENABLED: 'ROUTE_STREAM_VIDEO',
  DESTINATION_DISABLED: 'UPDATE_DESTINATION',
  PREVIEW_SCENE_CHANGED: 'ROUTE_PREVIEW_VIDEO',
  PROGRAM_SCENE_CHANGED: 'ROUTE_PROGRAM_VIDEO',
  TRANSITION_COMPLETED: 'UPDATE_SCENE_COMPOSITION',
  SOURCE_ADDED: 'BUILD_AUDIO_ROUTE_PLAN',
  SOURCE_REMOVED: 'BUILD_AUDIO_ROUTE_PLAN',
  SOURCE_UPDATED: 'UPDATE_SCENE_COMPOSITION',
  SCENE_UPDATED: 'UPDATE_SCENE_COMPOSITION',
} as const;

export function translateGraphTransitionToIntents(
  transition: ProductionGraphTransition,
): MediaExecutionIntent[] {
  const timestamp = transition.command.timestamp;
  const graphRevision = transition.nextRevision;
  const intents: MediaExecutionIntent[] = [];
  const commandIntentType =
    commandIntentMap[transition.command.type as keyof typeof commandIntentMap];
  if (commandIntentType)
    intents.push({
      id: `${transition.command.id}:${commandIntentType}:${graphRevision}:0`,
      type: commandIntentType,
      timestamp,
      graphRevision,
      payload: {
        commandId: transition.command.id,
        commandType: transition.command.type,
        ...transition.command.payload,
      },
    });
  transition.events.forEach((event: ProductionEvent, index) => {
    const eventIntentType = eventIntentMap[event.type as keyof typeof eventIntentMap];
    if (!eventIntentType) return;
    intents.push({
      id: `${event.id}:${eventIntentType}:${event.graphRevision}:${index}`,
      type: eventIntentType,
      timestamp: event.timestamp,
      graphRevision: event.graphRevision,
      payload: { eventId: event.id, eventType: event.type, ...event.payload },
    });
  });
  return intents;
}

export const GraphExecutionTranslator = Object.freeze({ translateGraphTransitionToIntents });

export class ExecutionLogStore {
  private entries: ExecutionLogEntry[] = [];
  append(entry: ExecutionLogEntry) {
    this.entries = [...this.entries, entry];
    return entry;
  }
  list() {
    return [...this.entries];
  }
  queryByRevision(graphRevision: number) {
    return this.entries.filter((entry) => entry.graphRevision === graphRevision);
  }
  getLatest() {
    return this.entries.at(-1);
  }
  clear() {
    this.entries = [];
  }
}

export class ExecutionEventStream {
  private events: ExecutionEvent[] = [];
  emit(event: Omit<ExecutionEvent, 'id' | 'timestamp'> & { timestamp?: string }) {
    const next = {
      ...event,
      id: `exec-event-${++eventSequence}`,
      timestamp: event.timestamp ?? new Date().toISOString(),
    } satisfies ExecutionEvent;
    this.events = [...this.events, next];
    return next;
  }
  list() {
    return [...this.events];
  }
  queryByRevision(graphRevision: number) {
    return this.events.filter((event) => event.graphRevision === graphRevision);
  }
  clear() {
    this.events = [];
  }
}

export class AdapterRegistry {
  private records: { adapter: MediaExecutionAdapter; metadata: AdapterMetadata }[] = [];
  register(adapter: MediaExecutionAdapter, metadata: Partial<AdapterMetadata> = {}) {
    const id = metadata.id ?? adapter.getName();
    const next: AdapterMetadata = {
      id,
      name: metadata.name ?? adapter.getName(),
      type: metadata.type ?? 'mock',
      status: metadata.status ?? 'enabled',
      capabilities: metadata.capabilities ?? [],
      isMock: metadata.isMock ?? true,
      isLive: metadata.isLive ?? false,
      ...(metadata.lastExecutedAt ? { lastExecutedAt: metadata.lastExecutedAt } : {}),
      ...(metadata.lastError ? { lastError: metadata.lastError } : {}),
    };
    this.records = [
      ...this.records.filter((record) => record.metadata.id !== id),
      { adapter, metadata: next },
    ];
  }
  listAvailableAdapters() {
    return this.records.map((record) => record.metadata);
  }
  getActiveAdapter(mode: ExecutionRuntimeMode) {
    return this.records.find(
      ({ metadata }) =>
        metadata.status === 'enabled' &&
        (mode === 'mock_live' ? metadata.isMock : mode === 'live_ready' ? metadata.isLive : false),
    );
  }
  setAdapterEnabled(adapterId: string, enabled: boolean) {
    this.update(adapterId, { status: enabled ? 'enabled' : 'disabled' });
  }
  reportAdapterHealth(adapterId: string) {
    return this.records.find((record) => record.metadata.id === adapterId)?.metadata;
  }
  getAdapter(adapterId: string) {
    return this.records.find((record) => record.metadata.id === adapterId)?.adapter;
  }
  update(adapterId: string, metadata: Partial<AdapterMetadata>) {
    this.records = this.records.map((record) =>
      record.metadata.id === adapterId
        ? { ...record, metadata: { ...record.metadata, ...metadata } }
        : record,
    );
  }
  clear() {
    this.records = [];
  }
}

export function isLiveAdapterAvailable(registry?: AdapterRegistry) {
  return registry
    ? registry
        .listAvailableAdapters()
        .some((adapter) => adapter.isLive && adapter.status === 'enabled')
    : false;
}

function controlledFraction(seed: number, intent: MediaExecutionIntent, salt: number) {
  const text = `${seed}:${intent.id}:${intent.type}:${salt}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1)
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0) / 4294967295;
}

export class MockMediaExecutionAdapter implements MediaExecutionAdapter {
  private readonly log: MediaExecutionIntent[] = [];
  private latencyConfig: MockExecutionLatencyConfig;
  constructor(
    private options: {
      latencyMs?: number;
      failIntentTypes?: MediaExecutionIntentType[];
      latency?: Partial<MockExecutionLatencyConfig>;
    } = {},
  ) {
    const fixed = options.latencyMs ?? 0;
    this.latencyConfig = {
      ...globalMockLatency,
      minLatencyMs: fixed,
      maxLatencyMs: fixed,
      ...options.latency,
    };
  }
  configureLatency(config: Partial<MockExecutionLatencyConfig>) {
    this.latencyConfig = { ...this.latencyConfig, ...config };
    return this.latencyConfig;
  }
  canHandle(_intent: MediaExecutionIntent) {
    return true;
  }
  getName() {
    return 'MockMediaExecutionAdapter';
  }
  getLoggedIntents() {
    return [...this.log];
  }
  private readonly compositionStore = new CompositionStore();
  private readonly videoRouteStore = new VideoRouteStore();
  private readonly audioRouteStore = new AudioRouteStore();
  private readonly multiviewStore = new MultiviewStore();
  private readonly encoderStore = new EncoderStore();
  private encoderSession?: EncoderSession;
  private webrtcSession?: WebRTCSession;
  private gpuSession?: GpuSession;
  getVideoRouteStore() {
    return this.videoRouteStore;
  }
  getAudioRouteStore() {
    return this.audioRouteStore;
  }
  getMultiviewStore() {
    return this.multiviewStore;
  }
  getEncoderStore() {
    return this.encoderStore;
  }
  getEncoderSession() {
    return this.encoderSession;
  }
  getWebRTCSession() {
    return this.webrtcSession;
  }
  getGpuSession() {
    return this.gpuSession;
  }
  getLatestAudioRouteGraph() {
    const plan = this.audioRouteStore.getRoutePlan();
    return plan ? createAudioRouteGraph(plan) : undefined;
  }
  getLatestVideoRouteGraph() {
    const plan = this.videoRouteStore.getRoutePlan();
    return plan ? createVideoRouteGraph(plan) : undefined;
  }
  getCompositionStore() {
    return this.compositionStore;
  }
  execute(intent: MediaExecutionIntent, graph?: ProductionGraph) {
    this.log.push(intent);
    const seed = this.latencyConfig.seed ?? 1;
    const span = Math.max(0, this.latencyConfig.maxLatencyMs - this.latencyConfig.minLatencyMs);
    const latencyMs = Math.round(
      this.latencyConfig.minLatencyMs + span * controlledFraction(seed, intent, 1),
    );
    const configuredFailure = this.options.failIntentTypes?.includes(intent.type) ?? false;
    const rateFailure = controlledFraction(seed, intent, 2) < this.latencyConfig.failureRate;
    const shouldWarn = controlledFraction(seed, intent, 3) < this.latencyConfig.warningRate;
    const shouldFail = configuredFailure || rateFailure;
    const warnings = shouldWarn ? [`Mock warning for ${intent.type}`] : [];
    const compositionIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_SCENE_COMPOSITION',
      'UPDATE_SCENE_COMPOSITION',
      'RENDER_PROGRAM_COMPOSITION',
      'RENDER_PREVIEW_COMPOSITION',
      'RENDER_MULTIVIEW_COMPOSITION',
      'RENDER_BROWSER_COMPOSITION',
      'RENDER_FRAME',
      'APPLY_LAYOUT',
      'EXECUTE_FRAME_SYNC',
    ];
    if (!shouldFail && graph && compositionIntentTypes.includes(intent.type)) {
      const target =
        intent.type === 'RENDER_PREVIEW_COMPOSITION'
          ? 'preview'
          : intent.type === 'RENDER_MULTIVIEW_COMPOSITION'
            ? 'multiview'
            : 'program';
      const sceneId = String(
        intent.payload.sceneId ??
          (target === 'preview' ? graph.preview.sceneId : graph.program.sceneId) ??
          '',
      );
      if (sceneId) {
        const composition = createSceneCompositionFromGraph(graph, sceneId, {
          target: target as CompositionRenderTarget,
          layoutPreset: intent.payload.layoutPreset as never,
        });
        this.compositionStore.setComposition(target as CompositionRenderTarget, composition);
        warnings.push(...getCompositionWarnings(composition));
      } else warnings.push(`No scene available for ${intent.type}`);
    }
    const routingIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_VIDEO_ROUTE_PLAN',
      'UPDATE_VIDEO_ROUTE',
      'ACTIVATE_VIDEO_ROUTE',
      'DEACTIVATE_VIDEO_ROUTE',
      'ROUTE_PROGRAM_VIDEO',
      'ROUTE_PREVIEW_VIDEO',
      'ROUTE_MULTIVIEW_VIDEO',
      'ROUTE_RECORDING_VIDEO',
      'ROUTE_STREAM_VIDEO',
    ];
    if (!shouldFail && graph && routingIntentTypes.includes(intent.type)) {
      const programScene = graph.program.sceneId;
      const previewScene = graph.preview.sceneId;
      const existing = this.compositionStore.listCompositions().map((entry) => entry.composition);
      const generated = [
        ...(programScene
          ? [createSceneCompositionFromGraph(graph, programScene, { target: 'program' })]
          : []),
        ...(previewScene
          ? [createSceneCompositionFromGraph(graph, previewScene, { target: 'preview' })]
          : []),
        ...(programScene
          ? [createSceneCompositionFromGraph(graph, programScene, { target: 'multiview' })]
          : []),
        ...(programScene
          ? [
              createSceneCompositionFromGraph(graph, programScene, {
                target: 'vertical' as CompositionRenderTarget,
              }),
            ]
          : []),
      ];
      const plan = createVideoRoutePlan(graph, [...existing, ...generated], {
        includeRecording:
          intent.type === 'ROUTE_RECORDING_VIDEO' || graph.recording.status === 'recording',
        includeStreams:
          intent.type === 'ROUTE_STREAM_VIDEO' ||
          Object.values(graph.destinations).some((destination) => destination.enabled),
        includeConfidenceMonitor: true,
        now: intent.timestamp,
      });
      this.videoRouteStore.setRoutePlan(plan);
      warnings.push(...getVideoRouteWarnings(plan, graph, [...existing, ...generated]));
    }

    const audioRoutingIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_AUDIO_ROUTE_PLAN',
      'UPDATE_AUDIO_ROUTE',
      'ACTIVATE_AUDIO_ROUTE',
      'DEACTIVATE_AUDIO_ROUTE',
      'MUTE_AUDIO_ROUTE',
      'UNMUTE_AUDIO_ROUTE',
      'SET_AUDIO_ROUTE_GAIN',
      'BUILD_PROGRAM_MIX',
      'BUILD_STREAM_MIX',
      'BUILD_RECORDING_MIX',
      'BUILD_MONITOR_MIX',
      'BUILD_GUEST_RETURN_MIX',
      'UPDATE_AUDIO_MIX',
    ];
    if (!shouldFail && graph && audioRoutingIntentTypes.includes(intent.type)) {
      const plan = createAudioRoutePlan(graph, {
        includeRecording:
          intent.type === 'BUILD_RECORDING_MIX' || graph.recording.status === 'recording',
        includeStreams:
          intent.type === 'BUILD_STREAM_MIX' ||
          Object.values(graph.destinations).some((destination) => destination.enabled),
        includeMonitor: intent.type === 'BUILD_MONITOR_MIX' || true,
        includeGuestReturns: intent.type === 'BUILD_GUEST_RETURN_MIX' || true,
        now: intent.timestamp,
      });
      this.audioRouteStore.setRoutePlan(plan);
      warnings.push(...getAudioRouteWarnings(plan, graph));
    }

    const multiviewIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_MULTIVIEW_PLAN',
      'UPDATE_MULTIVIEW',
      'RENDER_MULTIVIEW',
      'VALIDATE_MULTIVIEW',
      'CREATE_CONFIDENCE_MONITOR',
      'UPDATE_CONFIDENCE_STATUS',
    ];
    if (!shouldFail && graph && multiviewIntentTypes.includes(intent.type)) {
      const videoRoutePlan = this.videoRouteStore.getRoutePlan();
      const audioRoutePlan = this.audioRouteStore.getRoutePlan();
      const plan = createMultiviewPlan({
        graph,
        preset: (intent.payload.preset as never) ?? 'quad',
        ...(videoRoutePlan ? { videoRoutePlan } : {}),
        ...(audioRoutePlan ? { audioRoutePlan } : {}),
        frameId: Number(intent.payload.frameId ?? 0),
        metadata: { intentType: intent.type, mockExecution: true },
      });
      const validation = validateMultiviewPlan(plan);
      this.multiviewStore.setMultiviewPlan(plan);
      if (
        intent.type === 'CREATE_CONFIDENCE_MONITOR' ||
        intent.type === 'UPDATE_CONFIDENCE_STATUS'
      ) {
        const monitor = createConfidenceMonitor({ plan });
        this.multiviewStore.setConfidenceMonitor(monitor);
        warnings.push(...validateConfidenceSignals(monitor).warnings);
      } else {
        const result = executeMockMultiview(plan);
        if (result.monitor) this.multiviewStore.setConfidenceMonitor(result.monitor);
      }
      warnings.push(...validation.warnings, ...plan.warnings);
      if (!validation.valid) warnings.push(...validation.errors);
    }

    const webRTCIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_WEBRTC_TRANSPORT_PLAN',
      'PREPARE_WEBRTC_SESSION',
      'START_WEBRTC_SESSION',
      'STOP_WEBRTC_SESSION',
      'ADD_WEBRTC_PEER',
      'REMOVE_WEBRTC_PEER',
      'UPDATE_WEBRTC_PEER',
      'ATTACH_WEBRTC_TRACK',
      'DETACH_WEBRTC_TRACK',
      'HANDLE_WEBRTC_SIGNAL',
      'REPORT_WEBRTC_HEALTH',
      'FAIL_WEBRTC_SESSION',
    ];
    if (!shouldFail && graph && webRTCIntentTypes.includes(intent.type)) {
      const plan = createWebRTCTransportPlan({
        sessionId: String(intent.payload.sessionId ?? graph.broadcastSessionId),
        role: (intent.payload.role as never) ?? 'host',
        graphRevision: graph.metadata.revision,
        now: intent.timestamp,
      });
      const validation = validateWebRTCTransportPlan(plan);
      let session = this.webrtcSession ?? createWebRTCSession(plan);
      if (intent.type === 'ADD_WEBRTC_PEER')
        session = addWebRTCPeer(
          session,
          createWebRTCPeer({
            id: String(intent.payload.peerId ?? 'peer:mock'),
            role: (intent.payload.peerRole as never) ?? 'guest',
          }),
        );
      if (intent.type === 'REMOVE_WEBRTC_PEER')
        session = removeWebRTCPeer(session, String(intent.payload.peerId ?? 'peer:mock'));
      if (intent.type === 'UPDATE_WEBRTC_PEER')
        session = updateWebRTCPeerState(
          session,
          String(intent.payload.peerId ?? 'peer:mock'),
          (intent.payload.connectionState as never) ?? 'connected',
        );
      if (intent.type === 'ATTACH_WEBRTC_TRACK')
        session = {
          ...session,
          localTrackRefs: [
            ...session.localTrackRefs,
            createWebRTCMediaTrackRef({
              peerId: String(intent.payload.peerId ?? 'local'),
              trackId: String(intent.payload.trackId ?? 'track:mock'),
              kind: (intent.payload.kind as never) ?? 'audio',
              ...(typeof intent.payload.sourceId === 'string'
                ? { sourceId: intent.payload.sourceId }
                : {}),
              ...(typeof intent.payload.guestId === 'string'
                ? { guestId: intent.payload.guestId }
                : {}),
              muted: Boolean(intent.payload.muted),
              enabled: intent.payload.enabled !== false,
              connectionState: 'connected',
              graphRevision: graph.metadata.revision,
            }),
          ],
        };
      if (intent.type === 'START_WEBRTC_SESSION')
        session = {
          ...session,
          status: plan.enabled ? 'connecting' : 'idle',
          startedAt: session.startedAt ?? intent.timestamp,
        };
      if (intent.type === 'STOP_WEBRTC_SESSION') session = { ...session, status: 'closed' };
      this.webrtcSession = session;
      warnings.push(
        ...validation.warnings,
        summarizeWebRTCHealth(session).summary,
        createWebRTCManifest(session).notes[0] ?? 'WebRTC manifest metadata ready',
      );
      if (!validation.valid) warnings.push(...validation.errors);
    }

    const productionRuntimeIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_PRODUCTION_RUNTIME',
      'START_PRODUCTION_RUNTIME',
      'STOP_PRODUCTION_RUNTIME',
      'PAUSE_PRODUCTION_RUNTIME',
      'RESUME_PRODUCTION_RUNTIME',
      'RESTART_RUNTIME_SUBSYSTEM',
      'REPORT_PRODUCTION_RUNTIME_HEALTH',
      'FAIL_PRODUCTION_RUNTIME',
    ];
    if (!shouldFail && productionRuntimeIntentTypes.includes(intent.type))
      warnings.push(
        `Production runtime intent ${intent.type} accepted by mock supervisor boundary`,
      );

    const gpuRuntimeIntentTypes: MediaExecutionIntentType[] = [
      'START_GPU_RUNTIME',
      'STOP_GPU_RUNTIME',
      'RESTART_GPU_RUNTIME',
      'REPORT_GPU_RUNTIME',
      'FAIL_GPU_RUNTIME',
    ];
    if (!shouldFail && gpuRuntimeIntentTypes.includes(intent.type)) {
      const pipeline = createGpuPipeline({
        id: String(intent.payload.pipelineId ?? 'gpu-pipeline:mock'),
        graphRevision: graph?.metadata.revision ?? intent.graphRevision,
      });
      const surface = createGpuSurface({
        id: String(intent.payload.surfaceId ?? 'gpu-surface:preview'),
        graphRevision: graph?.metadata.revision ?? intent.graphRevision,
      });
      const session = this.gpuSession ?? createGpuSession({ pipeline, surfaces: [surface] });
      const result = createGpuRuntime(session).execute(intent);
      this.gpuSession =
        result.manifest.diagnostics.health.state === 'shutdown'
          ? { ...session, state: 'shutdown' }
          : { ...session, state: result.state };
      const manifest = createGpuManifest(this.gpuSession);
      warnings.push(
        summarizeGpuHealth(this.gpuSession).warnings[0] ??
          `GPU runtime ${manifest.diagnostics.runtimeState} (${manifest.diagnostics.backend})`,
      );
      if (!result.success) warnings.push(...result.errors);
    }

    const encoderIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_ENCODER_PLAN',
      'PREPARE_ENCODER',
      'START_ENCODER',
      'PAUSE_ENCODER',
      'RESUME_ENCODER',
      'DRAIN_ENCODER',
      'STOP_ENCODER',
      'FAIL_ENCODER',
      'VALIDATE_ENCODER_PLAN',
      'REPORT_ENCODER_HEALTH',
    ];
    if (!shouldFail && graph && encoderIntentTypes.includes(intent.type)) {
      const videoRoutePlan =
        this.videoRouteStore.getRoutePlan() ??
        createVideoRoutePlan(graph, [], {
          includeRecording: graph.recording.status === 'recording',
          includeStreams: Object.values(graph.destinations).some(
            (destination) => destination.enabled,
          ),
          includeConfidenceMonitor: true,
          now: intent.timestamp,
        });
      const audioRoutePlan =
        this.audioRouteStore.getRoutePlan() ??
        createAudioRoutePlan(graph, {
          includeRecording: graph.recording.status === 'recording',
          includeStreams: Object.values(graph.destinations).some(
            (destination) => destination.enabled,
          ),
          includeMonitor: true,
          includeGuestReturns: true,
          now: intent.timestamp,
        });
      const recordingId =
        typeof intent.payload.recordingId === 'string'
          ? intent.payload.recordingId
          : graph.recording.activeRecordingId;
      const streamId =
        typeof intent.payload.streamId === 'string' ? intent.payload.streamId : undefined;
      const plan = createEncoderPlan({
        graph,
        videoRoutePlan,
        audioRoutePlan,
        outputId: String(intent.payload.outputId ?? `output:${graph.broadcastSessionId}`),
        ...(recordingId ? { recordingId } : {}),
        ...(streamId ? { streamId } : {}),
        frameId: Number(intent.payload.frameId ?? 0),
        backend: (intent.payload.backend as never) ?? 'mock',
      });
      this.encoderStore.setEncoderPlan(plan);
      let result = prepareEncoder(plan);
      if (intent.type === 'START_ENCODER') result = startEncoder(result.session);
      else if (intent.type === 'PAUSE_ENCODER')
        result = pauseEncoder(this.encoderSession ?? result.session);
      else if (intent.type === 'RESUME_ENCODER')
        result = resumeEncoder(this.encoderSession ?? result.session);
      else if (intent.type === 'DRAIN_ENCODER')
        result = drainEncoder(this.encoderSession ?? result.session);
      else if (intent.type === 'STOP_ENCODER')
        result = stopEncoder(this.encoderSession ?? result.session);
      else if (intent.type === 'FAIL_ENCODER')
        result = failEncoder(this.encoderSession ?? result.session, {
          code: 'MOCK_ENCODER_FAILURE',
          message: 'Mock encoder failure',
          retryable: Boolean(intent.payload.retryable),
          occurredAt: intent.timestamp,
          backend: plan.backend,
        });
      else if (intent.type === 'VALIDATE_ENCODER_PLAN') {
        const validation = validateEncoderPlan(plan);
        warnings.push(...validation.warnings);
        if (!validation.valid) warnings.push(...validation.errors);
      }
      this.encoderSession = result.session;
      warnings.push(...result.warnings, summarizeEncoderHealth(result.session).summary);
    }
    return {
      adapterName: this.getName(),
      success: !shouldFail,
      timestamp: intent.timestamp,
      latencyMs,
      warnings,
      errors: shouldFail ? [`Mock failure for ${intent.type}`] : [],
    } satisfies MediaExecutionAdapterResponse;
  }
}

export class MediaExecutionEngine implements MediaExecutionPlane, MediaExecutionPort {
  private readonly adapterRegistry = new AdapterRegistry();
  private readonly eventStream = new ExecutionEventStream();
  private lastIntents: MediaExecutionIntent[] = [];
  private lastResults: MediaExecutionResult[] = [];
  private currentGraphRevision = 0;
  private runtimeMode: ExecutionRuntimeMode = globalRuntimeMode;
  private readonly orchestrationEngine = new MediaOrchestrationEngine(
    createClock({ frameRate: 30 }),
  );
  constructor(private logStore = new ExecutionLogStore()) {}
  registerAdapter(adapter: MediaExecutionAdapter, metadata?: Partial<AdapterMetadata>) {
    this.adapterRegistry.register(adapter, metadata);
  }
  getAdapterRegistry() {
    return this.adapterRegistry;
  }
  getRegisteredAdapter(adapterId: string) {
    return this.adapterRegistry.getAdapter(adapterId);
  }
  getOrchestrationEngine() {
    return this.orchestrationEngine;
  }
  getExecutionEventStream() {
    return this.eventStream;
  }
  getExecutionRuntimeMode() {
    return this.runtimeMode;
  }
  setExecutionRuntimeMode(mode: ExecutionRuntimeMode) {
    this.runtimeMode = mode;
    setExecutionRuntimeMode(mode);
    this.eventStream.emit({
      type: 'RUNTIME_MODE_CHANGED',
      graphRevision: this.currentGraphRevision,
      mode,
      payload: { mode },
      warnings: [],
      errors: [],
    });
  }
  setAdapterEnabled(adapterId: string, enabled: boolean) {
    this.adapterRegistry.setAdapterEnabled(adapterId, enabled);
  }
  clearExecutionLog() {
    this.logStore.clear();
    this.eventStream.clear();
    this.lastIntents = [];
    this.lastResults = [];
  }
  configureMockExecutionLatency(config: Partial<MockExecutionLatencyConfig>) {
    configureMockExecutionLatency(config);
  }
  async executeFrameSync(
    tick: FrameTickEvent,
    graph: ProductionGraph,
    intents: readonly MediaExecutionIntent[] = [],
  ) {
    const order: readonly MediaExecutionIntentType[] = [
      'ROUTE_PROGRAM_VIDEO',
      'ROUTE_PREVIEW_VIDEO',
      'BUILD_VIDEO_ROUTE_PLAN',
      'BUILD_AUDIO_ROUTE_PLAN',
      'UPDATE_AUDIO_MIX',
      'UPDATE_SCENE_COMPOSITION',
      'BUILD_SCENE_COMPOSITION',
      'UPDATE_DESTINATION',
      'ROUTE_STREAM_VIDEO',
      'RENDER_BROWSER_COMPOSITION',
      'RENDER_FRAME',
    ];
    const base = intents.length
      ? [...intents]
      : [
          {
            id: `frame-sync:${tick.frameId}`,
            type: 'EXECUTE_FRAME_SYNC' as const,
            timestamp: new Date(tick.broadcastTime).toISOString(),
            graphRevision: graph.metadata.revision,
            payload: { frameTick: tick },
          },
        ];
    const ordered = base
      .map((intent) => ({
        ...intent,
        payload: {
          ...intent.payload,
          frameTick: tick,
          frameId: tick.frameId,
          frameTimestamp: tick.timestamp,
        },
      }))
      .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.id.localeCompare(b.id));
    ordered.forEach((intent) => this.orchestrationEngine.submitIntent(toMediaIntent(intent)));
    const framePlan = this.orchestrationEngine.planExecutionFrame(
      tick.timestamp,
      this.getSubsystemState(),
    );
    this.lastIntents = framePlan.orderedExecutionSteps.map((intent) =>
      toExecutionIntent(intent, framePlan.frameTimestamp),
    );
    this.currentGraphRevision = graph.metadata.revision;
    const results: MediaExecutionResult[] = [];
    for (const intent of this.lastIntents) results.push(await this.dispatchIntent(intent, graph));
    this.lastResults = results;
    return results;
  }
  async onGraphTransition(transition: ProductionGraphTransition) {
    const intents = translateGraphTransitionToIntents(transition);
    intents.forEach((intent) => this.orchestrationEngine.submitIntent(toMediaIntent(intent)));
    const framePlan = this.orchestrationEngine.planExecutionFrame(0, this.getSubsystemState());
    this.lastIntents = framePlan.orderedExecutionSteps.map((intent) =>
      toExecutionIntent(intent, framePlan.frameTimestamp),
    );
    this.currentGraphRevision = transition.nextRevision;
    intents.forEach((intent) =>
      this.eventStream.emit({
        type: 'EXECUTION_INTENT_CREATED',
        graphRevision: intent.graphRevision,
        intentId: intent.id,
        mode: this.runtimeMode,
        payload: { type: intent.type },
        warnings: [],
        errors: [],
      }),
    );
    const results = await Promise.all(
      this.lastIntents.map((intent) => this.dispatchIntent(intent, transition.nextGraph)),
    );
    this.lastResults = results;
    return results;
  }
  handleTransition(transition: ProductionGraphTransition) {
    void this.onGraphTransition(transition);
  }
  submitVideoOps(plan: MediaFramePlan) {
    return plan.subsystemBatches.videoOps.map((intent) =>
      toExecutionIntent(intent, plan.frameTimestamp),
    );
  }
  submitAudioOps(plan: MediaFramePlan) {
    return plan.subsystemBatches.audioOps.map((intent) =>
      toExecutionIntent(intent, plan.frameTimestamp),
    );
  }
  submitRenderOps(plan: MediaFramePlan) {
    return plan.subsystemBatches.renderOps.map((intent) =>
      toExecutionIntent(intent, plan.frameTimestamp),
    );
  }
  submitOutputOps(plan: MediaFramePlan) {
    return plan.subsystemBatches.outputOps.map((intent) =>
      toExecutionIntent(intent, plan.frameTimestamp),
    );
  }
  getSubsystemState(): MediaSubsystemStateSnapshot {
    return { video: 'ready', audio: 'ready', render: 'ready', output: 'ready', sync: 'ready' };
  }
  async executeMediaFramePlan(plan: MediaFramePlan, graph: ProductionGraph) {
    const intents = plan.orderedExecutionSteps.map((intent) =>
      toExecutionIntent(intent, plan.frameTimestamp),
    );
    const results: MediaExecutionResult[] = [];
    for (const intent of intents) results.push(await this.dispatchIntent(intent, graph));
    this.lastIntents = intents;
    this.lastResults = results;
    return results;
  }

  getExecutionState(): MediaExecutionState {
    const latestLog = this.logStore.getLatest();
    const activeAdapter = this.adapterRegistry.getActiveAdapter(this.runtimeMode)?.metadata;
    return {
      currentGraphRevision: this.currentGraphRevision,
      runtimeMode: this.runtimeMode,
      lastIntents: this.lastIntents,
      lastResults: this.lastResults,
      ...(latestLog ? { latestLog } : {}),
      registeredAdapters: this.adapterRegistry
        .listAvailableAdapters()
        .map((adapter) => adapter.name),
      adapterRegistry: this.adapterRegistry.listAvailableAdapters(),
      ...(activeAdapter ? { activeAdapter } : {}),
      latestEvents: this.eventStream.list().slice(-20),
      orchestrationDiagnostics: this.orchestrationEngine.getDiagnostics(),
      executionHealth: this.getMediaExecutionHealth(),
    };
  }
  getLogStore() {
    return this.logStore;
  }
  listExecutionEvents() {
    return this.eventStream.list();
  }
  listExecutionIntents() {
    return this.logStore.list().map((entry) => entry.intent);
  }
  replayExecutionEvents() {
    return this.eventStream.list().map((event) => ({ ...event, replayed: true }));
  }
  replayExecutionForRevision(graphRevision: number) {
    return this.eventStream
      .queryByRevision(graphRevision)
      .map((event) => ({ ...event, replayed: true }));
  }
  summarizeExecutionForRevision(graphRevision: number) {
    const events = this.eventStream.queryByRevision(graphRevision);
    const entries = this.logStore.queryByRevision(graphRevision);
    return {
      graphRevision,
      eventCount: events.length,
      intentCount: entries.length,
      succeeded: entries.filter((entry) => entry.result.success).length,
      failed: entries.filter((entry) => !entry.result.success).length,
      skipped: events.filter((event) => event.type === 'EXECUTION_SKIPPED').length,
      dryRuns: events.filter((event) => event.type === 'DRY_RUN_RECORDED').length,
    };
  }
  getMediaExecutionHealth(): MediaExecutionHealth {
    return getMediaExecutionHealth(this);
  }
  summarizeExecutionHealth() {
    return summarizeExecutionHealth(this.getMediaExecutionHealth());
  }
  private skippedResult(
    intent: MediaExecutionIntent,
    warnings: string[],
    errors: string[] = [],
  ): MediaExecutionResult {
    return {
      success: errors.length === 0,
      intentId: intent.id,
      timestamp: intent.timestamp,
      warnings,
      errors,
      adapterResponses: [],
    };
  }
  private async dispatchIntent(
    intent: MediaExecutionIntent,
    graph: ProductionGraph,
  ): Promise<MediaExecutionResult> {
    if (this.runtimeMode === 'disabled' || this.runtimeMode === 'dry_run') {
      const type = this.runtimeMode === 'dry_run' ? 'DRY_RUN_RECORDED' : 'EXECUTION_SKIPPED';
      const warnings = [
        this.runtimeMode === 'dry_run'
          ? 'Dry run recorded; adapter execution skipped'
          : 'Execution runtime disabled',
      ];
      const result = this.skippedResult(intent, warnings);
      this.eventStream.emit({
        type,
        graphRevision: intent.graphRevision,
        intentId: intent.id,
        mode: this.runtimeMode,
        payload: { intentType: intent.type },
        warnings,
        errors: [],
      });
      this.logStore.append({ graphRevision: intent.graphRevision, intent, result });
      return result;
    }
    const selected = this.adapterRegistry.getActiveAdapter(this.runtimeMode);
    if (!selected || !selected.adapter.canHandle(intent)) {
      const warnings = [
        this.runtimeMode === 'live_ready'
          ? 'No real media adapter is active; live-ready remains diagnostic only'
          : `No adapter registered for ${intent.type}`,
      ];
      const result = this.skippedResult(intent, warnings, ['Adapter unavailable']);
      this.eventStream.emit({
        type: 'ADAPTER_UNAVAILABLE',
        graphRevision: intent.graphRevision,
        intentId: intent.id,
        mode: this.runtimeMode,
        payload: { intentType: intent.type },
        warnings,
        errors: result.errors,
      });
      this.logStore.append({ graphRevision: intent.graphRevision, intent, result });
      return result;
    }
    this.eventStream.emit({
      type: 'ADAPTER_SELECTED',
      graphRevision: intent.graphRevision,
      intentId: intent.id,
      adapterId: selected.metadata.id,
      mode: this.runtimeMode,
      payload: { adapterName: selected.metadata.name },
      warnings: [],
      errors: [],
    });
    this.eventStream.emit({
      type: 'EXECUTION_STARTED',
      graphRevision: intent.graphRevision,
      intentId: intent.id,
      adapterId: selected.metadata.id,
      mode: this.runtimeMode,
      payload: { intentType: intent.type },
      warnings: [],
      errors: [],
    });
    const response = await selected.adapter.execute(intent, graph);
    const lastError = response.errors.at(-1);
    this.adapterRegistry.update(selected.metadata.id, {
      lastExecutedAt: response.timestamp,
      ...(lastError ? { lastError } : {}),
      status: response.success ? 'enabled' : 'unhealthy',
    });
    const result = {
      success: response.success,
      intentId: intent.id,
      timestamp: intent.timestamp,
      warnings: [...response.warnings],
      errors: [...response.errors],
      adapterResponses: [response],
    } satisfies MediaExecutionResult;
    this.eventStream.emit({
      type: result.success ? 'EXECUTION_SUCCEEDED' : 'EXECUTION_FAILED',
      graphRevision: intent.graphRevision,
      intentId: intent.id,
      adapterId: selected.metadata.id,
      mode: this.runtimeMode,
      payload: { latencyMs: response.latencyMs },
      warnings: result.warnings,
      errors: result.errors,
    });
    this.logStore.append({ graphRevision: intent.graphRevision, intent, result });
    return result;
  }
}

export function listExecutionEvents(engine: MediaExecutionEngine) {
  return engine.listExecutionEvents();
}
export function listExecutionIntents(engine: MediaExecutionEngine) {
  return engine.listExecutionIntents();
}
export function replayExecutionEvents(engine: MediaExecutionEngine) {
  return engine.replayExecutionEvents();
}
export function replayExecutionForRevision(engine: MediaExecutionEngine, revision: number) {
  return engine.replayExecutionForRevision(revision);
}
export function summarizeExecutionForRevision(engine: MediaExecutionEngine, revision: number) {
  return engine.summarizeExecutionForRevision(revision);
}
export function getMediaExecutionHealth(engine: MediaExecutionEngine): MediaExecutionHealth {
  const entries = engine.getLogStore().list();
  const events = engine.listExecutionEvents();
  const responses = entries.flatMap((entry) => entry.result.adapterResponses);
  const failed = entries.filter((entry) => !entry.result.success && entry.result.errors.length > 0);
  const lastFailure = failed.at(-1);
  const activeAdapter = engine
    .getAdapterRegistry()
    .getActiveAdapter(engine.getExecutionRuntimeMode())?.metadata;
  const lastExecutionAt = responses.at(-1)?.timestamp;
  const lastError = lastFailure?.result.errors.at(-1);
  return {
    runtimeMode: engine.getExecutionRuntimeMode(),
    ...(activeAdapter ? { activeAdapter } : {}),
    adapterCount: engine.getAdapterRegistry().listAvailableAdapters().length,
    executedIntentCount: responses.length,
    skippedIntentCount: events.filter(
      (event) =>
        event.type === 'EXECUTION_SKIPPED' ||
        event.type === 'DRY_RUN_RECORDED' ||
        event.type === 'ADAPTER_UNAVAILABLE',
    ).length,
    failedIntentCount: failed.length,
    averageExecutionMs:
      responses.length === 0
        ? 0
        : Math.round(
            responses.reduce((sum, response) => sum + response.latencyMs, 0) / responses.length,
          ),
    ...(lastExecutionAt ? { lastExecutionAt } : {}),
    ...(lastError ? { lastError } : {}),
    isHealthy:
      failed.length === 0 &&
      engine
        .getAdapterRegistry()
        .listAvailableAdapters()
        .every((adapter) => adapter.status !== 'unhealthy'),
  };
}
export function summarizeExecutionHealth(health: MediaExecutionHealth) {
  return `${health.runtimeMode}: ${health.executedIntentCount} executed, ${health.skippedIntentCount} skipped, ${health.failedIntentCount} failed, avg ${health.averageExecutionMs}ms`;
}

export * from './gpu-runtime/index.js';
export * from './ffmpeg-runtime/index.js';

export {
  StreamingPipeline,
  StreamingSessionManager,
  StreamingScheduler,
  StreamingRecovery,
  StreamingValidator,
  createStreamingRuntimeManifest,
  isRealStreamingEnabled,
  validateStreamingDestination,
  createStreamingPipeline,
  createDemoStreamingSession,
  streamingProviders,
  MetadataStreamingPipeline,
} from './streaming-runtime/index.js';
export type {
  StreamingJob as RuntimeStreamingJob,
  StreamingDestination as RuntimeStreamingDestination,
  StreamingStatistics as RuntimeStreamingStatistics,
  StreamingHealth as RuntimeStreamingHealth,
  StreamingManifest as RuntimeStreamingManifest,
  StreamingPipelineV2,
  StreamingSession,
  StreamingDestinationModel,
  StreamingProviderModel,
  StreamingSessionMetadata,
  StreamingRuntimeEvent,
  StreamingBackendDescriptor,
} from './streaming-runtime/index.js';

export {
  AudioRuntime,
  AudioMixer,
  AudioMatrix,
  MixMinusManager,
  AudioStatisticsRuntime,
  AudioHealthRuntime,
  AudioRecovery,
  AudioValidator,
  createAudioBus,
  createAudioChannel,
  createDefaultBuses,
  isRealAudioEnabled,
} from './audio-runtime/index.js';
export type {
  AudioBus as RuntimeAudioBus,
  AudioChannel as RuntimeAudioChannel,
  AudioGroup as RuntimeAudioGroup,
  AudioEffect,
  AudioMeter,
  AudioSession,
  AudioStatistics as RuntimeAudioStatistics,
  AudioHealth as RuntimeAudioHealth,
  AudioReplayEvent,
  MixMinusTarget,
  AudioBusKind,
  AudioEffectKind,
} from './audio-runtime/index.js';

export * from './broadcast-orchestrator/index.js';
export * from './transport/index.js';

export * from './hardware-runtime/index.js';
export * from './hardware-integration.js';
export * from './high-availability/index.js';

export {
  ProductionEngine,
  PipelineScheduler as ProductionPipelineScheduler,
  SynchronizationManager,
  ResourceAllocator as ProductionResourceAllocator,
  ProductionRecovery,
  isProductionEngineEnabled,
  createProductionEngine,
} from './production-engine/index.js';
export type {
  ProductionSession,
  ExecutionStatistics,
  ExecutionManifest,
  ExecutionDiagnostics,
  ExecutionHistory,
  ExecutionSnapshot,
  ExecutionCheckpoint,
  ProductionHealth,
  ProductionMetrics,
  ProductionEngineDashboard,
  ProductionRuntimeName,
  ProductionAction,
  EngineEvent,
  PipelineDependency,
  PipelineStep,
  ScheduledFrame,
  ClockSample,
  SynchronizationReport,
} from './production-engine/index.js';
export {
  RuntimeExecutionEngine,
  createRuntimeExecutionEngine,
  createMasterFrameClock,
  DeterministicCommandScheduler,
  RuntimeCommandExecutionEngine,
  TickProcessorRegistry,
  RuntimeWatchdog,
  createRuntimeWatchdog,
  defaultRuntimeEngineConfig,
  InMemoryRuntimeEventPublisher,
  FakeMonotonicTimeSource,
  ImmediateFrameWaitStrategy,
  frameDurationNs,
  frameNumberToTimestampNs,
  timestampNsToFrameNumber,
  frameRateLabel,
  validateRationalFrameRate,
} from './execution-engine.js';
export type {
  RuntimeEngineConfig,
  RationalFrameRate,
  RuntimeFrameRate,
  RuntimeClock,
  RuntimeContext,
  RuntimeEventPublisher,
  FrameTick,
  MasterFrameClock,
  RuntimeTelemetrySnapshot,
  RuntimeWatchdogSnapshot,
  RuntimeWatchdogOptions,
  RuntimeWatchdogIncident,
  TickProcessor,
  TickProcessorDescriptor,
  ProcessorExecutionRecord,
} from './execution-engine.js';
export * from './media-runtime/index.js';
export * from './output-pipeline.js';
export * from './media-runtime/ffmpeg/index.js';

export {
  FallbackRenderer,
  WebGPURenderer,
  calculateAspectFit,
  createRenderer as createVideoRenderer,
  createRenderSurface as createVideoRenderSurface,
  createRendererStatusEvent,
} from './rendering/index.js';
export type {
  DiagnosticsSeverity,
  PipelineHealthState,
  TracePhase,
  CpuUtilizationMetadata,
  GpuUtilizationMetadata,
  MemoryUsageMetadata,
  FrameTimingStatistics,
  AudioLatencyMetrics,
  RenderLatencyMetrics,
  RuntimeMetricsModel,
  PipelineHealth,
  ExecutionTraceEvent,
  PerformanceEvent,
  DiagnosticsAlert,
  DiagnosticsSnapshot,
} from './diagnostics/index.js';
export {
  createRemoteProductionManager,
  createGuestSession,
  createGreenRoom,
  createTallyState,
  createIFBState,
  createDemoGuestWorkflow,
} from './remote-production.js';

export {
  RuntimeEventBus,
  RuntimeStateMachine,
  RuntimeController,
  RuntimeScheduler,
  SessionManager,
  DeviceManager as BroadcastRuntimeDeviceManager,
  HealthManager,
  RuntimeIntegrationAdapter,
  RecordingRuntimeAdapter,
  StreamingRuntimeAdapter,
  GraphicsRuntimeAdapter,
  ReplayRuntimeAdapter,
  AudioRuntimeAdapter,
  ProductionGraphRuntimeAdapter,
  AutomationRuntimeAdapter,
  createBroadcastRuntimeCore,
} from './broadcast-runtime-core.js';
export type {
  RuntimeLifecycleState as BroadcastRuntimeLifecycleState,
  RuntimeDomain,
  RuntimeCommand,
  RuntimeHealthStatus,
  RuntimeEvent as BroadcastRuntimeEvent,
  RuntimeStateTransition,
  RuntimeSubsystem as BroadcastRuntimeSubsystem,
  RuntimeSubsystemRegistration,
  RuntimeSubsystemSnapshot as BroadcastRuntimeSubsystemSnapshot,
  RuntimeControllerSnapshot,
} from './broadcast-runtime-core.js';

export {
  DeviceRegistry,
  DeviceDiscoveryManager,
  DeviceConnectionManager,
  DeviceProfileManager,
  DeviceCapabilityResolver,
  DeviceHealthMonitor,
  DeviceEventAdapter,
  DeviceRuntimeAdapter,
  StaticDiscoveryProvider,
  BrowserMediaDeviceDiscoveryProvider,
  ScreenCaptureDiscoveryProvider,
  NetworkSourceDiscoveryProvider,
  NativeDesktopDiscoveryProvider,
  CaptureCardDiscoveryProvider,
  PTZDiscoveryProvider,
  assertMetadataSafe,
  DEVICE_TRANSITIONS,
  createPlaceholderHardwareAdapter,
  nativeHardwareAdapters,
  mapDeviceToProductionGraphMetadata,
  calculateRecoveryDelay,
} from './device-platform.js';
export type {
  DeviceType,
  DeviceConnectionType,
  DeviceConnectionState,
  DeviceHealthState,
  RecoveryPolicyKind,
  DeviceFormat,
  DeviceCapabilities,
  DeviceHealthMetadata,
  DeviceMetadata,
  DiscoveryProviderSnapshot,
  DeviceDiscoveryProvider,
  DeviceProfile,
  RecoveryPolicy,
} from './device-platform.js';

export * from './monitoring-runtime.js';
export * from './execution-engine.js';

export {
  RuntimeWatchdog as RuntimeHealthWatchdog,
  createRuntimeWatchdog as createRuntimeHealthWatchdog,
  createDefaultWatchdogRules,
  defaultRuntimeWatchdogConfig,
  redactWatchdogValue,
} from './runtime-watchdog.js';
export type {
  WatchdogRuntimeSubsystem,
  RuntimeHealthState,
  HealthSeverity,
  WatchdogState,
  WatchdogRuleObserved,
  WatchdogRecoveryAction,
  RecoveryScope,
  IncidentLifecycleState,
  WatchdogRecoveryPolicy,
  RuntimeWatchdogConfig,
  WatchdogRuleResult,
  WatchdogHealthRule,
  WatchdogEvaluationContext,
  WatchdogIncident,
  SubsystemHealthSnapshot,
  RuntimeHealthSnapshot,
  RecoveryAttemptSnapshot,
  WatchdogDiagnosticsSnapshot,
  WatchdogEvaluationResult,
} from './runtime-watchdog.js';

export {
  createSourceAcquisitionManager,
  DefaultSourceAcquisitionManager,
  SyntheticSourceProvider,
  SyntheticMediaSource,
  SourceAcquisitionProcessor,
  SourceBoundedBuffer,
  DeterministicSourceTimestampNormalizer,
  negotiateSourceFormat,
  createSourceVideoFormat,
  createSourceAudioFormat,
  createSourceDescriptorFromDevice,
  SOURCE_OUTPUT_KEYS,
  SOURCE_WATCHDOG_INCIDENTS,
  SOURCE_LIFECYCLE_TRANSITIONS,
  SourceAcquisitionError,
  DuplicateSourceError,
  SourceNotFoundError,
  DuplicateSourceProviderError,
  SourceProviderNotFoundError,
  InvalidSourceLifecycleTransitionError,
  type SourceType,
  type SourceMediaKind,
  type SourceLifecycleState,
  type SourceAcquisitionMode,
  type SourceClockDomain,
  type SourcePermissionState,
  type SourceHealthState,
  type SourceLatencyClass,
  type SourceOverflowPolicy,
  type SourceUnderflowPolicy,
  type SourceCommandType,
  type SourceIdentity,
  type SourceVideoFormat,
  type SourceAudioFormat,
  type SourceDataFormat,
  type SourceMediaFormat,
  type SourceDescriptor,
  type SourceFormatRequest,
  type SourceFormatNegotiationResult,
  type SourceOperationResult,
  type SourceProviderDescriptor,
  type SourceDiscoveryRequest,
  type SourceDiscoveryResult,
  type SourceProvider,
  type SourceRuntimeContext,
  type SourcePullRequest,
  type MediaSource,
  type SourcePayloadRef,
  type VideoFrameEnvelope,
  type AudioBufferEnvelope,
  type MetadataSampleEnvelope,
  type SourceSampleBatch,
  type SourceBufferConfiguration,
  type SourceHealthSnapshot,
  type SourceStatisticsSnapshot,
  type SourceReconnectPolicy,
  type SourceSnapshot,
  type SourceTelemetrySnapshot,
  type SourceAcquisitionSnapshot,
  type SourceTimestamp,
  type NormalizedSourceTimestamp,
  type TimestampResetReason,
  type TimestampNormalizerSnapshot,
  type SourceTimestampNormalizer,
} from './source-acquisition.js';
export {
  DefaultDeviceDiscoveryService,
  DefaultDeviceSourceMapper,
  SyntheticDeviceDiscoveryProvider,
  createSyntheticDeviceProvider,
  syntheticDevice,
  createWindowsDeviceDiscoveryProviderStub,
  createMacOSDeviceDiscoveryProviderStub,
  createLinuxDeviceDiscoveryProviderStub,
  DEVICE_DISCOVERY_LIFECYCLE_TRANSITIONS,
  DEVICE_WATCHDOG_INCIDENTS,
  DeviceDiscoveryError,
  DuplicateDeviceProviderError,
  DeviceProviderNotFoundError,
  InvalidDeviceLifecycleTransitionError,
  DeviceMonitoringAlreadyRunningError,
  DeviceMonitoringNotRunningError,
} from './device-discovery.js';
export type {
  DeviceDiscoveryType,
  DevicePermissionState,
  DeviceLifecycleState,
  DeviceProbeState,
  DeviceDiscoveryHealthState,
  SourceRegistrationPolicy,
  DeviceIdentity,
  DeviceDescriptor,
  DeviceSnapshot,
  DeviceHealthSnapshot,
  DeviceDiscoveryProviderDescriptor,
  DeviceDiscoveryRequest,
  DeviceRefreshRequest,
  DeviceDiscoveryProviderResult,
  DeviceCapabilityProbeResult,
  DeviceProviderContext,
  DeviceMonitoringContext,
  DeviceChangeListener,
  DeviceDiscoveryProvider as V522DeviceDiscoveryProvider,
  DeviceDiscoverySnapshot,
  DeviceDiscoveryDelta,
  DeviceProviderSnapshot,
  DeviceTelemetrySnapshot,
  DevicePlatformSnapshot,
  DeviceSourceMappingSnapshot,
  DeviceSourceMappingContext,
  DeviceSourceMapper,
} from './device-discovery.js';
export {
  DefaultSourceGraphManager,
  createSourceGraphManager,
  createSourceGraphCommandHandlers,
  createSyntheticSourceGraphFixture,
  generateSourceGraphStreamNodes,
  sourceGraphIds,
  SOURCE_GRAPH_COMMAND_TYPES,
  SOURCE_GRAPH_WATCHDOG_INCIDENTS,
  SourceGraphError,
  DuplicateSourceGraphNode,
  SourceGraphNodeNotFound,
  DuplicateSourceGraphEdge,
  SourceGraphEdgeNotFound,
  InvalidSourceGraphEdgeEndpoints,
  SourceGraphCycleDetected,
  SourceGraphVersionConflict,
  SourceGraphInvariantViolation,
  type SourceGraphNodeKind,
  type SourceGraphEdgeKind,
  type SourceGraphLifecycleState,
  type SourceGraphAvailabilityState,
  type SourceGraphHealthState,
  type SourceGraphMediaKind,
  type SourceGraphMutationType,
  type SourceGraphNode,
  type SourceGraphNodePatch,
  type SourceGraphEdge,
  type SourceGraphNodeSnapshot,
  type SourceGraphEdgeSnapshot,
  type SourceGraphMutation,
  type SourceGraphTransaction,
  type SourceGraphMutationResult,
  type SourceGraphTransactionResult,
  type SourceGraphDiff,
  type SourceGraphRoutingEligibility,
  type SourceGraphValidationIssue,
  type SourceGraphValidationReport,
  type SourceGraphTelemetrySnapshot,
  type SourceGraphSnapshot,
} from './source-graph.js';
export {
  CAMERA_COMMAND_TYPES,
  CAMERA_EVENT_TYPES,
  CAMERA_WATCHDOG_INCIDENTS,
  CameraError,
  CameraFrameHandle,
  CameraFrameOwnershipViolationError,
  CameraFrameQueue,
  CameraLateFrameRejectedError,
  CameraPermissionDeniedError,
  DefaultCameraSource,
  SyntheticCameraBackend,
  SyntheticCameraProvider,
  cameraDescriptorToSourceDescriptor,
  createCameraVideoFormat,
  createNativeCameraBackendBoundary,
  defaultCameraBufferConfiguration,
  mapDeviceToCameraDescriptor,
  negotiateCameraFormat,
} from './camera-source.js';
export type {
  CameraBackendContext,
  CameraBackendFrame,
  CameraBackendHealthSnapshot,
  CameraBackendOpenRequest,
  CameraBackendOpenResult,
  CameraBufferConfiguration,
  CameraCaptureBackend,
  CameraCaptureContext,
  CameraCategory,
  CameraCommandType,
  CameraConnectionContext,
  CameraControlCapabilities,
  CameraControlContext,
  CameraControlDescriptor,
  CameraControlRequest,
  CameraControlResult,
  CameraDeviceDescriptor,
  CameraFormatNegotiationResult,
  CameraFormatRequest,
  CameraFrameCallback,
  CameraFrameEnvelope,
  CameraFrameOwnership,
  CameraFramePayload,
  CameraHealthSnapshot,
  CameraHealthState,
  CameraLifecycleState,
  CameraOpenRequest,
  CameraOpenResult,
  CameraOperationResult,
  CameraOverflowPolicy,
  CameraProviderContext,
  CameraQueueSnapshot,
  CameraReconnectPolicy,
  CameraSource,
  CameraSourceDescriptor,
  CameraSourceProvider,
  CameraSourceSnapshot,
  CameraTelemetrySnapshot,
  SyntheticCameraBackendOptions,
} from './camera-source.js';
export {
  DefaultFileMediaSource,
  FileBoundedQueue,
  FileOwnershipViolationError,
  FilePathInvalidError,
  FilePathOutsideAllowedRootError,
  FileSchemeUnsupportedError,
  FileSourceError,
  FileStreamNotFoundError,
  SyntheticFileBackend,
  SyntheticFileSourceProvider,
  createFileDecoderAdapterBoundaries,
  createFileSourceDescriptor,
  createFileTelemetrySnapshot,
  evaluateFileWatchdog,
  normalizeFileLocation,
  FILE_COMMAND_TYPES,
  FILE_EVENT_TYPES,
  FILE_WATCHDOG_INCIDENTS,
  type FileBackendContext,
  type FileBackendHealthSnapshot,
  type FileBackendOpenRequest,
  type FileBackendOpenResult,
  type FileBackendReadRequest,
  type FileBackendSeekRequest,
  type FileBackendSeekResult,
  type FileCommandType,
  type FileConnectionContext,
  type FileDecoderAdapterBoundary,
  type FileLocationKind,
  type FileLocationReference,
  type FileLoopConfiguration,
  type FileMediaBackend,
  type FileMediaSource,
  type FileOperationResult,
  type FileOverflowPolicy,
  type FilePathPolicy,
  type FilePlaybackContext,
  type FilePlaybackState,
  type FileProbeRequest,
  type FileProbeResult,
  type FileProbeSnapshot,
  type FileProviderContext,
  type FileProviderSnapshot,
  type FileQueueConfiguration,
  type FileQueueSnapshot,
  type FileSampleBatch,
  type FileSeekAlignment,
  type FileSeekMode,
  type FileSeekRequest,
  type FileSeekResult,
  type FileSourceCategory,
  type FileSourceDescriptor,
  type FileSourceHealthSnapshot,
  type FileSourceIdentity,
  type FileSourceProvider,
  type FileSourceSnapshot,
  type FileStreamDescriptor,
  type FileStreamSelectionSnapshot,
  type FileTelemetrySnapshot,
  type FileTimelineSnapshot,
  type FileOwnershipState,
  type SyntheticFileAssetOptions,
} from './file-source.js';
export {
  SCREEN_COMMAND_TYPES,
  SCREEN_EVENT_TYPES,
  SCREEN_WATCHDOG_INCIDENTS,
  DefaultScreenCaptureSource,
  ScreenCaptureError,
  ScreenCursorPolicyUnsupportedError,
  ScreenFrameHandle,
  ScreenFrameQueue,
  ScreenLateFrameRejectedError,
  ScreenOwnershipViolationError,
  ScreenPermissionDeniedError,
  ScreenRegionInvalidError,
  ScreenRegionOutOfBoundsError,
  SyntheticScreenBackend,
  SyntheticScreenCaptureProvider,
  createNativeScreenCaptureAdapterBoundaries,
  createScreenSourceDescriptor,
  createScreenTelemetrySnapshot,
  createScreenVideoFormat,
  defaultScreenQueueConfiguration,
  evaluateScreenWatchdog,
  negotiateScreenFormat,
  sortScreenTargets,
  validateScreenRegion,
  type ScreenBackendContext,
  type ScreenBackendErrorCallback,
  type ScreenBackendFrame,
  type ScreenBackendHealthSnapshot,
  type ScreenBackendOpenRequest,
  type ScreenBackendOpenResult,
  type ScreenCaptureBackend,
  type ScreenCaptureConnectionContext,
  type ScreenCaptureHealthSnapshot,
  type ScreenCaptureOpenRequest,
  type ScreenCaptureOpenResult,
  type ScreenCaptureOperationResult,
  type ScreenCaptureProvider,
  type ScreenCaptureRegion,
  type ScreenCaptureRuntimeContext,
  type ScreenCaptureSource,
  type ScreenCaptureSourceDescriptor,
  type ScreenCaptureSourceSnapshot,
  type ScreenCaptureTargetDescriptor,
  type ScreenCaptureTargetType,
  type ScreenCommandType,
  type ScreenCursorPolicy,
  type ScreenFrameCallback,
  type ScreenFrameEnvelope,
  type ScreenFrameOwnership,
  type ScreenGeometry,
  type ScreenLifecycleState,
  type ScreenMinimizedBehavior,
  type ScreenOcclusionBehavior,
  type ScreenOverflowPolicy,
  type ScreenProviderContext,
  type ScreenProviderSnapshot,
  type ScreenQueueConfiguration,
  type ScreenQueueSnapshot,
  type ScreenRegionClampPolicy,
  type ScreenRegionCoordinateSpace,
  type ScreenRegionSnapshot,
  type ScreenRegionUpdateRequest,
  type ScreenRegionUpdateResult,
  type ScreenScaleMode,
  type ScreenTargetChangedCallback,
  type ScreenTargetDiscoveryRequest,
  type ScreenTargetDiscoveryResult,
  type ScreenTargetDiscoverySnapshot,
  type ScreenTargetIdentity,
  type ScreenTargetSnapshot,
  type ScreenTelemetrySnapshot,
} from './screen-capture.js';

export {
  BROWSER_COMMAND_TYPES,
  BROWSER_ENGINE_ADAPTER_BOUNDARIES,
  BROWSER_EVENT_TYPES,
  BROWSER_WATCHDOG_INCIDENTS,
  BrowserFrameQueue,
  BrowserOriginDenied,
  BrowserPrivateNetworkDenied,
  BrowserSchemeUnsupported,
  BrowserSourceError,
  BrowserSourceRegistry,
  BrowserUrlInvalid,
  DEFAULT_BROWSER_NAVIGATION_POLICY,
  DEFAULT_BROWSER_PERMISSION_POLICY,
  DEFAULT_BROWSER_QUEUE_CONFIG,
  DEFAULT_BROWSER_VIEWPORT,
  DefaultBrowserMediaSource,
  SyntheticBrowserRenderBackend,
  SyntheticBrowserSourceProvider,
  browserDeepFreeze,
  createBrowserDescriptor,
  createBrowserIdentity,
  createBrowserSourceRegistry,
  createSyntheticBrowserFrame,
  evaluateBrowserUrl,
  redactBrowserValue,
  validateBrowserViewport,
} from './browser-source.js';
export type {
  BrowserBackendContext,
  BrowserBackendCreateRequest,
  BrowserBackendCreateResult,
  BrowserBackendErrorCallback,
  BrowserBackendHealthSnapshot,
  BrowserBackendNavigationRequest,
  BrowserBackendNavigationResult,
  BrowserCommandType,
  BrowserConsoleCallback,
  BrowserContentKind,
  BrowserContentReference,
  BrowserDiagnosticSummary,
  BrowserFrameCallback,
  BrowserFrameEnvelope,
  BrowserFrameOwnership,
  BrowserIdentity,
  BrowserInteractionRequest,
  BrowserInteractionResult,
  BrowserMediaSource,
  BrowserNavigationPolicy,
  BrowserNavigationRequest,
  BrowserNavigationResult,
  BrowserOpenRequest,
  BrowserOpenResult,
  BrowserOperationResult,
  BrowserOverflowPolicy,
  BrowserPageState,
  BrowserPageStateSnapshot,
  BrowserPermission,
  BrowserPermissionDecision,
  BrowserPermissionPolicy,
  BrowserProviderSnapshot,
  BrowserQueueConfiguration,
  BrowserQueueSnapshot,
  BrowserReadinessState,
  BrowserRenderBackend,
  BrowserSessionIsolationPolicy,
  BrowserSessionPolicy,
  BrowserSessionSnapshot,
  BrowserSourceCategory,
  BrowserSourceDescriptor,
  BrowserSourceHealthSnapshot,
  BrowserSourceProvider,
  BrowserSourceSnapshot,
  BrowserStateChangedCallback,
  BrowserTelemetrySnapshot,
  BrowserViewport,
  BrowserViewportSnapshot,
} from './browser-source.js';
export {
  NETWORK_COMMAND_TYPES,
  NETWORK_EVENT_TYPES,
  NETWORK_WATCHDOG_INCIDENTS,
  DEFAULT_NETWORK_ADDRESS_POLICY,
  DEFAULT_NETWORK_PACKET_BUFFER_CONFIG,
  DEFAULT_NETWORK_JITTER_BUFFER_CONFIG,
  SyntheticNetworkBackend,
  SyntheticNetworkDemuxAdapter,
  SyntheticNetworkDecodeAdapter,
  DefaultNetworkMediaSource,
  SyntheticNetworkSourceProvider,
  NetworkSourceRegistry,
  NetworkPacketQueue,
  NetworkJitterBuffer,
  NetworkPacketHandleTracker,
  createNetworkDescriptor,
  createNetworkIdentity,
  createNetworkSourceRegistry,
  createSyntheticNetworkPacket,
  createSyntheticNetworkStream,
  createNetworkCommandHandlers,
  evaluateNetworkAddressPolicy,
  validateNetworkEndpointReference,
  networkDeepFreeze,
  redactNetworkValue,
  syntheticNetworkCapabilities,
} from './network-source.js';
export type {
  NetworkSourceProtocol,
  NetworkConnectionMode,
  NetworkConnectionState,
  NetworkPacketOwnership,
  NetworkPacketOverflowPolicy,
  NetworkCommandType,
  NetworkEndpointReference,
  NetworkAddressPolicy,
  NetworkPacketBufferConfiguration,
  NetworkJitterBufferConfiguration,
  NetworkReconnectPolicy,
  NetworkFailoverPolicy,
  NetworkProtocolCapabilities,
  NetworkSourceIdentity,
  NetworkSourceDescriptor,
  NetworkConnectRequest,
  NetworkReconnectRequest,
  NetworkOperationResult,
  NetworkConnectResult,
  NetworkReconnectResult,
  NetworkProviderContext,
  NetworkConnectionContext,
  NetworkReceiveContext,
  NetworkStreamDescriptor,
  NetworkPacketEnvelope,
  NetworkBackendHealthSnapshot,
  NetworkTelemetrySnapshot,
  NetworkSourceHealthSnapshot,
  NetworkSourceSnapshot,
  NetworkConnectionSnapshot,
  NetworkEndpointSnapshot,
  NetworkPacketQueueSnapshot,
  NetworkJitterBufferSnapshot,
  NetworkStreamSnapshot,
  NetworkProviderSnapshot,
  NetworkFailoverSnapshot,
  NetworkDemuxAdapter,
  NetworkDecodeAdapter,
  NetworkElementarySample,
  NetworkDemuxResult,
  NetworkReceiveBackend,
  NetworkMediaSource,
  NetworkSourceDiscoveryRequest,
  NetworkSourceDiscoveryResult,
  NetworkSourceProvider,
} from './network-source.js';

export {
  DefaultGeometryEngine,
  SyntheticGeometryBackend,
  GEOMETRY_COMMAND_TYPES,
  GEOMETRY_OUTPUT_KEYS,
  GEOMETRY_WATCHDOG_INCIDENTS,
  createDefaultGeometryTransform,
  createGeometryCanvasDescriptor,
  createGeometryCommandHandlers,
  createGeometryEngine,
  createGeometryPipelineStage,
  createSourceGraphGeometryMetadata,
  invertGeometryMatrix,
  reducePixelAspectRatio,
  type GeometryAlignment,
  type GeometryAnchor,
  type GeometryBackend,
  type GeometryBackendDescriptor,
  type GeometryBackendResult,
  type GeometryBackendType,
  type GeometryCapability,
  type GeometryCanvasDescriptor,
  type GeometryCoordinateSpace,
  type GeometryCropPolicy,
  type GeometryEdgePolicy,
  type GeometryEngineSnapshot,
  type GeometryFitMode,
  type GeometryFullyClippedPolicy,
  type GeometryHealthSnapshot,
  type GeometryInsets,
  type GeometryIntent,
  type GeometryInterpolationPolicy,
  type GeometryPlan,
  type GeometryPlanCandidate,
  type GeometryPlanRequest,
  type GeometryPlanResult,
  type GeometryPoint,
  type GeometryProfile,
  type GeometryQualityTier,
  type GeometryRect,
  type GeometryRegionOfInterest,
  type GeometryRoundingPolicy,
  type GeometrySize,
  type GeometryTelemetrySnapshot,
  type GeometryTransform,
  type GeometryTransformRequest,
  type GeometryTransformResult,
  type GeometryTransformStatus,
  type GeometryValidationReport,
  type Matrix3x3,
  type PixelAspectRatio,
} from './geometry-engine.js';
export {
  DefaultVideoFramePipeline,
  SyntheticCancellationStage,
  SyntheticFailingStage,
  SyntheticFormatInspectionStage,
  SyntheticInputValidationStage,
  SyntheticOptionalDelayStage,
  SyntheticOutputValidationStage,
  SyntheticPassThroughStage,
  SyntheticTemporaryFrameStage,
  VIDEO_PIPELINE_COMMAND_TYPES,
  VIDEO_PIPELINE_OUTPUT_KEYS,
  VIDEO_PIPELINE_WATCHDOG_INCIDENTS,
  VideoFramePipelineProcessor,
  createDefaultVideoPipelineStages,
  createVideoFramePipeline,
  createVideoFramePipelineProcessor,
  deepFreezeVideoPipeline,
  defaultVideoFramePipelineConfiguration,
  defaultVideoPipelineOutputProfile,
  videoPipelineFrameReferenceFromSourceEnvelope,
  type VideoFramePipelineConfiguration,
  type VideoFramePipelineConfigurationSnapshot,
  type VideoFramePipelineHealthSnapshot,
  type VideoFramePipelineSnapshot,
  type VideoFramePipelineStage,
  type VideoFramePipelineTelemetrySnapshot,
  type VideoFramePipelineValidationReport,
  type VideoFrameProcessContext,
  type VideoFrameProcessRequest,
  type VideoFrameProcessResult,
  type VideoFrameProcessStatus,
  type VideoFrameState,
  type VideoPipelineCancellationState,
  type VideoPipelineDropReason,
  type VideoPipelineFailurePolicy,
  type VideoPipelineFlushReason,
  type VideoPipelineFrameReference,
  type VideoPipelineHealthState,
  type VideoPipelineInitializationContext,
  type VideoPipelineInitializationResult,
  type VideoPipelineLifecycleState,
  type VideoPipelineMemoryDomain,
  type VideoPipelineOrderingPolicy,
  type VideoPipelineOutputProfile,
  type VideoPipelineReconfigurationRequest,
  type VideoPipelineReconfigurationResult,
  type VideoPipelineRuntimeContext,
  type VideoPipelineStageCriticality,
  type VideoPipelineStageDescriptor,
  type VideoPipelineStageExecutionStatus,
  type VideoPipelineStageInitializationContext,
  type VideoPipelineStageInitializationResult,
  type VideoPipelineStageInput,
  type VideoPipelineStageKind,
  type VideoPipelineStageOutput,
  type VideoPipelineStagePhase,
  type VideoPipelineStageReconfigurationRequest,
  type VideoPipelineStageReconfigurationResult,
  type VideoPipelineStageResult,
  type VideoPipelineStageRuntimeContext,
  type VideoPipelineStageShutdownContext,
  type VideoPipelineStageSnapshot,
  type VideoPipelineWarning,
} from './video-frame-pipeline.js';

export {
  COLOR_CORRECTION_COMMAND_TYPES,
  COLOR_CORRECTION_EVENTS,
  COLOR_CORRECTION_NEUTRAL_PARAMETERS,
  COLOR_CORRECTION_OPERATION_ORDER,
  COLOR_CORRECTION_OUTPUT_KEYS,
  COLOR_CORRECTION_WATCHDOG_INCIDENTS,
  ColorCorrectionError,
  ColorCorrectionErrors,
  ColorCorrectionPipelineStage,
  DefaultColorCorrectionEngine,
  SyntheticColorCorrectionBackend,
  createColorCorrectionEngine,
  createColorCorrectionPipelineStage,
  createSyntheticColorCorrectionBackend,
  deepFreezeColorCorrection,
  type ColorCorrectionAlphaPolicy,
  type ColorCorrectionBackend,
  type ColorCorrectionBackendContext,
  type ColorCorrectionBackendDescriptor,
  type ColorCorrectionBackendResult,
  type ColorCorrectionBackendRuntimeContext,
  type ColorCorrectionBackendType,
  type ColorCorrectionCapability,
  type ColorCorrectionCapabilitySnapshot,
  type ColorCorrectionClampPolicy,
  type ColorCorrectionEngineSnapshot,
  type ColorCorrectionHealthSnapshot,
  type ColorCorrectionIntent,
  type ColorCorrectionLutReference,
  type ColorCorrectionLutType,
  type ColorCorrectionOperation,
  type ColorCorrectionParameterPolicy,
  type ColorCorrectionParameterSnapshot,
  type ColorCorrectionParameterValidationReport,
  type ColorCorrectionParameters,
  type ColorCorrectionPlan,
  type ColorCorrectionPlanCandidate,
  type ColorCorrectionPlanRequest,
  type ColorCorrectionPlanResult,
  type ColorCorrectionPlanSnapshot,
  type ColorCorrectionPreset,
  type ColorCorrectionPresetSnapshot,
  type ColorCorrectionQualityTier,
  type ColorCorrectionRequest,
  type ColorCorrectionRequestSnapshot,
  type ColorCorrectionResult,
  type ColorCorrectionResultSnapshot,
  type ColorCorrectionRuntimeContext,
  type ColorCorrectionStatus,
  type ColorCorrectionTelemetrySnapshot,
  type ColorCorrectionValidationReport,
  type ColorCorrectionWorkingSpace,
} from './color-correction.js';

export {
  DefaultLayerCompositor,
  LayerCompositorError,
  LayerCompositorErrors,
  LayerCompositorPipelineStage,
  LAYER_COMPOSITOR_COMMAND_TYPES,
  LAYER_COMPOSITOR_EVENTS,
  LAYER_COMPOSITOR_OUTPUT_KEYS,
  LAYER_COMPOSITOR_WATCHDOG_INCIDENTS,
  SyntheticLayerCompositorBackend,
  createLayerCompositor,
  createLayerCompositorCommandHandlers,
  createLayerCompositorPipelineStage,
  createLayerCompositorSourceGraphMetadata,
  createSyntheticLayerCompositorBackend,
  deepFreezeLayerCompositor,
  type DirtyRegionSnapshot,
  type LayerAlphaMode,
  type LayerBackgroundDescriptor,
  type LayerBackgroundMode,
  type LayerBlendMode,
  type LayerCachePolicy,
  type LayerCompositionCanvas,
  type LayerCompositionInput,
  type LayerCompositionPlan,
  type LayerCompositionPlanCandidate,
  type LayerCompositionPlanRequest,
  type LayerCompositionRequest,
  type LayerCompositionResult,
  type LayerCompositionRuntimeContext,
  type LayerCompositionStatus,
  type LayerCompositeIdentity,
  type LayerCompositor,
  type LayerCompositorBackend,
  type LayerCompositorBackendContext,
  type LayerCompositorBackendDescriptor,
  type LayerCompositorBackendResult,
  type LayerCompositorBackendRuntimeContext,
  type LayerCompositorBackendShutdownContext,
  type LayerCompositorBackendType,
  type LayerCompositorCapability,
  type LayerCompositorHealthSnapshot,
  type LayerCompositorSnapshot,
  type LayerCompositorTelemetrySnapshot,
  type LayerCriticality,
  type LayerDescriptor,
  type LayerEmptyCompositionPolicy,
  type LayerFailureFallbackPolicy,
  type LayerGeometryReference,
  type LayerGroupDescriptor,
  type LayerIsolationMode,
  type LayerMissingLayerPolicy,
  type LayerOutputAlphaPolicy,
  type LayerQualityTier,
  type LayerRect,
  type LayerRole,
  type LayerSkippedResult,
  type LayerStackValidationReport,
  type LayerStackValidationRequest,
  type LayerTemporalPolicy,
  type LayerTimestampPolicy,
} from './layer-compositor.js';

export {
  DefaultSceneCompositor,
  SCENE_COMPOSITOR_COMMAND_TYPES,
  SCENE_COMPOSITOR_EVENTS,
  SCENE_COMPOSITOR_OUTPUT_KEYS,
  SCENE_COMPOSITOR_WATCHDOG_INCIDENTS,
  SceneCompositorError,
  SceneCompositorProcessor,
  createSceneCompositor as createProductionSafeSceneCompositor,
  createSceneCompositorCommandHandlers,
  createSceneCompositorProcessor,
  createSceneCompositorSourceGraphMetadata,
  deepFreezeSceneCompositor,
  type SceneActivationState,
  type SceneBinding,
  type SceneBindingKind,
  type SceneCollection,
  type SceneCompositor as ProductionSafeSceneCompositor,
  type SceneCompositorHealthSnapshot,
  type SceneCompositorOptions,
  type SceneCompositorSnapshot as ProductionSafeSceneCompositorSnapshot,
  type SceneCompositorTelemetrySnapshot,
  type SceneDefinition,
  type SceneDependencyGraph,
  type SceneDependencyGraphNode,
  type SceneDependencyKind,
  type SceneBackgroundPolicy,
  type SceneFrozenSourcePolicy,
  type SceneHealthState,
  type SceneIdentity,
  type SceneInstance,
  type SceneOutputAspect,
  type SceneOutputProfile,
  type SceneOutputRole,
  type SceneParameterOverride,
  type ScenePublishedOutput,
  type SceneProcessorFailurePolicy,
  type SceneProcessorOptions,
  type SceneProcessorOverloadPolicy,
  type SceneProcessorTickSummary,
  type SceneMissingSourcePolicy,
  type SceneRenderContext,
  type SceneRenderPlan,
  type SceneRenderRequest,
  type SceneRenderResult,
  type SceneRenderStatus,
  type SceneSourceFrameState,
  type SceneTemplate,
  type SceneValidationReport,
  type SceneVariant,
} from './scene-compositor.js';

export {
  KEYING_COMMAND_TYPES,
  KEYING_EVENTS,
  KEYING_OPERATION_ORDER,
  KEYING_OUTPUT_KEYS,
  KEYING_WATCHDOG_INCIDENTS,
  KeyingEngine,
  KeyingError,
  KeyingPipelineStage,
  SyntheticKeyingBackend,
  blueKeyingPreset,
  createKeyingCommandHandlers,
  createKeyingEngine,
  createKeyingSourceGraphMetadata,
  deepFreezeKeying,
  greenKeyingPreset,
  validateKeyingParameters,
  type KeyColor,
  type KeyColorSpace,
  type KeyingBackend,
  type KeyingBackendContext,
  type KeyingBackendDescriptor,
  type KeyingBackendResult,
  type KeyingBackendRuntimeContext,
  type KeyingBackendShutdownContext,
  type KeyingBackendType,
  type KeyingCapability,
  type KeyingFailurePolicy,
  type KeyingMode,
  type KeyingOperation,
  type KeyingOutputMode,
  type KeyingParameterPolicy,
  type KeyingParameters,
  type KeyingPlan,
  type KeyingPlanCandidate,
  type KeyingPlanRequest,
  type KeyingQualityTier,
  type KeyingRequest,
  type KeyingResult,
  type KeyingStatus,
} from './keying-engine.js';
export {
  ColorEffectsEngine,
  SyntheticColorEffectsBackend,
  ColorEffectsPipelineStage,
  ColorEffectsError,
  createColorEffectsEngine,
  createSyntheticColorEffectsBackend,
  createColorEffectsPipelineStage,
  createColorEffectsCommandHandlers,
  createSourceGraphColorEffectsMetadata,
  validateColorEffectsParameters,
  COLOR_EFFECTS_SUPPORTED_EFFECTS,
  COLOR_EFFECTS_BLEND_MODES,
  COLOR_EFFECTS_IDENTITY_LUT,
  COLOR_EFFECTS_NEUTRAL_PARAMETERS,
  COLOR_EFFECTS_PRESETS,
  COLOR_EFFECTS_COMMAND_TYPES,
  COLOR_EFFECTS_OUTPUT_KEYS,
  COLOR_EFFECTS_WATCHDOG_INCIDENTS,
  type ColorEffectKind,
  type ColorEffectsLutType,
  type ColorEffectsBlendMode,
  type ColorEffectsExecutionPolicy,
  type ColorEffectsBackendType,
  type ColorEffectsStatus,
  type ColorEffectsMaskMode,
  type ColorEffectsPresetName,
  type ColorEffectsLutReference,
  type ColorEffectsParameters,
  type ColorEffectsBackendDescriptor,
  type ColorEffectsPlanRequest,
  type ColorEffectsPlan,
  type ColorEffectsExecuteRequest,
  type ColorEffectsResult,
  type ColorEffectsBackend,
} from './color-effects-lut-engine.js';

export {
  AI_BACKGROUND_COMMAND_TYPES,
  AI_BACKGROUND_EVENTS,
  AI_BACKGROUND_OPERATION_ORDER,
  AI_BACKGROUND_OUTPUT_KEYS,
  AI_BACKGROUND_WATCHDOG_INCIDENTS,
  AiBackgroundBackendNotFound,
  AiBackgroundError,
  AiBackgroundModelNotFound,
  AiBackgroundParameterOutOfRange,
  AiBackgroundParametersInvalid,
  AiBackgroundProcessingEngine,
  AiBackgroundProcessingPipelineStage,
  DuplicateAiBackgroundBackend,
  DuplicateAiBackgroundModel,
  SyntheticAiBackgroundBackend,
  createAiBackgroundCommandHandlers,
  createAiBackgroundProcessingEngine,
  createAiBackgroundProcessingPipelineStage,
  createDefaultBackgroundProcessingParameters,
  createSourceGraphAiBackgroundMetadata,
  createSyntheticAiBackgroundModel,
  validateBackgroundProcessingParameters,
  type AiBackgroundBackend,
  type AiBackgroundBackendContext,
  type AiBackgroundBackendDescriptor,
  type AiBackgroundBackendResult,
  type AiBackgroundBackendRuntimeContext,
  type AiBackgroundBackendShutdownContext,
  type AiBackgroundBackendType,
  type AiBackgroundCapability,
  type AiBackgroundConfidencePolicy,
  type AiBackgroundFailurePolicy,
  type AiBackgroundModelDescriptor,
  type AiBackgroundQualityTier,
  type AiBackgroundSubjectType,
  type BackgroundOutputMode,
  type BackgroundParameterPolicy,
  type BackgroundProcessingMode,
  type BackgroundProcessingParameters,
  type BackgroundProcessingPlan,
  type BackgroundProcessingPlanCandidate,
  type BackgroundProcessingPlanRequest,
  type BackgroundProcessingRequest,
  type BackgroundProcessingResult,
  type BackgroundProcessingStatus,
  type BackgroundRegionOfInterest,
  type BackgroundReplacementPolicy,
  type BackgroundSourceReference,
  type BackgroundSourceType,
  type BackgroundTemporalState,
} from './ai-background-processing-engine.js';

export {
  ImageEffectsError,
  SyntheticImageEffectsBackend,
  ImageEffectsEngine,
  ImageEffectsPipelineStage,
  createImageEffectsEngine,
  createImageEffectsPipelineStage,
  createImageEffectsCommandHandlers,
  createImageEffectsSourceGraphMetadata,
  validateImageEffectParameters,
  validateImageEffectStack,
  createDefaultImageEffectPresets,
  IMAGE_EFFECT_TYPES,
  IMAGE_EFFECT_OPERATION_ORDER,
  IMAGE_EFFECTS_COMMAND_TYPES,
  IMAGE_EFFECTS_OUTPUT_KEYS,
  IMAGE_EFFECTS_WATCHDOG_INCIDENTS,
  type ImageEffectType,
  type ImageEffectParameterPolicy,
  type ImageEffectOutputMode,
  type ImageEffectAlphaPolicy,
  type ImageEffectEdgePolicy,
  type ImageEffectBlendMode,
  type ImageEffectStackExecutionPolicy,
  type ImageEffectsBackendType,
  type ImageEffectStatus,
  type ImageEffectFailurePolicy,
  type ImageEffectColor,
  type ImageEffectMaskReference,
  type ImageEffectParameters,
  type ImageEffectStackEntry,
  type ImageEffectStack,
  type ImageEffectPreset,
  type ImageEffectsBackendDescriptor,
  type ImageEffectCapability,
  type ImageEffectPlanRequest,
  type ImageEffectPlanCandidate,
  type ImageEffectPlan,
  type ImageEffectsBackendContext,
  type ImageEffectsBackendRuntimeContext,
  type ImageEffectsBackendShutdownContext,
  type ImageEffectsBackendResult,
  type ImageEffectsBackend,
  type ImageEffectRequest,
  type ImageEffectResult,
} from './image-effects-engine.js';

export {
  PICTURE_IN_PICTURE_VERSION,
  PIP_LIMITS,
  PIP_LAYOUT_TYPES,
  PIP_OUTPUT_ROLES,
  PIP_SLOT_ROLES,
  PIP_OUTPUT_KEYS,
  PIP_COMMAND_TYPES,
  PIP_EVENTS,
  PIP_WATCHDOG_INCIDENTS,
  PICTURE_IN_PICTURE_BUILTIN_PRESETS,
  PipEngineError,
  PipEngineNotReady,
  PipLayoutNotFound,
  DuplicatePipLayout,
  PipVariantNotFound,
  DuplicatePipVariant,
  PipPresetNotFound,
  DuplicatePipPreset,
  PipInstanceNotFound,
  DuplicatePipInstance,
  PipLayoutInvalid,
  PipSlotInvalid,
  PipAssignmentFailed,
  PipStateTransitionInvalid,
  PipGenerationMismatch,
  PipSourceNotFound,
  PipSourceGenerationMismatch,
  PipRequiredSourceMissing,
  PipSourceFrozen,
  PipSourceOverflow,
  PipOutputProfileMismatch,
  PipMotionSnapshotStale,
  PipGeometryFailed,
  PipEffectsFailed,
  PipCompositorFailed,
  PipDuplicateRequest,
  PipRenderTimeout,
  PipRenderCancelled,
  PipAllocationFailed,
  PipOwnershipViolation,
  PipInvariantViolation,
  PipShutdownError,
  PictureInPictureEngine,
  PictureInPictureProcessor,
  createPictureInPictureEngine,
  createPictureInPictureProcessor,
  createPictureInPictureCommandHandlers,
  createPictureInPictureLayoutDefinition,
  createPictureInPicturePresetLayout,
  createPictureInPictureSourceGraphMetadata,
  type PictureInPictureLayoutType,
  type PictureInPictureOutputRole,
  type PictureInPictureSlotRole,
  type PictureInPictureAssignmentPolicy,
  type PictureInPictureAutoLayoutPolicy,
  type PictureInPictureMissingSourcePolicy,
  type PictureInPictureFrozenSourcePolicy,
  type PictureInPictureOverflowPolicy,
  type PictureInPictureFitMode,
  type PictureInPictureCropPolicy,
  type PictureInPictureActivationState,
  type PictureInPictureResultStatus,
  type PictureInPictureSlot,
  type PictureInPictureLayoutDefinition,
  type PictureInPictureSourceBinding,
  type PictureInPictureLayoutVariant,
  type PictureInPictureLayoutInstance,
  type PictureInPictureRequest,
  type PictureInPicturePlan,
  type PictureInPictureResult,
  type PictureInPictureLayoutSnapshot,
  type PictureInPictureVariantSnapshot,
  type PictureInPicturePresetSnapshot,
  type PictureInPictureSlotSnapshot,
  type PictureInPictureBindingSnapshot,
  type PictureInPictureInstanceSnapshot,
  type PictureInPicturePlanSnapshot,
  type PictureInPictureRequestSnapshot,
  type PictureInPictureResultSnapshot,
  type PictureInPictureAssignmentSnapshot,
  type PictureInPictureHealthSnapshot,
  type PictureInPictureTelemetrySnapshot,
  type PictureInPictureEngineSnapshot,
  type PictureInPictureValidationReport,
} from './picture-in-picture-engine.js';

export {
  SCENE_SWITCHING_COMMAND_TYPES,
  SCENE_SWITCHING_EVENTS,
  SCENE_SWITCHING_OUTPUT_KEYS,
  SCENE_SWITCHING_WATCHDOG_INCIDENTS,
  SceneSwitchQueue,
  SceneSwitchingController,
  SceneSwitchingError,
  SceneSwitchingProcessor,
  createSceneSwitchReference,
  createSceneSwitchingCommandHandlers,
  createSceneSwitchingController,
  createSceneSwitchingError,
  type PreviewAfterCutPolicy,
  type ProgramLockState,
  type SceneBusRole,
  type SceneBusSnapshot,
  type SceneReadinessSnapshot,
  type SceneReadinessState,
  type SceneSwitchMode,
  type SceneSwitchPolicy,
  type SceneSwitchQueuePolicy,
  type SceneSwitchQueueSnapshot,
  type SceneSwitchReference,
  type SceneSwitchReferenceSnapshot,
  type SceneSwitchRequestSnapshot,
  type SceneSwitchResultSnapshot,
  type SceneSwitchResultStatus,
  type SceneSwitchTransactionSnapshot,
  type SceneSwitchTransactionState,
  type SceneSwitchingCommandType,
  type SceneSwitchingEngineSnapshot,
  type SceneSwitchingHealthSnapshot,
  type SceneSwitchingTelemetrySnapshot,
  type SceneSwitchingValidationReport,
} from './scene-switching.js';

export {
  BUS_CATEGORIES,
  OUTPUT_ROLES,
  PROGRAM_PREVIEW_BUS_COMMAND_TYPES,
  PROGRAM_PREVIEW_BUS_ERRORS,
  PROGRAM_PREVIEW_BUS_EVENTS,
  PROGRAM_PREVIEW_BUS_OUTPUT_KEYS,
  PROGRAM_PREVIEW_BUS_PROCESSOR_ORDER,
  PROGRAM_PREVIEW_BUS_WATCHDOG_INCIDENTS,
  ProgramPreviewBusError,
  ProgramPreviewBusOrchestrator,
  ProgramPreviewBusOrchestrationProcessor,
  createProgramPreviewBusCommandHandlers,
  createProgramPreviewBusOrchestrator,
} from './program-preview-bus-orchestration.js';
export type {
  AudioBindingPolicy,
  AuxOutputSnapshot,
  BroadcastBusDefinitionSnapshot,
  BroadcastBusRole,
  BroadcastBusStateSnapshot,
  CleanFeedSnapshot,
  ConfidenceMonitorSnapshot,
  MultiviewSnapshot,
  OutputOrientation,
  OutputProfileCoordinationSnapshot,
  OutputPublicationRequestSnapshot,
  OutputPublicationTransactionSnapshot,
  OutputReadinessSnapshot,
  OutputReadinessState,
  OutputRole,
  OutputRoleBindingSnapshot,
  OutputRolePublicationPlanSnapshot,
  OutputRolePublicationResultSnapshot,
  ProgramAudioVideoCorrelationSnapshot,
  ProgramPreviewBusEngineSnapshot,
  ProgramPreviewBusHealthSnapshot,
  ProgramPreviewBusTelemetrySnapshot,
  ProgramPreviewBusValidationReport,
  PublicationAtomicityPolicy,
  PublicationTransactionState,
  RolePublicationStatus,
  SceneSelectionPolicy,
} from './program-preview-bus-orchestration.js';
export {
  AUDIO_CHANNEL_LAYOUTS,
  AUDIO_GAIN,
  AUDIO_MIXER_BUS_ROLES,
  AUDIO_MIXER_COMMAND_TYPES,
  AUDIO_MIXER_ERRORS,
  AUDIO_MIXER_EVENTS,
  AUDIO_MIXER_OUTPUT_KEYS,
  AUDIO_MIXER_PROCESSOR_ORDER,
  AUDIO_MIXER_WATCHDOG_INCIDENTS,
  AUDIO_MIX_RESULT_STATUSES,
  AUDIO_PCM_OWNERSHIP_STATES,
  AUDIO_QUEUE_OVERFLOW_POLICIES,
  AUDIO_SAMPLE_FORMATS,
  AUDIO_UNDERFLOW_POLICIES,
  AudioInputQueue,
  AudioMixerEngine,
  AudioMixerError,
  AudioMixerProcessor,
  SyntheticAudioMixerBackend,
  createAudioMixerCommandHandlers,
  createAudioMixerEngine,
  createAudioMixerProcessor,
  createAudioMixerSourceGraphSnapshot,
  createAudioPcmBufferEnvelope,
  createSyntheticAudioMixerBackend,
  validateAudioChannelLayout,
  validateAudioSampleFormat,
  type AudioBusSend,
  type AudioBusSendSnapshot,
  type AudioChannelLayout,
  type AudioInputQueue as AudioInputQueueInstance,
  type AudioMixPlan,
  type AudioMixPlanSnapshot,
  type AudioMixRequest,
  type AudioMixRequestSnapshot,
  type AudioMixResult,
  type AudioMixResultSnapshot,
  type AudioMixResultStatus,
  type AudioMixerBackend,
  type AudioMixerBackendSnapshot,
  type AudioMixerBusDefinition,
  type AudioMixerBusDefinitionSnapshot,
  type AudioMixerBusRole,
  type AudioMixerBusState,
  type AudioMixerBusStateSnapshot,
  type AudioMixerChannelDefinition,
  type AudioMixerChannelDefinitionSnapshot,
  type AudioMixerChannelState,
  type AudioMixerChannelStateSnapshot,
  type AudioMixerCommandType,
  type AudioMixerEngineSnapshot,
  type AudioMixerHealthSnapshot,
  type AudioMixerSourceGraphSnapshot,
  type AudioMixerTelemetrySnapshot,
  type AudioMixerValidationReport,
  type AudioOutputReference,
  type AudioPcmBufferEnvelope,
  type AudioPcmBufferLease,
  type AudioPcmBufferSnapshot,
  type AudioPcmLeaseSnapshot,
  type AudioPcmOwnershipState,
  type AudioQueueOverflowPolicy,
  type AudioSampleFormat,
  type AudioUnderflowPolicy,
} from './audio-mixer-foundation.js';

export {
  AUDIO_LOUDNESS_METERING_OUTPUT_KEYS,
  AUDIO_LOUDNESS_METERING_PROCESSOR_ORDER,
  AUDIO_LOUDNESS_METERING_VERSION,
  AUDIO_LOUDNESS_PROFILES,
  AUDIO_LOUDNESS_SESSION_STATES,
  AUDIO_METER_PROCESS_STATUSES,
  AUDIO_METER_TARGET_TYPES,
  AUDIO_METER_TYPES,
  AUDIO_METER_WEIGHTING_POLICIES,
  AUDIO_METER_WINDOWS,
  AUDIO_METERING_COMMAND_TYPES,
  AUDIO_METERING_EVENTS,
  AUDIO_METERING_WATCHDOG_INCIDENTS,
  AUDIO_MONITOR_SOURCE_TYPES,
  AUDIO_MONITOR_STATUSES,
  AudioLoudnessMeteringEngine,
  AudioLoudnessMeteringProcessor,
  AudioMeteringError,
  SyntheticAudioMeteringBackend,
  createAudioLoudnessMeteringEngine,
  createAudioMeteringCommandHandlers,
  createSyntheticAudioMeteringBackend,
  type AudioClippingSnapshot,
  type AudioDynamicsMeterSnapshot,
  type AudioLoudnessMeteringEngineSnapshot,
  type AudioLoudnessMeteringHealthSnapshot,
  type AudioLoudnessMeteringTelemetrySnapshot,
  type AudioLoudnessMeteringValidationReport,
  type AudioLoudnessSession,
  type AudioLoudnessSessionSnapshot,
  type AudioLoudnessSummarySnapshot,
  type AudioMeterDefinition,
  type AudioMeterDefinitionSnapshot,
  type AudioMeterProcessPlan,
  type AudioMeterProcessPlanSnapshot,
  type AudioMeterProcessRequest,
  type AudioMeterProcessRequestSnapshot,
  type AudioMeterProcessResult,
  type AudioMeterProcessResultSnapshot,
  type AudioMeterState,
  type AudioMeterStateSnapshot,
  type AudioMeterTargetReference,
  type AudioMeterTargetType,
  type AudioMeterType,
  type AudioMeterValue,
  type AudioMeterValueSnapshot,
  type AudioMeteringBackend,
  type AudioMeteringBackendSnapshot,
  type AudioMeteringConfigurationTransactionSnapshot,
  type AudioMonitorControlState,
  type AudioMonitorControlStateSnapshot,
  type AudioMonitorResultSnapshot,
  type AudioMonitorSourceReference,
  type AudioMonitorSourceSnapshot,
  type AudioPhaseCorrelationSnapshot,
  type AudioSilenceSnapshot,
} from './audio-loudness-metering.js';

export {
  AUDIO_VIDEO_SYNC_MASTER_AUDIO_COMMAND_TYPES,
  AUDIO_VIDEO_SYNC_MASTER_AUDIO_EVENTS,
  AUDIO_VIDEO_SYNC_MASTER_AUDIO_OUTPUT_KEYS,
  AUDIO_VIDEO_SYNC_MASTER_AUDIO_PROCESSOR_ORDER,
  AUDIO_VIDEO_SYNC_MASTER_AUDIO_VERSION,
  AUDIO_VIDEO_SYNC_MASTER_AUDIO_WATCHDOG_INCIDENTS,
  AudioVideoSyncMasterAudioEngine,
  AudioVideoSyncMasterAudioError,
  AudioVideoSyncMasterAudioProcessor,
  SyntheticAudioVideoSyncBackend,
  SyntheticMasterAudioBackend,
  createAudioVideoSyncMasterAudioCommandHandlers,
  createAudioVideoSyncMasterAudioEngine,
  createAudioVideoSyncMasterAudioProcessor,
  createSyntheticAudioVideoSyncBackend,
  createSyntheticMasterAudioBackend,
  type AudioSyncReference,
  type AudioVideoCorrectionPolicy,
  type AudioVideoSyncMasterAudioCommandType,
  type AudioVideoSyncMasterHealthSnapshot,
  type AudioVideoSyncMasterTelemetrySnapshot,
  type AudioVideoSyncMode,
  type AudioVideoSyncOutputRole,
  type AudioVideoSyncPlan,
  type AudioVideoSyncRequest,
  type AudioVideoSyncResult,
  type AudioVideoSyncStatus,
  type ClockCorrelationSnapshot,
  type MasterAudioBusStateSnapshot,
  type MasterTimelineSnapshot,
  type ProgramAudioVideoSyncCorrelationSnapshot,
  type RationalTimeBase,
  type VideoSyncReference,
} from './audio-video-sync-master-audio.js';

export {
  RECORDING_ENGINE_VERSION,
  RECORDING_PROCESSOR_ORDER,
  RECORDING_OUTPUT_KEYS,
  RECORDING_COMMAND_TYPES,
  RECORDING_EVENTS,
  RECORDING_WATCHDOG_INCIDENTS,
  SyntheticRecordingBackend,
  RecordingEngine,
  RecordingEngineError,
  RecordingEngineProcessor,
  createRecordingEngine,
  createSyntheticRecordingProfile,
  createSyntheticRecordingDestination,
  createSyntheticRecordingSession,
  createRecordingEngineProcessor,
  createRecordingCommandHandlers,
  type RecordingCommandType,
  type RecordingEventType,
  type RecordingWatchdogIncidentType,
  type RecordingType,
  type RecordingOutputRole,
  type DestinationType,
  type StorageClass,
  type RecordingSessionState,
  type RolloverPolicyType,
  type SplitPolicyType,
  type ArtifactOwnership,
  type StoragePressureState,
  type BackpressureState,
  type ReservationState,
  type PackageOwnership,
  type ContainerFormat,
  type StartPolicy,
  type PausePolicy,
  type StopPolicy,
  type RecordingErrorCode,
  type RecordingSafeMetadata,
  type RecordingFilenamePolicy,
  type RecordingFilenamePolicySnapshot,
  type RecordingProfile,
  type RecordingProfileSnapshot,
  type RecordingDestinationDefinition,
  type RecordingDestinationSnapshot,
  type RecordingSessionDefinition,
  type RecordingSessionDefinitionSnapshot,
  type RecordingSessionStateSnapshot,
  type RecordingSourceBinding as ProductionSafeRecordingSourceBinding,
  type RecordingSourceBindingSnapshot as ProductionSafeRecordingSourceBindingSnapshot,
  type RecordingPackageInput,
  type RecordingPackageInputSnapshot,
  type RecordingWriteRequest,
  type RecordingWriteRequestSnapshot,
  type RecordingWritePlan,
  type RecordingWritePlanSnapshot,
  type RecordingPartState,
  type RecordingPartSnapshot,
  type StorageReservationState,
  type StorageReservationSnapshot,
  type RecordingStoragePressureSnapshot,
  type RecordingManifest as ProductionSafeRecordingManifest,
  type RecordingManifestSnapshot as ProductionSafeRecordingManifestSnapshot,
  type RecordingIndex,
  type RecordingIndexSnapshot,
  type RecordingSidecarMetadataSnapshot,
  type RecordedMediaArtifact,
  type RecordedMediaArtifactSnapshot,
  type RecordedArtifactLease,
  type RecordedArtifactLeaseSnapshot,
  type RecordingInputQueueSnapshot,
  type RecordingArtifactQueueSnapshot,
  type RecordingBackpressureSnapshot,
  type RecordingRolloverSnapshot,
  type RecordingSplitSnapshot,
  type RecordingPauseResumeSnapshot,
  type RecordingFinalizationSnapshot,
  type RecordingAbortSnapshot,
  type RecordingConfigurationTransactionSnapshot,
  type RecordingRecoveryState,
  type RecordingRecoverySnapshot,
  type RecordingBackend,
  type RecordingBackendSnapshot,
  type RecordingBackendCapabilities,
  type RecordingHealthSnapshot,
  type RecordingTelemetrySnapshot,
  type RecordingWatchdogIncidentSnapshot,
  type RecordingSourceGraphSnapshot,
  type RecordingSourceGraphSessionSnapshot,
  type RecordingEngineSnapshot,
  type RecordingValidationReport,
} from './media-recording-engine.js';

export {
  STREAMING_OUTPUT_VERSION,
  STREAMING_OUTPUT_PROCESSOR_ORDER,
  STREAMING_OUTPUT_KEYS,
  STREAMING_COMMAND_TYPES,
  STREAMING_EVENTS,
  STREAMING_WATCHDOG_INCIDENTS,
  STREAMING_PROTOCOLS,
  STREAMING_DESTINATION_CLASSES,
  STREAMING_DELIVERY_MODES,
  STREAMING_SESSION_STATES,
  STREAMING_INPUT_TYPES,
  STREAMING_OUTPUT_ROLES,
  StreamingOutputError,
  SyntheticStreamingTransportBackend,
  StreamingOutputEngine,
  StreamingOutputProcessor,
  createSyntheticStreamingTransportBackend,
  createDefaultStreamingRetryPolicy,
  createDefaultStreamingHeartbeatPolicy,
  createDefaultStreamingQueuePolicy,
  createStreamingEndpointReference,
  createStreamingOutputEngine,
  createStreamingOutputProcessor,
  createStreamingCommandHandlers,
  createStreamingSourceGraphSnapshot,
  type StreamingCommandType,
  type StreamingEventType,
  type StreamingWatchdogIncidentType,
  type StreamingProtocol,
  type StreamingDestinationClass,
  type StreamingDeliveryMode,
  type StreamingSessionState,
  type StreamingInputType,
  type StreamingOutputRole,
  type StreamingConnectionStateValue,
  type StreamingBackpressureState,
  type StreamingCongestionState,
  type StreamingTransmissionStatus,
  type StreamingInputOwnership,
  type StreamingErrorCode,
  type StreamingRetryPolicy,
  type StreamingRetryPolicySnapshot,
  type StreamingReconnectPolicy,
  type StreamingFailoverPolicy,
  type StreamingHeartbeatPolicy,
  type StreamingHeartbeatPolicySnapshot,
  type StreamingQueuePolicy,
  type StreamingEndpointReference,
  type StreamingEndpointReferenceSnapshot,
  type StreamingCredentialReference,
  type StreamingCredentialReferenceSnapshot,
  type StreamingProfile,
  type StreamingProfileSnapshot,
  type StreamingDestinationDefinition,
  type StreamingDestinationSnapshot,
  type StreamingSessionDefinition,
  type StreamingSessionDefinitionSnapshot,
  type StreamingConnectionState,
  type StreamingConnectionStateSnapshot,
  type StreamingInputEnvelope,
  type StreamingInputEnvelopeSnapshot,
  type StreamingSendRequest,
  type StreamingSendRequestSnapshot,
  type StreamingSendPlan,
  type StreamingSendPlanSnapshot,
  type StreamingTransmissionResult,
  type StreamingTransmissionResultSnapshot,
  type StreamingInputLease,
  type StreamingInputLeaseSnapshot,
  type StreamingSessionStateSnapshot,
  type StreamingOutputBinding,
  type StreamingOutputBindingSnapshot,
  type StreamingInputQueueSnapshot,
  type StreamingBackpressureSnapshot,
  type StreamingBandwidthState,
  type StreamingBandwidthSnapshot,
  type StreamingHeartbeatStateSnapshot,
  type StreamingReconnectStateSnapshot,
  type StreamingFailoverGroup,
  type StreamingFailoverGroupSnapshot,
  type StreamingConfigurationTransactionSnapshot,
  type StreamingBackendCapabilities,
  type StreamingBackendSnapshot,
  type StreamingTransportBackend,
  type StreamingOutputHealthSnapshot,
  type StreamingOutputTelemetrySnapshot,
  type StreamingOutputValidationReport,
  type StreamingOutputEngineSnapshot,
} from './streaming-output-foundation.js';

export {
  DISTRIBUTION_COMMAND_TYPES,
  DISTRIBUTION_EVENTS,
  DISTRIBUTION_OUTPUT_KEYS,
  DISTRIBUTION_VERSION,
  DISTRIBUTION_WATCHDOG_INCIDENTS,
  MULTI_DESTINATION_DISTRIBUTION_PROCESSOR_ORDER,
  DistributionError,
  MultiDestinationDistributionEngine,
  MultiDestinationDistributionProcessor,
  SyntheticDistributionFanOutBackend,
  createDefaultDistributionQueuePolicy,
  createDefaultDistributionQuorumPolicy,
  createDistributionCommandHandlers,
  createDistributionSourceGraphSnapshot,
  createMultiDestinationDistributionEngine,
  createMultiDestinationDistributionProcessor,
  createSyntheticDistributionFanOutBackend,
  type DistributionBackendSnapshot,
  type DistributionCommandType,
  type DistributionCompatibilityPolicyType,
  type DistributionCompletionPolicy,
  type DistributionConfigurationTransaction,
  type DistributionConfigurationTransactionSnapshot,
  type DistributionDestinationDispatch,
  type DistributionDestinationDispatchSnapshot,
  type DistributionDestinationEntry,
  type DistributionDestinationEntrySnapshot,
  type DistributionDestinationGroup,
  type DistributionDestinationGroupSnapshot,
  type DistributionDestinationHealth,
  type DistributionDestinationHealthSnapshot,
  type DistributionDestinationQueueSnapshot,
  type DistributionDispatchPolicyType,
  type DistributionDispatchState,
  type DistributionEngineSnapshot,
  type DistributionErrorCode,
  type DistributionEventType,
  type DistributionFailurePolicy,
  type DistributionFanOutBackend,
  type DistributionFlushSnapshot,
  type DistributionHealthSnapshot,
  type DistributionInputEnvelope,
  type DistributionInputEnvelopeSnapshot,
  type DistributionInputLease,
  type DistributionInputLeaseSnapshot,
  type DistributionInputType,
  type DistributionMembershipSnapshot,
  type DistributionMode,
  type DistributionOwnershipPolicy,
  type DistributionPauseResumeSnapshot,
  type DistributionPlan,
  type DistributionPlanSnapshot,
  type DistributionProfile,
  type DistributionProfileSnapshot,
  type DistributionQuorumPolicy,
  type DistributionQuorumPolicySnapshot,
  type DistributionQuorumPolicyType,
  type DistributionRequest,
  type DistributionRequestSnapshot,
  type DistributionResult,
  type DistributionResultSnapshot,
  type DistributionResultStatus,
  type DistributionRetryAggregationPolicy,
  type DistributionSessionDefinition,
  type DistributionSessionDefinitionSnapshot,
  type DistributionSessionState,
  type DistributionSessionStateSnapshot,
  type DistributionSourceBinding,
  type DistributionSourceBindingSnapshot,
  type DistributionTelemetrySnapshot,
  type DistributionValidationReport,
  type DistributionWatchdogIncidentType,
} from './multi-destination-distribution-fanout.js';

export {
  RTMP_COMMANDS,
  RTMP_DELIVERY_MODES,
  RTMP_EVENTS,
  RTMP_FLUSH_POLICIES,
  RTMP_OUTPUT_KEYS,
  RTMP_OUTPUT_PROCESSOR_ORDER,
  RTMP_OUTPUT_VERSION,
  RTMP_PROTOCOL_TYPES,
  RTMP_SESSION_STATES,
  RTMP_STARTUP_POLICIES,
  RTMP_WATCHDOG_INCIDENTS,
  RtmpOutputEngine,
  RtmpOutputError,
  RtmpOutputProcessor,
  SyntheticRtmpOutputBackend,
  createDefaultRtmpChunkSizePolicy,
  createDefaultRtmpQueuePolicy,
  createRtmpCommandHandlers,
  createRtmpEndpointReference,
  createRtmpOutputEngine,
  createRtmpOutputProcessor,
  createRtmpReference,
  createRtmpSourceGraphSnapshot,
  createSyntheticRtmpOutputBackend,
  type RtmpAcknowledgementState,
  type RtmpAcknowledgementStateSnapshot,
  type RtmpAudioCodecMapping,
  type RtmpBackendCapabilities,
  type RtmpBackendSnapshot,
  type RtmpChunkSizePolicy,
  type RtmpChunkSizePolicySnapshot,
  type RtmpChunkStreamDefinition,
  type RtmpChunkStreamPurpose,
  type RtmpChunkStreamSnapshot,
  type RtmpCommandMessage,
  type RtmpCommandMessageSnapshot,
  type RtmpCommandName,
  type RtmpConnectionState,
  type RtmpConnectionStateSnapshot,
  type RtmpDestinationDefinition,
  type RtmpDestinationSnapshot,
  type RtmpErrorCode,
  type RtmpEventType,
  type RtmpFlvTagPlan,
  type RtmpFlvTagPlanSnapshot,
  type RtmpHandshakeState,
  type RtmpHandshakeStateSnapshot,
  type RtmpMediaInput,
  type RtmpMessageEnvelope,
  type RtmpMessageEnvelopeSnapshot,
  type RtmpOutputBackend,
  type RtmpOutputEngineSnapshot,
  type RtmpOutputHealthSnapshot,
  type RtmpOutputProfile,
  type RtmpOutputProfileSnapshot,
  type RtmpOutputSessionDefinition,
  type RtmpOutputTelemetrySnapshot,
  type RtmpProtocolType,
  type RtmpPublishState,
  type RtmpPublishStateSnapshot,
  type RtmpQueuePolicy,
  type RtmpReferenceSnapshot,
  type RtmpSendPlan,
  type RtmpSendPlanSnapshot,
  type RtmpSendRequest,
  type RtmpSendRequestSnapshot,
  type RtmpSequenceHeaderState,
  type RtmpSequenceHeaderStateSnapshot,
  type RtmpSessionDefinitionSnapshot,
  type RtmpSessionState,
  type RtmpSessionStateSnapshot,
  type RtmpTimestampState,
  type RtmpTimestampStateSnapshot,
  type RtmpTransmissionResult,
  type RtmpTransmissionResultSnapshot,
  type RtmpValidationReport,
  type RtmpWatchdogIncidentType,
  type RtmpsTlsState,
  type RtmpsTlsStateSnapshot,
} from './rtmp-rtmps-output-foundation.js';
export {
  SRT_COMMANDS,
  SRT_ENCRYPTION_TYPES,
  SRT_MODES,
  SRT_OUTPUT_KEYS,
  SRT_OUTPUT_PROCESSOR_ORDER,
  SRT_OUTPUT_VERSION,
  SRT_PACKET_TYPES,
  SRT_SESSION_STATES,
  SRT_WATCHDOG_INCIDENTS,
  SrtOutputEngine,
  SrtOutputError,
  SrtOutputProcessor,
  createSrtCommandHandlers,
  createSrtOutputEngine,
  createSrtOutputProcessor,
  createSrtReference,
  createSyntheticSrtOutputBackend,
  type SrtAckState,
  type SrtCommandName,
  type SrtCongestionState,
  type SrtConnectionState,
  type SrtDestination,
  type SrtEncryptionState,
  type SrtEncryptionType,
  type SrtErrorCode,
  type SrtHandshakeState,
  type SrtLatencyWindow,
  type SrtMode,
  type SrtNakState,
  type SrtOpaqueReference,
  type SrtOutputProfile,
  type SrtPacketEnvelope,
  type SrtPacketSequenceState,
  type SrtPacketType,
  type SrtRetransmissionState,
  type SrtSendPlan,
  type SrtSendRequest,
  type SrtSession,
  type SrtStatistics,
  type SrtTransmissionResult,
} from './srt-reliable-transport-foundation.js';

export {
  WEBRTC_COMMANDS,
  WEBRTC_OUTPUT_KEYS,
  WEBRTC_OUTPUT_PROCESSOR_ORDER,
  WEBRTC_OUTPUT_VERSION,
  WEBRTC_WATCHDOG_INCIDENTS,
  WebRtcOutputEngine,
  WebRtcOutputError,
  WebRtcOutputProcessor,
  createWebRtcCommandHandlers,
  createWebRtcOutputEngine,
  createWebRtcOutputProcessor,
  createWebRtcSourceGraphSnapshot,
  type WebRtcBandwidthState,
  type WebRtcCommandName,
  type WebRtcCongestionState,
  type WebRtcConnectionRole,
  type WebRtcDestination,
  type WebRtcDtlsState,
  type WebRtcIceMode,
  type WebRtcIceState,
  type WebRtcIceStatus,
  type WebRtcJitterState,
  type WebRtcOutputProfile,
  type WebRtcOutputRole,
  type WebRtcPeer,
  type WebRtcRetransmissionState,
  type WebRtcRtcpState,
  type WebRtcRtpPacket,
  type WebRtcSendPlan,
  type WebRtcSendRequest,
  type WebRtcSession,
  type WebRtcSessionDescription,
  type WebRtcSessionType,
  type WebRtcSrtpState,
  type WebRtcTransmissionResult,
} from './webrtc-output-foundation.js';

export {
  NDI_COMMANDS,
  NDI_OUTPUT_KEYS,
  NDI_OUTPUT_PROCESSOR_ORDER,
  NDI_OUTPUT_VERSION,
  NDI_WATCHDOG_INCIDENTS,
  NdiOutputEngine,
  NdiOutputError,
  NdiOutputProcessor,
  createNdiCommandHandlers,
  createNdiOutputEngine,
  createNdiOutputProcessor,
  createNdiSourceGraphSnapshot,
  type NdiCommandName,
  type NdiDestination,
  type NdiOutputProfile,
} from './ndi-output-foundation.js';

export {
  SOCIAL_ACCOUNT_TYPES,
  SOCIAL_AGGREGATE_STATES,
  SOCIAL_ASPECT_RATIO_ROLES,
  SOCIAL_CHANNEL_TYPES,
  SOCIAL_COMMAND_TYPES,
  SOCIAL_COMPATIBILITY_STATUSES,
  SOCIAL_COORDINATION_ACTIONS,
  SOCIAL_COORDINATION_STATUSES,
  SOCIAL_EVENTS,
  SOCIAL_EVENT_TYPES,
  SOCIAL_GROUP_ACTIVATION_POLICIES,
  SOCIAL_GROUP_COMPLETION_POLICIES,
  SOCIAL_GROUP_FAILURE_POLICIES,
  SOCIAL_METADATA_ONLY_PLATFORMS,
  SOCIAL_OUTPUT_KEYS,
  SOCIAL_PLATFORM_COORDINATION_PROCESSOR_ORDER,
  SOCIAL_PLATFORM_COORDINATION_VERSION,
  SOCIAL_PLATFORMS,
  SOCIAL_SESSION_STATES,
  SOCIAL_STARTUP_POLICIES,
  SOCIAL_VISIBILITY_TYPES,
  SOCIAL_WATCHDOG_INCIDENTS,
  SocialPlatformCoordinationError,
  SocialPlatformDestinationCoordinator,
  SocialPlatformDestinationCoordinatorProcessor,
  SyntheticSocialPlatformCoordinationBackend,
  createSocialCommandHandlers,
  createSocialContentMetadata,
  createSocialPlatformAccountReference,
  createSocialPlatformCapabilityPreset,
  createSocialPlatformChannelReference,
  createSocialPlatformDestinationCoordinator,
  createSocialPlatformDestinationCoordinatorProcessor,
  createSyntheticSocialPlatformCoordinationBackend,
  redactSocialIdentifier,
  type SocialAccountType,
  type SocialAggregateStateValue,
  type SocialAnalyticsChannelReference,
  type SocialAnalyticsChannelReferenceSnapshot,
  type SocialChatChannelReference,
  type SocialChatChannelReferenceSnapshot,
  type SocialChannelType,
  type SocialCommandType,
  type SocialCompatibilityStatus,
  type SocialCoordinationAction,
  type SocialCoordinationPlan,
  type SocialCoordinationPlanSnapshot,
  type SocialCoordinationRequest,
  type SocialCoordinationRequestSnapshot,
  type SocialCoordinationResult,
  type SocialCoordinationResultSnapshot,
  type SocialCoordinationStatus,
  type SocialCoverReference,
  type SocialCoverReferenceSnapshot,
  type SocialDestinationProfile,
  type SocialDestinationProfileSnapshot,
  type SocialEngagementChannelReference,
  type SocialEngagementChannelReferenceSnapshot,
  type SocialErrorCode,
  type SocialEventType,
  type SocialEventTypeName,
  type SocialGroupActivationPolicy,
  type SocialGroupCompletionPolicy,
  type SocialGroupFailurePolicy,
  type SocialLiveAggregateState,
  type SocialLiveAggregateStateSnapshot,
  type SocialLiveContentMetadata,
  type SocialLiveContentMetadataSnapshot,
  type SocialLiveEventDefinition,
  type SocialLiveEventSnapshot,
  type SocialLiveGroupDefinition,
  type SocialLiveGroupDefinitionSnapshot,
  type SocialPlatform,
  type SocialPlatformAccountReference,
  type SocialPlatformAccountReferenceSnapshot,
  type SocialPlatformBackendCapabilities,
  type SocialPlatformBackendDescriptor,
  type SocialPlatformBackendSnapshot,
  type SocialPlatformCapabilityDefinition,
  type SocialPlatformCapabilitySnapshot,
  type SocialPlatformChannelReference,
  type SocialPlatformChannelReferenceSnapshot,
  type SocialPlatformCompatibilityRequest,
  type SocialPlatformCompatibilityRequestSnapshot,
  type SocialPlatformCompatibilityResult,
  type SocialPlatformCompatibilityResultSnapshot,
  type SocialPlatformConfigurationTransaction,
  type SocialPlatformConfigurationTransactionSnapshot,
  type SocialPlatformCoordinationBackend,
  type SocialPlatformCoordinatorEngineSnapshot,
  type SocialPlatformCoordinatorHealthSnapshot,
  type SocialPlatformCoordinatorTelemetrySnapshot,
  type SocialPlatformCoordinatorValidationReport,
  type SocialPlatformDestinationHealth,
  type SocialPlatformDestinationHealthSnapshot,
  type SocialPlatformOutputMapping,
  type SocialPlatformOutputMappingSnapshot,
  type SocialPlatformReadinessSnapshot,
  type SocialPlatformReadinessState,
  type SocialPlatformSessionDefinition,
  type SocialPlatformSessionDefinitionSnapshot,
  type SocialPlatformSessionStateSnapshot,
  type SocialSessionState,
  type SocialStartupPolicy,
  type SocialThumbnailReference,
  type SocialThumbnailReferenceSnapshot,
  type SocialVisibility,
  type SocialWatchdogIncident,
} from './social-platform-destination-coordination.js';

export {
  REPLAY_VARIABLE_SPEED_COMMAND_TYPES,
  REPLAY_VARIABLE_SPEED_EVENTS,
  REPLAY_VARIABLE_SPEED_OUTPUT_KEYS,
  REPLAY_VARIABLE_SPEED_PROCESSOR_ORDER,
  REPLAY_VARIABLE_SPEED_VERSION,
  REPLAY_VARIABLE_SPEED_WATCHDOG_INCIDENTS,
  ReplayVariableSpeedEngine,
  ReplayVariableSpeedError,
  ReplayVariableSpeedProcessor,
  SyntheticReplayVariableSpeedBackend,
  classifyReplayPlaybackRate,
  createBuiltInReplaySpeedProfiles,
  createReplayPlaybackRate,
  createReplaySpeedProfile,
  createReplayVariableSpeedCommandHandlers,
  createReplayVariableSpeedEngine,
  createReplayVariableSpeedProcessor,
  createReplayVariableSpeedSourceGraphSnapshot,
  createSyntheticReplayVariableSpeedBackend,
  normalizeReplayPlaybackRate,
  replayVariableSpeedErrorTypes,
  type ReplayAudioStrategy,
  type ReplayCadenceSnapshot,
  type ReplayCadenceState,
  type ReplayCadenceType,
  type ReplayFrameSelectionPlan,
  type ReplayFrameSelectionPlanSnapshot,
  type ReplayFrameSelectionRequest,
  type ReplayFrameSelectionRequestSnapshot,
  type ReplayFreezeSnapshot,
  type ReplayFreezeState,
  type ReplayPlaybackDirection,
  type ReplayPlaybackRateClass,
  type ReplayPlaybackRateSnapshot,
  type ReplayRateChangePoint,
  type ReplayRateChangePointSnapshot,
  type ReplayRateChangePolicy,
  type ReplayReversePlaybackSnapshot,
  type ReplayReversePlaybackState,
  type ReplaySlowMotionReadinessSnapshot,
  type ReplaySlowMotionReadinessState,
  type ReplaySourceMotionCapability,
  type ReplaySourceMotionCapabilitySnapshot,
  type ReplaySpeedProfile,
  type ReplaySpeedProfileSnapshot,
  type ReplaySpeedRampDefinition,
  type ReplaySpeedRampSnapshot,
  type ReplaySpeedRampState,
  type ReplayVariableSpeedAction,
  type ReplayVariableSpeedAvSyncSnapshot,
  type ReplayVariableSpeedAvSyncState,
  type ReplayVariableSpeedBackend,
  type ReplayVariableSpeedBackendCapabilities,
  type ReplayVariableSpeedBackendSnapshot,
  type ReplayVariableSpeedClockMapping,
  type ReplayVariableSpeedClockMappingSnapshot,
  type ReplayVariableSpeedCommandType,
  type ReplayVariableSpeedConfigurationTransaction,
  type ReplayVariableSpeedConfigurationTransactionSnapshot,
  type ReplayVariableSpeedDurationSnapshot,
  type ReplayVariableSpeedDurationState,
  type ReplayVariableSpeedEngineSnapshot,
  type ReplayVariableSpeedHealthSnapshot,
  type ReplayVariableSpeedLookaheadPolicy,
  type ReplayVariableSpeedLookaheadPolicySnapshot,
  type ReplayVariableSpeedPlan,
  type ReplayVariableSpeedPlanSnapshot,
  type ReplayVariableSpeedPositionSnapshot,
  type ReplayVariableSpeedPositionState,
  type ReplayVariableSpeedProgramEligibility,
  type ReplayVariableSpeedProgramEligibilitySnapshot,
  type ReplayVariableSpeedProtectionSnapshot,
  type ReplayVariableSpeedProtectionState,
  type ReplayVariableSpeedRequest,
  type ReplayVariableSpeedRequestSnapshot,
  type ReplayVariableSpeedResult,
  type ReplayVariableSpeedResultSnapshot,
  type ReplayVariableSpeedResultStatus,
  type ReplayVariableSpeedTelemetrySnapshot,
  type ReplayVariableSpeedValidationReport,
  type ReplayVideoStrategy,
} from './replay-variable-speed-foundation.js';

export {
  REPLAY_PLAYBACK_COMMAND_TYPES,
  REPLAY_PLAYBACK_EVENTS,
  REPLAY_PLAYBACK_OUTPUT_KEYS,
  REPLAY_PLAYBACK_PROCESSOR_ORDER,
  REPLAY_PLAYBACK_VERSION,
  REPLAY_PLAYBACK_WATCHDOG_INCIDENTS,
  ReplayPlaybackEngine,
  ReplayPlaybackError,
  ReplayPlaybackProcessor,
  SyntheticReplayPlaybackBackend,
  assertReplayPlaybackInvariants,
  createReplayPlaybackCommandHandlers,
  createReplayPlaybackEngine,
  createReplayPlaybackProcessor,
  createReplayPlaybackRequest,
  createReplayPlaybackSourceGraphSnapshot,
  createSyntheticReplayPlaybackBackend,
  type ReplayAudioCoordinationSnapshot,
  type ReplayAudioCoordinationState,
  type ReplayAudioFollowReplayPolicy,
  type ReplayOutputPlaybackRole,
  type ReplayPlaybackAbortSnapshot,
  type ReplayPlaybackAvSyncSnapshot,
  type ReplayPlaybackAvSyncState,
  type ReplayPlaybackBackend,
  type ReplayPlaybackBackendCapabilities,
  type ReplayPlaybackBackendSnapshot,
  type ReplayPlaybackClockMapping,
  type ReplayPlaybackClockMappingSnapshot,
  type ReplayPlaybackCommandType,
  type ReplayPlaybackCompletionSnapshot,
  type ReplayPlaybackConflictPolicy,
  type ReplayPlaybackEndPolicy,
  type ReplayPlaybackEngineSnapshot,
  type ReplayPlaybackErrorCode,
  type ReplayPlaybackHealthSnapshot,
  type ReplayPlaybackLease,
  type ReplayPlaybackLeaseOwner,
  type ReplayPlaybackLeaseSnapshot,
  type ReplayPlaybackLookaheadSnapshot,
  type ReplayPlaybackLookaheadState,
  type ReplayPlaybackMode,
  type ReplayPlaybackPlan,
  type ReplayPlaybackPlanSnapshot,
  type ReplayPlaybackPositionSnapshot,
  type ReplayPlaybackPositionState,
  type ReplayPlaybackQueuePolicy,
  type ReplayPlaybackQueueSnapshot,
  type ReplayPlaybackRequest,
  type ReplayPlaybackRequestAction,
  type ReplayPlaybackRequestSnapshot,
  type ReplayPlaybackSessionDefinition,
  type ReplayPlaybackSessionDefinitionSnapshot,
  type ReplayPlaybackSessionRuntimeState,
  type ReplayPlaybackSessionState,
  type ReplayPlaybackSessionStateSnapshot,
  type ReplayPlaybackStartPolicy,
  type ReplayPlaybackTelemetrySnapshot,
  type ReplayPlaybackUnderrunSnapshot,
  type ReplayPlaybackUnderrunState,
  type ReplayPlaybackUnitSelection,
  type ReplayPlaybackUnitSelectionSnapshot,
  type ReplayPlaybackValidationReport,
  type ReplayPlaylistExecutionSnapshot,
  type ReplayPlaylistExecutionState,
  type ReplayPlaylistExecutionStatus,
  type ReplayPrerollSnapshot,
  type ReplayPrerollState,
  type ReplayPreviewOutputSnapshot,
  type ReplayProgramActiveSnapshot,
  type ReplayProgramCandidateSnapshot,
  type ReplayProgramInsertionMode,
  type ReplayProgramInsertionPlan,
  type ReplayProgramInsertionPlanSnapshot,
  type ReplayProgramInsertionRequest,
  type ReplayProgramInsertionRequestSnapshot,
  type ReplayProgramInsertionResult,
  type ReplayProgramInsertionResultSnapshot,
  type ReplayProgramInsertionStatus,
  type ReplayReference,
  type ReplayReturnToLivePlan,
  type ReplayReturnToLivePlanSnapshot,
  type ReplayReturnToLivePolicy,
  type ReplayReturnToLiveRequest,
  type ReplayReturnToLiveRequestSnapshot,
  type ReplayReturnToLiveResult,
  type ReplayReturnToLiveResultSnapshot,
  type ReplayReturnToLiveStatus,
  type ReplayUnderrunPolicy,
} from './replay-playback-program-insertion-foundation.js';

export {
  REPLAY_CLIP_ASSEMBLY_COMMAND_TYPES,
  REPLAY_CLIP_ASSEMBLY_EVENTS,
  REPLAY_CLIP_ASSEMBLY_OUTPUT_KEYS,
  REPLAY_CLIP_ASSEMBLY_PROCESSOR_ORDER,
  REPLAY_CLIP_ASSEMBLY_VERSION,
  REPLAY_CLIP_ASSEMBLY_WATCHDOG_INCIDENTS,
  ReplayClipAssemblyEngine,
  ReplayClipAssemblyError,
  ReplayClipAssemblyProcessor,
  SyntheticReplayClipAssemblyBackend,
  createReplayClipAssemblyCommandHandlers,
  createReplayClipAssemblyEngine,
  createReplayClipAssemblyProcessor,
  createReplayClipAssemblySourceGraphSnapshot,
  createSyntheticReplayClipAssemblyBackend,
  type ReplayAssemblyConflictPolicy,
  type ReplayAssemblyErrorCode,
  type ReplayAssemblyLease,
  type ReplayAssemblyLeaseOwner,
  type ReplayAssemblyLeaseSnapshot,
  type ReplayAssemblyProtectionSnapshot,
  type ReplayAssemblyProtectionState,
  type ReplayAssemblyQueueKind,
  type ReplayAssemblyQueueSnapshot,
  type ReplayAssemblyReadinessSnapshot,
  type ReplayAssemblyReadinessState,
  type ReplayAssemblyType,
  type ReplayClipAssemblyBackend,
  type ReplayClipAssemblyBackendCapabilities,
  type ReplayClipAssemblyBackendSnapshot,
  type ReplayClipAssemblyCommandType,
  type ReplayClipAssemblyEngineSnapshot,
  type ReplayClipAssemblyHealthSnapshot,
  type ReplayClipAssemblyPlan,
  type ReplayClipAssemblyPlanSnapshot,
  type ReplayClipAssemblyRequest,
  type ReplayClipAssemblyRequestAction,
  type ReplayClipAssemblyRequestSnapshot,
  type ReplayClipAssemblyResult,
  type ReplayClipAssemblyResultSnapshot,
  type ReplayClipAssemblyResultStatus,
  type ReplayClipAssemblyTelemetrySnapshot,
  type ReplayClipAssemblyValidationReport,
  type ReplayClipAspectRatioRole,
  type ReplayClipAudioPolicy,
  type ReplayClipAudioPolicySnapshot,
  type ReplayClipAudioPolicyType,
  type ReplayClipDefinition,
  type ReplayClipDefinitionSnapshot,
  type ReplayClipGraphicsPolicy,
  type ReplayClipGraphicsPolicySnapshot,
  type ReplayClipLineage,
  type ReplayClipLineageSnapshot,
  type ReplayClipRevision,
  type ReplayClipRevisionSnapshot,
  type ReplayClipRevisionState,
  type ReplayClipSegment,
  type ReplayClipSegmentSnapshot,
  type ReplayClipTransitionPolicy,
  type ReplayClipTransitionPolicySnapshot,
  type ReplayHighlightDefinition,
  type ReplayHighlightDefinitionSnapshot,
  type ReplayHighlightEventType,
  type ReplayHighlightPackage,
  type ReplayHighlightPackageSnapshot,
  type ReplayHighlightType,
  type ReplayPlaylistAdvanceAction,
  type ReplayPlaylistAdvanceRequest,
  type ReplayPlaylistAdvanceRequestSnapshot,
  type ReplayPlaylistAdvanceResult,
  type ReplayPlaylistAdvanceResultSnapshot,
  type ReplayPlaylistAdvanceStatus,
  type ReplayPlaylistAdvancementPolicy,
  type ReplayPlaylistDefinition,
  type ReplayPlaylistDefinitionSnapshot,
  type ReplayPlaylistEntry,
  type ReplayPlaylistEntrySnapshot,
  type ReplayPlaylistInterruptionPolicy,
  type ReplayPlaylistResumePolicy,
  type ReplayPlaylistType,
} from './replay-playlist-highlight-clip-assembly-foundation.js';

export * from './replay-clip-media-output-foundation.js';

export {
  GRAPHICS_COMMAND_TYPES,
  GRAPHICS_EVENTS,
  GRAPHICS_FOUNDATION_PROCESSOR_ORDER,
  GRAPHICS_FOUNDATION_VERSION,
  GRAPHICS_WATCHDOG_INCIDENTS,
  GraphicsFoundationEngine,
  GraphicsFoundationError,
  GraphicsFoundationProcessor,
  createGraphicsCommandHandlers,
  createGraphicsFoundationEngine,
  createGraphicsFoundationProcessor,
  createGraphicsSourceGraphSnapshot,
  type GraphicsAnchor,
  type GraphicsAlignment,
  type GraphicsCommandType,
  type GraphicsDefinition,
  type GraphicsElement,
  type GraphicsElementType,
  type GraphicsEvent,
  type GraphicsEventType,
  type GraphicsFoundationSnapshot,
  type GraphicsHealth,
  type ImageElement,
  type GraphicsInstance,
  type GraphicsLayer,
  type GraphicsLayerRole,
  type GraphicsLifecycleState,
  type GraphicsPlacement,
  type GraphicsScene,
  type GraphicsShapeType,
  type GraphicsSourceGraphSnapshot,
  type GraphicsTelemetry,
  type GraphicsTransformMetadata,
  type GraphicsVisibility,
  type GraphicsWatchdogIncident,
  type ShapeElement,
  type TextElement,
} from './graphics-foundation.js';
export * from './graphics-template-engine.js';
