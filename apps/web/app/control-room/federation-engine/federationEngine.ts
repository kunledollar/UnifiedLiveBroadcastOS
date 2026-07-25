/**
 * UBOS Federation Engine — Step 80
 *
 * Connects multiple UBOS clusters, containers, and virtual environments
 * into a unified broadcast super-network. Manages cluster registration,
 * federation links, and global topology health.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - multi-region federation with latency-aware routing
 *   - cross-cloud federation (AWS ↔ GCP ↔ Azure ↔ Cloudflare)
 *   - federated routing graphs
 *   - federated automation graphs
 *   - federated replay pipelines
 *   - federated graphics / audio / distribution pipelines
 *   - AI-driven federation optimization
 *   - federation failover and self-healing
 */

export type ClusterStatus = 'online' | 'degraded' | 'offline';

export type FederatedCluster = {
  id: string | number;
  name: string;
  region: string;
  status: ClusterStatus;
  containers: unknown[];
  registeredAt: string;
};

export type FederationLink = {
  id: number;
  from: string | number;
  to: string | number;
  latencyMs?: number;
  created: string;
};

export type FederationHealth = {
  clusters: number;
  links: number;
  onlineClusters: number;
  status: 'stable' | 'degraded' | 'critical';
};

export class FederationEngine {
  private clusters: FederatedCluster[] = [];
  private links:    FederationLink[] = [];

  // ── Cluster management ────────────────────────────────────────────────────

  registerCluster(cluster: Omit<FederatedCluster, 'status' | 'registeredAt'>): FederatedCluster {
    const full: FederatedCluster = {
      ...cluster,
      containers:   cluster.containers ?? [],
      status:       'online',
      registeredAt: new Date().toISOString(),
    };
    const existing = this.clusters.findIndex((c) => c.id === cluster.id);
    if (existing >= 0) {
      this.clusters[existing] = full;
    } else {
      this.clusters.push(full);
    }
    return full;
  }

  setClusterStatus(id: string | number, status: ClusterStatus): void {
    const cluster = this.clusters.find((c) => c.id === id);
    if (cluster) cluster.status = status;
  }

  removeCluster(id: string | number): void {
    this.clusters = this.clusters.filter((c) => c.id !== id);
    this.links    = this.links.filter((l) => l.from !== id && l.to !== id);
  }

  getClusters(): readonly FederatedCluster[] { return this.clusters; }

  // ── Link management ───────────────────────────────────────────────────────

  linkClusters(from: string | number, to: string | number, latencyMs?: number): FederationLink {
    const link: FederationLink = {
      id:      Date.now() + this.links.length,
      from,
      to,
      created: new Date().toISOString(),
      ...(latencyMs !== undefined ? { latencyMs } : {}),
    };
    this.links.push(link);
    return link;
  }

  removeLink(id: number): void {
    this.links = this.links.filter((l) => l.id !== id);
  }

  getLinks(): readonly FederationLink[] { return this.links; }

  // ── Health ────────────────────────────────────────────────────────────────

  getFederationHealth(): FederationHealth {
    const online = this.clusters.filter((c) => c.status === 'online').length;
    const status: FederationHealth['status'] =
      this.clusters.length === 0 ? 'stable'
      : online === 0              ? 'critical'
      : online < this.clusters.length ? 'degraded'
      : 'stable';

    return {
      clusters:       this.clusters.length,
      links:          this.links.length,
      onlineClusters: online,
      status,
    };
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get clusterCount(): number { return this.clusters.length; }
  get linkCount():    number { return this.links.length; }
}
