// Midnight Vault — shared constants for the heist game.
// One room, one thief, two patrolling guards, two sweeping cameras,
// three pieces of loot and one alarm meter. Everything the other
// modules need to agree on lives here so the room reads the same
// in play, in the title screen and in the deterministic screenshots.
export const VIEW_W = 960;
export const VIEW_H = 600;
export const WALL = 24;

// The thief.
export const PLAYER_R = 12;
export const PLAYER_SPEED = 168; // px per second, running
export const SNEAK_SPEED = 96; // px per second, sneaking (Shift)
export const PLAYER_START = { x: 88, y: 528 };

// Guards: patrol speed, chase speed, body radius, vision cone.
export const GUARD_R = 14;
export const GUARD_PATROL_SPEED = 58;
export const GUARD_CHASE_SPEED = 108;
export const CONE_RANGE = 178;
export const CONE_HALF_ANGLE = 0.62; // radians, about 35 degrees each side

// Wall cameras: sweep range, cone half-angle, alarm build rate.
export const CAM_RANGE = 212;
export const CAM_HALF_ANGLE = 0.38;
export const CAM_ALARM_RATE = 46; // alarm points per second while seen

// Alarm meter 0..100. Guards add to it once they are suspicious.
export const ALARM_MAX = 100;
export const ALARM_DECAY = 7; // points per second while unseen
export const ALARM_GUARD_RATE = 12; // points per second per suspicious guard
export const ALARM_LOCK_SECONDS = 6; // full alarm: every guard hunts

// Suspicion 0..100 per guard. 100 means the guard gives chase.
export const SUSPICION_RISE = 58; // per second while the thief is seen
export const SUSPICION_RISE_CLOSE = 95; // per second, thief closer than 85 px
export const SUSPICION_FALL = 26; // per second while the thief is hidden
export const SNEAK_SPOT_FACTOR = 0.5; // sneaking halves how fast guards notice
export const NOISE_RADIUS = 95; // running this close to a guard is heard
export const NOISE_RATE = 14; // suspicion per second from running noise
export const CATCH_DIST = 22; // guard this close to the thief: busted

// The thief carries three coins. Click to throw one; guards nearby
// walk over to investigate the clink instead of patrolling.
export const COINS_START = 3;
export const COIN_HEAR_RADIUS = 155;
export const COIN_INVESTIGATE_SECONDS = 4;

// Loot values. The Sapphire is the job: without it the exit stays locked.
export const LOOT = {
  sapphire: 500,
  gold: 200,
  painting: 300,
};
export const PICKUP_RADIUS = 55; // loot sits on cases; the thief grabs it from the edge

// Palette: a night museum — dark blue-grey stone, gold trim, a red
// carpet runner, and one hot cyan sapphire that the eye finds first.
export const PALETTE = {
  floorA: '#1b2334',
  floorB: '#161d2c',
  wall: '#2b3450',
  wallTrim: '#c9a227',
  carpet: '#6e1423',
  carpetEdge: '#a67c2e',
  caseFrame: '#8a6d2b',
  caseGlass: 'rgba(159, 216, 255, 0.10)',
  caseShine: 'rgba(255, 255, 255, 0.16)',
  pedestal: '#d8d3c3',
  pedestalTrim: '#c9a227',
  sapphire: '#4fe3ff',
  sapphireGlow: 'rgba(79, 227, 255, 0.35)',
  gold: '#f2c14e',
  goldDark: '#a67c2e',
  paintingSky: '#ff9d5c',
  paintingSea: '#2e6f8e',
  guardBody: '#3d5a80',
  guardTrim: '#e0e6f2',
  cone: 'rgba(255, 214, 64, 0.16)',
  coneEdge: 'rgba(255, 214, 64, 0.45)',
  coneAlert: 'rgba(255, 80, 60, 0.20)',
  coneAlertEdge: 'rgba(255, 80, 60, 0.6)',
  camCone: 'rgba(255, 70, 70, 0.13)',
  camConeEdge: 'rgba(255, 70, 70, 0.4)',
  thief: '#101014',
  thiefTrim: '#e8e8e8',
  exitLocked: '#8e2f2f',
  exitOpen: '#2f8e4f',
  hudBg: 'rgba(8, 10, 18, 0.82)',
  text: '#f2ead8',
  textDim: '#9aa5bd',
};

// The exit door sits in the bottom wall, centre. It stays locked
// (red) until the Sapphire is pocketed, then opens (green).
export const EXIT_RECT = { x: 430, y: VIEW_H - WALL, w: 100, h: WALL };
export const EXIT_TOUCH = { x: 430, y: VIEW_H - WALL - 14, w: 100, h: 30 };
