import type { ProductionGraph, SourceNode } from '../../../shared/src/production-graph.js';

export type CompositionSourceType = SourceNode['type'] | 'image' | 'video' | 'background';
export type CompositionFitMode = 'contain' | 'cover' | 'stretch' | 'fill';
export type CompositionLayoutPreset =
  | 'fullscreen'
  | 'side_by_side'
  | 'picture_in_picture'
  | 'two_by_two_grid'
  | 'speaker_focus'
  | 'vertical_fullscreen'
  | 'vertical_split'
  | 'multiview_grid';
export type CompositionRenderTarget = 'program' | 'preview' | 'vertical' | 'multiview' | 'recording' | 'output';

export interface CompositionBounds { readonly x: number; readonly y: number; readonly width: number; readonly height: number; }
export interface CompositionCrop { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number; }
export interface CompositionTransform extends CompositionBounds { readonly scaleX: number; readonly scaleY: number; readonly rotation: number; readonly anchorX: number; readonly anchorY: number; readonly fitMode: CompositionFitMode; readonly mirrorX: boolean; readonly mirrorY: boolean; }
export interface CompositionStyle { readonly borderRadius?: number; readonly borderColor?: string; readonly borderWidth?: number; readonly shadow?: boolean; readonly blendMode?: string; }
export interface CompositionSafeArea { readonly id: string; readonly label: string; readonly bounds: CompositionBounds; readonly metadata: Record<string, unknown>; }
export interface CompositionCanvas { readonly width: number; readonly height: number; readonly aspectRatio: string; readonly fps: number; readonly pixelAspectRatio: number; readonly colorSpace?: string; readonly backgroundColor: string; readonly safeArea: CompositionSafeArea; }
export interface CompositionSource { readonly id: string; readonly type: CompositionSourceType; readonly label: string; readonly runtimeSourceId?: string; readonly metadata: Record<string, unknown>; }
export interface CompositionLayer { readonly id: string; readonly sourceId: string; readonly sourceType: CompositionSourceType; readonly label: string; readonly zIndex: number; readonly visible: boolean; readonly opacity: number; readonly bounds: CompositionBounds; readonly crop: CompositionCrop; readonly transform: CompositionTransform; readonly style: CompositionStyle; readonly audioIncluded?: boolean; readonly metadata: Record<string, unknown>; }
export interface CompositionOverlay { readonly id: string; readonly label: string; readonly visible: boolean; readonly sourceId?: string; readonly bounds?: CompositionBounds; readonly metadata: Record<string, unknown>; }
export interface CompositionBackground { readonly type: 'color' | 'source' | 'transparent'; readonly color?: string; readonly sourceId?: string; readonly metadata: Record<string, unknown>; }
export interface SceneComposition { readonly id: string; readonly sceneId: string; readonly graphRevision: number; readonly canvas: CompositionCanvas; readonly background: CompositionBackground; readonly layers: readonly CompositionLayer[]; readonly overlays: readonly CompositionOverlay[]; readonly safeAreas: readonly CompositionSafeArea[]; readonly renderTargets: readonly CompositionRenderTarget[]; readonly metadata: Record<string, unknown>; }
export interface SceneCompositionOptions { readonly target?: CompositionRenderTarget; readonly layoutPreset?: CompositionLayoutPreset; readonly canvas?: Partial<CompositionCanvas>; readonly renderTargets?: readonly CompositionRenderTarget[]; readonly runtimeSourceIds?: ReadonlySet<string> | readonly string[]; }
export interface CompositionValidationIssue { readonly code: string; readonly message: string; readonly layerId?: string; readonly severity: 'warning' | 'error'; }

const cropNone: CompositionCrop = Object.freeze({ top: 0, right: 0, bottom: 0, left: 0 });
export function createDefaultCanvas(overrides: Partial<CompositionCanvas> = {}): CompositionCanvas {
  const width = overrides.width ?? 1920;
  const height = overrides.height ?? 1080;
  const safeArea: CompositionSafeArea = overrides.safeArea ?? { id: 'title-safe', label: 'Title Safe', bounds: { x: width * 0.05, y: height * 0.05, width: width * 0.9, height: height * 0.9 }, metadata: { marginPercent: 5 } };
  return { width, height, aspectRatio: overrides.aspectRatio ?? (width === 1920 && height === 1080 ? '16:9' : `${width}:${height}`), fps: overrides.fps ?? 60, pixelAspectRatio: overrides.pixelAspectRatio ?? 1, ...(overrides.colorSpace ? { colorSpace: overrides.colorSpace } : {}), backgroundColor: overrides.backgroundColor ?? '#000000', safeArea };
}
function transform(bounds: CompositionBounds, fitMode: CompositionFitMode = 'cover'): CompositionTransform { return { ...bounds, scaleX: 1, scaleY: 1, rotation: 0, anchorX: 0.5, anchorY: 0.5, fitMode, mirrorX: false, mirrorY: false }; }
export function getLayoutBounds(preset: CompositionLayoutPreset, index: number, count: number, canvas: CompositionCanvas): CompositionBounds {
  const w = canvas.width, h = canvas.height;
  if (preset === 'vertical_fullscreen') return { x: 0, y: 0, width: w, height: h };
  if (preset === 'vertical_split') return { x: 0, y: index * (h / Math.max(count, 1)), width: w, height: h / Math.max(count, 1) };
  if (preset === 'side_by_side') return { x: index * (w / Math.min(count, 2)), y: 0, width: w / Math.min(count, 2), height: h };
  if (preset === 'picture_in_picture') return index === 0 ? { x: 0, y: 0, width: w, height: h } : { x: w * 0.68, y: h * 0.62, width: w * 0.28, height: h * 0.28 };
  if (preset === 'two_by_two_grid' || preset === 'multiview_grid') { const cols = preset === 'two_by_two_grid' ? 2 : Math.ceil(Math.sqrt(Math.max(count, 1))); const rows = Math.ceil(Math.max(count, 1) / cols); return { x: (index % cols) * (w / cols), y: Math.floor(index / cols) * (h / rows), width: w / cols, height: h / rows }; }
  if (preset === 'speaker_focus') return index === 0 ? { x: 0, y: 0, width: w * 0.72, height: h } : { x: w * 0.74, y: (index - 1) * (h * 0.25), width: w * 0.26, height: h * 0.24 };
  return { x: 0, y: 0, width: w, height: h };
}
function normalizePreset(value: unknown, canvas: CompositionCanvas): CompositionLayoutPreset { const text = String(value ?? '').replace('full_screen', 'fullscreen'); const allowed: CompositionLayoutPreset[] = ['fullscreen','side_by_side','picture_in_picture','two_by_two_grid','speaker_focus','vertical_fullscreen','vertical_split','multiview_grid']; if (allowed.includes(text as CompositionLayoutPreset)) return text as CompositionLayoutPreset; return canvas.height > canvas.width ? 'vertical_fullscreen' : 'fullscreen'; }
export function createSceneCompositionFromGraph(graph: ProductionGraph, sceneId: string, options: SceneCompositionOptions = {}): SceneComposition {
  const scene = graph.scenes[sceneId];
  const baseCanvas = createDefaultCanvas(options.canvas);
  const preset = normalizePreset(options.layoutPreset ?? scene?.metadata.layoutPreset ?? graph.workspace.selectedPreset, baseCanvas);
  const sourceIds = scene?.sourceIds ?? [];
  const layers = sourceIds.map((sourceId, index) => {
    const source = graph.sources[sourceId]; const bounds = getLayoutBounds(preset, index, sourceIds.length, baseCanvas);
    return { id: `layer:${sceneId}:${sourceId}`, sourceId, sourceType: source?.type ?? 'placeholder', label: source?.name ?? `Missing source ${sourceId}`, zIndex: index, visible: source?.enabled ?? false, opacity: Number(source?.metadata.opacity ?? 1), bounds, crop: cropNone, transform: transform(bounds), style: {}, audioIncluded: source?.type === 'audio' || source?.muted === false, metadata: { ...(source?.metadata ?? {}), missingSource: !source } } satisfies CompositionLayer;
  }).sort((a,b)=>a.zIndex-b.zIndex || a.id.localeCompare(b.id));
  const overlays = (scene?.overlayIds ?? []).map((id) => { const overlay = graph.overlays[id]; return { id, label: overlay?.name ?? id, visible: overlay?.enabled ?? false, ...(overlay?.sourceId ? { sourceId: overlay.sourceId } : {}), metadata: overlay?.metadata ?? {} }; });
  return { id: `composition:${sceneId}:${graph.metadata.revision}:${options.target ?? 'program'}`, sceneId, graphRevision: graph.metadata.revision, canvas: baseCanvas, background: { type: 'color', color: baseCanvas.backgroundColor, metadata: {} }, layers, overlays, safeAreas: [baseCanvas.safeArea], renderTargets: options.renderTargets ?? [options.target ?? 'program'], metadata: { layoutPreset: preset, sceneMissing: !scene } };
}
export function validateCanvas(canvas: CompositionCanvas): CompositionValidationIssue[] { return canvas.width <= 0 || canvas.height <= 0 || canvas.fps <= 0 ? [{ code: 'INVALID_CANVAS', message: 'Canvas dimensions and fps must be positive', severity: 'error' }] : []; }
export function validateLayerBounds(layer: CompositionLayer, canvas?: CompositionCanvas): CompositionValidationIssue[] { const issues: CompositionValidationIssue[] = []; if (layer.bounds.width <= 0 || layer.bounds.height <= 0) issues.push({ code: 'ZERO_SIZE_LAYER', message: 'Layer has zero or negative size', layerId: layer.id, severity: 'warning' }); if (canvas && (layer.bounds.x < 0 || layer.bounds.y < 0 || layer.bounds.x + layer.bounds.width > canvas.width || layer.bounds.y + layer.bounds.height > canvas.height)) issues.push({ code: 'LAYER_OUTSIDE_CANVAS', message: 'Layer extends outside canvas', layerId: layer.id, severity: 'warning' }); if (layer.metadata.missingSource) issues.push({ code: 'MISSING_SOURCE', message: `Layer source ${layer.sourceId} is missing`, layerId: layer.id, severity: 'warning' }); return issues; }
export function validateSceneComposition(composition: SceneComposition): CompositionValidationIssue[] { const duplicateIds = composition.layers.filter((layer, index, list) => list.findIndex((item) => item.id === layer.id) !== index).map((layer) => ({ code: 'DUPLICATE_LAYER_ID', message: `Duplicate layer id ${layer.id}`, layerId: layer.id, severity: 'warning' as const })); return [...validateCanvas(composition.canvas), ...duplicateIds, ...composition.layers.flatMap((layer) => validateLayerBounds(layer, composition.canvas))]; }
export function getCompositionWarnings(composition: SceneComposition) { return validateSceneComposition(composition).filter((issue) => issue.severity === 'warning').map((issue) => issue.message); }
export function diffSceneCompositions(previous?: SceneComposition, next?: SceneComposition) { const prev = new Map((previous?.layers ?? []).map((layer) => [layer.id, layer])); const cur = new Map((next?.layers ?? []).map((layer) => [layer.id, layer])); const added = [...cur.values()].filter((layer) => !prev.has(layer.id)); const removed = [...prev.values()].filter((layer) => !cur.has(layer.id)); const changed = [...cur.values()].filter((layer) => prev.has(layer.id) && JSON.stringify(prev.get(layer.id)) !== JSON.stringify(layer)); return { addedLayers: added, removedLayers: removed, changedLayers: changed, layoutChanged: previous?.metadata.layoutPreset !== next?.metadata.layoutPreset || previous?.canvas.width !== next?.canvas.width || previous?.canvas.height !== next?.canvas.height }; }
export const getChangedLayers = (previous?: SceneComposition, next?: SceneComposition) => diffSceneCompositions(previous, next).changedLayers;
export const getAddedLayers = (previous?: SceneComposition, next?: SceneComposition) => diffSceneCompositions(previous, next).addedLayers;
export const getRemovedLayers = (previous?: SceneComposition, next?: SceneComposition) => diffSceneCompositions(previous, next).removedLayers;
export const hasLayoutChanged = (previous?: SceneComposition, next?: SceneComposition) => diffSceneCompositions(previous, next).layoutChanged;
export class CompositionStore { private compositions = new Map<CompositionRenderTarget, SceneComposition>(); setComposition(target: CompositionRenderTarget, composition: SceneComposition) { this.compositions.set(target, composition); return composition; } getComposition(target: CompositionRenderTarget) { return this.compositions.get(target); } getCompositionByScene(sceneId: string) { return [...this.compositions.values()].filter((composition) => composition.sceneId === sceneId); } listCompositions() { return [...this.compositions.entries()].map(([target, composition]) => ({ target, composition })); } clearCompositions() { this.compositions.clear(); } }
