'use client';

import type { DistributionState } from '../distribution/distribution-state';
import { DistributionPanel } from '../distribution/DistributionPanel';
import type { DistributionAction } from '../distribution/distribution-state';

export function OutputsPanel({
  state,
  dispatch,
}: {
  state: DistributionState;
  dispatch: (action: DistributionAction) => void;
}) {
  return <DistributionPanel state={state} dispatch={dispatch} />;
}
