import { MAX_PROGRAM_SLOTS } from './constants.js';
import type { ControlState, NanoState, PawnState, Program } from './types.js';

export class NanoComputer {
  Xpos = 0;
  Ypos = 0;
  cargo = 0;
  state: NanoState = 1;
  instructWait = 20000;
  Xsource = 0;
  Ysource = 0;
  lastXsource = 0;
  lastYsource = 0;

  controlProgram: Program = {
    mem: new Array<number>(MAX_PROGRAM_SLOTS).fill(3),
    data: new Array<number>(MAX_PROGRAM_SLOTS).fill(0),
  };
  pawnProgram: Program = {
    mem: new Array<number>(MAX_PROGRAM_SLOTS).fill(3),
    data: new Array<number>(MAX_PROGRAM_SLOTS).fill(0),
  };
}

export class PawnBot {
  Xpos = 0;
  Ypos = 0;
  heading = 0;
  cargo = 0;
  click = 0;
  state: PawnState = 0;
  IP = 0;
  mem: number[] = new Array<number>(MAX_PROGRAM_SLOTS).fill(3);
  data: number[] = new Array<number>(MAX_PROGRAM_SLOTS).fill(0);
  parent: ControlBot | null = null;
  parentX = 0;
  parentY = 0;
}

export class ControlBot {
  Xpos = 0;
  Ypos = 0;
  heading = 0;
  cargo = 0;
  click = 0;
  instructClick = 0;
  state: ControlState = 0;
  IP = 0;
  mem: number[] = new Array<number>(MAX_PROGRAM_SLOTS).fill(3);
  data: number[] = new Array<number>(MAX_PROGRAM_SLOTS).fill(0);
  pawnMem: number[] = new Array<number>(MAX_PROGRAM_SLOTS).fill(3);
  pawnData: number[] = new Array<number>(MAX_PROGRAM_SLOTS).fill(0);
}
