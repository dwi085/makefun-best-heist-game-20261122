// Tiny deterministic random: mulberry32. The game uses it for
// sparkle positions and patrol phase offsets, and the screenshot
// scenes use it so ?shot=...&seed=N renders the same frame twice.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Random in [min, max) from a mulberry32 stream.
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Clamp a value into [min, max].
export function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

// Smallest signed angle from a to b, in (-PI, PI].
export function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

// Euclidean distance between two points.
export function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

// Deterministic sparkle offsets for the Sapphire, so the play
// screenshot always glints in the same places for a given seed.
export function sapphireSparkles(seed) {
  const rng = mulberry32(seed);
  const spots = [];
  for (let i = 0; i < 7; i++) {
    spots.push({
      x: range(rng, -14, 14),
      y: range(rng, -12, 12),
      r: range(rng, 1, 2.6),
      phase: range(rng, 0, Math.PI * 2),
    });
  }
  return spots;
}
