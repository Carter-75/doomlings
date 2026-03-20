'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DominantCard from '@/components/DominantCard';
import MeaningOfLifeCard from '@/components/MeaningOfLifeCard';
import TrinketCard from '@/components/TrinketCard';
import AnimatedButton from '@/components/AnimatedButton';
import GameTurn from '@/components/GameTurn';
import TutorialOverlay, { TutorialStep } from '@/components/TutorialOverlay';
import MultiplayerTab from '@/components/MultiplayerTab';
import GameSocketManager from '@/lib/gameSocketManager';
import { useAds } from '@/lib/ad-context';

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: '👋 Welcome to DOOMlings Companion!',
    message: 'This app makes Doomlings way more fun and easier to manage — especially with lots of expansions. Let\'s take a quick tour!',
    highlightId: null,
  },
  {
    title: '👥 Choose Your Players',
    message: 'Start here! Use the slider to set how many players, then type in everyone\'s names so the app can track who does what.',
    highlightId: 'player-name-section',
    section: 'challenges',
  },
  {
    title: '⚡ Challenges Section',
    message: 'This is the Challenges section — brand new cool stuff to do each age! Roll a challenge and one player gets assigned it.',
    highlightId: 'nav-challenges',
    section: 'challenges',
  },
  {
    title: '🎲 Roll a Challenge',
    message: 'Hit this button to roll a random challenge for the current age. The app picks a player to try it!',
    highlightId: 'roll-challenge-btn',
    section: 'challenges',
  },
  {
    title: '📅 Age Setup',
    message: 'Head to Age Setup to build your Age deck for the game. This controls what ages you\'ll play through.',
    highlightId: 'nav-age-setup',
    section: 'ageSetup',
  },
  {
    title: '🌱 Normal Ages',
    message: 'Pick how many Normal Ages to include. "The Birth of Life" is always first when selected — it\'s the opening age!',
    highlightId: 'normal-age-slider',
    section: 'ageSetup',
  },
  {
    title: '🐱 Catastrophe Ages',
    message: 'Including Catastrophes? Pick how many here. They\'re shuffled in with a final one always at the very end (toggle that on/off below).',
    highlightId: 'catastrophe-age-slider',
    section: 'ageSetup',
  },
  {
    title: '🏪 Merchant Ages',
    message: 'Playing with the Merchant expansion? Add Merchant Ages here to mix them into your deck.',
    highlightId: 'merchant-age-slider',
    section: 'ageSetup',
  },
  {
    title: '📊 Meaning of Life Scaling (sM)',
    message: 'This scaling multiplier adjusts MoL card values based on how many ages you\'re playing. Leave it on Auto — it calculates from your age count automatically.',
    highlightId: 'sm-multiplier-section',
    section: 'ageSetup',
  },
  {
    title: '🃏 Generate Your Deck',
    message: 'Once you\'ve set your counts, hit Generate to shuffle and build your Age deck! You can flip through ages with Prev/Next.',
    highlightId: 'generate-deck-btn',
    section: 'ageSetup',
  },
  {
    title: '🌟 Meaning of Life',
    message: 'Go to MoL — these are secret objectives each player tries to complete for bonus points at the end of the game.',
    highlightId: 'nav-mol',
    section: 'meaningOfLife',
  },
  {
    title: '🎴 Assign MoL Cards',
    message: 'Hit Assign — each player gets 2 cards privately. Each player views their cards and picks the one they want to keep!',
    highlightId: 'assign-mol-btn',
    section: 'meaningOfLife',
  },
  {
    title: '💎 Trinkets',
    message: 'Trinkets are bonus objectives worth points! Go to the Trinkets section to assign them.',
    highlightId: 'nav-trinkets',
    section: 'trinkets',
  },
  {
    title: '🎁 Assign Trinkets',
    message: 'Each player gets 2 trinkets. Pick the one you want to keep and complete its objective during the game for points!',
    highlightId: 'assign-trinkets-btn',
    section: 'trinkets',
  },
  {
    title: '👑 Dominants',
    message: 'Dominants use a new Tier system (Tier 1–5) based on card stats. Assign a dominant to each player, and roll its bonus when you play it!',
    highlightId: 'nav-dominants',
    section: 'dominants',
  },
  {
    title: '🌐 Multiplayer Sync',
    message: 'Use the new Sync tab to connect with other devices on your WiFi! The host\'s game state (like Age Deck and Challenges) will automatically sync to everyone else.',
    highlightId: 'nav-multiplayer',
    section: 'multiplayer',
  },
  {
    title: '🎮 Game Turn',
    message: 'Finally — Game Turn! Follow the current Age card and Challenge. Everyone completes their trinket if they can. Once all players go, flip to the next age for a new challenge!',
    highlightId: 'nav-game-turn',
    section: 'gameTurn',
  },
  {
    title: '🚨 Reset All & Themes',
    message: 'Need a fresh start? Hit "Reset All App Data" below to safely wipe everything except this tutorial! You can also find this, along with customizable layout Themes, in the main Settings page.',
    highlightId: 'reset-all-btn',
    section: 'gameTurn',
  },
  {
    title: "🎉 You're all set!",
    message: "That's the whole app! Use the ? Tutorial button in the nav any time you need a refresher. Have fun playing DOOMlings!",
    highlightId: null,
  },
];

interface DominantCardState {
  assignedTo: string;
  selectedTier: string | null;
}

interface TrinketState {
  deck: Trinket[];
  playerTrinkets: { [key: string]: Trinket[] };
}

// Define types for the data
interface Rule {
  title: string;
  description: string;
}

interface Dominant {
  name: string;
  tiers: {
    [key: string]: string;
  };
}

interface Age {
  name: string;
  description: string;
}

interface Meaning {
  name: string;
  description: string;
}

interface Trinket {
  name: string;
  power: string;
  objective: string;
  points: number;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState('challenges');

  // Ad Context
  const { setAdsSuppressed } = useAds();

  // Tutorial state
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);

  // Game Data State
  const [rules, setRules] = useState<Rule[]>([]);
  const [catastropheRules, setCatastropheRules] = useState<Rule[]>([]);
  const [allDominants, setAllDominants] = useState<Dominant[]>([]);
  const [normalAges, setNormalAges] = useState<Age[]>([]);
  const [merchantAges, setMerchantAges] = useState<Age[]>([]);
  const [catastropheAges, setCatastropheAges] = useState<Age[]>([]);
  const [meaningOfLife, setMeaningOfLife] = useState<Meaning[]>([]);
  const [trinkets, setTrinkets] = useState<Trinket[]>([]);

  // Application State
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState<string[]>(Array(6).fill(''));
  const [catastropheMode, setCatastropheMode] = useState(false);
  const [manualCatastropheOverride, setManualCatastropheOverride] = useState(false);
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [challengePlayer, setChallengePlayer] = useState<string | null>(null);
  const [challengeRolledThisAge, setChallengeRolledThisAge] = useState(false);

  // Age Deck State
  const [ageDeck, setAgeDeck] = useState<Age[]>([]);
  const [currentAgeIndex, setCurrentAgeIndex] = useState(0);
  const [normalAgeCount, setNormalAgeCount] = useState(0);
  const [merchantAgeCount, setMerchantAgeCount] = useState(0);
  const [catastropheAgeCount, setCatastropheAgeCount] = useState(0);
  const [finalCatastropheMode, setFinalCatastropheMode] = useState(true);
  const [catastrophesInDeck, setCatastrophesInDeck] = useState<Age[]>([]);
  const [showCatastropheList, setShowCatastropheList] = useState(false);

  // Age Multiplier State
  const [ageMultiplierMode, setAgeMultiplierMode] = useState<'auto' | 'manual'>('auto');
  const [manualAgeMultiplier, setManualAgeMultiplier] = useState(1);

  // Meaning of Life State
  const [playerMeanings, setPlayerMeanings] = useState<{ [key: string]: Meaning[] }>({});
  const [selectedMeanings, setSelectedMeanings] = useState<{ [key: string]: string | null }>({}); // playerName: cardName
  const [revealedMeanings, setRevealedMeanings] = useState<{ [key: string]: boolean }>({}); // playerName: isRevealed
  const [viewingPlayer, setViewingPlayer] = useState<string | null>(null);

  // Dominant Card States
  const [dominantCardStates, setDominantCardStates] = useState<{ [cardName: string]: DominantCardState }>({});
  const [dominantSearchTerm, setDominantSearchTerm] = useState('');
  const [dominantResetTrigger, setDominantResetTrigger] = useState(0);

  // Trinket State
  const [trinketState, setTrinketState] = useState<{
    deck: Trinket[];
    playerTrinkets: { [key: string]: Trinket[] };
  }>({ deck: [], playerTrinkets: {} });
  const [initialTrinketCount, setInitialTrinketCount] = useState(0);
  const [pocketedTrinkets, setPocketedTrinkets] = useState<{ [key: string]: Trinket[] }>({});
  const [trinketsPocketedThisTurn, setTrinketsPocketedThisTurn] = useState<{ [key: string]: boolean }>({});

  // Game Preferences State
  const [showScrollToTop, setShowScrollToTop] = useState(true);
  const [warnUnpocketedTrinkets, setWarnUnpocketedTrinkets] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingNextTurn, setPendingNextTurn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const isMounted = useRef(false);

  // Multiplayer State Initialization
  const [socketManager] = useState(() => GameSocketManager.getInstance());
  const [isHost, setIsHost] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<any>(null);

  // SYNC LISTENER (Incoming State)
  useEffect(() => {
    const handleSync = (payload: any) => {
      // Allow any payload to process as long as we were not the immediate sender
      if (!payload || (payload.senderId && payload.senderId === socketManager.getPlayerId()) || (payload.hostId && payload.hostId === socketManager.getPlayerId())) return; 

      // Carefully apply incoming state, ignore local UI preferences
      // We wrap in batch updates by React 18 implicitly, but just to be safe:
      if (payload.playerCount !== undefined) setPlayerCount(payload.playerCount);
      if (payload.playerNames) setPlayerNames(prev => JSON.stringify(prev) !== JSON.stringify(payload.playerNames) ? payload.playerNames : prev);
      if (payload.catastropheMode !== undefined) setCatastropheMode(payload.catastropheMode);
      if (payload.manualCatastropheOverride !== undefined) setManualCatastropheOverride(payload.manualCatastropheOverride);
      if (payload.currentRule !== undefined) setCurrentRule(payload.currentRule);
      if (payload.challengePlayer !== undefined) setChallengePlayer(payload.challengePlayer);
      if (payload.ageDeck) setAgeDeck(prev => JSON.stringify(prev) !== JSON.stringify(payload.ageDeck) ? payload.ageDeck : prev);
      if (payload.currentAgeIndex !== undefined) setCurrentAgeIndex(payload.currentAgeIndex);
      if (payload.normalAgeCount !== undefined) setNormalAgeCount(payload.normalAgeCount);
      if (payload.merchantAgeCount !== undefined) setMerchantAgeCount(payload.merchantAgeCount);
      if (payload.catastropheAgeCount !== undefined) setCatastropheAgeCount(payload.catastropheAgeCount);
      if (payload.finalCatastropheMode !== undefined) setFinalCatastropheMode(payload.finalCatastropheMode);
      if (payload.playerMeanings) setPlayerMeanings(prev => JSON.stringify(prev) !== JSON.stringify(payload.playerMeanings) ? payload.playerMeanings : prev);
      if (payload.selectedMeanings) setSelectedMeanings(prev => JSON.stringify(prev) !== JSON.stringify(payload.selectedMeanings) ? payload.selectedMeanings : prev);
      if (payload.revealedMeanings) setRevealedMeanings(prev => JSON.stringify(prev) !== JSON.stringify(payload.revealedMeanings) ? payload.revealedMeanings : prev);
      if (payload.dominantCardStates) setDominantCardStates(prev => JSON.stringify(prev) !== JSON.stringify(payload.dominantCardStates) ? payload.dominantCardStates : prev);
      if (payload.trinketState) setTrinketState(prev => JSON.stringify(prev) !== JSON.stringify(payload.trinketState) ? payload.trinketState : prev);
      if (payload.pocketedTrinkets) setPocketedTrinkets(prev => JSON.stringify(prev) !== JSON.stringify(payload.pocketedTrinkets) ? payload.pocketedTrinkets : prev);
      if (payload.trinketsPocketedThisTurn) setTrinketsPocketedThisTurn(prev => JSON.stringify(prev) !== JSON.stringify(payload.trinketsPocketedThisTurn) ? payload.trinketsPocketedThisTurn : prev);
      if (payload.catastrophesInDeck) setCatastrophesInDeck(prev => JSON.stringify(prev) !== JSON.stringify(payload.catastrophesInDeck) ? payload.catastrophesInDeck : prev);
      if (payload.showCatastropheList !== undefined) setShowCatastropheList(payload.showCatastropheList);
      if (payload.challengeRolledThisAge !== undefined) setChallengeRolledThisAge(payload.challengeRolledThisAge);
      if (payload.ageMultiplierMode !== undefined) setAgeMultiplierMode(payload.ageMultiplierMode);
      if (payload.manualAgeMultiplier !== undefined) setManualAgeMultiplier(payload.manualAgeMultiplier);
    };

    const handleRoomJoined = (room: any) => {
      setCurrentRoom(room);
      const iAmHost = room.hostId === socketManager.getPlayerId();
      setIsHost(iAmHost);
    };

      const handleRoomLeft = () => {
        setCurrentRoom(null);
        setIsHost(true);
        const savedStateJSON = localStorage.getItem('doomlingsGameState');
        if (savedStateJSON) {
          try {
            const savedState = JSON.parse(savedStateJSON);
            setPlayerCount(parseInt(savedState.playerCount, 10) || 2);
            setPlayerNames(savedState.playerNames || Array(6).fill(''));
            setCatastropheMode(savedState.catastropheMode || false);
            setManualCatastropheOverride(savedState.manualCatastropheOverride || false);
            setCurrentRule(savedState.currentRule || null);
            setChallengePlayer(savedState.challengePlayer || null);
            setAgeDeck(savedState.ageDeck || []);
            setCurrentAgeIndex(savedState.currentAgeIndex || 0);
            setNormalAgeCount(savedState.normalAgeCount || 0);
            setMerchantAgeCount(savedState.merchantAgeCount || 0);
            setCatastropheAgeCount(savedState.catastropheAgeCount || 0);
            setFinalCatastropheMode(savedState.finalCatastropheMode ?? true);
            setPlayerMeanings(savedState.playerMeanings || {});
            setSelectedMeanings(savedState.selectedMeanings || {});
            setRevealedMeanings(savedState.revealedMeanings || {});
            setDominantCardStates(savedState.dominantCardStates || {});

            const loadedTrinketState = savedState.trinketState || {
              deck: savedState.trinketDeck || [],
              playerTrinkets: savedState.playerTrinkets || {}
            };
            setTrinketState(loadedTrinketState);
            setPocketedTrinkets(savedState.pocketedTrinkets || {});
            setTrinketsPocketedThisTurn(savedState.trinketsPocketedThisTurn || {});

            setActiveSection(savedState.activeSection || 'challenges');
            setViewingPlayer(savedState.viewingPlayer || null);
            setInitialTrinketCount(savedState.initialTrinketCount || 0);
            setCatastrophesInDeck(savedState.catastrophesInDeck || []);
            setShowCatastropheList(savedState.showCatastropheList || false);
            setAgeMultiplierMode(savedState.ageMultiplierMode || 'auto');
            setManualAgeMultiplier(savedState.manualAgeMultiplier || 1);
            setChallengeRolledThisAge(savedState.challengeRolledThisAge || false);
          } catch (err) {
            console.error('Failed to parse single player state details', err);
          }
        }
      };

      socketManager.onSyncGameState(handleSync);
      socketManager.onRoomJoined(handleRoomJoined);
      socketManager.onRoomLeft(handleRoomLeft);

      return () => {
        // Keep active to prevent stale references, or handle cleanup carefully mapped
      };
    }, [socketManager]);
  // SYNC PUSH (Outgoing State)
  useEffect(() => {
    // Anyone in the room can sync state changes!
    if (!currentRoom) return;
    if (!isInitialLoadComplete || !isMounted.current) return;

    const syncPayload = {
      senderId: socketManager.getPlayerId(),
      playerCount,
      playerNames,
      catastropheMode,
      manualCatastropheOverride,
      currentRule,
      challengePlayer,
      ageDeck,
      currentAgeIndex,
      normalAgeCount,
      merchantAgeCount,
      catastropheAgeCount,
      finalCatastropheMode,
      playerMeanings,
      selectedMeanings,
      revealedMeanings,
      dominantCardStates,
      trinketState,
      pocketedTrinkets,
      trinketsPocketedThisTurn,
      catastrophesInDeck,
      showCatastropheList,
      challengeRolledThisAge,
      ageMultiplierMode,
      manualAgeMultiplier,
    };

    socketManager.syncGameState(currentRoom.id, syncPayload);
  }, [
    isHost, currentRoom, socketManager, isInitialLoadComplete, // Dependencies for when/who
    playerCount, playerNames, catastropheMode, manualCatastropheOverride,
    currentRule, challengePlayer, ageDeck, currentAgeIndex, normalAgeCount,
    merchantAgeCount, catastropheAgeCount, finalCatastropheMode, playerMeanings,
    selectedMeanings, revealedMeanings, dominantCardStates, trinketState,
    pocketedTrinkets, trinketsPocketedThisTurn, catastrophesInDeck,
    showCatastropheList, challengeRolledThisAge, ageMultiplierMode, manualAgeMultiplier
  ]);

  // GAME STATE PERSISTENCE
  useEffect(() => {
    if (!isInitialLoadComplete || !isMounted.current) {
      return;
    }

    // Do NOT overwrite local app save data if we are visiting someone else's room.
    // If you are the host, you are using your local save data.
    if (currentRoom && (!isHost || currentRoom.hostId !== socketManager.getPlayerId())) {
      return;
    }

    const saveGameState = () => {
      const gameState = {
        playerCount,
        playerNames,
        catastropheMode,
        manualCatastropheOverride,
        currentRule,
        challengePlayer,
        ageDeck,
        currentAgeIndex,
        normalAgeCount,
        merchantAgeCount,
        catastropheAgeCount,
        finalCatastropheMode,
        playerMeanings,
        selectedMeanings,
        revealedMeanings,
        dominantCardStates,
        trinketState,
        pocketedTrinkets,
        trinketsPocketedThisTurn,
        activeSection,
        viewingPlayer,
        initialTrinketCount,
        catastrophesInDeck,
        showCatastropheList,
        ageMultiplierMode,
        manualAgeMultiplier,
        challengeRolledThisAge,
      };
      localStorage.setItem('doomlingsGameState', JSON.stringify(gameState));
    };

    saveGameState();
  }, [
    playerCount,
    playerNames,
    catastropheMode,
    manualCatastropheOverride,
    currentRule,
    challengePlayer,
    ageDeck,
    currentAgeIndex,
    normalAgeCount,
    merchantAgeCount,
    catastropheAgeCount,
    finalCatastropheMode,
    playerMeanings,
    selectedMeanings,
    revealedMeanings,
    dominantCardStates,
    trinketState,
    pocketedTrinkets,
    activeSection,
    viewingPlayer,
    initialTrinketCount,
    catastrophesInDeck,
    showCatastropheList,
    ageMultiplierMode,
    manualAgeMultiplier,
    challengeRolledThisAge,
    isInitialLoadComplete,
  ]);

  useEffect(() => {
    isMounted.current = true;
    setIsInitialLoadComplete(false); // Reset flag on refresh
    // Load game state on initial mount
    const loadGameState = () => {
      const savedStateJSON = localStorage.getItem('doomlingsGameState');
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        setPlayerCount(parseInt(savedState.playerCount, 10) || 2);
        setPlayerNames(savedState.playerNames || Array(6).fill(''));
        setCatastropheMode(savedState.catastropheMode || false);
        setManualCatastropheOverride(savedState.manualCatastropheOverride || false);
        setCurrentRule(savedState.currentRule || null);
        setChallengePlayer(savedState.challengePlayer || null);
        setAgeDeck(savedState.ageDeck || []);
        setCurrentAgeIndex(savedState.currentAgeIndex || 0);
        setNormalAgeCount(savedState.normalAgeCount || 0);
        setMerchantAgeCount(savedState.merchantAgeCount || 0);
        setCatastropheAgeCount(savedState.catastropheAgeCount || 0);
        setFinalCatastropheMode(savedState.finalCatastropheMode ?? true);
        setPlayerMeanings(savedState.playerMeanings || {});
        setSelectedMeanings(savedState.selectedMeanings || {});
        setRevealedMeanings(savedState.revealedMeanings || {});
        setDominantCardStates(savedState.dominantCardStates || {});

        const loadedTrinketState = savedState.trinketState || {
          deck: savedState.trinketDeck || [],
          playerTrinkets: savedState.playerTrinkets || {}
        };
        setTrinketState(loadedTrinketState);
        setPocketedTrinkets(savedState.pocketedTrinkets || {});
        setTrinketsPocketedThisTurn(savedState.trinketsPocketedThisTurn || {});

        setActiveSection(savedState.activeSection || 'challenges');
        setViewingPlayer(savedState.viewingPlayer || null);
        setInitialTrinketCount(savedState.initialTrinketCount || 0);
        setCatastrophesInDeck(savedState.catastrophesInDeck || []);
        setShowCatastropheList(savedState.showCatastropheList || false);
        setAgeMultiplierMode(savedState.ageMultiplierMode || 'auto');
        setManualAgeMultiplier(savedState.manualAgeMultiplier || 1);
        setChallengeRolledThisAge(savedState.challengeRolledThisAge || false);

        // Load Game Preferences
        const savedShowScrollToTop = localStorage.getItem('showScrollToTop');
        if (savedShowScrollToTop !== null) {
          setShowScrollToTop(savedShowScrollToTop === 'true');
        }
        const savedWarnUnpocketedTrinkets = localStorage.getItem('warnUnpocketedTrinkets');
        if (savedWarnUnpocketedTrinkets !== null) {
          setWarnUnpocketedTrinkets(savedWarnUnpocketedTrinkets === 'true');
        }
      }
    };
    loadGameState();

    // Load static game data from JSON files
    const loadJson = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      return response.json();
    };
    const loadAllData = async () => {
      try {
        const [
          normalRulesData, catastropheRulesData, dominantData, ageData,
          merchantAgeData, catastropheData, meaningOfLifeData, trinketData
        ] = await Promise.all([
          loadJson('/data/normalRules.json'), loadJson('/data/catastropheRules.json'),
          loadJson('/data/dominantData.json'), loadJson('/data/ageData.json'),
          loadJson('/data/merchantAgeData.json'), loadJson('/data/catastropheData.json'),
          loadJson('/data/meaningOfLifeData.json'), loadJson('/data/trinketData.json')
        ]);

        const parseRules = (data: any, titlePrefix: string): Rule[] => {
          if (Array.isArray(data)) {
            return data.map((ruleString, index) => {
              const parts = ruleString.split(':');
              const title = parts.length > 1 ? parts[0] : `${titlePrefix} ${index + 1}`;
              const description = parts.length > 1 ? parts.slice(1).join(':').trim() : ruleString;
              return { title, description };
            });
          }
          return [];
        };

        setRules(parseRules(normalRulesData, 'Rule'));
        setCatastropheRules(parseRules(catastropheRulesData, 'Catastrophe Rule'));
        setAllDominants(dominantData || []);
        setNormalAges(ageData || []);
        setMerchantAges(merchantAgeData || []);
        setCatastropheAges(catastropheData || []);
        setMeaningOfLife(meaningOfLifeData || []);
        setTrinkets(trinketData || []);
        setInitialTrinketCount(trinketData.length || 0);
        setError(null);
      } catch (err) {
        console.error("Failed to load game data:", err);
        if (err instanceof Error) {
          setError(`Failed to load essential game data: ${err.message}. Please try refreshing the page.`);
        } else {
          setError("An unknown error occurred while loading data. Please try refreshing the page.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData().then(() => {
      setIsInitialLoadComplete(true);
    });

    // Auto-start tutorial on first visit
    const tutorialSeen = localStorage.getItem('doomlingsTutorialSeen');
    if (!tutorialSeen) {
      setTimeout(() => setTutorialStep(0), 600);
    }

    return () => {
      isMounted.current = false;
    }
  }, []);

  // Suppress ads when tutorial is open
  useEffect(() => {
    setAdsSuppressed(tutorialStep !== null);
  }, [tutorialStep, setAdsSuppressed]);



  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = name;
    setPlayerNames(newPlayerNames);
  };

  const handlePlayerCountChange = (newCount: number) => {
    if (newCount < playerCount) {
      const removedPlayerNames = playerNames.slice(newCount, playerCount);
      const hasNamedPlayers = removedPlayerNames.some(name => name.trim() !== '');

      const performUpdate = () => {
        const newPlayerNames = [...playerNames];
        for (let i = newCount; i < playerCount; i++) {
          newPlayerNames[i] = '';
        }
        setPlayerNames(newPlayerNames);
        setPlayerCount(newCount);
      };

      if (hasNamedPlayers) {
        if (window.confirm('Reducing the player count will remove players with names. Are you sure?')) {
          performUpdate();
        }
      } else {
        performUpdate();
      }
    } else {
      setPlayerCount(newCount);
    }
  };

  const showSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'gameTurn' && !challengeRolledThisAge && ageDeck.length > 0) {
      rollNewAge();
    }
  };

  const startTutorial = () => {
    setTutorialStep(0);
    setActiveSection('challenges');
  };

  const handleTutorialNext = () => {
    if (tutorialStep === null) return;
    const nextStep = tutorialStep + 1;
    if (nextStep >= TUTORIAL_STEPS.length) {
      // Tutorial finished
      localStorage.setItem('doomlingsTutorialSeen', '1');
      setTutorialStep(null);
      return;
    }
    const step = TUTORIAL_STEPS[nextStep];
    if (step.section) {
      setActiveSection(step.section);
    }
    setTutorialStep(nextStep);
  };

  const handleTutorialBack = () => {
    if (tutorialStep === null || tutorialStep <= 0) return;
    const prevStep = tutorialStep - 1;
    const step = TUTORIAL_STEPS[prevStep];
    if (step.section) {
      setActiveSection(step.section);
    }
    setTutorialStep(prevStep);
  };

  const handleTutorialSkip = () => {
    localStorage.setItem('doomlingsTutorialSeen', '1');
    setTutorialStep(null);
  };

  const rollNewAge = (forceCatastropheMode?: boolean) => {
    const isCatastrophe = forceCatastropheMode !== undefined ? forceCatastropheMode : catastropheMode;
    const rulesToUse = isCatastrophe ? catastropheRules : rules;
    if (rulesToUse.length > 0) {
      const randomIndex = Math.floor(Math.random() * rulesToUse.length);
      setCurrentRule(rulesToUse[randomIndex]);
    }

    const activePlayers = playerNames.slice(0, playerCount).filter(name => name.trim() !== '');
    if (activePlayers.length > 0) {
      const randomPlayerIndex = Math.floor(Math.random() * activePlayers.length);
      setChallengePlayer(activePlayers[randomPlayerIndex]);
    } else {
      setChallengePlayer(null);
    }
    setChallengeRolledThisAge(true);
  };

  const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const generateAgeDeck = () => {
    if (ageDeck.length > 0) {
      if (!window.confirm('A deck already exists. Are you sure you want to generate a new one?')) {
        return;
      }
    }

    let deck: Age[] = [];
    let birthOfLifeAdded = false;

    // Find Birth of Life card (exact name match)
    const birthOfLife = normalAges.find(age => age.name === 'The Birth of Life');
    let availableNormalAges = normalAges.filter(age => age.name !== 'The Birth of Life');

    // Add Birth of Life FIRST if it exists and we want at least 1 normal age
    if (birthOfLife && normalAgeCount > 0) {
      deck.push(birthOfLife);
      birthOfLifeAdded = true;

      // Add remaining normal ages (one less since Birth of Life is already added)
      if (normalAgeCount > 1) {
        const shuffledNormalAges = shuffleArray([...availableNormalAges]);
        deck.push(...shuffledNormalAges.slice(0, normalAgeCount - 1));
      }
    } else if (normalAgeCount > 0) {
      // If no Birth of Life found but we want normal ages, add them normally
      const shuffledNormalAges = shuffleArray([...normalAges]);
      deck.push(...shuffledNormalAges.slice(0, normalAgeCount));
    }

    // Add merchant ages (shuffled)
    if (merchantAgeCount > 0) {
      const shuffledMerchantAges = shuffleArray([...merchantAges]);
      deck.push(...shuffledMerchantAges.slice(0, merchantAgeCount));
    }

    // Handle catastrophe ages
    let catastropheSelection: Age[] = [];
    let allCatastrophesInDeck: Age[] = [];

    if (catastropheAgeCount > 0) {
      catastropheSelection = shuffleArray([...catastropheAges]).slice(0, catastropheAgeCount);
      allCatastrophesInDeck = [...catastropheSelection]; // Keep original list for tracking
    }

    if (finalCatastropheMode && catastropheSelection.length > 0) {
      // Reserve the last catastrophe for the end
      const finalCatastrophe = catastropheSelection.pop();

      // Add non-final catastrophes to the middle
      if (catastropheSelection.length > 0) {
        deck.push(...catastropheSelection);
      }

      // Shuffle middle part (everything except Birth of Life if present, and final catastrophe)
      if (birthOfLifeAdded) {
        // Birth of Life stays first, shuffle the rest
        const deckToShuffle = deck.slice(1); // Skip Birth of Life at position 0
        const shuffledMiddle = shuffleArray(deckToShuffle);
        deck = [birthOfLife, ...shuffledMiddle];
      } else {
        // No Birth of Life, shuffle everything
        deck = shuffleArray(deck);
      }

      // Add final catastrophe at the end
      if (finalCatastrophe) {
        deck.push(finalCatastrophe);
      }
    } else {
      // No final catastrophe mode, add all catastrophes and shuffle
      if (catastropheSelection.length > 0) {
        deck.push(...catastropheSelection);
      }

      // Shuffle everything except Birth of Life if it's first
      if (birthOfLifeAdded) {
        const deckToShuffle = deck.slice(1); // Skip Birth of Life at position 0
        const shuffledMiddle = shuffleArray(deckToShuffle);
        deck = [birthOfLife, ...shuffledMiddle];
      } else {
        // No Birth of Life, shuffle everything
        deck = shuffleArray(deck);
      }
    }

    setCatastrophesInDeck(allCatastrophesInDeck);
    setAgeDeck(deck);
    setCurrentAgeIndex(0);
    setShowCatastropheList(false);

    // Automatically roll a challenge for the first age
    const firstAgeIsCatastrophe = catastropheSelection.some(c => c.name === deck[0].name);
    setCatastropheMode(firstAgeIsCatastrophe);
    rollNewAge(firstAgeIsCatastrophe);

    // Log for debugging (can be removed in production)
    console.log('Generated Age Deck:', deck.map(age => age.name));
    if (birthOfLifeAdded) {
      console.log('Birth of Life is at position:', deck.findIndex(age => age.name === 'The Birth of Life'));
    }
  };

  const nextAge = () => setCurrentAgeIndex(i => Math.min(i + 1, ageDeck.length - 1));
  const previousAge = () => setCurrentAgeIndex(i => Math.max(i - 1, 0));

  const executeNextTurn = () => {
    // Clear manual override when advancing to next age (allow auto-toggle again)
    setManualCatastropheOverride(false);

    // Determine info about the NEXT age to sync rules correctly
    const nextIndex = Math.min(currentAgeIndex + 1, ageDeck.length - 1);
    const nextAgeCard = ageDeck[nextIndex];
    const willBeCatastrophe = catastropheAges.some(c => c.name === nextAgeCard?.name);

    setCatastropheMode(willBeCatastrophe);

    // Roll new challenge using the next turn's catastrophe mode
    rollNewAge(willBeCatastrophe);

    // Advance to next age
    setCurrentAgeIndex(nextIndex);

    // Reset trinkets pocketed this turn
    setTrinketsPocketedThisTurn({});
    setShowWarningModal(false);
    setPendingNextTurn(false);
  };

  const handleNextTurn = () => {
    if (warnUnpocketedTrinkets) {
      // Check if anyone has a trinket in hand but hasn't pocketed yet this turn
      const playersNeedingAction = playerNames.slice(0, playerCount).filter(name => {
        const pName = name.trim();
        if (!pName) return false;
        const currentTrinkets = trinketState.playerTrinkets[pName] || [];
        const hasTrinketInHand = currentTrinkets.length > 0;
        const hasPocketedThisTurn = trinketsPocketedThisTurn[pName];
        return hasTrinketInHand && !hasPocketedThisTurn;
      });

      if (playersNeedingAction.length > 0) {
        setPendingNextTurn(true);
        setShowWarningModal(true);

        // Smooth scroll to trinkets
        const trinketsSection = document.getElementById('trinkets-section');
        if (trinketsSection) {
          trinketsSection.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }
    }

    executeNextTurn();
  };

  const handleManualCatastropheToggle = (checked: boolean) => {
    setCatastropheMode(checked);

    // Check if the new state matches what the auto-detection would set
    // If it matches, we don't need the override anymore
    const shouldBeCatastropheMode = currentAge ? catastropheAges.some(c => c.name === currentAge.name) : false;

    if (checked === shouldBeCatastropheMode) {
      setManualCatastropheOverride(false);
    } else {
      setManualCatastropheOverride(true);
    }
  };

  const assignMeaningCards = () => {
    if (Object.keys(playerMeanings).length > 0) {
      if (!window.confirm('Meaning of Life cards have already been assigned. Are you sure you want to reassign them?')) {
        return;
      }
    }
    const sM = calculateScalingMultiplier();
    const processedCards = meaningOfLife.map(card => ({
      ...card,
      description: processDescription(card.description, sM)
    }));

    const shuffledMeanings = shuffleArray(processedCards);
    const newPlayerMeanings: { [key: string]: Meaning[] } = {};
    playerNames.slice(0, playerCount).forEach(name => {
      if (name) newPlayerMeanings[name] = shuffledMeanings.splice(0, 2);
    });
    setPlayerMeanings(newPlayerMeanings);
    setSelectedMeanings({});
    setRevealedMeanings({});
  };

  const handleChooseMeaning = (playerName: string, cardName: string) => {
    if (revealedMeanings[playerName]) return; // Prevent changes after reveal
    setSelectedMeanings(prev => ({ ...prev, [playerName]: cardName }));
    setViewingPlayer(null); // Auto-hide after selection
  };

  const revealAllMeaningCards = () => {
    setRevealedMeanings(Object.keys(playerMeanings).reduce((acc, name) => ({ ...acc, [name]: true }), {}));
  };

  const resetMeaningCards = () => {
    setPlayerMeanings({});
    setSelectedMeanings({});
    setRevealedMeanings({});
    setViewingPlayer(null);
  };

  const assignTrinkets = () => {
    if (Object.keys(trinketState.playerTrinkets).length > 0) {
      if (!window.confirm('Trinkets have already been assigned. Are you sure you want to reassign them?')) {
        return;
      }
    }

    const newShuffledDeck = shuffleArray([...trinkets]);
    const newPlayerTrinkets: { [key: string]: Trinket[] } = {};
    let deckCopy = [...newShuffledDeck];

    playerNames.slice(0, playerCount).forEach(name => {
      if (name) {
        newPlayerTrinkets[name] = deckCopy.splice(0, 2);
      }
    });

    const nextState = { deck: deckCopy, playerTrinkets: newPlayerTrinkets };
    setTrinketState(nextState);
    setPocketedTrinkets(playerNames.slice(0, playerCount).reduce((acc, name) => ({ ...acc, [name]: [] }), {}));
  };

  const drawTrinkets = (deck: Trinket[], count: number): { drawn: Trinket[], remaining: Trinket[] } => {
    const drawn = deck.slice(0, count);
    const remaining = deck.slice(count);
    return { drawn, remaining };
  };

  const handleTrinketAdd = (playerName: string, trinketToAdd: Trinket) => {
    setTrinketState(currentState => {
      const currentHand = currentState.playerTrinkets[playerName] || [];
      const currentDeck = currentState.deck;

      if (currentHand.length === 2) {
        const trinketToDiscard = currentHand.find(t => t.name !== trinketToAdd.name);
        if (!trinketToDiscard) return currentState;

        const nextState = {
          playerTrinkets: { ...currentState.playerTrinkets, [playerName]: [trinketToAdd] },
          deck: [...currentDeck, trinketToDiscard]
        };
        return nextState;
      } else if (currentHand.length === 1) {
        if (currentDeck.length === 0) return currentState;

        const { drawn, remaining } = drawTrinkets(currentDeck, 1);
        const nextState = {
          playerTrinkets: { ...currentState.playerTrinkets, [playerName]: [...currentHand, ...drawn] },
          deck: remaining
        };
        return nextState;
      }
      return currentState;
    });
  };

  const handleTrinketRemove = (playerName: string, trinketToRemove: Trinket) => {
    setTrinketState(currentState => {
      const currentHand = currentState.playerTrinkets[playerName] || [];
      const currentDeck = currentState.deck;

      const nextHand = currentHand.filter(t => t.name !== trinketToRemove.name);
      const nextDeck = [...currentDeck, trinketToRemove];

      if (nextHand.length === 0) {
        if (nextDeck.length === 0) {
          const nextState = {
            ...currentState,
            playerTrinkets: { ...currentState.playerTrinkets, [playerName]: [] }
          };
          return nextState;
        }
        const { drawn, remaining } = drawTrinkets(nextDeck, 1);
        const nextState = {
          playerTrinkets: { ...currentState.playerTrinkets, [playerName]: drawn },
          deck: remaining
        };
        return nextState;
      } else {
        const nextState = {
          playerTrinkets: { ...currentState.playerTrinkets, [playerName]: nextHand },
          deck: nextDeck
        };
        return nextState;
      }
    });
  };

  const handleTrinketPocket = (playerName: string, trinketToPocket: Trinket) => {
    setTrinketsPocketedThisTurn(prev => ({ ...prev, [playerName]: true }));
    setPocketedTrinkets(prev => ({
      ...prev,
      [playerName]: [...(prev[playerName] || []), trinketToPocket]
    }));

    setTrinketState(currentState => {
      const currentHand = currentState.playerTrinkets[playerName] || [];
      const currentDeck = currentState.deck;

      const nextHand = currentHand.filter(t => t.name !== trinketToPocket.name);

      if (nextHand.length === 0) {
        if (currentDeck.length === 0) {
          const nextState = { ...currentState, playerTrinkets: { ...currentState.playerTrinkets, [playerName]: [] } };
          return nextState;
        }
        const { drawn, remaining } = drawTrinkets(currentDeck, 1);
        const nextState = {
          playerTrinkets: { ...currentState.playerTrinkets, [playerName]: drawn },
          deck: remaining
        };
        return nextState;
      } else {
        const nextState = { ...currentState, playerTrinkets: { ...currentState.playerTrinkets, [playerName]: nextHand } };
        return nextState;
      }
    });
  };

  const worldsEndTrinketButton = () => {
    // Placeholder for score calculation logic
    alert("Score calculation not implemented yet.");
  }

  const calculateScalingMultiplier = () => {
    if (ageMultiplierMode === 'manual') {
      return Math.min(Math.max(manualAgeMultiplier, 1), 10); // Constrain between 1x and 10x
    }

    const totalAges = normalAgeCount + merchantAgeCount + catastropheAgeCount;
    // Auto mode: (total ages / 20), constrained between 1x and 10x
    const autoSM = Math.max(1, totalAges / 20);
    return Math.min(autoSM, 10);
  };

  const processDescription = (description: string, sM: number) => {
    return description
      .replace(/(\d+)\*?sM/g, (_, num) => Math.round(parseInt(num) * sM).toString())
      .replace(/sM\*?(\d+)/g, (_, num) => Math.round(parseInt(num) * sM).toString())
      .replace(/\bsM\b/g, Math.round(sM).toString());
  };

  const handleDominantCardChange = (cardName: string, change: Partial<DominantCardState>) => {
    setDominantCardStates(prev => ({
      ...prev,
      [cardName]: {
        ...prev[cardName] || { assignedTo: 'Assign', selectedTier: null },
        ...change,
      }
    }));
  };

  const currentAge = ageDeck.length > 0 ? ageDeck[currentAgeIndex] : null;
  const isCatastrophe = currentAge ? catastropheAges.some(c => c.name === currentAge.name) : false;

  // Effect to auto-toggle catastrophe mode based on current age (only if no manual override)
  useEffect(() => {
    if (currentAge && !manualCatastropheOverride) {
      const shouldBeCatastropheMode = catastropheAges.some(c => c.name === currentAge.name);
      if (shouldBeCatastropheMode !== catastropheMode) {
        setCatastropheMode(shouldBeCatastropheMode);
      }
    }
  }, [currentAge, catastropheAges, catastropheMode, manualCatastropheOverride]);

  const handleToggleViewPlayer = (playerName: string) => {
    setViewingPlayer(current => (current === playerName ? null : playerName));
  };

  const resetAllDominants = () => {
    if (window.confirm('Are you sure you want to reset all dominant card assignments and tiers?')) {
      setDominantCardStates({});

      // Also clear all duplicate cards from localStorage
      allDominants.forEach(dominant => {
        localStorage.removeItem(`dominant-copies-${dominant.name}`);
      });

      // Force DominantCard components to refresh by updating trigger
      setDominantResetTrigger(prev => prev + 1);
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', paddingTop: '50px', fontSize: '1.2rem' }}>Loading Game Data...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', paddingTop: '50px', fontSize: '1.2rem' }}>Error: {error}</div>;
  }

  return (
    <>
      <div className="gradient-overlay"></div>
      <div className="blue-glow-container">
        <div className="blue-circles">{Array(5).fill(0).map((_, i) => <div key={i} className="blue-circle"></div>)}</div>
      </div>
      <div className="container">
        <div className="nav">
          <button id="nav-challenges" className="nav-button" onClick={() => showSection('challenges')}>Challenges</button>
          <button id="nav-dominants" className="nav-button" onClick={() => showSection('dominants')}>Dominants</button>
          <button id="nav-age-setup" className="nav-button" onClick={() => showSection('ageSetup')}>Age Setup</button>
          <button id="nav-mol" className="nav-button" onClick={() => showSection('meaningOfLife')}>Meaning of Life</button>
          <button id="nav-trinkets" className="nav-button" onClick={() => showSection('trinkets')}>Trinkets</button>
          <button id="nav-multiplayer" className="nav-button" onClick={() => showSection('multiplayer')}>Multiplayer</button>
          <button id="nav-game-turn" className="nav-button game-turn-button" onClick={() => showSection('gameTurn')}>Game Turn</button>
          <button className="tutorial-nav-btn" onClick={startTutorial}>❓ Tutorial</button>
        </div>

        {/* Sections */}
        {activeSection === 'multiplayer' && (
          <div className="full-height-section" style={{ display: 'block' }}>
            <MultiplayerTab playerNames={playerNames.filter(name => name.trim() !== '')} playerCount={playerCount} />
          </div>
        )}

        {activeSection === 'gameTurn' && (
          <GameTurn
            playerCount={playerCount}
            playerNames={playerNames}
            currentRule={currentRule}
            challengePlayer={challengePlayer}
            currentAge={currentAge}
            isCatastrophe={isCatastrophe}
            isLastAge={currentAgeIndex === ageDeck.length - 1}
            trinketState={trinketState}
            pocketedTrinkets={pocketedTrinkets}
            trinketsPocketedThisTurn={trinketsPocketedThisTurn}
            onNextTurn={handleNextTurn}
            handleTrinketAdd={handleTrinketAdd}
            handleTrinketRemove={handleTrinketRemove}
            handleTrinketPocket={handleTrinketPocket}
            catastropheMode={catastropheMode}
          />
        )}

        <div className="full-height-section" style={{ display: activeSection === 'challenges' ? 'block' : 'none' }}>
          <h1 className="section-title">Challenges</h1>
          <div id="player-name-section" className="player-control box">
            <div className="field">
              <label className="label">Players: {playerCount}</label>
              <input type="range" className="slider" min="2" max="6" value={playerCount} onChange={(e) => handlePlayerCountChange(parseInt(e.target.value, 10))} />
            </div>
            <div className="field">
              <div className={`catastrophe-toggle-container ${catastropheMode ? 'active' : ''}`}>
                <span className="catastrophe-toggle-label">
                  🔥 Catastrophe Mode {catastropheMode ? '(ACTIVE)' : ''}
                </span>
                <label className="catastrophe-toggle">
                  <input
                    type="checkbox"
                    checked={catastropheMode}
                    onChange={(e) => handleManualCatastropheToggle(e.target.checked)}
                  />
                  <span className="catastrophe-slider"></span>
                </label>
              </div>
              {currentAge && isCatastrophe && !manualCatastropheOverride && (
                <div className="catastrophe-auto-notice">
                  ⚡ Auto-enabled due to current Catastrophe Age
                </div>
              )}
              {manualCatastropheOverride && (
                <div className="catastrophe-auto-notice">
                  🎛️ Manual Override Active (resets on next turn)
                </div>
              )}
            </div>
            <div className="field">
              {Array.from({ length: playerCount }).map((_, index) => (
                <input key={index} type="text" placeholder={`Player ${index + 1} Name`} className="input name-input" value={playerNames[index]} onChange={(e) => handlePlayerNameChange(index, e.target.value)} />
              ))}
            </div>
          </div>
          <div className="age-config box">
            <h2 className="title is-4">Challenges</h2>
            <div className="field">
              <AnimatedButton
                id="roll-challenge-btn"
                className="is-primary is-fullwidth"
                onClick={() => rollNewAge()}
              >
                Roll New Challenge
              </AnimatedButton>
            </div>
            <div className={`age-display mt-4 has-text-centered ${catastropheMode ? 'catastrophe-mode' : ''}`}>
              {currentRule && (
                <div className={`rule-display ${catastropheMode ? 'catastrophe-mode' : ''}`}>
                  {challengePlayer && (
                    <h3 className="challenge-player-title">For: {challengePlayer}</h3>
                  )}
                  <h4>{currentRule.title}</h4>
                  <p>{currentRule.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeSection === 'dominants' && (() => {
          const processedDominants = allDominants
            .slice()
            .sort((a, b) => {
              const aIsAssigned = (dominantCardStates[a.name]?.assignedTo || 'Assign') !== 'Assign';
              const bIsAssigned = (dominantCardStates[b.name]?.assignedTo || 'Assign') !== 'Assign';

              // First priority: assigned cards go to top
              if (aIsAssigned && !bIsAssigned) return -1;
              if (!aIsAssigned && bIsAssigned) return 1;

              // Second priority: alphabetical order within each group
              return a.name.localeCompare(b.name);
            })
            .filter(dominant => {
              const searchTerm = dominantSearchTerm.toLowerCase();
              if (!searchTerm) return true;

              // Check main card assignment
              const assignedPlayer = dominantCardStates[dominant.name]?.assignedTo || '';

              // Check duplicate card assignments from localStorage
              let duplicateMatches = false;
              try {
                const savedCopies = localStorage.getItem(`dominant-copies-${dominant.name}`);
                if (savedCopies) {
                  const cardCopies = JSON.parse(savedCopies);
                  duplicateMatches = cardCopies.some((copy: any) =>
                    copy.assignedTo &&
                    copy.assignedTo !== 'Assign' &&
                    copy.assignedTo.toLowerCase().includes(searchTerm)
                  );
                }
              } catch (error) {
                // Ignore localStorage errors
              }

              return (
                dominant.name.toLowerCase().includes(searchTerm) ||
                (assignedPlayer !== 'Assign' && assignedPlayer.toLowerCase().includes(searchTerm)) ||
                duplicateMatches
              );
            });

          return (
            <div id="dominants" className="section-content">
              <h2 className="section-title">Dominants</h2>
              <div className="player-control box">
                <AnimatedButton
                  className="is-danger is-fullwidth"
                  onClick={resetAllDominants}
                >
                  Reset All Dominants
                </AnimatedButton>
                <div className="field mt-4">
                  <input
                    type="text"
                    className="input"
                    placeholder="Search Dominants or Players..."
                    value={dominantSearchTerm}
                    onChange={(e) => setDominantSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="card-grid">
                {processedDominants.map((dominant, index) => {
                  const cardState = dominantCardStates[dominant.name] || { assignedTo: 'Assign', selectedTier: null };
                  return (
                    <DominantCard
                      key={`${dominant.name}-${index}`}
                      dominant={dominant}
                      players={playerNames.slice(0, playerCount).filter(name => name.trim() !== '')}
                      assignedTo={cardState.assignedTo}
                      selectedTier={cardState.selectedTier}
                      searchTerm={dominantSearchTerm}
                      resetTrigger={dominantResetTrigger}
                      onChange={(change) => handleDominantCardChange(dominant.name, change)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })()}

        <div className="full-height-section" style={{ display: activeSection === 'ageSetup' ? 'block' : 'none' }}>
          <h2 className="section-title">Age Deck Setup</h2>
          <div className="age-config box">
            <div id="normal-age-slider" className="field">
              <label className="label">Normal Ages: {normalAgeCount}</label>
              {normalAgeCount > 0 && normalAges.some(age => age.name === 'The Birth of Life') && (
                <div className="birth-of-life-notice">
                  ✨ "The Birth of Life" will be the first age
                </div>
              )}
              <div className="age-input-container">
                <input type="range" className="slider" min="0" max={normalAges.length} value={normalAgeCount} onChange={(e) => setNormalAgeCount(parseInt(e.target.value, 10))} />
                <div className="age-number-wrapper">
                  <input
                    type="number"
                    className="age-number-input"
                    min="0"
                    max={normalAges.length}
                    value={normalAgeCount}
                    onChange={(e) => setNormalAgeCount(Math.min(Math.max(0, parseInt(e.target.value, 10) || 0), normalAges.length))}
                  />
                  <div className="age-spinner-buttons">
                    <button
                      type="button"
                      className="age-spinner-btn age-spinner-up"
                      onClick={() => setNormalAgeCount(Math.min(normalAgeCount + 1, normalAges.length))}
                      disabled={normalAgeCount >= normalAges.length}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="age-spinner-btn age-spinner-down"
                      onClick={() => setNormalAgeCount(Math.max(normalAgeCount - 1, 0))}
                      disabled={normalAgeCount <= 0}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div id="merchant-age-slider" className="field">
              <label className="label">Merchant Ages: {merchantAgeCount}</label>
              <div className="age-input-container">
                <input type="range" className="slider" min="0" max={merchantAges.length} value={merchantAgeCount} onChange={(e) => setMerchantAgeCount(parseInt(e.target.value, 10))} />
                <div className="age-number-wrapper">
                  <input
                    type="number"
                    className="age-number-input"
                    min="0"
                    max={merchantAges.length}
                    value={merchantAgeCount}
                    onChange={(e) => setMerchantAgeCount(Math.min(Math.max(0, parseInt(e.target.value, 10) || 0), merchantAges.length))}
                  />
                  <div className="age-spinner-buttons">
                    <button
                      type="button"
                      className="age-spinner-btn age-spinner-up"
                      onClick={() => setMerchantAgeCount(Math.min(merchantAgeCount + 1, merchantAges.length))}
                      disabled={merchantAgeCount >= merchantAges.length}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="age-spinner-btn age-spinner-down"
                      onClick={() => setMerchantAgeCount(Math.max(merchantAgeCount - 1, 0))}
                      disabled={merchantAgeCount <= 0}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div id="catastrophe-age-slider" className="field">
              <label className="label">Catastrophe Ages: {catastropheAgeCount}</label>
              <div className="age-input-container">
                <input type="range" className="slider" min="0" max={catastropheAges.length} value={catastropheAgeCount} onChange={(e) => setCatastropheAgeCount(parseInt(e.target.value, 10))} />
                <div className="age-number-wrapper">
                  <input
                    type="number"
                    className="age-number-input"
                    min="0"
                    max={catastropheAges.length}
                    value={catastropheAgeCount}
                    onChange={(e) => setCatastropheAgeCount(Math.min(Math.max(0, parseInt(e.target.value, 10) || 0), catastropheAges.length))}
                  />
                  <div className="age-spinner-buttons">
                    <button
                      type="button"
                      className="age-spinner-btn age-spinner-up"
                      onClick={() => setCatastropheAgeCount(Math.min(catastropheAgeCount + 1, catastropheAges.length))}
                      disabled={catastropheAgeCount >= catastropheAges.length}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="age-spinner-btn age-spinner-down"
                      onClick={() => setCatastropheAgeCount(Math.max(catastropheAgeCount - 1, 0))}
                      disabled={catastropheAgeCount <= 0}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="field">
              <div className="catastrophe-toggle-container">
                <span className="catastrophe-toggle-label">Final Catastrophe at End</span>
                <label className="catastrophe-toggle">
                  <input
                    type="checkbox"
                    checked={finalCatastropheMode}
                    onChange={(e) => setFinalCatastropheMode(e.target.checked)}
                  />
                  <span className="catastrophe-slider"></span>
                </label>
              </div>
            </div>

            {/* Age Multiplier Section */}
            <div id="sm-multiplier-section" className="field mt-4">
              <label className="label">Meaning of Life Scaling Multiplier (sM): {calculateScalingMultiplier().toFixed(1)}x</label>
              <div className="age-multiplier-container">
                <div className="multiplier-mode-selector">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="multiplierMode"
                      value="auto"
                      checked={ageMultiplierMode === 'auto'}
                      onChange={(e) => setAgeMultiplierMode('auto')}
                    />
                    <span className="radio-label">Auto (based on {normalAgeCount + merchantAgeCount + catastropheAgeCount}/20 ages)</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="multiplierMode"
                      value="manual"
                      checked={ageMultiplierMode === 'manual'}
                      onChange={(e) => setAgeMultiplierMode('manual')}
                    />
                    <span className="radio-label">Manual Control</span>
                  </label>
                </div>

                {ageMultiplierMode === 'manual' && (
                  <div className="multiplier-slider-container">
                    <div className="slider-label-container">
                      <span className="slider-label">1x</span>
                      <span className="slider-current-value">{manualAgeMultiplier.toFixed(1)}x</span>
                      <span className="slider-label">10x</span>
                    </div>
                    <input
                      type="range"
                      className="multiplier-slider"
                      min="1"
                      max="10"
                      step="0.1"
                      value={manualAgeMultiplier}
                      onChange={(e) => setManualAgeMultiplier(parseFloat(e.target.value))}
                    />
                    <div className="multiplier-info">
                      <span className="multiplier-description">
                        Controls how much sM values are scaled in Meaning of Life cards
                      </span>
                    </div>
                  </div>
                )}

                {ageMultiplierMode === 'auto' && (
                  <div className="auto-multiplier-info">
                    <div className="auto-info-content">
                      <span className="auto-description">
                        Automatically calculated as: Total Ages ÷ 20 = {((normalAgeCount + merchantAgeCount + catastropheAgeCount) / 20).toFixed(1)}x
                      </span>
                      <span className="auto-constraint">
                        (Constrained between 1x - 10x)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <AnimatedButton id="generate-deck-btn" className="is-primary is-fullwidth mt-4" onClick={generateAgeDeck}>Generate Age Deck</AnimatedButton>
            {catastrophesInDeck.length > 0 && (
              <AnimatedButton
                className="is-info is-fullwidth mt-2"
                onClick={() => setShowCatastropheList(!showCatastropheList)}
              >
                {showCatastropheList ? 'Hide' : 'Show'} Catastrophes ({catastrophesInDeck.length})
              </AnimatedButton>
            )}
          </div>
          {showCatastropheList && catastrophesInDeck.length > 0 && (
            <div className="box mt-4">
              <h3 className="title is-4">Catastrophes in Deck</h3>
              <ul>
                {catastrophesInDeck.map((cata, index) => (
                  <li key={index}>
                    <strong>{cata.name}:</strong> {(cata as any).worldsEnd || cata.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="age-navigation box mt-4">
            <AnimatedButton onClick={previousAge} disabled={currentAgeIndex === 0}>Previous Age</AnimatedButton>
            <div className="age-counter">
              {ageDeck.length > 0 ? (
                <>
                  <span className="current-age">{currentAgeIndex + 1}</span>
                  <span className="divider">/</span>
                  <span className="total-ages">{ageDeck.length}</span>
                </>
              ) : (
                'No Deck'
              )}
            </div>
            <AnimatedButton onClick={nextAge} disabled={currentAgeIndex >= ageDeck.length - 1}>Next Age</AnimatedButton>
          </div>
          <div className={`age-display box has-text-centered ${isCatastrophe ? 'catastrophe-age' : ''}`}>
            {currentAge ? (
              <>
                {currentAge.name === 'The Birth of Life' && currentAgeIndex === 0 && (
                  <div style={{
                    background: 'linear-gradient(145deg, #f39c12, #e67e22)',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    marginBottom: '12px',
                    display: 'inline-block'
                  }}>
                    ✨ FIRST AGE ✨
                  </div>
                )}
                <h4 className="title is-4">{currentAge.name}</h4>
                <p>{currentAge.description}</p>
              </>
            ) : 'Generate a deck to see ages.'}
          </div>
        </div>

        <div className="full-height-section" style={{ display: activeSection === 'meaningOfLife' ? 'block' : 'none' }}>
          <h2 className="section-title">Meaning of Life</h2>
          <div className="player-control box">
            <AnimatedButton id="assign-mol-btn" className="is-primary is-fullwidth" onClick={assignMeaningCards}>Assign Meaning of Life Cards</AnimatedButton>
          </div>
          <div className="player-meaning-cards">
            {playerNames.slice(0, playerCount).map((playerName, index) => {
              const pName = playerName.trim() || `Player ${index + 1}`;
              const hasCards = playerMeanings[pName] && playerMeanings[pName].length > 0;

              return (
                <div key={`${pName}-${index}`} id={`meaning-container-${pName}`} className="player-meaning-card-container box">
                  <h3 className="title is-5 has-text-centered">{pName}</h3>

                  {hasCards && !revealedMeanings[pName] && (
                    <div style={{ marginBottom: '1rem' }}>
                      <AnimatedButton
                        className="is-info is-fullwidth"
                        onClick={() => handleToggleViewPlayer(pName)}
                      >
                        {viewingPlayer === pName ? 'Hide Cards' : 'View Cards'}
                      </AnimatedButton>
                    </div>
                  )}

                  {(viewingPlayer === pName || revealedMeanings[pName]) && hasCards && (
                    <div className="meaning-cards-container">
                      {playerMeanings[pName]?.map((card, cardIndex) => (
                        <MeaningOfLifeCard
                          key={`${card.name}-${cardIndex}`}
                          card={card}
                          isSelected={selectedMeanings[pName] === card.name}
                          isRevealed={revealedMeanings[pName] || false}
                          onChoose={() => handleChooseMeaning(pName, card.name)}
                          isViewing={viewingPlayer === pName}
                          canSelect={!revealedMeanings[pName]}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="player-control box mt-4">
            <AnimatedButton className="is-primary is-fullwidth" onClick={revealAllMeaningCards}>Reveal All Cards</AnimatedButton>
          </div>
        </div>

        <div className="full-height-section" style={{ display: activeSection === 'trinkets' ? 'block' : 'none' }}>
          <h2 className="section-title">Trinkets</h2>
          <div className="player-control box">
            <AnimatedButton id="assign-trinkets-btn" className="is-primary is-fullwidth" onClick={assignTrinkets}>Assign Trinkets</AnimatedButton>
            {initialTrinketCount > 0 && (
              <p className="has-text-centered mt-2">
                Trinkets Left: {trinketState.deck.length} / {initialTrinketCount}
              </p>
            )}
          </div>

          <div className="player-trinkets-main-container">
            {playerNames.slice(0, playerCount).filter(name => name.trim() !== '').map((playerName, index) => {
              const pName = playerName.trim();
              const currentTrinkets = trinketState.playerTrinkets[pName] || [];
              const pocketed = pocketedTrinkets[pName] || [];
              const totalPoints = pocketed.reduce((sum, t) => sum + t.points, 0);

              return (
                <div key={`${pName}-${index}`} className="player-trinket-section box">
                  <h3 className="title is-5 has-text-centered">{pName}</h3>
                  <div className="trinkets-container">
                    {currentTrinkets.map((trinket, tIndex) => (
                      <TrinketCard
                        key={`${trinket.name}-${tIndex}`}
                        trinket={trinket}
                        onAdd={() => handleTrinketAdd(pName, trinket)}
                        onRemove={() => handleTrinketRemove(pName, trinket)}
                        onPocket={() => handleTrinketPocket(pName, trinket)}
                        isPocketDisabled={currentTrinkets.length !== 1}
                      />
                    ))}
                  </div>
                  {pocketed.length > 0 && (
                    <div className="pocketed-trinkets mt-4">
                      <h4 className='title is-6'>Pocketed Points: {totalPoints}</h4>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {showScrollToTop && (
        <button
          className={`scroll-to-top-btn ${isScrolled ? 'visible' : ''}`}
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}

      {showWarningModal && (
        <div className="warning-overlay">
          <div className="warning-dialog">
            <h3>Wait!</h3>
            <p>Someone hasn't hidden a trinket yet. Are you done with your trinkets? (You can pocket or hold on to them)</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <AnimatedButton className="is-info" onClick={() => setShowWarningModal(false)}>Cancel</AnimatedButton>
              <AnimatedButton className="is-warning" onClick={executeNextTurn}>We're Ready, Next Turn</AnimatedButton>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Overlay */}
      {tutorialStep !== null && (
        <TutorialOverlay
          steps={TUTORIAL_STEPS}
          currentStep={tutorialStep}
          onNext={handleTutorialNext}
          onBack={handleTutorialBack}
          onSkip={handleTutorialSkip}
        />
      )}

      <footer style={{ textAlign: 'center', paddingTop: '30px', paddingBottom: 'calc(30px + var(--ad-banner-height, 0px))', marginTop: '40px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ color: '#ccc', textDecoration: 'none', transition: 'color 0.3s ease' }}>
            🏠 Home
          </Link>
        </div>
      </footer>
    </>
  );
}
