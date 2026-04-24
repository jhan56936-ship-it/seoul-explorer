import type { RendererMap, DrawFn } from './types';

// ── Helper functions ──────────────────────────────────────────────────────────

function drawContourEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
  color: string,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawPineTree(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  h: number,
): void {
  ctx.save();
  const w = h * 0.6;
  // 3 stacked narrowing rects approximating a triangle
  ctx.fillStyle = '#1a5c1a';
  ctx.fillRect(cx - w * 0.5, cy - h, w, h * 0.4);
  ctx.fillStyle = '#1e6b1e';
  ctx.fillRect(cx - w * 0.35, cy - h * 0.65, w * 0.7, h * 0.35);
  ctx.fillStyle = '#22782a';
  ctx.fillRect(cx - w * 0.2, cy - h * 0.35, w * 0.4, h * 0.35);
  // brown trunk
  ctx.fillStyle = '#6b3e1a';
  ctx.fillRect(cx - w * 0.07, cy, w * 0.14, h * 0.25);
  ctx.restore();
}

function drawRock(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
): void {
  ctx.save();
  ctx.fillStyle = '#8a9080';
  ctx.fillRect(x, y, w, h);
  // highlight top-left
  ctx.fillStyle = '#ffffff22';
  ctx.fillRect(x, y, w * 0.5, h * 0.4);
  // shadow bottom-right
  ctx.fillStyle = '#00000033';
  ctx.fillRect(x + w * 0.5, y + h * 0.5, w * 0.5, h * 0.5);
  ctx.restore();
}

function drawTrailDash(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
): void {
  ctx.save();
  ctx.fillStyle = '#c8a46a';
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.floor(dist / 80);
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const rx = x1 + dx * t;
    const ry = y1 + dy * t;
    ctx.fillRect(rx - 15, ry - 15, 30, 30);
  }
  ctx.restore();
}

function drawSnowPeak(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f0f4ff';
  ctx.fill();
  ctx.restore();
}

// ── Landmark renderers ────────────────────────────────────────────────────────

const drawBukhansan: DrawFn = (ctx, lm, _tick, WALL) => {
  ctx.save();

  // Layer 1: fill entire interior with dark forest green
  ctx.fillStyle = '#2d5016';
  ctx.fillRect(lm.x + WALL, lm.y + WALL, lm.width - WALL * 2, lm.height - WALL * 2);

  // Layer 2: brown ellipse
  drawContourEllipse(ctx, lm.x + 4000, lm.y + 3000, 3000, 2200, '#6b5a3a');

  // Layer 3: 3 rocky peak ellipses
  const peaks: [number, number][] = [
    [lm.x + 2500, lm.y + 1200],
    [lm.x + 4000, lm.y + 900],
    [lm.x + 5500, lm.y + 1100],
  ];
  for (const [px, py] of peaks) {
    drawContourEllipse(ctx, px, py, 500, 400, '#7a8070');
  }

  // Snow caps on each peak
  for (const [px, py] of peaks) {
    drawSnowPeak(ctx, px, py - 100, 280);
  }

  // Rock clusters near peaks (16 rocks)
  const rockOffsets: [number, number, number, number][] = [
    [2200, 1000, 120, 80], [2700, 1100, 100, 70], [2400, 1400, 90, 60],
    [3700, 750, 130, 85], [4100, 850, 110, 75], [3900, 1100, 95, 65],
    [4300, 700, 105, 70], [5200, 950, 120, 80], [5600, 1000, 100, 65],
    [5400, 1300, 90, 60], [5800, 900, 115, 75], [2900, 900, 80, 55],
    [4600, 1000, 95, 65], [3200, 1100, 85, 60], [4800, 1200, 100, 70],
    [5100, 800, 90, 60],
  ];
  for (const [ox, oy, rw, rh] of rockOffsets) {
    drawRock(ctx, lm.x + ox, lm.y + oy, rw, rh);
  }

  // Pine trees in lower 60% (25 trees)
  const treePositions: [number, number][] = [
    [700, 2500], [1100, 2800], [1500, 3000], [900, 3300], [1300, 3600],
    [1800, 2600], [2200, 3100], [2600, 3400], [3000, 2800], [3400, 3200],
    [3800, 3500], [4200, 2900], [4600, 3300], [5000, 2700], [5400, 3100],
    [5800, 3400], [6200, 2600], [6500, 3000], [700, 4000], [1500, 4200],
    [2300, 4500], [3100, 4100], [3900, 4400], [4700, 4000], [5500, 4300],
  ];
  for (const [tx, ty] of treePositions) {
    drawPineTree(ctx, lm.x + tx, lm.y + ty, 220);
  }

  // Y-shape trails from south center to 3 peaks
  const southX = lm.x + 4000;
  const southY = lm.y + 5500;
  const midX = lm.x + 4000;
  const midY = lm.y + 3500;
  drawTrailDash(ctx, southX, southY, midX, midY);
  drawTrailDash(ctx, midX, midY, peaks[0][0], peaks[0][1]);
  drawTrailDash(ctx, midX, midY, peaks[1][0], peaks[1][1]);
  drawTrailDash(ctx, midX, midY, peaks[2][0], peaks[2][1]);

  // 3 stream lines from peaks downward
  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 20;
  const streamData: [number, number, number, number][] = [
    [peaks[0][0], peaks[0][1], lm.x + 1800, lm.y + 5500],
    [peaks[1][0], peaks[1][1], lm.x + 4000, lm.y + 5500],
    [peaks[2][0], peaks[2][1], lm.x + 6000, lm.y + 5500],
  ];
  for (const [sx, sy, ex, ey] of streamData) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx - 200, sy + 600, ex + 200, ey - 600, ex, ey);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
};

const drawInwangsan: DrawFn = (ctx, lm, _tick, WALL) => {
  ctx.save();

  // Layer 1: green fill
  ctx.fillStyle = '#3d5c28';
  ctx.fillRect(lm.x + WALL, lm.y + WALL, lm.width - WALL * 2, lm.height - WALL * 2);

  // Layer 2: brown center ellipse
  drawContourEllipse(ctx, lm.x + 1500, lm.y + 1500, 1200, 1000, '#6b5a3a');

  // 5 large granite boulders scattered near top half
  const boulders: [number, number, number, number][] = [
    [800, 400, 350, 250],
    [1200, 300, 300, 220],
    [1700, 450, 380, 260],
    [900, 700, 320, 230],
    [1500, 600, 340, 240],
  ];
  for (const [ox, oy, bw, bh] of boulders) {
    drawRock(ctx, lm.x + ox, lm.y + oy, bw, bh);
  }

  // Haetae rock: largest boulder + yellow dot marker
  drawRock(ctx, lm.x + 1300, lm.y + 720, 400, 280);
  ctx.save();
  ctx.beginPath();
  ctx.arc(lm.x + 1400, lm.y + 800, 60, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd700';
  ctx.fill();
  ctx.restore();

  // Seoul city wall: grey zigzag as connected small rects diagonally
  ctx.save();
  ctx.fillStyle = '#9a9a9a';
  for (let i = 0; i < 18; i++) {
    const wx = lm.x + 300 + i * 130;
    const wy = lm.y + 600 + (i % 2 === 0 ? 0 : 60);
    ctx.fillRect(wx, wy, 100, 40);
  }
  ctx.restore();

  // Very few trees (5)
  const treePos: [number, number][] = [
    [300, 1800], [600, 2200], [2100, 1900], [2400, 2300], [1000, 2500],
  ];
  for (const [tx, ty] of treePos) {
    drawPineTree(ctx, lm.x + tx, lm.y + ty, 160);
  }

  ctx.restore();
};

const drawBukaksan: DrawFn = (ctx, lm, _tick, WALL) => {
  ctx.save();

  // Layer 1: dark forest green fill
  ctx.fillStyle = '#2d5016';
  ctx.fillRect(lm.x + WALL, lm.y + WALL, lm.width - WALL * 2, lm.height - WALL * 2);

  // Layer 2: brown center ellipse
  drawContourEllipse(ctx, lm.x + 2000, lm.y + 1500, 1500, 1100, '#5a4a30');

  // 2 peaks
  const leftPeak: [number, number] = [lm.x + 1200, lm.y + 700];
  const rightPeak: [number, number] = [lm.x + 2800, lm.y + 600];
  drawContourEllipse(ctx, leftPeak[0], leftPeak[1], 400, 300, '#7a8070');
  drawContourEllipse(ctx, rightPeak[0], rightPeak[1], 400, 300, '#7a8070');

  // Snow on both peaks
  drawSnowPeak(ctx, leftPeak[0], leftPeak[1] - 80, 230);
  drawSnowPeak(ctx, rightPeak[0], rightPeak[1] - 80, 230);

  // City wall: horizontal line of small grey rects
  ctx.save();
  ctx.fillStyle = '#9a9a9a';
  for (let i = 0; i < 20; i++) {
    ctx.fillRect(lm.x + WALL + i * 185, lm.y + 1000, 140, 50);
  }
  ctx.restore();

  // 12 rocks
  const rockPos: [number, number, number, number][] = [
    [900, 500, 110, 75], [1100, 650, 100, 70], [1400, 550, 90, 65],
    [2600, 450, 115, 78], [2900, 550, 105, 72], [3100, 480, 95, 68],
    [1700, 700, 85, 58], [2000, 600, 90, 62], [2300, 650, 100, 68],
    [1300, 800, 80, 55], [2100, 850, 88, 60], [2700, 750, 95, 65],
  ];
  for (const [ox, oy, rw, rh] of rockPos) {
    drawRock(ctx, lm.x + ox, lm.y + oy, rw, rh);
  }

  // 12 pine trees
  const treePos: [number, number][] = [
    [300, 1500], [600, 1700], [900, 1900], [1200, 2100],
    [1600, 1600], [1900, 1800], [2200, 2000], [2500, 2200],
    [2800, 1700], [3100, 1900], [3400, 2100], [3600, 2300],
  ];
  for (const [tx, ty] of treePos) {
    drawPineTree(ctx, lm.x + tx, lm.y + ty, 180);
  }

  ctx.restore();
};

const drawGwanaksan: DrawFn = (ctx, lm, _tick, WALL) => {
  ctx.save();

  // Layer 1: dark forest green fill
  ctx.fillStyle = '#2d5016';
  ctx.fillRect(lm.x + WALL, lm.y + WALL, lm.width - WALL * 2, lm.height - WALL * 2);

  // Layer 2: large ellipse
  drawContourEllipse(ctx, lm.x + 3500, lm.y + 2500, 2800, 1800, '#4a5a38');

  // Layer 3: peak triangle (top center) as filled rect approximation
  ctx.save();
  ctx.fillStyle = '#7a6a50';
  // Use a trapezoid via two rects
  ctx.fillRect(lm.x + 3000, lm.y + 400, 1000, 600);
  ctx.fillRect(lm.x + 3200, lm.y + 200, 600, 400);
  ctx.restore();

  // Rock ridges: several horizontal grey rect bands across upper portion
  ctx.save();
  ctx.fillStyle = '#8a9080';
  for (let r = 0; r < 5; r++) {
    const ry = lm.y + 600 + r * 280;
    ctx.fillRect(lm.x + WALL + 200, ry, lm.width - WALL * 2 - 400, 60);
  }
  ctx.restore();

  // Yeonjudae peak: dramatic rocky mass
  drawRock(ctx, lm.x + 3350, lm.y + 150, 300, 200);

  // Yeonjuam temple: small square near peak
  ctx.save();
  ctx.fillStyle = '#c8a46a';
  ctx.fillRect(lm.x + 3700, lm.y + 500, 200, 150);
  // tiny roof
  ctx.fillStyle = '#8b2500';
  ctx.fillRect(lm.x + 3680, lm.y + 480, 240, 40);
  ctx.restore();

  // 3 trails diverging from bottom
  const bottomX = lm.x + 3500;
  const bottomY = lm.y + 4700;
  const topX = lm.x + 3500;
  const topY = lm.y + 1500;
  drawTrailDash(ctx, bottomX, bottomY, lm.x + 1500, lm.y + 4800);
  drawTrailDash(ctx, bottomX, bottomY, lm.x + 3500, lm.y + 4800);
  drawTrailDash(ctx, bottomX, bottomY, lm.x + 5500, lm.y + 4800);
  drawTrailDash(ctx, topX, topY, bottomX, bottomY);

  // 30 pine trees in lower 70%
  const treePositions: [number, number][] = [
    [400, 1800], [800, 2000], [1200, 1900], [1600, 2100], [2000, 1800],
    [2400, 2200], [2800, 2000], [3200, 2300], [3600, 2100], [4000, 2000],
    [4400, 2200], [4800, 2100], [5200, 2000], [5600, 2200], [6000, 1900],
    [6400, 2100], [400, 2600], [900, 2800], [1400, 3000], [1900, 2700],
    [2400, 3100], [2900, 2900], [3400, 3200], [3900, 3000], [4400, 3100],
    [4900, 2800], [5400, 3000], [5900, 2700], [6300, 3100], [6600, 2900],
  ];
  for (const [tx, ty] of treePositions) {
    drawPineTree(ctx, lm.x + tx, lm.y + ty, 200);
  }

  ctx.restore();
};

// ── Export ────────────────────────────────────────────────────────────────────

export const mountainRenderers: RendererMap = new Map<string, DrawFn>([
  ['bukhansan', drawBukhansan],
  ['inwangsan', drawInwangsan],
  ['bukaksan', drawBukaksan],
  ['gwanaksan', drawGwanaksan],
]);
