// ══════════════════════════════════════════════════════
//  Market & Street Landmark Renderers
// ══════════════════════════════════════════════════════
import type { RendererMap, DrawFn } from './types';

const WALL = 120;

// ── helpers ──────────────────────────────────────────
function drawAwning(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  for (let i = 0; i < w; i += 40) ctx.fillRect(x + i, y, 20, h);
}

function drawStall(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  awningColor: string, bodyColor: string,
) {
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x, y + 40, w, h - 40);
  drawAwning(ctx, x - 10, y, w + 20, 48, awningColor);
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.arc(cx + 8, cy + 8, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#16a34a';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4ade80';
  ctx.beginPath(); ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.4, 0, Math.PI * 2); ctx.fill();
}

// ── myeongdong ────────────────────────────────────────
const drawMyeongdong: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;

  ctx.fillStyle = '#e5d8b0'; ctx.fillRect(iX, iY, iW, iH);
  ctx.fillStyle = '#d4c898'; ctx.fillRect(lm.x + iW * 0.35, iY, iW * 0.3, iH);
  ctx.fillStyle = '#b8a870';
  ctx.fillRect(lm.x + iW * 0.35, iY, 6, iH);
  ctx.fillRect(lm.x + iW * 0.65, iY, 6, iH);

  const awningColors = ['#ef4444','#f59e0b','#3b82f6','#ec4899','#10b981','#8b5cf6'];
  for (let i = 0; i < 6; i++) {
    const sy = iY + 80 + i * 240;
    drawStall(ctx, iX + 60, sy, 220, 180, awningColors[i % 6], '#f3e8d0');
    drawStall(ctx, iX + iW - 280, sy, 220, 180, awningColors[(i + 3) % 6], '#f3e8d0');
  }

  // Brand signs top
  const signColors = ['#fbbf24','#f87171','#60a5fa','#34d399','#c084fc'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = signColors[i]; ctx.fillRect(iX + 80 + i * 430, iY + 20, 180, 50);
    ctx.fillStyle = '#fff'; ctx.fillRect(iX + 100 + i * 430, iY + 30, 140, 30);
  }

  // Street lamps
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(lm.x + iW * 0.35 - 46, iY + 200 + i * 380, 12, 120);
    ctx.fillRect(lm.x + iW * 0.65 + 34, iY + 200 + i * 380, 12, 120);
    ctx.fillStyle = '#fde68a';
    ctx.beginPath(); ctx.arc(lm.x + iW * 0.35 - 40, iY + 200 + i * 380, 20, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(lm.x + iW * 0.65 + 40, iY + 200 + i * 380, 20, 0, Math.PI * 2); ctx.fill();
  }

  // Animated crowd
  const phase = tick * 0.04;
  ctx.fillStyle = '#78350f';
  for (let i = 0; i < 20; i++) {
    const cx = lm.x + iW * 0.38 + (i % 4) * 120 + Math.sin(phase + i) * 30;
    const cy = iY + 100 + Math.floor(i / 4) * 300 + Math.cos(phase + i * 0.7) * 20;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
};

// ── namdaemun ─────────────────────────────────────────
const drawNamdaemun: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#c8b890'; ctx.fillRect(iX, iY, iW, iH);

  // Sungnyemun gate
  const gX = lm.x + lm.width / 2 - 250, gY = iY + 60;
  ctx.fillStyle = '#8b6a40'; ctx.fillRect(gX, gY + 180, 500, 200);
  ctx.fillStyle = '#6b5030';
  ctx.beginPath(); ctx.ellipse(gX + 250, gY + 380, 120, 100, 0, Math.PI, Math.PI * 2); ctx.fill();
  const ri = 75;
  ctx.fillStyle = '#2d5a1f';
  ctx.beginPath();
  ctx.moveTo(gX, gY + 180); ctx.lineTo(gX + 500, gY + 180);
  ctx.lineTo(gX + 500 - ri, gY); ctx.lineTo(gX + ri, gY);
  ctx.closePath(); ctx.fill();

  // Stall grid
  const stallColors = ['#fde68a','#fca5a5','#a5f3fc','#bbf7d0','#e9d5ff'];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const sx = iX + 80 + col * 340, sy = iY + 500 + row * 330;
      if (sx + 260 > iX + iW) continue;
      drawStall(ctx, sx, sy, 260, 260, stallColors[(row * 5 + col) % 5], '#fffbeb');
    }
  }
  ctx.fillStyle = '#d4c898';
  for (let row = 1; row < 4; row++) ctx.fillRect(iX, iY + 470 + row * 330, iW, 30);
  ctx.restore();
};

// ── dongdaemun ────────────────────────────────────────
const drawDongdaemun: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#1e293b'; ctx.fillRect(iX, iY, iW, iH);

  ctx.fillStyle = '#6b7280';
  ctx.beginPath(); ctx.ellipse(lm.x + lm.width / 2, iY + 300, iW * 0.42, 260, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9ca3af';
  ctx.beginPath(); ctx.ellipse(lm.x + lm.width / 2, iY + 300, iW * 0.32, 200, 0, 0, Math.PI * 2); ctx.fill();

  const pulse = 0.4 + 0.6 * Math.sin(tick * 0.1);
  ctx.fillStyle = `rgba(255,100,200,${pulse})`; ctx.fillRect(iX, iY + 560, iW, 16);
  ctx.fillStyle = `rgba(100,200,255,${pulse})`; ctx.fillRect(iX, iY + 580, iW, 8);

  ctx.fillStyle = '#374151';
  ctx.fillRect(iX, iY + 650, iW * 0.45, iH - 650);
  ctx.fillRect(iX + iW * 0.55, iY + 650, iW * 0.45, iH - 650);
  const fashionColors = ['#f472b6','#818cf8','#34d399','#fb923c','#e879f9'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = fashionColors[i];
    ctx.fillRect(iX + 60 + i * 160, iY + 700, 120, 160);
    ctx.fillRect(iX + iW * 0.55 + 60 + i * 160, iY + 700, 120, 160);
  }
  ctx.restore();
};

// ── gwangjang ─────────────────────────────────────────
const drawGwangjang: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#92400e'; ctx.fillRect(iX, iY, iW, iH);
  ctx.fillStyle = '#78350f'; ctx.fillRect(iX, iY, iW, 80);

  const foodColors = ['#dc2626','#d97706','#16a34a','#9333ea','#0891b2'];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const sx = iX + 60 + col * 400, sy = iY + 120 + row * 490;
      if (sx + 320 > iX + iW) continue;
      const ci = (row * 4 + col) % foodColors.length;
      drawStall(ctx, sx, sy, 320, 400, foodColors[ci], '#fef3c7');
      const steamA = 0.3 + 0.2 * Math.sin(tick * 0.07 + ci);
      ctx.fillStyle = `rgba(255,255,255,${steamA})`;
      for (let s = 0; s < 3; s++) {
        ctx.beginPath(); ctx.arc(sx + 80 + s * 70, sy + 30 - s * 20, 12 + s * 4, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.fillStyle = '#b45309'; ctx.fillRect(lm.x + lm.width * 0.45, iY, lm.width * 0.1, iH);
  ctx.restore();
};

// ── noryangjin ────────────────────────────────────────
const drawNoryangjin: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2;
  ctx.fillStyle = '#0f172a'; ctx.fillRect(iX, iY, iW, lm.height - WALL * 2);

  const tanks: [number, number, number, number][] = [
    [iX + 80, iY + 80, 280, 200],[iX + 420, iY + 80, 280, 200],
    [iX + 760, iY + 80, 280, 200],[iX + 1100, iY + 80, 280, 200],
    [iX + 1440, iY + 80, 280, 200],[iX + 80, iY + 360, 280, 200],
    [iX + 420, iY + 360, 280, 200],[iX + 760, iY + 360, 280, 200],
    [iX + 1100, iY + 360, 280, 200],[iX + 1440, iY + 360, 280, 200],
  ];
  for (const [tx, ty, tw, th] of tanks) {
    ctx.fillStyle = '#1e3a5f'; ctx.fillRect(tx, ty, tw, th);
    const wave = 0.15 + 0.1 * Math.sin(tick * 0.06 + tx * 0.001);
    ctx.fillStyle = `rgba(56,189,248,${wave})`; ctx.fillRect(tx + 10, ty + th * 0.7, tw - 20, 20);
    ctx.fillStyle = '#38bdf8';
    for (let f = 0; f < 3; f++) {
      const fx = tx + 30 + f * 80 + Math.sin(tick * 0.05 + f) * 10;
      const fy = ty + th * 0.5 + Math.cos(tick * 0.05 + f) * 10;
      ctx.fillRect(fx, fy, 40, 16);
    }
  }
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#e0f2fe'; ctx.fillRect(iX + 80 + i * 420, iY + 640, 340, 120);
    ctx.fillStyle = '#7dd3fc'; ctx.fillRect(iX + 100 + i * 420, iY + 660, 300, 60);
  }
  ctx.restore();
};

// ── itaewon ───────────────────────────────────────────
const drawItaewon: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#1c1917'; ctx.fillRect(iX, iY, iW, iH);

  ctx.fillStyle = '#292524'; ctx.fillRect(iX + iW * 0.3, iY, iW * 0.4, iH);
  ctx.fillStyle = '#fde047';
  for (let y = iY; y < iY + iH; y += 160) ctx.fillRect(lm.x + lm.width / 2 - 10, y, 20, 100);

  const rColors = ['#dc2626','#7c3aed','#0ea5e9','#d97706','#16a34a'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = rColors[i]; ctx.fillRect(iX + 40, iY + 80 + i * 240, 220, 200);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(iX + 40, iY + 80 + i * 240, 220, 40);
    ctx.fillStyle = rColors[(i + 2) % 5]; ctx.fillRect(iX + iW - 260, iY + 80 + i * 240, 220, 200);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(iX + iW - 260, iY + 80 + i * 240, 220, 40);
  }
  for (let i = 0; i < 4; i++) {
    drawTree(ctx, iX + iW * 0.3 - 60, iY + 200 + i * 300, 45);
    drawTree(ctx, iX + iW * 0.7 + 60, iY + 200 + i * 300, 45);
  }
  ctx.restore();
};

// ── hongdae ───────────────────────────────────────────
const drawHongdae: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#1e1b4b'; ctx.fillRect(iX, iY, iW, iH);

  const murals = ['#f472b6','#818cf8','#34d399','#fb923c','#e879f9','#22d3ee'];
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = murals[i % murals.length]; ctx.fillRect(iX + 20, iY + 60 + i * 230, 200, 200);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(iX + 120, iY + 160 + i * 230, 60, 0, Math.PI * 2); ctx.fill();
  }

  const clubColors = ['#7c3aed','#be185d','#0369a1','#4d7c0f','#b45309'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = clubColors[i]; ctx.fillRect(iX + iW - 420, iY + 60 + i * 360, 380, 300);
    const na = 0.5 + 0.5 * Math.sin(tick * 0.1 + i);
    ctx.fillStyle = `rgba(255,255,255,${na})`; ctx.fillRect(iX + iW - 400, iY + 70 + i * 360, 340, 40);
  }

  // Busker stage
  ctx.fillStyle = '#312e81'; ctx.fillRect(iX + 240, iY + iH * 0.3, iW - 660, iH * 0.4);
  ctx.fillStyle = '#6d28d9'; ctx.fillRect(lm.x + lm.width / 2 - 200, iY + iH * 0.3 + 60, 400, 200);
  ctx.fillStyle = `rgba(253,224,71,${0.2 + 0.1 * Math.sin(tick * 0.08)})`;
  ctx.fillRect(lm.x + lm.width / 2 - 200, iY + iH * 0.3, 160, 60);
  ctx.fillRect(lm.x + lm.width / 2 + 40, iY + iH * 0.3, 160, 60);
  ctx.restore();
};

// ── mangwon ───────────────────────────────────────────
const drawMangwon: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#92400e'; ctx.fillRect(iX, iY, iW, iH);
  ctx.fillStyle = '#78350f'; ctx.fillRect(iX, iY, iW, 60);

  const colors = ['#fbbf24','#f87171','#86efac','#a78bfa','#67e8f9','#fda4af','#d9f99d','#bfdbfe','#fde68a'];
  const sw = (iW - 120) / 3 - 20, sh = (iH - 80) / 3 - 20;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const sx = iX + 60 + c * ((iW - 120) / 3);
      const sy = iY + 80 + r * ((iH - 80) / 3);
      drawStall(ctx, sx, sy, sw, sh, colors[r * 3 + c], '#fef3c7');
    }
  }
  ctx.restore();
};

// ── garosugil ─────────────────────────────────────────
const drawGarosugil: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(iX, iY, iW, iH);
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(lm.x + lm.width / 2 - 150, iY, 300, iH);

  for (let i = 0; i < 8; i++) {
    const ty = iY + 150 + i * 270;
    drawTree(ctx, lm.x + lm.width / 2 - 180, ty, 55);
    drawTree(ctx, lm.x + lm.width / 2 + 180, ty, 55);
  }

  const bc = ['#fce7f3','#ede9fe','#d1fae5','#dbeafe','#fff7ed'];
  for (let i = 0; i < 5; i++) {
    const sy = iY + 100 + i * 440;
    ctx.fillStyle = bc[i % 5]; ctx.fillRect(iX + 30, sy, iW * 0.32, 380);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(iX + 40, sy + 10, iW * 0.32 - 20, 60);
    ctx.fillStyle = bc[(i + 2) % 5]; ctx.fillRect(iX + iW - 30 - iW * 0.32, sy, iW * 0.32, 380);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(iX + iW - 20 - iW * 0.32, sy + 10, iW * 0.32 - 20, 60);
  }
  ctx.restore();
};

// ── apgujeong ─────────────────────────────────────────
const drawApgujeong: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#f1f5f9'; ctx.fillRect(iX, iY, iW, iH);
  ctx.fillStyle = '#94a3b8'; ctx.fillRect(iX + iW * 0.35, iY, iW * 0.3, iH);

  const lc = ['#1e293b','#0c1a2e','#1a1a2e','#18181b'];
  for (let i = 0; i < 4; i++) {
    const sy = iY + 60 + i * 330;
    ctx.fillStyle = lc[i % 4]; ctx.fillRect(iX + 30, sy, iW * 0.3, 280);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(iX + 30, sy, iW * 0.3, 10);
    ctx.fillRect(iX + 30, sy + 270, iW * 0.3, 10);
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(iX + 60, sy + 50, iW * 0.3 - 60, 150);

    ctx.fillStyle = lc[(i + 2) % 4]; ctx.fillRect(iX + iW * 0.7 - 30, sy, iW * 0.3, 280);
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(iX + iW * 0.7 - 30, sy, iW * 0.3, 10);
    ctx.fillRect(iX + iW * 0.7 - 30, sy + 270, iW * 0.3, 10);
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(iX + iW * 0.7, sy + 50, iW * 0.3 - 60, 150);
  }
  ctx.restore();
};

// ── kstar ─────────────────────────────────────────────
const drawKstar: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#1e1b4b'; ctx.fillRect(iX, iY, iW, iH);
  ctx.fillStyle = '#312e81'; ctx.fillRect(lm.x + lm.width / 2 - 120, iY, 240, iH);

  const sp = 0.5 + 0.5 * Math.sin(tick * 0.07);
  ctx.fillStyle = `rgba(253,224,71,${sp})`;
  for (let i = 0; i < 8; i++) {
    const ty = iY + 120 + i * 220;
    ctx.beginPath(); ctx.arc(lm.x + lm.width / 2 - 60, ty, 40, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(lm.x + lm.width / 2 + 60, ty, 40, 0, Math.PI * 2); ctx.fill();
  }

  const idolColors = ['#f472b6','#a78bfa','#34d399','#fb923c','#e879f9','#22d3ee'];
  for (let i = 0; i < 6; i++) {
    const sx = (i % 2 === 0) ? iX + 60 : iX + iW - 200;
    const sy = iY + 80 + i * 300;
    ctx.fillStyle = '#4338ca'; ctx.fillRect(sx, sy + 120, 140, 60);
    ctx.fillStyle = idolColors[i];
    ctx.fillRect(sx + 40, sy + 40, 60, 80);
    ctx.beginPath(); ctx.arc(sx + 70, sy + 25, 30, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
};

// ── lotte-world ───────────────────────────────────────
const drawLotteWorld: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#14532d'; ctx.fillRect(iX, iY, iW, iH);

  // Ferris wheel
  const fwCx = lm.x + lm.width * 0.75, fwCy = lm.y + lm.height * 0.4, fwR = 500;
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 20;
  ctx.beginPath(); ctx.arc(fwCx, fwCy, fwR, 0, Math.PI * 2); ctx.stroke();
  const cabinAngle = tick * 0.015;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + cabinAngle;
    ctx.fillStyle = ['#ef4444','#f59e0b','#3b82f6','#10b981'][i % 4];
    ctx.fillRect(fwCx + Math.cos(a) * fwR - 20, fwCy + Math.sin(a) * fwR - 20, 40, 40);
  }
  ctx.fillStyle = '#475569';
  ctx.beginPath(); ctx.arc(fwCx, fwCy, 40, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(fwCx - 20, fwCy + fwR, 40, 400);

  // Castle
  const caX = lm.x + 200, caY = iY + 100;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(caX + 100, caY + 300, 500, 400);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(caX + 50, caY + 200, 150, 500);
  ctx.fillRect(caX + 500, caY + 200, 150, 500);
  ctx.fillRect(caX + 250, caY + 80, 200, 620);
  for (const [tx, ty] of [[caX + 50, caY + 180],[caX + 500, caY + 180],[caX + 250, caY + 60]] as [number,number][]) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(tx, ty + 80); ctx.lineTo(tx + 80, ty + 80); ctx.lineTo(tx + 40, ty); ctx.closePath(); ctx.fill();
  }

  // Roller coaster
  ctx.fillStyle = '#475569';
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 1.5 + Math.PI * 0.25;
    const rcx = lm.x + lm.width * 0.35, rcy = lm.y + lm.height * 0.65;
    ctx.fillRect(rcx + Math.cos(a) * 600 - 15, rcy + Math.sin(a) * 360 - 15, 30, 30);
  }

  // Lake
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath(); ctx.ellipse(lm.x + lm.width * 0.5, lm.y + lm.height * 0.65, 400, 280, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
};

// ── Export ────────────────────────────────────────────
export const marketRenderers: RendererMap = new Map<string, DrawFn>([
  ['myeongdong',  drawMyeongdong],
  ['namdaemun',   drawNamdaemun],
  ['dongdaemun',  drawDongdaemun],
  ['gwangjang',   drawGwangjang],
  ['noryangjin',  drawNoryangjin],
  ['itaewon',     drawItaewon],
  ['hongdae',     drawHongdae],
  ['mangwon',     drawMangwon],
  ['garosugil',   drawGarosugil],
  ['apgujeong',   drawApgujeong],
  ['kstar',       drawKstar],
  ['lotte-world', drawLotteWorld],
]);
