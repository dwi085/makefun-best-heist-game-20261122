// The room: one museum gallery the thief crosses, with display
// cases as cover, a central pedestal holding the Sapphire, and
// the exit door in the bottom wall. Guards walk fixed loops that
// never cross a case; cameras hang on the top and left walls.
import { VIEW_W, VIEW_H, WALL, EXIT_RECT } from './config.js';

// Solid rectangles the thief and the guards walk around. The
// pedestal is solid too — the Sapphire is grabbed from its edge.
export const OBSTACLES = [
  { x: 150, y: 110, w: 130, h: 70, kind: 'case', label: 'gold' },
  { x: 680, y: 110, w: 130, h: 70, kind: 'case', label: 'idol' },
  { x: 150, y: 420, w: 130, h: 70, kind: 'case', label: 'vase' },
  { x: 680, y: 420, w: 130, h: 70, kind: 'case', label: 'mask' },
  { x: 455, y: 275, w: 50, h: 50, kind: 'pedestal', label: 'sapphire' },
];

// The red carpet runner: entry door at the bottom, up to the pedestal.
export const CARPET = { x: 440, y: 325, w: 80, h: 227 };

// Loot pieces. x/y is the grab point; taken flips when pocketed.
export const LOOT_SPOTS = [
  { id: 'sapphire', x: 480, y: 300, value: 500, name: 'Sapphire', taken: false },
  { id: 'gold', x: 215, y: 145, value: 200, name: 'Gold Bars', taken: false },
  { id: 'painting', x: 906, y: 300, value: 300, name: 'Sunset Painting', taken: false },
];

// Guard patrol loops: Rook walks the top half, Bishop the bottom.
export const GUARD_PATROLS = [
  {
    name: 'Rook',
    waypoints: [
      { x: 90, y: 90 },
      { x: 870, y: 90 },
      { x: 870, y: 250 },
      { x: 90, y: 250 },
    ],
  },
  {
    name: 'Bishop',
    waypoints: [
      { x: 90, y: 510 },
      { x: 870, y: 510 },
      { x: 870, y: 360 },
      { x: 90, y: 360 },
    ],
  },
];

// Wall cameras: mount point, base aim angle, sweep half-width.
export const CAMERAS = [
  { x: 480, y: WALL, baseAngle: Math.PI / 2, sweep: 0.9, phase: 0 },
  { x: WALL, y: 300, baseAngle: 0, sweep: 0.8, phase: 1.7 },
];

// Build a fresh loot list so a restart never shares taken flags.
export function freshLoot() {
  return LOOT_SPOTS.map((spot) => ({ ...spot, taken: false }));
}

// --- Collision and line of sight ---------------------------------------

// Does a circle of radius r at (x, y) overlap a rectangle?
export function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

// Keep a circle inside the room and out of the solid rectangles.
// Moves the circle out along the smallest push needed, one axis at
// a time, so sliding along a case edge still works.
export function resolveCollision(pos, r) {
  const minX = WALL + r;
  const maxX = VIEW_W - WALL - r;
  const minY = WALL + r;
  const maxY = VIEW_H - WALL - r;
  pos.x = Math.max(minX, Math.min(maxX, pos.x));
  pos.y = Math.max(minY, Math.min(maxY, pos.y));
  for (const rect of OBSTACLES) {
    if (!circleHitsRect(pos.x, pos.y, r, rect)) continue;
    const pushLeft = pos.x - (rect.x - r);
    const pushRight = rect.x + rect.w + r - pos.x;
    const pushUp = pos.y - (rect.y - r);
    const pushDown = rect.y + rect.h + r - pos.y;
    const smallest = Math.min(pushLeft, pushRight, pushUp, pushDown);
    if (smallest === pushLeft) pos.x = rect.x - r;
    else if (smallest === pushRight) pos.x = rect.x + rect.w + r;
    else if (smallest === pushUp) pos.y = rect.y - r;
    else pos.y = rect.y + rect.h + r;
  }
  return pos;
}

// Segment (x1,y1)-(x2,y2) against one rectangle, slab test.
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  // X slabs: entry t = (rect.x - x1) / dx, exit t = (rect.x + w - x1) / dx.
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  // Y slabs, same idea.
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

// True when nothing solid stands between two points: a guard or a
// camera can only spot the thief with a clear line of sight, so
// ducking behind a display case really hides you.
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const rect of OBSTACLES) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

// Is the point inside the exit touch zone?
export function atExit(x, y) {
  return (
    x >= EXIT_RECT.x - 6 &&
    x <= EXIT_RECT.x + EXIT_RECT.w + 6 &&
    y >= VIEW_H - WALL - 16 &&
    y <= VIEW_H
  );
}
