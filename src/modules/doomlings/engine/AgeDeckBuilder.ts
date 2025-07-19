// Age Deck Construction System - Canonical Implementation  
// Implements Master Spec Requirements 6, 7, 26

import { AgeCard, CatastropheCard, BirthOfLifeCard } from '../types/Card';
import { GameConfig, AgeDeckConstruction } from './GameState';
import { DoomlingsPRNG } from '../utils/DeterministicRandom';

export class AgeDeckBuilder {
  private prng: DoomlingsPRNG;

  constructor(seed: number) {
    this.prng = new DoomlingsPRNG(seed);
  }

  // MAIN AGE DECK CONSTRUCTION (Req 6)
  buildAgeDeck(
    allAges: AgeCard[],
    allCatastrophes: CatastropheCard[],
    birthOfLife: BirthOfLifeCard,
    config: GameConfig
  ): AgeDeckConstruction {
    
    // Step 1: Separate Birth of Life and Catastrophes from other Ages
    const normalAges = allAges.filter(age => age.type === 'age');
    const catastrophes = allCatastrophes.filter(cat => cat.type === 'catastrophe');

    // Step 2: Construct Age piles based on configuration
    const construction = this.constructAgePiles(normalAges, catastrophes, config);

    // Step 3: Build final deck with Birth of Life on top
    const finalDeck = this.assembleFinalDeck(birthOfLife, construction, config);

    return {
      birthOfLife,
      normalAges,
      catastrophes,
      constructedDeck: finalDeck,
      pileConfiguration: construction
    };
  }

  // AGE PILE CONSTRUCTION WITH CATASTROPHE SPACING (Req 6, 26)
  private constructAgePiles(
    ages: AgeCard[],
    catastrophes: CatastropheCard[],
    config: GameConfig
  ): AgeDeckConstruction['pileConfiguration'] {
    
    const shuffledAges = this.prng.shuffle([...ages]);
    const shuffledCatastrophes = this.prng.shuffle([...catastrophes]);

    if (config.catastropheSpacing === 'standard') {
      return this.buildStandardThreePiles(shuffledAges, shuffledCatastrophes, config);
    } else {
      return this.buildCustomPiles(shuffledAges, shuffledCatastrophes, config);
    }
  }

  // STANDARD THREE-PILE CONSTRUCTION (Default)
  private buildStandardThreePiles(
    ages: AgeCard[],
    catastrophes: CatastropheCard[],
    config: GameConfig
  ): AgeDeckConstruction['pileConfiguration'] {
    
    // Calculate ages per pile (distribute evenly)
    const totalAges = ages.length;
    const agesPerPile = Math.floor(totalAges / 3);
    const extraAges = totalAges % 3;

    // Create three piles
    const pile1: (AgeCard | CatastropheCard)[] = [];
    const pile2: (AgeCard | CatastropheCard)[] = [];
    const pile3: (AgeCard | CatastropheCard)[] = [];

    // Distribute ages
    let ageIndex = 0;
    
    // Pile 1
    const pile1AgeCount = agesPerPile + (extraAges > 0 ? 1 : 0);
    for (let i = 0; i < pile1AgeCount; i++) {
      pile1.push(ages[ageIndex++]);
    }
    
    // Pile 2  
    const pile2AgeCount = agesPerPile + (extraAges > 1 ? 1 : 0);
    for (let i = 0; i < pile2AgeCount; i++) {
      pile2.push(ages[ageIndex++]);
    }
    
    // Pile 3
    for (let i = ageIndex; i < ages.length; i++) {
      pile3.push(ages[i]);
    }

    // Add one Catastrophe to each pile
    pile1.push(catastrophes[0]);
    pile2.push(catastrophes[1]);
    
    if (config.guaranteeFinalCatastrophe) {
      // Place final catastrophe at bottom of pile 3 
      pile3.unshift(catastrophes[2]);
      this.prng.shuffle(pile3.slice(1)); // Shuffle everything except the first catastrophe
    } else {
      pile3.push(catastrophes[2]);
      this.prng.shuffle(pile3);
    }

    // Shuffle each pile individually
    this.prng.shuffle(pile1);
    this.prng.shuffle(pile2);
    if (!config.guaranteeFinalCatastrophe) {
      this.prng.shuffle(pile3);
    }

    return { pile1, pile2, pile3 };
  }

  // CUSTOM PILE CONFIGURATION (House Rules)
  private buildCustomPiles(
    ages: AgeCard[],
    catastrophes: CatastropheCard[],
    config: GameConfig
  ): AgeDeckConstruction['pileConfiguration'] {
    
    const pileCount = config.extendedFourthPile ? 4 : 3;
    const agesPerPile = Math.floor(ages.length / pileCount);
    const catastrophesNeeded = Math.min(config.catastropheCount, catastrophes.length);

    const piles: (AgeCard | CatastropheCard)[][] = Array(pileCount).fill(null).map(() => []);

    // Distribute ages evenly
    let ageIndex = 0;
    for (let pileIndex = 0; pileIndex < pileCount; pileIndex++) {
      const currentPileAgeCount = agesPerPile + (ageIndex < ages.length % pileCount ? 1 : 0);
      
      for (let i = 0; i < currentPileAgeCount && ageIndex < ages.length; i++) {
        piles[pileIndex].push(ages[ageIndex++]);
      }
    }

    // Distribute catastrophes
    for (let i = 0; i < Math.min(catastrophesNeeded, pileCount); i++) {
      if (i === pileCount - 1 && config.guaranteeFinalCatastrophe) {
        // Place at bottom of final pile
        piles[i].unshift(catastrophes[i]);
        this.prng.shuffle(piles[i].slice(1));
      } else {
        piles[i].push(catastrophes[i]);
        this.prng.shuffle(piles[i]);
      }
    }

    // Add extra catastrophes for custom modes
    for (let i = pileCount; i < catastrophesNeeded; i++) {
      const randomPileIndex = this.prng.nextInt(pileCount);
      piles[randomPileIndex].push(catastrophes[i]);
      this.prng.shuffle(piles[randomPileIndex]);
    }

    return {
      pile1: piles[0],
      pile2: piles[1], 
      pile3: piles[2],
      pile4: config.extendedFourthPile ? piles[3] : undefined
    };
  }

  // FINAL DECK ASSEMBLY
  private assembleFinalDeck(
    birthOfLife: BirthOfLifeCard,
    construction: AgeDeckConstruction['pileConfiguration'],
    config: GameConfig
  ): (AgeCard | CatastropheCard | BirthOfLifeCard)[] {
    
    const finalDeck: (AgeCard | CatastropheCard | BirthOfLifeCard)[] = [];

    // Birth of Life goes on top (face-down)
    finalDeck.push(birthOfLife);

    // Stack the piles in order (pile 3/4 at bottom, pile 1 near top)
    if (construction.pile4) {
      finalDeck.push(...construction.pile4);
    }
    finalDeck.push(...construction.pile3);
    finalDeck.push(...construction.pile2);
    finalDeck.push(...construction.pile1);

    return finalDeck;
  }

  // TEMPORAL AGE REPLAY HANDLING (Req 14)
  findPreviousAge(
    ageHistory: (AgeCard | CatastropheCard | BirthOfLifeCard)[],
    stepsBack: number
  ): AgeCard | BirthOfLifeCard | null {
    
    // Search backwards through age history, ignoring Catastrophes
    let foundAges = 0;
    
    for (let i = ageHistory.length - 1; i >= 0; i--) {
      const card = ageHistory[i];
      
      // Skip catastrophes when looking for previous age
      if (card.type === 'catastrophe') {
        continue;
      }
      
      foundAges++;
      if (foundAges === stepsBack) {
        if (card.type === 'birth_of_life') {
          return card as BirthOfLifeCard;
        } else if (card.type === 'age') {
          return card as AgeCard;
        }
      }
    }

    // If we can't find enough previous ages, return Birth of Life fallback
    const birthOfLife = ageHistory.find(card => card.type === 'birth_of_life');
    return birthOfLife as BirthOfLifeCard || null;
  }

  // VALIDATION METHODS
  validateDeckConstruction(construction: AgeDeckConstruction): boolean {
    const { constructedDeck, pileConfiguration } = construction;

    // Check that Birth of Life is first
    if (constructedDeck[0]?.type !== 'birth_of_life') {
      return false;
    }

    // Count catastrophes in construction
    const totalCatastrophes = Object.values(pileConfiguration)
      .flat()
      .filter(card => card && card.type === 'catastrophe')
      .length;

    // Validate minimum catastrophe count
    if (totalCatastrophes < 3) {
      return false;
    }

    // Validate deck composition
    const ages = constructedDeck.filter(card => card.type === 'age').length;
    const catastrophes = constructedDeck.filter(card => card.type === 'catastrophe').length;
    const birthCount = constructedDeck.filter(card => card.type === 'birth_of_life').length;

    return ages > 0 && catastrophes >= 3 && birthCount === 1;
  }

  // DEBUGGING AND EXPORT
  exportDeckConfiguration(construction: AgeDeckConstruction): any {
    return {
      totalCards: construction.constructedDeck.length,
      birthOfLifePosition: construction.constructedDeck.findIndex(card => card.type === 'birth_of_life'),
      catastrophePositions: construction.constructedDeck
        .map((card, index) => ({ card: card.name, type: card.type, position: index }))
        .filter(item => item.type === 'catastrophe'),
      pileBreakdown: {
        pile1: {
          total: construction.pileConfiguration.pile1.length,
          ages: construction.pileConfiguration.pile1.filter(c => c.type === 'age').length,
          catastrophes: construction.pileConfiguration.pile1.filter(c => c.type === 'catastrophe').length
        },
        pile2: {
          total: construction.pileConfiguration.pile2.length,
          ages: construction.pileConfiguration.pile2.filter(c => c.type === 'age').length,
          catastrophes: construction.pileConfiguration.pile2.filter(c => c.type === 'catastrophe').length
        },
        pile3: {
          total: construction.pileConfiguration.pile3.length,
          ages: construction.pileConfiguration.pile3.filter(c => c.type === 'age').length,
          catastrophes: construction.pileConfiguration.pile3.filter(c => c.type === 'catastrophe').length
        },
        pile4: construction.pileConfiguration.pile4 ? {
          total: construction.pileConfiguration.pile4.length,
          ages: construction.pileConfiguration.pile4.filter(c => c.type === 'age').length,
          catastrophes: construction.pileConfiguration.pile4.filter(c => c.type === 'catastrophe').length
        } : null
      }
    };
  }
}

export default AgeDeckBuilder;