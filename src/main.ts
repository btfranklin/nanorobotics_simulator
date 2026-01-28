import { defaultConfig, Simulation, SimulationConfig } from './core/sim.js';
import { hashSeed, RNG } from './core/rng.js';
import { Viewport } from './core/viewport.js';
import { Renderer, RenderOptions } from './ui/renderer.js';
import { InputController } from './ui/input.js';
import { VIEW_SIZE, WORLD_SIZE } from './core/constants.js';

const canvas = document.getElementById('sim-canvas') as HTMLCanvasElement | null;
if (!canvas) {
  throw new Error('Simulation canvas not found');
}

const pauseButton = document.getElementById('pause-button') as HTMLButtonElement;
const stepButton = document.getElementById('step-button') as HTMLButtonElement;
const resetButton = document.getElementById('reset-button') as HTMLButtonElement;
const centerButton = document.getElementById('center-button') as HTMLButtonElement;
const zoomInButton = document.getElementById('zoom-in') as HTMLButtonElement;
const zoomOutButton = document.getElementById('zoom-out') as HTMLButtonElement;
const respawnButton = document.getElementById('respawn-button') as HTMLButtonElement;

const timeZoomInput = document.getElementById('timezoom') as HTMLInputElement;
const pawnInput = document.getElementById('pawn-count') as HTMLInputElement;
const controlInput = document.getElementById('control-count') as HTMLInputElement;
const seedInput = document.getElementById('seed') as HTMLInputElement;
const trailsToggle = document.getElementById('trails-toggle') as HTMLInputElement;
const boundsToggle = document.getElementById('bounds-toggle') as HTMLInputElement;
const depositToggle = document.getElementById('deposit-toggle') as HTMLInputElement;
const heatToggle = document.getElementById('heat-toggle') as HTMLInputElement;
const pheromoneToggle = document.getElementById('pheromone-toggle') as HTMLInputElement;
const strictCollectToggle = document.getElementById('strict-collect') as HTMLInputElement;

const aboutButton = document.getElementById('about-button') as HTMLButtonElement;
const aboutDialog = document.getElementById('about-dialog') as HTMLDialogElement;

const statPawn = document.getElementById('stat-pawn') as HTMLElement;
const statControl = document.getElementById('stat-control') as HTMLElement;
const statCargo = document.getElementById('stat-cargo') as HTMLElement;
const statState = document.getElementById('stat-state') as HTMLElement;
const statDepositX = document.getElementById('stat-deposit-x') as HTMLElement;
const statDepositY = document.getElementById('stat-deposit-y') as HTMLElement;
const statZoom = document.getElementById('stat-zoom') as HTMLElement;
const statTime = document.getElementById('stat-time') as HTMLElement;

const viewport = new Viewport();
const renderer = new Renderer(canvas);

let paused = false;
let sim = createSimulation();
let renderOptions: RenderOptions = {
  showTrails: trailsToggle.checked,
  showViewport: boundsToggle.checked,
  showDeposits: depositToggle.checked,
  showHeat: heatToggle.checked,
  showPheromones: pheromoneToggle.checked,
};

const input = new InputController(canvas, viewport, {
  onZoomAt: (x, y, factor) => viewport.zoomAt(x, y, factor),
  onTimeZoomDelta: (delta) => {
    const next = clampNumber(viewport.timeZoom + delta, 1, 12);
    viewport.timeZoom = next;
    timeZoomInput.value = String(next);
  },
  onPauseToggle: () => togglePause(),
});

void input;

function createSimulation(): Simulation {
  const config = readConfig();
  const rng = new RNG(hashSeed(config.seed));
  return new Simulation(config, rng);
}

function readConfig(): SimulationConfig {
  return {
    ...defaultConfig,
    pawnCount: clampNumber(parseInt(pawnInput.value, 10) || defaultConfig.pawnCount, 0, 5000),
    controlCount: clampNumber(parseInt(controlInput.value, 10) || defaultConfig.controlCount, 0, 500),
    seed: seedInput.value.trim() || defaultConfig.seed,
    strictCollect: strictCollectToggle.checked,
  };
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function resetSimulation(): void {
  sim = createSimulation();
}

function togglePause(): void {
  paused = !paused;
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
}

function stepOnce(): void {
  sim.step();
}

function centerViewport(): void {
  const half = (viewport.lrx - viewport.ulx) / 2;
  viewport.ulx = Math.max(0, sim.nano.Xpos - half);
  viewport.uly = Math.max(0, sim.nano.Ypos - half);
  viewport.lrx = Math.min(WORLD_SIZE - 1, sim.nano.Xpos + half);
  viewport.lry = Math.min(WORLD_SIZE - 1, sim.nano.Ypos + half);
}

pauseButton.addEventListener('click', togglePause);
stepButton.addEventListener('click', () => {
  stepOnce();
});
resetButton.addEventListener('click', () => {
  resetSimulation();
});
centerButton.addEventListener('click', centerViewport);
zoomInButton.addEventListener('click', () => {
  viewport.zoomAt(VIEW_SIZE / 2, VIEW_SIZE / 2, 0.85);
});
zoomOutButton.addEventListener('click', () => viewport.zoomAt(VIEW_SIZE / 2, VIEW_SIZE / 2, 1.15));
respawnButton.addEventListener('click', () => {
  resetSimulation();
});

trailsToggle.addEventListener('change', () => {
  renderOptions.showTrails = trailsToggle.checked;
});
boundsToggle.addEventListener('change', () => {
  renderOptions.showViewport = boundsToggle.checked;
});
depositToggle.addEventListener('change', () => {
  renderOptions.showDeposits = depositToggle.checked;
});
heatToggle.addEventListener('change', () => {
  renderOptions.showHeat = heatToggle.checked;
});
pheromoneToggle.addEventListener('change', () => {
  renderOptions.showPheromones = pheromoneToggle.checked;
});
strictCollectToggle.addEventListener('change', () => {
  sim.config.strictCollect = strictCollectToggle.checked;
});

timeZoomInput.addEventListener('input', () => {
  viewport.timeZoom = clampNumber(parseInt(timeZoomInput.value, 10) || 1, 1, 12);
});

aboutButton.addEventListener('click', () => {
  if (typeof aboutDialog.showModal === 'function') {
    aboutDialog.showModal();
  } else {
    aboutDialog.setAttribute('open', 'true');
  }
});

window.addEventListener('resize', () => renderer.resize());

let lastStatsUpdate = 0;

function updateStats(now: number): void {
  if (now - lastStatsUpdate < 200) {
    return;
  }
  lastStatsUpdate = now;
  statPawn.textContent = String(sim.pawnBots.length);
  statControl.textContent = String(sim.controlBots.length);
  statCargo.textContent = String(sim.nano.cargo);
  statState.textContent = String(sim.nano.state);
  statDepositX.textContent = String(sim.nano.Xsource);
  statDepositY.textContent = String(sim.nano.Ysource);
  statZoom.textContent = String(viewport.zoomLevel);
  statTime.textContent = String(viewport.timeZoom);
}

function frame(now: number): void {
  if (!paused) {
    for (let i = 0; i < viewport.timeZoom; i += 1) {
      sim.step();
    }
  }

  renderer.draw(sim, viewport, renderOptions);
  updateStats(now);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
