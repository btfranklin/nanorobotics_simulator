# Nanorobotics Simulator

![Nanorobotics Simulator banner](https://raw.githubusercontent.com/btfranklin/nanorobotics_simulator/main/.github/social%20preview/nanorobotics_simulator_social_preview.jpg "Nanorobotics Simulator")

An HTML-first, TypeScript port of my 1996-era nanorobot simulator: a tiny, chaotic sandbox where a “NanoCore” and a swarm of bots wander a toroidal world, react to deposits/signals, and generate a steady stream of emergent behavior.

The modern version keeps the spirit of the original (simple rules, lots of motion), but upgrades everything around it: a neon “lab terminal” UI, event log, camera controls, and a clean TS codebase.

## Quick start

This app is **static HTML + ES modules**, so it needs to be served from a local web server (opening `index.html` via `file://` can fail in some browsers).

```bash
npm install
npm run build
python3 -m http.server 5173
```

Open `http://localhost:5173/`.

## Development

On macOS/Linux, you can run a watch build + local server:

```bash
npm run dev
```

On Windows (or if `sh` isn’t available), run these in two terminals:

```bash
npm run watch
python -m http.server 5173
```

## Controls

- Mouse: drag to pan, scroll wheel to zoom at cursor.
- Keyboard:
  - `Space`: pause/resume
  - `+` / `-`: zoom in/out
  - `*` / `/`: simulation speed up/down
- UI:
  - **Pause / Step / Reset**
  - **Fit to world / Center on NanoCore**
  - Toggle **Motion trails**
  - Toggle **Require deposit proximity** (stricter resource collection rules)
  - Adjust **PawnBot / ControlBot** counts and **Seed**

## Project layout

- `index.html`, `styles.css`: UI shell (HTML-first, minimal JS)
- `src/core/*`: simulation, entities, program/instruction logic, RNG, viewport
- `src/ui/*`: canvas renderer, input controls, event log sync
- `tests/*`: unit tests (Vitest + JSDOM)

## Scripts

- `npm run build`: compile TypeScript to `dist/`
- `npm run dev`: `tsc --watch` + `python3 -m http.server 5173`
- `npm test`: run tests once
- `npm run test:watch`: watch mode

## Notes / disclaimers

- This is a toy simulator inspired by a much older project; it’s not intended to be scientifically accurate nanorobotics.
- Behavior is deterministic for a given seed (useful for “rerunning” interesting swarms).

## License

MIT — see `LICENSE`.
