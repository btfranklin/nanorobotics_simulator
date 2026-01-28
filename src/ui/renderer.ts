import { Simulation } from '../core/sim.js';
import { Viewport } from '../core/viewport.js';
import { VIEW_SIZE } from '../core/constants.js';

export type RenderOptions = {
  showTrails: boolean;
  showViewport: boolean;
  showDeposits: boolean;
  showHeat: boolean;
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

    if (options.showViewport) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, rect.width - 1, rect.height - 1);
    }

    if (options.showDeposits) {
      const current = viewport.worldToView(sim.nano.Xsource, sim.nano.Ysource);
      const last = viewport.worldToView(sim.nano.lastXsource, sim.nano.lastYsource);

      if (options.showHeat) {
        const cx = current.x * scale;
        const cy = current.y * scale;
        if (cx >= 0 && cy >= 0 && cx <= rect.width && cy <= rect.height) {
          const rawRadius = sim.config.resourceRadius * scale;
          const maxRadius = rect.width * 0.35;
          const radius = Math.max(18, Math.min(maxRadius, rawRadius));
          const gradient = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
          gradient.addColorStop(0, 'rgba(155, 222, 126, 0.35)');
          gradient.addColorStop(1, 'rgba(155, 222, 126, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
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
    }

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
      const px = view.x * scale;
      const py = view.y * scale;
      if (px < 0 || py < 0 || px > rect.width || py > rect.height) {
        continue;
      }
      ctx.fillRect(px, py, 1, 1);
    }

    ctx.fillStyle = '#ffd166';
    for (const control of sim.controlBots) {
      const view = viewport.worldToView(control.Xpos, control.Ypos);
      const px = view.x * scale;
      const py = view.y * scale;
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
