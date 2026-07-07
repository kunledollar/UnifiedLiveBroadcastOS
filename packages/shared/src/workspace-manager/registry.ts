/**
 * Panel registration API for the UBOS 3.15 Workspace Manager.
 *
 * The registry stores layout metadata only. Panel definitions are validated
 * on registration to guarantee they are plain, serializable descriptions:
 * no runtime media objects, functions, DOM nodes, or React elements may be
 * stored here. Existing Control Room components stay untouched — this layer
 * merely records where their (future) DockablePanel wrappers should live.
 */
import type {
  WorkspacePanelDefinition,
  WorkspacePanelState,
  WorkspaceValidationIssue,
  WorkspaceZoneId,
} from './types.js';
import { WORKSPACE_PANEL_KINDS, WORKSPACE_ZONE_IDS } from './types.js';

const zoneIdSet = new Set<string>(WORKSPACE_ZONE_IDS);
const kindSet = new Set<string>(WORKSPACE_PANEL_KINDS);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Reject values that look like runtime objects. Only JSON-compatible
 * primitives, arrays, and plain objects are allowed inside a definition.
 */
const isPlainSerializable = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  const kind = typeof value;
  if (kind === 'string' || kind === 'boolean') return true;
  if (kind === 'number') return Number.isFinite(value as number);
  if (kind === 'function' || kind === 'symbol' || kind === 'bigint') return false;
  if (Array.isArray(value)) return value.every(isPlainSerializable);
  if (kind === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) return false;
    return Object.values(value as Record<string, unknown>).every(isPlainSerializable);
  }
  return false;
};

/** Validate a panel definition. Returns an empty array when valid. */
export function validatePanelDefinition(panel: WorkspacePanelDefinition): WorkspaceValidationIssue[] {
  const issues: WorkspaceValidationIssue[] = [];
  const subject = typeof panel?.id === 'string' ? panel.id : '<unknown>';
  const issue = (code: string, message: string) => issues.push({ code, message, subject });

  if (!isNonEmptyString(panel?.id)) issue('PANEL_ID_REQUIRED', 'Panel id must be a non-empty string');
  if (!isNonEmptyString(panel?.title)) issue('PANEL_TITLE_REQUIRED', 'Panel title must be a non-empty string');
  if (!kindSet.has(panel?.kind)) issue('PANEL_KIND_INVALID', `Unknown panel kind: ${String(panel?.kind)}`);
  if (!zoneIdSet.has(panel?.defaultZone)) issue('PANEL_DEFAULT_ZONE_INVALID', `Unknown default zone: ${String(panel?.defaultZone)}`);

  if (!Array.isArray(panel?.allowedZones) || panel.allowedZones.length === 0) {
    issue('PANEL_ALLOWED_ZONES_REQUIRED', 'allowedZones must be a non-empty array');
  } else {
    for (const zone of panel.allowedZones) {
      if (!zoneIdSet.has(zone)) issue('PANEL_ALLOWED_ZONE_INVALID', `Unknown allowed zone: ${String(zone)}`);
    }
    if (zoneIdSet.has(panel?.defaultZone) && !panel.allowedZones.includes(panel.defaultZone)) {
      issue('PANEL_DEFAULT_ZONE_NOT_ALLOWED', 'defaultZone must be included in allowedZones');
    }
  }

  for (const key of ['defaultVisible', 'defaultCollapsed', 'closable', 'collapsible', 'dockable'] as const) {
    if (typeof panel?.[key] !== 'boolean') issue('PANEL_FLAG_INVALID', `${key} must be a boolean`);
  }
  if (!isFiniteNumber(panel?.priority)) issue('PANEL_PRIORITY_INVALID', 'priority must be a finite number');
  for (const key of ['minWidth', 'minHeight'] as const) {
    if (!isFiniteNumber(panel?.[key]) || panel[key] < 0) issue('PANEL_MIN_SIZE_INVALID', `${key} must be a non-negative number`);
  }
  for (const key of ['preferredWidth', 'preferredHeight'] as const) {
    const value = panel?.[key];
    if (value !== undefined && (!isFiniteNumber(value) || value < 0)) {
      issue('PANEL_PREFERRED_SIZE_INVALID', `${key} must be a non-negative number when provided`);
    }
  }
  if (panel?.defaultCollapsed === true && panel?.collapsible === false) {
    issue('PANEL_COLLAPSE_CONFLICT', 'A non-collapsible panel cannot default to collapsed');
  }
  if (!isPlainSerializable(panel)) {
    issue('PANEL_NOT_SERIALIZABLE', 'Panel definitions must be plain serializable metadata (no runtime objects, functions, or class instances)');
  }
  return issues;
}

/**
 * Holds panel definitions plus their mutable layout state. Instantiable so
 * tests can run isolated registries; a module-level default instance backs
 * the free-function API below.
 */
export class WorkspacePanelRegistry {
  private readonly definitions = new Map<string, WorkspacePanelDefinition>();
  private readonly states = new Map<string, WorkspacePanelState>();

  registerPanel(panel: WorkspacePanelDefinition): void {
    const issues = validatePanelDefinition(panel);
    if (issues.length > 0) {
      throw new Error(`Invalid panel definition "${String(panel?.id)}": ${issues.map((i) => i.message).join('; ')}`);
    }
    if (this.definitions.has(panel.id)) {
      throw new Error(`Panel "${panel.id}" is already registered`);
    }
    // Freeze a deep copy so callers cannot mutate registered metadata later.
    const frozen = Object.freeze(JSON.parse(JSON.stringify(panel)) as WorkspacePanelDefinition);
    this.definitions.set(panel.id, frozen);
    this.states.set(panel.id, {
      panelId: panel.id,
      zone: panel.defaultZone,
      visible: panel.defaultVisible,
      collapsed: panel.defaultCollapsed,
    });
  }

  unregisterPanel(panelId: string): void {
    this.definitions.delete(panelId);
    this.states.delete(panelId);
  }

  getPanel(panelId: string): WorkspacePanelDefinition | undefined {
    return this.definitions.get(panelId);
  }

  getPanelState(panelId: string): WorkspacePanelState | undefined {
    const state = this.states.get(panelId);
    return state ? { ...state } : undefined;
  }

  getAllPanels(): WorkspacePanelDefinition[] {
    return [...this.definitions.values()].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  }

  /** Panels currently assigned to a zone, ordered by descending priority. */
  getPanelsForZone(zoneId: WorkspaceZoneId): WorkspacePanelDefinition[] {
    return this.getAllPanels().filter((panel) => this.states.get(panel.id)?.zone === zoneId);
  }

  togglePanelVisibility(panelId: string): void {
    const definition = this.requireDefinition(panelId);
    const state = this.requireState(panelId);
    if (state.visible && !definition.closable) {
      throw new Error(`Panel "${panelId}" is not closable`);
    }
    state.visible = !state.visible;
  }

  togglePanelCollapsed(panelId: string): void {
    const definition = this.requireDefinition(panelId);
    const state = this.requireState(panelId);
    if (!definition.collapsible) {
      throw new Error(`Panel "${panelId}" is not collapsible`);
    }
    state.collapsed = !state.collapsed;
  }

  movePanelToZone(panelId: string, zoneId: WorkspaceZoneId): void {
    const definition = this.requireDefinition(panelId);
    const state = this.requireState(panelId);
    if (!definition.dockable && zoneId !== definition.defaultZone) {
      throw new Error(`Panel "${panelId}" is not dockable`);
    }
    if (!definition.allowedZones.includes(zoneId)) {
      throw new Error(`Panel "${panelId}" cannot be placed in zone "${zoneId}" (allowed: ${definition.allowedZones.join(', ')})`);
    }
    state.zone = zoneId;
  }

  /** Snapshot of every panel's mutable layout state (copies, metadata only). */
  getPanelStates(): WorkspacePanelState[] {
    return [...this.states.values()].map((state) => ({ ...state }));
  }

  /** Restore previously persisted panel states. Unknown panels are skipped. */
  restorePanelStates(panelStates: WorkspacePanelState[]): void {
    for (const incoming of panelStates) {
      const definition = this.definitions.get(incoming.panelId);
      const state = this.states.get(incoming.panelId);
      if (!definition || !state) continue;
      if (definition.allowedZones.includes(incoming.zone)) state.zone = incoming.zone;
      state.visible = definition.closable ? Boolean(incoming.visible) : true;
      state.collapsed = definition.collapsible ? Boolean(incoming.collapsed) : false;
    }
  }

  reset(): void {
    this.definitions.clear();
    this.states.clear();
  }

  private requireDefinition(panelId: string): WorkspacePanelDefinition {
    const definition = this.definitions.get(panelId);
    if (!definition) throw new Error(`Panel "${panelId}" is not registered`);
    return definition;
  }

  private requireState(panelId: string): WorkspacePanelState {
    const state = this.states.get(panelId);
    if (!state) throw new Error(`Panel "${panelId}" has no layout state`);
    return state;
  }
}

/** Default shared registry backing the free-function API. */
export const workspacePanelRegistry = new WorkspacePanelRegistry();

export function registerPanel(panel: WorkspacePanelDefinition): void {
  workspacePanelRegistry.registerPanel(panel);
}

export function getPanel(panelId: string): WorkspacePanelDefinition | undefined {
  return workspacePanelRegistry.getPanel(panelId);
}

export function getPanelsForZone(zoneId: WorkspaceZoneId): WorkspacePanelDefinition[] {
  return workspacePanelRegistry.getPanelsForZone(zoneId);
}

export function togglePanelVisibility(panelId: string): void {
  workspacePanelRegistry.togglePanelVisibility(panelId);
}

export function togglePanelCollapsed(panelId: string): void {
  workspacePanelRegistry.togglePanelCollapsed(panelId);
}

export function movePanelToZone(panelId: string, zoneId: WorkspaceZoneId): void {
  workspacePanelRegistry.movePanelToZone(panelId, zoneId);
}
