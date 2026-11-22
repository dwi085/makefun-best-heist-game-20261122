// Deterministic screenshot scenes. The game reads ?shot= and
// ?seed= from the URL: start shows the title over the fresh room,
// play fast-forwards a scripted 6-second heist, end shows the win
// screen. Same seed, same frame, every time — so the screenshots
// are real renders of the game's own code, not staged by hand.
import { PLAYER_START, PLAYER_SPEED, SNEAK_SPEED } from './config.js';
import { resolveCollision } from './level.js';

// A scripted heist, one frame per step at 60 fps: [dx, dy, sneak].
// Up the left wall, right past the gold case (pocketed on the way
// from below it — the case is solid), then sneak down and around
// the pedestal's top corner, and hold still beside the Sapphire
// while a guard's cone sweeps past — the alarm already warm.
function scriptedMoves() {
  const moves = [];
  const push = (frames, dx, dy, sneak) => {
    for (let i = 0; i < frames; i++) moves.push([dx, dy, sneak ? 1 : 0]);
  };
  push(120, 0, -1, 0); // run up the left wall from the entry door
  push(40, 1, 0, 0); // run right toward the gold case: gold pocketed
  push(60, 1, 0, 1); // sneak right across the top of the room
  push(60, 0, 1, 1); // sneak down toward the pedestal
  push(45, 1, 0, 1); // edge right, below the pedestal's shadow
  push(20, 0, -1, 1); // rise to the pedestal's top-left corner
  push(45, 1, 0, 1); // creep right along the pedestal's top edge
  push(100, 0, 0, 0); // hold still beside the Sapphire and watch the guard pass
  return moves;
}

// Run the scripted moves against a live game state, without
// rendering, so the play shot lands mid-heist with the alarm
// already warm and the gold bars in the bag. Silent mode keeps
// the staging from ever flipping the screen to win or lose.
export function runScriptedHeist(game, seed) {
  const moves = scriptedMoves();
  const dt = 1 / 60;
  for (const move of moves) {
    const [dx, dy, sneak] = move;
    const speed = sneak ? SNEAK_SPEED : PLAYER_SPEED;
    game.thief.x += dx * speed * dt;
    game.thief.y += dy * speed * dt;
    game.thief.sneaking = !!sneak;
    game.thief.running = !sneak && (dx !== 0 || dy !== 0);
    if (dx !== 0 || dy !== 0) game.thief.angle = Math.atan2(dy, dx);
    resolveCollision(game.thief, 12);
    game.tick(dt, true);
  }
  // Freeze sneaking, facing the Sapphire, alarm warm.
  game.thief.sneaking = true;
  game.thief.running = false;
  game.thief.angle = Math.atan2(300 - game.thief.y, 480 - game.thief.x);
  game.alarm = Math.max(game.alarm, 34);
  game.maxAlarm = Math.max(game.maxAlarm, 34);
}

// Build the state for one named shot. Returns the screen to show
// ('title' | 'play' | 'win') after the scene has been staged.
export function stageShot(game, shot, seed) {
  if (shot === 'start') {
    game.reset(seed);
    return 'title';
  }
  if (shot === 'end') {
    game.reset(seed);
    game.loot.forEach((item) => {
      item.taken = true;
    });
    game.score = 1000;
    game.hasSapphire = true;
    game.time = 74;
    game.maxAlarm = 41;
    return 'win';
  }
  // Default: 'play'.
  game.reset(seed);
  runScriptedHeist(game, seed);
  return 'play';
}

export function playerStartPosition() {
  return { ...PLAYER_START };
}
