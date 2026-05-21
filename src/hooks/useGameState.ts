'use client';

import { useState, useEffect, useRef } from 'react';
import { Preferences } from '@capacitor/preferences';

export interface GameState {
  playerCount: number;
  playerNames: string[];
  rules: any[];
  currentRuleIndex: number;
  challenges: any[];
  currentChallengeIndex: number;
  assignedChallenges: { [key: string]: string };
  ageDeck: any[];
  currentAgeIndex: number;
  isCatastrophe: boolean;
  playerMeanings: { [key: string]: any[] };
  selectedMeanings: { [key: string]: string };
  revealedMeanings: { [key: string]: boolean };
  trinketState: {
    deck: any[];
    playerTrinkets: { [key: string]: any[] };
  };
  pocketedTrinkets: { [key: string]: any[] };
  trinketsPocketedThisTurn: { [key: string]: boolean };
  dominantState: { [key: string]: { assignedTo: string; selectedTier: string | null } };
  isGameStarted: boolean;
}

const INITIAL_STATE: GameState = {
  playerCount: 4,
  playerNames: ['', '', '', '', '', ''],
  rules: [],
  currentRuleIndex: 0,
  challenges: [],
  currentChallengeIndex: 0,
  assignedChallenges: {},
  ageDeck: [],
  currentAgeIndex: -1,
  isCatastrophe: false,
  playerMeanings: {},
  selectedMeanings: {},
  revealedMeanings: {},
  trinketState: { deck: [], playerTrinkets: {} },
  pocketedTrinkets: {},
  trinketsPocketedThisTurn: {},
  dominantState: {},
  isGameStarted: false,
};

export function useGameState(isGuest: boolean = false) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadedRef = useRef(false);

  const isGuestRef = useRef(isGuest);
  isGuestRef.current = isGuest;

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved game state', e);
      }
    }
    setIsLoading(false);
    isLoadedRef.current = true;
  }, []);

  // Save state to localStorage whenever it changes is now handled in updateState!
  
  const restoreLocalState = () => {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState({ ...INITIAL_STATE, ...parsed });
      } catch (e) {
        console.error('Failed to parse saved game state', e);
      }
    } else {
      setState(INITIAL_STATE);
    }
  };

  const updateState = (updates: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => {
    setState(prev => {
      const next = typeof updates === 'function' ? updates(prev) : updates;
      const newState = { ...prev, ...next };
      
      if (!isGuestRef.current && isLoadedRef.current) {
        localStorage.setItem('gameState', JSON.stringify(newState));
      }
      
      return newState;
    });
  };

  const resetGame = () => {
    setState(INITIAL_STATE);
    localStorage.removeItem('gameState');
  };

  return {
    state,
    updateState,
    resetGame,
    restoreLocalState,
    isLoading
  };
}
