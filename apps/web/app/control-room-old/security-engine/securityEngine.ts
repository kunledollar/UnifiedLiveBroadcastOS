/**
 * UBOS Security Engine — Step 75
 *
 * Role-based access control (RBAC) engine. Defines operator roles,
 * enforces permissions, authorizes actions, and maintains a security
 * audit log for every authorization decision.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - fine-grained workspace-level permissions
 *   - engine-level permission scopes
 *   - multi-tenant isolation
 *   - cryptographic audit trails
 *   - AI-driven anomaly detection
 *   - operator session management
 */

export type Permission =
  | 'all'
  | 'view'
  | 'scene'
  | 'graphics'
  | 'replay'
  | 'routing'
  | 'audio'
  | 'output'
  | 'automation'
  | 'distribution'
  | 'persistence'
  | 'multi-user'
  | 'security'
  | 'health'
  | 'heartbeat';

export type SecurityRole = {
  name: string;
  permissions: Permission[];
};

export type SecurityLogEntry = {
  id: number;
  user: string;
  role: string;
  permission: Permission | string;
  allowed: boolean;
  time: string;
};

const DEFAULT_ROLES: Record<string, Permission[]> = {
  admin:             ['all'],
  director:          ['scene', 'graphics', 'replay', 'routing', 'audio', 'output', 'automation', 'distribution', 'heartbeat'],
  producer:          ['scene', 'graphics', 'audio', 'output', 'automation', 'distribution', 'heartbeat'],
  'technical-director': ['routing', 'audio', 'output', 'health', 'heartbeat'],
  'graphics-operator':  ['graphics', 'heartbeat'],
  'audio-engineer':     ['audio', 'heartbeat'],
  'replay-operator':    ['replay', 'heartbeat'],
  'streaming-operator': ['distribution', 'output', 'heartbeat'],
  'monitor-operator':   ['view', 'health', 'heartbeat'],
  observer:             ['view'],
};

export class SecurityEngine {
  private roles:  Record<string, Permission[]>;
  private log:    SecurityLogEntry[] = [];
  private readonly MAX_LOG = 200;

  constructor(customRoles?: Record<string, Permission[]>) {
    this.roles = { ...DEFAULT_ROLES, ...(customRoles ?? {}) };
  }

  // ── Permission checks ─────────────────────────────────────────────────────

  can(role: string, permission: Permission | string): boolean {
    const perms = this.roles[role];
    if (!perms) return false;
    return perms.includes('all') || perms.includes(permission as Permission);
  }

  authorize(
    user: { name: string; role: string },
    permission: Permission | string,
  ): boolean {
    const allowed = this.can(user.role, permission);

    const entry: SecurityLogEntry = {
      id:         Date.now() + this.log.length,
      user:       user.name,
      role:       user.role,
      permission,
      allowed,
      time:       new Date().toISOString(),
    };

    this.log.push(entry);
    if (this.log.length > this.MAX_LOG) {
      this.log = this.log.slice(-this.MAX_LOG);
    }

    return allowed;
  }

  // ── Role management ───────────────────────────────────────────────────────

  defineRole(name: string, permissions: Permission[]): void {
    this.roles[name] = permissions;
  }

  getRole(name: string): Permission[] | undefined {
    return this.roles[name];
  }

  getRoles(): Record<string, Permission[]> {
    return { ...this.roles };
  }

  // ── Log access ────────────────────────────────────────────────────────────

  getLog(): readonly SecurityLogEntry[] {
    return this.log.slice(-30);
  }

  getDeniedEntries(): readonly SecurityLogEntry[] {
    return this.log.filter((e) => !e.allowed).slice(-10);
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get logCount():    number { return this.log.length; }
  get deniedCount(): number { return this.log.filter((e) => !e.allowed).length; }
}
