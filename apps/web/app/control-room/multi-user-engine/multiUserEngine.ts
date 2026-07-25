/**
 * UBOS Multi-User Engine — Step 74
 *
 * Tracks active operators, manages roles and presence, synchronizes
 * workspace state across multiple concurrent users, and maintains an
 * activity feed for the collaboration layer.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - real-time WebSocket sync
 *   - distributed multi-user state (CRDT / OT)
 *   - role-based permissions enforcement
 *   - operator locking (exclusive edit zones)
 *   - conflict resolution
 *   - multi-operator orchestration hooks
 *   - AI Crew operator assistance
 */

export type OperatorRole =
  | 'director'
  | 'producer'
  | 'technical-director'
  | 'graphics-operator'
  | 'audio-engineer'
  | 'replay-operator'
  | 'streaming-operator'
  | 'monitor-operator'
  | 'observer';

export type ActivityType =
  | 'join'
  | 'leave'
  | 'workspace'
  | 'action'
  | 'scene'
  | 'graphics'
  | 'routing'
  | 'audio';

export type Operator = {
  id: string;
  name: string;
  role: OperatorRole;
  workspace: string;
  joinedAt: number;
  lastActiveAt: number;
  color?: string;
};

export type ActivityEntry = {
  id: number;
  type: ActivityType;
  operatorId?: string;
  operatorName?: string;
  message: string;
  timestamp: number;
};

const OPERATOR_COLORS = ['#7c6af7', '#4da3ff', '#34d399', '#f87171', '#fbbf24', '#a78bfa'];

export class MultiUserEngine {
  private users:    Operator[] = [];
  private activity: ActivityEntry[] = [];
  private readonly MAX_ACTIVITY = 100;
  private colorIndex = 0;

  private pushActivity(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): void {
    this.activity.push({ ...entry, id: Date.now() + this.activity.length, timestamp: Date.now() });
    if (this.activity.length > this.MAX_ACTIVITY) {
      this.activity = this.activity.slice(-this.MAX_ACTIVITY);
    }
  }

  // ── Operator management ───────────────────────────────────────────────────

  addUser(user: Omit<Operator, 'joinedAt' | 'lastActiveAt' | 'color'>): Operator {
    const color = OPERATOR_COLORS[this.colorIndex % OPERATOR_COLORS.length];
    this.colorIndex++;

    const full: Operator = {
      ...user,
      ...(color ? { color } : {}),
      joinedAt:     Date.now(),
      lastActiveAt: Date.now(),
    };

    const existing = this.users.findIndex((u) => u.id === user.id);
    if (existing >= 0) {
      this.users[existing] = full;
    } else {
      this.users.push(full);
      this.pushActivity({
        type: 'join',
        operatorId:   user.id,
        operatorName: user.name,
        message: `${user.name} joined workspace ${user.workspace}`,
      });
    }
    return full;
  }

  removeUser(id: string): void {
    const user = this.users.find((u) => u.id === id);
    this.users = this.users.filter((u) => u.id !== id);
    if (user) {
      this.pushActivity({
        type: 'leave',
        operatorId:   user.id,
        operatorName: user.name,
        message: `${user.name} left workspace ${user.workspace}`,
      });
    }
  }

  setWorkspace(id: string, workspace: string): void {
    const user = this.users.find((u) => u.id === id);
    if (!user) return;
    const prev = user.workspace;
    user.workspace    = workspace;
    user.lastActiveAt = Date.now();
    this.pushActivity({
      type: 'workspace',
      operatorId:   user.id,
      operatorName: user.name,
      message: `${user.name} switched from ${prev} → ${workspace}`,
    });
  }

  recordAction(operatorId: string, action: string): void {
    const user = this.users.find((u) => u.id === operatorId);
    if (user) {
      user.lastActiveAt = Date.now();
      this.pushActivity({
        type: 'action',
        operatorId,
        operatorName: user.name,
        message: `${user.name}: ${action}`,
      });
    }
  }

  // ── Queries ───────────────────────────────────────────────────────────────

  getUsers():    readonly Operator[]       { return this.users; }
  getActivity(): readonly ActivityEntry[]  { return this.activity.slice(-20); }

  getUsersInWorkspace(workspace: string): readonly Operator[] {
    return this.users.filter((u) => u.workspace === workspace);
  }

  getUserByRole(role: OperatorRole): Operator | undefined {
    return this.users.find((u) => u.role === role);
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get userCount():     number { return this.users.length; }
  get activityCount(): number { return this.activity.length; }
}
