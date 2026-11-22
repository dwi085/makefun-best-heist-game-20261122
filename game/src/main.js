// Midnight Vault — the game itself: state, input, the loop.
// A top-down heist in one museum room. Steal the Sapphire, dodge
// the guards' cones and the cameras, and slip out the exit door.
// WASD/arrows to move, Shift to sneak, click to throw a coin.
import {
  VIEW_W,
  VIEW_H,
  PLAYER_R,
  PLAYER_SPEED,
  SNEAK_SPEED,
  PLAYER_START,
  GUARD_R,
  CATCH_DIST,
  COINS_START,
  COIN_HEAR_RADIUS,
  PICKUP_RADIUS,
  ALARM_MAX,
  ALARM_DECAY,
  ALARM_GUARD_RATE,
  ALARM_LOCK_SECONDS,
  CAM_ALARM_RATE,
} from './config.js';
import { clamp, dist } from './random.js';
import { freshLoot, resolveCollision, atExit, GUARD_PATROLS, CAMERAS } from './level.js';
import { Guard, Camera } from './actors.js';
import { sapphireSparkles } from './random.js';
import { stageShot } from './shots.js';
import {
  drawRoom,
  drawWalls,
  drawLoot,
  drawGuard,
  drawCamera,
  drawThief,
  drawCoin,
  drawHud,
  drawTitle,
  drawWin,
  drawLose,
} from './render.js';
import {
  ensureAudio,
  playPickup,
  playCoin,
  playAlert,
  playWin,
  playLose,
  setAlarmSiren,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// The whole game state in one object, so the screenshot stager
// can build it, run it, and hand it to the renderer directly.
export const game = {
  screen: 'title', // 'title' | 'play' | 'win' | 'lose'
  time: 0,
  score: 0,
  alarm: 0,
  maxAlarm: 0,
  alarmLock: 0,
  coins: COINS_START,
  coin: null, // {x, y, age} while a thrown coin is on the floor
  loot: freshLoot(),
  hasSapphire: false,
  thief: {
    x: PLAYER_START.x,
    y: PLAYER_START.y,
    angle: -Math.PI / 2,
    sneaking: false,
    running: false,
  },
  guards: [],
  cameras: [],
  sparkles: sapphireSparkles(1),
  seed: 1,
};

// Fresh room, fresh loot, guards back on their loops. The two
// guards start on opposite corners of their loops so their cones
// never sweep in sync.
game.reset = function reset(seed) {
  this.seed = seed || 1;
  this.screen = 'play';
  this.time = 0;
  this.score = 0;
  this.alarm = 0;
  this.maxAlarm = 0;
  this.alarmLock = 0;
  this.coins = COINS_START;
  this.coin = null;
  this.loot = freshLoot();
  this.hasSapphire = false;
  this.thief.x = PLAYER_START.x;
  this.thief.y = PLAYER_START.y;
  this.thief.angle = -Math.PI / 2;
  this.thief.sneaking = false;
  this.thief.running = false;
  this.guards = [
    new Guard(GUARD_PATROLS[0], 0),
    new Guard(GUARD_PATROLS[1], 2),
  ];
  this.cameras = CAMERAS.map((spec) => new Camera(spec));
  this.sparkles = sapphireSparkles(this.seed);
  setAlarmSiren(false);
};

// One world step. In silent mode (screenshot staging) the world
// still moves and suspicion still climbs, but nothing can flip the
// screen to win or lose and no guard can start a chase — the staged
// frame stays a tense mid-heist instead of a bust.
game.tick = function tick(dt, silent) {
  this.time += dt;
  const thief = this.thief;

  // Cameras feed the alarm directly.
  let cameraSees = false;
  for (const camera of this.cameras) {
    if (camera.update(dt, thief)) cameraSees = true;
  }
  if (cameraSees) {
    this.alarm = clamp(this.alarm + CAM_ALARM_RATE * dt, 0, ALARM_MAX);
  }

  // Guards patrol, notice, chase; a fresh coin clink distracts them.
  const freshCoin = this.coin && this.coin.age < 0.5 ? this.coin : null;
  let guardSuspicious = false;
  for (const guard of this.guards) {
    const before = guard.suspicion;
    if (silent) {
      guard.update(dt, thief, freshCoin);
      guard.suspicion = Math.min(guard.suspicion, 85);
      guard.chasing = false;
    } else {
      guard.update(dt, thief, freshCoin);
    }
    if (guard.suspicion > 55) guardSuspicious = true;
    if (!silent && before <= 55 && guard.suspicion > 55) playAlert();
    if (!silent && guard.chasing && dist(guard.x, guard.y, thief.x, thief.y) < CATCH_DIST) {
      this.screen = 'lose';
      playLose();
      setAlarmSiren(false);
      return;
    }
  }
  if (guardSuspicious) {
    this.alarm = clamp(this.alarm + ALARM_GUARD_RATE * dt, 0, ALARM_MAX);
  }

  // Full alarm: every guard hunts for a few seconds, siren on.
  if (this.alarm >= ALARM_MAX && this.alarmLock <= 0) {
    this.alarmLock = ALARM_LOCK_SECONDS;
    if (!silent) {
      for (const guard of this.guards) {
        guard.chasing = true;
        guard.suspicion = 100;
      }
      setAlarmSiren(true);
    }
  }
  if (this.alarmLock > 0) {
    this.alarmLock -= dt;
    if (this.alarmLock <= 0) {
      this.alarm = 60;
      setAlarmSiren(false);
    }
  } else if (!cameraSees && !guardSuspicious) {
    this.alarm = clamp(this.alarm - ALARM_DECAY * dt, 0, ALARM_MAX);
  }
  this.maxAlarm = Math.max(this.maxAlarm, this.alarm);

  // Thrown coin ages out after a few seconds on the floor.
  if (this.coin) {
    this.coin.age += dt;
    if (this.coin.age > 5) this.coin = null;
  }

  // Pickups: walk close to a piece of loot to pocket it.
  for (const item of this.loot) {
    if (item.taken) continue;
    if (dist(thief.x, thief.y, item.x, item.y) < PICKUP_RADIUS) {
      item.taken = true;
      this.score += item.value;
      if (item.id === 'sapphire') this.hasSapphire = true;
      if (!silent) playPickup();
    }
  }

  // Win: Sapphire in the bag, then step into the exit doorway.
  if (!silent && this.hasSapphire && atExit(thief.x, thief.y)) {
    const timeBonus = Math.max(0, 600 - Math.floor(this.time) * 5);
    const ghostBonus = this.maxAlarm < 50 ? 100 : 0;
    this.score += timeBonus + ghostBonus;
    this.screen = 'win';
    playWin();
    setAlarmSiren(false);
  }
};

// --- Input ---------------------------------------------------------------

const keys = new Set();

function moveThief(dt) {
  const thief = game.thief;
  let dx = 0;
  let dy = 0;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  const sneaking = keys.has('shift');
  const len = Math.sqrt(dx * dx + dy * dy);
  thief.sneaking = sneaking;
  thief.running = !sneaking && len > 0;
  if (len === 0) return;
  const speed = sneaking ? SNEAK_SPEED : PLAYER_SPEED;
  thief.x += (dx / len) * speed * dt;
  thief.y += (dy / len) * speed * dt;
  thief.angle = Math.atan2(dy, dx);
  resolveCollision(thief, PLAYER_R);
}

function throwCoin(clientX, clientY) {
  if (game.coins <= 0) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * VIEW_W;
  const y = ((clientY - rect.top) / rect.height) * VIEW_H;
  game.coins -= 1;
  game.coin = { x: clamp(x, 40, VIEW_W - 40), y: clamp(y, 50, VIEW_H - 40), age: 0 };
  playCoin();
}

function startGame() {
  ensureAudio();
  game.reset(game.seed);
  game.screen = 'play';
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    event.preventDefault();
  }
  ensureAudio();
  if (key === 'enter' && game.screen !== 'play') {
    startGame();
    return;
  }
  if (key === 'r' && game.screen !== 'title') {
    startGame();
    return;
  }
  keys.add(key);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener('click', (event) => {
  ensureAudio();
  if (game.screen === 'title' || game.screen === 'win' || game.screen === 'lose') {
    startGame();
    return;
  }
  throwCoin(event.clientX, event.clientY);
});

// --- Render ---------------------------------------------------------------

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawRoom(ctx, game.time);
  drawWalls(ctx, game.hasSapphire);
  drawLoot(ctx, game.loot, game.sparkles, game.time);
  drawCoin(ctx, game.coin);
  for (const camera of game.cameras) drawCamera(ctx, camera);
  for (const guard of game.guards) drawGuard(ctx, guard);
  drawThief(ctx, game.thief);
  drawHud(ctx, game);
  if (game.screen === 'title') drawTitle(ctx);
  else if (game.screen === 'win') drawWin(ctx, game);
  else if (game.screen === 'lose') drawLose(ctx, game);
}

// --- Boot ------------------------------------------------------------------

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = parseInt(params.get('seed') || '1', 10) || 1;

if (shot) {
  // Screenshot mode: stage the scene once and paint it. No loop,
  // so the frame the browser captures is exactly the staged one.
  game.screen = stageShot(game, shot, seed);
  render();
} else {
  game.reset(seed);
  game.screen = 'title';
  let last = performance.now();
  const dummyThief = { x: -9999, y: -9999, sneaking: false, running: false };
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (game.screen === 'play') {
      moveThief(dt);
      game.tick(dt, false);
    } else if (game.screen === 'title') {
      // The room stays alive behind the title veil.
      for (const guard of game.guards) guard.update(dt, dummyThief, null);
      for (const camera of game.cameras) camera.update(dt, dummyThief);
      game.time += dt;
    }
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
