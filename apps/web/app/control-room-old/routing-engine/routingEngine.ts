/**
 * UBOS Routing Engine — Step 65
 *
 * Manages all signal paths in the production system: video, audio,
 * graphics, replay, and output routing. Every signal in UBOS flows
 * through this engine.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - multi-layer conditional routing
 *   - audio/video/graphics signal type separation
 *   - automation routing triggers
 *   - AI routing optimization
 *   - output delivery graph integration
 *   - failover routing
 */

export type RouteSignalType = 'video' | 'audio' | 'graphics' | 'replay' | 'data';

export type Route = {
  id: number;
  source: string;
  destination: string;
  signalType?: RouteSignalType;
  active: boolean;
  createdAt: number;
};

export class RoutingEngine {
  private routes: Route[] = [];

  // ── Route management ──────────────────────────────────────────────────────

  addRoute(
    source: string,
    destination: string,
    signalType?: RouteSignalType,
  ): Route {
    const route: Route = {
      id: Date.now(),
      source,
      destination,
      active: true,
      createdAt: Date.now(),
      ...(signalType !== undefined ? { signalType } : {}),
    };
    this.routes.push(route);
    return route;
  }

  removeRoute(id: number): void {
    this.routes = this.routes.filter((r) => r.id !== id);
  }

  toggleRoute(id: number): void {
    const route = this.routes.find((r) => r.id === id);
    if (route) route.active = !route.active;
  }

  getRoutes(): readonly Route[] {
    return this.routes;
  }

  getActiveRoutes(): readonly Route[] {
    return this.routes.filter((r) => r.active);
  }

  // ── Signal path queries ───────────────────────────────────────────────────

  getDestinationsForSource(source: string): string[] {
    return this.routes
      .filter((r) => r.source === source && r.active)
      .map((r) => r.destination);
  }

  getSourcesForDestination(destination: string): string[] {
    return this.routes
      .filter((r) => r.destination === destination && r.active)
      .map((r) => r.source);
  }

  hasRoute(source: string, destination: string): boolean {
    return this.routes.some(
      (r) => r.source === source && r.destination === destination,
    );
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get routeCount():       number { return this.routes.length; }
  get activeRouteCount(): number { return this.routes.filter((r) => r.active).length; }
}
