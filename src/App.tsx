import { useEffect, useRef, useState } from 'react';
import './index.css';
import { landmarkRenderers } from './landmarks/index';

// ══════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════
const MAP_W = 120000;
const MAP_H = 120000;
const PIXEL_SCALE = 3;   // each rendered pixel → 3×3 screen pixels (pixel-art look)
const TILE = 300;         // world units per terrain tile
const BASE_SPD = 48;
const SPRINT_MUL = 3.5;
const WALL = 120;         // wall depth
const ROOM_W = 4000;      // interior virtual room width
const ROOM_H = 3200;      // interior virtual room height
const NPC_SHIRTS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e67e22','#1abc9c','#e91e63','#ecf0f1','#34495e'];
const NPC_SKINS  = ['#f0c080','#d4a060','#c07840','#e8b888','#c8956c','#fde8c8'];
const NPC_HAIRS  = ['#180e06','#3d2b1f','#6b4c3b','#a07040','#1a1a2e','#2c1810'];

// ══════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════
const h2 = (x: number, y: number): number => {
  let n = (Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 1103515245)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return (n ^ (n >>> 16)) / 0xffffffff;
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;

// ══════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════
type LType = 'palace'|'nature'|'modern'|'market'|'cultural'|'transit'|'mountain';
type Dir   = 0|1|2|3; // 0=down 1=left 2=right 3=up

interface Landmark {
  id: string; name: string; type: LType; emoji: string;
  x: number; y: number; width: number; height: number;
  wallColor: string; roofColor: string; floorColor: string;
  innerBlocks: IBlock[];
}
interface IBlock {
  x: number; y: number; w: number; h: number;
  color: string; stroke?: string;
  kind: 'tree'|'rock'|'pavilion'|'room'|'booth'|'pond'|'path';
}
interface PlayerState {
  x: number; y: number;
  speed: number; size: number;
  dir: Dir; frame: number; frameTimer: number; moving: boolean;
}
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; r: number; color: string;
}
interface NPC {
  x: number; y: number; tx: number; ty: number;
  dir: Dir; frame: number; frameTimer: number; speed: number;
  shirt: string; skin: string; hair: string; lmIdx: number;
}
interface RoomObj {
  x: number; y: number; w: number; h: number;
  color: string; solid: boolean;
  type: 'wall'|'floor'|'furniture'|'elevator-up'|'elevator-down'|'exit'|'deco'|'counter'|'window';
  label?: string;
}
interface Interior {
  lmId: string; lmName: string; lmEmoji: string; lmType: string;
  floor: number; maxFloor: number;
  px: number; py: number;
  dir: Dir; frame: number; frameTimer: number;
}

// ══════════════════════════════════════════════════════
//  RIVER SPINE
// ══════════════════════════════════════════════════════
const RIVER: {x:number;y:number}[] = [
  {x:0,y:55000},{x:15000,y:57000},{x:30000,y:59000},
  {x:45000,y:63000},{x:60000,y:64000},{x:70000,y:62000},
  {x:80000,y:60000},{x:95000,y:64000},{x:110000,y:66000},{x:120000,y:68000},
];
const getRiverY = (wx: number): number => {
  for (let i = 0; i < RIVER.length - 1; i++) {
    const a = RIVER[i], b = RIVER[i+1];
    if (wx >= a.x && wx <= b.x) {
      const t = (wx - a.x) / (b.x - a.x);
      return lerp(a.y, b.y, t);
    }
  }
  return RIVER[RIVER.length-1].y;
};

// ══════════════════════════════════════════════════════
//  ROAD NETWORK  (world-coord rectangles)
// ══════════════════════════════════════════════════════
interface Road { x: number; y: number; w: number; h: number }
const ROADS: Road[] = [
  // Sejong-daero (세종대로) N-S
  { x:57600, y:38000, w:600, h:14000 },
  // Teheran-ro (테헤란로) E-W
  { x:66000, y:71200, w:16000, h:500 },
  // Gangnam-daero (강남대로) N-S
  { x:70200, y:64000, w:500, h:12000 },
  // Olympic-daero E-W  (follows south bank)
  { x:30000, y:65500, w:65000, h:500 },
  // Dongho-ro E-W (central)
  { x:51000, y:47800, w:22000, h:400 },
  // Mapo-daero
  { x:35000, y:44500, w:500, h:12000 },
  // Itaewon-ro
  { x:58000, y:51800, w:8000, h:400 },
  // Banpo-daero
  { x:59800, y:58000, w:500, h:9000 },
  // Lotte-Seokchon area
  { x:84000, y:68200, w:9000, h:400 },
  // Olympic-park road
  { x:91500, y:66000, w:400, h:8000 },
  // Cheonggye-cheon walk path
  { x:51600, y:43800, w:6000, h:200 },
  // Worldcup-ro (near Haneul)
  { x:27500, y:47500, w:500, h:6000 },
];

// ══════════════════════════════════════════════════════
//  LANDMARKS
// ══════════════════════════════════════════════════════
const RAW_LANDMARKS: Omit<Landmark,'innerBlocks'>[] = [
  // ── PALACES ──
  { id:'gyeongbok',  name:'경복궁',      type:'palace',  emoji:'🏯',
    x:55000, y:39200, width:4000, height:3000,
    wallColor:'#7c3a0f', roofColor:'#1a5c2a', floorColor:'#c8a86a' },
  { id:'changdeok',  name:'창덕궁',      type:'palace',  emoji:'⛩️',
    x:62000, y:40000, width:3500, height:2500,
    wallColor:'#92400e', roofColor:'#164e22', floorColor:'#b89050' },
  { id:'deoksu',     name:'덕수궁',      type:'palace',  emoji:'🏰',
    x:51800, y:45200, width:2000, height:1800,
    wallColor:'#b45309', roofColor:'#1a5c2a', floorColor:'#c8a060' },
  { id:'bukchon',    name:'북촌한옥마을', type:'palace', emoji:'🏘️',
    x:57800, y:36700, width:2500, height:2000,
    wallColor:'#7c3d10', roofColor:'#1a4a20', floorColor:'#d4b070' },

  // ── CULTURAL ──
  { id:'gwanghwamun',name:'광화문광장',  type:'cultural',emoji:'🗽',
    x:57600, y:42700, width:1000, height:3000,
    wallColor:'#475569', roofColor:'#334155', floorColor:'#94a3b8' },
  { id:'m-cathedral',name:'명동성당',    type:'cultural',emoji:'⛪',
    x:59100, y:46200, width:1200, height:1500,
    wallColor:'#d4a230', roofColor:'#7c5200', floorColor:'#f0e0b0' },
  { id:'insadong',   name:'인사동',      type:'cultural',emoji:'🍵',
    x:59700, y:40700, width:1800, height:2500,
    wallColor:'#84cc16', roofColor:'#3a5c10', floorColor:'#d0e8a0' },
  { id:'jogyesa',    name:'조계사',      type:'cultural',emoji:'🪷',
    x:52800, y:41800, width:1500, height:1500,
    wallColor:'#10b981', roofColor:'#064e3b', floorColor:'#a7f3d0' },
  { id:'bosingak',   name:'보신각',      type:'cultural',emoji:'🔔',
    x:54700, y:45000, width:1000, height:1000,
    wallColor:'#b45309', roofColor:'#7c3300', floorColor:'#fde68a' },
  { id:'seodaemun',  name:'서대문형무소', type:'cultural',emoji:'⛓️',
    x:45000, y:40000, width:2000, height:1800,
    wallColor:'#475569', roofColor:'#1e293b', floorColor:'#94a3b8' },
  { id:'leeum',      name:'리움미술관',  type:'cultural',emoji:'🖼️',
    x:61500, y:53300, width:1500, height:1200,
    wallColor:'#cbd5e1', roofColor:'#475569', floorColor:'#f1f5f9' },
  { id:'national-mus',name:'국립중앙박물관',type:'cultural',emoji:'🏺',
    x:57000, y:60000, width:3500, height:2000,
    wallColor:'#94a3b8', roofColor:'#334155', floorColor:'#e2e8f0' },
  { id:'war-mem',    name:'전쟁기념관',  type:'cultural',emoji:'🪖',
    x:55000, y:56000, width:2500, height:1800,
    wallColor:'#64748b', roofColor:'#1e293b', floorColor:'#cbd5e1' },
  { id:'seoul-arts', name:'예술의전당',  type:'cultural',emoji:'🎭',
    x:64000, y:78000, width:2500, height:2000,
    wallColor:'#f59e0b', roofColor:'#78350f', floorColor:'#fef3c7' },
  { id:'starfield',  name:'별마당도서관', type:'cultural',emoji:'📚',
    x:76100, y:71600, width:1200, height:1200,
    wallColor:'#d97706', roofColor:'#7c3d00', floorColor:'#fde68a' },
  { id:'bongeunsa',  name:'봉은사',      type:'cultural',emoji:'🪷',
    x:76000, y:66000, width:2000, height:1500,
    wallColor:'#10b981', roofColor:'#064e3b', floorColor:'#a7f3d0' },
  { id:'cityhall',   name:'서울시청',    type:'modern',  emoji:'🏢',
    x:55100, y:46500, width:1600, height:1200,
    wallColor:'#3b82f6', roofColor:'#1e3a8a', floorColor:'#dbeafe' },

  // ── MODERN ──
  { id:'n-tower',    name:'N서울타워',   type:'modern',  emoji:'🗼',
    x:58000, y:52000, width:1400, height:1400,
    wallColor:'#ef4444', roofColor:'#7f1d1d', floorColor:'#fee2e2' },
  { id:'ddp',        name:'DDP',         type:'modern',  emoji:'🛸',
    x:65000, y:49000, width:2500, height:2000,
    wallColor:'#94a3b8', roofColor:'#334155', floorColor:'#e2e8f0' },
  { id:'coex',       name:'코엑스',      type:'modern',  emoji:'🏢',
    x:75600, y:68600, width:3500, height:2500,
    wallColor:'#3b82f6', roofColor:'#1e3a8a', floorColor:'#dbeafe' },
  { id:'63building', name:'63빌딩',      type:'modern',  emoji:'🏙️',
    x:45000, y:60500, width:1200, height:1800,
    wallColor:'#eab308', roofColor:'#713f12', floorColor:'#fef9c3' },
  { id:'lotte-tower',name:'롯데월드타워', type:'modern',  emoji:'🚀',
    x:88000, y:68000, width:1400, height:2800,
    wallColor:'#60a5fa', roofColor:'#1e3a8a', floorColor:'#dbeafe' },
  { id:'samsung-dlight',name:'삼성딜라이트',type:'modern',emoji:'📱',
    x:70500, y:74500, width:1200, height:1000,
    wallColor:'#0ea5e9', roofColor:'#0c4a6e', floorColor:'#e0f2fe' },
  { id:'ewha',       name:'이화여대',    type:'modern',  emoji:'🏛️',
    x:42000, y:43000, width:2500, height:2000,
    wallColor:'#14b8a6', roofColor:'#0f4c3a', floorColor:'#ccfbf1' },

  // ── MARKET ──
  { id:'myeongdong', name:'명동거리',    type:'market',  emoji:'🛍️',
    x:57200, y:48200, width:2500, height:2000,
    wallColor:'#ec4899', roofColor:'#831843', floorColor:'#fce7f3' },
  { id:'namdaemun',  name:'남대문시장',  type:'market',  emoji:'🏪',
    x:53800, y:48200, width:2000, height:2000,
    wallColor:'#f97316', roofColor:'#7c2d12', floorColor:'#ffedd5' },
  { id:'dongdaemun', name:'동대문시장',  type:'market',  emoji:'👗',
    x:64000, y:46000, width:3000, height:2500,
    wallColor:'#8b5cf6', roofColor:'#3b0764', floorColor:'#ede9fe' },
  { id:'gwangjang',  name:'광장시장',    type:'market',  emoji:'🥟',
    x:61000, y:45000, width:1800, height:2200,
    wallColor:'#fb923c', roofColor:'#7c2d12', floorColor:'#ffedd5' },
  { id:'noryangjin', name:'노량진수산시장',type:'market', emoji:'🐟',
    x:48000, y:62000, width:2000, height:1800,
    wallColor:'#38bdf8', roofColor:'#0c4a6e', floorColor:'#e0f2fe' },
  { id:'itaewon',    name:'이태원거리',  type:'market',  emoji:'🎉',
    x:60000, y:55000, width:2500, height:2000,
    wallColor:'#ef4444', roofColor:'#7f1d1d', floorColor:'#fee2e2' },
  { id:'hongdae',    name:'홍대거리',    type:'market',  emoji:'🎸',
    x:35000, y:45000, width:3000, height:3000,
    wallColor:'#a855f7', roofColor:'#3b0764', floorColor:'#f3e8ff' },
  { id:'mangwon',    name:'망원시장',    type:'market',  emoji:'🥪',
    x:32000, y:46000, width:1800, height:1500,
    wallColor:'#fbbf24', roofColor:'#78350f', floorColor:'#fef3c7' },
  { id:'garosugil',  name:'가로수길',    type:'market',  emoji:'🌳',
    x:68000, y:66000, width:2000, height:2500,
    wallColor:'#f43f5e', roofColor:'#881337', floorColor:'#ffe4e6' },
  { id:'apgujeong',  name:'압구정로데오', type:'market',  emoji:'👗',
    x:72000, y:65000, width:2500, height:2000,
    wallColor:'#ec4899', roofColor:'#831843', floorColor:'#fce7f3' },
  { id:'kstar',      name:'K-Star Road', type:'market',  emoji:'⭐',
    x:73000, y:67500, width:2500, height:600,
    wallColor:'#eab308', roofColor:'#713f12', floorColor:'#fef9c3' },
  { id:'lotte-world',name:'롯데월드',    type:'market',  emoji:'🎢',
    x:85000, y:69000, width:2500, height:2000,
    wallColor:'#e879f9', roofColor:'#701a75', floorColor:'#fdf4ff' },

  // ── NATURE / PARKS ──
  { id:'cheonggye',  name:'청계천',      type:'nature',  emoji:'🦆',
    x:51600, y:43800, width:6000, height:500,
    wallColor:'#38bdf8', roofColor:'#0369a1', floorColor:'#bae6fd' },
  { id:'haneul',     name:'하늘공원',    type:'nature',  emoji:'🌾',
    x:28000, y:48000, width:3500, height:2500,
    wallColor:'#a3e635', roofColor:'#3a5c10', floorColor:'#d9f99d' },
  { id:'yeouido',    name:'여의도 한강공원',type:'nature',emoji:'🚲',
    x:42000, y:58000, width:4000, height:2000,
    wallColor:'#22c55e', roofColor:'#14532d', floorColor:'#bbf7d0' },
  { id:'banpo',      name:'반포 무지개분수',type:'nature',emoji:'🌉',
    x:60000, y:65000, width:3000, height:800,
    wallColor:'#3b82f6', roofColor:'#1e3a8a', floorColor:'#dbeafe' },
  { id:'seokchon',   name:'석촌호수',    type:'nature',  emoji:'🦢',
    x:87000, y:71500, width:3000, height:1500,
    wallColor:'#0284c7', roofColor:'#0c4a6e', floorColor:'#bae6fd' },
  { id:'olympic',    name:'올림픽공원',  type:'nature',  emoji:'🏟️',
    x:92000, y:68000, width:4500, height:3500,
    wallColor:'#22c55e', roofColor:'#14532d', floorColor:'#bbf7d0' },
  { id:'seoul-forest',name:'서울숲',     type:'nature',  emoji:'🦌',
    x:75000, y:58000, width:4000, height:3000,
    wallColor:'#16a34a', roofColor:'#14532d', floorColor:'#bbf7d0' },
  { id:'ttukseom',   name:'뚝섬유원지',  type:'nature',  emoji:'⛺',
    x:79000, y:61500, width:3000, height:1800,
    wallColor:'#2dd4bf', roofColor:'#0f4c3a', floorColor:'#ccfbf1' },
  { id:'seoul-np',   name:'서울대공원',  type:'nature',  emoji:'🦁',
    x:60000, y:95500, width:4500, height:4000,
    wallColor:'#15803d', roofColor:'#14532d', floorColor:'#bbf7d0' },
  { id:'botanic',    name:'서울식물원',  type:'nature',  emoji:'🌺',
    x:15000, y:52000, width:3500, height:3000,
    wallColor:'#10b981', roofColor:'#064e3b', floorColor:'#a7f3d0' },

  // ── TRANSIT ──
  { id:'gangnam-st', name:'강남역',      type:'transit', emoji:'🚇',
    x:70000, y:72000, width:2000, height:2000,
    wallColor:'#3b82f6', roofColor:'#1e3a8a', floorColor:'#dbeafe' },

  // ── MOUNTAINS ──
  { id:'bukhansan',  name:'북한산',      type:'mountain',emoji:'⛰️',
    x:50000, y:20000, width:8000, height:6000,
    wallColor:'#4d6a3a', roofColor:'#1c2e10', floorColor:'#86a86a' },
  { id:'inwangsan',  name:'인왕산',      type:'mountain',emoji:'🐅',
    x:48000, y:38000, width:3000, height:3000,
    wallColor:'#65a30d', roofColor:'#254010', floorColor:'#86efac' },
  { id:'bukaksan',   name:'북악산',      type:'mountain',emoji:'🏞️',
    x:54200, y:33200, width:4000, height:3000,
    wallColor:'#4d6a3a', roofColor:'#1c2e10', floorColor:'#86a86a' },
  { id:'gwanaksan',  name:'관악산',      type:'mountain',emoji:'🧗',
    x:55000, y:90000, width:7000, height:5000,
    wallColor:'#4d6a3a', roofColor:'#1c2e10', floorColor:'#86a86a' },
];

// ══════════════════════════════════════════════════════
//  INNER BLOCK GENERATION
// ══════════════════════════════════════════════════════
const LANDMARKS: Landmark[] = RAW_LANDMARKS.map(raw => {
  const lm = { ...raw, innerBlocks: [] as IBlock[] };
  const pad = 460;
  const iw = lm.width  - pad * 2;
  const ih = lm.height - pad * 2;
  if (iw < 400 || ih < 400) return lm;

  const rng = (() => {
    let s = 0;
    for (let i = 0; i < lm.id.length; i++) s = (s * 31 + lm.id.charCodeAt(i)) | 0;
    return () => { s = (s * 1664525 + 1013904223) | 0; return (s >>> 0) / 0xffffffff; };
  })();

  const ox = lm.x + pad;
  const oy = lm.y + pad;

  // helper
  const push = (x:number, y:number, w:number, h:number, color:string, stroke:string, kind: IBlock['kind']) =>
    lm.innerBlocks.push({ x, y, w, h, color, stroke, kind });

  switch (lm.type) {

    case 'palace': {
      // Courtyard stone path
      push(ox + iw*0.15, oy + ih*0.15, iw*0.7, ih*0.7, '#c0a060', '#8a7040', 'path');
      // Main hall (center-top)
      push(ox + iw*0.3, oy + ih*0.05, iw*0.4, ih*0.3, lm.wallColor, lm.roofColor, 'pavilion');
      // Side pavilions
      push(ox + iw*0.05, oy + ih*0.3, iw*0.2, ih*0.25, lm.wallColor, lm.roofColor, 'pavilion');
      push(ox + iw*0.75, oy + ih*0.3, iw*0.2, ih*0.25, lm.wallColor, lm.roofColor, 'pavilion');
      // Pond / garden
      push(ox + iw*0.3, oy + ih*0.5, iw*0.4, ih*0.25, '#3b82f6', '#1d4ed8', 'pond');
      // Trees around courtyard
      const treeCount = 14;
      for (let i = 0; i < treeCount; i++) {
        const tx = ox + rng() * iw;
        const ty = oy + rng() * ih;
        push(tx, ty, 100, 100, '#166534', '#064e3b', 'tree');
      }
      break;
    }

    case 'mountain': {
      // Rocky terrain: clusters of rocks + trees
      const count = Math.floor((iw * ih) / 120000);
      for (let i = 0; i < count; i++) {
        const tx = ox + rng() * iw;
        const ty = oy + rng() * ih;
        const sz = 80 + rng() * 180;
        if (rng() > 0.45) {
          push(tx, ty, sz, sz*0.7, '#6b7280', '#4b5563', 'rock');
        } else {
          push(tx, ty, sz*0.7, sz*0.7, '#166534', '#064e3b', 'tree');
        }
      }
      // Snow cap rocks at top
      push(ox + iw*0.35, oy, iw*0.3, ih*0.2, '#e2e8f0', '#cbd5e1', 'rock');
      break;
    }

    case 'nature': {
      // Dense forest + paths + water features
      const count = Math.floor((iw * ih) / 100000);
      for (let i = 0; i < count; i++) {
        const tx = ox + rng() * iw;
        const ty = oy + rng() * ih;
        const sz = 80 + rng() * 160;
        const treeColor = rng() > 0.5 ? '#15803d' : '#166534';
        push(tx, ty, sz, sz, treeColor, '#064e3b', 'tree');
      }
      // Central path
      push(ox + iw*0.45, oy, iw*0.1, ih, '#d4b060', '#b49040', 'path');
      // Small pond
      if (rng() > 0.3) {
        push(ox + iw*0.2, oy + ih*0.3, iw*0.3, ih*0.25, '#38bdf8', '#0284c7', 'pond');
      }
      break;
    }

    case 'modern': {
      // Grid offices / atrium
      const cols = Math.max(2, Math.floor(iw / 700));
      const rows = Math.max(2, Math.floor(ih / 700));
      const cw = (iw - 200) / cols;
      const rh = (ih - 200) / rows;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rng() > 0.6) continue;
          push(ox + c*cw + 50, oy + r*rh + 50, cw - 100, rh - 100, 'rgba(59,130,246,0.3)', 'rgba(96,165,250,0.6)', 'room');
        }
      }
      // Central atrium
      push(ox + iw*0.3, oy + ih*0.3, iw*0.4, ih*0.4, 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'room');
      break;
    }

    case 'market': {
      // Stall rows
      const rows = Math.max(2, Math.floor(ih / 500));
      const stallW = iw * 0.15;
      const stallH = 200;
      const cols = Math.floor(iw / (stallW + 80));
      for (let r = 0; r < rows; r++) {
        const rowY = oy + 80 + r * (ih / rows);
        for (let c = 0; c < cols; c++) {
          if (rng() > 0.75) continue;
          const stall_colors = ['#f97316','#ec4899','#a855f7','#eab308','#ef4444','#3b82f6'];
          const sc = stall_colors[Math.floor(rng() * stall_colors.length)];
          push(ox + 60 + c*(stallW+80), rowY, stallW, stallH, sc, '#00000066', 'booth');
        }
      }
      break;
    }

    case 'cultural': {
      // Exhibit halls
      const cols = Math.max(2, Math.floor(iw / 900));
      const rows = Math.max(1, Math.floor(ih / 900));
      const cw = (iw - 200) / cols;
      const rh = (ih - 200) / rows;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          push(ox + c*cw + 80, oy + r*rh + 80, cw - 160, rh - 160, 'rgba(245,158,11,0.25)', 'rgba(245,158,11,0.7)', 'room');
        }
      }
      // Central feature
      push(ox + iw*0.35, oy + ih*0.35, iw*0.3, ih*0.3, lm.wallColor + '88', lm.wallColor, 'pavilion');
      break;
    }

    case 'transit': {
      // Platforms
      push(ox, oy + ih*0.3, iw, ih*0.15, '#475569', '#334155', 'room');
      push(ox, oy + ih*0.6, iw, ih*0.15, '#475569', '#334155', 'room');
      // Waiting areas
      push(ox + iw*0.1, oy + ih*0.05, iw*0.35, ih*0.22, 'rgba(59,130,246,0.2)', '#3b82f6', 'room');
      push(ox + iw*0.55, oy + ih*0.05, iw*0.35, ih*0.22, 'rgba(59,130,246,0.2)', '#3b82f6', 'room');
      break;
    }
  }

  return lm;
});

// ══════════════════════════════════════════════════════
//  NPC GENERATION (deterministic, ~80 wanderers)
// ══════════════════════════════════════════════════════
const NPCS: NPC[] = LANDMARKS.flatMap((lm, lmIdx) => {
  const count = lm.type === 'market' ? 5 : lm.type === 'nature' ? 2 : 3;
  return Array.from({ length: count }, (_, i) => {
    const seed = (lmIdx * 97 + i * 31) & 0xffffffff;
    const r = (s: number) => { s = Math.imul(s ^ (s >>> 16), 0x45d9f3b); s = Math.imul(s ^ (s >>> 16), 0x45d9f3b); return ((s ^ (s >>> 16)) >>> 0) / 0xffffffff; };
    const cx = lm.x + lm.width  * 0.5;
    const cy = lm.y + lm.height * 0.5;
    const spread = Math.max(lm.width, lm.height) * 0.7;
    return {
      x: cx + (r(seed)     - 0.5) * spread,
      y: cy + (r(seed + 1) - 0.5) * spread,
      tx: cx + (r(seed + 2) - 0.5) * spread,
      ty: cy + (r(seed + 3) - 0.5) * spread,
      dir: Math.floor(r(seed + 4) * 4) as Dir,
      frame: 0, frameTimer: 0,
      speed: 12 + r(seed + 5) * 18,
      shirt: NPC_SHIRTS[Math.floor(r(seed + 6) * NPC_SHIRTS.length)],
      skin:  NPC_SKINS [Math.floor(r(seed + 7) * NPC_SKINS.length)],
      hair:  NPC_HAIRS [Math.floor(r(seed + 8) * NPC_HAIRS.length)],
      lmIdx,
    };
  });
});

// ══════════════════════════════════════════════════════
//  TERRAIN TILE TYPE
// ══════════════════════════════════════════════════════
type TileKind = 'grass'|'urban'|'mountain'|'water'|'bank'|'park';

const getTileKind = (wx: number, wy: number): TileKind => {
  const riverY = getRiverY(wx);
  const dr = Math.abs(wy - riverY);
  if (dr < 900)  return 'water';
  if (dr < 1800) return 'bank';

  // Major mountains
  if ((wx>47000&&wx<60000&&wy>17000&&wy<44000) ||
      (wx>51000&&wx<65000&&wy>87000&&wy<103000)) return 'mountain';

  // Parks / forests
  if ((wx>73000&&wx<81000&&wy>56000&&wy<63000) ||
      (wx>90000&&wx<98000&&wy>66000&&wy<73000) ||
      (wx>25000&&wx<33500&&wy>46500&&wy<52000) ||
      (wx>39000&&wx<48000&&wy>56000&&wy<61500) ||
      (wx>12000&&wx<20000&&wy>49000&&wy<57000)) return 'park';

  // Urban core
  if (wx>48000&&wx<82000&&wy>40000&&wy<80000) return 'urban';

  return 'grass';
};

const TILE_PALETTES: Record<TileKind, string[]> = {
  grass:    ['#3d6b28','#4a7c30','#557a2a','#3a6220','#5a8838'],
  urban:    ['#3a3a40','#424248','#383840','#404044','#464650'],
  mountain: ['#445a30','#3a5028','#506040','#304020','#5a6a40'],
  water:    ['#1565c0','#1976d2','#1258a0','#1e7bc0','#0d47a1'],
  bank:     ['#c4a060','#d4b070','#b89050','#ccaa70','#ba9248'],
  park:     ['#2a6b20','#347828','#286018','#3a8030','#226010'],
};

// ══════════════════════════════════════════════════════
//  APP COMPONENT
// ══════════════════════════════════════════════════════
export default function App() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const offRef     = useRef<HTMLCanvasElement | null>(null);

  const [info, setInfo]         = useState({ x: 56000, y: 48000 });
  const [nearby, setNearby]     = useState<Landmark | null>(null);
  const [sprinting, setSprinting] = useState(false);

  const keys   = useRef<Record<string, boolean>>({});
  const player = useRef<PlayerState>({
    x: 56000, y: 48000,
    speed: BASE_SPD, size: 40,
    dir: 0, frame: 0, frameTimer: 0, moving: false,
  });
  const particles = useRef<Particle[]>([]);
  const tick      = useRef(0);
  const npcs      = useRef<NPC[]>(NPCS.map(n => ({ ...n })));
  const interior  = useRef<Interior | null>(null);
  const ePressed  = useRef(false);
  const [interiorHUD, setInteriorHUD] = useState<{name:string;emoji:string;floor:number;max:number}|null>(null);

  // ── Key listeners ──
  useEffect(() => {
    const dn = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; if (e.key.toLowerCase() === 'e') ePressed.current = true; e.preventDefault(); };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  // ── Game loop ──
  useEffect(() => {
    const canvas  = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas || !minimap) return;

    if (!offRef.current) offRef.current = document.createElement('canvas');
    const off = offRef.current;

    const ctx     = canvas.getContext('2d')!;
    const miniCtx = minimap.getContext('2d')!;
    const offCtx  = off.getContext('2d')!;

    minimap.width  = 180;
    minimap.height = 180;

    let animId: number;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      off.width     = Math.ceil(canvas.width  / PIXEL_SCALE);
      off.height    = Math.ceil(canvas.height / PIXEL_SCALE);
    };
    window.addEventListener('resize', resize);
    resize();

    // ── Collision helpers ──
    const rectCollide = (
      nx: number, ny: number, sz: number,
      rx: number, ry: number, rw: number, rh: number,
      checkX: boolean
    ): boolean => {
      if (checkX) {
        return nx + sz > rx && nx - sz < rx + rw &&
               player.current.y + sz > ry && player.current.y - sz < ry + rh;
      } else {
        return player.current.x + sz > rx && player.current.x - sz < rx + rw &&
               ny + sz > ry && ny - sz < ry + rh;
      }
    };

    const gameLoop = () => {
      tick.current++;
      const p = player.current;

      // Input
      let dx = 0, dy = 0;
      if (keys.current['w'] || keys.current['arrowup'])    dy -= 1;
      if (keys.current['s'] || keys.current['arrowdown'])  dy += 1;
      if (keys.current['a'] || keys.current['arrowleft'])  dx -= 1;
      if (keys.current['d'] || keys.current['arrowright']) dx += 1;

      const isSprint = !!(keys.current['shift']);
      const spd = isSprint ? BASE_SPD * SPRINT_MUL : BASE_SPD;

      if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len; dy /= len;
      }

      // Direction
      const moving = dx !== 0 || dy !== 0;
      p.moving = moving;
      if (moving) {
        if (Math.abs(dx) >= Math.abs(dy)) p.dir = dx > 0 ? 2 : 1;
        else                               p.dir = dy > 0 ? 0 : 3;

        p.frameTimer++;
        const frameRate = isSprint ? 4 : 8;
        if (p.frameTimer >= frameRate) { p.frame = (p.frame + 1) % 2; p.frameTimer = 0; }

        // Dust particles
        if (tick.current % (isSprint ? 3 : 6) === 0) {
          particles.current.push({
            x: p.x, y: p.y + p.size * 0.5,
            vx: (Math.random()-0.5)*30, vy: Math.random()*20 + 10,
            life: 18, maxLife: 18, r: 8 + Math.random()*10, color: '#a09060',
          });
        }
      } else {
        p.frameTimer = 0; p.frame = 0;
      }

      const nx = p.x + dx * spd;
      const ny = p.y + dy * spd;
      let colX = false, colY = false;
      let closestLm: Landmark | null = null;
      let closestDist = Infinity;

      for (const lm of LANDMARKS) {
        const cx = lm.x + lm.width  / 2;
        const cy = lm.y + lm.height / 2;
        const dist = Math.hypot(p.x - cx, p.y - cy);
        const range = Math.max(lm.width, lm.height) / 2 + 600;
        if (dist < range && dist < closestDist) { closestLm = lm; closestDist = dist; }

        // Building walls
        const doorW = Math.min(900, lm.width * 0.4);
        const dL = lm.x + lm.width/2 - doorW/2;
        const dR = lm.x + lm.width/2 + doorW/2;
        const walls = [
          { x:lm.x,                        y:lm.y,                         w:WALL,             h:lm.height },
          { x:lm.x + lm.width - WALL,       y:lm.y,                         w:WALL,             h:lm.height },
          { x:lm.x,                        y:lm.y,                         w:lm.width,         h:WALL      },
          { x:lm.x,                        y:lm.y + lm.height - WALL,      w:dL - lm.x,       h:WALL      },
          { x:dR,                          y:lm.y + lm.height - WALL,      w:lm.x+lm.width-dR,h:WALL      },
        ];
        for (const w of walls) {
          if (rectCollide(nx, ny, p.size, w.x, w.y, w.w, w.h, true))  colX = true;
          if (rectCollide(nx, ny, p.size, w.x, w.y, w.w, w.h, false)) colY = true;
        }
        if (!landmarkRenderers.has(lm.id)) {
          for (const ib of lm.innerBlocks) {
            if (ib.kind === 'path' || ib.kind === 'pond') continue;
            if (rectCollide(nx, ny, p.size, ib.x, ib.y, ib.w, ib.h, true))  colX = true;
            if (rectCollide(nx, ny, p.size, ib.x, ib.y, ib.w, ib.h, false)) colY = true;
          }
        }
      }

      if (!colX) p.x = nx;
      if (!colY) p.y = ny;
      p.x = clamp(p.x, p.size, MAP_W - p.size);
      p.y = clamp(p.y, p.size, MAP_H - p.size);

      // Update particles
      particles.current = particles.current
        .map(pt => ({ ...pt, x: pt.x+pt.vx, y: pt.y+pt.vy, vy: pt.vy*0.9, life: pt.life-1 }))
        .filter(pt => pt.life > 0);

      // ── E key: enter/exit buildings ──
      if (ePressed.current) {
        ePressed.current = false;
        if (interior.current) {
          // EXIT
          interior.current = null;
          setInteriorHUD(null);
        } else {
          // Try to ENTER nearest landmark door zone
          for (const lm of LANDMARKS) {
            const doorW = Math.min(900, lm.width * 0.4);
            const dL = lm.x + lm.width/2 - doorW/2;
            const dR = lm.x + lm.width/2 + doorW/2;
            const doorY = lm.y + lm.height - WALL;
            if (p.x >= dL && p.x <= dR && Math.abs(p.y - doorY) < 300) {
              const maxFloor = getMaxFloor(lm.type);
              interior.current = {
                lmId: lm.id, lmName: lm.name, lmEmoji: lm.emoji, lmType: lm.type,
                floor: 1, maxFloor,
                px: ROOM_W / 2, py: ROOM_H - 400,
                dir: 3, frame: 0, frameTimer: 0,
              };
              setInteriorHUD({ name: lm.name, emoji: lm.emoji, floor: 1, max: maxFloor });
              break;
            }
          }
        }
      }

      // ── Update NPCs (only when not inside) ──
      if (!interior.current) {
        for (const npc of npcs.current) {
          const lm = LANDMARKS[npc.lmIdx];
          const cx = lm.x + lm.width  * 0.5;
          const cy = lm.y + lm.height * 0.5;
          const spread = Math.max(lm.width, lm.height) * 0.8;
          const dx2 = npc.tx - npc.x, dy2 = npc.ty - npc.y;
          const dist2 = Math.hypot(dx2, dy2);
          if (dist2 < 60) {
            // Pick new target
            const s = (npc.lmIdx * 97 + tick.current * 7) & 0xffffff;
            npc.tx = cx + (h2(s, 1) - 0.5) * spread;
            npc.ty = cy + (h2(s, 2) - 0.5) * spread;
          } else {
            const spd = npc.speed;
            npc.x += (dx2 / dist2) * spd;
            npc.y += (dy2 / dist2) * spd;
            if (Math.abs(dx2) >= Math.abs(dy2)) npc.dir = dx2 > 0 ? 2 : 1;
            else                                  npc.dir = dy2 > 0 ? 0 : 3;
            npc.frameTimer++;
            if (npc.frameTimer >= 10) { npc.frame = (npc.frame + 1) % 2; npc.frameTimer = 0; }
          }
        }
      }

      // ── Interior movement ──
      if (interior.current) {
        const inn = interior.current;
        let idX = 0, idY = 0;
        if (keys.current['w'] || keys.current['arrowup'])    idY -= 1;
        if (keys.current['s'] || keys.current['arrowdown'])  idY += 1;
        if (keys.current['a'] || keys.current['arrowleft'])  idX -= 1;
        if (keys.current['d'] || keys.current['arrowright']) idX += 1;
        if (idX !== 0 && idY !== 0) { const l = Math.sqrt(2); idX /= l; idY /= l; }
        const iSpd = BASE_SPD * 1.2;
        const rooms = buildInterior(inn.lmId, inn.lmType, inn.floor);
        const inx = inn.px + idX * iSpd;
        const iny = inn.py + idY * iSpd;
        let iColX = false, iColY = false;
        for (const ro of rooms) {
          if (!ro.solid) continue;
          const sz = 40;
          if (inx+sz > ro.x && inx-sz < ro.x+ro.w && inn.py+sz > ro.y && inn.py-sz < ro.y+ro.h) iColX = true;
          if (inn.px+sz > ro.x && inn.px-sz < ro.x+ro.w && iny+sz > ro.y && iny-sz < ro.y+ro.h) iColY = true;
          // Elevator zones
          if (ro.type === 'elevator-up' && inn.px > ro.x && inn.px < ro.x+ro.w && inn.py > ro.y && inn.py < ro.y+ro.h && (keys.current['w'] || keys.current['arrowup'])) {
            if (inn.floor < inn.maxFloor) {
              inn.floor++;
              inn.px = ROOM_W / 2; inn.py = ROOM_H - 400;
              setInteriorHUD({ name: inn.lmName, emoji: inn.lmEmoji, floor: inn.floor, max: inn.maxFloor });
            }
          }
          if (ro.type === 'elevator-down' && inn.px > ro.x && inn.px < ro.x+ro.w && inn.py > ro.y && inn.py < ro.y+ro.h && (keys.current['s'] || keys.current['arrowdown'])) {
            if (inn.floor > 1) {
              inn.floor--;
              inn.px = ROOM_W / 2; inn.py = 400;
              setInteriorHUD({ name: inn.lmName, emoji: inn.lmEmoji, floor: inn.floor, max: inn.maxFloor });
            } else {
              // Exit at ground floor
              interior.current = null;
              setInteriorHUD(null);
            }
          }
          if (ro.type === 'exit' && inn.px > ro.x && inn.px < ro.x+ro.w && inn.py > ro.y && inn.py < ro.y+ro.h) {
            interior.current = null;
            setInteriorHUD(null);
          }
        }
        if (!iColX) inn.px = clamp(inx, 80, ROOM_W - 80);
        if (!iColY) inn.py = clamp(iny, 80, ROOM_H - 80);
        if (idX !== 0 || idY !== 0) {
          if (Math.abs(idX) >= Math.abs(idY)) inn.dir = idX > 0 ? 2 : 1;
          else inn.dir = idY > 0 ? 0 : 3;
          inn.frameTimer++;
          if (inn.frameTimer >= 8) { inn.frame = (inn.frame + 1) % 2; inn.frameTimer = 0; }
        }
      }

      setInfo({ x: Math.round(p.x), y: Math.round(p.y) });
      setNearby(closestLm);
      setSprinting(isSprint && moving);

      if (interior.current) {
        renderInterior(ctx, canvas, offCtx, off);
      } else {
        render(ctx, canvas, offCtx, off);
      }
      renderMinimap(miniCtx, minimap);
      animId = requestAnimationFrame(gameLoop);
    };

    // ════════════════════════════════════════════════
    //  RENDER
    // ════════════════════════════════════════════════
    const render = (
      ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
      oCtx: CanvasRenderingContext2D, off: HTMLCanvasElement
    ) => {
      const p   = tick.current;
      const pl  = player.current;
      const oW  = off.width;
      const oH  = off.height;

      // ── offscreen: clear ──
      oCtx.imageSmoothingEnabled = false;

      // Camera in world coords
      const camX = pl.x - oW * PIXEL_SCALE / 2;
      const camY = pl.y - oH * PIXEL_SCALE / 2;

      oCtx.save();
      oCtx.scale(1 / PIXEL_SCALE, 1 / PIXEL_SCALE);
      oCtx.translate(-camX, -camY);

      // ── OUT-OF-MAP ──
      oCtx.fillStyle = '#050a10';
      oCtx.fillRect(camX - 2000, camY - 2000, oW*PIXEL_SCALE + 4000, oH*PIXEL_SCALE + 4000);

      // ── TERRAIN TILES ──
      const tLeft   = Math.floor((camX)          / TILE) - 1;
      const tRight  = Math.ceil((camX + oW*PIXEL_SCALE) / TILE) + 1;
      const tTop    = Math.floor((camY)          / TILE) - 1;
      const tBottom = Math.ceil((camY + oH*PIXEL_SCALE) / TILE) + 1;

      for (let tx = tLeft; tx <= tRight; tx++) {
        for (let ty = tTop; ty <= tBottom; ty++) {
          const wx  = tx * TILE;
          const wy  = ty * TILE;
          const kind = getTileKind(wx + TILE/2, wy + TILE/2);
          const pal  = TILE_PALETTES[kind];
          const v    = h2(tx, ty);

          // Water animation offset
          let color = pal[Math.floor(v * pal.length)];
          if (kind === 'water') {
            const wave = Math.sin(p * 0.06 + tx * 0.4 + ty * 0.3);
            color = wave > 0.3 ? '#1e88e5' : wave < -0.4 ? '#0d47a1' : '#1565c0';
          }
          oCtx.fillStyle = color;
          oCtx.fillRect(wx, wy, TILE, TILE);

          // Tile details
          if (kind === 'grass' && v > 0.82) {
            // Small flora dots
            oCtx.fillStyle = v > 0.91 ? '#f9a8d4' : '#86efac';
            oCtx.fillRect(wx + (v*TILE)|0, wy + ((1-v)*TILE)|0, PIXEL_SCALE*2, PIXEL_SCALE*2);
          }
          if (kind === 'urban') {
            // Sidewalk edge lines
            oCtx.strokeStyle = '#505060';
            oCtx.lineWidth = 6;
            if (h2(tx, ty*2) > 0.7) {
              oCtx.beginPath();
              oCtx.moveTo(wx, wy); oCtx.lineTo(wx+TILE, wy);
              oCtx.stroke();
            }
          }
          if (kind === 'mountain' && v > 0.75) {
            // Rock highlights
            oCtx.fillStyle = '#7a8c60';
            oCtx.fillRect(wx + (v*TILE*0.5)|0, wy + (v*TILE*0.5)|0, PIXEL_SCALE*4, PIXEL_SCALE*3);
          }
          if (kind === 'water') {
            // Foam sparkles
            if (h2(tx*3, ty*7 + (p>>3)) > 0.92) {
              oCtx.fillStyle = '#90caf9';
              oCtx.fillRect(wx + (h2(tx,ty)*TILE)|0, wy + (h2(ty,tx)*TILE)|0, PIXEL_SCALE*2, PIXEL_SCALE*2);
            }
          }
        }
      }

      // ── ROADS ──
      for (const road of ROADS) {
        // Road base
        oCtx.fillStyle = '#2a2a32';
        oCtx.fillRect(road.x - 20, road.y - 20, road.w + 40, road.h + 40);
        // Asphalt
        oCtx.fillStyle = '#383840';
        oCtx.fillRect(road.x, road.y, road.w, road.h);
        // Center line (dashed effect with hash)
        oCtx.fillStyle = '#e8c040';
        const isHoriz = road.w > road.h;
        if (isHoriz) {
          const lineY = road.y + road.h/2 - 8;
          for (let sx = road.x; sx < road.x + road.w; sx += 120) {
            oCtx.fillRect(sx, lineY, 60, 16);
          }
          // Curb lines
          oCtx.fillStyle = '#aaaaaa88';
          oCtx.fillRect(road.x, road.y,          road.w, 12);
          oCtx.fillRect(road.x, road.y+road.h-12, road.w, 12);
        } else {
          const lineX = road.x + road.w/2 - 8;
          for (let sy = road.y; sy < road.y + road.h; sy += 120) {
            oCtx.fillRect(lineX, sy, 16, 60);
          }
          oCtx.fillStyle = '#aaaaaa88';
          oCtx.fillRect(road.x,          road.y, 12, road.h);
          oCtx.fillRect(road.x+road.w-12, road.y, 12, road.h);
        }
      }

      // ── HAN RIVER (drawn on top of tiles) ──
      // Draw river as a wide stroke with wave effect
      oCtx.save();
      oCtx.lineWidth = 2000;
      oCtx.lineCap   = 'round';
      oCtx.lineJoin  = 'round';

      // Deep river
      const riverGrad = oCtx.createLinearGradient(0, 57000, 0, 63000);
      riverGrad.addColorStop(0, '#0d47a1');
      riverGrad.addColorStop(0.3, '#1565c0');
      riverGrad.addColorStop(0.7, '#1565c0');
      riverGrad.addColorStop(1, '#0d47a1');
      oCtx.strokeStyle = riverGrad;
      oCtx.beginPath();
      oCtx.moveTo(RIVER[0].x, RIVER[0].y);
      for (let i = 1; i < RIVER.length - 2; i++) {
        const xc = (RIVER[i].x + RIVER[i+1].x) / 2;
        const yc = (RIVER[i].y + RIVER[i+1].y) / 2;
        oCtx.quadraticCurveTo(RIVER[i].x, RIVER[i].y, xc, yc);
      }
      oCtx.quadraticCurveTo(RIVER[RIVER.length-2].x, RIVER[RIVER.length-2].y,
                             RIVER[RIVER.length-1].x, RIVER[RIVER.length-1].y);
      oCtx.stroke();

      // River shimmer lines
      oCtx.lineWidth = 80;
      oCtx.strokeStyle = `rgba(100,180,255,${0.15 + 0.1 * Math.sin(p * 0.04)})`;
      oCtx.beginPath();
      oCtx.moveTo(RIVER[0].x, RIVER[0].y - 300);
      for (let i = 1; i < RIVER.length; i++) {
        oCtx.lineTo(RIVER[i].x, RIVER[i].y - 300 + Math.sin(i*1.4 + p*0.03)*200);
      }
      oCtx.stroke();
      oCtx.restore();

      // ── LANDMARKS ──
      for (const lm of LANDMARKS) {
        // Viewport cull
        if (lm.x + lm.width  < camX - 200) continue;
        if (lm.x              > camX + oW*PIXEL_SCALE + 200) continue;
        if (lm.y + lm.height < camY - 200) continue;
        if (lm.y              > camY + oH*PIXEL_SCALE + 200) continue;

        drawLandmark(oCtx, lm, p);
      }

      // ── PARTICLES ──
      for (const pt of particles.current) {
        const alpha = pt.life / pt.maxLife;
        oCtx.fillStyle = pt.color + Math.floor(alpha * 255).toString(16).padStart(2,'0');
        oCtx.beginPath();
        oCtx.arc(pt.x, pt.y, pt.r, 0, Math.PI*2);
        oCtx.fill();
      }

      // ── NPCs ──
      if (!interior.current) {
        for (const npc of npcs.current) {
          if (npc.x > camX - 1000 && npc.x < camX + oW*PIXEL_SCALE + 1000 &&
              npc.y > camY - 1000 && npc.y < camY + oH*PIXEL_SCALE + 1000) {
            drawNPC(oCtx, npc, p);
          }
        }
      }

      // ── PLAYER ──
      drawPlayer(oCtx, player.current, p);

      oCtx.restore();

      // ── Blit offscreen → main canvas (nearest-neighbor = pixel art) ──
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, oW * PIXEL_SCALE, oH * PIXEL_SCALE);

      // ── Vignette overlay on main canvas ──
      const vig = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.width*0.3,
        canvas.width/2, canvas.height/2, canvas.width*0.75,
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // ════════════════════════════════════════════════
    //  DRAW LANDMARK
    // ════════════════════════════════════════════════
    const drawLandmark = (ctx: CanvasRenderingContext2D, lm: Landmark, t: number) => {
      const { x, y, width: W, height: H } = lm;

      // ── Floor ──
      ctx.fillStyle = lm.floorColor + 'cc';
      ctx.fillRect(x, y, W, H);

      // ── Custom per-landmark renderer ──
      const customDraw = landmarkRenderers.get(lm.id);
      if (customDraw) {
        ctx.save();
        customDraw(ctx, { ...lm, innerBlocks: lm.innerBlocks }, t, WALL);
        ctx.restore();
      } else {
      // ── Inner blocks (only when no custom renderer) ──
      for (const ib of lm.innerBlocks) {
        if (ib.kind === 'tree') {
          // Pixelated circle tree
          const cx = ib.x + ib.w/2, cy = ib.y + ib.h/2, r = ib.w/2;
          ctx.fillStyle = '#1a3d10';
          ctx.beginPath(); ctx.arc(cx+r*0.1, cy+r*0.1, r, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = ib.color;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
          // Highlight
          ctx.fillStyle = '#86efac44';
          ctx.beginPath(); ctx.arc(cx - r*0.25, cy - r*0.25, r*0.4, 0, Math.PI*2); ctx.fill();
        } else if (ib.kind === 'pond') {
          // Animated water block
          const wave = 0.15 + 0.1*Math.sin(t*0.05 + ib.x*0.0001);
          ctx.fillStyle = ib.color;
          ctx.fillRect(ib.x, ib.y, ib.w, ib.h);
          ctx.fillStyle = `rgba(150,220,255,${wave})`;
          ctx.fillRect(ib.x + ib.w*0.1, ib.y + ib.h*0.2, ib.w*0.8, 30);
          ctx.fillRect(ib.x + ib.w*0.2, ib.y + ib.h*0.6, ib.w*0.6, 30);
        } else if (ib.kind === 'pavilion') {
          // Shadow
          ctx.fillStyle = '#00000040';
          ctx.fillRect(ib.x+20, ib.y+20, ib.w, ib.h);
          // Body
          ctx.fillStyle = ib.color;
          ctx.fillRect(ib.x, ib.y, ib.w, ib.h);
          // Roof strip
          if (ib.stroke) {
            ctx.fillStyle = ib.stroke;
            ctx.fillRect(ib.x, ib.y, ib.w, ib.h * 0.28);
          }
          // Pillars
          ctx.fillStyle = '#0000002a';
          ctx.fillRect(ib.x, ib.y, 30, ib.h);
          ctx.fillRect(ib.x + ib.w - 30, ib.y, 30, ib.h);
        } else if (ib.kind === 'rock') {
          ctx.fillStyle = '#00000030';
          ctx.fillRect(ib.x+15, ib.y+15, ib.w, ib.h);
          ctx.fillStyle = ib.color;
          ctx.fillRect(ib.x, ib.y, ib.w, ib.h);
          ctx.fillStyle = '#ffffff22';
          ctx.fillRect(ib.x + ib.w*0.1, ib.y + ib.h*0.1, ib.w*0.3, ib.h*0.2);
        } else {
          // room / booth / path
          ctx.fillStyle = ib.color;
          ctx.fillRect(ib.x, ib.y, ib.w, ib.h);
          if (ib.stroke) {
            ctx.strokeStyle = ib.stroke;
            ctx.lineWidth   = 20;
            ctx.strokeRect(ib.x, ib.y, ib.w, ib.h);
          }
        }
      } // end for
      } // end else (no custom renderer)

      // ── Walls (with pixel-art shadow) ──
      const doorW = Math.min(900, W * 0.4);
      const dL = x + W/2 - doorW/2;
      const dR = x + W/2 + doorW/2;
      const walls = [
        { x, y, w:WALL, h:H },
        { x: x+W-WALL, y, w:WALL, h:H },
        { x, y, w:W, h:WALL },
        { x, y:y+H-WALL, w:dL-x, h:WALL },
        { x:dR, y:y+H-WALL, w:x+W-dR, h:WALL },
      ];

      // Shadow layer
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      walls.forEach(w => ctx.fillRect(w.x+24, w.y+24, w.w, w.h));

      // Wall face
      ctx.fillStyle = lm.wallColor;
      walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

      // Roof strip on top wall
      ctx.fillStyle = lm.roofColor;
      ctx.fillRect(x, y, W, WALL * 0.4 | 0);

      // Wall highlights (lighter top edge)
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, 18));

      // Wall pixel-grid detail lines
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let bx = x; bx < x+W; bx += 240) {
        ctx.fillRect(bx, y, 8, H);
      }

      // ── Entrance marker ──
      const enterPulse = 0.7 + 0.3 * Math.sin(tick.current * 0.07);
      ctx.fillStyle = `rgba(255,230,80,${enterPulse})`;
      ctx.fillRect(dL, y+H-WALL, doorW, WALL);
      // Arrow
      ctx.fillStyle = '#00000088';
      ctx.font = 'bold 120px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('▼', x+W/2, y+H - WALL/2);

      // ── Name label ──
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x + W/2 - 1200, y + H/2 - 140, 2400, 260);
      ctx.fillStyle = 'rgba(255,255,255,0.90)';
      ctx.font = `bold ${Math.max(80, Math.min(180, W/6))}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`${lm.emoji} ${lm.name}`, x + W/2, y + H/2);
    };

    // ════════════════════════════════════════════════
    //  INTERIOR HELPERS
    // ════════════════════════════════════════════════
    const getMaxFloor = (type: string): number => {
      const map: Record<string, number> = {
        modern: 8, palace: 2, mountain: 1, nature: 1,
        market: 3, cultural: 3, transit: 2,
      };
      return map[type] ?? 3;
    };

    const buildInterior = (lmId: string, lmType: string, floor: number): RoomObj[] => {
      const rooms: RoomObj[] = [];
      const W = ROOM_W, H = ROOM_H;
      const wall = (x:number,y:number,w:number,h:number,c:string) => rooms.push({x,y,w,h,color:c,solid:true,type:'wall'});
      const deco = (x:number,y:number,w:number,h:number,c:string,lbl?:string) => rooms.push({x,y,w,h,color:c,solid:false,type:'deco',label:lbl});
      const furn = (x:number,y:number,w:number,h:number,c:string,lbl?:string) => rooms.push({x,y,w,h,color:c,solid:true,type:'furniture',label:lbl});

      // Outer walls
      wall(0, 0, W, 80, '#555');
      wall(0, H-80, W, 80, '#555');
      wall(0, 0, 80, H, '#555');
      wall(W-80, 0, 80, H, '#555');

      // Floor
      rooms.push({x:80,y:80,w:W-160,h:H-160,color:'#c8b89a',solid:false,type:'floor'});

      // Elevator shaft (right side)
      rooms.push({x:W-400,y:H/2-300,w:200,h:600,color:'#8a7060',solid:true,type:'wall'});
      if (floor < (getMaxFloor(lmType))) {
        rooms.push({x:W-390,y:H/2-280,w:180,h:260,color:'#f0d060',solid:false,type:'elevator-up',label:'▲'});
      }
      if (floor > 1) {
        rooms.push({x:W-390,y:H/2+40,w:180,h:260,color:'#60a0f0',solid:false,type:'elevator-down',label:'▼'});
      }
      // Exit door at bottom center (floor 1 only)
      if (floor === 1) {
        rooms.push({x:W/2-120,y:H-160,w:240,h:80,color:'#20c060',solid:false,type:'exit',label:'EXIT'});
      }

      // Interior layout by type
      switch (lmType) {
        case 'palace': {
          // Throne room
          furn(W/2-300, 120, 600, 300, '#8b4513', '玉座');
          // Stone pillars
          for (let col=0;col<4;col++) {
            furn(200+col*600, 500, 80, 200, '#a09070');
            furn(200+col*600, 800, 80, 200, '#a09070');
          }
          // Paintings on walls
          deco(120, 200, 160, 120, '#d4a044', '궁중화');
          deco(120, 400, 160, 120, '#d4a044', '산수화');
          deco(W-280, 200, 160, 120, '#d4a044', '궁중화');
          // Courtyard rug
          rooms.push({x:W/2-500,y:500,w:1000,h:700,color:'#8b1a1a',solid:false,type:'deco'});
          // Side rooms
          furn(120, H/2-200, 500, 400, '#7b6030');
          furn(W-620, H/2-200, 500, 400, '#7b6030');
          if (floor === 2) {
            deco(W/2-200, 200, 400, 200, '#ffd700', '왕관 전시');
            for (let i=0;i<6;i++) furn(200+i*500, 300, 200, 300, '#8b6040');
          }
          break;
        }
        case 'modern': {
          const floorColors = ['#e8f4f8','#f0e8f8','#f8f0e8','#e8f8f0','#f8f8e8','#f0f0f8','#f8e8f0','#e8f8f8'];
          rooms[4].color = floorColors[(floor-1) % floorColors.length];
          // Reception desk
          furn(W/2-400, H-600, 800, 200, '#4a6080', '안내데스크');
          // Elevator lobby pillars
          furn(200, 200, 100, 400, '#708090');
          furn(W-300, 200, 100, 400, '#708090');
          // Office desks in grid
          const deskCols = 3, deskRows = 3;
          for (let dc=0;dc<deskCols;dc++) for (let dr=0;dr<deskRows;dr++) {
            furn(300+dc*900, 250+dr*600, 600, 180, '#5a7090', '사무실');
          }
          // Windows
          for (let wi=0;wi<4;wi++) {
            deco(120, 200+wi*500, 60, 300, '#87ceeb');
            deco(W-180, 200+wi*500, 60, 300, '#87ceeb');
          }
          if (floor >= 5) {
            deco(W/2-300, 150, 600, 200, '#ffd700', `${floor}F 전망대`);
          }
          break;
        }
        case 'market': {
          // Market stalls in rows
          const stallColors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#e67e22'];
          const stalls = floor === 1 ? 12 : floor === 2 ? 8 : 4;
          for (let si=0;si<stalls;si++) {
            const row = Math.floor(si / 4), col = si % 4;
            const sc2 = stallColors[si % stallColors.length];
            const lbl = ['떡볶이','김밥','순대','어묵','튀김','곱창','전','국밥'][si % 8];
            furn(200+col*800, 200+row*700, 600, 400, sc2, lbl);
            deco(200+col*800, 100+row*700, 600, 80, sc2+'88');
          }
          // Aisle path
          rooms.push({x:W/2-60,y:80,w:120,h:H-160,color:'#d4b090',solid:false,type:'floor'});
          if (floor === 2) {
            furn(W/2-500, H/2-100, 1000, 200, '#8b4513', '전통 공예');
          }
          if (floor === 3) {
            furn(W/2-400, 200, 800, 300, '#c0a060', '푸드코트');
          }
          break;
        }
        case 'cultural': {
          // Gallery layout
          const exhibits = ['고려청자','조선백자','금관','검','갑옷','불상','서예','민화'];
          for (let ei=0;ei<6;ei++) {
            const row = Math.floor(ei/3), col = ei%3;
            furn(200+col*1000, 200+row*900, 600, 500, '#c8a060', exhibits[ei+(floor-1)*2] ?? '전시물');
            deco(200+col*1000, 180+row*900, 600, 40, '#808080');
          }
          // Center display
          furn(W/2-250, H/2-200, 500, 400, '#ffd700', '특별전시');
          // Benches
          for (let bi=0;bi<3;bi++) deco(300+bi*900, H-400, 400, 120, '#8b6a40');
          break;
        }
        case 'transit': {
          // Platform
          rooms.push({x:80,y:H/2-200,w:W-160,h:400,color:'#606070',solid:false,type:'floor'});
          // Yellow safety line
          rooms.push({x:80,y:H/2-220,w:W-160,h:30,color:'#ffd700',solid:false,type:'deco'});
          rooms.push({x:80,y:H/2+190,w:W-160,h:30,color:'#ffd700',solid:false,type:'deco'});
          // Benches
          for (let bi=0;bi<4;bi++) deco(200+bi*900, H/2-400, 350, 120, '#4a4a6a', '대기석');
          // Turnstile
          furn(W/2-300, 120, 200, 200, '#2a6a4a', '개찰구');
          furn(W/2+100, 120, 200, 200, '#2a6a4a', '개찰구');
          // Info board
          deco(W/2-400, H-500, 800, 300, '#0a2a5a', '노선도');
          if (floor === 2) {
            deco(W/2-300, 200, 600, 200, '#1a3a8a', '열차 운행 안내');
          }
          break;
        }
        case 'mountain': {
          // Mountain shelter / rest area
          furn(W/2-400, H/2-200, 800, 400, '#7b5c3a', '쉼터');
          deco(W/2-300, H/2-350, 600, 120, '#6b8c6b', '전망대');
          // Trail map
          deco(200, 200, 400, 300, '#b8a070', '등산로 안내도');
          // Rocks as decor
          for (let ri=0;ri<6;ri++) deco(200+ri*500, H-500, 200, 150, '#808080');
          break;
        }
        default: {
          // Generic interior
          furn(W/2-300, H/2-150, 600, 300, '#6a8aaa', '안내센터');
          for (let pi=0;pi<4;pi++) furn(200+pi*700, 200, 150, 400, '#a09070');
          break;
        }
      }
      void lmId;
      return rooms;
    };

    // ════════════════════════════════════════════════
    //  DRAW NPC
    // ════════════════════════════════════════════════
    const drawNPC = (ctx: CanvasRenderingContext2D, npc: NPC, _t: number) => {
      const { x, y, dir, frame, shirt, skin, hair } = npc;
      const PX = PIXEL_SCALE * 2;
      const SHOES = '#1a0e06';
      const EYE   = '#1a1a2e';
      const PANTS = '#2a3a5a';

      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(x, y + 24, 22, 8, 0, 0, Math.PI*2);
      ctx.fill();

      const cx2 = x - PX * 3;
      const cy2 = y - PX * 8;
      type Row2 = [number, string][];
      const g: Row2[] = [];

      if (dir === 0) {
        g[0]=[[1,hair],[2,hair],[3,hair],[4,hair],[5,hair]];
        g[1]=[[1,hair],[2,hair],[3,hair],[4,hair],[5,hair]];
        g[2]=[[1,skin],[2,skin],[3,skin],[4,skin],[5,skin]];
        g[3]=[[1,skin],[2,EYE],[3,skin],[4,EYE],[5,skin]];
        g[4]=[[1,skin],[2,skin],[3,skin],[4,skin],[5,skin]];
        g[5]=[[0,shirt],[1,shirt],[2,shirt],[3,shirt],[4,shirt],[5,shirt],[6,shirt]];
        g[6]=[[0,shirt],[1,shirt],[2,shirt],[3,shirt],[4,shirt],[5,shirt],[6,shirt]];
        g[7]=[[1,PANTS],[2,PANTS],[3,PANTS],[4,PANTS],[5,PANTS]];
        const lo=frame===0?0:-1,ro=frame===0?0:1;
        g[8]=[[1+lo,PANTS],[2+lo,PANTS],[4+ro,PANTS],[5+ro,PANTS]];
        g[9]=[[1+lo,PANTS],[2+lo,PANTS],[4+ro,PANTS],[5+ro,PANTS]];
        g[10]=[[1+lo,SHOES],[2+lo,SHOES],[4+ro,SHOES],[5+ro,SHOES]];
      } else if (dir === 3) {
        g[0]=[[1,hair],[2,hair],[3,hair],[4,hair],[5,hair]];
        g[1]=[[1,hair],[2,hair],[3,hair],[4,hair],[5,hair]];
        g[2]=[[1,hair],[2,hair],[3,hair],[4,hair],[5,hair]];
        g[3]=[[1,skin],[2,skin],[3,skin],[4,skin],[5,skin]];
        g[4]=[[1,skin],[2,skin],[3,skin],[4,skin],[5,skin]];
        g[5]=[[0,shirt],[1,shirt],[2,shirt],[3,shirt],[4,shirt],[5,shirt],[6,shirt]];
        g[6]=[[0,shirt],[1,shirt],[2,shirt],[3,shirt],[4,shirt],[5,shirt],[6,shirt]];
        g[7]=[[1,PANTS],[2,PANTS],[3,PANTS],[4,PANTS],[5,PANTS]];
        const lo=frame===0?0:-1,ro=frame===0?0:1;
        g[8]=[[1+lo,PANTS],[2+lo,PANTS],[4+ro,PANTS],[5+ro,PANTS]];
        g[9]=[[1+lo,PANTS],[2+lo,PANTS],[4+ro,PANTS],[5+ro,PANTS]];
        g[10]=[[1+lo,SHOES],[2+lo,SHOES],[4+ro,SHOES],[5+ro,SHOES]];
      } else {
        const flip = dir === 1;
        const fc = (c:number) => flip ? 6-c : c;
        g[0]=[[fc(2),hair],[fc(3),hair],[fc(4),hair],[fc(5),hair]];
        g[1]=[[fc(1),hair],[fc(2),hair],[fc(3),hair],[fc(4),hair],[fc(5),hair]];
        g[2]=[[fc(1),skin],[fc(2),skin],[fc(3),skin],[fc(4),skin],[fc(5),skin]];
        g[3]=[[fc(1),skin],[fc(2),skin],[fc(3),EYE],[fc(4),skin],[fc(5),skin]];
        g[4]=[[fc(1),skin],[fc(2),skin],[fc(3),skin],[fc(4),skin],[fc(5),skin]];
        g[5]=[[fc(0),shirt],[fc(1),shirt],[fc(2),shirt],[fc(3),shirt],[fc(4),shirt],[fc(5),shirt]];
        g[6]=[[fc(0),shirt],[fc(1),shirt],[fc(2),shirt],[fc(3),shirt],[fc(4),shirt],[fc(5),shirt]];
        g[7]=[[fc(1),PANTS],[fc(2),PANTS],[fc(3),PANTS],[fc(4),PANTS]];
        const lf=frame===0?0:1;
        g[8]=[[fc(1+lf),PANTS],[fc(2+lf),PANTS],[fc(3-lf),PANTS],[fc(4-lf),PANTS]];
        g[9]=[[fc(1+lf),PANTS],[fc(2+lf),PANTS],[fc(3-lf),PANTS],[fc(4-lf),PANTS]];
        g[10]=[[fc(2+lf),SHOES],[fc(3-lf),SHOES]];
      }

      for (let row=0;row<g.length;row++) {
        if (!g[row]) continue;
        for (const [col, color] of g[row]) {
          ctx.fillStyle = color;
          ctx.fillRect(cx2+col*PX, cy2+row*PX, PX, PX);
        }
      }
    };

    // ════════════════════════════════════════════════
    //  RENDER INTERIOR
    // ════════════════════════════════════════════════
    const renderInterior = (
      ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement,
      oCtx: CanvasRenderingContext2D, off: HTMLCanvasElement
    ) => {
      const inn = interior.current!;
      const oW = off.width, oH = off.height;
      const camX = inn.px - oW * PIXEL_SCALE / 2;
      const camY = inn.py - oH * PIXEL_SCALE / 2;

      oCtx.imageSmoothingEnabled = false;
      oCtx.save();
      oCtx.scale(1 / PIXEL_SCALE, 1 / PIXEL_SCALE);
      oCtx.translate(-camX, -camY);

      // Background
      oCtx.fillStyle = '#1a1a2e';
      oCtx.fillRect(camX-500, camY-500, oW*PIXEL_SCALE+1000, oH*PIXEL_SCALE+1000);

      const rooms = buildInterior(inn.lmId, inn.lmType, inn.floor);
      for (const ro of rooms) {
        oCtx.fillStyle = ro.color;
        oCtx.fillRect(ro.x, ro.y, ro.w, ro.h);
        if (ro.type === 'elevator-up' || ro.type === 'elevator-down') {
          oCtx.strokeStyle = '#ffffff88';
          oCtx.lineWidth = 20;
          oCtx.strokeRect(ro.x, ro.y, ro.w, ro.h);
        }
        if (ro.label) {
          oCtx.fillStyle = '#ffffffcc';
          oCtx.font = 'bold 80px monospace';
          oCtx.textAlign = 'center';
          oCtx.textBaseline = 'middle';
          oCtx.fillText(ro.label, ro.x + ro.w/2, ro.y + ro.h/2);
        }
      }

      // Draw player inside
      const pState: PlayerState = {
        x: inn.px, y: inn.py,
        speed: BASE_SPD, size: 40,
        dir: inn.dir, frame: inn.frame, frameTimer: inn.frameTimer, moving: true,
      };
      drawPlayer(oCtx, pState, tick.current);

      oCtx.restore();

      // Blit
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, oW * PIXEL_SCALE, oH * PIXEL_SCALE);

      // Vignette
      const vig = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.width*0.3,
        canvas.width/2, canvas.height/2, canvas.width*0.75,
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // ════════════════════════════════════════════════
    //  DRAW PLAYER (pixel art character)
    // ════════════════════════════════════════════════
    const drawPlayer = (ctx: CanvasRenderingContext2D, p: PlayerState, t: number) => {
      const { x, y, dir, frame } = p;
      const PX = PIXEL_SCALE * 2;   // 1 "char pixel" = this many world units

      // Shadow ellipse
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y + p.size*0.6, p.size*0.7, p.size*0.25, 0, 0, Math.PI*2);
      ctx.fill();

      // Character sprite (7 cols × 11 rows of PX×PX world-unit blocks)
      const SKIN = '#f0c080';
      const HAIR = '#180e06';
      const SHIRT= '#3060d8';
      const PANTS= '#101850';
      const SHOES= '#1a0e06';
      const EYE  = '#1a1a2e';
      const MOUTH= '#c06050';

      const cx = x - PX * 3; // left edge of sprite
      const cy = y - PX * 8; // top edge (character is ~11 rows)

      type Row = [number, string][];
      const grid: Row[] = [];

      // Rows of [col, color] pairs — only non-empty pixels
      // 7 cols (0–6), 11 rows (0–10)
      if (dir === 0) { // facing DOWN
        grid[0]  = [[1,HAIR],[2,HAIR],[3,HAIR],[4,HAIR],[5,HAIR]];
        grid[1]  = [[1,HAIR],[2,HAIR],[3,HAIR],[4,HAIR],[5,HAIR]];
        grid[2]  = [[1,SKIN],[2,SKIN],[3,SKIN],[4,SKIN],[5,SKIN]];
        grid[3]  = [[1,SKIN],[2,EYE],[3,SKIN],[4,EYE],[5,SKIN]];
        grid[4]  = [[1,SKIN],[2,SKIN],[3,MOUTH],[4,SKIN],[5,SKIN]];
        grid[5]  = [[0,SHIRT],[1,SHIRT],[2,SHIRT],[3,SHIRT],[4,SHIRT],[5,SHIRT],[6,SHIRT]];
        grid[6]  = [[0,SHIRT],[1,SHIRT],[2,SHIRT],[3,SHIRT],[4,SHIRT],[5,SHIRT],[6,SHIRT]];
        grid[7]  = [[1,PANTS],[2,PANTS],[3,PANTS],[4,PANTS],[5,PANTS]];
        const lOff = frame===0 ? 0 : -1, rOff = frame===0 ? 0 : 1;
        grid[8]  = [[1+lOff,PANTS],[2+lOff,PANTS],[4+rOff,PANTS],[5+rOff,PANTS]];
        grid[9]  = [[1+lOff,PANTS],[2+lOff,PANTS],[4+rOff,PANTS],[5+rOff,PANTS]];
        grid[10] = [[1+lOff,SHOES],[2+lOff,SHOES],[4+rOff,SHOES],[5+rOff,SHOES]];
      } else if (dir === 3) { // facing UP
        grid[0]  = [[1,HAIR],[2,HAIR],[3,HAIR],[4,HAIR],[5,HAIR]];
        grid[1]  = [[1,HAIR],[2,HAIR],[3,HAIR],[4,HAIR],[5,HAIR]];
        grid[2]  = [[1,HAIR],[2,HAIR],[3,HAIR],[4,HAIR],[5,HAIR]];
        grid[3]  = [[1,SKIN],[2,SKIN],[3,SKIN],[4,SKIN],[5,SKIN]];
        grid[4]  = [[1,SKIN],[2,SKIN],[3,SKIN],[4,SKIN],[5,SKIN]];
        grid[5]  = [[0,SHIRT],[1,SHIRT],[2,SHIRT],[3,SHIRT],[4,SHIRT],[5,SHIRT],[6,SHIRT]];
        grid[6]  = [[0,SHIRT],[1,SHIRT],[2,SHIRT],[3,SHIRT],[4,SHIRT],[5,SHIRT],[6,SHIRT]];
        grid[7]  = [[1,PANTS],[2,PANTS],[3,PANTS],[4,PANTS],[5,PANTS]];
        const lOff = frame===0 ? 0 : -1, rOff = frame===0 ? 0 : 1;
        grid[8]  = [[1+lOff,PANTS],[2+lOff,PANTS],[4+rOff,PANTS],[5+rOff,PANTS]];
        grid[9]  = [[1+lOff,PANTS],[2+lOff,PANTS],[4+rOff,PANTS],[5+rOff,PANTS]];
        grid[10] = [[1+lOff,SHOES],[2+lOff,SHOES],[4+rOff,SHOES],[5+rOff,SHOES]];
      } else { // LEFT or RIGHT
        const flip = dir === 1; // flip x if left
        const fc = (c: number) => flip ? 6 - c : c;
        grid[0]  = [[fc(2),HAIR],[fc(3),HAIR],[fc(4),HAIR],[fc(5),HAIR]];
        grid[1]  = [[fc(1),HAIR],[fc(2),HAIR],[fc(3),HAIR],[fc(4),HAIR],[fc(5),HAIR]];
        grid[2]  = [[fc(1),SKIN],[fc(2),SKIN],[fc(3),SKIN],[fc(4),SKIN],[fc(5),SKIN]];
        grid[3]  = [[fc(1),SKIN],[fc(2),SKIN],[fc(3),EYE],[fc(4),SKIN],[fc(5),SKIN]];
        grid[4]  = [[fc(1),SKIN],[fc(2),SKIN],[fc(3),MOUTH],[fc(4),SKIN],[fc(5),SKIN]];
        grid[5]  = [[fc(0),SHIRT],[fc(1),SHIRT],[fc(2),SHIRT],[fc(3),SHIRT],[fc(4),SHIRT],[fc(5),SHIRT]];
        grid[6]  = [[fc(0),SHIRT],[fc(1),SHIRT],[fc(2),SHIRT],[fc(3),SHIRT],[fc(4),SHIRT],[fc(5),SHIRT]];
        grid[7]  = [[fc(1),PANTS],[fc(2),PANTS],[fc(3),PANTS],[fc(4),PANTS]];
        const legF = frame===0 ? 0 : 1;
        grid[8]  = [[fc(1+legF*1),PANTS],[fc(2+legF*1),PANTS],[fc(3-legF*1),PANTS],[fc(4-legF*1),PANTS]];
        grid[9]  = [[fc(1+legF*1),PANTS],[fc(2+legF*1),PANTS],[fc(3-legF*1),PANTS],[fc(4-legF*1),PANTS]];
        grid[10] = [[fc(2+legF*1),SHOES],[fc(3-legF*1),SHOES]];
      }

      for (let row = 0; row < grid.length; row++) {
        if (!grid[row]) continue;
        for (const [col, color] of grid[row]) {
          ctx.fillStyle = color;
          ctx.fillRect(cx + col*PX, cy + row*PX, PX, PX);
        }
      }

      // Glow aura around player
      const grd = ctx.createRadialGradient(x, y, p.size*0.5, x, y, p.size * 6);
      grd.addColorStop(0, 'rgba(255,255,255,0.25)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, p.size * 6, 0, Math.PI*2);
      ctx.fill();

      // Sprint flame effect
      if (p.moving && tick.current % 2 === 0) {
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.3);
        ctx.fillStyle = `rgba(255,160,40,${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y + p.size*0.5, p.size * 1.2, 0, Math.PI*2);
        ctx.fill();
      }
    };

    // ════════════════════════════════════════════════
    //  MINIMAP
    // ════════════════════════════════════════════════
    const renderMinimap = (ctx: CanvasRenderingContext2D, mm: HTMLCanvasElement) => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, mm.width, mm.height);
      const sc = mm.width / MAP_W;

      // Background terrain (coarse)
      ctx.fillStyle = '#2d4a20';
      ctx.fillRect(0, 0, mm.width, mm.height);

      // Rough water zone
      ctx.fillStyle = '#1565c0';
      ctx.beginPath();
      ctx.moveTo(0, RIVER[0].y * sc);
      for (const pt of RIVER) ctx.lineTo(pt.x * sc, pt.y * sc);
      ctx.lineTo(mm.width, mm.height);
      ctx.lineTo(0, mm.height);
      ctx.closePath();

      // River line
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(RIVER[0].x * sc, RIVER[0].y * sc);
      for (const pt of RIVER) ctx.lineTo(pt.x * sc, pt.y * sc);
      ctx.stroke();

      // Roads
      ctx.strokeStyle = '#606070';
      ctx.lineWidth = 1;
      for (const road of ROADS) {
        ctx.fillStyle = '#606070';
        ctx.fillRect(road.x*sc, road.y*sc, Math.max(1, road.w*sc), Math.max(1, road.h*sc));
      }

      // Landmarks
      for (const lm of LANDMARKS) {
        ctx.fillStyle = lm.wallColor;
        ctx.fillRect(lm.x*sc, lm.y*sc, Math.max(2, lm.width*sc), Math.max(2, lm.height*sc));
      }

      // Player dot
      const px = player.current.x * sc;
      const py = player.current.y * sc;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 1.5;
      ctx.stroke();

      // FOV box
      const fW = (window.innerWidth  / PIXEL_SCALE) * sc;
      const fH = (window.innerHeight / PIXEL_SCALE) * sc;
      ctx.strokeStyle = 'rgba(255,255,100,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px - fW/2, py - fH/2, fW, fH);

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, mm.width, mm.height);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ══════════════════════════════════════════════════════
  //  JSX
  // ══════════════════════════════════════════════════════
  return (
    <div className="game-wrap">
      <canvas ref={canvasRef} />

      {/* ── TOP-LEFT HUD ── */}
      <div className="hud-tl">
        <div className="hud-title">Seoul Explorer</div>
        <div className="hud-sub">서울 익스플로러</div>
        <div className="hud-coords">
          <span className="coord-label">X</span>
          <span className="coord-val">{info.x.toString().padStart(6,'0')}</span>
          <span className="coord-label">Y</span>
          <span className="coord-val">{info.y.toString().padStart(6,'0')}</span>
        </div>
        {sprinting && <div className="sprint-badge">◀▶ SPRINT</div>}
      </div>

      {/* ── NEARBY LANDMARK ── */}
      {nearby && (
        <div className="hud-landmark">
          <div className="lm-icon">{nearby.emoji}</div>
          <div>
            <div className="lm-tag">NEARBY</div>
            <div className="lm-name">{nearby.name}</div>
            <div className="lm-type">{nearby.type.toUpperCase()}</div>
          </div>
        </div>
      )}

      {/* ── MINIMAP ── */}
      <div className="minimap-wrap">
        <div className="minimap-label">MAP</div>
        <canvas ref={minimapRef} className="minimap-canvas" />
      </div>

      {/* ── INTERIOR HUD ── */}
      {interiorHUD && (
        <div className="hud-interior">
          <div className="int-icon">{interiorHUD.emoji}</div>
          <div className="int-info">
            <div className="int-name">{interiorHUD.name}</div>
            <div className="int-floor">{interiorHUD.floor}F / {interiorHUD.max}F</div>
          </div>
          <div className="int-hint">E: 나가기 | ▲엘리베이터: W | ▼: S</div>
        </div>
      )}

      {/* ── CONTROLS ── */}
      <div className="controls-bar">
        <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
        <span>이동</span>
        <kbd>SHIFT</kbd>
        <span>달리기</span>
        <kbd>E</kbd>
        <span>입장/퇴장</span>
      </div>
    </div>
  );
}
