export type ProfessionalOperatorRole =
  | 'director'
  | 'producer'
  | 'technical_director'
  | 'audio_engineer'
  | 'graphics_operator'
  | 'replay_operator'
  | 'guest_manager'
  | 'moderator'
  | 'observer';

export type OperatorPresenceStatus = 'connected' | 'idle' | 'disconnected' | 'reconnecting';

export type ProductionLockType = 'edit' | 'control' | 'route' | 'graphics' | 'audio' | 'replay';

export type ProducerNoteStatus = 'open' | 'resolved' | 'pinned';

export type CollaborationTargetType =
  | 'scene'
  | 'source'
  | 'guest'
  | 'graphics'
  | 'media'
  | 'output'
  | 'workspace';

export interface OperatorSelectedObject {
  type: CollaborationTargetType;
  id: string;
  label: string;
}

export interface OperatorPermissions {
  scopes: string[];
  canOverride: boolean;
  readOnly: boolean;
}

export interface OperatorPresence {
  id: string;
  name: string;
  role: ProfessionalOperatorRole;
  status: OperatorPresenceStatus;
  activeWorkspace?: string;
  currentPanel?: string;
  lastSeen: string;
  permissions: OperatorPermissions;
  selectedObject?: OperatorSelectedObject;
  lockCount?: number;
  isLocal?: boolean;
  isSimulation?: boolean;
}

export interface ProductionLock {
  id: string;
  ownerOperatorId: string;
  ownerName?: string;
  targetType: CollaborationTargetType | 'scope';
  targetId: string;
  lockType: ProductionLockType;
  createdAt: string;
  expiresAt: string;
  conflictStatus?: 'none' | 'conflict';
  label?: string;
}

export interface ProducerNote {
  id: string;
  authorId: string;
  authorName?: string;
  targetType: CollaborationTargetType;
  targetId: string;
  targetLabel?: string;
  text: string;
  status: ProducerNoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RemoteCollaborationEvent {
  id: string;
  type: string;
  operatorId?: string;
  operatorName?: string;
  targetType?: CollaborationTargetType | 'scope';
  targetId?: string;
  message: string;
  timestamp: string;
}

export interface RemoteProductionState {
  operators: OperatorPresence[];
  locks: ProductionLock[];
  notes: ProducerNote[];
  events: RemoteCollaborationEvent[];
  collaborationEnabled: boolean;
  containsRuntimeHandles: false;
}

export const COLLABORATION_COMMAND_STUBS = [
  'REGISTER_OPERATOR',
  'UPDATE_OPERATOR_PRESENCE',
  'ACQUIRE_PRODUCTION_LOCK',
  'RELEASE_PRODUCTION_LOCK',
  'ADD_PRODUCER_NOTE',
  'RESOLVE_PRODUCER_NOTE',
  'PIN_PRODUCER_NOTE',
  'RECORD_COLLABORATION_EVENT',
] as const;

export type CollaborationCommandStub = (typeof COLLABORATION_COMMAND_STUBS)[number];
