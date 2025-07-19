// Complete Doomlings Card Type System - Canonical Implementation
// Based on Master Spec Requirements 21, 3, 4

export interface CardSchema {
  id: string;
  slug: string;
  name: string;
  set: string;
  expansionGroup: 'base' | 'upgrade' | 'imaginary_ends' | 'overlush' | 'shadow_puppets' | 'legends_enderas' | 'promos';
  variety?: 'temporal' | 'aquatic' | 'crystalline' | 'shadow' | 'ethereal'; // Imaginary Ends varieties
  species?: 'reptilian' | 'avian' | 'mammalian' | 'insectoid'; // Shadow Puppets species
  color?: 'red' | 'green' | 'blue' | 'purple' | 'colorless';
  type: 'trait' | 'dominant' | 'attachment' | 'age' | 'catastrophe' | 'treasure' | 'birth_of_life';
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'holo' | 'promo';
  pointValue: number;
  dominantLimitImpact: 0 | 1; // 0 = doesn't count toward limit, 1 = counts toward 2-card limit
  genePoolDelta?: number; // Direct Gene Pool modification (+/- or 0)
  triggers: CardTrigger[];
  primitives: EffectPrimitive[];
  ongoingModifiers: OngoingModifier[];
  worldEndBonuses: WorldEndBonus[];
  restrictions: CardRestriction[];
  textPlaceholder: string; // Paraphrased game text
  textHashSHA256?: string; // Hash of original proprietary text
  licensingStatus: 'licensed' | 'placeholder' | 'fair_use' | 'unknown';
  version: string;
  faceValue?: number; // For display purposes
  attachmentTarget?: 'trait' | 'dominant' | 'any';
}

export interface CardTrigger {
  event: 'on_play' | 'start_turn' | 'end_turn' | 'on_discard' | 'on_steal' | 'on_swap' | 
         'on_catastrophe' | 'on_age_reveal' | 'world_end' | 'empty_hand' | 'stabilize';
  condition?: TriggerCondition;
  once?: boolean; // Single use trigger
  priority: number; // Higher = resolves first
}

export interface TriggerCondition {
  type: 'gene_pool_compare' | 'trait_count' | 'hand_size' | 'color_match' | 'dominant_count' | 
        'variety_match' | 'species_match' | 'turn_number' | 'catastrophe_count';
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ne';
  value: number | string;
  target?: 'self' | 'all_players' | 'opponents' | 'active_player';
}

export interface EffectPrimitive {
  type: 'draw' | 'discard' | 'play_additional' | 'steal_trait' | 'swap_trait' | 'modify_gene_pool' |
        'pass_hand' | 'skip_stabilize' | 'force_stabilize' | 'prevent_play' | 'add_points' |
        'multiply_points' | 'copy_effect' | 'temporal_replay' | 'reveal_age' | 'search_deck';
  amount?: number;
  target: 'self' | 'all_players' | 'opponents' | 'choose_player' | 'trait_pile' | 'hand' | 'deck';
  condition?: EffectCondition;
  duration?: 'instant' | 'end_turn' | 'end_round' | 'permanent' | 'world_end';
  stackable: boolean;
}

export interface EffectCondition {
  requirement: 'hand_empty' | 'gene_pool_threshold' | 'trait_color' | 'dominant_present' |
              'catastrophe_active' | 'age_type' | 'turn_phase' | 'player_choice';
  value?: any;
}

export interface OngoingModifier {
  type: 'point_multiplier' | 'gene_pool_cap' | 'dominant_limit_change' | 'draw_bonus' |
        'play_restriction' | 'stabilize_bonus' | 'catastrophe_immunity' | 'swap_protection';
  value: number | boolean;
  scope: 'self' | 'all_players' | 'opponents';
  duration: 'permanent' | 'end_round' | 'world_end';
}

export interface WorldEndBonus {
  type: 'color_count' | 'dominant_bonus' | 'variety_synergy' | 'species_synergy' | 'hand_empty' |
        'gene_pool_final' | 'catastrophe_survived' | 'treasure_collection' | 'set_collection';
  calculation: 'per_card' | 'threshold' | 'exponential' | 'fixed';
  value: number;
  condition?: {
    requirement: string;
    threshold?: number;
  };
}

export interface CardRestriction {
  type: 'cannot_discard' | 'cannot_steal' | 'cannot_swap' | 'cannot_attach' | 'play_once' |
        'requires_dominant' | 'gene_pool_minimum' | 'catastrophe_only' | 'age_restriction';
  scope: 'self' | 'all_cards' | 'trait_pile';
  duration: 'permanent' | 'end_turn' | 'end_round';
}

// Age-specific types
export interface AgeCard extends Omit<CardSchema, 'type'> {
  type: 'age';
  ageEffect: AgeEffect;
  duration: 'one_round' | 'persistent' | 'immediate';
  stackable: boolean;
}

export interface AgeEffect {
  type: 'extra_play' | 'draw_bonus' | 'gene_pool_modify' | 'play_restriction' | 'stabilize_change' |
        'temporal_replay' | 'catastrophe_trigger' | 'scoring_modifier' | 'swap_enable' | 'pass_hands';
  value?: number;
  target: 'all_players' | 'active_player' | 'choose_player';
  condition?: string;
}

// Catastrophe-specific types
export interface CatastropheCard extends Omit<CardSchema, 'type'> {
  type: 'catastrophe';
  catastropheEffect: CatastropheEffect;
  worldEndTrigger?: boolean; // True if this triggers World's End
}

export interface CatastropheEffect {
  type: 'gene_pool_reduce' | 'force_discard' | 'destroy_traits' | 'pass_restrictions' |
        'play_limitations' | 'point_penalties' | 'world_end_trigger' | 'persistent_modifier';
  amount: number;
  target: 'all_players' | 'choose_players' | 'trait_piles' | 'hands' | 'gene_pools';
  persistent: boolean;
}

// Treasure-specific types (Legends of Enderas)
export interface TreasureCard extends Omit<CardSchema, 'type'> {
  type: 'treasure';
  treasureEffect: TreasureEffect;
  revealTrigger: 'immediate' | 'world_end' | 'catastrophe' | 'age_reveal';
}

export interface TreasureEffect {
  type: 'point_bonus' | 'gene_pool_protection' | 'trait_protection' | 'draw_advantage' |
        'catastrophe_mitigation' | 'world_end_multiplier' | 'collection_bonus';
  value: number | string;
  condition?: TriggerCondition;
}

// Birth of Life specific (always first Age)
export interface BirthOfLifeCard extends Omit<CardSchema, 'type'> {
  type: 'birth_of_life';
  baselineEffect: {
    initialGenePools: number;
    initialHandSize: number;
    playPattern: 'one_trait_then_stabilize';
    setupInstructions: string[];
  };
}

// Card Collection Types for Data Management
export interface CardCollection {
  base: CardSchema[]; // 167 cards
  upgrade: CardSchema[]; // 81 cards across 5 mini-expansions
  imaginaryEnds: CardSchema[]; // 127 + 5 varieties
  overlush: CardSchema[]; // 60 cards (4 packs × 14 + 4 holos)
  shadowPuppets: CardSchema[]; // 40 cards, 4 species
  legendsEnderas: CardSchema[]; // 26 Treasures + others
  promos: CardSchema[]; // Various promotional cards
}

export interface ExpansionCounts {
  expectedCounts: {
    base: 167;
    upgrade: 81;
    imaginaryEnds: 127;
    overlush: 60;
    shadowPuppets: 40;
    legendsEnderas: 26;
  };
  actualCounts: Record<string, number>;
  lastVerified: Date;
  discrepancies: string[];
}

// Export main Card type alias
export type Card = CardSchema;