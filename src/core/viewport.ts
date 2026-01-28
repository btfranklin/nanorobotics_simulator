import { VIEW_SIZE, WORLD_SIZE } from './constants.js';

export class Viewport {
  ulx: number;
  uly: number;
  lrx: number;
  lry: number;
  zoomLevel: number;
  timeZoom: number;

  constructor() {
    this.ulx = 0;
    this.uly = 0;
    this.lrx = WORLD_SIZE - 1;
    this.lry = WORLD_SIZE - 1;
    this.zoomLevel = 0;
    this.timeZoom = 1;
  }

  worldToView(x: number, y: number): { x: number; y: number } {
    const multiplier = (this.lrx - this.ulx) / VIEW_SIZE;
    return {
      x: (x - this.ulx) / multiplier,
      y: (y - this.uly) / multiplier,
    };
  }

  zoomAt(viewX: number, viewY: number, factor: number): void {
    const spanX = this.lrx - this.ulx;
    const spanY = this.lry - this.uly;
    const nextSpanX = Math.min(WORLD_SIZE - 1, Math.max(120, spanX * factor));
    const nextSpanY = Math.min(WORLD_SIZE - 1, Math.max(120, spanY * factor));
    const ratioX = viewX / VIEW_SIZE;
    const ratioY = viewY / VIEW_SIZE;
    const focusX = this.ulx + spanX * ratioX;
    const focusY = this.uly + spanY * ratioY;

    let nextUlx = focusX - nextSpanX * ratioX;
    let nextUly = focusY - nextSpanY * ratioY;
    let nextLrx = nextUlx + nextSpanX;
    let nextLry = nextUly + nextSpanY;

    if (nextUlx < 0) {
      nextLrx -= nextUlx;
      nextUlx = 0;
    }
    if (nextUly < 0) {
      nextLry -= nextUly;
      nextUly = 0;
    }
    if (nextLrx > WORLD_SIZE - 1) {
      const overshoot = nextLrx - (WORLD_SIZE - 1);
      nextUlx -= overshoot;
      nextLrx = WORLD_SIZE - 1;
    }
    if (nextLry > WORLD_SIZE - 1) {
      const overshoot = nextLry - (WORLD_SIZE - 1);
      nextUly -= overshoot;
      nextLry = WORLD_SIZE - 1;
    }

    this.ulx = Math.max(0, nextUlx);
    this.uly = Math.max(0, nextUly);
    this.lrx = Math.min(WORLD_SIZE - 1, nextLrx);
    this.lry = Math.min(WORLD_SIZE - 1, nextLry);

    const zoomRatio = WORLD_SIZE / Math.max(1, this.lrx - this.ulx);
    this.zoomLevel = Math.max(0, Math.min(9, Math.round(Math.log2(zoomRatio))));
  }

  pan(deltaX: number, deltaY: number): void {
    const multiplier = (this.lrx - this.ulx) / VIEW_SIZE;
    const shiftX = deltaX * multiplier;
    const shiftY = deltaY * multiplier;

    const spanX = this.lrx - this.ulx;
    const spanY = this.lry - this.uly;
    let nextUlx = this.ulx - shiftX;
    let nextUly = this.uly - shiftY;
    let nextLrx = nextUlx + spanX;
    let nextLry = nextUly + spanY;

    if (nextUlx < 0) {
      nextUlx = 0;
      nextLrx = spanX;
    }
    if (nextUly < 0) {
      nextUly = 0;
      nextLry = spanY;
    }
    if (nextLrx > WORLD_SIZE - 1) {
      nextLrx = WORLD_SIZE - 1;
      nextUlx = nextLrx - spanX;
    }
    if (nextLry > WORLD_SIZE - 1) {
      nextLry = WORLD_SIZE - 1;
      nextUly = nextLry - spanY;
    }

    this.ulx = Math.max(0, nextUlx);
    this.uly = Math.max(0, nextUly);
    this.lrx = Math.min(WORLD_SIZE - 1, nextLrx);
    this.lry = Math.min(WORLD_SIZE - 1, nextLry);
  }
}
