'use client';

import React, { useState, useEffect, useRef } from 'react';
import DominantCard from '@/components/DominantCard';
import MeaningOfLifeCard from '@/components/MeaningOfLifeCard';
import TrinketCard from '@/components/TrinketCard';
import AnimatedButton from '@/components/AnimatedButton';
import GameTurn from '@/components/GameTurn';

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
  const [currentRule, setCurrentRule] = useState<Rule | null>(null);
  const [challengePlayer, setChallengePlayer] = useState<string | null>(null);

  // Age Deck State
  const [ageDeck, setAgeDeck] = useState<Age[]>([]);
  const [currentAgeIndex, setCurrentAgeIndex] = useState(0);
  const [normalAgeCount, setNormalAgeCount] = useState(0);
  const [merchantAgeCount, setMerchantAgeCount] = useState(0);
  const [catastropheAgeCount, setCatastropheAgeCount] = useState(0);
  const [finalCatastropheMode, setFinalCatastropheMode] = useState(true);
  const [catastrophesInDeck, setCatastrophesInDeck] = useState<Age[]>([]);
  const [showCatastropheList, setShowCatastropheList] = useState(false);

  // Meaning of Life State
  const [playerMeanings, setPlayerMeanings] = useState<{ [key: string]: Meaning[] }>({});
  const [selectedMeanings, setSelectedMeanings] = useState<{ [key: string]: string | null }>({}); // playerName: cardName
  const [revealedMeanings, setRevealedMeanings] = useState<{ [key: string]: boolean }>({}); // playerName: isRevealed
  const [viewingPlayer, setViewingPlayer] = useState<string | null>(null);

  // Dominant Card States
  const [dominantCardStates, setDominantCardStates] = useState<{ [cardName: string]: DominantCardState }>({});
  const [dominantSearchTerm, setDominantSearchTerm] = useState('');

  // Trinket State
  const [trinketState, setTrinketState] = useState<{
    deck: Trinket[];
    playerTrinkets: { [key: string]: Trinket[] };
  }>({ deck: [], playerTrinkets: {} });
  const [initialTrinketCount, setInitialTrinketCount] = useState(0);
  const [pocketedTrinkets, setPocketedTrinkets] = useState<{ [key: string]: Trinket[] }>({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const isMounted = useRef(false);

  // GAME STATE PERSISTENCE
  useEffect(() => {
    if (!isInitialLoadComplete || !isMounted.current) {
      return;
    }

    const saveGameState = () => {
      const gameState = {
        playerCount,
        playerNames,
        catastropheMode,
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
      };
      localStorage.setItem('doomlingsGameState', JSON.stringify(gameState));
    };

    saveGameState();
  }, [
    playerCount,
    playerNames,
    catastropheMode,
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

            setActiveSection(savedState.activeSection || 'challenges');
            setViewingPlayer(savedState.viewingPlayer || null);
            setInitialTrinketCount(savedState.initialTrinketCount || 0);
            setCatastrophesInDeck(savedState.catastrophesInDeck || []);
            setShowCatastropheList(savedState.showCatastropheList || false);
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
                normalRulesData, catastropheRulesData, dominantData, normalAgeData,
                merchantAgeData, catastropheData, meaningOfLifeData, trinketData
            ] = await Promise.all([
                loadJson('/data/normalRules.json'), loadJson('/data/catastropheRules.json'),
                loadJson('/data/dominantData.json'), loadJson('/data/normalAgeData.json'),
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
            setNormalAges(normalAgeData || []);
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

    return () => {
      isMounted.current = false;
    }
  }, []);

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

  const showSection = (sectionId: string) => setActiveSection(sectionId);

  const rollNewAge = () => {
    const rulesToUse = catastropheMode ? catastropheRules : rules;
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
    
    // Find and add Birth of Life first if it exists in normalAges
    const birthOfLife = normalAges.find(age => age.name === 'Birth of Life');
    let availableNormalAges = normalAges.filter(age => age.name !== 'Birth of Life');
    
    // Add Birth of Life first if it exists and we want normal ages
    if (birthOfLife && normalAgeCount > 0) {
        deck.push(birthOfLife);
        // Add remaining normal ages (one less since Birth of Life is already added)
        if (normalAgeCount > 1) {
            deck.push(...shuffleArray([...availableNormalAges]).slice(0, normalAgeCount - 1));
        }
    } else {
        // If no Birth of Life or normalAgeCount is 0, add normal ages as usual
        deck.push(...shuffleArray([...normalAges]).slice(0, normalAgeCount));
    }
    
    // Add merchant ages
    deck.push(...shuffleArray([...merchantAges]).slice(0, merchantAgeCount));
    
    // Handle catastrophe ages
    let catastropheSelection = shuffleArray([...catastropheAges]).slice(0, catastropheAgeCount);
    let allCatastrophesInDeck = [...catastropheSelection]; // Keep original list for tracking
    
    if (finalCatastropheMode && catastropheSelection.length > 0) {
        const finalCatastrophe = catastropheSelection.pop();
        deck.push(...catastropheSelection);
        // Shuffle everything except Birth of Life (first) and final catastrophe
        const deckToShuffle = deck.slice(1); // Skip Birth of Life
        const shuffledMiddle = shuffleArray(deckToShuffle);
        deck = birthOfLife && normalAgeCount > 0 ? [birthOfLife, ...shuffledMiddle] : shuffleArray(deck);
        if(finalCatastrophe) deck.push(finalCatastrophe);
    } else {
        deck.push(...catastropheSelection);
        // Shuffle everything except Birth of Life if it's first
        if (birthOfLife && normalAgeCount > 0) {
            const deckToShuffle = deck.slice(1); // Skip Birth of Life
            const shuffledMiddle = shuffleArray(deckToShuffle);
            deck = [birthOfLife, ...shuffledMiddle];
        } else {
            deck = shuffleArray(deck);
        }
    }
    setCatastrophesInDeck(allCatastrophesInDeck);
    setAgeDeck(deck);
    setCurrentAgeIndex(0);
    setShowCatastropheList(false);
  };

  const nextAge = () => setCurrentAgeIndex(i => Math.min(i + 1, ageDeck.length - 1));
  const previousAge = () => setCurrentAgeIndex(i => Math.max(i - 1, 0));

  const handleNextTurn = () => {
    // Roll new challenge
    rollNewAge();
    // Advance to next age
    nextAge();
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
      if(name) newPlayerMeanings[name] = shuffledMeanings.splice(0, 2);
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
    setRevealedMeanings(Object.keys(playerMeanings).reduce((acc, name) => ({...acc, [name]: true}), {}));
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
      if(name) {
        newPlayerTrinkets[name] = deckCopy.splice(0, 2);
      }
    });
    
    const nextState = { deck: deckCopy, playerTrinkets: newPlayerTrinkets };
    setTrinketState(nextState);
    setPocketedTrinkets(playerNames.slice(0, playerCount).reduce((acc, name) => ({...acc, [name]: [] }), {}));
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
             const nextState = { ...currentState, playerTrinkets: { ...currentState.playerTrinkets, [playerName]: nextHand }};
             return nextState;
        }
    });
  };

  const worldsEndTrinketButton = () => {
      // Placeholder for score calculation logic
      alert("Score calculation not implemented yet.");
  }

  const calculateScalingMultiplier = () => {
    const totalAges = normalAgeCount + merchantAgeCount + catastropheAgeCount;
    // Using the same logic from the original script: (total ages / 20)
    const baseSM = Math.max(1, totalAges / 20);
    return baseSM;
  };

  const processDescription = (description: string, sM: number) => {
    return description
      .replace(/(\d+)\*sM/g, (_, num) => Math.round(parseInt(num) * sM).toString())
      .replace(/sM\*(\d+)/g, (_, num) => Math.round(parseInt(num) * sM).toString())
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

  const handleToggleViewPlayer = (playerName: string) => {
    setViewingPlayer(current => (current === playerName ? null : playerName));
  };

  const resetAllDominants = () => {
    if (window.confirm('Are you sure you want to reset all dominant card assignments and tiers?')) {
      setDominantCardStates({});
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
          <button className="nav-button" onClick={() => showSection('challenges')}>Challenges</button>
          <button className="nav-button" onClick={() => showSection('dominants')}>Dominants</button>
          <button className="nav-button" onClick={() => showSection('ageSetup')}>Age Setup</button>
          <button className="nav-button" onClick={() => showSection('meaningOfLife')}>Meaning of Life</button>
          <button className="nav-button" onClick={() => showSection('trinkets')}>Trinkets</button>
          <button className="nav-button game-turn-button" onClick={() => showSection('gameTurn')}>Game Turn</button>
        </div>

        {/* Sections */}
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
            onNextTurn={handleNextTurn}
            handleTrinketAdd={handleTrinketAdd}
            handleTrinketRemove={handleTrinketRemove}
            handleTrinketPocket={handleTrinketPocket}
          />
        )}

        <div className="full-height-section" style={{ display: activeSection === 'challenges' ? 'block' : 'none' }}>
            <h1 className="section-title">Challenges</h1>
            <div className="player-control box">
                <div className="field">
                    <label className="label">Players: {playerCount}</label>
                    <input type="range" className="slider" min="2" max="6" value={playerCount} onChange={(e) => handlePlayerCountChange(parseInt(e.target.value, 10))} />
                </div>
                <div className="field">
                    <label className="checkbox">
                        <input type="checkbox" checked={catastropheMode} onChange={(e) => setCatastropheMode(e.target.checked)} />
                        Catastrophe Mode
                    </label>
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
                    <AnimatedButton className="is-primary is-fullwidth" onClick={rollNewAge}>Roll New Challenge</AnimatedButton>
                </div>
                <div className="age-display mt-4 has-text-centered">
                    {currentRule && (
                        <div className="rule-display">
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
              if (aIsAssigned && !bIsAssigned) return -1;
              if (!aIsAssigned && bIsAssigned) return 1;
              return 0;
            })
            .filter(dominant => {
              const searchTerm = dominantSearchTerm.toLowerCase();
              if (!searchTerm) return true;
              const assignedPlayer = dominantCardStates[dominant.name]?.assignedTo || '';
              return (
                dominant.name.toLowerCase().includes(searchTerm) ||
                (assignedPlayer !== 'Assign' && assignedPlayer.toLowerCase().includes(searchTerm))
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
                <div className="field">
                    <label className="label">Normal Ages: {normalAgeCount}</label>
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
                <div className="field">
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
                <div className="field">
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
                <AnimatedButton className="is-primary is-fullwidth mt-4" onClick={generateAgeDeck}>Generate Age Deck</AnimatedButton>
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
                    <h4 className="title is-4">{currentAge.name}</h4>
                    <p>{currentAge.description}</p>
                </>
                ) : 'Generate a deck to see ages.'}
          </div>
        </div>
        
        <div className="full-height-section" style={{ display: activeSection === 'meaningOfLife' ? 'block' : 'none' }}>
            <h2 className="section-title">Meaning of Life</h2>
            <div className="player-control box">
                <AnimatedButton className="is-primary is-fullwidth" onClick={assignMeaningCards}>Assign Meaning of Life Cards</AnimatedButton>
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
                <AnimatedButton className="is-primary is-fullwidth" onClick={assignTrinkets}>Assign Trinkets</AnimatedButton>
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

      <footer style={{ textAlign: 'center', padding: '20px', marginTop: '40px', color: '#666' }}>
        <a href="/privacy-policy" style={{ color: '#666', textDecoration: 'none', marginRight: '20px' }}>Privacy Policy</a>
        <a href="/contact" style={{ color: '#666', textDecoration: 'none', marginRight: '20px' }}>Contact Us</a>
        <a href="/settings" style={{ color: '#666', textDecoration: 'none' }}>Settings</a>
      </footer>
    </>
  );
}
