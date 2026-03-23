'use client';

import { useEffect, useRef } from 'react';
import GameSocketManager from '@/lib/gameSocketManager';
import { GameState } from './useGameState';

export function useSync(
  state: GameState, 
  updateState: (updates: Partial<GameState>) => void,
  isHost: boolean
) {
  const socketManager = GameSocketManager.getInstance();
  const lastSyncRef = useRef<string>('');

  // Listener for incoming sync data
  useEffect(() => {
    const handleSync = (data: any) => {
      // If we are the host, we ignore incoming syncs (we are the source of truth)
      // Unless this is the first sync after joining a room? 
      // Actually, standard logic is clients sync FROM host.
      if (!data || isHost) return;

      const dataStr = JSON.stringify(data);
      if (dataStr === lastSyncRef.current) return;
      lastSyncRef.current = dataStr;

      updateState(data);
    };

    socketManager.onSyncGameState(handleSync);
    return () => {
      socketManager.off('sync-game-state', handleSync); // The manager handles this
    };
  }, [isHost, updateState, socketManager]);

  // Push updates if host
  useEffect(() => {
    const room = socketManager.getCurrentRoom();
    if (!isHost || !room) return;

    const currentSyncStr = JSON.stringify(state);
    if (currentSyncStr === lastSyncRef.current) return;
    
    // Only sync essential gameplay state
    const syncPayload = {
      currentRuleIndex: state.currentRuleIndex,
      currentChallengeIndex: state.currentChallengeIndex,
      assignedChallenges: state.assignedChallenges,
      ageDeck: state.ageDeck,
      currentAgeIndex: state.currentAgeIndex,
      isCatastrophe: state.isCatastrophe,
      playerMeanings: state.playerMeanings,
      selectedMeanings: state.selectedMeanings,
      revealedMeanings: state.revealedMeanings,
      trinketState: state.trinketState,
      pocketedTrinkets: state.pocketedTrinkets,
      trinketsPocketedThisTurn: state.trinketsPocketedThisTurn,
      dominantState: state.dominantState,
    };

    socketManager.syncGameState(room.id, syncPayload);
    lastSyncRef.current = currentSyncStr;
  }, [state, isHost, socketManager]);

  return {
    socketManager,
    playerId: socketManager.getPlayerId()
  };
}
