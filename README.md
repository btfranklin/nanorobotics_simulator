# NanoSorz Web

A modern HTML-first, TypeScript port of the 1996 NanoSorz nanobot simulator.

## Run locally

```bash
cd web
npm install
npm run build
```

Then open `web/index.html` in a browser (or serve the `web` folder with any static server).

## Notes
- The UI uses native HTML controls (forms, details, dialog, popover) and minimal JS.
- Simulation logic is separated in `src/core` and rendering/input live in `src/ui`.
