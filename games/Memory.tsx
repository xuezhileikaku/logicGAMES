import React, { useState, useEffect } from 'react';
import { MemoryCard, Language } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';

// Expanded Emoji list for larger grids (need up to 32 pairs for 8x8)
const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', 
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
  '🦄', '🐙', '🦋', '🐞', '🐠', '🐢', '🦖', '🐳',
  '🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍑', '🍍',
  '🚗', '🚀', '🚁', '🚂', '⚽', '🏀', '🎾', '🎱'
];

interface MemoryProps {
  onBack: () => void;
  lang: Language;
}

// Level configuration
// Note: 9x9 is odd (81 cards), cannot make pairs. Max reasonable is 8x8.
const LEVELS = [
  { rows: 2, cols: 2, name: '2x2' }, // 4 cards
  { rows: 2, cols: 3, name: '2x3' }, // 6 cards
  { rows: 3, cols: 4, name: '3x4' }, // 12 cards
  { rows: 4, cols: 4, name: '4x4' }, // 16 cards
  { rows: 4, cols: 5, name: '4x5' }, // 20 cards
  { rows: 4, cols: 6, name: '4x6' }, // 24 cards
  { rows: 5, cols: 6, name: '5x6' }, // 30 cards
  { rows: 6, cols: 6, name: '6x6' }, // 36 cards
  { rows: 6, cols: 8, name: '6x8' }, // 48 cards
  { rows: 8, cols: 8, name: '8x8' }, // 64 cards
];

export const MemoryGame: React.FC<MemoryProps> = ({ onBack, lang }) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState<MemoryCard | null>(null);
  const [choiceTwo, setChoiceTwo] = useState<MemoryCard | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Progression State
  const [levelIndex, setLevelIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [lastEvent, setLastEvent] = useState<{type: 'match' | 'miss', txt: string} | null>(null);

  const currentLevel = LEVELS[levelIndex];

  // Shuffle cards based on current level
  const shuffleCards = () => {
    const totalCards = currentLevel.rows * currentLevel.cols;
    const pairCount = totalCards / 2;
    
    // Select emojis for this level
    const selectedEmojis = EMOJIS.slice(0, pairCount);
    
    // Duplicate and shuffle
    const shuffledCards = [...selectedEmojis, ...selectedEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji) => ({ 
        id: Math.random(), 
        val: emoji, 
        isFlipped: false, 
        isMatched: false 
      }));

    setChoiceOne(null);
    setChoiceTwo(null);
    setCards(shuffledCards);
    setTurns(0);
    // Note: Don't reset score when shuffling for next level, only on full reset
  };

  const startNewGame = () => {
    setLevelIndex(0);
    setScore(0);
    setCombo(1);
    // shuffleCards called via useEffect on levelIndex change
  };

  // When level changes, reshuffle
  useEffect(() => {
    shuffleCards();
    if (levelIndex === 0) setShowTutorial(true); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelIndex]);

  // Handle a choice
  const handleChoice = (card: MemoryCard) => {
    if (!disabled) {
      playSound.flip();
      choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
    }
  };

  // Compare 2 selected cards
  useEffect(() => {
    if (choiceOne && choiceTwo) {
      setDisabled(true);
      if (choiceOne.val === choiceTwo.val) {
        // Match Found
        setCards(prevCards => {
          return prevCards.map(card => {
            if (card.val === choiceOne.val) {
              return { ...card, isMatched: true };
            } else {
              return card;
            }
          });
        });
        
        // Score Logic
        const points = 100 * combo;
        setScore(prev => prev + points);
        setCombo(prev => Math.min(prev + 1, 5)); // Cap combo at 5x
        setLastEvent({ type: 'match', txt: `+${points} (${combo}x)` });
        
        playSound.match();
        resetTurn();
      } else {
        // Mismatch
        setTimeout(() => {
            setCombo(1); // Reset combo
            setScore(prev => Math.max(0, prev - 10)); // Small penalty
            setLastEvent({ type: 'miss', txt: `${t(lang, 'penalty')} -10` });
            resetTurn();
        }, 1000);
      }
    }
  }, [choiceOne, choiceTwo, combo, lang]);

  // Auto-clear last event text
  useEffect(() => {
    if (lastEvent) {
        const timer = setTimeout(() => setLastEvent(null), 1500);
        return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  useEffect(() => {
      // Check win condition after update
      if (cards.length > 0 && cards.every(c => c.isMatched)) {
          playSound.win();
      }
  }, [cards]);

  const resetTurn = () => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns(prevTurns => prevTurns + 1);
    setDisabled(false);
  };

  const isCompleted = cards.length > 0 && cards.every(c => c.isMatched);
  const isFinalLevel = levelIndex >= LEVELS.length - 1;

  const handleNextLevel = () => {
      if (!isFinalLevel) {
          playSound.click();
          setLevelIndex(prev => prev + 1);
      }
  };

  // Dynamic grid style based on rows/cols
  const gridStyle = {
    gridTemplateColumns: `repeat(${currentLevel.cols}, minmax(0, 1fr))`,
  };

  // Adjust card size based on density
  const getCardSizeClass = () => {
      if (currentLevel.cols <= 3) return "text-4xl sm:text-5xl";
      if (currentLevel.cols <= 4) return "text-3xl sm:text-4xl";
      if (currentLevel.cols <= 6) return "text-xl sm:text-2xl";
      return "text-lg"; // 8x8
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-2xl mx-auto">
      <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Memory"
          rules={tRules(lang, 'memoryRules')}
      />

      {/* Header Info */}
      <div className="flex flex-col w-full mb-4 gap-2">
        <div className="flex justify-between items-center w-full">
            <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
            ← {t(lang, 'back')}
            </button>
            
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t(lang, 'level')}</span>
                    <span className="text-lg font-bold text-gray-800">{levelIndex + 1} <span className="text-xs text-gray-400">/ {LEVELS.length}</span></span>
                </div>
                <div className="flex flex-col items-end min-w-[80px]">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t(lang, 'score')}</span>
                    <span className="text-xl font-mono font-bold text-blue-600">{score}</span>
                </div>
            </div>
        </div>
        
        {/* Progress & Combo Bar */}
        <div className="w-full flex justify-between items-center px-1">
            <div className="text-xs text-gray-400 font-mono">{t(lang, 'turns')}: {turns}</div>
            {combo > 1 && (
                <div className="text-orange-500 font-bold animate-pulse">
                    🔥 {t(lang, 'combo')} x{combo}
                </div>
            )}
            <div className="text-xs text-gray-400">{currentLevel.name} Grid</div>
        </div>
      </div>

      {/* Game Over / Level Complete Overlay */}
      {isCompleted && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-3/4 max-w-sm">
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl text-center shadow-2xl border-4 border-blue-100 animate-scaleIn">
                <div className="text-4xl mb-2">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{isFinalLevel ? t(lang, 'victory') : t(lang, 'levelComplete')}</h2>
                <p className="text-blue-600 font-bold text-xl mb-6">{t(lang, 'score')}: {score}</p>
                
                <div className="space-y-2">
                    {!isFinalLevel ? (
                        <button onClick={handleNextLevel} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg animate-bounce">
                            {t(lang, 'nextLevel')} ➜
                        </button>
                    ) : (
                        <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm mb-4">
                            Max Level Reached!
                        </div>
                    )}
                    <button onClick={() => { startNewGame(); playSound.click(); }} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">
                        {t(lang, 'playAgain')}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Grid Container */}
      <div className="flex-1 w-full flex items-center justify-center p-2 relative">
         {/* Floating Score Event */}
         {lastEvent && (
             <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full z-10 font-bold text-lg animate-floatUp ${lastEvent.type === 'match' ? 'text-green-500' : 'text-red-500'}`}>
                 {lastEvent.txt}
             </div>
         )}

         <div 
            className="grid gap-2 w-full max-w-lg aspect-square"
            style={gridStyle}
         >
            {cards.map(card => {
            const flipped = card.isFlipped || card === choiceOne || card === choiceTwo || card.isMatched;
            return (
            <div 
                key={card.id} 
                className="relative w-full h-full cursor-pointer perspective"
                onClick={() => !flipped && !disabled ? handleChoice(card) : null}
            >
                <div className={`w-full h-full transition-all duration-300 transform border rounded-lg sm:rounded-xl shadow-sm flex items-center justify-center select-none ${
                flipped 
                ? 'rotate-y-180 bg-white border-blue-200' 
                : 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-700 hover:scale-[1.02]'
                } ${card.isMatched ? 'ring-2 ring-green-400 border-green-500 opacity-60' : ''}`}>
                
                {/* Front (Emoji) */}
                {flipped ? (
                    <span className={`${getCardSizeClass()} ${card.isMatched ? 'animate-bounce' : 'animate-scaleIn'}`}>{card.val}</span>
                ) : (
                    <span className="text-white text-opacity-40 font-bold text-lg">?</span>
                )}
                </div>
            </div>
            )})}
         </div>
      </div>
      
      {/* Bottom Menu */}
      <button 
          onClick={() => { playSound.click(); startNewGame(); }}
          className="mt-4 text-gray-400 hover:text-gray-700 underline text-sm"
      >
          {t(lang, 'reset')} (Lv.1)
      </button>

    </div>
  );
};