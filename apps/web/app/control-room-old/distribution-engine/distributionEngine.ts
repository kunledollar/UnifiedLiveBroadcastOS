/**
 * UBOS Distribution Engine — Step 73
 *
 * The first external-facing engine. Manages output destinations and
 * distributes the program frame to multiple platforms simultaneously.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - RTMP / SRT / WebRTC live output
 *   - Multi-platform social streaming (YouTube, Twitch, Facebook, TikTok)
 *   - Cloud upload and CDN distribution
 *   - Replay clip distribution
 *   - Graphics distribution
 *   - AI-optimized adaptive bitrate
 *   - Distribution health graphs
 *   - Failover destination logic
 */

import type { OutputFrame } from '../output-engine/outputEngine';

export type DestinationType = 'rtmp' | 'srt' | 'webrtc' | 'file' | 'cloud' | 'ndi';

export type Destination = {
  id: string;
  name: string;
  type: DestinationType;
  endpoint: string;
  active: boolean;
  addedAt: number;
};

export type DistributionResult = {
  id: string;
  name: string;
  type: DestinationType;
  status: 'sent' | 'failed' | 'skipped';
  sentAt: number;
};

export class DistributionEngine {
  private destinations: Destination[] = [];
  private lastFrame: OutputFrame | null = null;
  private lastResults: DistributionResult[] = [];
  private framesSent = 0;

  // ── Destination management ────────────────────────────────────────────────

  registerDestination(dest: Omit<Destination, 'active' | 'addedAt'>): Destination {
    const full: Destination = { ...dest, active: true, addedAt: Date.now() };
    const existing = this.destinations.findIndex((d) => d.id === dest.id);
    if (existing >= 0) {
      this.destinations[existing] = full;
    } else {
      this.destinations.push(full);
    }
    return full;
  }

  removeDestination(id: string): void {
    this.destinations = this.destinations.filter((d) => d.id !== id);
  }

  toggleDestination(id: string): void {
    const dest = this.destinations.find((d) => d.id === id);
    if (dest) dest.active = !dest.active;
  }

  getDestinations(): readonly Destination[] {
    return this.destinations;
  }

  getActiveDestinations(): readonly Destination[] {
    return this.destinations.filter((d) => d.active);
  }

  // ── Distribution ──────────────────────────────────────────────────────────

  /**
   * Distribute a program output frame to all active destinations.
   * Returns a result per destination with send status.
   */
  distribute(frame: OutputFrame): DistributionResult[] {
    this.lastFrame = frame;
    this.framesSent++;

    this.lastResults = this.destinations.map((dest) => ({
      id:     dest.id,
      name:   dest.name,
      type:   dest.type,
      status: dest.active ? 'sent' : 'skipped',
      sentAt: Date.now(),
    }));

    return this.lastResults;
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  getLastFrame():   OutputFrame | null        { return this.lastFrame; }
  getLastResults(): readonly DistributionResult[] { return this.lastResults; }

  get destinationCount():       number { return this.destinations.length; }
  get activeDestinationCount(): number { return this.destinations.filter((d) => d.active).length; }
  get totalFramesSent():        number { return this.framesSent; }
}
