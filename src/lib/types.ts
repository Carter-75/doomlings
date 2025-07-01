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
    worldsEnd?: string;
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

export interface DominantCardState {
    assignedTo: string;
    selectedTier: string | null;
}

export interface TrinketState {
    deck: Trinket[];
    playerTrinkets: { [key: string]: Trinket[] };
}