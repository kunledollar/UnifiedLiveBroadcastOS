import { createCollaborationDemo } from '../packages/shared/dist/collaboration-foundation/index.js';

const demo = createCollaborationDemo();
console.log(
  JSON.stringify(
    {
      revision: demo.getSnapshot().revision,
      presence: demo
        .listPresence()
        .map((operator) => ({
          user: operator.displayName,
          role: operator.role,
          status: operator.status,
        })),
      locks: demo.listLocks().map((lock) => ({ resource: lock.resource, owner: lock.ownerUserId })),
      conflicts: demo
        .listConflicts()
        .map((conflict) => ({ reason: conflict.reason, resource: conflict.resource })),
      auditEntries: demo.listAuditLog().length,
      events: demo.listEvents().map((event) => event.type),
    },
    null,
    2,
  ),
);
