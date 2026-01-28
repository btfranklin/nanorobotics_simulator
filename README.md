# NanoSorz Web

A modern HTML-first, TypeScript port of the 1996 NanoSorz nanobot simulator. This repo now contains the app at the root (no `/web` folder), with a neon “lab terminal” UI, an event log, and camera controls.

## Run locally

```bash
npm install
npm run build
```

Then open `index.html` in a browser (or serve the repo root with any static server).

For live development:
```bash
npm run dev
```

## Tests
```bash
npm test
```

## Notes
- HTML-first UI with native controls (dialog/popover/details) and minimal JS.
- Simulation logic: `src/core`, rendering/input/UI helpers: `src/ui`.
- Event log shows ControlBot signals and issued program “assembly.”
