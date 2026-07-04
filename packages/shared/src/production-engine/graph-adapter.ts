import type { ProductionCommand, ProductionGraph } from '../production-graph.js';
import { getProductionGraphRevision } from '../production-graph.js';
import type { GraphMutationPlan, GraphMutation, Phase17CommandType } from './execution-result.js';
import { validateNoRuntimeHandles, type EngineValidationIssue } from './validation.js';

const supported = new Set<Phase17CommandType>(['SET_PREVIEW_SCENE','TAKE_PREVIEW','CUT_TO_PROGRAM','AUTO_TRANSITION','ADD_SOURCE','UPDATE_SOURCE','REMOVE_SOURCE','ADD_GRAPHICS_LAYER','UPDATE_GRAPHICS_LAYER','REMOVE_GRAPHICS_LAYER','STAGE_GRAPHICS_PREVIEW','TAKE_GRAPHICS_TO_PROGRAM','ADD_MEDIA_ASSET','STAGE_MEDIA_PREVIEW','TAKE_MEDIA_TO_PROGRAM','SET_OUTPUT_ROUTE','ARM_AUTOMATION_CUE','MARK_AUTOMATION_CUE_EXECUTED']);
export function isPhase17CommandSupported(type: string): type is Phase17CommandType { return supported.has(type as Phase17CommandType); }
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function commandContainsUnsafePayload(command: { payload: unknown; metadata?: unknown }) { return [...validateNoRuntimeHandles(command.payload, 'command.payload'), ...validateNoRuntimeHandles(command.metadata, 'command.metadata')]; }
const mutation = (commandId:string,type:GraphMutation['type'],targetType:string,targetId:string,before:unknown,after:unknown): GraphMutation => ({ id:`${commandId}:${type}:${targetType}:${targetId}`, type, targetType, targetId, before, after, metadataOnly:true });
export function createGraphMutationPlan(graph: ProductionGraph, command: ProductionCommand | (Omit<ProductionCommand,'type'> & {type: Phase17CommandType})): GraphMutationPlan {
  const issues: EngineValidationIssue[] = [];
  if (!isPhase17CommandSupported(command.type)) issues.push({ code:'UNSUPPORTED_COMMAND', message:`Unsupported command ${command.type}`, field:'command.type' });
  issues.push(...commandContainsUnsafePayload(command));
  const p = isObject(command.payload) ? command.payload : {};
  const mutations: GraphMutation[] = [];
  const deps: string[] = [];
  const locks: string[] = [];
  const rev = getProductionGraphRevision(graph) + 1;
  const sceneId = String(p.sceneId ?? graph.preview.sceneId ?? '');
  if (['SET_PREVIEW_SCENE','TAKE_PREVIEW','CUT_TO_PROGRAM','AUTO_TRANSITION'].includes(command.type)) { if (sceneId) deps.push(`scene:${sceneId}`); locks.push(command.type === 'SET_PREVIEW_SCENE' ? 'preview_output' : 'program_output'); }
  if (command.type === 'SET_PREVIEW_SCENE') mutations.push(mutation(command.id,'set','preview','sceneId',graph.preview.sceneId,sceneId));
  if (['TAKE_PREVIEW','CUT_TO_PROGRAM','AUTO_TRANSITION'].includes(command.type)) mutations.push(mutation(command.id,'set','program','sceneId',graph.program.sceneId,sceneId));
  if (command.type === 'ADD_SOURCE') mutations.push(mutation(command.id,'add','source',String(p.id ?? `${command.id}:source`),undefined,p));
  if (command.type === 'UPDATE_SOURCE') mutations.push(mutation(command.id,'update','source',String(p.sourceId ?? p.id),graph.sources[String(p.sourceId ?? p.id)],p));
  if (command.type === 'REMOVE_SOURCE') mutations.push(mutation(command.id,'remove','source',String(p.sourceId ?? p.id),graph.sources[String(p.sourceId ?? p.id)],undefined));
  if (command.type.includes('GRAPHICS')) { locks.push('graphic_layer'); mutations.push(mutation(command.id,'update','graphics',String(p.layerId ?? p.assetId ?? 'graphics'),undefined,p)); }
  if (command.type.includes('MEDIA')) { locks.push('media_player'); mutations.push(mutation(command.id,'update','media',String(p.assetId ?? 'media'),undefined,p)); }
  if (command.type === 'SET_OUTPUT_ROUTE') { locks.push('program_output'); deps.push(`destination:${String(p.destinationId ?? '')}`); mutations.push(mutation(command.id,'update','output_route',String(p.destinationId ?? 'output'),undefined,p)); }
  if (command.type.includes('AUTOMATION_CUE')) { deps.push(`cue:${String(p.cueId ?? '')}`); mutations.push(mutation(command.id,'update','automation_cue',String(p.cueId ?? 'cue'),undefined,p)); }
  return { id:`plan:${command.id}`, commandId:command.id, targetGraphRevision:rev, mutations, dependencies:deps.filter(Boolean), locks, validation:{ valid: issues.length===0, issues }, reversible:true };
}
