'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { useGameState } from '@/hooks/useGameState';
import { useSync } from '@/hooks/useSync';
import GameSocketManager from '@/lib/gameSocketManager';

const TUTORIAL_STEPS: TutorialStep[] = [
  { title: '👋 Welcome!', message: 'This app makes Doomlings way more fun! Let\'s take a quick tour.', highlightId: null },
  { title: '👥 Setup', message: 'Set player count and names here.', highlightId: 'nav-setup', section: 'setup' },
  { title: '⚡ Challenges', message: 'Roll for new gameplay challenges each age.', highlightId: 'nav-challenges', section: 'challenges' },
  { title: '📅 Ages', message: 'Configure your Age deck here.', highlightId: 'nav-age-setup', section: 'ageSetup' },
  { title: '🌟 Meaning of Life', message: 'Assign secret objectives to players.', highlightId: 'nav-mol', section: 'meaningOfLife' },
  { title: '🎁 Trinkets', message: 'Manage player trinkets and pocketed points.', highlightId: 'nav-trinkets', section: 'trinkets' },
  { title: '💎 Dominants', message: 'Track dominant cards and their tiers.', highlightId: 'nav-dominants', section: 'dominants' },
  { title: '🎮 Game Dashboard', message: 'The heart of your game turn!', highlightId: 'nav-game-turn', section: 'gameDashboard' },
];

export default function GamePage() {
  const router = useRouter();
  const { setAdsSuppressed } = useAds();
  const { state, updateState, resetGame, isLoading: stateLoading } = useGameState();
  
  const [activeSection, setActiveSection] = useState('setup');
  const [viewingPlayer, setViewingPlayer] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean; title: string; message: string; type?: 'info' | 'warning' | 'error' | 'success'; onConfirm?: () => void } | null>(null);

  const socketManager = GameSocketManager.getInstance();
  const room = socketManager.getCurrentRoom();
  const isHost = room ? room.hostId === socketManager.getPlayerId() : true;

  const { playerId } = useSync(state, updateState, isHost);

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
  const handleStartGame = () => {
    updateState({ isGameStarted: true });
    setActiveSection('ageSetup');
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
    const deck: any[] = [];
    if (options.includeBirth) {
      const birth = allData.normalAges.find(a => a.name === 'The Birth of Life');
      if (birth) deck.push(birth);
    }

    // Add Normal Ages (usually 3 for each catastrophy period)
    const shuffledNormal = [...allData.normalAges.filter(a => a.name !== 'The Birth of Life')].sort(() => Math.random() - 0.5);
    const shuffledCatastrophe = [...allData.catastropheAges].sort(() => Math.random() - 0.5);
    const shuffledMerchant = [...allData.merchantAges].sort(() => Math.random() - 0.5);

    // Simplified logic for audit: 3 ages, 1 catastrophe, repeat 3 times
    for (let i = 0; i < 3; i++) {
        deck.push(...shuffledNormal.splice(0, 3));
        if (shuffledCatastrophe.length > 0) deck.push(shuffledCatastrophe.shift());
    }

    // Mix in merchants
    if (options.merchantAges > 0) {
        for (let i = 0; i < options.merchantAges; i++) {
            const idx = Math.floor(Math.random() * (deck.length - 1)) + 1;
            deck.splice(idx, 0, shuffledMerchant.shift());
        }
    }

    updateState({ ageDeck: deck, currentAgeIndex: 0 });
    setModal(null);
  };

  const handleRollChallenge = () => {
    const nextIdx = Math.floor(Math.random() * allData.rules.length);
    updateState({ currentChallengeIndex: nextIdx, assignedChallenges: {} });
  };

  const handleAssignChallenge = (player: string, challenge: string) => {
    updateState(prev => ({
        assignedChallenges: { ...prev.assignedChallenges, [challenge]: player }
    }));
  };

  const handleNextTurn = () => {
    // Check for unpocketed trinkets warning if needed
    if (state.currentAgeIndex < state.ageDeck.length - 1) {
        updateState(prev => ({
            currentAgeIndex: prev.currentAgeIndex + 1,
            currentChallengeIndex: Math.floor(Math.random() * allData.rules.length),
            assignedChallenges: {}
        }));
    }
  };

  const handleResetAll = () => {
    setModal({
        isOpen: true,
        title: 'Reset All Data?',
        message: 'This will wipe all game progress. This cannot be undone.',
        type: 'error',
        onConfirm: () => {
            resetGame();
            window.location.reload();
        }
    });
  };

  if (stateLoading) return <div className="p-10 has-text-centered">Loading Game State...</div>;

  return (
    <div className="game-page-container">
      <nav className="game-nav box">
        <div className="is-flex is-flex-wrap-wrap is-justify-content-center gap-2">
          <AnimatedButton onClick={() => setActiveSection('setup')} className={activeSection === 'setup' ? 'is-primary' : 'is-light'}>Setup</AnimatedButton>
          <AnimatedButton onClick={() => setActiveSection('gameDashboard')} className={activeSection === 'gameDashboard' ? 'is-primary' : 'is-light'}>Dashboard</AnimatedButton>
          <AnimatedButton onClick={() => setActiveSection('challenges')} className={activeSection === 'challenges' ? 'is-primary' : 'is-light'}>Challenges</AnimatedButton>
          <AnimatedButton onClick={() => setActiveSection('ageSetup')} className={activeSection === 'ageSetup' ? 'is-primary' : 'is-light'}>Age Deck</AnimatedButton>
          <AnimatedButton onClick={() => setActiveSection('meaningOfLife')} className={activeSection === 'meaningOfLife' ? 'is-primary' : 'is-light'}>MoL</AnimatedButton>
          <AnimatedButton onClick={() => setActiveSection('trinkets')} className={activeSection === 'trinkets' ? 'is-primary' : 'is-light'}>Trinkets</AnimatedButton>
          <AnimatedButton onClick={() => setActiveSection('dominants')} className={activeSection === 'dominants' ? 'is-primary' : 'is-light'}>Dominants</AnimatedButton>
          <AnimatedButton onClick={() => setActiveSection('multiplayer')} className={activeSection === 'multiplayer' ? 'is-primary' : 'is-light'}>Sync</AnimatedButton>
          <AnimatedButton onClick={() => setTutorialStep(0)} className="is-info">?</AnimatedButton>
        </div>
      </nav>

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
            rules={allData.rules}
            currentRuleIndex={state.currentRuleIndex}
            challenges={allData.rules}
            currentChallengeIndex={state.currentChallengeIndex}
            playerNames={state.playerNames}
            playerCount={state.playerCount}
            pocketedTrinkets={state.pocketedTrinkets}
            trinketState={state.trinketState}
            onNextTurn={handleNextTurn}
            onNextAge={() => updateState(p => ({ currentAgeIndex: Math.min(p.ageDeck.length - 1, p.currentAgeIndex + 1) }))}
            onPrevAge={() => updateState(p => ({ currentAgeIndex: Math.max(0, p.currentAgeIndex - 1) }))}
            isCatastrophe={state.ageDeck[state.currentAgeIndex]?.isCatastrophe || false}
            onTrinketPocket={(p, t) => {
                const current = state.trinketState.playerTrinkets[p] || [];
                const pocketed = state.pocketedTrinkets[p] || [];
                updateState({
                    trinketState: { ...state.trinketState, playerTrinkets: { ...state.trinketState.playerTrinkets, [p]: current.filter(x => x.name !== t.name) } },
                    pocketedTrinkets: { ...state.pocketedTrinkets, [p]: [...pocketed, t] }
                });
            }}
            onTrinketAdd={(p, t) => {}} // Implemented as needed
            onTrinketRemove={(p, t) => {}}
          />
        )}

        {activeSection === 'challenges' && (
          <ChallengesSection
            challenges={allData.rules}
            currentChallengeIndex={state.currentChallengeIndex}
            assignedChallenges={state.assignedChallenges}
            playerNames={state.playerNames}
            playerCount={state.playerCount}
            onRollChallenge={handleRollChallenge}
            onAssignChallenge={handleAssignChallenge}
          />
        )}

        {activeSection === 'ageSetup' && (
          <AgeSetupSection 
            onGenerateDeck={handleGenerateDeck}
            ageDeckLength={state.ageDeck.length}
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
                state.playerNames.slice(0, state.playerCount).forEach(name => {
                    assigned[name.trim() || 'Player'] = meanings.splice(0, 2);
                });
                updateState({ playerMeanings: assigned, revealedMeanings: {} });
            }}
            onRevealAll={() => {
                const revealed: any = {};
                Object.keys(state.playerMeanings).forEach(k => revealed[k] = true);
                updateState({ revealedMeanings: revealed });
            }}
            onChooseMeaning={(p, m) => updateState(prev => ({ selectedMeanings: { ...prev.selectedMeanings, [p]: m } }))}
            onToggleViewPlayer={p => setViewingPlayer(viewingPlayer === p ? null : p)}
            viewingPlayer={viewingPlayer}
          />
        )}

        {activeSection === 'trinkets' && (
          <TrinketsSection
            playerNames={state.playerNames}
            playerCount={state.playerCount}
            trinketState={state.trinketState}
            pocketedTrinkets={state.pocketedTrinkets}
            onAssignTrinkets={() => {
                const deck = [...allData.trinkets].sort(() => Math.random() - 0.5);
                const assigned: any = {};
                state.playerNames.slice(0, state.playerCount).forEach(name => {
                    assigned[name.trim()] = deck.splice(0, 2);
                });
                updateState({ trinketState: { deck, playerTrinkets: assigned }, pocketedTrinkets: {} });
            }}
            onTrinketPocket={(p, t) => {}} // Reuse dashboard logic
            onTrinketAdd={(p, t) => {}}
            onTrinketRemove={(p, t) => {}}
          />
        )}

        {activeSection === 'dominants' && (
          <DominantsSection
            playerNames={state.playerNames}
            playerCount={state.playerCount}
            dominants={allData.dominants}
            dominantState={state.dominantState}
            onDominantChange={(name, updates) => updateState(prev => ({
                dominantState: { ...prev.dominantState, [name]: { ...(prev.dominantState[name] || { assignedTo: 'Assign', selectedTier: null }), ...updates } }
            }))}
            onResetDominants={() => updateState({ dominantState: {} })}
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
          onClose={() => setModal(null)}
          title={modal.title}
          type={modal.type}
          actions={
            modal.onConfirm ? (
              <>
                <AnimatedButton onClick={() => setModal(null)} className="is-light">Cancel</AnimatedButton>
                <AnimatedButton onClick={modal.onConfirm} className={`is-${modal.type || 'primary'}`}>Confirm</AnimatedButton>
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

      <footer className="footer-simple mt-8 py-6 has-text-centered border-t border-white/10">
        <Link href="/" className="text-muted hover:text-white transition-colors">🏠 Home</Link>
        <span className="mx-4 text-white/10">|</span>
        <button onClick={handleResetAll} className="text-error hover:underline bg-transparent border-none cursor-pointer">⚠️ Reset All</button>
      </footer>
    </div>
  );
}
