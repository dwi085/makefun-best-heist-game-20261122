// The room's watchers: two patrolling guards and two sweeping
// wall cameras. A guard walks a waypoint loop with a vision cone;
// spot the thief and suspicion climbs, hit 100 and the guard gives
// chase. A camera never moves, but its cone feeds the alarm meter.
import {
  GUARD_R,
  GUARD_PATROL_SPEED,
  GUARD_CHASE_SPEED,
  CONE_RANGE,
  CONE_HALF_ANGLE,
  CAM_RANGE,
  CAM_HALF_ANGLE,
  SUSPICION_RISE,
  SUSPICION_RISE_CLOSE,
  SUSPICION_FALL,
  SNEAK_SPOT_FACTOR,
  NOISE_RADIUS,
  NOISE_RATE,
  COIN_HEAR_RADIUS,
  COIN_INVESTIGATE_SECONDS,
} from './config.js';
import { angleDiff, clamp, dist } from './random.js';
import { hasLineOfSight, resolveCollision } from './level.js';

export class Guard {
  constructor(patrol, phaseOffset) {
    this.name = patrol.name;
    this.waypoints = patrol.waypoints;
    // Start partway along the loop so the two guards are never in sync.
    this.wp = phaseOffset % this.waypoints.length;
    const start = this.waypoints[this.wp];
    this.x = start.x;
    this.y = start.y;
    this.angle = 0;
    this.suspicion = 0;
    this.chasing = false;
    this.investigate = null; // {x, y, t} while walking to a thrown coin
    this.investigateTimer = 0;
    this.seesThief = false;
    this.walkPhase = 0;
  }

  // Can this guard see the thief right now? Inside the cone, in
  // range, and with a clear line of sight past the display cases.
  canSee(px, py) {
    const d = dist(this.x, this.y, px, py);
    if (d > CONE_RANGE) return false;
    const toThief = Math.atan2(py - this.y, px - this.x);
    if (Math.abs(angleDiff(this.angle, toThief)) > CONE_HALF_ANGLE) return false;
    return hasLineOfSight(this.x, this.y, px, py);
  }

  // One simulation step. dt is seconds. thief = {x, y, sneaking,
  // running}; alarm is the shared meter the caller owns.
  update(dt, thief, coin) {
    // A fresh coin clink pulls a nearby guard off its patrol.
    if (coin && !this.chasing) {
      const d = dist(this.x, this.y, coin.x, coin.y);
      if (d < COIN_HEAR_RADIUS) {
        this.investigate = { x: coin.x, y: coin.y };
        this.investigateTimer = COIN_INVESTIGATE_SECONDS;
      }
    }

    this.seesThief = this.canSee(thief.x, thief.y);
    if (this.seesThief) {
      const d = dist(this.x, this.y, thief.x, thief.y);
      let rate = d < 85 ? SUSPICION_RISE_CLOSE : SUSPICION_RISE;
      if (thief.sneaking) rate *= SNEAK_SPOT_FACTOR;
      this.suspicion = clamp(this.suspicion + rate * dt, 0, 100);
    } else {
      this.suspicion = clamp(this.suspicion - SUSPICION_FALL * dt, 0, 100);
    }

    // Running feet are loud up close, even out of the cone.
    if (thief.running && !this.seesThief) {
      if (dist(this.x, this.y, thief.x, thief.y) < NOISE_RADIUS) {
        this.suspicion = clamp(this.suspicion + NOISE_RATE * dt, 0, 100);
      }
    }

    if (this.suspicion >= 100) this.chasing = true;
    if (this.chasing && this.suspicion < 30 && !this.seesThief) {
      this.chasing = false;
    }
    if (this.chasing) this.investigate = null;

    // Decide where to walk, then walk there.
    let target = null;
    let speed = GUARD_PATROL_SPEED;
    if (this.chasing) {
      target = { x: thief.x, y: thief.y };
      speed = GUARD_CHASE_SPEED;
    } else if (this.investigate) {
      this.investigateTimer -= dt;
      if (this.investigateTimer <= 0) {
        this.investigate = null;
      } else {
        target = this.investigate;
        speed = GUARD_PATROL_SPEED * 1.35;
      }
    }
    if (!target) {
      target = this.waypoints[this.wp];
      if (dist(this.x, this.y, target.x, target.y) < 6) {
        this.wp = (this.wp + 1) % this.waypoints.length;
        target = this.waypoints[this.wp];
      }
    }
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 0.5) {
      const step = Math.min(d, speed * dt);
      this.x += (dx / d) * step;
      this.y += (dy / d) * step;
      this.angle = Math.atan2(dy, dx);
      this.walkPhase += dt * 9;
    }
    resolveCollision(this, GUARD_R);
  }
}

export class Camera {
  constructor(spec) {
    this.x = spec.x;
    this.y = spec.y;
    this.baseAngle = spec.baseAngle;
    this.sweep = spec.sweep;
    this.phase = spec.phase;
    this.t = spec.phase * 2.3;
    this.angle = spec.baseAngle;
    this.seesThief = false;
  }

  // Sweep back and forth, then check the cone like a guard does.
  update(dt, thief) {
    this.t += dt;
    this.angle =
      this.baseAngle + Math.sin(this.t * 0.55) * this.sweep;
    const d = dist(this.x, this.y, thief.x, thief.y);
    let seen = false;
    if (d <= CAM_RANGE) {
      const toThief = Math.atan2(thief.y - this.y, thief.x - this.x);
      if (Math.abs(angleDiff(this.angle, toThief)) <= CAM_HALF_ANGLE) {
        seen = hasLineOfSight(this.x, this.y, thief.x, thief.y);
      }
    }
    this.seesThief = seen;
    return seen;
  }
}
