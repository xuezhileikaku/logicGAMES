import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';

interface SlidingProps {
  onBack: () => void;
  lang: Language;
}

const SIZE = 4; // 4x4 Grid

export const SlidingPuzzle: React.FC<SlidingProps> = ({ onBack, lang }) => {
  const [tiles, setTiles] = useState<number[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [moves, setMoves] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  // Initialize solved state
  const getSolvedState = () => Array.from({ length: SIZE * SIZE }, (_, i) => (i + 1) % (SIZE * SIZE));

  useEffect(() => {
    shuffleBoard();
    setShowTutorial(true);
  }, []);

  const shuffleBoard = () => {
    let newTiles = getSolvedState(); // Start solved
    // Randomize
    // To ensure solvability, we simulate valid moves or check inversion count. 
    // Easier approach: just simulate 1000 random valid moves from solved state.
    let emptyIdx = SIZE * SIZE - 1;
    let prevMove = -1;

    for(let i=0; i<300; i++) {
        const neighbors = [];
        const r = Math.floor(emptyIdx / SIZE);
        const c = emptyIdx % SIZE;
        if (r > 0) neighbors.push(emptyIdx - SIZE);
        if (r < SIZE - 1) neighbors.push(emptyIdx + SIZE);
        if (c > 0) neighbors.push(emptyIdx - 1);
        if (c < SIZE - 1) neighbors.push(emptyIdx + 1);

        // Don't undo immediate previous move to ensure mixing
        const validNeighbors = neighbors.filter(n => n !== prevMove);
        const nextPos = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
        
        // Swap
        newTiles[emptyIdx] = newTiles[nextPos];
        newTiles[nextPos] = 0;
        prevMove = emptyIdx;
        emptyIdx = nextPos;
    }

    setTiles(newTiles);
    setMoves(0);
    setIsSolved(false);
    playSound.pop();
  };

  const checkWin = (currentTiles: number[]) => {
      for(let i=0; i<currentTiles.length - 1; i++) {
          if (currentTiles[i] !== i + 1) return false;
      }
      return true;
  };

  const handleTileClick = (index: number) => {
    if (isSolved) return;
    const emptyIndex = tiles.indexOf(0);
    const r = Math.floor(index / SIZE);
    const c = index % SIZE;
    const emptyR = Math.floor(emptyIndex / SIZE);
    const emptyC = emptyIndex % SIZE;

    // Check if adjacent
    if (Math.abs(r - emptyR) + Math.abs(c - emptyC) === 1) {
        const newTiles = [...tiles];
        newTiles[emptyIndex] = newTiles[index];
        newTiles[index] = 0;
        setTiles(newTiles);
        setMoves(m => m + 1);
        playSound.click();

        if (checkWin(newTiles)) {
            setIsSolved(true);
            playSound.win();
        }
    }
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-md mx-auto">
      <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Sliding Puzzle"
          rules={tRules(lang, 'slidingRules')}
      />

      <div className="flex justify-between items-center w-full mb-6 px-4">
         <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">← {t(lang, 'back')}</button>
         <div className="font-mono text-xl font-bold text-teal-700">{t(lang, 'moves')}: {moves}</div>
      </div>

      <div className="bg-teal-800 p-2 rounded-xl shadow-2xl">
          <div className="grid grid-cols-4 gap-1 sm:gap-2 bg-teal-900 border-4 border-teal-900 rounded-lg p-1" style={{ width: 'fit-content' }}>
              {tiles.map((tile, i) => (
                  <div 
                    key={i}
                    onClick={() => handleTileClick(i)}
                    className={`
                        w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-bold shadow-inner transition-all duration-100
                        ${tile === 0 ? 'bg-transparent shadow-none' : 'bg-teal-100 text-teal-800 cursor-pointer hover:bg-teal-50 hover:scale-[1.02]'}
                        ${isSolved && tile !== 0 ? 'bg-green-100 text-green-700 animate-bounce' : ''}
                    `}
                  >
                      {tile !== 0 ? tile : ''}
                  </div>
              ))}
          </div>
      </div>

      {isSolved && (
          <div className="mt-8 text-2xl font-bold text-green-600 animate-pulse">{t(lang, 'solved')}</div>
      )}

      <button onClick={shuffleBoard} className="mt-8 px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all">
          {t(lang, 'scramble')}
      </button>
    </div>
  );
};