import {
  CollaborationManager,
  createCollaborationDemo,
  hasCollaborationPermission,
  type CollaborationTeam,
  type CollaborationWorkspace,
} from './index.js';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const workspace: CollaborationWorkspace = {
  id: 'ws',
  name: 'Workspace',
  teamIds: ['team'],
  createdAt: new Date().toISOString(),
  metadata: {},
};
const team: CollaborationTeam = {
  id: 'team',
  workspaceId: 'ws',
  name: 'Team',
  members: [],
  metadata: {},
};
const manager = new CollaborationManager(workspace, team, {
  'Scene:intro': { version: 3, value: { name: 'Intro' } },
});
const admin = manager.startSession({
  id: 's-admin',
  userId: 'u-admin',
  displayName: 'Admin',
  role: 'Admin',
  workspaceId: 'ws',
  teamId: 'team',
});
const viewer = manager.startSession({
  id: 's-viewer',
  userId: 'u-viewer',
  displayName: 'Viewer',
  role: 'Viewer',
  workspaceId: 'ws',
  teamId: 'team',
});
const producer = manager.startSession({
  id: 's-producer',
  userId: 'u-producer',
  displayName: 'Producer',
  role: 'Producer',
  workspaceId: 'ws',
  teamId: 'team',
});
assert(hasCollaborationPermission('Admin', 'lock:override'), 'admin can override locks');
assert(!hasCollaborationPermission('Viewer', 'state:write'), 'viewer is read only');
assert(manager.listPresence().length === 3, 'presence tracks sessions');
const lock = manager.acquireLock(admin.id, { type: 'Scene', id: 'intro' });
assert(lock.acquired, 'admin acquires scene lock');
const denied = manager.acquireLock(producer.id, { type: 'Scene', id: 'intro' });
assert(!denied.acquired, 'another operator cannot take exclusive lock');
const applied = manager.applyOperation({
  id: 'op-1',
  sessionId: admin.id,
  userId: admin.userId,
  type: 'update',
  resource: { type: 'Scene', id: 'intro' },
  baseVersion: 3,
  patch: { name: 'Cold Open' },
});
assert(applied.accepted, 'matching base version applies');
const stale = manager.applyOperation({
  id: 'op-2',
  sessionId: admin.id,
  userId: admin.userId,
  type: 'update',
  resource: { type: 'Scene', id: 'intro' },
  baseVersion: 3,
  patch: { name: 'Stale' },
});
assert(
  !stale.accepted && manager.listConflicts().length >= 1,
  'stale write creates conflict metadata',
);
if (stale.accepted) throw new Error('stale result is rejected');
manager.resolveConflict(stale.conflict.id, admin.id, 'reject', 'Keep latest scene metadata');
assert(
  manager.listAuditLog().some((entry) => entry.action === 'conflict.resolved'),
  'audit log records resolution',
);
assert(manager.syncState(viewer.id).revision === 1, 'viewer can sync shared state');
let blocked = false;
try {
  manager.applyOperation({
    id: 'op-viewer',
    sessionId: viewer.id,
    userId: viewer.userId,
    type: 'update',
    resource: { type: 'Scene', id: 'intro' },
    baseVersion: 4,
    patch: {},
  });
} catch {
  blocked = true;
}
assert(blocked, 'viewer cannot mutate shared state');
const demo = createCollaborationDemo();
assert(
  demo.listEvents().some((event) => event.type === 'conflict.detected'),
  'demo includes conflict detection',
);
console.log('Phase 2.22 collaboration foundation validation passed');
