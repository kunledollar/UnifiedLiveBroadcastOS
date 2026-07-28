'use client';

/**
 * useUiIntelligence — Step 90
 *
 * Polls the live UIIL state so Control Room wrappers re-render when WIE
 * signals change. Orchestration already refreshes the intelligence graph;
 * this hook only reads applied UI state.
 */

import { useEffect, useState } from 'react';
import { workspaceState } from '../workspace/workspaceState';
import type { UiIntelligenceState } from '../intelligence-graph/uiIntelligenceIntegrationLayer';

export function useUiIntelligence(intervalMs = 400): UiIntelligenceState {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      forceRender((n) => n + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return workspaceState.intelligenceGraph.uiIntegration.getState();
}
