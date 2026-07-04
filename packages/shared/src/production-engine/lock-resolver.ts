import type { ResourceLock } from './types.js';
import type { GraphMutationPlan } from './execution-result.js';
export function resolveResourceLocks(plan: GraphMutationPlan, locks: ResourceLock[] = []) { const blocked = locks.filter((lock)=>plan.locks.includes(lock.resourceType) && lock.state !== 'available'); return { ok: blocked.length===0, blocked: blocked.map((lock)=>({ owner: lock.owner, target: lock.resourceType, reason: `${lock.resourceType} is ${lock.state}` })) }; }
