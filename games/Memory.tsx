import React, { useState, useEffect } from 'react';
import { MemoryCard, Language } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';

const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

interface MemoryProps {
  onBack: () => void;
  lang: Language;
}

export const MemoryGame: React.FC<MemoryProps> = ({ onBack, lang }) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState<MemoryCard | null>(null);
  const [choiceTwo, setChoiceTwo] = useState<MemoryCard | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Shuffle cards
  const shuffleCards = () => {
    const shuffledCards = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji) => ({ id: Math.random(), val: emoji, isFlipped: false, isMatched: false }));

    setChoiceOne(null);
    setChoiceTwo(null);
    setCards(shuffledCards);
    setTurns(0);
  };

  useEffect(() => {
    shuffleCards();
    setShowTutorial(true); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setCards(prevCards => {
          return prevCards.map(card => {
            if (card.val === choiceOne.val) {
              return { ...card, isMatched: true };
            } else {
              return card;
            }
          });
        });
        playSound.match();
        resetTurn();
      } else {
        setTimeout(() => resetTurn(), 1000);
      }
    }
  }, [choiceOne, choiceTwo]);

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

  return (
    <div className="flex flex-col items-center h-full w-full max-w-lg mx-auto">
      <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Memory"
          rules={tRules(lang, 'memoryRules')}
      />

      <div className="flex justify-between items-center w-full mb-6">
        <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
          ← {t(lang, 'back')}
        </button>
        <button onClick={() => { setShowTutorial(true); playSound.click(); }} className="text-gray-400 hover:text-gray-600">?</button>
        <div className="bg-blue-100 text-blue-800 px-4 py-1 rounded-full font-bold text-sm">
          {t(lang, 'turns')}: {turns}
        </div>
      </div>

      {isCompleted && (
        <div className="mb-6 bg-green-100 text-green-800 p-4 rounded-xl text-center shadow-sm w-full animate-bounce">
          <h2 className="text-xl font-bold">🎉 {t(lang, 'victory')}</h2>
          <button onClick={() => { shuffleCards(); playSound.click(); }} className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
            {t(lang, 'playAgain')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 w-full">
        {cards.map(card => {
          const flipped = card.isFlipped || card === choiceOne || card === choiceTwo || card.isMatched;
          return (
          <div 
            key={card.id} 
            className="relative aspect-square cursor-pointer perspective"
            onClick={() => !flipped && !disabled ? handleChoice(card) : null}
          >
            <div className={`w-full h-full transition-all duration-500 transform border-2 rounded-xl shadow-sm ${
               flipped 
               ? 'rotate-y-180 bg-white border-blue-200' 
               : 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-700 hover:scale-105 hover:shadow-md'
            } ${card.isMatched ? 'ring-4 ring-green-400 border-green-500 scale-95' : ''} flex items-center justify-center text-3xl select-none`}>
               
               {/* Front (Emoji) */}
               {flipped ? (
                 <span className={`${card.isMatched ? 'animate-bounce' : 'animate-scaleIn'}`}>{card.val}</span>
               ) : (
                 <span className="text-white text-xl font-bold opacity-50">?</span>
               )}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};