/**
 * UBOS Persistence Engine — Step 72
 *
 * Stores, snapshots, and restores all UBOS engine states to provide
 * operational continuity, autosave, and rollback capability.
 *
 * This is a minimal in-memory engine. Later steps expand it into:
 *   - file-based persistence (IndexedDB / FileSystem API)
 *   - cloud persistence (S3, Supabase, Firestore)
 *   - multi-user shared persistence
 *   - versioned snapshot history with labels
 *   - rollback timeline
 *   - diff-based autosave
 *   - distributed cross-device sync
 */

export type PersistenceKey =
  | 'scenes'
  | 'graphics'
  | 'routing'
  | 'audio'
  | 'automation'
  | 'replay'
  | 'ai'
  | 'health';

export type PersistenceEntry = {
  data: unknown;
  savedAt: number;
  version: number;
};

export type PersistenceSnapshot = Record<string, PersistenceEntry>;

export class PersistenceEngine {
  private store: Map<string, PersistenceEntry> = new Map();
  private snapshotHistory: Array<{ label: string; snapshot: PersistenceSnapshot; createdAt: number }> = [];
  private readonly MAX_HISTORY = 10;

  // ── Save / Load ───────────────────────────────────────────────────────────

  save(key: PersistenceKey | string, value: unknown): void {
    const existing = this.store.get(key);
    const entry: PersistenceEntry = {
      data:    JSON.parse(JSON.stringify(value)),
      savedAt: Date.now(),
      version: (existing?.version ?? 0) + 1,
    };
    this.store.set(key, entry);
  }

  load(key: PersistenceKey | string): unknown {
    const entry = this.store.get(key);
    if (!entry) return null;
    return JSON.parse(JSON.stringify(entry.data));
  }

  has(key: PersistenceKey | string): boolean {
    return this.store.has(key);
  }

  getEntry(key: PersistenceKey | string): PersistenceEntry | undefined {
    return this.store.get(key);
  }

  // ── Snapshots ─────────────────────────────────────────────────────────────

  snapshot(label = 'auto'): PersistenceSnapshot {
    const snap: PersistenceSnapshot = {};
    for (const [key, entry] of this.store.entries()) {
      snap[key] = { ...entry, data: JSON.parse(JSON.stringify(entry.data)) };
    }
    // Keep rolling history
    this.snapshotHistory.push({ label, snapshot: snap, createdAt: Date.now() });
    if (this.snapshotHistory.length > this.MAX_HISTORY) {
      this.snapshotHistory.shift();
    }
    return snap;
  }

  restore(snap: PersistenceSnapshot): void {
    this.store.clear();
    for (const [key, entry] of Object.entries(snap)) {
      this.store.set(key, { ...entry, data: JSON.parse(JSON.stringify(entry.data)) });
    }
  }

  getSnapshotHistory(): readonly { label: string; createdAt: number }[] {
    return this.snapshotHistory.map(({ label, createdAt }) => ({ label, createdAt }));
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get savedKeys():     string[] { return [...this.store.keys()]; }
  get savedCount():    number   { return this.store.size; }
  get snapshotCount(): number   { return this.snapshotHistory.length; }
}
