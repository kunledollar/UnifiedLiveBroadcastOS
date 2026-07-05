export const broadcastRoles = [
  'owner','admin','director','producer','technical_director','audio_engineer','graphics_operator','replay_operator','guest_manager','moderator','observer','guest','api_client',
] as const;
export type BroadcastRole = (typeof broadcastRoles)[number];

export const permissions = [
  'production.switch','production.preview','production.program','scene.create','scene.update','scene.delete','source.create','source.update','source.delete','graphics.control','media.control','replay.control','audio.control','recording.control','streaming.control','output.route','guest.invite','guest.remove','guest.mute','automation.arm','automation.execute','ai.approve','device.control','settings.manage','audit.read',
] as const;
export type Permission = (typeof permissions)[number];
export type PermissionSet = ReadonlySet<Permission> | readonly Permission[];

const rolePermissions: Record<BroadcastRole, readonly Permission[]> = {
  owner: permissions,
  admin: permissions,
  director: ['production.switch','production.preview','production.program','scene.create','scene.update','source.create','source.update','graphics.control','media.control','replay.control','audio.control','recording.control','streaming.control','output.route','guest.invite','guest.remove','guest.mute','automation.arm','automation.execute','ai.approve','device.control','audit.read'],
  producer: ['production.preview','scene.create','scene.update','source.create','source.update','graphics.control','media.control','guest.invite','guest.mute','automation.arm','ai.approve','audit.read'],
  technical_director: ['production.switch','production.preview','production.program','scene.update','source.update','media.control','replay.control','output.route','device.control','automation.arm'],
  audio_engineer: ['audio.control'],
  graphics_operator: ['graphics.control','scene.update','source.update'],
  replay_operator: ['replay.control','media.control'],
  guest_manager: ['guest.invite','guest.remove','guest.mute'],
  moderator: ['guest.mute'],
  observer: ['audit.read'],
  guest: [],
  api_client: ['production.preview','audit.read'],
};

export interface UserIdentity { id: string; displayName: string; email?: string; }
export interface OperatorIdentity extends UserIdentity { role: BroadcastRole; workspaceId?: string; isAI?: boolean; isAutomation?: boolean; }
export interface SecurityManifest { version: '26.0.0'; roles: readonly BroadcastRole[]; permissions: readonly Permission[]; rolePermissions: Record<BroadcastRole, readonly Permission[]>; }
export interface ApprovalPolicy { required: boolean; approverRoles: readonly BroadcastRole[]; reason?: string; }
export interface ActionPolicy { action: string; permission: Permission; dangerous?: boolean; destructive?: boolean; elevated?: boolean; approval?: ApprovalPolicy; }
export interface AccessPolicy { actions: readonly ActionPolicy[]; denyRoles?: readonly BroadcastRole[]; }
export interface AuditEvent { readonly id: string; readonly at: string; readonly actorId: string; readonly actorRole: BroadcastRole; readonly action: string; readonly decision: 'allow' | 'deny' | 'needs_approval'; readonly metadata: Readonly<Record<string, string | number | boolean | null>>; }
export interface AuditTrail { readonly events: readonly AuditEvent[]; }
export interface SecurityDecision { allowed: boolean; requiresApproval: boolean; reasons: readonly string[]; permission?: Permission; }
export interface SecurityContext { operator: OperatorIdentity; permissions: readonly Permission[]; approvals?: readonly { action: string; approvedBy: string; at: string }[]; }
export interface SessionSecurityState { sessionId: string; operators: readonly OperatorIdentity[]; pendingApprovals: readonly ActionPolicy[]; auditTrail: AuditTrail; warnings: readonly string[]; }

export const SecurityManifest: SecurityManifest = { version: '26.0.0', roles: broadcastRoles, permissions, rolePermissions };

export class PermissionValidator {
  static isRole(value: string): value is BroadcastRole { return (broadcastRoles as readonly string[]).includes(value); }
  static isPermission(value: string): value is Permission { return (permissions as readonly string[]).includes(value); }
  static permissionsForRole(role: BroadcastRole): readonly Permission[] { return rolePermissions[role]; }
  static hasPermission(set: PermissionSet, permission: Permission): boolean { return Array.isArray(set) ? set.includes(permission) : (set as ReadonlySet<Permission>).has(permission); }
}

export const defaultActionPolicies: readonly ActionPolicy[] = [
  { action: 'switch.cut', permission: 'production.switch', dangerous: true },
  { action: 'switch.program', permission: 'production.program', dangerous: true },
  { action: 'audio.mix', permission: 'audio.control' },
  { action: 'guest.invite', permission: 'guest.invite' },
  { action: 'guest.remove', permission: 'guest.remove', destructive: true, approval: { required: true, approverRoles: ['producer','director','admin','owner'] } },
  { action: 'ai.execute', permission: 'ai.approve', dangerous: true, approval: { required: true, approverRoles: ['director','admin','owner'], reason: 'AI cannot execute actions directly' } },
  { action: 'automation.execute', permission: 'automation.execute', dangerous: true },
  { action: 'recording.start', permission: 'recording.control', elevated: true },
  { action: 'streaming.start', permission: 'streaming.control', elevated: true },
  { action: 'scene.delete', permission: 'scene.delete', destructive: true, approval: { required: true, approverRoles: ['admin','owner'] } },
];

export class PolicyEvaluator {
  constructor(private readonly policy: AccessPolicy = { actions: defaultActionPolicies }) {}
  evaluate(context: SecurityContext, action: string): SecurityDecision {
    const actionPolicy = this.policy.actions.find((candidate) => candidate.action === action);
    const reasons: string[] = [];
    if (!actionPolicy) return { allowed: false, requiresApproval: false, reasons: ['Unknown action'] };
    if (context.operator.role === 'observer' && actionPolicy.permission !== 'audit.read') reasons.push('Observer cannot mutate production state');
    if (context.operator.role === 'guest') reasons.push('Guest cannot access operator controls');
    if (context.operator.isAI) reasons.push('AI cannot execute actions directly');
    if (!PermissionValidator.hasPermission(context.permissions, actionPolicy.permission)) reasons.push(`Missing permission ${actionPolicy.permission}`);
    const approved = context.approvals?.some((approval) => approval.action === action) ?? false;
    const requiresApproval = Boolean(actionPolicy.approval?.required || actionPolicy.destructive || context.operator.isAI) && !approved;
    if (requiresApproval) reasons.push('Approval metadata required');
    return { allowed: reasons.length === 0, requiresApproval, reasons, permission: actionPolicy.permission };
  }
}

export class AuditRecorder {
  static record(trail: AuditTrail, event: AuditEvent): AuditTrail { return Object.freeze({ events: Object.freeze([...trail.events, Object.freeze({ ...event, metadata: Object.freeze({ ...event.metadata }) })]) }); }
}
