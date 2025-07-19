// Card Data Service - Loads all Doomlings card data from JSON files

export interface Card {
  id: string;
  name: string;
  type: 'trait' | 'dominant' | 'age' | 'catastrophe' | 'trinket' | 'treasure';
  color?: 'red' | 'green' | 'blue' | 'purple' | 'colorless';
  faceValue?: number;
  effect?: string;
  action?: string;
  points?: number;
  expansion?: string;
  rarity?: string;
  tiers?: { [key: string]: string }; // For dominants
  objective?: string; // For trinkets
  power?: string; // For trinkets
  worldsEnd?: string; // For catastrophes
  description?: string; // For ages
}

export interface GameData {
  traits: Card[];
  dominants: Card[];
  ages: Card[];
  catastrophes: Card[];
  trinkets: Card[];
  treasures: Card[];
  rules: string[];
  catastropheRules: string[];
}

class CardDataService {
  private static instance: CardDataService;
  private gameData: GameData | null = null;
  private loading = false;

  private constructor() {}

  static getInstance(): CardDataService {
    if (!CardDataService.instance) {
      CardDataService.instance = new CardDataService();
    }
    return CardDataService.instance;
  }

  async loadAllData(): Promise<GameData> {
    if (this.gameData) {
      return this.gameData;
    }

    if (this.loading) {
      // Wait for existing load to complete
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.gameData!;
    }

    this.loading = true;

    try {
      // Load all data files in parallel
      const [
        normalRulesData,
        catastropheRulesData,
        dominantData,
        normalAgeData,
        merchantAgeData,
        catastropheData,
        meaningOfLifeData,
        trinketData,
        extendedCards
      ] = await Promise.all([
        this.loadJson('/data/normalRules.json'),
        this.loadJson('/data/catastropheRules.json'),
        this.loadJson('/data/dominantData.json'),
        this.loadJson('/data/normalAgeData.json'),
        this.loadJson('/data/merchantAgeData.json'),
        this.loadJson('/data/catastropheData.json'),
        this.loadJson('/data/meaningOfLifeData.json'),
        this.loadJson('/data/trinketData.json'),
        this.loadJson('/data/extendedCards.json')
      ]);

      // Process and normalize the data
      this.gameData = {
        traits: this.processTraits(meaningOfLifeData, extendedCards),
        dominants: this.processDominants(dominantData),
        ages: this.processAges(normalAgeData, merchantAgeData, extendedCards),
        catastrophes: this.processCatastrophes(catastropheData, extendedCards),
        trinkets: this.processTrinkets(trinketData),
        treasures: this.processTreasures(extendedCards),
        rules: this.parseRules(normalRulesData, 'Rule'),
        catastropheRules: this.parseRules(catastropheRulesData, 'Catastrophe Rule')
      };

      return this.gameData;
    } catch (error) {
      console.error('Failed to load card data:', error);
      throw error;
    } finally {
      this.loading = false;
    }
  }

  private async loadJson(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}`);
    }
    return response.json();
  }

  private parseRules(data: any, titlePrefix: string): string[] {
    if (Array.isArray(data)) {
      return data.map((ruleString, index) => {
        const parts = ruleString.split(':');
        const title = parts.length > 1 ? parts[0] : `${titlePrefix} ${index + 1}`;
        const description = parts.length > 1 ? parts.slice(1).join(':').trim() : ruleString;
        return `${title}: ${description}`;
      });
    }
    return [];
  }

  private processTraits(meaningOfLife: any[], extendedCards: any): Card[] {
    const traits: Card[] = [];

    // Process meaning of life as traits
    if (meaningOfLife) {
      meaningOfLife.forEach((meaning, index) => {
        traits.push({
          id: `meaning-${index}`,
          name: meaning.name,
          type: 'trait',
          color: 'purple',
          effect: meaning.description,
          points: 10,
          expansion: 'base'
        });
      });
    }

    // Add new traits from extended cards
    if (extendedCards?.newTraits) {
      extendedCards.newTraits.forEach((trait: any, index: number) => {
        traits.push({
          id: `extended-trait-${index}`,
          ...trait
        });
      });
    }

    // Add expansion traits
    const expansions = ['magicalMerchants', 'glitterlings', 'moonlings', 'deeplings', 'fuzelings'];
    expansions.forEach(expansion => {
      if (extendedCards?.[expansion]) {
        extendedCards[expansion].forEach((card: any, index: number) => {
          if (card.type === 'trait') {
            traits.push({
              id: `${expansion}-${index}`,
              ...card
            });
          }
        });
      }
    });

    return traits;
  }

  private processDominants(dominantData: any[]): Card[] {
    if (!dominantData) return [];

    return dominantData.map((dominant, index) => ({
      id: `dominant-${index}`,
      name: dominant.name,
      type: 'dominant' as const,
      tiers: dominant.tiers,
      expansion: 'base',
      points: 0 // Points depend on tier
    }));
  }

  private processAges(normalAges: any[], merchantAges: any[], extendedCards: any): Card[] {
    const ages: Card[] = [];

    // Normal ages
    if (normalAges) {
      normalAges.forEach((age, index) => {
        ages.push({
          id: `normal-age-${index}`,
          name: age.name,
          type: 'age',
          description: age.description,
          expansion: 'base',
          points: 0
        });
      });
    }

    // Merchant ages
    if (merchantAges) {
      merchantAges.forEach((age, index) => {
        ages.push({
          id: `merchant-age-${index}`,
          name: age.name,
          type: 'age',
          description: age.description,
          expansion: 'merchants',
          points: 0
        });
      });
    }

    // New ages from extended cards
    if (extendedCards?.newAges) {
      extendedCards.newAges.forEach((age: any, index: number) => {
        ages.push({
          id: `extended-age-${index}`,
          ...age
        });
      });
    }

    return ages;
  }

  private processCatastrophes(catastropheData: any[], extendedCards: any): Card[] {
    const catastrophes: Card[] = [];

    // Base catastrophes
    if (catastropheData) {
      catastropheData.forEach((cat, index) => {
        catastrophes.push({
          id: `catastrophe-${index}`,
          name: cat.name,
          type: 'catastrophe',
          description: cat.description,
          worldsEnd: cat.worldsEnd,
          expansion: 'base',
          points: 0
        });
      });
    }

    // New catastrophes
    if (extendedCards?.newCatastrophes) {
      extendedCards.newCatastrophes.forEach((cat: any, index: number) => {
        catastrophes.push({
          id: `extended-catastrophe-${index}`,
          ...cat
        });
      });
    }

    return catastrophes;
  }

  private processTrinkets(trinketData: any[]): Card[] {
    if (!trinketData) return [];

    return trinketData.map((trinket, index) => ({
      id: `trinket-${index}`,
      name: trinket.name,
      type: 'trinket' as const,
      power: trinket.power,
      objective: trinket.objective,
      points: trinket.points,
      expansion: 'merchants'
    }));
  }

  private processTreasures(extendedCards: any): Card[] {
    if (!extendedCards?.treasures) return [];

    return extendedCards.treasures.map((treasure: any, index: number) => ({
      id: `treasure-${index}`,
      ...treasure
    }));
  }

  // Utility methods for game setup
  createGameDeck(expansions: string[] = ['base']): Card[] {
    if (!this.gameData) {
      throw new Error('Card data not loaded');
    }

    const deck: Card[] = [];

    // Add traits based on expansions
    deck.push(...this.gameData.traits.filter(card => 
      expansions.includes(card.expansion || 'base')
    ));

    // Add some dominants (usually dealt separately)
    deck.push(...this.gameData.dominants.slice(0, 10));

    return this.shuffleDeck(deck);
  }

  createAgeDeck(settings: {
    normalAges: number;
    merchantAges: number; 
    catastropheAges: number;
    finalCatastrophe?: boolean;
  }): Card[] {
    if (!this.gameData) {
      throw new Error('Card data not loaded');
    }

    const ageDeck: Card[] = [];
    
    // Add normal ages
    const shuffledNormalAges = this.shuffleDeck([...this.gameData.ages.filter(a => a.expansion === 'base')]);
    ageDeck.push(...shuffledNormalAges.slice(0, settings.normalAges));

    // Add merchant ages
    const shuffledMerchantAges = this.shuffleDeck([...this.gameData.ages.filter(a => a.expansion === 'merchants')]);
    ageDeck.push(...shuffledMerchantAges.slice(0, settings.merchantAges));

    // Add catastrophes
    const shuffledCatastrophes = this.shuffleDeck([...this.gameData.catastrophes]);
    const catastrophesToAdd = shuffledCatastrophes.slice(0, settings.catastropheAges);
    
    if (settings.finalCatastrophe && catastrophesToAdd.length > 0) {
      // Save one catastrophe for the end
      const finalCat = catastrophesToAdd.pop();
      ageDeck.push(...catastrophesToAdd);
      ageDeck.push(...this.shuffleDeck(ageDeck.slice(1))); // Shuffle everything except first
      if (finalCat) ageDeck.push(finalCat);
    } else {
      ageDeck.push(...catastrophesToAdd);
      return this.shuffleDeck(ageDeck);
    }

    return ageDeck;
  }

  private shuffleDeck<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export default CardDataService;