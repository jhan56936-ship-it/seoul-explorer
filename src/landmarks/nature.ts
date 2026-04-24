// ══════════════════════════════════════════════════════
//  Nature, Park & Cultural Landmark Renderers
// ══════════════════════════════════════════════════════
import type { RendererMap, DrawFn } from './types';

const WALL = 120;

// ── helpers ──────────────────────────────────────────
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

function drawKoreanRoof(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, roofColor: string,
) {
  const inset = w * 0.15;
  ctx.fillStyle = roofColor;
  ctx.beginPath();
  ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - inset, y); ctx.lineTo(x + inset, y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    ctx.fillRect(x + inset * t, y + h * t, w - inset * t * 2, 5);
  }
}

// ── cheonggye — 청계천 (4000×600, narrow stream) ──────
const drawCheonggye: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;

  // Embankment (stone walkway)
  ctx.fillStyle = '#c8b890'; ctx.fillRect(iX, iY, iW, iH);

  // Water channel (center 40%)
  const wY = iY + iH * 0.3, wH = iH * 0.4;
  ctx.fillStyle = '#38bdf8'; ctx.fillRect(iX, wY, iW, wH);
  // Animated ripples
  for (let i = 0; i < 8; i++) {
    const wave = Math.sin(tick * 0.06 + i * 0.8);
    const rx = iX + (i / 8) * iW;
    ctx.fillStyle = `rgba(186,230,253,${0.15 + 0.1 * wave})`;
    ctx.fillRect(rx, wY + wH * 0.3, iW / 10, 12);
  }
  // Stepping stones
  ctx.fillStyle = '#9ca3af';
  for (let i = 0; i < 10; i++) {
    ctx.fillRect(iX + 80 + i * (iW / 10), wY + wH * 0.4, 80, 40);
  }

  // Willow trees along banks
  for (let i = 0; i < 6; i++) {
    const tx = iX + 100 + i * (iW / 6);
    drawTree(ctx, tx, iY + iH * 0.15, 50);
    drawTree(ctx, tx, iY + iH * 0.85, 50);
  }

  // Waterfall start (left edge): white vertical band
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(iX, wY, 40, wH);

  ctx.restore();
};

// ── haneul — 하늘공원 (2000×2000) ────────────────────
const drawHaneul: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;

  // Green hillside
  ctx.fillStyle = '#4ade80'; ctx.fillRect(iX, iY, iW, iH);
  // Grass gradient bands
  ctx.fillStyle = '#22c55e'; ctx.fillRect(iX, iY + iH * 0.5, iW, iH * 0.5);

  // Pampas grass (waving reeds)
  for (let i = 0; i < 20; i++) {
    const rx = iX + 60 + i * (iW / 20);
    const sway = Math.sin(tick * 0.05 + i * 0.4) * 20;
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(rx, iY + iH * 0.6);
    ctx.quadraticCurveTo(rx + sway, iY + iH * 0.4, rx + sway * 0.5, iY + iH * 0.25);
    ctx.stroke();
    // Reed top
    ctx.fillStyle = '#c4a15a';
    ctx.fillRect(rx + sway * 0.5 - 8, iY + iH * 0.22, 16, 40);
  }

  // Windmills (5)
  for (let i = 0; i < 5; i++) {
    const wx = iX + 200 + i * (iW / 5);
    const wy = iY + 200;
    // Pole
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(wx - 8, wy, 16, 300);
    // Blades (rotate with tick)
    const bladeAngle = tick * 0.03 + (i * Math.PI * 2) / 5;
    ctx.fillStyle = '#f8fafc';
    for (let b = 0; b < 4; b++) {
      const ba = bladeAngle + (b * Math.PI) / 2;
      ctx.save();
      ctx.translate(wx, wy);
      ctx.rotate(ba);
      ctx.fillRect(-10, -100, 20, 90);
      ctx.restore();
    }
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.arc(wx, wy, 20, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
};

// ── yeouido — 여의도 한강공원 (3000×2000) ─────────────
const drawYeouido: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;

  // Park green
  ctx.fillStyle = '#22c55e'; ctx.fillRect(iX, iY, iW, iH);

  // Han River bank (bottom 30%)
  ctx.fillStyle = '#60a5fa'; ctx.fillRect(iX, iY + iH * 0.7, iW, iH * 0.3);
  const wave = Math.sin(tick * 0.04) * 0.05;
  ctx.fillStyle = `rgba(147,197,253,${0.3 + wave})`;
  ctx.fillRect(iX, iY + iH * 0.7, iW, 20);

  // Bike path
  ctx.fillStyle = '#f87171'; ctx.fillRect(iX, iY + iH * 0.55, iW, 30);
  ctx.fillStyle = '#fca5a5';
  for (let i = 0; i < 10; i++) ctx.fillRect(iX + i * (iW / 10), iY + iH * 0.55, iW / 20, 30);

  // Cherry blossom trees (spring)
  for (let i = 0; i < 10; i++) {
    const tx = iX + 150 + i * (iW / 10);
    ctx.fillStyle = '#92400e'; ctx.fillRect(tx - 10, iY + iH * 0.3, 20, 120);
    ctx.fillStyle = '#fda4af';
    ctx.beginPath(); ctx.arc(tx, iY + iH * 0.27, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fecdd3';
    ctx.beginPath(); ctx.arc(tx - 20, iY + iH * 0.24, 35, 0, Math.PI * 2); ctx.fill();
  }

  // Fountain (center)
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(lm.x + lm.width / 2, iY + iH * 0.35, 80, 0, Math.PI * 2); ctx.fill();
  const fPulse = 0.4 + 0.3 * Math.sin(tick * 0.08);
  ctx.fillStyle = `rgba(186,230,253,${fPulse})`;
  ctx.beginPath(); ctx.arc(lm.x + lm.width / 2, iY + iH * 0.35 - 40, 30, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
};

// ── banpo — 반포 무지개분수 (2000×500, narrow) ─────────
const drawBanpo: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;

  // Bridge deck
  ctx.fillStyle = '#9ca3af'; ctx.fillRect(iX, iY, iW, iH);
  // Lanes
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(iX, iY + iH * 0.3, iW, iH * 0.15);
  ctx.fillRect(iX, iY + iH * 0.55, iW, iH * 0.15);

  // Rainbow fountain jets (alternating colors)
  const rainbow = ['#ef4444','#f97316','#fde047','#4ade80','#38bdf8','#818cf8','#e879f9'];
  for (let i = 0; i < 20; i++) {
    const jx = iX + 60 + i * (iW / 20);
    const jColor = rainbow[i % rainbow.length];
    const jHeight = 60 + 40 * Math.sin(tick * 0.07 + i * 0.5);
    ctx.fillStyle = jColor + '99';
    ctx.fillRect(jx - 6, iY + iH - jHeight, 12, jHeight);
  }

  // Han River below (blue)
  ctx.fillStyle = '#0ea5e9'; ctx.fillRect(iX, iY + iH * 0.75, iW, iH * 0.25);

  ctx.restore();
};

// ── seokchon — 석촌호수 (2500×2500) ──────────────────
const drawSeokchon: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  const cx = lm.x + lm.width / 2, cy = lm.y + lm.height / 2;

  // Park surround
  ctx.fillStyle = '#22c55e'; ctx.fillRect(iX, iY, iW, iH);

  // Lake (main ellipse)
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath(); ctx.ellipse(cx, cy, iW * 0.42, iH * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  // Shimmer
  const shimmer = 0.15 + 0.1 * Math.sin(tick * 0.05);
  ctx.fillStyle = `rgba(186,230,253,${shimmer})`;
  ctx.beginPath(); ctx.ellipse(cx - 100, cy - 100, iW * 0.15, iH * 0.08, -0.3, 0, Math.PI * 2); ctx.fill();

  // Center island
  ctx.fillStyle = '#16a34a';
  ctx.beginPath(); ctx.ellipse(cx, cy, iW * 0.1, iH * 0.1, 0, 0, Math.PI * 2); ctx.fill();

  // Cherry blossom path around lake
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const tx = cx + Math.cos(angle) * iW * 0.44;
    const ty = cy + Math.sin(angle) * iH * 0.44;
    ctx.fillStyle = '#92400e'; ctx.fillRect(tx - 8, ty - 60, 16, 60);
    ctx.fillStyle = '#fda4af';
    ctx.beginPath(); ctx.arc(tx, ty - 70, 50, 0, Math.PI * 2); ctx.fill();
  }

  // Lotte World Tower visible (top-right corner)
  ctx.fillStyle = '#1e3a5f'; ctx.fillRect(iX + iW - 80, iY + 80, 60, iH * 0.5);
  ctx.fillStyle = '#60a5fa'; ctx.fillRect(iX + iW - 70, iY + 60, 40, 100);

  ctx.restore();
};

// ── olympic — 올림픽공원 (3000×3000) ──────────────────
const drawOlympic: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#16a34a'; ctx.fillRect(iX, iY, iW, iH);

  // Olympic stadium (top center)
  const sX = lm.x + lm.width / 2 - 500, sY = iY + 100;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(sX, sY, 1000, 600);
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath(); ctx.ellipse(sX + 500, sY + 300, 480, 280, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath(); ctx.ellipse(sX + 500, sY + 320, 360, 200, 0, 0, Math.PI * 2); ctx.fill();
  // Olympic rings (5 circles)
  const ringColors = ['#3b82f6','#f59e0b','#1e1e1e','#22c55e','#ef4444'];
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = ringColors[i]; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(sX + 150 + i * 180, sY + 650, 60, 0, Math.PI * 2); ctx.stroke();
  }

  // Mongchon Toseong earthen wall (diagonal)
  ctx.fillStyle = '#92400e';
  for (let i = 0; i < 15; i++) {
    ctx.fillRect(iX + 80 + i * 180, iY + iH * 0.55 + i * 30, 140, 40);
  }

  // Park paths
  ctx.fillStyle = '#d4c898';
  ctx.fillRect(iX, iY + iH * 0.5, iW, 20);
  ctx.fillRect(lm.x + lm.width / 2 - 10, iY, 20, iH);

  // Trees
  for (let i = 0; i < 8; i++) {
    drawTree(ctx, iX + 200 + i * 340, iY + iH * 0.7, 60);
  }

  ctx.restore();
};

// ── seoul-forest — 서울숲 (3000×3000) ────────────────
const drawSeoulForest: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#14532d'; ctx.fillRect(iX, iY, iW, iH);

  // Deer meadow (center clearing)
  ctx.fillStyle = '#4ade80';
  ctx.beginPath(); ctx.ellipse(lm.x + lm.width / 2, lm.y + lm.height / 2, 800, 600, 0, 0, Math.PI * 2); ctx.fill();

  // Deer (simple pixel shapes)
  const deerPos: [number, number][] = [[lm.x + lm.width / 2 - 300, lm.y + lm.height / 2 - 100],[lm.x + lm.width / 2 + 100, lm.y + lm.height / 2 + 50],[lm.x + lm.width / 2 - 100, lm.y + lm.height / 2 + 150]];
  for (const [dx, dy] of deerPos) {
    ctx.fillStyle = '#d97706';
    ctx.fillRect(dx, dy, 60, 40); // body
    ctx.fillRect(dx + 45, dy - 30, 30, 35); // neck+head
    // antlers
    ctx.fillStyle = '#92400e';
    ctx.fillRect(dx + 48, dy - 55, 6, 25);
    ctx.fillRect(dx + 60, dy - 55, 6, 25);
    ctx.fillRect(dx + 48, dy - 55, 18, 6);
  }

  // Tree grid
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const tx = iX + 200 + c * (iW / 5);
      const ty = iY + 200 + r * (iH / 5);
      if (Math.abs(tx - (lm.x + lm.width / 2)) < 900 && Math.abs(ty - (lm.y + lm.height / 2)) < 700) continue;
      drawTree(ctx, tx, ty, 70);
    }
  }

  ctx.restore();
};

// ── ttukseom — 뚝섬유원지 (2000×2000) ────────────────
const drawTtukseom: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#22c55e'; ctx.fillRect(iX, iY, iW, iH);

  // Han River (bottom)
  ctx.fillStyle = '#0ea5e9'; ctx.fillRect(iX, iY + iH * 0.65, iW, iH * 0.35);

  // Outdoor pool (top-left)
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.ellipse(lm.x + lm.width * 0.25, lm.y + lm.height * 0.3, 300, 200, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(186,230,253,0.5)';
  ctx.beginPath(); ctx.ellipse(lm.x + lm.width * 0.23, lm.y + lm.height * 0.28, 150, 80, -0.3, 0, Math.PI * 2); ctx.fill();

  // Camping area (right): tent triangles
  for (let i = 0; i < 5; i++) {
    const tx = iX + iW * 0.6 + (i % 3) * 200;
    const ty = iY + 200 + Math.floor(i / 3) * 250;
    ctx.fillStyle = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#ec4899'][i];
    ctx.beginPath();
    ctx.moveTo(tx, ty); ctx.lineTo(tx + 140, ty); ctx.lineTo(tx + 70, ty - 100);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.fillRect(tx + 50, ty - 20, 40, 20);
  }

  // Watercraft animation on river
  const bx = iX + (tick * 2) % iW;
  ctx.fillStyle = '#f8fafc'; ctx.fillRect(bx, iY + iH * 0.72, 80, 30);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(bx + 20, iY + iH * 0.66, 40, 30);

  ctx.restore();
};

// ── seoul-np — 서울대공원 (4000×4000) ────────────────
const drawSeoulNp: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#15803d'; ctx.fillRect(iX, iY, iW, iH);

  // Zoo lake (center)
  ctx.fillStyle = '#0284c7';
  ctx.beginPath(); ctx.ellipse(lm.x + lm.width / 2, lm.y + lm.height / 2, 700, 500, 0, 0, Math.PI * 2); ctx.fill();

  // Animal enclosures (rectangle clusters)
  const encColors = ['#fde68a','#fca5a5','#bbf7d0','#e9d5ff','#fdd6a0','#c7d2fe'];
  const encs: [number, number, number, number][] = [
    [iX + 200, iY + 200, 500, 400],   // lion/tiger
    [iX + 800, iY + 200, 400, 400],   // elephant
    [iX + 1400, iY + 200, 500, 400],  // giraffe
    [iX + 2000, iY + 200, 400, 400],  // bear
    [iX + 200, iY + 800, 500, 400],   // penguin
    [iX + 800, iY + 2400, 800, 500],  // dolphin
  ];
  for (let i = 0; i < encs.length; i++) {
    const [ex, ey, ew, eh] = encs[i];
    ctx.fillStyle = encColors[i]; ctx.fillRect(ex, ey, ew, eh);
    ctx.strokeStyle = '#475569'; ctx.lineWidth = 8;
    ctx.strokeRect(ex, ey, ew, eh);
  }

  // Gondola cable
  ctx.strokeStyle = '#374151'; ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(iX + 200, iY + 1400);
  ctx.lineTo(iX + iW - 200, iY + 800);
  ctx.stroke();
  // Gondola cars
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const gx = iX + 200 + t * (iW - 400);
    const gy = iY + 1400 - t * 600;
    ctx.fillStyle = '#ef4444'; ctx.fillRect(gx - 20, gy - 20, 40, 30);
  }

  // Cherry blossom path
  for (let i = 0; i < 12; i++) {
    drawTree(ctx, iX + 300 + i * 280, iY + iH - 300, 65);
  }

  ctx.restore();
};

// ── botanic — 서울식물원 (3000×3000) ──────────────────
const drawBotanic: DrawFn = (ctx, lm, tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#4ade80'; ctx.fillRect(iX, iY, iW, iH);

  // Greenhouse dome (center)
  const domeCx = lm.x + lm.width / 2, domeCy = lm.y + lm.height * 0.45;
  ctx.fillStyle = 'rgba(186,230,253,0.6)';
  ctx.beginPath(); ctx.ellipse(domeCx, domeCy, 700, 500, 0, 0, Math.PI * 2); ctx.fill();
  // Dome grid lines
  ctx.strokeStyle = 'rgba(148,163,184,0.7)'; ctx.lineWidth = 6;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(domeCx, domeCy); ctx.lineTo(domeCx + Math.cos(a) * 700, domeCy + Math.sin(a) * 500); ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(domeCx, domeCy, 350, 250, 0, 0, Math.PI * 2); ctx.stroke();
  // Tropical plants inside (colored blobs)
  const plantColors = ['#15803d','#166534','#14532d','#365314','#4d7c0f'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.fillStyle = plantColors[i % 5];
    ctx.beginPath(); ctx.arc(domeCx + Math.cos(a) * 400, domeCy + Math.sin(a) * 280, 60, 0, Math.PI * 2); ctx.fill();
  }

  // Wetland garden (bottom-left)
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath(); ctx.ellipse(iX + 500, iY + iH - 400, 380, 250, 0, 0, Math.PI * 2); ctx.fill();
  // Lily pads (animated)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + tick * 0.01;
    ctx.fillStyle = '#16a34a';
    ctx.beginPath(); ctx.arc(iX + 500 + Math.cos(a) * 200, iY + iH - 400 + Math.sin(a) * 140, 40, 0, Math.PI * 2); ctx.fill();
  }

  // Arboretum path spiral
  ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 20;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 4; a += 0.1) {
    const r = 100 + a * 150;
    const px = iX + 100 + r * Math.cos(a);
    const py = iY + 100 + r * Math.sin(a) * 0.5;
    if (px > iX + iW || py > iY + iH) break;
    if (a < 0.01) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();

  ctx.restore();
};

// ── m-cathedral — 명동성당 (1200×1500) ───────────────
const drawMCathedral: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#d4c898'; ctx.fillRect(iX, iY, iW, iH);

  // Main nave (grey stone)
  ctx.fillStyle = '#9ca3af'; ctx.fillRect(iX + 200, iY + 300, 800, 900);
  // Gothic windows (pointed arches)
  ctx.fillStyle = '#bfdbfe';
  for (let i = 0; i < 5; i++) {
    const wx = iX + 260 + i * 140;
    ctx.fillRect(wx, iY + 400, 80, 200);
    ctx.beginPath(); ctx.arc(wx + 40, iY + 400, 40, Math.PI, Math.PI * 2); ctx.fill();
  }

  // Twin towers (front)
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(iX + 200, iY + 100, 180, 400);
  ctx.fillRect(iX + 820, iY + 100, 180, 400);
  // Spires
  ctx.fillStyle = '#374151';
  ctx.beginPath(); ctx.moveTo(iX + 200, iY + 100); ctx.lineTo(iX + 290, iY - 80); ctx.lineTo(iX + 380, iY + 100); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(iX + 820, iY + 100); ctx.lineTo(iX + 910, iY - 80); ctx.lineTo(iX + 1000, iY + 100); ctx.closePath(); ctx.fill();

  // Rose window (circle)
  ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.arc(lm.x + lm.width / 2, iY + 280, 80, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 8;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(lm.x + lm.width / 2, iY + 280); ctx.lineTo(lm.x + lm.width / 2 + Math.cos(a) * 80, iY + 280 + Math.sin(a) * 80); ctx.stroke();
  }

  ctx.restore();
};

// ── insadong — 인사동 (1800×2000) ────────────────────
const drawInsadong: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#d4c098'; ctx.fillRect(iX, iY, iW, iH);

  // Cobblestone central alley
  ctx.fillStyle = '#a89870'; ctx.fillRect(lm.x + lm.width * 0.35, iY, lm.width * 0.3, iH);
  ctx.fillStyle = '#8a7850';
  for (let y = iY; y < iY + iH; y += 80) {
    ctx.fillRect(lm.x + lm.width * 0.35, y, lm.width * 0.3, 6);
  }

  // Art shops (left)
  const artColors = ['#fde68a','#fca5a5','#bbf7d0','#e9d5ff','#fdd6a0'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = artColors[i]; ctx.fillRect(iX + 30, iY + 80 + i * 360, 280, 300);
    ctx.fillStyle = '#8b4513'; ctx.fillRect(iX + 30, iY + 80 + i * 360, 280, 50);
    // Craft display
    ctx.fillStyle = '#d97706'; ctx.fillRect(iX + 60, iY + 150 + i * 360, 80, 80);
    ctx.fillStyle = '#7c3aed'; ctx.fillRect(iX + 180, iY + 150 + i * 360, 80, 80);
  }
  // Tea houses (right)
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = artColors[(i + 2) % 5]; ctx.fillRect(iX + iW - 310, iY + 80 + i * 360, 280, 300);
    drawKoreanRoof(ctx, iX + iW - 310, iY + 60 + i * 360, 280, 60, '#2d5a1f');
  }
  ctx.restore();
};

// ── seodaemun — 서대문형무소 (2000×2000) ──────────────
const drawSeodaemun: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#e5e7eb'; ctx.fillRect(iX, iY, iW, iH);

  // Main prison building (dark brick)
  ctx.fillStyle = '#57534e'; ctx.fillRect(iX + 300, iY + 200, 1400, 1000);
  ctx.fillStyle = '#78716c';
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 15; c++) {
      ctx.fillRect(iX + 310 + c * 93, iY + 210 + r * 98, 80, 10);
    }
  }
  // Cell windows (barred, dark)
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      ctx.fillStyle = '#1c1917'; ctx.fillRect(iX + 360 + c * 170, iY + 280 + r * 220, 80, 100);
      ctx.fillStyle = '#57534e';
      for (let bar = 0; bar < 3; bar++) ctx.fillRect(iX + 370 + c * 170 + bar * 26, iY + 280 + r * 220, 8, 100);
    }
  }
  // Guard tower (right)
  ctx.fillStyle = '#374151'; ctx.fillRect(iX + iW - 200, iY + 100, 160, 300);
  ctx.fillStyle = '#1f2937'; ctx.fillRect(iX + iW - 220, iY + 80, 200, 60);

  ctx.restore();
};

// ── national-mus — 국립중앙박물관 (3000×2500) ─────────
const drawNationalMus: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#f3f4f6'; ctx.fillRect(iX, iY, iW, iH);

  // Main building (long horizontal)
  ctx.fillStyle = '#c8b890'; ctx.fillRect(iX + 100, iY + 300, iW - 200, 1200);
  // Pillar colonnade
  ctx.fillStyle = '#9ca3af';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(iX + 150 + i * (iW - 300) / 12, iY + 300, 40, 1200);
  }
  // Roof band
  ctx.fillStyle = '#a8a29e'; ctx.fillRect(iX + 100, iY + 300, iW - 200, 60);

  // Central entrance portal
  ctx.fillStyle = '#78716c'; ctx.fillRect(lm.x + lm.width / 2 - 200, iY + 600, 400, 900);
  ctx.fillStyle = '#57534e';
  ctx.beginPath(); ctx.arc(lm.x + lm.width / 2, iY + 600, 200, Math.PI, Math.PI * 2); ctx.fill();

  // Museum pond (front)
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath(); ctx.ellipse(lm.x + lm.width / 2, iY + 100, iW * 0.3, 80, 0, 0, Math.PI * 2); ctx.fill();

  // Namsan background hint
  ctx.fillStyle = '#4ade80'; ctx.fillRect(iX, iY + iH - 200, iW, 200);

  ctx.restore();
};

// ── war-mem — 전쟁기념관 (2500×2500) ─────────────────
const drawWarMem: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#e5e7eb'; ctx.fillRect(iX, iY, iW, iH);

  // Main memorial building
  ctx.fillStyle = '#94a3b8'; ctx.fillRect(iX + 500, iY + 200, 1500, 1000);
  ctx.fillStyle = '#64748b'; ctx.fillRect(iX + 500, iY + 200, 1500, 80);
  // Columns
  ctx.fillStyle = '#cbd5e1';
  for (let i = 0; i < 8; i++) ctx.fillRect(iX + 600 + i * 180, iY + 280, 50, 920);

  // Outdoor exhibits: tanks & planes
  // Tank (left)
  ctx.fillStyle = '#4b5563'; ctx.fillRect(iX + 100, iY + iH - 400, 280, 120);
  ctx.fillStyle = '#374151'; ctx.fillRect(iX + 250, iY + iH - 450, 180, 60);
  ctx.fillRect(iX + 380, iY + iH - 440, 120, 30); // barrel
  // Plane (right)
  ctx.fillStyle = '#9ca3af'; ctx.fillRect(iX + iW - 400, iY + iH - 350, 300, 60);
  ctx.fillRect(iX + iW - 340, iY + iH - 420, 160, 70); // fuselage
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(iX + iW - 440, iY + iH - 340, 400, 20); // wings

  // Fountain plaza
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(lm.x + lm.width / 2, iY + iH * 0.7, 200, 0, Math.PI * 2); ctx.fill();

  // Brotherhood statue (center front)
  ctx.fillStyle = '#78716c'; ctx.fillRect(lm.x + lm.width / 2 - 60, iY + iH * 0.55, 120, 40);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(lm.x + lm.width / 2 - 40, iY + iH * 0.55 - 120, 30, 120);
  ctx.fillRect(lm.x + lm.width / 2 + 10, iY + iH * 0.55 - 100, 30, 100);

  ctx.restore();
};

// ── seoul-arts — 예술의전당 (3000×2500) ───────────────
const drawSeoulArts: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#f0f9ff'; ctx.fillRect(iX, iY, iW, iH);

  // Opera House — iconic hat-roof shape
  const oX = iX + 500, oY = iY + 200;
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(oX, oY + 300, 900, 700);
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath(); ctx.ellipse(oX + 450, oY + 300, 450, 250, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath(); ctx.ellipse(oX + 450, oY + 300, 300, 160, 0, Math.PI, Math.PI * 2); ctx.fill();

  // Concert Hall
  ctx.fillStyle = '#dbeafe'; ctx.fillRect(iX + 1600, iY + 300, 800, 700);
  ctx.fillStyle = '#93c5fd'; ctx.fillRect(iX + 1600, iY + 280, 800, 60);

  // Art museum
  ctx.fillStyle = '#ede9fe'; ctx.fillRect(iX + 100, iY + iH - 700, 700, 600);
  ctx.fillStyle = '#c4b5fd'; ctx.fillRect(iX + 100, iY + iH - 700, 700, 50);

  // Fountain plaza
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(lm.x + lm.width / 2, iY + iH - 200, 150, 0, Math.PI * 2); ctx.fill();

  // Trees
  for (let i = 0; i < 6; i++) drawTree(ctx, iX + 150 + i * (iW / 6), iY + iH - 350, 55);

  ctx.restore();
};

// ── bongeunsa — 봉은사 (2000×2000) ───────────────────
const drawBongeunsa: DrawFn = (ctx, lm, _tick) => {
  ctx.save();
  const iX = lm.x + WALL, iY = lm.y + WALL;
  const iW = lm.width - WALL * 2, iH = lm.height - WALL * 2;
  ctx.fillStyle = '#c0b090'; ctx.fillRect(iX, iY, iW, iH);

  // Stone floor
  ctx.fillStyle = '#a89870';
  for (let gx = iX; gx < iX + iW; gx += 200) ctx.fillRect(gx, iY, 4, iH);
  for (let gy = iY; gy < iY + iH; gy += 200) ctx.fillRect(iX, gy, iW, 4);

  // Daeungjeon main hall
  ctx.fillStyle = '#8b4513'; ctx.fillRect(iX + 600, iY + 400, 800, 500);
  drawKoreanRoof(ctx, iX + 560, iY + 340, 880, 120, '#2d5a1f');

  // Giant Maitreya statue (right)
  ctx.fillStyle = '#d4a017'; ctx.fillRect(iX + iW - 350, iY + 200, 220, 600);
  ctx.beginPath(); ctx.arc(iX + iW - 240, iY + 180, 100, 0, Math.PI * 2); ctx.fill();

  // 5-story stone pagoda (left)
  const pX = iX + 200, pBaseY = iY + 800;
  for (let t = 0; t < 5; t++) {
    const tw = 200 - t * 30, th = 80;
    ctx.fillStyle = '#c0b090';
    ctx.fillRect(pX - tw / 2, pBaseY - t * 100, tw, th);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(pX - tw / 2, pBaseY - t * 100, tw, 10);
  }
  ctx.fillStyle = '#f0c040'; ctx.fillRect(pX - 8, pBaseY - 500 - 30, 16, 30);

  // Trees
  for (const [tx, ty] of [[iX + 200, iY + 200],[iX + iW - 200, iY + 200],[iX + 200, iY + iH - 200],[iX + iW - 200, iY + iH - 200]] as [number,number][]) {
    drawTree(ctx, tx, ty, 65);
  }

  ctx.restore();
};

// ── Export ────────────────────────────────────────────
export const natureRenderers: RendererMap = new Map<string, DrawFn>([
  ['cheonggye',   drawCheonggye],
  ['haneul',      drawHaneul],
  ['yeouido',     drawYeouido],
  ['banpo',       drawBanpo],
  ['seokchon',    drawSeokchon],
  ['olympic',     drawOlympic],
  ['seoul-forest',drawSeoulForest],
  ['ttukseom',    drawTtukseom],
  ['seoul-np',    drawSeoulNp],
  ['botanic',     drawBotanic],
  ['m-cathedral', drawMCathedral],
  ['insadong',    drawInsadong],
  ['seodaemun',   drawSeodaemun],
  ['national-mus',drawNationalMus],
  ['war-mem',     drawWarMem],
  ['seoul-arts',  drawSeoulArts],
  ['bongeunsa',   drawBongeunsa],
]);
