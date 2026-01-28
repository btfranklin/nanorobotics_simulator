import { Simulation } from '../core/sim.js';
import { Viewport } from '../core/viewport.js';
import { VIEW_SIZE } from '../core/constants.js';

export type RenderOptions = {
  showTrails: boolean;
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private pixelRatio = 1;
  private lastViewportSignature = '';

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    this.ctx = ctx;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * this.pixelRatio;
    this.canvas.height = rect.height * this.pixelRatio;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.pixelRatio, this.pixelRatio);
  }

  draw(sim: Simulation, viewport: Viewport, options: RenderOptions): void {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const signature = `${viewport.ulx}:${viewport.uly}:${viewport.lrx}:${viewport.lry}`;
    const viewportChanged = signature !== this.lastViewportSignature;
    this.lastViewportSignature = signature;

    if (!options.showTrails || viewportChanged) {
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = '#090d12';
      ctx.fillRect(0, 0, rect.width, rect.height);
    } else {
      ctx.fillStyle = 'rgba(9, 13, 18, 0.18)';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    const scale = rect.width / VIEW_SIZE;

    const current = viewport.worldToView(sim.nano.Xsource, sim.nano.Ysource);
    const last = viewport.worldToView(sim.nano.lastXsource, sim.nano.lastYsource);

    if (sim.resourceHistory.length > 0) {
      sim.resourceHistory.forEach((deposit, index) => {
        const opacity = Math.max(0, 1 - index * 0.1);
        if (opacity <= 0) {
          return;
        }
        const view = viewport.worldToView(deposit.x, deposit.y);
        const px = view.x * scale;
        const py = view.y * scale;
        if (px < -30 || py < -30 || px > rect.width + 30 || py > rect.height + 30) {
          return;
        }
        const radius = Math.max(14, 18 + (9 - index) * 1.5);
        const clumpSeed = (deposit.x + deposit.y + index * 101) % 97;
        const count = 5;
        for (let i = 0; i < count; i += 1) {
          const angle = ((clumpSeed + i * 37) % 360) * (Math.PI / 180);
          const spread = radius * (0.15 + ((clumpSeed + i * 19) % 35) / 100);
          const cx = px + Math.cos(angle) * spread;
          const cy = py + Math.sin(angle) * spread;
          const blobRadius = radius * (0.2 + ((clumpSeed + i * 11) % 25) / 100);
          const gradient = ctx.createRadialGradient(cx, cy, blobRadius * 0.2, cx, cy, blobRadius);
          gradient.addColorStop(0, `rgba(155, 222, 126, ${opacity})`);
          gradient.addColorStop(1, 'rgba(155, 222, 126, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(cx, cy, blobRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    ctx.strokeStyle = '#9bde7e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(current.x * scale, current.y * scale, 10 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(155, 222, 126, 0.5)';
    ctx.beginPath();
    ctx.arc(last.x * scale, last.y * scale, 10 * scale, 0, Math.PI * 2);
    ctx.stroke();

    if (sim.signalEvents.length > 0) {
      for (const event of sim.signalEvents) {
        const view = viewport.worldToView(event.x, event.y);
        const px = view.x * scale;
        const py = view.y * scale;
        if (px < -50 || py < -50 || px > rect.width + 50 || py > rect.height + 50) {
          continue;
        }
        const alpha = Math.min(0.6, event.ttl / 90);
        const radius = (sim.config.instructionRange / (viewport.lrx - viewport.ulx)) * rect.width;
        ctx.strokeStyle = `rgba(255, 179, 71, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#7bdff2';
    for (const pawn of sim.pawnBots) {
      const view = viewport.worldToView(pawn.Xpos, pawn.Ypos);
      const px = Math.round(view.x * scale);
      const py = Math.round(view.y * scale);
      if (px < 0 || py < 0 || px > rect.width || py > rect.height) {
        continue;
      }
      ctx.fillRect(px, py, 1, 1);
    }

    ctx.fillStyle = '#ffd166';
    for (const control of sim.controlBots) {
      const view = viewport.worldToView(control.Xpos, control.Ypos);
      const px = Math.round(view.x * scale);
      const py = Math.round(view.y * scale);
      if (px < 0 || py < 0 || px > rect.width || py > rect.height) {
        continue;
      }
      ctx.fillRect(px, py, 2, 2);
    }

    const nanoView = viewport.worldToView(sim.nano.Xpos, sim.nano.Ypos);
    const nanoSize = 8 + viewport.zoomLevel * 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      nanoView.x * scale - nanoSize / 2,
      nanoView.y * scale - nanoSize / 2,
      nanoSize,
      nanoSize,
    );
  }
}
