/**
 * UBOS Container Engine — Step 79
 *
 * Packages UBOS engine stacks into portable, isolated, reproducible
 * containers. Each container holds a complete snapshot of engine state
 * and can be started, stopped, and migrated independently.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - container networking (virtual NICs between containers)
 *   - container routing graphs
 *   - container automation graphs
 *   - container replay pipelines
 *   - container graphics pipelines
 *   - container audio pipelines
 *   - container distribution endpoints
 *   - container orchestration clusters (Kubernetes-style)
 *   - AI-driven container optimization
 */

export type ContainerStatus = 'running' | 'stopped' | 'paused' | 'error';

export type Container = {
  id: number;
  name: string;
  engines: Record<string, unknown>;
  status: ContainerStatus;
  created: string;
  startedAt?: number;
  stoppedAt?: number;
};

export type EnginePayload = Record<string, unknown>;

export class ContainerEngine {
  private containers: Container[] = [];

  // ── Container lifecycle ───────────────────────────────────────────────────

  createContainer(name: string, engines: EnginePayload): Container {
    const container: Container = {
      id:        Date.now() + this.containers.length,
      name,
      engines:   JSON.parse(JSON.stringify(engines)),
      status:    'running',
      created:   new Date().toISOString(),
      startedAt: Date.now(),
    };
    this.containers.push(container);
    return container;
  }

  stopContainer(id: number): void {
    const c = this.containers.find((x) => x.id === id);
    if (c && c.status === 'running') {
      c.status    = 'stopped';
      c.stoppedAt = Date.now();
    }
  }

  startContainer(id: number): void {
    const c = this.containers.find((x) => x.id === id);
    if (c && c.status !== 'running') {
      c.status    = 'running';
      c.startedAt = Date.now();
      delete c.stoppedAt;
    }
  }

  pauseContainer(id: number): void {
    const c = this.containers.find((x) => x.id === id);
    if (c && c.status === 'running') c.status = 'paused';
  }

  deleteContainer(id: number): void {
    this.containers = this.containers.filter((c) => c.id !== id);
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  listContainers():  readonly Container[] { return this.containers; }
  getContainer(id: number): Container | undefined {
    return this.containers.find((c) => c.id === id);
  }
  getRunningContainers(): readonly Container[] {
    return this.containers.filter((c) => c.status === 'running');
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get containerCount():        number { return this.containers.length; }
  get runningContainerCount(): number { return this.containers.filter((c) => c.status === 'running').length; }
}
