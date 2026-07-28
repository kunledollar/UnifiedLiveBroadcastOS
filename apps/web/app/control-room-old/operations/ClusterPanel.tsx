'use client';

import { ClusterWorkspace } from '../cluster/ClusterWorkspace';
import { OperationsPanel } from './OperationsChrome';

export function ClusterPanel() {
  return <OperationsPanel title="Cluster"><ClusterWorkspace compact /></OperationsPanel>;
}
