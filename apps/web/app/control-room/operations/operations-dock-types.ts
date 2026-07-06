import type { OperationsTabId } from '../shell/types';

export type OperationsDockSectionId =
  | 'unified-chat'
  | 'guests'
  | 'inspector'
  | 'recording'
  | 'streaming'
  | 'outputs'
  | 'telemetry'
  | 'system-health';

export const OPERATIONS_DOCK_SECTION_ORDER: OperationsDockSectionId[] = [
  'unified-chat',
  'guests',
  'inspector',
  'recording',
  'streaming',
  'outputs',
  'telemetry',
  'system-health',
];

export const OPERATIONS_DOCK_SECTION_LABELS: Record<OperationsDockSectionId, string> = {
  'unified-chat': 'Unified Chat',
  guests: 'Guests',
  inspector: 'Inspector',
  recording: 'Recording',
  streaming: 'Streaming',
  outputs: 'Outputs',
  telemetry: 'Telemetry',
  'system-health': 'System Health',
};

const tabToSection: Partial<Record<OperationsTabId, OperationsDockSectionId>> = {
  logs: 'unified-chat',
  guests: 'guests',
  inspector: 'inspector',
  recording: 'recording',
  streaming: 'streaming',
  outputs: 'outputs',
  health: 'system-health',
  routing: 'inspector',
  monitoring: 'telemetry',
};

const sectionToTab: Record<OperationsDockSectionId, OperationsTabId> = {
  'unified-chat': 'logs',
  guests: 'guests',
  inspector: 'inspector',
  recording: 'recording',
  streaming: 'streaming',
  outputs: 'outputs',
  telemetry: 'health',
  'system-health': 'health',
};

export function operationsTabToDockSection(
  tab: OperationsTabId,
): OperationsDockSectionId | null {
  return tabToSection[tab] ?? null;
}

export function dockSectionToOperationsTab(section: OperationsDockSectionId): OperationsTabId {
  return sectionToTab[section];
}
