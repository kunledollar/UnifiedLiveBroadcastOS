export enum EcosystemArea {
  Documentation = 'documentation',
  Training = 'training',
  Simulation = 'simulation',
  Certification = 'certification',
  PartnerProgram = 'partner-program',
  Examples = 'examples',
}

export enum PublicationState {
  Draft = 'draft',
  Review = 'review',
  Published = 'published',
  Immutable = 'immutable',
}

export enum LabIsolationMode {
  SyntheticOnly = 'synthetic-only',
  TenantSandbox = 'tenant-sandbox',
  OfflineReplay = 'offline-replay',
}

export interface VersionedArtifact {
  readonly id: string;
  readonly title: string;
  readonly area: EcosystemArea;
  readonly version: string;
  readonly state: PublicationState;
  readonly owner: string;
  readonly prerequisites: readonly string[];
  readonly metadata: Readonly<Record<string, string>>;
}

export interface Tutorial extends VersionedArtifact {
  readonly estimatedMinutes: number;
  readonly steps: readonly string[];
}

export interface SimulationLab extends VersionedArtifact {
  readonly scenario: string;
  readonly isolationMode: LabIsolationMode;
  readonly syntheticDataOnly: boolean;
  readonly failureInjectors: readonly string[];
}

export interface CertificationTrack extends VersionedArtifact {
  readonly level: 'associate' | 'professional' | 'expert' | 'architect' | 'instructor';
  readonly practicalAssessments: readonly string[];
  readonly renewalMonths: number;
}

export interface PartnerTrack extends VersionedArtifact {
  readonly tier: 'registered' | 'silver' | 'gold' | 'platinum' | 'strategic';
  readonly requiredCertifications: readonly string[];
  readonly hardwareValidationRequired: boolean;
}

export interface EcosystemSnapshot {
  readonly version: string;
  readonly artifacts: readonly VersionedArtifact[];
  readonly tutorials: readonly Tutorial[];
  readonly labs: readonly SimulationLab[];
  readonly certifications: readonly CertificationTrack[];
  readonly partners: readonly PartnerTrack[];
  readonly securityInvariants: readonly string[];
  readonly validationResults: readonly string[];
}

const stableSort = <T extends { readonly id: string }>(items: readonly T[]): readonly T[] =>
  [...items].sort((a, b) => a.id.localeCompare(b.id));

export class PlatformEcosystemRegistry {
  private readonly artifacts = new Map<string, VersionedArtifact>();
  private readonly tutorials = new Map<string, Tutorial>();
  private readonly labs = new Map<string, SimulationLab>();
  private readonly certifications = new Map<string, CertificationTrack>();
  private readonly partners = new Map<string, PartnerTrack>();

  constructor(private readonly version: string) {}

  registerArtifact(artifact: VersionedArtifact): void {
    this.assertVersion(artifact);
    this.artifacts.set(artifact.id, Object.freeze({ ...artifact, prerequisites: [...artifact.prerequisites], metadata: { ...artifact.metadata } }));
  }

  registerTutorial(tutorial: Tutorial): void {
    this.registerArtifact(tutorial);
    this.tutorials.set(tutorial.id, Object.freeze({ ...tutorial, prerequisites: [...tutorial.prerequisites], steps: [...tutorial.steps], metadata: { ...tutorial.metadata } }));
  }

  registerLab(lab: SimulationLab): void {
    this.assertVersion(lab);
    if (!lab.syntheticDataOnly || lab.isolationMode === undefined) {
      throw new Error('Simulation labs must be isolated and synthetic-data only.');
    }
    this.registerArtifact(lab);
    this.labs.set(lab.id, Object.freeze({ ...lab, prerequisites: [...lab.prerequisites], failureInjectors: [...lab.failureInjectors], metadata: { ...lab.metadata } }));
  }

  registerCertification(track: CertificationTrack): void {
    this.registerArtifact(track);
    this.certifications.set(track.id, Object.freeze({ ...track, prerequisites: [...track.prerequisites], practicalAssessments: [...track.practicalAssessments], metadata: { ...track.metadata } }));
  }

  registerPartnerTrack(track: PartnerTrack): void {
    this.registerArtifact(track);
    this.partners.set(track.id, Object.freeze({ ...track, prerequisites: [...track.prerequisites], requiredCertifications: [...track.requiredCertifications], metadata: { ...track.metadata } }));
  }

  snapshot(): EcosystemSnapshot {
    return Object.freeze({
      version: this.version,
      artifacts: stableSort([...this.artifacts.values()]),
      tutorials: stableSort([...this.tutorials.values()]),
      labs: stableSort([...this.labs.values()]),
      certifications: stableSort([...this.certifications.values()]),
      partners: stableSort([...this.partners.values()]),
      securityInvariants: Object.freeze([
        'training environments never affect production',
        'simulation labs remain isolated from live infrastructure',
        'certification results are tamper-resistant',
        'partner approvals are auditable',
        'published documentation versions are immutable',
        'community contributions require review before publication',
      ]),
      validationResults: Object.freeze([]),
    });
  }

  private assertVersion(artifact: VersionedArtifact): void {
    if (artifact.version !== this.version) {
      throw new Error(`Artifact ${artifact.id} targets ${artifact.version}; expected ${this.version}.`);
    }
  }
}

export interface EcosystemValidationResult {
  readonly pass: boolean;
  readonly checks: readonly string[];
}

export function validateEcosystemSnapshot(snapshot: EcosystemSnapshot): EcosystemValidationResult {
  const checks = [
    snapshot.artifacts.length >= 6 ? 'documentation and ecosystem areas registered' : 'missing ecosystem areas',
    snapshot.tutorials.length > 0 ? 'tutorial learning path registered' : 'missing tutorial',
    snapshot.labs.every((lab) => lab.syntheticDataOnly && lab.isolationMode !== undefined) ? 'simulation labs isolated' : 'simulation lab isolation failure',
    snapshot.certifications.every((track) => track.practicalAssessments.length > 0 && track.renewalMonths > 0) ? 'certification renewal and practical assessment registered' : 'certification requirement failure',
    snapshot.partners.every((track) => track.requiredCertifications.length > 0) ? 'partner requirements registered' : 'partner requirement failure',
    snapshot.securityInvariants.length === 6 ? 'security invariants documented' : 'security invariant mismatch',
  ];
  return Object.freeze({ pass: checks.every((check) => !check.includes('missing') && !check.includes('failure') && !check.includes('mismatch')), checks });
}

export function validateEcosystemRegistry(registry: PlatformEcosystemRegistry): EcosystemValidationResult {
  const snapshot = registry.snapshot();
  const result = validateEcosystemSnapshot({ ...snapshot, validationResults: [] });
  return result;
}

export function createDefaultV511EcosystemRegistry(): PlatformEcosystemRegistry {
  const registry = new PlatformEcosystemRegistry('v5.11');
  registry.registerArtifact({ id: 'docs.portal', title: 'Versioned documentation portal', area: EcosystemArea.Documentation, version: 'v5.11', state: PublicationState.Published, owner: 'developer-experience', prerequisites: ['v5.11.9'], metadata: { searchable: 'true', offline: 'true', aiReady: 'true' } });
  registry.registerTutorial({ id: 'tutorial.first-plugin', title: 'Build your first production-safe plugin', area: EcosystemArea.Training, version: 'v5.11', state: PublicationState.Published, owner: 'training', prerequisites: ['docs.portal'], metadata: { difficulty: 'beginner' }, estimatedMinutes: 45, steps: ['create manifest', 'declare capabilities', 'validate sandbox', 'publish review package'] });
  registry.registerLab({ id: 'lab.encoder-failure', title: 'Recover from encoder failure', area: EcosystemArea.Simulation, version: 'v5.11', state: PublicationState.Published, owner: 'simulation', prerequisites: ['tutorial.first-plugin'], metadata: { scenario: 'incident-response' }, scenario: 'encoder failure with Program preservation', isolationMode: LabIsolationMode.SyntheticOnly, syntheticDataOnly: true, failureInjectors: ['encoder-failure', 'network-latency', 'storage-exhaustion'] });
  registry.registerCertification({ id: 'cert.operator.associate', title: 'UBOS Certified Operator Associate', area: EcosystemArea.Certification, version: 'v5.11', state: PublicationState.Published, owner: 'certification', prerequisites: ['lab.encoder-failure'], metadata: { credential: 'verifiable' }, level: 'associate', practicalAssessments: ['recover encoder failure', 'document incident'], renewalMonths: 24 });
  registry.registerPartnerTrack({ id: 'partner.hardware.registered', title: 'Registered hardware partner', area: EcosystemArea.PartnerProgram, version: 'v5.11', state: PublicationState.Published, owner: 'partner-program', prerequisites: ['cert.operator.associate'], metadata: { audit: 'required' }, tier: 'registered', requiredCertifications: ['cert.operator.associate'], hardwareValidationRequired: true });
  registry.registerArtifact({ id: 'examples.starter-projects', title: 'Production-safe starter projects', area: EcosystemArea.Examples, version: 'v5.11', state: PublicationState.Published, owner: 'developer-experience', prerequisites: ['docs.portal'], metadata: { templates: 'plugin,device-driver,ai-assistant' } });
  return registry;
}
