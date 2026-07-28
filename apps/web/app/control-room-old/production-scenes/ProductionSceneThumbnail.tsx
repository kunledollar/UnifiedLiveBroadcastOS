import type { ProductionSceneCardMetadata } from './types';
export function ProductionSceneThumbnail({ layout }: { layout: ProductionSceneCardMetadata['layout'] }) { return <div className={`ps-thumb ps-thumb--${layout.thumbnailVariant}`} aria-label={`${layout.name} metadata layout thumbnail`}><i /><i /><i /><i /><b>{layout.name}</b></div>; }
