import type { ProfessionalOperatorRole } from './types.js';
import type { OperatorRole } from '../production-graph.js';

export type RoleWorkspaceMapping = {
  role: ProfessionalOperatorRole;
  label: string;
  preferredWorkspaceId: string;
  panels: string[];
  description: string;
};

export const roleWorkspaceMappings: RoleWorkspaceMapping[] = [
  {
    role: 'director',
    label: 'Director',
    preferredWorkspaceId: 'director',
    panels: ['Program', 'Preview', 'Switcher', 'Operations'],
    description: 'Program-dominant switching and take control',
  },
  {
    role: 'producer',
    label: 'Producer',
    preferredWorkspaceId: 'producer',
    panels: ['Run-down', 'Guests', 'Notes', 'Outputs', 'Graphics'],
    description: 'Production management and rundown coordination',
  },
  {
    role: 'technical_director',
    label: 'Technical Director',
    preferredWorkspaceId: 'remote-production',
    panels: ['Multiview', 'Sources', 'Routing', 'Outputs'],
    description: 'Technical routing and source management',
  },
  {
    role: 'audio_engineer',
    label: 'Audio Engineer',
    preferredWorkspaceId: 'audio-engineer',
    panels: ['Mixer', 'Program confidence', 'Meters'],
    description: 'Audio console and mix control',
  },
  {
    role: 'graphics_operator',
    label: 'Graphics Operator',
    preferredWorkspaceId: 'graphics-operator',
    panels: ['Layers', 'Lower thirds', 'Brand kit', 'Preview graphics'],
    description: 'Graphics layer stack and overlay staging',
  },
  {
    role: 'replay_operator',
    label: 'Replay Operator',
    preferredWorkspaceId: 'replay',
    panels: ['Clips', 'Playlist', 'Replay preview'],
    description: 'Replay clip and playlist workflows',
  },
  {
    role: 'guest_manager',
    label: 'Guest Manager',
    preferredWorkspaceId: 'producer',
    panels: ['Invites', 'Waiting room', 'Device readiness', 'Routing'],
    description: 'Guest intake, readiness, and scene assignment',
  },
  {
    role: 'moderator',
    label: 'Moderator',
    preferredWorkspaceId: 'producer',
    panels: ['Chat', 'Comments', 'Audience', 'Platform messages'],
    description: 'Audience moderation and message review',
  },
  {
    role: 'observer',
    label: 'Observer',
    preferredWorkspaceId: 'remote-production',
    panels: ['Confidence view'],
    description: 'Read-only confidence monitoring',
  },
];

export function getRoleWorkspaceMapping(role: ProfessionalOperatorRole): RoleWorkspaceMapping | undefined {
  return roleWorkspaceMappings.find((mapping) => mapping.role === role);
}

export function mapProductionRoleToProfessionalRole(role: OperatorRole): ProfessionalOperatorRole {
  const map: Partial<Record<OperatorRole, ProfessionalOperatorRole>> = {
    DIRECTOR: 'director',
    PRODUCER: 'producer',
    TECHNICAL_DIRECTOR: 'technical_director',
    AUDIO_ENGINEER: 'audio_engineer',
    GRAPHICS_OPERATOR: 'graphics_operator',
    GUEST_MANAGER: 'guest_manager',
    MODERATOR: 'moderator',
    VIEWER: 'observer',
    OWNER: 'director',
    ADMIN: 'producer',
  };
  return map[role] ?? 'observer';
}

export function mapProfessionalRoleToProductionRole(role: ProfessionalOperatorRole): OperatorRole {
  const map: Record<ProfessionalOperatorRole, OperatorRole> = {
    director: 'DIRECTOR',
    producer: 'PRODUCER',
    technical_director: 'TECHNICAL_DIRECTOR',
    audio_engineer: 'AUDIO_ENGINEER',
    graphics_operator: 'GRAPHICS_OPERATOR',
    replay_operator: 'VIEWER',
    guest_manager: 'GUEST_MANAGER',
    moderator: 'MODERATOR',
    observer: 'VIEWER',
  };
  return map[role];
}
