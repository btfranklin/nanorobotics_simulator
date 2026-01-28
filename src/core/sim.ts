import {
  DRIFT_VECTORS,
  HEADING_VECTORS,
  INSTRUCTION,
  MAX_PROGRAM_SLOTS,
  WORLD_SIZE,
} from './constants.js';
import { ControlBot, NanoComputer, PawnBot } from './entities.js';
import { generatePrograms } from './program.js';
import { RNG } from './rng.js';

export type SimulationConfig = {
  pawnCount: number;
  controlCount: number;
  depositChance: number;
  depositWait: number;
  instructionRange: number;
  resourceRadius: number;
  strictCollect: boolean;
  seed: string;
};

export type SimEvent = {
  id: number;
  tick: number;
  label: string;
  detail?: string;
};

export const defaultConfig: SimulationConfig = {
  pawnCount: 1000,
  controlCount: 10,
  depositChance: 5000,
  depositWait: 20000,
  instructionRange: 5000,
  resourceRadius: 1800,
  strictCollect: false,
  seed: '1996',
};

const wrapCoord = (value: number): number => {
  const wrapped = value % WORLD_SIZE;
  return wrapped < 0 ? wrapped + WORLD_SIZE : wrapped;
};

const distanceSquared = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};

export class Simulation {
  nano = new NanoComputer();
  pawnBots: PawnBot[] = [];
  controlBots: ControlBot[] = [];
  rng: RNG;
  config: SimulationConfig;
  signalEvents: { x: number; y: number; ttl: number }[] = [];
  eventLog: SimEvent[] = [];
  resourceHistory: { x: number; y: number }[] = [];
  tick = 0;
  private eventSeq = 0;
  private pawnSeq = 1;
  private controlSeq = 1;

  constructor(config: SimulationConfig, rng: RNG) {
    this.config = config;
    this.rng = rng;
    this.reset();
  }

  reset(): void {
    this.nano = new NanoComputer();
    this.nano.Xpos = Math.floor(WORLD_SIZE / 2);
    this.nano.Ypos = Math.floor(WORLD_SIZE / 2);
    this.nano.state = 1;
    this.nano.lastXsource = this.randomWorldCoord();
    this.nano.lastYsource = this.randomWorldCoord();
    this.nano.Xsource = this.randomWorldCoord();
    this.nano.Ysource = this.randomWorldCoord();
    this.nano.instructWait = this.config.depositWait;

    this.eventLog = [];
    this.eventSeq = 0;
    this.tick = 0;
    this.pawnSeq = 1;
    this.controlSeq = 1;

    this.pawnBots = this.spawnPawnBots(this.config.pawnCount);
    this.controlBots = this.spawnControlBots(this.config.controlCount);
    this.signalEvents = [];
    this.resourceHistory = [];
    this.recordDeposit(this.nano.Xsource, this.nano.Ysource);
  }

  private spawnPawnBots(count: number): PawnBot[] {
    const bots: PawnBot[] = [];
    for (let i = 0; i < count; i += 1) {
      const bot = new PawnBot();
      bot.id = this.pawnSeq;
      this.pawnSeq += 1;
      bot.heading = this.rng.nextInt(8);
      bot.Xpos = wrapCoord(32768 + this.rng.nextInt(65535) - this.rng.nextInt(65535));
      bot.Ypos = wrapCoord(32768 + this.rng.nextInt(65535) - this.rng.nextInt(65535));
      bots.push(bot);
    }
    return bots;
  }

  private spawnControlBots(count: number): ControlBot[] {
    const bots: ControlBot[] = [];
    for (let i = 0; i < count; i += 1) {
      const bot = new ControlBot();
      bot.id = this.controlSeq;
      this.controlSeq += 1;
      bot.heading = this.rng.nextInt(8);
      bot.Xpos = wrapCoord(32768 + this.rng.nextInt(65535) - this.rng.nextInt(65535));
      bot.Ypos = wrapCoord(32768 + this.rng.nextInt(65535) - this.rng.nextInt(65535));
      bots.push(bot);
    }
    return bots;
  }

  private randomWorldCoord(): number {
    return wrapCoord(this.rng.nextInt(WORLD_SIZE) + this.rng.nextInt(WORLD_SIZE));
  }

  step(): void {
    this.tick += 1;
    this.updateSignalEvents();
    this.updatePawnBots();
    this.updateControlBots();
    this.updateNanoComputer();
  }

  private moveWithHeading(x: number, y: number, heading: number, reverse = false): { x: number; y: number } {
    const vector = HEADING_VECTORS[heading] ?? HEADING_VECTORS[0];
    const direction = reverse ? -1 : 1;
    return {
      x: wrapCoord(x + vector.x * direction),
      y: wrapCoord(y + vector.y * direction),
    };
  }

  private driftBot(bot: { Xpos: number; Ypos: number }): void {
    const drift = DRIFT_VECTORS[this.rng.nextInt(DRIFT_VECTORS.length)] ?? DRIFT_VECTORS[0];
    bot.Xpos = wrapCoord(bot.Xpos + drift.x);
    bot.Ypos = wrapCoord(bot.Ypos + drift.y);
  }

  private updatePawnBots(): void {
    for (const bot of this.pawnBots) {
      switch (bot.state) {
        case -1: {
          if (!bot.parent) {
            bot.state = 0;
            break;
          }

          const targetX = bot.parentX;
          const targetY = bot.parentY;
          bot.heading = this.headingToward(bot.Xpos, bot.Ypos, targetX, targetY);
          const moved = this.moveWithHeading(bot.Xpos, bot.Ypos, bot.heading, false);
          bot.Xpos = moved.x;
          bot.Ypos = moved.y;

          if (bot.Xpos === targetX && bot.Ypos === targetY) {
            if (bot.parent.state === 3) {
              bot.heading = bot.parent.heading;
              bot.parent.state = 2;
              for (let i = 0; i < MAX_PROGRAM_SLOTS; i += 1) {
                bot.mem[i] = bot.parent.pawnMem[i] ?? INSTRUCTION.SIGNAL_OR_COLLECT;
                bot.data[i] = bot.parent.pawnData[i] ?? 0;
              }
              bot.parent.cargo += bot.cargo;
              bot.cargo = 0;
              bot.IP = 0;
              bot.state = 1;
            } else {
              bot.state = 0;
            }
          }
          break;
        }
        case 3: {
          if (!this.config.strictCollect || this.isNearDeposit(bot.Xpos, bot.Ypos)) {
            if (bot.cargo < 100) {
              bot.cargo += 1;
            } else {
              bot.state = 0;
            }
          }
          this.driftBot(bot);
          bot.heading = this.rng.nextInt(8);
          break;
        }
        case 1: {
          if (bot.click > 0) {
            const instr = bot.mem[bot.IP] ?? INSTRUCTION.SIGNAL_OR_COLLECT;
            if (instr === INSTRUCTION.MOVE) {
              const moved = this.moveWithHeading(bot.Xpos, bot.Ypos, bot.heading, false);
              bot.Xpos = moved.x;
              bot.Ypos = moved.y;
            } else if (instr === INSTRUCTION.REVERSE) {
              const moved = this.moveWithHeading(bot.Xpos, bot.Ypos, bot.heading, true);
              bot.Xpos = moved.x;
              bot.Ypos = moved.y;
            } else if (instr === INSTRUCTION.TURN_RIGHT) {
              bot.heading = (bot.heading + 1) % 8;
            } else if (instr === INSTRUCTION.TURN_LEFT) {
              bot.heading = bot.heading === 0 ? 7 : bot.heading - 1;
            }

            bot.click -= 1;
            if (bot.click === 0) {
              bot.IP += 1;
            }
          } else if ((bot.mem[bot.IP] ?? INSTRUCTION.SIGNAL_OR_COLLECT) === INSTRUCTION.SIGNAL_OR_COLLECT) {
            bot.state = 3;
          } else if (bot.IP >= MAX_PROGRAM_SLOTS) {
            bot.state = 0;
          } else {
            bot.click = bot.data[bot.IP] ?? 0;
            if (bot.click === 0) {
              bot.IP += 1;
            }
          }
          break;
        }
        case 0:
        default: {
          this.driftBot(bot);
          bot.heading = this.rng.nextInt(8);
          break;
        }
      }
    }
  }

  private updateControlBots(): void {
    for (const bot of this.controlBots) {
      switch (bot.state) {
        case -1: {
          const targetX = this.nano.Xpos;
          const targetY = this.nano.Ypos;
          bot.heading = this.headingToward(bot.Xpos, bot.Ypos, targetX, targetY);
          const moved = this.moveWithHeading(bot.Xpos, bot.Ypos, bot.heading, false);
          bot.Xpos = moved.x;
          bot.Ypos = moved.y;

          if (bot.Xpos === targetX && bot.Ypos === targetY && this.nano.state !== 2) {
            bot.heading = 0;
            this.nano.state = 2;
            generatePrograms(this.nano, this.rng);
            for (let i = 0; i < MAX_PROGRAM_SLOTS; i += 1) {
              bot.mem[i] = this.nano.controlProgram.mem[i] ?? INSTRUCTION.SIGNAL_OR_COLLECT;
              bot.data[i] = this.nano.controlProgram.data[i] ?? 0;
              bot.pawnMem[i] = this.nano.pawnProgram.mem[i] ?? INSTRUCTION.SIGNAL_OR_COLLECT;
              bot.pawnData[i] = this.nano.pawnProgram.data[i] ?? 0;
            }
            this.pushEvent(
              `Core issued programs to ControlBot #${bot.id}`,
              [
                `CTRL: ${this.formatProgram(bot.mem, bot.data)}`,
                `PAWN: ${this.formatProgram(bot.pawnMem, bot.pawnData)}`,
              ].join('\n'),
            );
            this.nano.cargo += bot.cargo;
            bot.cargo = 0;
            bot.IP = 0;
            bot.state = 1;
          }
          break;
        }
        case 3: {
          bot.instructClick -= 1;
          if (bot.instructClick <= 0) {
            bot.state = 0;
          }
          break;
        }
        case 2: {
          bot.state = 3;
          break;
        }
        case 1: {
          if (bot.click > 0) {
            const instr = bot.mem[bot.IP] ?? INSTRUCTION.SIGNAL_OR_COLLECT;
            if (instr === INSTRUCTION.MOVE) {
              const moved = this.moveWithHeading(bot.Xpos, bot.Ypos, bot.heading, false);
              bot.Xpos = moved.x;
              bot.Ypos = moved.y;
            } else if (instr === INSTRUCTION.REVERSE) {
              const moved = this.moveWithHeading(bot.Xpos, bot.Ypos, bot.heading, true);
              bot.Xpos = moved.x;
              bot.Ypos = moved.y;
            } else if (instr === INSTRUCTION.TURN_RIGHT) {
              bot.heading = (bot.heading + 1) % 8;
            } else if (instr === INSTRUCTION.TURN_LEFT) {
              bot.heading = bot.heading === 0 ? 7 : bot.heading - 1;
            }

            bot.click -= 1;
            if (bot.click === 0) {
              bot.IP += 1;
            }
          } else if ((bot.mem[bot.IP] ?? INSTRUCTION.SIGNAL_OR_COLLECT) === INSTRUCTION.SIGNAL_OR_COLLECT) {
            this.signalEvents.push({ x: bot.Xpos, y: bot.Ypos, ttl: 90 });
            let recalled = 0;
            for (const pawn of this.pawnBots) {
              if (pawn.state !== 0) {
                continue;
              }
              const dist = distanceSquared(pawn.Xpos, pawn.Ypos, bot.Xpos, bot.Ypos);
              if (dist <= this.config.instructionRange * this.config.instructionRange) {
                pawn.state = -1;
                pawn.parent = bot;
                pawn.parentX = bot.Xpos;
                pawn.parentY = bot.Ypos;
                recalled += 1;
              }
            }
            this.pushEvent(`ControlBot #${bot.id} broadcast signal`, `Recalled Pawns: ${recalled}`);
            bot.state = 3;
            bot.instructClick = bot.data[bot.IP] ?? 0;
          } else if (bot.IP >= MAX_PROGRAM_SLOTS) {
            bot.state = 0;
          } else {
            bot.click = bot.data[bot.IP] ?? 0;
            if (bot.click === 0) {
              bot.IP += 1;
            }
          }
          break;
        }
        case 0:
        default: {
          this.driftBot(bot);
          bot.heading = this.rng.nextInt(8);
          break;
        }
      }
    }
  }

  private updateNanoComputer(): void {
    if (this.nano.state === 1 && this.rng.nextInt(this.config.depositChance) === 1) {
      this.nano.lastXsource = this.nano.Xsource;
      this.nano.lastYsource = this.nano.Ysource;
      this.nano.Xsource = this.randomWorldCoord();
      this.nano.Ysource = this.randomWorldCoord();
      this.recordDeposit(this.nano.Xsource, this.nano.Ysource);

      for (const bot of this.controlBots) {
        if (bot.state === 0) {
          bot.state = -1;
        }
      }

      this.nano.state = 0;
      this.nano.instructWait = this.config.depositWait;
    }

    if (this.nano.state === 0) {
      this.nano.instructWait -= 1;
      if (this.nano.instructWait <= 0) {
        this.nano.instructWait = this.config.depositWait;
        for (const bot of this.controlBots) {
          if (bot.state === 0) {
            bot.state = -1;
          }
        }
      }
    }

    if (this.nano.state === 2) {
      this.nano.state = 1;
    }
  }

  private headingToward(x: number, y: number, targetX: number, targetY: number): number {
    const dx = targetX - x;
    const dy = targetY - y;

    if (dx > 0 && dy > 0) return 3;
    if (dx > 0 && dy < 0) return 1;
    if (dx < 0 && dy > 0) return 5;
    if (dx < 0 && dy < 0) return 7;
    if (dx > 0) return 2;
    if (dx < 0) return 6;
    if (dy > 0) return 4;
    return 0;
  }

  private isNearDeposit(x: number, y: number): boolean {
    const dist = distanceSquared(x, y, this.nano.Xsource, this.nano.Ysource);
    return dist <= this.config.resourceRadius * this.config.resourceRadius;
  }

  private updateSignalEvents(): void {
    if (this.signalEvents.length === 0) {
      return;
    }
    for (const event of this.signalEvents) {
      event.ttl -= 1;
    }
    this.signalEvents = this.signalEvents.filter((event) => event.ttl > 0);
  }

  private pushEvent(label: string, detail?: string): void {
    this.eventLog.push({
      id: this.eventSeq,
      tick: this.tick,
      label,
      detail,
    });
    this.eventSeq += 1;
    if (this.eventLog.length > 200) {
      this.eventLog.shift();
    }
  }

  private recordDeposit(x: number, y: number): void {
    this.resourceHistory.unshift({ x, y });
    if (this.resourceHistory.length > 10) {
      this.resourceHistory.length = 10;
    }
  }

  private formatProgram(mem: number[], data: number[]): string {
    const opName = (opcode: number): string => {
      switch (opcode) {
        case INSTRUCTION.MOVE:
          return 'MOV';
        case INSTRUCTION.REVERSE:
          return 'REV';
        case INSTRUCTION.SIGNAL_OR_COLLECT:
          return 'SIG';
        case INSTRUCTION.TURN_RIGHT:
          return 'RGT';
        case INSTRUCTION.TURN_LEFT:
          return 'LFT';
        default:
          return 'NOP';
      }
    };

    return mem
      .map((opcode, idx) => `${opName(opcode)} ${data[idx] ?? 0}`)
      .join(' | ');
  }
}
