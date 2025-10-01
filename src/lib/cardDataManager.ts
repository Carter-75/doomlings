/**
 * Card Data Management System
 * Provides centralized management for all card data with easy replacement capabilities
 */

export interface Rule {
  title: string;
  description: string;
}

export interface Dominant {
  name: string;
  tiers: {
    [key: string]: string;
  };
}

export interface Age {
  name: string;
  description: string;
  worldsEnd?: string; // For catastrophe ages
}

export interface Meaning {
  name: string;
  description: string;
}

export interface Trinket {
  name: string;
  power: string;
  objective: string;
  points: number;
}

export interface ExtendedCard {
  name: string;
  type: string;
  description: string;
  cost?: number;
  points?: number;
  tier?: string;
  category?: string;
}

// Card Data Paths Configuration
export const CARD_DATA_PATHS = {
  normalRules: '/data/normalRules.json',
  catastropheRules: '/data/catastropheRules.json',
  dominantData: '/data/dominantData.json',
  normalAgeData: '/data/normalAgeData.json',
  merchantAgeData: '/data/merchantAgeData.json',
  catastropheData: '/data/catastropheData.json',
  meaningOfLifeData: '/data/meaningOfLifeData.json',
  trinketData: '/data/trinketData.json',
  extendedCards: '/data/extendedCards.json',
} as const;

// Type definitions for data loading
export type CardDataType = keyof typeof CARD_DATA_PATHS;

// Data validation schemas
export const validateRule = (rule: any): rule is Rule => {
  return typeof rule === 'object' && 
         typeof rule.title === 'string' && 
         typeof rule.description === 'string';
};

export const validateDominant = (dominant: any): dominant is Dominant => {
  return typeof dominant === 'object' && 
         typeof dominant.name === 'string' && 
         typeof dominant.tiers === 'object' &&
         Object.values(dominant.tiers).every(tier => typeof tier === 'string');
};

export const validateAge = (age: any): age is Age => {
  return typeof age === 'object' && 
         typeof age.name === 'string' && 
         typeof age.description === 'string';
};

export const validateMeaning = (meaning: any): meaning is Meaning => {
  return typeof meaning === 'object' && 
         typeof meaning.name === 'string' && 
         typeof meaning.description === 'string';
};

export const validateTrinket = (trinket: any): trinket is Trinket => {
  return typeof trinket === 'object' && 
         typeof trinket.name === 'string' && 
         typeof trinket.power === 'string' && 
         typeof trinket.objective === 'string' && 
         typeof trinket.points === 'number';
};

/**
 * Card Data Manager Class
 * Handles loading, caching, and management of all card data
 */
export class CardDataManager {
  private cache: Map<CardDataType, any> = new Map();
  private loadingPromises: Map<CardDataType, Promise<any>> = new Map();

  /**
   * Load JSON data from a URL with caching
   */
  private async loadJson(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading ${url}:`, error);
      throw error;
    }
  }

  /**
   * Parse rules from array format to structured format
   */
  private parseRules(data: any, titlePrefix: string): Rule[] {
    if (Array.isArray(data)) {
      return data.map((ruleString, index) => {
        if (typeof ruleString === 'string') {
          const parts = ruleString.split(':');
          const title = parts.length > 1 ? parts[0].trim() : `${titlePrefix} ${index + 1}`;
          const description = parts.length > 1 ? parts.slice(1).join(':').trim() : ruleString;
          return { title, description };
        } else if (validateRule(ruleString)) {
          return ruleString;
        } else {
          return {
            title: `${titlePrefix} ${index + 1}`,
            description: String(ruleString)
          };
        }
      });
    }
    return [];
  }

  /**
   * Load specific card data type
   */
  async loadCardData<T>(type: CardDataType): Promise<T> {
    // Return cached data if available
    if (this.cache.has(type)) {
      return this.cache.get(type);
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(type)) {
      return await this.loadingPromises.get(type)!;
    }

    // Create new loading promise
    const loadingPromise = this.loadDataByType(type);
    this.loadingPromises.set(type, loadingPromise);

    try {
      const data = await loadingPromise;
      this.cache.set(type, data);
      this.loadingPromises.delete(type);
      return data;
    } catch (error) {
      this.loadingPromises.delete(type);
      throw error;
    }
  }

  /**
   * Load data by type with appropriate parsing
   */
  private async loadDataByType(type: CardDataType): Promise<any> {
    const url = CARD_DATA_PATHS[type];
    const rawData = await this.loadJson(url);

    switch (type) {
      case 'normalRules':
        return this.parseRules(rawData, 'Rule');
      
      case 'catastropheRules':
        return this.parseRules(rawData, 'Catastrophe Rule');
      
      case 'dominantData':
        if (Array.isArray(rawData)) {
          return rawData.filter(validateDominant);
        }
        return [];
      
      case 'normalAgeData':
      case 'merchantAgeData':
      case 'catastropheData':
        if (Array.isArray(rawData)) {
          return rawData.filter(validateAge);
        }
        return [];
      
      case 'meaningOfLifeData':
        if (Array.isArray(rawData)) {
          return rawData.filter(validateMeaning);
        }
        return [];
      
      case 'trinketData':
        if (Array.isArray(rawData)) {
          return rawData.filter(validateTrinket);
        }
        return [];
      
      case 'extendedCards':
        return Array.isArray(rawData) ? rawData : [];
      
      default:
        return rawData;
    }
  }

  /**
   * Load all card data at once
   */
  async loadAllData() {
    const loadPromises = Object.keys(CARD_DATA_PATHS).map(async (type) => {
      try {
        const data = await this.loadCardData(type as CardDataType);
        return { type, data, error: null };
      } catch (error) {
        console.error(`Failed to load ${type}:`, error);
        return { type, data: null, error };
      }
    });

    const results = await Promise.all(loadPromises);
    
    // Return results organized by type
    const organizedData: any = {};
    const errors: any = {};
    
    results.forEach(({ type, data, error }) => {
      if (error) {
        errors[type] = error;
      } else {
        organizedData[type] = data;
      }
    });

    return { data: organizedData, errors };
  }

  /**
   * Update card data (for easy replacement)
   */
  updateCardData<T>(type: CardDataType, newData: T): void {
    this.cache.set(type, newData);
  }

  /**
   * Clear cache for a specific data type
   */
  clearCache(type?: CardDataType): void {
    if (type) {
      this.cache.delete(type);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Export current data as JSON (for backup/export)
   */
  exportData(): string {
    const exportData: any = {};
    
    this.cache.forEach((data, type) => {
      exportData[type] = data;
    });

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import data from JSON string
   */
  importData(jsonData: string): void {
    try {
      const importedData = JSON.parse(jsonData);
      
      Object.entries(importedData).forEach(([type, data]) => {
        if (type in CARD_DATA_PATHS) {
          this.cache.set(type as CardDataType, data);
        }
      });
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Invalid JSON data provided');
    }
  }

  /**
   * Get data statistics
   */
  getDataStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.cache.forEach((data, type) => {
      if (Array.isArray(data)) {
        stats[type] = data.length;
      } else if (typeof data === 'object' && data !== null) {
        stats[type] = Object.keys(data).length;
      } else {
        stats[type] = 1;
      }
    });

    return stats;
  }

  /**
   * Search across all loaded card data
   */
  searchCards(query: string): any[] {
    const results: any[] = [];
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return results;

    this.cache.forEach((data, type) => {
      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          let match = false;
          let matchedContent = '';
          
          if (typeof item === 'object' && item !== null) {
            // Search in object properties
            Object.entries(item).forEach(([key, value]) => {
              if (typeof value === 'string' && value.toLowerCase().includes(searchTerm)) {
                match = true;
                matchedContent = `${key}: ${value}`;
              }
            });
          } else if (typeof item === 'string' && item.toLowerCase().includes(searchTerm)) {
            match = true;
            matchedContent = item;
          }
          
          if (match) {
            results.push({
              type,
              index,
              item,
              matchedContent: matchedContent.substring(0, 200) + (matchedContent.length > 200 ? '...' : '')
            });
          }
        });
      }
    });

    return results;
  }
}

// Singleton instance for global use
export const cardDataManager = new CardDataManager();

/**
 * React Hook for using card data
 */
export const useCardData = () => {
  return {
    loadCardData: cardDataManager.loadCardData.bind(cardDataManager),
    loadAllData: cardDataManager.loadAllData.bind(cardDataManager),
    updateCardData: cardDataManager.updateCardData.bind(cardDataManager),
    clearCache: cardDataManager.clearCache.bind(cardDataManager),
    exportData: cardDataManager.exportData.bind(cardDataManager),
    importData: cardDataManager.importData.bind(cardDataManager),
    getDataStats: cardDataManager.getDataStats.bind(cardDataManager),
    searchCards: cardDataManager.searchCards.bind(cardDataManager),
  };
};

/**
 * Utility function to process scaling multipliers in descriptions
 */
export const processScalingDescription = (description: string, scalingMultiplier: number): string => {
  return description
    .replace(/(\d+)\*sM/g, (_, num) => Math.round(parseInt(num) * scalingMultiplier).toString())
    .replace(/sM\*(\d+)/g, (_, num) => Math.round(parseInt(num) * scalingMultiplier).toString())
    .replace(/\bsM\b/g, Math.round(scalingMultiplier).toString());
};

/**
 * Utility function to calculate scaling multiplier based on game setup
 */
export const calculateScalingMultiplier = (normalAgeCount: number, merchantAgeCount: number, catastropheAgeCount: number): number => {
  const totalAges = normalAgeCount + merchantAgeCount + catastropheAgeCount;
  return Math.max(1, totalAges / 20);
};