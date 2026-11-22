// All drawing lives here: one canvas, flat colours with a few
// glows, tuned so the whole heist — thief, guards, cones, cameras,
// loot and the alarm meter — reads in a single small screenshot.
import { VIEW_W, VIEW_H, WALL, PALETTE, EXIT_RECT } from './config.js';
import { OBSTACLES, CARPET } from './level.js';

// Draw a vision cone from (x, y) along angle, with a soft edge.
function drawCone(ctx, x, y, angle, halfAngle, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawRoom(ctx, time) {
  // Floor: two-tone checker, large tiles so it stays calm at a glance.
  const tile = 60;
  for (let ty = 0; ty < VIEW_H / tile; ty++) {
    for (let tx = 0; tx < VIEW_W / tile; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * tile, ty * tile, tile, tile);
    }
  }
  // Red carpet runner from the entry door up to the pedestal.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(CARPET.x, CARPET.y, CARPET.w, CARPET.h);
  ctx.strokeStyle = PALETTE.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(CARPET.x + 2, CARPET.y, CARPET.w - 4, CARPET.h);
  ctx.fillStyle = 'rgba(201, 162, 39, 0.5)';
  for (let y = CARPET.y + 26; y < CARPET.y + CARPET.h - 10; y += 44) {
    ctx.beginPath();
    ctx.moveTo(480, y);
    ctx.lineTo(492, y + 12);
    ctx.lineTo(480, y + 24);
    ctx.lineTo(468, y + 12);
    ctx.closePath();
    ctx.fill();
  }

  // Display cases and the pedestal, with a glass shine.
  for (const rect of OBSTACLES) {
    if (rect.kind === 'pedestal') {
      ctx.fillStyle = PALETTE.pedestal;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = PALETTE.pedestalTrim;
      ctx.lineWidth = 3;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(rect.x, rect.y + rect.h - 8, rect.w, 8);
    } else {
      ctx.fillStyle = '#232c42';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = PALETTE.caseGlass;
      ctx.fillRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
      ctx.strokeStyle = PALETTE.caseFrame;
      ctx.lineWidth = 4;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = PALETTE.caseShine;
      ctx.beginPath();
      ctx.moveTo(rect.x + 10, rect.y + rect.h - 6);
      ctx.lineTo(rect.x + 34, rect.y + 6);
      ctx.lineTo(rect.x + 52, rect.y + 6);
      ctx.lineTo(rect.x + 28, rect.y + rect.h - 6);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// Walls: thick slate border with a gold inner trim, and the exit
// door drawn into the bottom wall — red while locked, green once
// the Sapphire is pocketed.
export function drawWalls(ctx, exitOpen) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, WALL);
  ctx.fillRect(0, VIEW_H - WALL, VIEW_W, WALL);
  ctx.fillRect(0, 0, WALL, VIEW_H);
  ctx.fillRect(VIEW_W - WALL, 0, WALL, VIEW_H);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(WALL - 1, WALL - 1, VIEW_W - 2 * WALL + 2, VIEW_H - 2 * WALL + 2);
  // Exit door.
  ctx.fillStyle = exitOpen ? PALETTE.exitOpen : PALETTE.exitLocked;
  ctx.fillRect(EXIT_RECT.x, EXIT_RECT.y, EXIT_RECT.w, EXIT_RECT.h);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    exitOpen ? 'EXIT  ▶' : 'LOCKED',
    EXIT_RECT.x + EXIT_RECT.w / 2,
    EXIT_RECT.y + EXIT_RECT.h / 2 + 1,
  );
}

// The loot, each drawn so its shape is unmistakable at thumbnail size.
export function drawLoot(ctx, loot, sparkles, time) {
  for (const item of loot) {
    if (item.taken) continue;
    if (item.id === 'sapphire') {
      // Glowing cyan diamond on the pedestal, with twinkling sparks.
      const pulse = 0.75 + 0.25 * Math.sin(time * 3);
      ctx.save();
      ctx.shadowColor = PALETTE.sapphire;
      ctx.shadowBlur = 22 * pulse;
      ctx.fillStyle = PALETTE.sapphire;
      ctx.beginPath();
      ctx.moveTo(480, 282);
      ctx.lineTo(496, 300);
      ctx.lineTo(480, 318);
      ctx.lineTo(464, 300);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(480, 288);
      ctx.lineTo(489, 300);
      ctx.lineTo(480, 312);
      ctx.lineTo(471, 300);
      ctx.closePath();
      ctx.fill();
      for (const s of sparkles) {
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 2 + s.phase));
        ctx.fillStyle = `rgba(255,255,255,${(tw * 0.9).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(480 + s.x, 300 + s.y, s.r * tw, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (item.id === 'gold') {
      // Three stacked gold bars on the top-left case.
      for (let i = 0; i < 3; i++) {
        const bx = 196 + i * 16;
        const by = i === 2 ? 128 : 140;
        ctx.fillStyle = PALETTE.gold;
        ctx.fillRect(bx, by, 22, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(bx, by, 22, 3);
        ctx.strokeStyle = PALETTE.goldDark;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, 22, 12);
      }
    } else if (item.id === 'painting') {
      // A framed sunset on the right wall.
      ctx.fillStyle = PALETTE.goldDark;
      ctx.fillRect(892, 268, 44, 64);
      const grad = ctx.createLinearGradient(0, 272, 0, 328);
      grad.addColorStop(0, PALETTE.paintingSky);
      grad.addColorStop(0.55, '#c96f4a');
      grad.addColorStop(1, PALETTE.paintingSea);
      ctx.fillStyle = grad;
      ctx.fillRect(897, 273, 34, 54);
      ctx.fillStyle = '#ffe9b0';
      ctx.beginPath();
      ctx.arc(914, 288, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d2b3a';
      ctx.beginPath();
      ctx.moveTo(897, 327);
      ctx.lineTo(910, 306);
      ctx.lineTo(923, 327);
      ctx.closePath();
      ctx.fill();
    }
  }
}

// Guards: cone first (under the body), then a navy body with a
// white direction tick, a suspicion arc overhead, and a "!" once
// the guard is onto you. A chasing guard's cone burns red.
export function drawGuard(ctx, guard) {
  const alert = guard.chasing || guard.suspicion > 55;
  drawCone(
    ctx,
    guard.x,
    guard.y,
    guard.angle,
    0.62,
    178,
    alert ? PALETTE.coneAlert : PALETTE.cone,
    alert ? PALETTE.coneAlertEdge : PALETTE.coneEdge,
  );
  ctx.fillStyle = PALETTE.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.guardTrim;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Direction tick: a little cap brim pointing where he looks.
  ctx.strokeStyle = PALETTE.guardTrim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x + Math.cos(guard.angle) * 8, guard.y + Math.sin(guard.angle) * 8);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * 19, guard.y + Math.sin(guard.angle) * 19);
  ctx.stroke();
  // Eyes: two white dots on the facing side.
  const ex = Math.cos(guard.angle);
  const ey = Math.sin(guard.angle);
  const px = -ey;
  const py = ex;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(guard.x + ex * 5 + px * 4.5, guard.y + ey * 5 + py * 4.5, 2.2, 0, Math.PI * 2);
  ctx.arc(guard.x + ex * 5 - px * 4.5, guard.y + ey * 5 - py * 4.5, 2.2, 0, Math.PI * 2);
  ctx.fill();
  // Suspicion arc overhead.
  if (guard.suspicion > 4) {
    ctx.strokeStyle = guard.suspicion > 55 ? '#ff5040' : '#ffd640';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
    ctx.stroke();
  }
  if (guard.chasing || guard.suspicion >= 100) {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('!', guard.x, guard.y - 24);
  }
  // Name tag, small and dim.
  ctx.fillStyle = 'rgba(230, 236, 245, 0.75)';
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(guard.name, guard.x, guard.y + 19);
}

// Cameras: a small wall box with a lens, sweeping a red cone.
export function drawCamera(ctx, camera) {
  drawCone(
    ctx,
    camera.x,
    camera.y,
    camera.angle,
    0.38,
    212,
    PALETTE.camCone,
    PALETTE.camConeEdge,
  );
  ctx.fillStyle = '#1c2438';
  ctx.strokeStyle = '#ff5040';
  ctx.lineWidth = 2;
  if (camera.y <= 24) {
    ctx.fillRect(camera.x - 14, camera.y - 4, 28, 14);
    ctx.strokeRect(camera.x - 14, camera.y - 4, 28, 14);
  } else {
    ctx.fillRect(camera.x - 4, camera.y - 14, 14, 28);
    ctx.strokeRect(camera.x - 4, camera.y - 14, 14, 28);
  }
  ctx.fillStyle = camera.seesThief ? '#ff2020' : '#ff7070';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

// The thief: a black-hooded figure with a pale mask band and white
// eyes, plus a soft shadow so he pops off the floor. A thrown coin
// draws as a small gold dot with a ring where it landed.
export function drawThief(ctx, thief) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101014';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 12, 0, Math.PI * 2);
  ctx.stroke();
  // Mask band across the eyes, facing the move direction.
  const ex = Math.cos(thief.angle);
  const ey = Math.sin(thief.angle);
  const px = -ey;
  const py = ex;
  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(thief.x + ex * 2 + px * 8, thief.y + ey * 2 + py * 8);
  ctx.lineTo(thief.x + ex * 2 - px * 8, thief.y + ey * 2 - py * 8);
  ctx.stroke();
  ctx.fillStyle = '#101014';
  ctx.beginPath();
  ctx.arc(thief.x + ex * 5 + px * 4, thief.y + ey * 5 + py * 4, 1.8, 0, Math.PI * 2);
  ctx.arc(thief.x + ex * 5 - px * 4, thief.y + ey * 5 - py * 4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (thief.sneaking) {
    ctx.fillStyle = 'rgba(242, 234, 216, 0.8)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('sneaking', thief.x, thief.y + 17);
  }
}

export function drawCoin(ctx, coin) {
  if (!coin) return;
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 9 + Math.sin(coin.age * 6) * 2, 0, Math.PI * 2);
  ctx.stroke();
}

// --- HUD and screens -----------------------------------------------------

// Top bar: alarm meter on the left, loot and coins in the middle,
// timer and objective on the right. Always on screen, always legible.
export function drawHud(ctx, state) {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  // Alarm meter.
  const alarm = state.alarm;
  const flashing = alarm > 75 && Math.floor(state.time * 4) % 2 === 0;
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ALARM', 12, 18);
  ctx.fillStyle = '#20263a';
  ctx.fillRect(72, 9, 180, 16);
  const grad = ctx.createLinearGradient(72, 0, 252, 0);
  grad.addColorStop(0, '#3fae5a');
  grad.addColorStop(0.55, '#e8b93a');
  grad.addColorStop(1, '#e83a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(72, 9, 180 * (alarm / 100), 16);
  if (flashing) {
    ctx.strokeStyle = '#ff2020';
    ctx.lineWidth = 2;
    ctx.strokeRect(71, 8, 182, 18);
  }
  // Loot pips: diamond / bars / frame, lit once pocketed.
  const lootLabels = [
    { id: 'sapphire', draw: '◆' },
    { id: 'gold', draw: '▬' },
    { id: 'painting', draw: '▣' },
  ];
  ctx.font = 'bold 15px system-ui, sans-serif';
  lootLabels.forEach((slot, i) => {
    const item = state.loot.find((l) => l.id === slot.id);
    const taken = item && item.taken;
    ctx.fillStyle = taken ? '#4fe3ff' : 'rgba(154, 165, 189, 0.5)';
    ctx.fillText(slot.draw, 280 + i * 26, 18);
  });
  ctx.fillStyle = '#f2ead8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`$${state.score}`, 366, 18);
  ctx.fillText(`coins ${state.coins}`, 440, 18);
  // Timer + objective, right side.
  const secs = Math.floor(state.time);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  ctx.textAlign = 'right';
  ctx.fillText(`${mm}:${ss}`, 948, 18);
  ctx.fillStyle = '#9aa5bd';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(
    state.hasSapphire ? 'Sapphire secured — EXIT!' : 'Steal the Sapphire → EXIT',
    700,
    18,
  );
}

// Full-screen overlays. The room stays visible behind a dim veil,
// so even the title screen shows the whole heist at a glance.
function veil(ctx) {
  ctx.fillStyle = 'rgba(6, 8, 16, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10, 13, 24, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

export function drawTitle(ctx) {
  veil(ctx);
  // Panel sits low so the Sapphire pedestal, the guards and the
  // cones stay visible above it — the cover shot must show the heist.
  panel(ctx, 230, 322, 500, 234);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4fe3ff';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('MIDNIGHT VAULT', 480, 372);
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 19px system-ui, sans-serif';
  ctx.fillText('— The Sapphire Job —', 480, 400);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('One thief. Two guards. Two cameras. One sapphire.', 480, 432);
  ctx.fillText('Grab the Sapphire, dodge the cones, slip out the exit.', 480, 454);
  ctx.fillStyle = '#9aa5bd';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('WASD / arrows — move      SHIFT — sneak (slow, quiet)', 480, 486);
  ctx.fillText('CLICK — throw a coin to distract a guard (3 coins)  •  R — restart', 480, 508);
  ctx.fillStyle = '#4fe3ff';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('Press ENTER or CLICK to start', 480, 538);
}

export function drawWin(ctx, state) {
  veil(ctx);
  panel(ctx, 250, 322, 460, 234);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4fe3ff';
  ctx.font = 'bold 38px system-ui, sans-serif';
  ctx.fillText('CLEAN GETAWAY!', 480, 382);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(`Loot  $${state.score}`, 480, 420);
  ctx.fillText(`Time  ${Math.floor(state.time)}s   •   Peak alarm  ${Math.round(state.maxAlarm)}%`, 480, 448);
  ctx.fillText(state.maxAlarm < 50 ? 'Ghost: never raised the alarm past half.' : 'Loud, but out the door with the goods.', 480, 476);
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('Press R or CLICK to run it again', 480, 524);
}

export function drawLose(ctx, state) {
  veil(ctx);
  panel(ctx, 250, 322, 460, 234);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5040';
  ctx.font = 'bold 38px system-ui, sans-serif';
  ctx.fillText('BUSTED!', 480, 382);
  ctx.fillStyle = '#f2ead8';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('A guard laid hands on you in the gallery.', 480, 420);
  ctx.fillText(`Loot kept  $${state.score}   •   Survived  ${Math.floor(state.time)}s`, 480, 448);
  ctx.fillStyle = '#9aa5bd';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Tip: wait for the cone to sweep past, then sneak behind a case.', 480, 476);
  ctx.fillStyle = '#f2c14e';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('Press R or CLICK to try again', 480, 524);
}
