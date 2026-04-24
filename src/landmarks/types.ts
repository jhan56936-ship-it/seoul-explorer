// ══════════════════════════════════════════════════════
//  Landmark Renderer Types
//  Each category file exports a Map<landmarkId, DrawFn>
// ══════════════════════════════════════════════════════

export interface LandmarkDef {
  id: string; name: string;
  x: number; y: number; width: number; height: number;
  wallColor: string; roofColor: string; floorColor: string;
  type: string; emoji: string;
  innerBlocks: unknown[];
}

/**
 * Custom per-landmark drawing function.
 * Called AFTER the base floor is drawn, BEFORE walls are drawn.
 * Use ctx.save()/ctx.restore() to avoid side effects.
 */
export type DrawFn = (
  ctx: CanvasRenderingContext2D,
  lm: LandmarkDef,
  tick: number,    // animation frame counter
  WALL: number,    // wall depth in world units (120)
) => void;

export type RendererMap = Map<string, DrawFn>;
