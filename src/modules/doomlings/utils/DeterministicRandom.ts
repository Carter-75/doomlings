// Deterministic Random Number Generator for Doomlings
// Implements Master Spec Requirements 24, 25

export class DoomlingsPRNG {
  private seed: number;
  private originalSeed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.originalSeed = seed;
  }

  // Linear Congruential Generator - Simple and deterministic
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.seed / Math.pow(2, 32);
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  nextFloat(min: number = 0, max: number = 1): number {
    return min + this.next() * (max - min);
  }

  // For deterministic replay
  getSeed(): number {
    return this.seed;
  }

  getOriginalSeed(): number {
    return this.originalSeed;
  }

  // Reset to original seed
  reset(): void {
    this.seed = this.originalSeed;
  }

  // Create a new PRNG with the same current state
  clone(): DoomlingsPRNG {
    const cloned = new DoomlingsPRNG(this.originalSeed);
    cloned.seed = this.seed;
    return cloned;
  }

  // Shuffle array in-place deterministically
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Pick random element from array
  choice<T>(array: T[]): T {
    return array[this.nextInt(array.length)];
  }

  // Pick multiple random elements without replacement
  sample<T>(array: T[], count: number): T[] {
    const shuffled = [...array];
    this.shuffle(shuffled);
    return shuffled.slice(0, count);
  }
}

// Utility functions for card deck operations
export class DeckOperations {
  private prng: DoomlingsPRNG;

  constructor(prng: DoomlingsPRNG) {
    this.prng = prng;
  }

  // Shuffle cards deterministically
  shuffleDeck<T>(deck: T[]): T[] {
    return this.prng.shuffle([...deck]);
  }

  // Deal cards to players
  dealCards<T>(deck: T[], playerCount: number, cardsPerPlayer: number): T[][] {
    const hands: T[][] = Array(playerCount).fill(null).map(() => []);
    
    for (let cardIndex = 0; cardIndex < cardsPerPlayer; cardIndex++) {
      for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
        if (deck.length > 0) {
          hands[playerIndex].push(deck.shift()!);
        }
      }
    }
    
    return hands;
  }

  // Draw random cards from deck
  drawCards<T>(deck: T[], count: number): T[] {
    const drawn: T[] = [];
    for (let i = 0; i < count && deck.length > 0; i++) {
      drawn.push(deck.shift()!);
    }
    return drawn;
  }

  // Pick random cards from collection without removing
  pickRandomCards<T>(cards: T[], count: number): T[] {
    return this.prng.sample(cards, count);
  }
}

export default DoomlingsPRNG;