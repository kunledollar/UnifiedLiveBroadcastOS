import type {
  OperatorPresence,
  ProducerNote,
  ProductionLock,
  ProfessionalOperatorRole,
  RemoteCollaborationEvent,
} from './types.js';

const RUNTIME_HANDLE_KEYS = [
  'stream',
  'socket',
  'webrtc',
  'mediastream',
  'canvas',
  'element',
  'ref',
  'blob',
  'peerconnection',
] as const;

const VALID_ROLES: ProfessionalOperatorRole[] = [
  'director',
  'producer',
  'technical_director',
  'audio_engineer',
  'graphics_operator',
  'replay_operator',
  'guest_manager',
  'moderator',
  'observer',
];

export type CollaborationValidationIssue = {
  code: string;
  message: string;
  field?: string;
};

export function collaborationMetadataContainsRuntimeHandle(
  value: unknown,
  path = 'metadata',
): CollaborationValidationIssue | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const nested = collaborationMetadataContainsRuntimeHandle(value[index], `${path}[${index}]`);
      if (nested) return nested;
    }
    return null;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (RUNTIME_HANDLE_KEYS.some((handle) => lowerKey.includes(handle))) {
      return {
        code: 'RUNTIME_HANDLE_REJECTED',
        message: `Runtime handle key "${key}" is not allowed in ${path}.`,
        field: `${path}.${key}`,
      };
    }
    const child = collaborationMetadataContainsRuntimeHandle(nested, `${path}.${key}`);
    if (child) return child;
  }
  return null;
}

export function sanitizeNoteText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function validateOperatorPresence(
  operator: OperatorPresence,
  operators: OperatorPresence[],
): CollaborationValidationIssue[] {
  const issues: CollaborationValidationIssue[] = [];
  if (!operator.id.trim()) issues.push({ code: 'MISSING_ID', message: 'Operator id is required.' });
  if (operators.some((item) => item.id === operator.id && item !== operator)) {
    issues.push({ code: 'DUPLICATE_OPERATOR_ID', message: 'Operator id must be unique.' });
  }
  if (!VALID_ROLES.includes(operator.role)) {
    issues.push({ code: 'INVALID_ROLE', message: 'Operator role is not valid.' });
  }
  if (!operator.permissions.scopes.length && !operator.permissions.readOnly) {
    issues.push({ code: 'MISSING_PERMISSIONS', message: 'Permissions must be explicit.' });
  }
  return issues;
}

export function validateProductionLock(lock: ProductionLock): CollaborationValidationIssue[] {
  const issues: CollaborationValidationIssue[] = [];
  if (!lock.ownerOperatorId.trim()) {
    issues.push({ code: 'MISSING_OWNER', message: 'Lock owner is required.' });
  }
  if (!lock.targetId.trim()) {
    issues.push({ code: 'MISSING_TARGET', message: 'Lock target must be metadata-only.' });
  }
  if (Date.parse(lock.expiresAt) < Date.parse(lock.createdAt)) {
    issues.push({ code: 'INVALID_LOCK_EXPIRY', message: 'Lock expiry must be after creation.' });
  }
  return issues;
}

export function validateProducerNote(note: ProducerNote): CollaborationValidationIssue[] {
  const issues: CollaborationValidationIssue[] = [];
  const sanitized = sanitizeNoteText(note.text);
  if (!sanitized) issues.push({ code: 'EMPTY_NOTE', message: 'Note text cannot be empty.' });
  if (sanitized !== note.text) {
    issues.push({ code: 'UNSAFE_NOTE_HTML', message: 'Note text cannot contain unsafe HTML.' });
  }
  if (!note.targetId.trim()) {
    issues.push({ code: 'MISSING_TARGET', message: 'Note target is required.' });
  }
  return issues;
}

export function validateCollaborationEvent(event: RemoteCollaborationEvent): CollaborationValidationIssue[] {
  const issues: CollaborationValidationIssue[] = [];
  if (!event.message.trim()) issues.push({ code: 'EMPTY_EVENT', message: 'Event message is required.' });
  return issues;
}
