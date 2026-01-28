import { MAX_PROGRAM_SLOTS, INSTRUCTION } from './constants.js';
import type { NanoComputer } from './entities.js';
import { RNG } from './rng.js';

const clampDiff = (value: number): number => {
  if (value < -32767) return -32766;
  if (value > 32767) return 32766;
  return value;
};

const headingForDiff = (xDiff: number, yDiff: number): number => {
  if (xDiff < 0 && yDiff < 0) return 3;
  if (xDiff < 0 && yDiff > 0) return 1;
  if (xDiff > 0 && yDiff < 0) return 5;
  if (xDiff > 0 && yDiff > 0) return 7;
  if (xDiff < 0) return 2;
  if (xDiff > 0) return 6;
  if (yDiff < 0) return 4;
  return 0;
};

const rotateToward = (workingHeading: number, neededHeading: number): { instr: number; data: number } => {
  let tempHeading = workingHeading;
  let diffLeft = 0;
  let diffRight = 0;

  while (tempHeading !== neededHeading) {
    tempHeading = tempHeading === 0 ? 7 : tempHeading - 1;
    diffLeft += 1;
  }

  tempHeading = workingHeading;
  while (tempHeading !== neededHeading) {
    tempHeading = tempHeading === 7 ? 0 : tempHeading + 1;
    diffRight += 1;
  }

  if (diffLeft < diffRight) {
    return { instr: INSTRUCTION.TURN_LEFT, data: diffLeft };
  }
  return { instr: INSTRUCTION.TURN_RIGHT, data: diffRight };
};

export const generatePrograms = (nano: NanoComputer, rng: RNG): void => {
  for (let i = 0; i < MAX_PROGRAM_SLOTS; i += 1) {
    nano.controlProgram.mem[i] = INSTRUCTION.SIGNAL_OR_COLLECT;
    nano.controlProgram.data[i] = 0;
    nano.pawnProgram.mem[i] = INSTRUCTION.SIGNAL_OR_COLLECT;
    nano.pawnProgram.data[i] = 0;
  }

  let xDiff = nano.Xpos - nano.lastXsource - 1000 + rng.nextInt(2000);
  let yDiff = nano.Ypos - nano.lastYsource - 1000 + rng.nextInt(2000);
  xDiff = clampDiff(xDiff);
  yDiff = clampDiff(yDiff);
  const lastXcalc = nano.Xpos - xDiff;
  const lastYcalc = nano.Ypos - yDiff;

  let workingHeading = 0;

  for (let i = 0; i < MAX_PROGRAM_SLOTS; i += 1) {
    const neededHeading = headingForDiff(xDiff, yDiff);

    if (xDiff === 0 && yDiff === 0) {
      nano.controlProgram.mem[i] = INSTRUCTION.SIGNAL_OR_COLLECT;
      nano.controlProgram.data[i] = 5000;
      continue;
    }

    if (neededHeading !== workingHeading) {
      const rotation = rotateToward(workingHeading, neededHeading);
      nano.controlProgram.mem[i] = rotation.instr;
      nano.controlProgram.data[i] = rotation.data;
      workingHeading = neededHeading;
      continue;
    }

    if (workingHeading === 0 || workingHeading === 4) {
      nano.controlProgram.mem[i] = INSTRUCTION.MOVE;
      nano.controlProgram.data[i] = Math.abs(yDiff);
      yDiff = 0;
      continue;
    }

    if (workingHeading === 2 || workingHeading === 6) {
      nano.controlProgram.mem[i] = INSTRUCTION.MOVE;
      nano.controlProgram.data[i] = Math.abs(xDiff);
      xDiff = 0;
      continue;
    }

    const useY = Math.abs(yDiff) < Math.abs(xDiff);
    nano.controlProgram.mem[i] = INSTRUCTION.MOVE;

    if (workingHeading === 1) {
      nano.controlProgram.data[i] = Math.abs(useY ? yDiff : xDiff);
      if (useY) {
        xDiff += Math.abs(yDiff);
        yDiff = 0;
      } else {
        yDiff -= Math.abs(xDiff);
        xDiff = 0;
      }
      continue;
    }

    if (workingHeading === 3) {
      nano.controlProgram.data[i] = Math.abs(useY ? yDiff : xDiff);
      if (useY) {
        xDiff += Math.abs(yDiff);
        yDiff = 0;
      } else {
        yDiff += Math.abs(xDiff);
        xDiff = 0;
      }
      continue;
    }

    if (workingHeading === 5) {
      nano.controlProgram.data[i] = Math.abs(useY ? yDiff : xDiff);
      if (useY) {
        xDiff -= Math.abs(yDiff);
        yDiff = 0;
      } else {
        yDiff += Math.abs(xDiff);
        xDiff = 0;
      }
      continue;
    }

    if (workingHeading === 7) {
      nano.controlProgram.data[i] = Math.abs(useY ? yDiff : xDiff);
      if (useY) {
        xDiff -= Math.abs(yDiff);
        yDiff = 0;
      } else {
        yDiff -= Math.abs(xDiff);
        xDiff = 0;
      }
    }
  }

  xDiff = lastXcalc - nano.Xsource;
  yDiff = lastYcalc - nano.Ysource;
  workingHeading = 0;

  for (let i = 0; i < MAX_PROGRAM_SLOTS; i += 1) {
    const neededHeading = headingForDiff(xDiff, yDiff);

    if (xDiff === 0 && yDiff === 0) {
      nano.pawnProgram.mem[i] = INSTRUCTION.SIGNAL_OR_COLLECT;
      continue;
    }

    if (neededHeading !== workingHeading) {
      const rotation = rotateToward(workingHeading, neededHeading);
      nano.pawnProgram.mem[i] = rotation.instr;
      nano.pawnProgram.data[i] = rotation.data;
      workingHeading = neededHeading;
      continue;
    }

    if (workingHeading === 0 || workingHeading === 4) {
      nano.pawnProgram.mem[i] = INSTRUCTION.MOVE;
      nano.pawnProgram.data[i] = Math.abs(yDiff);
      yDiff = 0;
      continue;
    }

    if (workingHeading === 2 || workingHeading === 6) {
      nano.pawnProgram.mem[i] = INSTRUCTION.MOVE;
      nano.pawnProgram.data[i] = Math.abs(xDiff);
      xDiff = 0;
      continue;
    }

    const useY = Math.abs(yDiff) < Math.abs(xDiff);
    nano.pawnProgram.mem[i] = INSTRUCTION.MOVE;

    if (workingHeading === 1) {
      nano.pawnProgram.data[i] = Math.abs(useY ? yDiff : xDiff);
      if (useY) {
        xDiff += Math.abs(yDiff);
        yDiff = 0;
      } else {
        yDiff -= Math.abs(xDiff);
        xDiff = 0;
      }
      continue;
    }

    if (workingHeading === 3) {
      nano.pawnProgram.data[i] = Math.abs(useY ? yDiff : xDiff);
      if (useY) {
        xDiff += Math.abs(yDiff);
        yDiff = 0;
      } else {
        yDiff += Math.abs(xDiff);
        xDiff = 0;
      }
      continue;
    }

    if (workingHeading === 5) {
      nano.pawnProgram.data[i] = Math.abs(useY ? yDiff : xDiff);
      if (useY) {
        xDiff -= Math.abs(yDiff);
        yDiff = 0;
      } else {
        yDiff += Math.abs(xDiff);
        xDiff = 0;
      }
      continue;
    }

    if (workingHeading === 7) {
      nano.pawnProgram.data[i] = Math.abs(useY ? yDiff : xDiff);
      if (useY) {
        xDiff -= Math.abs(yDiff);
        yDiff = 0;
      } else {
        yDiff -= Math.abs(xDiff);
        xDiff = 0;
      }
    }
  }
};
