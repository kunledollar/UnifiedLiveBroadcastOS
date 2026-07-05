export const enterpriseRoles = [
  'owner','admin','billing_admin','compliance_admin','technical_admin','production_admin','workspace_admin','operator','viewer','guest',
] as const;
export type EnterpriseRole = (typeof enterpriseRoles)[number];

export const licensePlans = ['community','creator','studio','professional','enterprise','broadcast_network','custom'] as const;
export type LicensePlan = (typeof licensePlans)[number];

export type OrganizationStatus = 'active' | 'suspended' | 'archived' | 'pending';
export type TenantStatus = 'active' | 'suspended' | 'archived';
export type TenantIsolationMode = 'shared' | 'dedicated_metadata' | 'dedicated_runtime';

export interface UsageQuota {
  maxUsers: number; maxWorkspaces: number; maxStudios: number; maxGuests: number; maxOutputs: number;
  maxRecordings: number; maxStorageGB: number; maxCloudNodes: number; maxPlugins: number; maxApiClients: number;
}
export interface QuotaPolicy { id: string; name: string; quotas: UsageQuota; warningThresholdPercent: number; hardLimit: boolean; }
export interface AdminPolicy { id: string; name: string; enabled: boolean; scope: 'organization' | 'tenant' | 'workspace'; rules: string[]; }
export interface CompliancePolicy { id: string; name: string; framework: string; enabled: boolean; retentionDays: number; controls: string[]; }
export interface WorkspaceAccount { id: string; tenantId: string; name: string; status: 'active' | 'disabled' | 'archived'; region: string; }
export interface Department { id: string; organizationId: string; name: string; ownerId?: string; }
export interface Team { id: string; tenantId: string; name: string; userIds: string[]; departmentId?: string; }
export interface EnterpriseUser { id: string; tenantId: string; displayName: string; email?: string; roles: EnterpriseRole[]; departmentId?: string; status: 'active' | 'invited' | 'disabled'; }
export interface LicenseSeat { id: string; plan: LicensePlan; status: 'available' | 'allocated' | 'revoked'; assignedUserId?: string; }
export interface LicenseAllocation { id: string; tenantId: string; userId: string; seatId: string; plan: LicensePlan; allocatedAt: string; }
export interface SubscriptionMetadata { id: string; plan: LicensePlan; status: 'trial' | 'active' | 'paused' | 'expired'; renewalPolicy: 'manual' | 'metadata_only'; seats: number; }
export interface BillingProfileMetadata { id: string; organizationId: string; billingContactId?: string; billingRegion?: string; taxRegion?: string; notes?: string; }
export interface EnterpriseAuditEvent { id: string; actorId: string; action: string; targetType: string; targetId: string; createdAt: string; metadata?: Record<string, string | number | boolean>; }
export interface EnterpriseAuditTrail { id: string; organizationId: string; events: EnterpriseAuditEvent[]; }
export interface AdminApproval { id: string; requestedBy: string; approverIds: string[]; status: 'pending' | 'approved' | 'rejected'; reason: string; createdAt: string; }
export interface Tenant { id: string; organizationId: string; name: string; isolationMode: TenantIsolationMode; status: TenantStatus; quotas: UsageQuota; users: EnterpriseUser[]; workspaces: WorkspaceAccount[]; }
export interface Organization { id: string; name: string; type: 'community' | 'creator' | 'studio' | 'enterprise' | 'broadcast_network'; status: OrganizationStatus; ownerId: string; regions: string[]; workspaces: WorkspaceAccount[]; teams: Team[]; policies: { admin: AdminPolicy[]; compliance: CompliancePolicy[]; quota: QuotaPolicy[] }; licensePlan: LicensePlan; createdAt: string; updatedAt: string; }
export interface AdminDashboard { organizationId: string; plan: LicensePlan; seatUsage: { allocated: number; total: number }; activePolicies: string[]; quotaWarnings: string[]; recentAuditEvents: EnterpriseAuditEvent[]; }
export interface OrganizationManifest { organizations: Organization[]; tenants: Tenant[]; departments: Department[]; auditTrails: EnterpriseAuditTrail[]; approvals: AdminApproval[]; }
export interface TenantManifest { tenants: Tenant[]; teams: Team[]; users: EnterpriseUser[]; workspaces: WorkspaceAccount[]; }
export interface LicenseManifest { plan: LicensePlan; seats: LicenseSeat[]; allocations: LicenseAllocation[]; subscription: SubscriptionMetadata; billingProfile?: BillingProfileMetadata; }

export const defaultUsageQuota: UsageQuota = { maxUsers: 10, maxWorkspaces: 2, maxStudios: 1, maxGuests: 5, maxOutputs: 2, maxRecordings: 25, maxStorageGB: 100, maxCloudNodes: 0, maxPlugins: 10, maxApiClients: 2 };

const unsafeFieldPattern = /(password|secret|token|oauth|api[_-]?key|card|payment|stripe|paypal|rawBilling|runtimeHandle|handle)/i;
function hasDuplicate(values: string[]) { return new Set(values).size !== values.length; }
function scanUnsafe(value: unknown, path = 'root'): string[] {
  if (!value || typeof value !== 'object') return [];
  const issues: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const nextPath = `${path}.${key}`;
    if (unsafeFieldPattern.test(key)) issues.push(`Unsafe field rejected: ${nextPath}`);
    issues.push(...scanUnsafe(nested, nextPath));
  }
  return issues;
}
export class EnterpriseAdminValidator {
  static validateQuota(quota: UsageQuota): string[] { return Object.entries(quota).filter(([, v]) => v < 0).map(([k]) => `Quota cannot be negative: ${k}`); }
  static validateRole(role: string): role is EnterpriseRole { return enterpriseRoles.includes(role as EnterpriseRole); }
  static validatePlan(plan: string): plan is LicensePlan { return licensePlans.includes(plan as LicensePlan); }
  static validateManifest(manifest: OrganizationManifest & Partial<TenantManifest & LicenseManifest>): string[] {
    const issues = scanUnsafe(manifest);
    if (hasDuplicate(manifest.organizations.map((org) => org.id))) issues.push('Duplicate organization IDs are not allowed');
    if (hasDuplicate(manifest.tenants.map((tenant) => tenant.id))) issues.push('Duplicate tenant IDs are not allowed');
    const users = manifest.tenants.flatMap((tenant) => tenant.users).concat(manifest.users ?? []);
    if (hasDuplicate(users.map((user) => user.id))) issues.push('Duplicate user IDs are not allowed');
    for (const tenant of manifest.tenants) issues.push(...this.validateQuota(tenant.quotas));
    for (const user of users) for (const role of user.roles) if (!this.validateRole(role)) issues.push(`Invalid role: ${role}`);
    for (const org of manifest.organizations) if (!this.validatePlan(org.licensePlan)) issues.push(`Invalid plan: ${org.licensePlan}`);
    if (manifest.plan && !this.validatePlan(manifest.plan)) issues.push(`Invalid plan: ${manifest.plan}`);
    return issues;
  }
}

export class EnterpriseAdminRuntime {
  readonly manifest: OrganizationManifest;
  constructor(manifest: OrganizationManifest) {
    const issues = EnterpriseAdminValidator.validateManifest(manifest);
    if (issues.length) throw new Error(`Invalid enterprise admin manifest: ${issues.join('; ')}`);
    this.manifest = structuredClone(manifest);
  }
  getOrganization(id: string) { return this.manifest.organizations.find((org) => org.id === id); }
  createDashboard(organizationId: string, license?: LicenseManifest): AdminDashboard {
    const organization = this.getOrganization(organizationId);
    if (!organization) throw new Error(`Unknown organization: ${organizationId}`);
    const trail = this.manifest.auditTrails.find((item) => item.organizationId === organizationId);
    return { organizationId, plan: organization.licensePlan, seatUsage: { allocated: license?.allocations.length ?? 0, total: license?.seats.length ?? 0 }, activePolicies: [...organization.policies.admin, ...organization.policies.compliance].filter((p) => p.enabled).map((p) => p.name), quotaWarnings: [], recentAuditEvents: (trail?.events ?? []).slice(-5) };
  }
  serializeAuditTrail(organizationId: string) { return JSON.stringify(this.manifest.auditTrails.find((trail) => trail.organizationId === organizationId) ?? { organizationId, events: [] }); }
}
