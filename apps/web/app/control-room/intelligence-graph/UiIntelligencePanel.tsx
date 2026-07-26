'use client';

/**
 * UiIntelligencePanel — Step 90
 *
 * Thin React wrapper that applies UIIL visual state classes to a panel root.
 * Geometry zones primarily use ControlRoomCanvas wrappers; this helper exists
 * for operator HUD / inspector surfaces that need local intelligence chrome.
 */

import type { ReactNode } from 'react';
import type { UiPanelVisualState } from './uiIntelligenceIntegrationLayer';
import { uiStateClassName } from './uiIntelligenceIntegrationLayer';
import './ui-intelligence.css';

export type UiIntelligencePanelProps = {
  state: UiPanelVisualState;
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
};

export function UiIntelligencePanel({
  state,
  className = '',
  children,
  'data-testid': testId,
}: UiIntelligencePanelProps) {
  const classes = [uiStateClassName(state), className].filter(Boolean).join(' ');
  return (
    <div className={classes || undefined} data-testid={testId} data-ui-intelligence="panel">
      {children}
    </div>
  );
}
