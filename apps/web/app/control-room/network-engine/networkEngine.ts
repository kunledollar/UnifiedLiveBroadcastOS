/**
 * UBOS Network Engine — Step 76
 *
 * Real-time distributed synchronization engine. Maintains WebSocket
 * connections to sync engine state across multiple operators, workspaces,
 * and machines.
 *
 * SSR-safe: WebSocket is only instantiated in browser environments.
 * All browser checks guard against Node.js execution.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - distributed orchestration
 *   - multi-node engine sync (CRDT / OT)
 *   - delta-based state diff sync (not full snapshots)
 *   - operator locking + conflict resolution
 *   - network topology graphs
 *   - AI-driven network optimization
 *   - reconnection + exponential backoff
 */

export type NetworkState = Record<string, unknown>;

export type NetworkMessage = {
  type: 'state_update' | 'heartbeat' | 'operator_join' | 'operator_leave';
  timestamp: number;
  payload?: NetworkState;
};

export type NetworkHealth = {
  connected: boolean;
  latency: number;
  lastSync: number | null;
  reconnectCount: number;
  url: string | null;
};

export type StateUpdateHandler = (state: NetworkState) => void;

export class NetworkEngine {
  private socket:          WebSocket | null = null;
  private connected:       boolean = false;
  private latency:         number = 0;
  private lastSync:        number | null = null;
  private reconnectCount:  number = 0;
  private url:             string | null = null;

  /** Called when a remote state_update message is received. */
  onStateUpdate?: StateUpdateHandler;

  // ── Connection lifecycle ──────────────────────────────────────────────────

  connect(url: string): void {
    if (typeof WebSocket === 'undefined') return; // SSR guard
    if (this.socket?.readyState === WebSocket.OPEN) return; // already connected

    this.url = url;
    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.connected   = true;
        this.lastSync    = Date.now();
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const msg: NetworkMessage = JSON.parse(event.data as string);
          this.lastSync = Date.now();
          if (msg.timestamp) {
            this.latency = Date.now() - msg.timestamp;
          }
          if (msg.type === 'state_update' && msg.payload) {
            this.onStateUpdate?.(msg.payload);
          }
        } catch {
          // Malformed message — ignore
        }
      };

      this.socket.onclose = () => {
        this.connected = false;
      };

      this.socket.onerror = () => {
        this.connected = false;
        this.reconnectCount++;
      };

    } catch {
      // WebSocket construction failed (e.g. invalid URL in dev)
      this.connected = false;
    }
  }

  disconnect(): void {
    this.socket?.close();
    this.socket    = null;
    this.connected = false;
  }

  // ── State broadcast ───────────────────────────────────────────────────────

  sendState(state: NetworkState): void {
    if (!this.connected || !this.socket) return;
    const msg: NetworkMessage = {
      type:      'state_update',
      timestamp: Date.now(),
      payload:   state,
    };
    try {
      this.socket.send(JSON.stringify(msg));
    } catch {
      this.connected = false;
    }
  }

  sendHeartbeat(): void {
    if (!this.connected || !this.socket) return;
    const msg: NetworkMessage = { type: 'heartbeat', timestamp: Date.now() };
    try {
      this.socket.send(JSON.stringify(msg));
    } catch {
      this.connected = false;
    }
  }

  // ── Health ────────────────────────────────────────────────────────────────

  getHealth(): NetworkHealth {
    return {
      connected:      this.connected,
      latency:        this.latency,
      lastSync:       this.lastSync,
      reconnectCount: this.reconnectCount,
      url:            this.url,
    };
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get isConnected():   boolean { return this.connected; }
  get currentLatency(): number { return this.latency; }
}
