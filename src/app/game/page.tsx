'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Components
import AnimatedButton from '@/components/AnimatedButton';
import TutorialOverlay, { TutorialStep } from '@/components/TutorialOverlay';
import MultiplayerTab from '@/components/MultiplayerTab';
import Modal from '@/components/Modal';

// Sections
import GameSetupSection from './sections/GameSetupSection';
import AgeSetupSection from './sections/AgeSetupSection';
import ChallengesSection from './sections/ChallengesSection';
import MeaningOfLifeSection from './sections/MeaningOfLifeSection';
import TrinketsSection from './sections/TrinketsSection';
import DominantsSection from './sections/DominantsSection';
import GameDashboard from './sections/GameDashboard';

// Hooks & Lib
import { useAds } from '@/lib/ad-context';
import { useFeedback } from '@/lib/feedback-context';
import { useGameState } from '@/hooks/useGameState';
import { useSync } from '@/hooks/useSync';
import GameSocketManager from '@/lib/gameSocketManager';

const TUTORIAL_STEPS: TutorialStep[] = [
  { title: '👋 Welcome!', message: '👋 Welcome to DOOMlings Companion!\nThis app makes Doomlings way more fun and easier to manage — especially with lots of expansions. Let\'s take a quick tour!', highlightId: null },
  { title: '👥 Choose Your Players', message: 'Start here! Use the slider to set how many players, then type in everyone\'s names so the app can track who does what.', highlightId: 'nav-setup', section: 'setup' },
  { title: '⚡ Challenges Section', message: 'This is the Challenges section — brand new cool stuff to do each age! Roll a challenge and one player gets assigned it.', highlightId: 'nav-challenges', section: 'challenges' },
  { title: '🎲 Roll a Challenge', message: 'Hit this button to roll a random challenge for the current age. The app picks a player to try it!', highlightId: 'roll-challenge-btn', section: 'challenges' },
  { title: '📅 Age Setup', message: 'Head to Age Setup to build your Age deck for the game. This controls what ages you\'ll play through.', highlightId: 'nav-age-setup', section: 'ageSetup' },
  { title: '🌱 Normal Ages', message: 'Pick how many Normal Ages to include. "The Birth of Life" is always first when selected — it\'s the opening age!', highlightId: 'normal-ages-count', section: 'ageSetup' },
  { title: '🐱 Catastrophe Ages', message: 'Including Catastrophes? Pick how many here. They\'re shuffled in with a final one always at the very end (toggle that on/off below).', highlightId: 'catastrophe-ages-count', section: 'ageSetup' },
  { title: '🏪 Merchant Ages', message: 'Playing with the Merchant expansion? Add Merchant Ages here to mix them into your deck.', highlightId: 'merchant-ages-count', section: 'ageSetup' },
  { title: '📊 Meaning of Life Scaling (sM)', message: 'This scaling multiplier adjusts MoL card values based on how many ages you\'re playing. Leave it on Auto — it calculates from your age count automatically.', highlightId: 'mol-scaling', section: 'ageSetup' },
  { title: '🃏 Generate Your Deck', message: 'Once you\'ve set your counts, hit Generate to shuffle and build your Age deck! You can flip through ages with Prev/Next.', highlightId: 'generate-deck-btn', section: 'ageSetup' },
  { title: '🌟 Meaning of Life', message: 'Go to MoL — these are secret objectives each player tries to complete for bonus points at the end of the game.', highlightId: 'nav-mol', section: 'meaningOfLife' },
  { title: '🎴 Assign MoL Cards', message: 'Hit Assign — each player gets 2 cards privately. Each player views their cards and picks the one they want to keep!', highlightId: 'assign-mol-btn', section: 'meaningOfLife' },
  { title: '💎 Trinkets', message: 'Trinkets are bonus objectives worth points! Go to the Trinkets section to assign them.', highlightId: 'nav-trinkets', section: 'trinkets' },
  { title: '🎁 Assign Trinkets', message: 'Each player gets 2 trinkets. Pick the one you want to keep and complete its objective during the game for points!', highlightId: 'assign-trinkets-btn', section: 'trinkets' },
  { title: '👑 Dominants', message: 'Dominants use a new Tier system (Tier 1–5) based on card stats. Assign a dominant to each player, and roll its bonus when you play it!', highlightId: 'nav-dominants', section: 'dominants' },
  { title: '🌐 Multiplayer Sync', message: 'Use the new Sync tab to connect with other devices on your WiFi! The host\'s game state (like Age Deck and Challenges) will automatically sync to everyone else.', highlightId: 'nav-multiplayer', section: 'multiplayer' },
  { title: '🎮 Game Turn', message: 'Finally — Game Turn! Follow the current Age card and Challenge. Everyone completes their trinket if they can. Once all players go, flip to the next age for a new challenge!', highlightId: 'nav-game-turn', section: 'gameDashboard' },
  { title: '🚨 Reset All & Themes', message: 'Need a fresh start? Hit "Reset All App Data" below to safely wipe everything except this tutorial! You can also find this, along with customizable layout Themes, in the main Settings page.', highlightId: 'reset-all-btn', section: 'gameDashboard' },
  { title: '🎉 You\'re all set!', message: 'That\'s the whole app! Use the ? Tutorial button in the nav any time you need a refresher. Have fun playing DOOMlings!', highlightId: null },
];

type GuidedSetupStep = 'none' | 'ageDeck' | 'mol' | 'trinkets' | 'complete';

type GameModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
};

const SECTION_ROUTE_DELAY_MS = 500;
const MOL_AUTO_CLOSE_DELAY_MS = 300;

export default function GamePage() {
  const router = useRouter();
  const { setAdsSuppressed } = useAds();
  const { playFeedback } = useFeedback();
  const { state, updateState, resetGame, isLoading: stateLoading } = useGameState();
  
  const [activeSection, setActiveSection] = useState('setup');
  const [viewingPlayer, setViewingPlayer] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [modal, setModal] = useState<GameModalState | null>(null);
  const [guidedSetupStep, setGuidedSetupStep] = useState<GuidedSetupStep>('none');
  const [normalAgeCount, setNormalAgeCount] = useState(9);
  const [merchantAgeCount, setMerchantAgeCount] = useState(0);
  const [catastropheAgeCount, setCatastropheAgeCount] = useState(3);
  const [finalCatastropheMode, setFinalCatastropheMode] = useState(true);
  const [ageMultiplierMode, setAgeMultiplierMode] = useState<'auto' | 'manual'>('auto');
  const [manualAgeMultiplier, setManualAgeMultiplier] = useState(1);
  const [showCatastropheList, setShowCatastropheList] = useState(false);
  const [catastropheMode, setCatastropheMode] = useState(false);
  const [manualCatastropheOverride, setManualCatastropheOverride] = useState(false);
  const [dominantSearchTerm, setDominantSearchTerm] = useState('');
  const [dominantResetTrigger, setDominantResetTrigger] = useState(0);
  const sectionRouteTimeoutRef = useRef<number | null>(null);
  const molCloseTimeoutRef = useRef<number | null>(null);

  const clearPendingSectionRoute = useCallback(() => {
    if (sectionRouteTimeoutRef.current !== null) {
      window.clearTimeout(sectionRouteTimeoutRef.current);
      sectionRouteTimeoutRef.current = null;
    }
  }, []);

  const navigateToSection = useCallback((section: string) => {
    clearPendingSectionRoute();

    sectionRouteTimeoutRef.current = window.setTimeout(() => {
      setActiveSection(section);
      sectionRouteTimeoutRef.current = null;
    }, SECTION_ROUTE_DELAY_MS);
  }, [clearPendingSectionRoute]);

  const switchSectionImmediately = useCallback((section: string) => {
    clearPendingSectionRoute();
    setActiveSection(section);
  }, [clearPendingSectionRoute]);

  const scheduleMolAutoClose = useCallback((playerKey: string) => {
    if (molCloseTimeoutRef.current !== null) {
      window.clearTimeout(molCloseTimeoutRef.current);
    }

    molCloseTimeoutRef.current = window.setTimeout(() => {
      setViewingPlayer(current => (current === playerKey ? null : current));
      molCloseTimeoutRef.current = null;
    }, MOL_AUTO_CLOSE_DELAY_MS);
  }, []);

  const socketManager = GameSocketManager.getInstance();
  const room = socketManager.getCurrentRoom();
  const isHost = room ? room.hostId === socketManager.getPlayerId() : true;
  const isGuest = !isHost;

  const [guestIdentity, setGuestIdentity] = useState<string | null>(null);

  const { playerId } = useSync(state, updateState, isHost);

  const handlersRef = useRef({
    handleTrinketPocket: (p: string, t: any) => {},
    handleTrinketKeep: (p: string, t: any) => {},
    handleTrinketAdd: (p: string) => {},
    handleTrinketRemove: (p: string, t: any) => {},
    handleChooseMeaning: (p: string, m: string) => {},
  });

  useEffect(() => {
    if (!isHost) return;
    const handleGuestAction = (data: any) => {
      const { actionType, payload } = data;
      const { handleTrinketPocket, handleTrinketKeep, handleTrinketAdd, handleTrinketRemove, handleChooseMeaning } = handlersRef.current;
      if (actionType === 'TRINKET_POCKET') handleTrinketPocket(payload.playerName, payload.trinket);
      if (actionType === 'TRINKET_KEEP') handleTrinketKeep(payload.playerName, payload.trinket);
      if (actionType === 'TRINKET_ADD') handleTrinketAdd(payload.playerName);
      if (actionType === 'TRINKET_REMOVE') handleTrinketRemove(payload.playerName, payload.trinket);
      if (actionType === 'MEANING_CHOOSE') handleChooseMeaning(payload.playerName, payload.meaning);
    };
    socketManager.onGuestAction(handleGuestAction);
    return () => socketManager.off('guest-action', handleGuestAction);
  }, [isHost, socketManager]);

  useEffect(() => {
    return () => {
      clearPendingSectionRoute();
      if (molCloseTimeoutRef.current !== null) {
        window.clearTimeout(molCloseTimeoutRef.current);
      }
    };
  }, [clearPendingSectionRoute]);

  // Sync tutorial steps with active sections
  useEffect(() => {
    if (tutorialStep !== null) {
      const step = TUTORIAL_STEPS[tutorialStep];
      if (step?.section) {
        navigateToSection(step.section);
      }
    }
  }, [tutorialStep, navigateToSection]);

  // Scroll to top when active section changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeSection]);

  // Game Data References
  const [allData, setAllData] = useState<{
    rules: any[], normalAges: any[], merchantAges: any[], catastropheAges: any[],
    meaningOfLife: any[], trinkets: any[], dominants: any[]
  }>({
    rules: [], normalAges: [], merchantAges: [], catastropheAges: [],
    meaningOfLife: [], trinkets: [], dominants: []
  });

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [rules, ageCards, merchantAges, catastropheAges, mol, trinkets, dominants] = await Promise.all([
          fetch('/data/normalRules.json').then(res => res.json()),
          fetch('/data/ageData.json').then(res => res.json()),
          fetch('/data/merchantAgeData.json').then(res => res.json()),
          fetch('/data/catastropheData.json').then(res => res.json()),
          fetch('/data/meaningOfLifeData.json').then(res => res.json()),
          fetch('/data/trinketData.json').then(res => res.json()),
          fetch('/data/dominantData.json').then(res => res.json()),
        ]);
        setAllData({ 
          rules, 
          normalAges: ageCards, 
          merchantAges: merchantAges.ages || merchantAges, 
          catastropheAges: catastropheAges.ages || catastropheAges, 
          meaningOfLife: mol.cards || mol, 
          trinkets: trinkets.cards || trinkets, 
          dominants: dominants.cards || dominants 
        });
        if (state.rules.length === 0) updateState({ rules: rules });
      } catch (e) {
        console.error('Failed to load game data', e);
      }
    };
    loadData();
  }, []);

  // Handlers
  const startGuidedSetupFlow = () => {
    updateState({ isGameStarted: true });
    setGuidedSetupStep('ageDeck');
    navigateToSection('ageSetup');
  };

  const createSyncRoomForNewGame = async () => {
    const hostName = state.playerNames[0]?.trim() || 'Player 1';

    try {
      await socketManager.connect();

      if (!socketManager.getPlayerId()) {
        await socketManager.registerPlayer(hostName);
      }

      await socketManager.createRoom({
        roomName: `${hostName}'s Room`,
        maxPlayers: Math.max(2, state.playerCount),
        isPrivate: false,
        gameSettings: {
          normalAges: normalAgeCount,
          merchantAges: merchantAgeCount,
          catastropheAges: catastropheAgeCount,
          includeFinalCatastrophe: finalCatastropheMode,
        }
      });
    } catch (error) {
      console.error('Failed to create sync room on start', error);
      setModal({
        isOpen: true,
        title: 'Room Not Created',
        message: 'Could not create a sync room right now. You can still continue setup and open Sync later.',
        type: 'warning'
      });
    }
  };

  const handleStartGame = () => {
    const existingRoom = socketManager.getCurrentRoom();
    const hasStoredRoomId = typeof window !== 'undefined' && Boolean(localStorage.getItem('doomlings_roomId'));
    const alreadySynced = Boolean(existingRoom?.id || existingRoom?.roomId || hasStoredRoomId);

    if (alreadySynced) {
      startGuidedSetupFlow();
      return;
    }

    if (state.playerCount < 2) {
      startGuidedSetupFlow();
      return;
    }

    setModal({
      isOpen: true,
      title: 'Create Sync Room?',
      message: 'You have 2+ players selected. Create a multiplayer sync room now so everyone can stay in sync?',
      type: 'info',
      confirmText: 'Yes, Create Room',
      cancelText: 'No, Continue',
      onCancel: () => {
        startGuidedSetupFlow();
      },
      onConfirm: async () => {
        setModal(null);
        await createSyncRoomForNewGame();
        startGuidedSetupFlow();
      }
    });
  };

  const handleGenerateDeck = (options: { includeBirth: boolean; merchantAges: number; includeFinalCatastrophe: boolean }) => {
    if (state.ageDeck.length > 0) {
      setModal({
        isOpen: true,
        title: 'Regenerate Deck?',
        message: 'This will replace your current Age deck. Continue?',
        type: 'warning',
        onConfirm: () => executeGenerateDeck(options)
      });
    } else {
      executeGenerateDeck(options);
    }
  };

  const executeGenerateDeck = (options: { includeBirth: boolean; merchantAges: number; includeFinalCatastrophe: boolean }) => {
    const shuffledNormal = [...allData.normalAges.filter(a => a.name !== 'The Birth of Life')].sort(() => Math.random() - 0.5);
    const shuffledCatastrophe = [...allData.catastropheAges].sort(() => Math.random() - 0.5);
    const shuffledMerchant = [...allData.merchantAges].sort(() => Math.random() - 0.5);

    const birth = options.includeBirth
      ? allData.normalAges.find(a => a.name === 'The Birth of Life')
      : null;

    const normalBodyCount = Math.max(0, normalAgeCount - (birth ? 1 : 0));
    const catastropheBodyCount = Math.max(0, catastropheAgeCount - (options.includeFinalCatastrophe ? 1 : 0));
    const pickedNormal = shuffledNormal.splice(0, normalBodyCount);
    const pickedMerchant = shuffledMerchant.splice(0, options.merchantAges);
    const pickedCatastrophe = shuffledCatastrophe
      .splice(0, catastropheBodyCount)
      .map((age: any) => ({ ...age, isCatastrophe: true }));
    const finalCatastropheRaw = options.includeFinalCatastrophe ? shuffledCatastrophe.shift() : null;
    const finalCatastrophe = finalCatastropheRaw ? { ...finalCatastropheRaw, isCatastrophe: true } : null;

    const body = [...pickedNormal, ...pickedMerchant, ...pickedCatastrophe].sort(() => Math.random() - 0.5);
    const deck: any[] = [
      ...(birth ? [birth] : []),
      ...body,
      ...(finalCatastrophe ? [finalCatastrophe] : []),
    ];

    updateState({ ageDeck: deck, currentAgeIndex: deck.length > 0 ? 0 : -1 });
    setModal(null);

    if (guidedSetupStep === 'ageDeck') {
      setGuidedSetupStep('mol');
      navigateToSection('meaningOfLife');
    }
  };

  const handleRollChallenge = () => {
    const challengePool = state.rules.length > 0 ? state.rules : allData.rules;
    if (challengePool.length === 0) {
      return;
    }

    const nextIdx = Math.floor(Math.random() * challengePool.length);
    const nextRule = challengePool[nextIdx];
    const challengeKey = typeof nextRule === 'string'
      ? nextRule
      : (nextRule?.title || nextRule?.name || nextRule?.challenge || nextRule?.rule || '');
    const activePlayers = state.playerNames
      .slice(0, state.playerCount)
      .map((name, index) => name.trim() || `Player ${index + 1}`)
      .filter(Boolean);
    const assignedPlayer = activePlayers.length > 0
      ? activePlayers[Math.floor(Math.random() * activePlayers.length)]
      : null;

    updateState({
      currentChallengeIndex: nextIdx,
      assignedChallenges: challengeKey && assignedPlayer ? { [challengeKey]: assignedPlayer } : {}
    });
  };

  const handleAssignChallenge = (player: string, challenge: string) => {
    updateState(prev => ({
        assignedChallenges: { ...prev.assignedChallenges, [challenge]: player }
    }));
  };

  const handleTrinketAdd = (playerName: string) => {
    if (isGuest && room) {
      socketManager.sendGuestAction(room.id, 'TRINKET_ADD', { playerName });
      return;
    }
    updateState(prev => {
      const deck = prev.trinketState.deck || [];
      if (deck.length === 0) {
        return {};
      }

      const [nextTrinket, ...remainingDeck] = deck;
      const current = prev.trinketState.playerTrinkets[playerName] || [];

      return {
        trinketState: {
          deck: remainingDeck,
          playerTrinkets: {
            ...prev.trinketState.playerTrinkets,
            [playerName]: [...current, nextTrinket]
          }
        }
      };
    });
  };

  const handleTrinketRemove = (playerName: string, trinket: any) => {
    if (isGuest && room) {
      socketManager.sendGuestAction(room.id, 'TRINKET_REMOVE', { playerName, trinket });
      return;
    }
    updateState(prev => {
      const current = prev.trinketState.playerTrinkets[playerName] || [];
      const removeIndex = current.findIndex((item: any) => item?.name === trinket?.name);

      if (removeIndex < 0) {
        return {};
      }

      const updatedCurrent = [
        ...current.slice(0, removeIndex),
        ...current.slice(removeIndex + 1),
      ];

      const newState = {
        trinketState: {
          deck: [...prev.trinketState.deck, current[removeIndex]],
          playerTrinkets: {
            ...prev.trinketState.playerTrinkets,
            [playerName]: updatedCurrent
          }
        }
      };

      // Check for auto-progression in guided setup
      if (guidedSetupStep === 'trinkets') {
        const activePlayers = state.playerNames
          .slice(0, state.playerCount)
          .map((name, index) => name.trim() || `Player ${index + 1}`);
        
        const allPlayersSelectedOne = activePlayers.every((pKey) => {
          const playerTrinkets = newState.trinketState.playerTrinkets[pKey] || [];
          return playerTrinkets.length === 1;
        });

        if (allPlayersSelectedOne) {
          setGuidedSetupStep('complete');
          navigateToSection('gameDashboard');
        }
      }

      return newState;
    });
  };

  const handleTrinketKeep = (playerName: string, trinket: any) => {
    if (isGuest && room) {
      socketManager.sendGuestAction(room.id, 'TRINKET_KEEP', { playerName, trinket });
      return;
    }
    updateState(prev => {
      const current = prev.trinketState.playerTrinkets[playerName] || [];
      const updatedCurrent = current.filter((item: any) => item?.name === trinket?.name);
      const returnedToDeck = current.filter((item: any) => item?.name !== trinket?.name);

      const newState = {
        trinketState: {
          deck: [...prev.trinketState.deck, ...returnedToDeck],
          playerTrinkets: {
            ...prev.trinketState.playerTrinkets,
            [playerName]: updatedCurrent
          }
        }
      };

      if (guidedSetupStep === 'trinkets') {
        const activePlayers = state.playerNames
          .slice(0, state.playerCount)
          .map((name, index) => name.trim() || `Player ${index + 1}`);
        
        const allPlayersSelectedOne = activePlayers.every((pKey) => {
          const playerTrinkets = newState.trinketState.playerTrinkets[pKey] || [];
          return playerTrinkets.length === 1;
        });

        if (allPlayersSelectedOne) {
          setGuidedSetupStep('complete');
          navigateToSection('gameDashboard');
        }
      }
      return newState;
    });
  };

  const advancePocketedTrinketsToNextAge = (prev: any) => {
    const deck = [...(prev.trinketState.deck || [])];
    const updatedPlayerTrinkets = { ...prev.trinketState.playerTrinkets };

    Object.entries(prev.trinketsPocketedThisTurn || {}).forEach(([playerName, didPocket]) => {
      if (!didPocket) {
        return;
      }

      const current = updatedPlayerTrinkets[playerName] || [];
      if (current.length !== 1) {
        return;
      }

      if (deck.length > 0) {
        const nextTrinket = deck.shift();
        updatedPlayerTrinkets[playerName] = nextTrinket ? [nextTrinket] : current;
      }
    });

    return {
      trinketState: {
        ...prev.trinketState,
        deck,
        playerTrinkets: updatedPlayerTrinkets,
      },
      trinketsPocketedThisTurn: {},
    };
  };

  const handleTrinketPocket = (playerName: string, trinket: any) => {
    if (isGuest && room) {
      socketManager.sendGuestAction(room.id, 'TRINKET_POCKET', { playerName, trinket });
      return;
    }
    updateState(prev => {
      if (prev.trinketsPocketedThisTurn[playerName]) {
        return {};
      }

      const current = prev.trinketState.playerTrinkets[playerName] || [];
      const pocketed = prev.pocketedTrinkets[playerName] || [];
      const hasTrinket = current.some((item: any) => item?.name === trinket?.name);
      if (!hasTrinket) {
        return {};
      }

      return {
        pocketedTrinkets: {
          ...prev.pocketedTrinkets,
          [playerName]: [...pocketed, trinket]
        },
        trinketsPocketedThisTurn: {
          ...prev.trinketsPocketedThisTurn,
          [playerName]: true
        }
      };
    });
  };

  const handleChooseMeaning = (p: string, m: string) => {
    if (isGuest && room) {
      socketManager.sendGuestAction(room.id, 'MEANING_CHOOSE', { playerName: p, meaning: m });
      scheduleMolAutoClose(p);
      return;
    }

    updateState(prev => {
      const activePlayers = state.playerNames
        .slice(0, state.playerCount)
        .map((name, index) => name.trim() || `Player ${index + 1}`);
        
      const nextSelected = { ...prev.selectedMeanings, [p]: m };
      const isFinalMolPick =
        guidedSetupStep === 'mol' &&
        activePlayers.length > 0 &&
        activePlayers.every((playerKey) => Boolean(nextSelected[playerKey]));

      if (isFinalMolPick) {
        setGuidedSetupStep('trinkets');
        navigateToSection('trinkets');
      }
      
      return { selectedMeanings: nextSelected };
    });

    scheduleMolAutoClose(p);
  };

  handlersRef.current = {
    handleTrinketPocket,
    handleTrinketKeep,
    handleTrinketAdd,
    handleTrinketRemove,
    handleChooseMeaning
  };

  const handleNextTurn = () => {
    // Check for unpocketed trinkets warning if needed
    if (state.currentAgeIndex < state.ageDeck.length - 1) {
        const nextAge = state.ageDeck[state.currentAgeIndex + 1];

        const challengePool = state.rules.length > 0 ? state.rules : allData.rules;
        if (challengePool.length === 0) {
          updateState(prev => ({
            currentAgeIndex: prev.currentAgeIndex + 1,
            ...advancePocketedTrinketsToNextAge(prev)
          }));
          playFeedback(nextAge?.isCatastrophe ? 'catastrophe' : 'age-advance');
          setManualCatastropheOverride(false);
          return;
        }

        const nextChallengeIndex = Math.floor(Math.random() * challengePool.length);
        const nextRule = challengePool[nextChallengeIndex];
        const challengeKey = typeof nextRule === 'string'
          ? nextRule
          : (nextRule?.title || nextRule?.name || nextRule?.challenge || nextRule?.rule || '');
        const activePlayers = state.playerNames
          .slice(0, state.playerCount)
          .map((name, index) => name.trim() || `Player ${index + 1}`)
          .filter(Boolean);
        const assignedPlayer = activePlayers.length > 0
          ? activePlayers[Math.floor(Math.random() * activePlayers.length)]
          : null;

        updateState(prev => ({
            currentAgeIndex: prev.currentAgeIndex + 1,
            currentChallengeIndex: nextChallengeIndex,
            assignedChallenges: challengeKey && assignedPlayer ? { [challengeKey]: assignedPlayer } : {},
          ...advancePocketedTrinketsToNextAge(prev)
        }));
        playFeedback(nextAge?.isCatastrophe ? 'catastrophe' : 'age-advance');
        setManualCatastropheOverride(false);
    }
  };

  const handleNextAgeWithFeedback = () => {
    if (state.currentAgeIndex >= state.ageDeck.length - 1) {
      return;
    }

    const nextAge = state.ageDeck[state.currentAgeIndex + 1];
    updateState(p => ({
      currentAgeIndex: Math.min(p.ageDeck.length - 1, p.currentAgeIndex + 1)
    }));

    playFeedback(nextAge?.isCatastrophe ? 'catastrophe' : 'age-advance');
  };

  const handleNextAgeFromDashboard = () => {
    if (isGuest) return;
    if (state.currentAgeIndex >= state.ageDeck.length - 1) {
      return;
    }

    const nextAge = state.ageDeck[state.currentAgeIndex + 1];
    playFeedback(nextAge?.isCatastrophe ? 'catastrophe' : 'age-advance');

    updateState(p => {
      const nextIndex = Math.min(p.ageDeck.length - 1, p.currentAgeIndex + 1);
      return {
        currentAgeIndex: nextIndex,
        ...(nextIndex !== p.currentAgeIndex
          ? advancePocketedTrinketsToNextAge(p)
          : { trinketsPocketedThisTurn: p.trinketsPocketedThisTurn })
      };
    });
  };

  const currentAge = state.ageDeck[state.currentAgeIndex] || null;
  const isFirstAge = state.currentAgeIndex === 0;
  const isCatastropheFromAge = Boolean(currentAge?.isCatastrophe);
  const effectiveCatastropheMode = manualCatastropheOverride ? catastropheMode : isCatastropheFromAge;
  const rulesSource = state.rules.length > 0 ? state.rules : allData.rules;
  const currentRule = rulesSource[state.currentChallengeIndex] || null;
  const currentChallengeKey = typeof currentRule === 'string'
    ? currentRule
    : (currentRule?.title || currentRule?.name || currentRule?.challenge || currentRule?.rule || '');
  const challengePlayer = currentChallengeKey ? state.assignedChallenges[currentChallengeKey] || null : null;
  const normalAgesMax = allData.normalAges.length;
  const merchantAgesMax = allData.merchantAges.length;
  const catastropheAgesMax = allData.catastropheAges.length;
  const catastrophesInDeck = state.ageDeck.filter((age: any) => Boolean(age?.isCatastrophe || age?.worldsEnd));
  const calculateScalingMultiplier = () => {
    if (ageMultiplierMode === 'manual') return manualAgeMultiplier;
    const totalAges = normalAgeCount + merchantAgeCount + catastropheAgeCount;
    return Math.max(1, totalAges / 20);
  };
  const filteredDominants = allData.dominants.filter((d: any) =>
    dominantSearchTerm.trim()
      ? (d?.name || '').toLowerCase().includes(dominantSearchTerm.toLowerCase())
      : true
  );

  const handleResetAll = () => {
    setModal({
        isOpen: true,
        title: 'Reset All Data?',
        message: 'This will wipe all game progress. This cannot be undone.',
        type: 'error',
        onConfirm: async () => {
            resetGame();
            // Use router.push to home instead of hard reload to preserve router context
            router.push('/');
        }
    });
  };

  if (stateLoading) return <div className="p-10 has-text-centered">Loading Game State...</div>;

  return (
    <div className="game-page-container">
      <nav className="game-nav box">
        <div className="game-nav-wrap">
          <div className="game-nav-row main-row">
            <AnimatedButton id="nav-setup" onClick={() => switchSectionImmediately('setup')} className={activeSection === 'setup' ? 'is-primary nav-btn-active' : 'is-light nav-btn'}>Setup</AnimatedButton>
            <AnimatedButton id="nav-game-turn" onClick={() => switchSectionImmediately('gameDashboard')} className={activeSection === 'gameDashboard' ? 'is-primary nav-btn-active' : 'is-light nav-btn'}>Dashboard</AnimatedButton>
          </div>

          <div className="game-nav-row challenges-row">
            <AnimatedButton id="nav-challenges" onClick={() => switchSectionImmediately('challenges')} className={activeSection === 'challenges' ? 'is-primary nav-btn-active' : 'is-light nav-btn'}>Challenges</AnimatedButton>
            <AnimatedButton id="nav-dominants" onClick={() => switchSectionImmediately('dominants')} className={activeSection === 'dominants' ? 'is-primary nav-btn-active' : 'is-light nav-btn'}>Dominants</AnimatedButton>
          </div>

          <div className="game-nav-row setup-flow-row">
            <AnimatedButton id="nav-age-setup" onClick={() => switchSectionImmediately('ageSetup')} className={activeSection === 'ageSetup' ? 'is-primary nav-btn-active' : 'is-light nav-btn'}>Age Deck</AnimatedButton>
            <AnimatedButton id="nav-mol" onClick={() => switchSectionImmediately('meaningOfLife')} className={activeSection === 'meaningOfLife' ? 'is-primary nav-btn-active' : 'is-light nav-btn'}>MoL</AnimatedButton>
            <AnimatedButton id="nav-trinkets" onClick={() => switchSectionImmediately('trinkets')} className={activeSection === 'trinkets' ? 'is-primary nav-btn-active' : 'is-light nav-btn'}>Trinkets</AnimatedButton>
          </div>

          <div className="game-nav-row secondary-row">
            <AnimatedButton id="nav-multiplayer" onClick={() => switchSectionImmediately('multiplayer')} className={activeSection === 'multiplayer' ? 'is-primary nav-btn-active' : 'is-light nav-btn'}>Sync</AnimatedButton>
            <AnimatedButton onClick={() => setTutorialStep(0)} className="is-info nav-help-btn">Tutorial ?</AnimatedButton>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .game-nav {
          padding: 16px;
          border: 1px solid rgba(var(--secondary-rgb), 0.24);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.26), rgba(255, 255, 255, 0.03));
        }

        .game-nav-wrap {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .game-nav-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          padding: 2px;
          border-radius: 12px;
          background: transparent;
        }

        .main-row {
          padding-bottom: 2px;
          border-bottom: 1px solid rgba(var(--secondary-rgb), 0.16);
        }

        .challenges-row {
          padding-top: 8px;
          padding-bottom: 2px;
        }

        .setup-flow-row {
          padding-bottom: 2px;
        }

        .secondary-row {
          padding-top: 12px;
          border-top: 1px solid rgba(var(--secondary-rgb), 0.2);
        }

        .nav-btn,
        .nav-btn-active,
        .nav-help-btn {
          min-width: 126px;
          min-height: 42px;
        }

        .nav-help-btn {
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        @media (max-width: 1024px) {
          .nav-btn,
          .nav-btn-active,
          .nav-help-btn {
            min-width: 118px;
          }
        }

        .footer-link-v2 {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.2s ease;
        }

        .footer-link-v2:hover {
          color: white;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .game-nav {
            padding: 10px;
          }

          .game-nav-row {
            justify-content: center;
          }

          .nav-btn,
          .nav-btn-active,
          .nav-help-btn {
            flex: 0 1 168px;
            min-width: 132px;
            min-height: 40px;
          }
        }
      `}</style>

      <main className="section pt-4">
        {activeSection === 'setup' && (
          <GameSetupSection 
            playerCount={state.playerCount} 
            playerNames={state.playerNames}
            onPlayerCountChange={n => updateState({ playerCount: n })}
            onPlayerNameChange={(i, n) => {
                const names = [...state.playerNames];
                names[i] = n;
                updateState({ playerNames: names });
            }}
            onStartGame={handleStartGame}
            isGameStarted={state.isGameStarted}
          />
        )}

        {activeSection === 'gameDashboard' && (
          <GameDashboard
            ageDeck={state.ageDeck}
            currentAgeIndex={state.currentAgeIndex}
            rules={rulesSource}
            currentRuleIndex={state.currentChallengeIndex}
            challenges={rulesSource}
            currentChallengeIndex={state.currentChallengeIndex}
            challengePlayer={challengePlayer}
            playerNames={state.playerNames}
            playerCount={state.playerCount}
            pocketedTrinkets={state.pocketedTrinkets}
            trinketState={state.trinketState}
            trinketsPocketedThisTurn={state.trinketsPocketedThisTurn}
            onNextTurn={handleNextTurn}
            onNextAge={handleNextAgeFromDashboard}
            onPrevAge={() => updateState(p => ({ currentAgeIndex: Math.max(0, p.currentAgeIndex - 1) }))}
            isCatastrophe={state.ageDeck[state.currentAgeIndex]?.isCatastrophe || false}
            onTrinketPocket={handleTrinketPocket}
            onTrinketAdd={(p, _t) => handleTrinketAdd(p)}
            onTrinketRemove={handleTrinketRemove}
            onResetAll={handleResetAll}
            isGuest={isGuest}
            isFirstAge={isFirstAge}
          />
        )}

        {activeSection === 'challenges' && (
          <ChallengesSection
            challenges={rulesSource}
            currentChallengeIndex={state.currentChallengeIndex}
            assignedChallenges={state.assignedChallenges}
            playerNames={state.playerNames}
            playerCount={state.playerCount}
            catastropheMode={effectiveCatastropheMode}
            currentRule={currentRule}
            challengePlayer={challengePlayer}
            onRollChallenge={handleRollChallenge}
            onAssignChallenge={handleAssignChallenge}
            onCatastropheToggle={(checked) => {
              setCatastropheMode(checked);
              setManualCatastropheOverride(true);
            }}
            manualCatastropheOverride={manualCatastropheOverride}
            isCatastrophe={isCatastropheFromAge}
            currentAge={currentAge}
            isGuest={isGuest}
          />
        )}

        {activeSection === 'ageSetup' && (
          <AgeSetupSection 
            normalAgeCount={normalAgeCount}
            merchantAgeCount={merchantAgeCount}
            catastropheAgeCount={catastropheAgeCount}
            finalCatastropheMode={finalCatastropheMode}
            ageMultiplierMode={ageMultiplierMode}
            manualAgeMultiplier={manualAgeMultiplier}
            normalAgesMax={normalAgesMax}
            merchantAgesMax={merchantAgesMax}
            catastropheAgesMax={catastropheAgesMax}
            ageDeck={state.ageDeck}
            currentAgeIndex={state.currentAgeIndex}
            catastrophesInDeck={catastrophesInDeck}
            showCatastropheList={showCatastropheList}
            isCatastrophe={isCatastropheFromAge}
            onNormalAgeCountChange={setNormalAgeCount}
            onMerchantAgeCountChange={setMerchantAgeCount}
            onCatastropheAgeCountChange={setCatastropheAgeCount}
            onFinalCatastropheModeChange={setFinalCatastropheMode}
            onAgeMultiplierModeChange={setAgeMultiplierMode}
            onManualAgeMultiplierChange={setManualAgeMultiplier}
            onGenerateDeck={() => handleGenerateDeck({
              includeBirth: normalAgeCount > 0,
              merchantAges: merchantAgeCount,
              includeFinalCatastrophe: finalCatastropheMode,
            })}
            onPrevAge={() => updateState(p => ({ currentAgeIndex: Math.max(0, p.currentAgeIndex - 1) }))}
            onNextAge={handleNextAgeWithFeedback}
            onToggleCatastropheList={() => setShowCatastropheList(v => !v)}
            calculateScalingMultiplier={calculateScalingMultiplier}
          />
        )}

        {activeSection === 'meaningOfLife' && (
          <MeaningOfLifeSection
            playerNames={state.playerNames}
            playerCount={state.playerCount}
            playerMeanings={state.playerMeanings}
            selectedMeanings={state.selectedMeanings}
            revealedMeanings={state.revealedMeanings}
            onAssignMeanings={() => {
                const meanings = [...allData.meaningOfLife].sort(() => Math.random() - 0.5);
                const assigned: any = {};
            state.playerNames.slice(0, state.playerCount).forEach((name, index) => {
              const playerKey = name.trim() || `Player ${index + 1}`;
              assigned[playerKey] = meanings.splice(0, 2);
                });
            updateState({ playerMeanings: assigned, selectedMeanings: {}, revealedMeanings: {} });
            setViewingPlayer(null);
            }}
            onRevealAll={() => {
                const assignedPlayers = Object.keys(state.playerMeanings).filter(
                  (k) => (state.playerMeanings[k] || []).length > 0
                );
                const allCurrentlyRevealed = assignedPlayers.length > 0 && assignedPlayers.every(
                  (k) => Boolean(state.revealedMeanings[k])
                );

                const revealed: any = {};
                assignedPlayers.forEach((k) => {
                  revealed[k] = !allCurrentlyRevealed;
                });

                updateState({ revealedMeanings: revealed });
            }}
            onChooseMeaning={(p, m) => {
              handleChooseMeaning(p, m);
            }}
            onToggleViewPlayer={p => setViewingPlayer(viewingPlayer === p ? null : p)}
            viewingPlayer={viewingPlayer}
            guestIdentity={guestIdentity}
            isGuest={isGuest}
                      ageMultiplier={calculateScalingMultiplier()}
          />
        )}

        {activeSection === 'trinkets' && (
          <TrinketsSection
            playerNames={state.playerNames}
            playerCount={state.playerCount}
            trinketState={state.trinketState}
            pocketedTrinkets={state.pocketedTrinkets}
            trinketsPocketedThisTurn={state.trinketsPocketedThisTurn}
            onAssignTrinkets={() => {
                const deck = [...allData.trinkets].sort(() => Math.random() - 0.5);
                const assigned: any = {};
              state.playerNames.slice(0, state.playerCount).forEach((name, index) => {
                const playerKey = name.trim() || `Player ${index + 1}`;
                assigned[playerKey] = deck.splice(0, 2);
                });
              updateState({
                trinketState: { deck, playerTrinkets: assigned },
                pocketedTrinkets: {},
                trinketsPocketedThisTurn: {}
              });
            }}
            onTrinketPocket={handleTrinketPocket}
            onTrinketAdd={(p, _t) => handleTrinketAdd(p)}
            onTrinketRemove={handleTrinketRemove}
            onTrinketKeep={handleTrinketKeep}
            isGuest={isGuest}
            guestIdentity={guestIdentity}
          />
        )}

        {activeSection === 'dominants' && (
          <DominantsSection
            playerNames={state.playerNames}
            playerCount={state.playerCount}
            dominants={filteredDominants}
            dominantState={state.dominantState}
            dominantSearchTerm={dominantSearchTerm}
            dominantResetTrigger={dominantResetTrigger}
            onDominantChange={(name, updates) => updateState(prev => ({
                dominantState: { ...prev.dominantState, [name]: { ...(prev.dominantState[name] || { assignedTo: 'Assign', selectedTier: null }), ...updates } }
            }))}
            onResetDominants={() => {
              updateState({ dominantState: {} });
              setDominantResetTrigger(v => v + 1);
            }}
            onSearchChange={setDominantSearchTerm}
          />
        )}

        {activeSection === 'multiplayer' && (
          <MultiplayerTab playerNames={state.playerNames} playerCount={state.playerCount} />
        )}
      </main>

      {/* Modal System */}
      {modal && (
        <Modal
          isOpen={modal.isOpen}
          onClose={() => {
            const cancelHandler = modal.onCancel;
            setModal(null);
            cancelHandler?.();
          }}
          title={modal.title}
          type={modal.type}
          actions={
            modal.onConfirm ? (
              <>
                <AnimatedButton
                  onClick={() => {
                    const cancelHandler = modal.onCancel;
                    setModal(null);
                    cancelHandler?.();
                  }}
                  className="is-light"
                >
                  {modal.cancelText || 'Cancel'}
                </AnimatedButton>
                <AnimatedButton onClick={modal.onConfirm} className={`is-${modal.type || 'primary'}`}>{modal.confirmText || 'Confirm'}</AnimatedButton>
              </>
            ) : null
          }
        >
          <p>{modal.message}</p>
        </Modal>
      )}

      {/* Tutorial Overlay */}
      {tutorialStep !== null && (
        <TutorialOverlay
          steps={TUTORIAL_STEPS}
          currentStep={tutorialStep}
          onNext={() => setTutorialStep(s => (s !== null && s < TUTORIAL_STEPS.length - 1 ? s + 1 : null))}
          onBack={() => setTutorialStep(s => (s !== null && s > 0 ? s - 1 : 0))}
          onSkip={() => setTutorialStep(null)}
        />
      )}

      {/* Guest Identity Modal */}
      {isGuest && !guestIdentity && state.playerNames.length > 0 && (
        <Modal
          isOpen={true}
          onClose={() => {}}
          title="📡 Joined Synced Game"
          type="info"
          actions={
            <AnimatedButton onClick={() => setGuestIdentity('Spectator')} className="is-light">Just Spectate</AnimatedButton>
          }
        >
          <div className="has-text-centered mb-4">
            <p>You have joined the host's game! Please select which player you are:</p>
          </div>
          <div className="columns is-multiline is-mobile">
            {state.playerNames.slice(0, state.playerCount).map((name, index) => {
              const pName = name.trim() || `Player ${index + 1}`;
              return (
                <div key={index} className="column is-half">
                  <AnimatedButton 
                    onClick={() => setGuestIdentity(pName)} 
                    className="is-primary is-fullwidth"
                  >
                    {pName}
                  </AnimatedButton>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      <footer className="game-footer mt-16 pb-12 animate-fade-in">
        <div className="container px-4">
          <div className="footer-content glass py-8 px-6 has-text-centered relative overflow-hidden" 
               style={{ borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            
            <div className="footer-links is-flex is-justify-content-center is-align-items-center gap-8 mb-6">
              <Link href="/" className="footer-link-v2">🏠 Home</Link>
              <Link href="/settings" className="footer-link-v2">⚙️ Settings</Link>
              <button onClick={handleResetAll} className="footer-link-v2 text-error border-none bg-transparent cursor-pointer p-0">⚠️ Reset App</button>
            </div>

            <div className="footer-divider mb-6 mx-auto" style={{ width: '40px', height: '2px', background: 'var(--primary-orange)', opacity: 0.3, borderRadius: '2px' }}></div>

            <div className="footer-info">
              <p className="copyright is-size-7 mb-1 font-bold tracking-widest uppercase opacity-70">
                © {new Date().getFullYear()} DOOMlings Companion
              </p>
              <p className="is-size-7 text-muted opacity-40 italic">Premium Edition • v2.4.0</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
