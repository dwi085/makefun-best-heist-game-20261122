# Midnight Vault — The Sapphire Job

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/dwi085/makefun-best-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/dwi085/makefun-best-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down heist game for the [make.fun best-heist-game-20261122-0559 bounty](https://make.fun/bounty/best-heist-game-20261122-0559): one thief, one museum gallery, two patrolling guards with vision cones, two sweeping security cameras, three pieces of loot — and one alarm meter standing between you and the exit.

## The job

Steal the **Sapphire** from its pedestal in the middle of the gallery, then slip out the exit door in the bottom wall. Gold bars and a sunset painting are bonus loot. Get spotted and a guard's suspicion climbs; hit 100 and he gives chase. Cameras feed the alarm meter directly, and a full alarm sends every guard hunting. Run loud and guards hear you — sneak (Shift) to stay quiet, or throw a coin (click) to pull a guard off his patrol.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, quieter, harder to spot)
- **Click** — throw a coin to distract a nearby guard (3 coins)
- **R** — restart, **Enter** — start

Win by pocketing the Sapphire and reaching the green EXIT. Get caught and it's BUSTED.

## Play it

Serve `game/` with any static server and open `game/index.html` in desktop Chrome. No network requests, no build step — the game is plain HTML, CSS and JavaScript under `game/`, and its sounds are synthesized with WebAudio.

Deterministic screenshots: `game/index.html?shot=start|play|end&seed=N` stages one of three scenes (title, mid-heist, getaway) for a fixed seed.

## Layout

- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` via `vendor/makefun-game.ts`.
- `game/index.html` — the page; `game/src/` holds the game in one module per job: `config.js` (constants and palette), `level.js` (room, collision, line of sight), `actors.js` (guards and cameras), `render.js` (all drawing), `audio.js` (synthesized sound), `shots.js` (deterministic screenshot scenes), `main.js` (state, input, loop).
- `vendor/makefun-game.ts` — the kit's library, unchanged.
- `screenshots/` — 3 screenshots, real renders of the game's own code in a browser.
