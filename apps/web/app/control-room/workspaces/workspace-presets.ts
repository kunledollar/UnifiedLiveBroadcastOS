import type { WorkspaceProfile } from './workspace-types';

export const workspaceProfiles: Record<WorkspaceProfile['id'], WorkspaceProfile> = {
  director: {
    id: 'director',
    label: 'Director',
    description: 'Program-dominant live switching',
    centerLayout: 'program-focus',
    defaultViewMode: 'program',
    defaultOperationsTab: 'preview',
    defaultDockTab: 'audio',
    defaultNavItem: 'scenes',
    programFlexWeight: 75,
  },
  producer: {
    id: 'producer',
    label: 'Producer',
    description: 'Guests, outputs, and production management',
    centerLayout: 'producer-dashboard',
    defaultViewMode: 'multiview',
    defaultOperationsTab: 'guests',
    defaultDockTab: 'layers',
    defaultNavItem: 'scenes',
    programFlexWeight: 55,
  },
  'audio-engineer': {
    id: 'audio-engineer',
    label: 'Audio Engineer',
    description: 'Large console and metering focus',
    centerLayout: 'audio-focus',
    defaultViewMode: 'program',
    defaultOperationsTab: 'routing',
    defaultDockTab: 'audio',
    defaultNavItem: 'sources',
    programFlexWeight: 35,
  },
  podcast: {
    id: 'podcast',
    label: 'Podcast',
    description: 'Multi-guest podcast production',
    centerLayout: 'podcast-grid',
    defaultViewMode: 'multiview',
    defaultOperationsTab: 'guests',
    defaultDockTab: 'audio',
    defaultNavItem: 'sources',
    programFlexWeight: 50,
  },
  interview: {
    id: 'interview',
    label: 'Interview',
    description: 'Program and preview dual monitoring',
    centerLayout: 'dual-view',
    defaultViewMode: 'program',
    defaultOperationsTab: 'guests',
    defaultDockTab: 'layers',
    defaultNavItem: 'scenes',
    programFlexWeight: 65,
  },
  'vertical-creator': {
    id: 'vertical-creator',
    label: 'Vertical Creator',
    description: '9:16 and 16:9 social outputs',
    centerLayout: 'vertical-split',
    defaultViewMode: 'vertical',
    defaultOperationsTab: 'preview',
    defaultDockTab: 'media',
    defaultNavItem: 'media',
    programFlexWeight: 60,
  },
  sports: {
    id: 'sports',
    label: 'Sports',
    description: 'Live sports monitoring layout',
    centerLayout: 'program-focus',
    defaultViewMode: 'program',
    defaultOperationsTab: 'health',
    defaultDockTab: 'replay',
    defaultNavItem: 'scenes',
    programFlexWeight: 70,
  },
  news: {
    id: 'news',
    label: 'News',
    description: 'Newsroom graphics and outputs',
    centerLayout: 'producer-dashboard',
    defaultViewMode: 'clean',
    defaultOperationsTab: 'outputs',
    defaultDockTab: 'graphics',
    defaultNavItem: 'graphics',
    programFlexWeight: 65,
  },
  replay: {
    id: 'replay',
    label: 'Replay',
    description: 'Replay operator workstation',
    centerLayout: 'replay-focus',
    defaultViewMode: 'program',
    defaultOperationsTab: 'preview',
    defaultDockTab: 'replay',
    defaultNavItem: 'replay',
    programFlexWeight: 60,
  },
  'remote-production': {
    id: 'remote-production',
    label: 'Remote Production',
    description: 'Distributed production monitoring',
    centerLayout: 'quad-view',
    defaultViewMode: 'confidence',
    defaultOperationsTab: 'health',
    defaultDockTab: 'logs',
    defaultNavItem: 'outputs',
    programFlexWeight: 55,
  },
  custom: {
    id: 'custom',
    label: 'Custom Workspace',
    description: 'Operator-defined layout baseline',
    centerLayout: 'program-focus',
    defaultViewMode: 'program',
    defaultOperationsTab: 'inspector',
    defaultDockTab: 'audio',
    defaultNavItem: 'scenes',
    programFlexWeight: 70,
  },
};

export const workspaceProfileList = Object.values(workspaceProfiles);

export const defaultWorkspaceId = workspaceProfiles.director.id;

const legacyPresetMap: Record<string, WorkspaceProfile['id']> = {
  default: 'director',
  broadcast: 'director',
  compact: 'custom',
  interview: 'interview',
  streaming: 'vertical-creator',
};

export function normalizeWorkspaceId(value: string | null | undefined): WorkspaceProfile['id'] {
  if (!value) return defaultWorkspaceId;
  if (value in workspaceProfiles) return value as WorkspaceProfile['id'];
  if (value in legacyPresetMap) return legacyPresetMap[value]!;
  return defaultWorkspaceId;
}
