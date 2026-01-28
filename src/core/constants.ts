export const WORLD_SIZE = 65536;
export const VIEW_SIZE = 500;
export const MAX_PROGRAM_SLOTS = 5;

export const INSTRUCTION = {
  MOVE: 1,
  REVERSE: 2,
  SIGNAL_OR_COLLECT: 3,
  TURN_RIGHT: 4,
  TURN_LEFT: 5,
} as const;

export const HEADING_VECTORS = [
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
] as const;

export const DRIFT_VECTORS = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
] as const;
