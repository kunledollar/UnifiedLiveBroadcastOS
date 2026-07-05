export * from './types.js';
export * from './validation.js';
import type { CloudPlatform, ResourceQuota } from './types.js';
export const createResourceQuota=(q:Partial<ResourceQuota>={}):ResourceQuota=>({cpuCores:0,memoryGb:0,storageGb:0,gpuUnits:0,streamingChannels:0,recordingHours:0,aiCredits:0,...q});
export function createCloudPlatform(seed:Partial<CloudPlatform>={}):CloudPlatform{const topology=seed.topology??{id:'topology-default',regions:[],clusters:[],networkZones:[],storageVolumes:[],nodes:[]}; return {organizations:[],workspaces:[],studios:[],environments:[],regions:[],clusters:[],deployments:[],topology,tenants:[],tenantWorkspaces:[],licenses:[],histories:[],health:[],metrics:[],auditEvents:[],metadataOnly:true,...seed};}
