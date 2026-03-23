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
  dominantState: {},
  isGameStarted: false,
};

export function useGameState() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadedRef = useRef(false);

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

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoadedRef.current || isLoading) return;
    localStorage.setItem('gameState', JSON.stringify(state));
  }, [state, isLoading]);

  const updateState = (updates: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => {
    setState(prev => {
      const next = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...next };
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
    isLoading
  };
}
