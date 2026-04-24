// ══════════════════════════════════════════════════════
//  Landmark Renderer Registry — merges all category maps
// ══════════════════════════════════════════════════════
import type { RendererMap } from './types';
import { palaceRenderers }   from './palaces';
import { mountainRenderers } from './mountains';
import { modernRenderers }   from './modern';
import { marketRenderers }   from './markets';
import { natureRenderers }   from './nature';

export const landmarkRenderers: RendererMap = new Map([
  ...palaceRenderers,
  ...mountainRenderers,
  ...modernRenderers,
  ...marketRenderers,
  ...natureRenderers,
]);

export type { DrawFn, LandmarkDef, RendererMap } from './types';
