export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextUint(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state;
  }

  nextFloat(): number {
    return this.nextUint() / 0xffffffff;
  }

  nextInt(maxExclusive: number): number {
    return this.nextUint() % maxExclusive;
  }
}

export const hashSeed = (seedText: string): number => {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
};
