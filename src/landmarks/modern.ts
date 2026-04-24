import type { RendererMap, DrawFn } from './types';

const WALL = 120;

function drawWindowGrid(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  cols: number, rows: number,
  winColor: string,
) {
  const padX = w * 0.08;
  const padY = h * 0.08;
  const cellW = (w - padX * 2) / cols;
  const cellH = (h - padY * 2) / rows;
  const winW = cellW * 0.6;
  const winH = cellH * 0.6;
  ctx.fillStyle = winColor;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillRect(
        x + padX + c * cellW + (cellW - winW) / 2,
        y + padY + r * cellH + (cellH - winH) / 2,
        winW,
        winH,
      );
    }
  }
}

function drawGlassPanel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  baseColor: string,
) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x, y, w, h * 0.15);
}

function drawFloor(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// ── lotte-tower ──────────────────────────────────────────────
const drawLotteTower: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  // Base podium
  drawGlassPanel(ctx, lm.x + 100, lm.y + 2200, 1200, 500, '#1e3a5f');
  drawWindowGrid(ctx, lm.x + 100, lm.y + 2200, 1200, 500, 8, 3, '#60a5fa');
  // Middle 1
  drawGlassPanel(ctx, lm.x + 200, lm.y + 1600, 1000, 600, '#2a4a7f');
  drawWindowGrid(ctx, lm.x + 200, lm.y + 1600, 1000, 600, 6, 4, '#7ec8fa');
  // Middle 2
  drawGlassPanel(ctx, lm.x + 350, lm.y + 900, 700, 700, '#3060a0');
  drawWindowGrid(ctx, lm.x + 350, lm.y + 900, 700, 700, 5, 5, '#90d0ff');
  // Upper
  drawGlassPanel(ctx, lm.x + 500, lm.y + 300, 400, 600, '#60a5fa');
  drawWindowGrid(ctx, lm.x + 500, lm.y + 300, 400, 600, 3, 6, '#c0e8ff');
  // Spire
  ctx.fillStyle = '#90c0ff';
  ctx.fillRect(lm.x + 660, lm.y + 100, 80, 200);
  ctx.restore();
};

// ── n-tower ──────────────────────────────────────────────────
const drawNTower: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  const iw = lm.width - WALL * 2;
  const ih = lm.height - WALL * 2;
  // Hill base (lower 1/3)
  ctx.fillStyle = '#2d6b20';
  ctx.fillRect(lm.x + WALL, lm.y + WALL + ih * (2 / 3), iw, ih / 3);
  // Tower pole
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(lm.x + 640, lm.y + 200, 120, 900);
  // Observation deck circle
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(lm.x + 700, lm.y + 350, 280, 0, Math.PI * 2);
  ctx.fill();
  // 8 windows around deck
  ctx.fillStyle = '#87ceeb';
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const wx = lm.x + 700 + Math.cos(angle) * 200 - 15;
    const wy = lm.y + 350 + Math.sin(angle) * 160 - 20;
    ctx.fillRect(wx, wy, 30, 40);
  }
  // Antenna
  ctx.fillStyle = '#666';
  ctx.fillRect(lm.x + 690, lm.y + 120, 20, 180);
  ctx.restore();
};

// ── ddp ──────────────────────────────────────────────────────
const drawDdp: DrawFn = (ctx, lm, tick, _WALL) => {
  ctx.save();
  // Main ellipse
  ctx.fillStyle = '#9ca3af';
  ctx.beginPath();
  ctx.ellipse(lm.x + 1250, lm.y + 900, 900, 500, 0, 0, Math.PI * 2);
  ctx.fill();
  // Left dome
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.ellipse(lm.x + 600, lm.y + 1300, 450, 300, 0, 0, Math.PI * 2);
  ctx.fill();
  // Right dome
  ctx.fillStyle = '#9ca3af';
  ctx.beginPath();
  ctx.ellipse(lm.x + 1900, lm.y + 1100, 400, 280, 0, 0, Math.PI * 2);
  ctx.fill();
  // Panel lines across surface
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const yOffset = lm.y + 500 + i * 80;
    ctx.beginPath();
    ctx.moveTo(lm.x + 200, yOffset);
    ctx.bezierCurveTo(lm.x + 800, yOffset - 80, lm.x + 1600, yOffset + 60, lm.x + 2300, yOffset - 40);
    ctx.stroke();
  }
  // LED dots pulsing
  const pulse = 0.5 + 0.5 * Math.sin(tick * 0.08);
  ctx.fillStyle = `rgba(255,255,255,${pulse})`;
  for (let i = 0; i < 20; i++) {
    const dx = lm.x + 400 + (i % 5) * 380;
    const dy = lm.y + 700 + Math.floor(i / 5) * 200;
    ctx.beginPath();
    ctx.arc(dx, dy, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  // Open plaza strip
  ctx.fillStyle = '#d1d5db';
  ctx.fillRect(lm.x + WALL, lm.y + 1600, lm.width - WALL * 2, 200);
  ctx.restore();
};

// ── coex ─────────────────────────────────────────────────────
const drawCoex: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  // Convention hall
  drawGlassPanel(ctx, lm.x + 300, lm.y + 200, 2500, 1000, '#1e3a5f');
  drawWindowGrid(ctx, lm.x + 300, lm.y + 200, 2500, 1000, 10, 5, '#60a5fa');
  // Underground mall base
  ctx.fillStyle = '#374151';
  ctx.fillRect(lm.x + 200, lm.y + 1300, 3000, 800);
  // Shop grid
  const shopColors = ['#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#f97316'];
  const shopW = 200;
  const shopH = 200;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 12; col++) {
      const ci = (row * 12 + col) % shopColors.length;
      ctx.fillStyle = shopColors[ci];
      ctx.fillRect(lm.x + 250 + col * 230, lm.y + 1340 + row * 220, shopW, shopH);
    }
  }
  // Aquarium section (overlay)
  ctx.fillStyle = '#0284c7';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(lm.x + 200, lm.y + 1300, 800, 800);
  ctx.globalAlpha = 1.0;
  // Trade tower
  drawGlassPanel(ctx, lm.x + 2800, lm.y + 200, 500, 1200, '#2a4a7f');
  drawWindowGrid(ctx, lm.x + 2800, lm.y + 200, 500, 1200, 3, 8, '#7ec8fa');
  ctx.restore();
};

// ── 63building ───────────────────────────────────────────────
const draw63Building: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  // Base wide
  drawGlassPanel(ctx, lm.x + 100, lm.y + 1400, 1000, 300, '#b8860b');
  drawWindowGrid(ctx, lm.x + 100, lm.y + 1400, 1000, 300, 8, 2, '#fff8dc');
  // Mid
  drawGlassPanel(ctx, lm.x + 150, lm.y + 800, 900, 600, '#daa520');
  drawWindowGrid(ctx, lm.x + 150, lm.y + 800, 900, 600, 7, 5, '#fffacd');
  // Upper
  drawGlassPanel(ctx, lm.x + 250, lm.y + 200, 700, 600, '#f0c040');
  drawWindowGrid(ctx, lm.x + 250, lm.y + 200, 700, 600, 5, 5, '#ffffe0');
  // Antenna
  ctx.fillStyle = '#aaaaaa';
  ctx.fillRect(lm.x + 575, lm.y + 100, 50, 100);
  ctx.restore();
};

// ── samsung-dlight ───────────────────────────────────────────
const drawSamsungDlight: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  const iw = lm.width - WALL * 2;
  const ih = lm.height - WALL * 2;
  // Blue exterior
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(lm.x + WALL, lm.y + WALL, iw, ih);
  // Samsung blue logo area at top
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(lm.x + WALL, lm.y + WALL, iw, 80);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAMSUNG', lm.x + lm.width / 2, lm.y + WALL + 58);
  // 3x2 showroom grid
  const productColors = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#f97316'];
  const roomW = (iw - 60) / 3;
  const roomH = (ih - 140) / 2;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const rx = lm.x + WALL + 20 + col * (roomW + 10);
      const ry = lm.y + WALL + 100 + row * (roomH + 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, roomW, roomH);
      ctx.fillStyle = productColors[row * 3 + col];
      ctx.fillRect(rx + roomW * 0.25, ry + roomH * 0.2, roomW * 0.5, roomH * 0.6);
    }
  }
  // Central open hall
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(lm.x + 400, lm.y + 300, 400, 400);
  ctx.restore();
};

// ── ewha ─────────────────────────────────────────────────────
const drawEwha: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  // ECC building (concrete)
  drawFloor(ctx, lm.x + 300, lm.y + WALL, 900, 700, '#6b7280');
  drawWindowGrid(ctx, lm.x + 300, lm.y + WALL, 900, 700, 5, 4, '#d1d5db');
  // Main hall (traditional+modern)
  drawFloor(ctx, lm.x + 1400, lm.y + WALL, 800, 600, '#d4b060');
  drawWindowGrid(ctx, lm.x + 1400, lm.y + WALL, 800, 600, 4, 3, '#fef3c7');
  // Campus green
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(lm.x + 200, lm.y + 900, 2000, 800);
  // 4 trees
  const treePositions = [400, 800, 1300, 1800];
  for (const tx of treePositions) {
    // trunk
    ctx.fillStyle = '#92400e';
    ctx.fillRect(lm.x + tx - 15, lm.y + 1100, 30, 150);
    // canopy
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(lm.x + tx, lm.y + 1060, 80, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fountain
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(lm.x + 1250, lm.y + 1100, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// ── cityhall ──────────────────────────────────────────────────
const drawCityhall: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  // Old city hall (colonial brown)
  drawFloor(ctx, lm.x + WALL, lm.y + WALL, 600, 800, '#b08040');
  drawWindowGrid(ctx, lm.x + WALL, lm.y + WALL, 600, 800, 4, 5, '#ffe4b5');
  // New city hall (wave shape — 3 stacked rects)
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(lm.x + 800, lm.y + WALL, 650, 200);
  ctx.fillRect(lm.x + 800, lm.y + WALL + 200, 680, 200);
  ctx.fillRect(lm.x + 800, lm.y + WALL + 400, 640, 200);
  drawWindowGrid(ctx, lm.x + 800, lm.y + WALL, 650, 600, 5, 4, '#bfdbfe');
  // Seoul Plaza — oval green
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(lm.x + lm.width / 2, lm.y + 950, lm.width * 0.4, 80, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

// ── gangnam-st ───────────────────────────────────────────────
const drawGangnamSt: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  const iw = lm.width - WALL * 2;
  // Subway floor
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(lm.x + WALL, lm.y + WALL, iw, lm.height - WALL * 2);
  // Platform 1
  ctx.fillStyle = '#475569';
  ctx.fillRect(lm.x + WALL, lm.y + 400, iw, 200);
  // Train tracks
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(lm.x + WALL, lm.y + 550, iw, 60);
  // Platform 2
  ctx.fillStyle = '#475569';
  ctx.fillRect(lm.x + WALL, lm.y + 700, iw, 200);
  // Concourse
  ctx.fillStyle = '#334155';
  ctx.fillRect(lm.x + WALL, lm.y + 1000, iw, 600);
  // 12 exit number circles around perimeter
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const exitAngles = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2 - Math.PI / 2);
  const cx = lm.x + lm.width / 2;
  const cy = lm.y + lm.height / 2;
  const er = Math.min(lm.width, lm.height) * 0.44;
  for (let i = 0; i < 12; i++) {
    const ex = cx + Math.cos(exitAngles[i]) * er;
    const ey = cy + Math.sin(exitAngles[i]) * er;
    ctx.beginPath();
    ctx.arc(ex, ey, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillText(String(i + 1), ex, ey);
    ctx.fillStyle = '#22d3ee';
  }
  ctx.restore();
};

// ── starfield ────────────────────────────────────────────────
const drawStarfield: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  const iw = lm.width - WALL * 2;
  const ih = lm.height - WALL * 2;
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(lm.x + WALL, lm.y + WALL, iw, ih);
  // Skylight top strip
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(lm.x + WALL, lm.y + WALL, iw, 100);
  // 5 bookshelf pillars
  const pillarW = 80;
  const pillarH = 800;
  const spacing = (iw - 5 * pillarW) / 6;
  const bookColors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
    '#ec4899', '#f97316', '#14b8a6', '#a3e635', '#e11d48',
  ];
  for (let p = 0; p < 5; p++) {
    const px = lm.x + WALL + spacing + p * (pillarW + spacing);
    const py = lm.y + WALL + 100;
    ctx.fillStyle = '#8b6914';
    ctx.fillRect(px, py, pillarW, pillarH);
    // Book rows (8px tall each)
    for (let b = 0; b < 60; b++) {
      ctx.fillStyle = bookColors[b % bookColors.length];
      ctx.fillRect(px + 4, py + 10 + b * 13, pillarW - 8, 8);
    }
  }
  ctx.restore();
};

// ── leeum ────────────────────────────────────────────────────
const drawLeeum: DrawFn = (ctx, lm, _tick, _WALL) => {
  ctx.save();
  // Building 1 — Mario Botta (terracotta)
  drawFloor(ctx, lm.x + WALL, lm.y + WALL, 380, 800, '#8b3a1a');
  // Botta: horizontal band windows
  ctx.fillStyle = '#c17a5a';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(lm.x + WALL + 20, lm.y + WALL + 40 + i * 95, 340, 50);
  }
  // Building 2 — Jean Nouvel (black steel)
  drawFloor(ctx, lm.x + 500, lm.y + WALL, 380, 800, '#1a1a1a');
  // Nouvel: scattered irregular windows
  const nouvelWins = [
    [20, 30, 80, 120], [200, 60, 60, 200], [80, 300, 120, 80],
    [160, 400, 80, 160], [40, 550, 200, 60], [250, 600, 60, 120],
  ];
  ctx.fillStyle = '#38bdf8';
  for (const [wx, wy, ww, wh] of nouvelWins) {
    ctx.fillRect(lm.x + 500 + wx, lm.y + WALL + wy, ww, wh);
  }
  // Building 3 — Rem Koolhaas (glass grey)
  drawFloor(ctx, lm.x + 1000, lm.y + WALL, 380, 800, '#9ca3af');
  // Koolhaas: full-height curtain wall grid
  drawWindowGrid(ctx, lm.x + 1000, lm.y + WALL, 380, 800, 4, 10, '#dbeafe');
  // Glass sheen on building 3
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(lm.x + 1000, lm.y + WALL, 380, 120);
  ctx.restore();
};

export const modernRenderers: RendererMap = new Map<string, DrawFn>([
  ['lotte-tower', drawLotteTower],
  ['n-tower', drawNTower],
  ['ddp', drawDdp],
  ['coex', drawCoex],
  ['63building', draw63Building],
  ['samsung-dlight', drawSamsungDlight],
  ['ewha', drawEwha],
  ['cityhall', drawCityhall],
  ['gangnam-st', drawGangnamSt],
  ['starfield', drawStarfield],
  ['leeum', drawLeeum],
]);
