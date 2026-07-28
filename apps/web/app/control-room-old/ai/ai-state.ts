import type {
  AIAssistantState,
  AIRecommendation,
  AIRiskSignal,
} from '@ubos/shared';
import { createAICommandIntent } from '@ubos/shared';

export type AIState = {
  assistant: AIAssistantState;
  recommendations: AIRecommendation[];
  riskSignals: AIRiskSignal[];
  selectedRecommendationId: string | null;
  commandLog: ReturnType<typeof createAICommandIntent>[];
};

export type AIAction =
  | { type: 'SET_ASSISTANT_STATUS'; status: AIAssistantState['status'] }
  | { type: 'SET_ASSISTANT_MODE'; mode: AIAssistantState['mode'] }
  | { type: 'SELECT_RECOMMENDATION'; recommendationId: string | null }
  | { type: 'ACCEPT_RECOMMENDATION'; recommendationId: string }
  | { type: 'DISMISS_RECOMMENDATION'; recommendationId: string }
  | { type: 'ACKNOWLEDGE_RISK'; riskId: string }
  | { type: 'REQUEST_ANALYSIS' };

export function createInitialAIState(input: {
  assistant: AIAssistantState;
  recommendations: AIRecommendation[];
  riskSignals: AIRiskSignal[];
}): AIState {
  return {
    assistant: input.assistant,
    recommendations: input.recommendations,
    riskSignals: input.riskSignals,
    selectedRecommendationId: null,
    commandLog: [],
  };
}

export function aiReducer(state: AIState, action: AIAction): AIState {
  const appendCommand = (command: ReturnType<typeof createAICommandIntent>) => ({
    commandLog: [command, ...state.commandLog].slice(0, 50),
  });

  const touchAssistant = (): AIAssistantState => ({
    ...state.assistant,
    lastUpdated: new Date().toISOString(),
  });

  switch (action.type) {
    case 'SET_ASSISTANT_STATUS':
      return {
        ...state,
        assistant: { ...touchAssistant(), status: action.status },
      };
    case 'SET_ASSISTANT_MODE':
      return {
        ...state,
        assistant: { ...touchAssistant(), mode: action.mode },
        ...appendCommand(createAICommandIntent('SET_ASSISTANT_MODE', { mode: action.mode })),
      };
    case 'SELECT_RECOMMENDATION':
      return { ...state, selectedRecommendationId: action.recommendationId };
    case 'ACCEPT_RECOMMENDATION':
      return {
        ...state,
        recommendations: state.recommendations.map((recommendation) =>
          recommendation.id === action.recommendationId
            ? { ...recommendation, status: 'accepted' as const }
            : recommendation,
        ),
        assistant: touchAssistant(),
        ...appendCommand(
          createAICommandIntent('ACCEPT_RECOMMENDATION', { recommendationId: action.recommendationId }),
        ),
      };
    case 'DISMISS_RECOMMENDATION':
      return {
        ...state,
        recommendations: state.recommendations.map((recommendation) =>
          recommendation.id === action.recommendationId
            ? { ...recommendation, status: 'dismissed' as const }
            : recommendation,
        ),
        assistant: touchAssistant(),
        ...appendCommand(
          createAICommandIntent('DISMISS_RECOMMENDATION', { recommendationId: action.recommendationId }),
        ),
      };
    case 'ACKNOWLEDGE_RISK':
      return {
        ...state,
        riskSignals: state.riskSignals.filter((signal) => signal.id !== action.riskId),
        assistant: touchAssistant(),
        ...appendCommand(createAICommandIntent('ACKNOWLEDGE_RISK', { riskId: action.riskId })),
      };
    case 'REQUEST_ANALYSIS':
      return {
        ...state,
        assistant: { ...touchAssistant(), status: 'analyzing' },
        ...appendCommand(createAICommandIntent('REQUEST_ANALYSIS', {})),
      };
    default:
      return state;
  }
}
