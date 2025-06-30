'use client';

import React, { useState, useEffect, useRef } from 'react';
import DominantCard from '@/components/DominantCard';
import MeaningOfLifeCard from '@/components/MeaningOfLifeCard';
import TrinketCard from '@/components/TrinketCard';
import AnimatedButton from '@/components/AnimatedButton';

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
  const [dominantAssignments, setDominantAssignments] = useState<{ [key: number]: string | null }>({});
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

  // Meaning of Life State
  const [playerMeanings, setPlayerMeanings] = useState<{ [key: string]: Meaning[] }>({});
  const [selectedMeanings, setSelectedMeanings] = useState<{ [key: string]: string | null }>({}); // playerName: cardName
  const [revealedMeanings, setRevealedMeanings] = useState<{ [key: string]: boolean }>({}); // playerName: isRevealed

  // Trinket State
  const [playerTrinkets, setPlayerTrinkets] = useState<{ [key: string]: Trinket[] }>({});
  const [pocketedTrinkets, setPocketedTrinkets] = useState<{ [key: string]: Trinket | null }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // GAME STATE PERSISTENCE
  useEffect(() => {
    if (!isInitialLoadComplete) {
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
        dominantAssignments,
        playerTrinkets,
        pocketedTrinkets,
        activeSection,
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
    dominantAssignments,
    playerTrinkets,
    pocketedTrinkets,
    activeSection,
    isInitialLoadComplete,
  ]);

  useEffect(() => {
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
            setDominantAssignments(savedState.dominantAssignments || {});
            setPlayerTrinkets(savedState.playerTrinkets || {});
            setPocketedTrinkets(savedState.pocketedTrinkets || {});
            setActiveSection(savedState.activeSection || 'challenges');
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
  }, []);

  const handlePlayerNameChange = (index: number, name: string) => {
    const newPlayerNames = [...playerNames];
    newPlayerNames[index] = name;
    setPlayerNames(newPlayerNames);
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
    let deck: Age[] = [];
    deck.push(...shuffleArray([...normalAges]).slice(0, normalAgeCount));
    deck.push(...shuffleArray([...merchantAges]).slice(0, merchantAgeCount));
    let catastropheSelection = shuffleArray([...catastropheAges]).slice(0, catastropheAgeCount);
    if (finalCatastropheMode && catastropheSelection.length > 0) {
        const finalCatastrophe = catastropheSelection.pop();
        deck.push(...catastropheSelection);
        deck = shuffleArray(deck);
        if(finalCatastrophe) deck.push(finalCatastrophe);
    } else {
        deck.push(...catastropheSelection);
        deck = shuffleArray(deck);
    }
    setAgeDeck(deck);
    setCurrentAgeIndex(0);
  };

  const nextAge = () => setCurrentAgeIndex(i => Math.min(i + 1, ageDeck.length - 1));
  const previousAge = () => setCurrentAgeIndex(i => Math.max(i - 1, 0));

  const assignMeaningCards = () => {
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
    setSelectedMeanings(prev => ({ ...prev, [playerName]: cardName }));
  };

  const revealAllMeaningCards = () => {
    setRevealedMeanings(Object.keys(playerMeanings).reduce((acc, name) => ({...acc, [name]: true}), {}));
  };
  
  const resetMeaningCards = () => {
    setPlayerMeanings({});
    setSelectedMeanings({});
    setRevealedMeanings({});
  };

  const assignTrinkets = () => {
    const shuffledTrinkets = shuffleArray([...trinkets]);
    const newPlayerTrinkets: { [key: string]: Trinket[] } = {};
    playerNames.slice(0, playerCount).forEach(name => {
      if(name) newPlayerTrinkets[name] = shuffledTrinkets.splice(0, 3);
    });
    setPlayerTrinkets(newPlayerTrinkets);
    setPocketedTrinkets({});
  };

  const handleRemoveTrinket = (playerName: string, trinketName: string) => {
    setPlayerTrinkets(prev => ({
      ...prev,
      [playerName]: prev[playerName]?.filter(t => t.name !== trinketName) || []
    }));
  };

  const handlePocketTrinket = (playerName: string, trinketName: string) => {
    const trinketToPocket = playerTrinkets[playerName]?.find(t => t.name === trinketName);
    if (trinketToPocket) {
      handleRemoveTrinket(playerName, trinketName);
      setPocketedTrinkets(prev => ({ ...prev, [playerName]: trinketToPocket }));
    }
  };
  
  const resetTrinkets = () => {
      setPlayerTrinkets({});
      setPocketedTrinkets({});
  }
  
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

  const handleDominantAssignment = (cardId: number, playerName: string | null) => {
    setDominantAssignments(prev => ({
        ...prev,
        [cardId]: playerName,
    }));
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
        <header className="header">
          <h1>Doomlings Companion</h1>
        </header>

        <nav className="nav">
          <button className={`nav-button ${activeSection === 'challenges' ? 'is-active' : ''}`} onClick={() => showSection('challenges')}>Challenges</button>
          <button className={`nav-button ${activeSection === 'dominants' ? 'is-active' : ''}`} onClick={() => showSection('dominants')}>Dominants</button>
          <button className={`nav-button ${activeSection === 'age-setup' ? 'is-active' : ''}`} onClick={() => showSection('age-setup')}>Age Setup</button>
          <button className={`nav-button ${activeSection === 'meaning-of-life' ? 'is-active' : ''}`} onClick={() => showSection('meaning-of-life')}>Meaning of Life</button>
          <button className={`nav-button ${activeSection === 'trinkets' ? 'is-active' : ''}`} onClick={() => showSection('trinkets')}>Trinkets</button>
        </nav>
        
        {activeSection === 'challenges' && (
          <div id="challenges" className="section-content">
            <h2>Challenges</h2>
            <div className="section-controls">
              <AnimatedButton onClick={rollNewAge}>New Rule</AnimatedButton>
              <div className="field has-addons">
                <p className="control">
                  <span className="button is-static">Mode:</span>
                </p>
                <p className="control">
                  <button
                    className={`button ${!catastropheMode ? 'is-primary' : ''}`}
                    onClick={() => setCatastropheMode(false)}
                  >
                    Normal
                  </button>
                </p>
                <p className="control">
                  <button
                    className={`button ${catastropheMode ? 'is-danger' : ''}`}
                    onClick={() => setCatastropheMode(true)}
                  >
                    Catastrophe
                  </button>
                </p>
              </div>
            </div>

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
        )}

        {activeSection === 'dominants' && (
          <div id="dominants" className="section-content">
            <h2>Dominants</h2>
            <div className="card-grid">
              {allDominants.map((dominant, index) => (
                <DominantCard 
                  key={index} 
                  cardId={index}
                  dominant={dominant}
                  players={playerNames.slice(0, playerCount).filter(name => name.trim() !== '')}
                  assignedPlayer={dominantAssignments[index] || null}
                  onAssign={handleDominantAssignment}
                />
              ))}
            </div>
          </div>
        )}

        {activeSection === 'age-setup' && (
          <div id="age-setup" className="section-content">
            <h2>Age Deck Setup</h2>
            <div className="age-config">
              <div className="field">
                <label className="label">Normal Ages: {normalAgeCount}</label>
                <input type="range" className="slider" min="0" max={normalAges.length} value={normalAgeCount} onChange={(e) => setNormalAgeCount(parseInt(e.target.value, 10))} />
              </div>
              <div className="field">
                <label className="label">Merchant Ages: {merchantAgeCount}</label>
                <input type="range" className="slider" min="0" max={merchantAges.length} value={merchantAgeCount} onChange={(e) => setMerchantAgeCount(parseInt(e.target.value, 10))} />
              </div>
              <div className="field">
                <label className="label">Catastrophe Ages: {catastropheAgeCount}</label>
                <input type="range" className="slider" min="0" max={catastropheAges.length} value={catastropheAgeCount} onChange={(e) => setCatastropheAgeCount(parseInt(e.target.value, 10))} />
              </div>
              <div className="field">
                <label className="checkbox">
                  <input type="checkbox" checked={finalCatastropheMode} onChange={(e) => setFinalCatastropheMode(e.target.checked)} />
                  Final Catastrophe at End
                </label>
              </div>
              <AnimatedButton className="is-primary is-fullwidth mt-4" onClick={generateAgeDeck}>Generate Age Deck</AnimatedButton>
            </div>
            <div className="age-navigation box mt-4">
              <AnimatedButton onClick={previousAge} disabled={currentAgeIndex === 0}>Previous Age</AnimatedButton>
              <span>{ageDeck.length > 0 ? `${currentAgeIndex + 1} / ${ageDeck.length}` : 'No Deck'}</span>
              <AnimatedButton onClick={nextAge} disabled={currentAgeIndex >= ageDeck.length - 1}>Next Age</AnimatedButton>
            </div>
            <div className="age-display box has-text-centered">
              {ageDeck.length > 0 ? (
                <>
                  <h4 className="title is-4">{ageDeck[currentAgeIndex].name}</h4>
                  <p>{ageDeck[currentAgeIndex].description}</p>
                </>
              ) : 'Generate a deck to see ages.'}
            </div>
          </div>
        )}
        
        <div style={{ display: activeSection === 'meaning-of-life' ? 'block' : 'none' }}>
          <h2 className="section-title">Meaning of Life</h2>
          <div className="player-control box">
            <AnimatedButton className="is-primary is-fullwidth" onClick={assignMeaningCards}>Assign Meaning of Life Cards</AnimatedButton>
          </div>
          <div className="player-meaning-cards">
            {playerNames.slice(0, playerCount).map((playerName, index) => (
              <div key={`${playerName}-${index}`} id={`meaning-container-${playerName}`} className="player-meaning-card-container box">
                <h3 className="title is-5 has-text-centered">{playerName || `Player ${index + 1}`}</h3>
                <div className="meaning-cards-container">
                  {playerMeanings[playerName]?.map((card, cardIndex) => (
                    <MeaningOfLifeCard 
                      key={`${card.name}-${index}-${cardIndex}`}
                      card={card} 
                      isRevealed={!!revealedMeanings[playerName]}
                      isSelected={selectedMeanings[playerName] === card.name}
                      onChoose={() => handleChooseMeaning(playerName, card.name)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="action-buttons box">
            <AnimatedButton className="is-info" onClick={revealAllMeaningCards}>World's End: Reveal All</AnimatedButton>
            <AnimatedButton className="is-danger" onClick={resetMeaningCards}>Reset Cards</AnimatedButton>
          </div>
        </div>

        <div style={{ display: activeSection === 'trinkets' ? 'block' : 'none' }}>
          <h2 className="section-title">Trinkets</h2>
          <div className="player-control box">
            <AnimatedButton className="is-primary is-fullwidth" onClick={assignTrinkets}>Assign Trinkets</AnimatedButton>
          </div>
           <div className="player-trinkets">
              {playerNames.slice(0, playerCount).map((playerName, index) => (
                  <div key={`${playerName}-${index}`} className="player-trinket-container box">
                      <h3 className="title is-5 has-text-centered">{playerName || `Player ${index + 1}`}</h3>
                      <div className="card-grid">
                          {playerTrinkets[playerName]?.map((trinket, index) => (
                              <TrinketCard
                                  key={`${trinket.name}-${index}`}
                                  trinket={trinket}
                                  onRemove={() => handleRemoveTrinket(playerName, trinket.name)}
                                  onPocket={() => handlePocketTrinket(playerName, trinket.name)}
                              />
                          ))}
                      </div>
                      {pocketedTrinkets[playerName] && (
                        <div className="pocketed-section">
                            <h4>Pocketed Trinket</h4>
                            <TrinketCard
                                trinket={pocketedTrinkets[playerName]!}
                                onRemove={() => handleRemoveTrinket(playerName, pocketedTrinkets[playerName]!.name)}
                                onPocket={() => {}} // Cannot re-pocket
                            />
                        </div>
                      )}
                  </div>
              ))}
          </div>
          <div className="section-controls">
              <AnimatedButton onClick={worldsEndTrinketButton}>World's End</AnimatedButton>
              <AnimatedButton onClick={resetTrinkets}>Reset Trinkets</AnimatedButton>
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
