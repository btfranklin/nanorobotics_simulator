export type Vec2 = {
  x: number;
  y: number;
};

export type NanoState = 0 | 1 | 2;
export type PawnState = -1 | 0 | 1 | 3;
export type ControlState = -1 | 0 | 1 | 2 | 3;

export type Program = {
  mem: number[];
  data: number[];
};
