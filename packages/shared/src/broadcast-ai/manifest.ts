import type {
  AIAssistantManifest,
  AIAssistantState,
  AIRecommendation,
  AIRiskSignal,
} from './types.js';

export function createDefaultAIAssistantState(
  lastUpdated = new Date().toISOString(),
): AIAssistantState {
  return {
    status: 'idle',
    mode: 'advisory',
    lastUpdated,
    containsRuntimeHandles: false,
  };
}

export function createSampleAIRecommendations(): AIRecommendation[] {
  return [
    {
      id: 'ai-rec-scene-next',
      type: 'scene',
      title: 'Stage next guest scene',
      description:
        'Guest 2 segment is next in rundown. Consider staging preview scene before segment start.',
      confidence: 0.82,
      riskLevel: 'info',
      targetType: 'scene',
      targetId: 'guest-2',
      requiresApproval: true,
      status: 'suggested',
    },
    {
      id: 'ai-rec-graphics-lower-third',
      type: 'graphics',
      title: 'Prepare guest lower third',
      description:
        'Guest 1 is active. Lower third graphics may be needed for on-air identification.',
      confidence: 0.74,
      riskLevel: 'info',
      targetType: 'graphics',
      targetId: 'guest-lower-third',
      requiresApproval: true,
      status: 'suggested',
    },
    {
      id: 'ai-rec-audio-levels',
      type: 'audio',
      title: 'Review guest mic levels',
      description:
        'Guest channel headroom appears low in metadata summary. Operator should verify levels.',
      confidence: 0.68,
      riskLevel: 'warning',
      targetType: 'audio',
      targetId: 'guest-mic-1',
      requiresApproval: true,
      status: 'suggested',
    },
    {
      id: 'ai-rec-automation-cue',
      type: 'automation',
      title: 'Arm intro graphics cue',
      description:
        'Intro segment cues are pending. Consider arming show logo cue before segment start.',
      confidence: 0.71,
      riskLevel: 'info',
      targetType: 'automation',
      targetId: 'cue-intro-graphics',
      requiresApproval: true,
      status: 'suggested',
    },
    {
      id: 'ai-rec-highlight-clip',
      type: 'highlight',
      title: 'Mark highlight moment',
      description:
        'Replay buffer metadata suggests a highlight window. Clip suggestion placeholder only.',
      confidence: 0.55,
      riskLevel: 'info',
      targetType: 'replay',
      targetId: 'highlight-window-1',
      requiresApproval: true,
      status: 'suggested',
    },
  ];
}

export function createSampleAIRiskSignals(): AIRiskSignal[] {
  return [
    {
      id: 'risk-transition-active',
      severity: 'warning',
      message: 'Transition is active. Avoid stacking scene or graphics changes.',
      targetType: 'scene',
      targetId: 'program',
      suggestedAction: 'Wait for transition to complete before taking next scene.',
    },
    {
      id: 'risk-guest-unmuted',
      severity: 'info',
      message: 'Multiple guest channels may be open in preview routing metadata.',
      targetType: 'guest',
      targetId: 'guest-routing',
      suggestedAction: 'Verify guest mute states before next segment.',
    },
    {
      id: 'risk-output-health',
      severity: 'critical',
      message: 'Output upload telemetry unavailable. Stream health cannot be confirmed.',
      targetType: 'output',
      targetId: 'primary-output',
      suggestedAction: 'Check output health panel before going live.',
    },
  ];
}

export function createAIAssistantManifest(input?: {
  assistant?: AIAssistantState;
  recommendations?: AIRecommendation[];
  riskSignals?: AIRiskSignal[];
}): AIAssistantManifest {
  return {
    assistant: input?.assistant ?? createDefaultAIAssistantState(),
    recommendations: input?.recommendations ?? createSampleAIRecommendations(),
    riskSignals: input?.riskSignals ?? createSampleAIRiskSignals(),
    containsRuntimeHandles: false,
  };
}

export function isAIAssistantManifestReplaySafe(manifest: AIAssistantManifest): boolean {
  return manifest.containsRuntimeHandles === false;
}
