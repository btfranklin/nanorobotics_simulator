import { VIEW_SIZE } from '../core/constants.js';
import { Viewport } from '../core/viewport.js';

export type InputHandlers = {
  onZoomAt: (x: number, y: number, factor: number) => void;
  onTimeZoomDelta: (delta: number) => void;
  onPauseToggle: () => void;
};

export class InputController {
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };

  constructor(
    private canvas: HTMLCanvasElement,
    private viewport: Viewport,
    private handlers: InputHandlers,
  ) {
    this.attach();
  }

  private attach(): void {
    this.canvas.addEventListener('pointerdown', (event) => {
      this.dragging = true;
      this.lastPointer = this.getCanvasPoint(event);
      this.canvas.setPointerCapture(event.pointerId);
    });

    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.dragging) {
        return;
      }
      const current = this.getCanvasPoint(event);
      const deltaX = current.x - this.lastPointer.x;
      const deltaY = current.y - this.lastPointer.y;
      this.viewport.pan(deltaX, deltaY);
      this.lastPointer = current;
    });

    this.canvas.addEventListener('pointerup', (event) => {
      this.dragging = false;
      this.canvas.releasePointerCapture(event.pointerId);
    });

    this.canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
      },
      { passive: false },
    );

    window.addEventListener('keydown', (event) => {
      if (event.key === '+') {
        return;
      }
      if (event.key === '-') {
        return;
      }
      if (event.key === '*') {
        this.handlers.onTimeZoomDelta(1);
      }
      if (event.key === '/') {
        this.handlers.onTimeZoomDelta(-1);
      }
      if (event.key === ' ') {
        event.preventDefault();
        this.handlers.onPauseToggle();
      }
    });
  }

  private getCanvasPoint(event: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_SIZE,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_SIZE,
    };
  }
}
