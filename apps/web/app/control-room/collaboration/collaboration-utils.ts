import type {
  ChatMessage,
  CollaborationLock,
  CollaborationOperator,
  CollaborationTargetType,
  CommandConflict,
  Guest,
  GuestInvite,
  MediaRoute,
  OperatorPresence,
  ProducerNote,
  ProductionLock,
  ProfessionalOperatorRole,
  RemoteCollaborationEvent,
  RemoteProductionState,
} from '@ubos/shared';
import {
  createCollaborationCommandIntent,
  mapProductionRoleToProfessionalRole,
  mapProfessionalRoleToProductionRole,
  roleWorkspaceMappings,
} from '@ubos/shared';

export function isCollaborationDemoEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_UBOS_DEMO_MODE === 'true' ||
    process.env.NEXT_PUBLIC_UBOS_SHOW_MOCK_OPERATORS === 'true'
  );
}

export function formatOperatorRole(role: ProfessionalOperatorRole): string {
  return role.replace(/_/g, ' ');
}

function mapSharedSelectionType(type: string): CollaborationTargetType {
  const map: Record<string, CollaborationTargetType> = {
    scene: 'scene',
    guest: 'guest',
    source: 'source',
    destination: 'output',
    overlay: 'graphics',
    lower_third: 'graphics',
    media_asset: 'media',
  };
  return map[type] ?? 'scene';
}

export function presenceStatusVariant(
  status: OperatorPresence['status'],
): 'success' | 'warning' | 'offline' | 'neutral' {
  switch (status) {
    case 'connected':
      return 'success';
    case 'idle':
    case 'reconnecting':
      return 'warning';
    case 'disconnected':
      return 'offline';
    default:
      return 'neutral';
  }
}

export function formatLockAge(iso: string): string {
  const deltaMs = Date.now() - Date.parse(iso);
  if (!Number.isFinite(deltaMs)) return 'unavailable';
  const seconds = Math.floor(Math.abs(deltaMs) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

export function mapCollaborationOperatorToPresence(
  operator: CollaborationOperator,
  isSimulation = false,
): OperatorPresence {
  const role = mapProductionRoleToProfessionalRole(operator.role);
  return {
    id: operator.id,
    name: operator.displayName,
    role,
    status:
      operator.connectionState === 'connected'
        ? operator.presence === 'idle'
          ? 'idle'
          : 'connected'
        : operator.connectionState === 'reconnecting'
          ? 'reconnecting'
          : 'disconnected',
    ...(operator.workspaceAwareness?.preset || operator.currentWorkspace
      ? { activeWorkspace: operator.workspaceAwareness?.preset ?? operator.currentWorkspace }
      : {}),
    ...(operator.currentPanel ? { currentPanel: operator.currentPanel } : {}),
    lastSeen: operator.lastSeenAt,
    permissions: {
      scopes: operator.authorityScopes ?? [],
      canOverride: false,
      readOnly: operator.role === 'VIEWER',
    },
    ...(operator.sharedSelection
      ? {
          selectedObject: {
            type: mapSharedSelectionType(operator.sharedSelection.type),
            id: operator.sharedSelection.resourceId,
            label: operator.sharedSelection.label,
          },
        }
      : {}),
    ...(operator.lockCount !== undefined ? { lockCount: operator.lockCount } : {}),
    isSimulation,
  };
}

export function mapAuthorityLockToProductionLock(lock: CollaborationLock): ProductionLock {
  const lockTypeMap: Record<string, ProductionLock['lockType']> = {
    program: 'control',
    preview: 'control',
    audio: 'audio',
    graphics: 'graphics',
    guests: 'route',
    scenes: 'edit',
  };
  return {
    id: lock.id,
    ownerOperatorId: lock.ownerOperatorId,
    ownerName: String(lock.metadata.displayName ?? lock.ownerRole),
    targetType: 'scope',
    targetId: lock.scope,
    lockType: lockTypeMap[lock.scope] ?? 'edit',
    createdAt: lock.acquiredAt,
    expiresAt: lock.expiresAt,
    conflictStatus: lock.status === 'active' ? 'none' : 'conflict',
    label: String(lock.metadata.label ?? `${lock.scope} lock`),
  };
}

export function createLocalOperatorPresence(input: {
  workspaceId: string;
  currentPanel?: string;
  role?: ProfessionalOperatorRole;
}): OperatorPresence {
  const role = input.role ?? 'director';
  return {
    id: 'local-operator',
    name: 'Local Operator',
    role,
    status: 'connected',
    activeWorkspace: input.workspaceId,
    currentPanel: input.currentPanel ?? 'Control Room',
    lastSeen: new Date().toISOString(),
    permissions: {
      scopes: roleWorkspaceMappings.find((m) => m.role === role)?.panels ?? [],
      canOverride: role === 'director',
      readOnly: role === 'observer',
    },
    isLocal: true,
  };
}

export function buildRemoteProductionState(input: {
  operators: OperatorPresence[];
  locks: ProductionLock[];
  notes: ProducerNote[];
  events: RemoteCollaborationEvent[];
  collaborationEnabled: boolean;
}): RemoteProductionState {
  return {
    operators: input.operators,
    locks: input.locks,
    notes: input.notes,
    events: input.events,
    collaborationEnabled: input.collaborationEnabled,
    containsRuntimeHandles: false,
  };
}

export function conflictsToEvents(conflicts: CommandConflict[]): RemoteCollaborationEvent[] {
  return conflicts.map((conflict) => ({
    id: conflict.id,
    type: conflict.type,
    operatorId: conflict.actorId,
    targetType: 'scope',
    targetId: conflict.scope,
    message: conflict.message,
    timestamp: conflict.createdAt,
  }));
}

export function mapMessagesToModeratorConnected(messages: ChatMessage[]): boolean {
  return messages.length > 0;
}

export { createCollaborationCommandIntent, mapProfessionalRoleToProductionRole, roleWorkspaceMappings };
