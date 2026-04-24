// ══════════════════════════════════════════════════════
//  Palace & Traditional Landmark Renderers
// ══════════════════════════════════════════════════════
import type { RendererMap, DrawFn } from './types';

const WALL = 120;

// ── Helper: Korean tiled roof (trapezoid + eave lines) ──
function drawKoreanRoof(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  roofColor: string
) {
  const inset = w * 0.15;
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x, y + h);          // bottom-left
  ctx.lineTo(x + w, y + h);      // bottom-right
  ctx.lineTo(x + w - inset, y);  // top-right
  ctx.lineTo(x + inset, y);      // top-left
  ctx.closePath();
  ctx.fill();

  // Eave lines
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const ey = y + h * t;
    const ex = x + inset * t;
    const ew = w - inset * t * 2;
    ctx.fillRect(ex, ey, ew, 6);
  }
  // Ridge highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x + inset, y, w - inset * 2, 8);
}

// ── Helper: stone courtyard floor ──
function drawStoneFloor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
) {
  ctx.fillStyle = '#c0b090';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(150,140,110,0.5)';
  for (let gx = x; gx < x + w; gx += 200) {
    ctx.fillRect(gx, y, 4, h);
  }
  for (let gy = y; gy < y + h; gy += 200) {
    ctx.fillRect(x, gy, w, 4);
  }
}

// ── Helper: circle tree ──
function drawCircleTree(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number
) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(cx + 10, cy + 10, r, 0, Math.PI * 2);
  ctx.fill();
  // Main green
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Highlight arc
  ctx.fillStyle = '#86efac44';
  ctx.beginPath();
  ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.45, 0, Math.PI * 2);
  ctx.fill();
}

// ── Helper: animated pond ──
function drawPond(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  tick: number
) {
  ctx.fillStyle = '#1e88e5';
  ctx.fillRect(x, y, w, h);
  // Animated ripple lines
  for (let i = 0; i < 3; i++) {
    const wave = Math.sin(tick * 0.05 + i * 1.2);
    const ly = y + h * (0.25 + i * 0.25);
    const alpha = 0.15 + 0.1 * wave;
    ctx.fillStyle = `rgba(150,220,255,${alpha})`;
    ctx.fillRect(x + w * 0.1, ly, w * 0.8, 10);
  }
}

// ── Helper: pavilion (floor + shadow + roof) ──
function drawPavilion(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  floorColor: string,
  roofColor: string
) {
  const roofH = Math.floor(h * 0.35);
  const bodyH = h - roofH;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 16, y + 16, w, h);
  // Body
  ctx.fillStyle = floorColor;
  ctx.fillRect(x, y + roofH, w, bodyH);
  // Pillars
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x, y + roofH, 24, bodyH);
  ctx.fillRect(x + w - 24, y + roofH, 24, bodyH);
  // Roof
  drawKoreanRoof(ctx, x, y, w, roofH, roofColor);
}

// ══════════════════════════════════════════════════════
//  gyeongbok — 경복궁 (4000×3000)
// ══════════════════════════════════════════════════════
const drawGyeongbok: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL;
  const iY = lm.y + WALL;
  const iW = lm.width  - WALL * 2;
  const iH = lm.height - WALL * 2;

  // Stone floor
  drawStoneFloor(ctx, iX, iY, iW, iH);

  // Gyeonghoeru pond (left side)
  drawPond(ctx, lm.x + 300, lm.y + 600, 400, 300, tick);
  // Pavilion on pond
  drawPavilion(ctx, lm.x + 350, lm.y + 650, 300, 180, '#8b4513', '#2d5a1f');

  // Hyangwonjeong — circular pond (right area)
  ctx.fillStyle = '#1e88e5';
  ctx.beginPath();
  ctx.arc(lm.x + 3200, lm.y + 700, 200, 0, Math.PI * 2);
  ctx.fill();
  // Small hexagonal pavilion (approximated as circle)
  ctx.fillStyle = '#8b4513';
  ctx.beginPath();
  ctx.arc(lm.x + 3200, lm.y + 700, 80, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d5a1f';
  ctx.beginPath();
  ctx.arc(lm.x + 3200, lm.y + 700, 80, Math.PI, Math.PI * 2);
  ctx.fill();

  // Geunjeongjeon main hall (center-top)
  drawPavilion(ctx, lm.x + 1550, lm.y + 400, 900, 500, '#8b4513', '#2d5a1f');

  // Gangnyeongjeon (center)
  drawPavilion(ctx, lm.x + 1600, lm.y + 1200, 800, 400, '#8b4513', '#2d5a1f');

  // 4 gates: N/S/E/W small yellow rectangles
  ctx.fillStyle = '#f0c040';
  // North gate
  ctx.fillRect(lm.x + lm.width / 2 - 100, lm.y + WALL, 200, 80);
  // South gate (entrance area, inner)
  ctx.fillRect(lm.x + lm.width / 2 - 100, lm.y + lm.height - WALL - 80, 200, 80);
  // East gate
  ctx.fillRect(lm.x + lm.width - WALL - 80, lm.y + lm.height / 2 - 50, 80, 100);
  // West gate
  ctx.fillRect(lm.x + WALL, lm.y + lm.height / 2 - 50, 80, 100);

  // 8 trees evenly distributed
  const treePositions = [
    [lm.x + 250, lm.y + 300],
    [lm.x + 800, lm.y + 250],
    [lm.x + 1200, lm.y + 1800],
    [lm.x + 2000, lm.y + 1700],
    [lm.x + 2800, lm.y + 1800],
    [lm.x + 3500, lm.y + 1600],
    [lm.x + 3600, lm.y + 1200],
    [lm.x + 200,  lm.y + 2200],
  ];
  for (const [tx, ty] of treePositions) {
    drawCircleTree(ctx, tx, ty, 80);
  }

  ctx.restore();
};

// ══════════════════════════════════════════════════════
//  changdeok — 창덕궁 (3500×2500)
// ══════════════════════════════════════════════════════
const drawChangdeok: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL;
  const iY = lm.y + WALL;
  const iW = lm.width  - WALL * 2;
  const iH = lm.height - WALL * 2;

  // Stone floor
  drawStoneFloor(ctx, iX, iY, iW, iH);

  // Biwon (secret garden): right 1/3
  const biX = lm.x + Math.floor(iW * 2 / 3) + WALL;
  const biW = Math.floor(iW / 3);
  ctx.fillStyle = '#2d6b20';
  ctx.fillRect(biX, iY, biW, iH);
  // Pond in garden
  drawPond(ctx, biX + 100, iY + 200, 400, 280, tick);
  // 6 trees in garden
  const gardenTrees = [
    [biX + 80,  iY + 600],
    [biX + 300, iY + 800],
    [biX + 500, iY + 500],
    [biX + 200, iY + 1100],
    [biX + 550, iY + 1300],
    [biX + 80,  iY + 1500],
  ];
  for (const [tx, ty] of gardenTrees) {
    drawCircleTree(ctx, tx, ty, 70);
  }

  // Injeongjeon main hall
  drawPavilion(ctx, lm.x + 1350, lm.y + 400, 800, 500, '#8b4513', '#2d5a1f');

  // 4 trees in main courtyard
  drawCircleTree(ctx, lm.x + 350,  lm.y + 400, 80);
  drawCircleTree(ctx, lm.x + 350,  lm.y + 1800, 80);
  drawCircleTree(ctx, lm.x + 1000, lm.y + 1600, 80);
  drawCircleTree(ctx, lm.x + 700,  lm.y + 900,  80);

  ctx.restore();
};

// ══════════════════════════════════════════════════════
//  deoksu — 덕수궁 (2000×1800)
// ══════════════════════════════════════════════════════
const drawDeoksu: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL;
  const iY = lm.y + WALL;
  const iW = lm.width  - WALL * 2;
  const iH = lm.height - WALL * 2;

  drawStoneFloor(ctx, iX, iY, iW, iH);

  // Junghwajeon main hall
  drawPavilion(ctx, lm.x + 700, lm.y + 400, 600, 400, '#8b4513', '#2d5a1f');

  // Jeongwanheon (western-style pavilion) — beige
  drawPavilion(ctx, lm.x + 200, lm.y + 500, 400, 300, '#f5e6c8', '#2d5a1f');

  // 4 trees
  drawCircleTree(ctx, lm.x + 250,  lm.y + 280, 70);
  drawCircleTree(ctx, lm.x + 1600, lm.y + 280, 70);
  drawCircleTree(ctx, lm.x + 250,  lm.y + 1400, 70);
  drawCircleTree(ctx, lm.x + 1600, lm.y + 1400, 70);

  ctx.restore();
};

// ══════════════════════════════════════════════════════
//  bukchon — 북촌한옥마을 (2500×2000)
// ══════════════════════════════════════════════════════
const drawBukchon: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL;
  const iY = lm.y + WALL;
  const iW = lm.width  - WALL * 2;
  const iH = lm.height - WALL * 2;

  // Beige/tan floor
  ctx.fillStyle = '#d4c098';
  ctx.fillRect(iX, iY, iW, iH);

  // Hanok grid: 200×150 blocks with 40px alley gaps
  const blockW = 200;
  const blockH = 150;
  const gapX   = 40;
  const gapY   = 40;

  for (let bx = iX; bx + blockW <= iX + iW; bx += blockW + gapX) {
    for (let by = iY; by + blockH <= iY + iH; by += blockH + gapY) {
      // Hanok body
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(bx, by + 30, blockW, blockH - 30);
      // Roof strip on top of block
      ctx.fillStyle = '#2d5a1f';
      ctx.fillRect(bx, by, blockW, 32);
    }
  }

  // Alley paths (horizontal)
  ctx.fillStyle = '#c8b47a';
  for (let by = iY + blockH; by < iY + iH; by += blockH + gapY) {
    ctx.fillRect(iX, by, iW, gapY);
  }
  // Alley paths (vertical)
  for (let bx = iX + blockW; bx < iX + iW; bx += blockW + gapX) {
    ctx.fillRect(bx, iY, gapX, iH);
  }

  ctx.restore();
};

// ══════════════════════════════════════════════════════
//  jogyesa — 조계사 (1500×1500)
// ══════════════════════════════════════════════════════
const drawJogyesa: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL;
  const iY = lm.y + WALL;
  const iW = lm.width  - WALL * 2;
  const iH = lm.height - WALL * 2;

  drawStoneFloor(ctx, iX, iY, iW, iH);

  // Daeungjeon main hall
  drawPavilion(ctx, lm.x + 500, lm.y + 350, 500, 350, '#8b4513', '#2d5a1f');

  // 3-story stone pagoda (right side) — stacked rects narrowing upward
  const pBaseX = lm.x + 1000;
  const pBaseY = lm.y + 400;
  // Bottom tier
  ctx.fillStyle = '#c0b090';
  ctx.fillRect(pBaseX - 30, pBaseY + 120, 60, 60);
  // Middle tier
  ctx.fillRect(pBaseX - 25, pBaseY + 60,  50, 50);
  // Top tier
  ctx.fillRect(pBaseX - 20, pBaseY,        40, 40);
  // Finial
  ctx.fillStyle = '#f0c040';
  ctx.fillRect(pBaseX - 6, pBaseY - 20, 12, 20);

  // Bell pavilion (left side) — small square with bell circle
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(lm.x + 220, lm.y + 390, 90, 90);
  ctx.fillStyle = '#2d5a1f';
  ctx.fillRect(lm.x + 220, lm.y + 390, 90, 24);
  ctx.fillStyle = '#f0c040';
  ctx.beginPath();
  ctx.arc(lm.x + 265, lm.y + 450, 25, 0, Math.PI * 2);
  ctx.fill();

  // 4 trees
  drawCircleTree(ctx, lm.x + 200,  lm.y + 250,  65);
  drawCircleTree(ctx, lm.x + 1200, lm.y + 250,  65);
  drawCircleTree(ctx, lm.x + 200,  lm.y + 1200, 65);
  drawCircleTree(ctx, lm.x + 1200, lm.y + 1200, 65);

  ctx.restore();
};

// ══════════════════════════════════════════════════════
//  bosingak — 보신각 (1000×1000)
// ══════════════════════════════════════════════════════
const drawBosingak: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL;
  const iY = lm.y + WALL;
  const iW = lm.width  - WALL * 2;
  const iH = lm.height - WALL * 2;

  drawStoneFloor(ctx, iX, iY, iW, iH);

  // 4 corner pillars (40×300 each)
  const pillarW = 40;
  const pillarH = 300;
  const pillarColor = '#8b4513';
  const corners = [
    [lm.x + WALL + 40,        lm.y + WALL + 80],
    [lm.x + lm.width - WALL - 80,  lm.y + WALL + 80],
    [lm.x + WALL + 40,        lm.y + lm.height - WALL - 380],
    [lm.x + lm.width - WALL - 80,  lm.y + lm.height - WALL - 380],
  ];
  ctx.fillStyle = pillarColor;
  for (const [px, py] of corners) {
    ctx.fillRect(px, py, pillarW, pillarH);
  }

  // Traditional roof on top spanning all pillars
  const roofX = lm.x + WALL + 20;
  const roofY = lm.y + WALL + 40;
  const roofW = iW - 40;
  const roofH = 120;
  drawKoreanRoof(ctx, roofX, roofY, roofW, roofH, '#2d5a1f');

  // Central bell: gold circle
  ctx.fillStyle = '#f0c040';
  ctx.beginPath();
  ctx.arc(lm.x + lm.width / 2, lm.y + lm.height / 2 + 80, 150, 0, Math.PI * 2);
  ctx.fill();
  // Bell detail ring
  ctx.strokeStyle = '#c8a020';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(lm.x + lm.width / 2, lm.y + lm.height / 2 + 80, 110, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
};

// ══════════════════════════════════════════════════════
//  gwanghwamun — 광화문광장 (1000×3000, very tall)
// ══════════════════════════════════════════════════════
const drawGwanghwamun: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL;
  const iY = lm.y + WALL;
  const iW = lm.width  - WALL * 2;
  const iH = lm.height - WALL * 2;

  drawStoneFloor(ctx, iX, iY, iW, iH);

  // Central stone path (full interior height)
  ctx.fillStyle = '#a89870';
  ctx.fillRect(lm.x + 400, lm.y + WALL, 200, iH);
  // Path edge lines
  ctx.fillStyle = '#8a7850';
  ctx.fillRect(lm.x + 400, lm.y + WALL, 8,   iH);
  ctx.fillRect(lm.x + 592, lm.y + WALL, 8,   iH);

  // Yi Sun-sin statue at (lm.x+500, lm.y+900)
  // Circular pedestal
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.arc(lm.x + 500, lm.y + 1000, 100, 0, Math.PI * 2);
  ctx.fill();
  // Dark bronze rectangle above
  ctx.fillStyle = '#4a3820';
  ctx.fillRect(lm.x + 460, lm.y + 830, 80, 140);
  ctx.fillStyle = '#7c5c30';
  ctx.fillRect(lm.x + 470, lm.y + 820, 60, 30);

  // Sejong statue at (lm.x+500, lm.y+2400)
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.arc(lm.x + 500, lm.y + 2500, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a3820';
  ctx.fillRect(lm.x + 460, lm.y + 2330, 80, 140);
  ctx.fillStyle = '#7c5c30';
  ctx.fillRect(lm.x + 470, lm.y + 2320, 60, 30);

  // 2 pairs of fountains (blue circles r=60)
  const fountainColor = '#1e88e5';
  const fountains = [
    [lm.x + 200, lm.y + 500],
    [lm.x + 800, lm.y + 500],
    [lm.x + 200, lm.y + 1800],
    [lm.x + 800, lm.y + 1800],
  ];
  for (const [fx, fy] of fountains) {
    ctx.fillStyle = fountainColor;
    ctx.beginPath();
    ctx.arc(fx, fy, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(150,220,255,0.4)';
    ctx.beginPath();
    ctx.arc(fx - 15, fy - 15, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tree rows: 4 trees each side (left and right)
  const treeRowY = [lm.y + 400, lm.y + 900, lm.y + 1600, lm.y + 2200];
  for (const ty of treeRowY) {
    drawCircleTree(ctx, lm.x + 150, ty, 60);
    drawCircleTree(ctx, lm.x + 850, ty, 60);
  }

  ctx.restore();
};

// ══════════════════════════════════════════════════════
//  Export
// ══════════════════════════════════════════════════════
export const palaceRenderers: RendererMap = new Map<string, DrawFn>([
  ['gyeongbok',   drawGyeongbok],
  ['changdeok',   drawChangdeok],
  ['deoksu',      drawDeoksu],
  ['bukchon',     drawBukchon],
  ['jogyesa',     drawJogyesa],
  ['bosingak',    drawBosingak],
  ['gwanghwamun', drawGwanghwamun],
]);
