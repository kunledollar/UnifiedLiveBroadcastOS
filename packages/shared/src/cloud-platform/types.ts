export const CLOUD_ENVIRONMENT_TYPES = ['development','testing','qa','staging','production','disaster_recovery','backup','archive','training','sandbox'] as const;
export type CloudEnvironmentType = typeof CLOUD_ENVIRONMENT_TYPES[number];
export const DEPLOYMENT_TARGETS = ['local_workstation','single_studio','multi_studio','private_cloud','public_cloud','edge_node','broadcast_truck','remote_production','disaster_recovery','enterprise_cluster'] as const;
export type DeploymentTargetType = typeof DEPLOYMENT_TARGETS[number];
export const CLOUD_REGIONS = ['north_america','south_america','europe','africa','middle_east','asia_pacific','australia','custom_region'] as const;
export type CloudRegionName = typeof CLOUD_REGIONS[number];
export const INFRASTRUCTURE_COMPONENTS = ['compute_node','storage','gpu_node','media_node','audio_node','recording_node','streaming_node','monitoring_node','database_node','ai_node','plugin_node'] as const;
export type InfrastructureComponent = typeof INFRASTRUCTURE_COMPONENTS[number];
export type DeploymentStatus = 'draft'|'queued'|'approved'|'planned'|'deployed_metadata'|'failed_validation'|'archived';
export interface ResourceQuota { cpuCores: number; memoryGb: number; storageGb: number; gpuUnits: number; streamingChannels: number; recordingHours: number; aiCredits: number; }
export interface LicenseAllocation { id: string; tier: 'community'|'studio'|'enterprise'|'broadcast_network'; seats: number; features: string[]; expiresAt?: string; }
export interface Tenant { id: string; organizationId: string; name: string; workspaceIds: string[]; }
export interface TenantWorkspace { id: string; tenantId: string; workspaceId: string; role: 'owner'|'producer'|'operator'|'viewer'; }
export interface CloudRegion { id: string; name: CloudRegionName; label: string; availabilityZones: AvailabilityZone[]; metadataOnly: true; }
export interface AvailabilityZone { id: string; name: string; regionId: string; deterministic: true; }
export interface NetworkZone { id: string; name: string; regionId: string; cidrLabel?: string; }
export interface StorageVolume { id: string; name: string; sizeGb: number; purpose: 'media'|'recording'|'archive'|'database'|'backup'; encrypted: boolean; }
export interface InfrastructureNode { id: string; name: string; component: InfrastructureComponent; regionId: string; zoneId?: string; quota: ResourceQuota; status: 'planned'|'available'|'degraded'|'offline'; containsRuntimeHandles: false; }
export interface CloudCluster { id: string; name: string; regionId: string; environmentId: string; nodes: InfrastructureNode[]; quotas: ResourceQuota; healthId?: string; }
export interface CloudStudio { id: string; organizationId: string; name: string; regionId: string; workspaceIds: string[]; clusterIds: string[]; }
export interface CloudWorkspace { id: string; organizationId: string; studioId?: string; name: string; environmentIds: string[]; deploymentIds: string[]; }
export interface CloudEnvironment { id: string; organizationId: string; workspaceId: string; type: CloudEnvironmentType; name: string; regionId: string; clusterId?: string; quotas: ResourceQuota; }
export interface CloudOrganization { id: string; name: string; workspaceIds: string[]; studioIds: string[]; tenantIds: string[]; licenseAllocationIds: string[]; }
export interface DeploymentTarget { id: string; type: DeploymentTargetType; environmentId: string; clusterId?: string; studioId?: string; regionId: CloudRegionName; }
export interface DeploymentArtifact { id: string; packageId: string; name: string; kind: 'manifest'|'configuration'|'media_profile'|'plugin_manifest'|'documentation'; checksum: string; }
export interface DeploymentPackage { id: string; name: string; versionId: string; artifacts: DeploymentArtifact[]; containsRuntimeHandles: false; containsSecrets: false; }
export interface DeploymentVersion { id: string; semver: string; createdAt: string; notes?: string; }
export interface DeploymentProfile { id: string; name: string; targetId: string; environmentType: CloudEnvironmentType; policyIds: string[]; }
export interface DeploymentStage { id: string; name: string; order: number; approvalRequired: boolean; }
export interface DeploymentJob { id: string; stageId: string; status: DeploymentStatus; createdAt: string; completedAt?: string; }
export interface DeploymentPipeline { id: string; name: string; stages: DeploymentStage[]; jobs: DeploymentJob[]; metadataOnly: true; }
export interface DeploymentPolicy { id: string; name: string; rules: string[]; requiresApproval: boolean; }
export interface DeploymentApproval { id: string; deploymentId: string; approver: string; status: 'pending'|'approved'|'rejected'; decidedAt?: string; }
export interface DeploymentPlan { id: string; deploymentId: string; targetIds: string[]; stageIds: string[]; estimatedResourceQuota: ResourceQuota; }
export interface DeploymentSnapshot { id: string; deploymentId: string; capturedAt: string; manifestHash: string; topologyHash: string; }
export interface DeploymentHealth { id: string; deploymentId: string; status: 'unknown'|'healthy'|'degraded'|'offline'; checks: string[]; updatedAt: string; }
export interface DeploymentMetrics { id: string; deploymentId: string; cpuUtilization: number; memoryUtilization: number; storageUtilization: number; activeStreams: number; updatedAt: string; }
export interface DeploymentHistory { id: string; deploymentId: string; events: CloudAuditEvent[]; snapshots: DeploymentSnapshot[]; }
export interface CloudAuditEvent { id: string; actor: string; action: string; subjectId: string; createdAt: string; metadataOnly: true; }
export interface CloudTopology { id: string; regions: CloudRegion[]; clusters: CloudCluster[]; networkZones: NetworkZone[]; storageVolumes: StorageVolume[]; nodes: InfrastructureNode[]; }
export interface DeploymentManifest { id: string; organizationId: string; workspaceId: string; version: DeploymentVersion; packages: DeploymentPackage[]; targets: DeploymentTarget[]; profiles: DeploymentProfile[]; pipeline?: DeploymentPipeline; policies: DeploymentPolicy[]; approvals: DeploymentApproval[]; containsRuntimeHandles: false; containsSecrets: false; metadataOnly: true; }
export interface CloudPlatform { organizations: CloudOrganization[]; workspaces: CloudWorkspace[]; studios: CloudStudio[]; environments: CloudEnvironment[]; regions: CloudRegion[]; clusters: CloudCluster[]; deployments: DeploymentManifest[]; topology: CloudTopology; tenants: Tenant[]; tenantWorkspaces: TenantWorkspace[]; licenses: LicenseAllocation[]; histories: DeploymentHistory[]; health: DeploymentHealth[]; metrics: DeploymentMetrics[]; auditEvents: CloudAuditEvent[]; metadataOnly: true; }
