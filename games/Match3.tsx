import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';

interface Match3Props {
  onBack: () => void;
  lang: Language;
}

const ROWS = 8;
const COLS = 8;
const ITEMS = ['🍎', '🍇', '🍊', '💎', '⭐', '🫐'];

export const Match3: React.FC<Match3Props> = ({ onBack, lang }) => {
  const [grid, setGrid] = useState<string[][]>([]);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<{r: number, c: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [combo, setCombo] = useState(0);

  // Initialize
  useEffect(() => {
    fillBoard();
    setShowTutorial(true);
  }, []);

  const getRandomItem = () => ITEMS[Math.floor(Math.random() * ITEMS.length)];

  const fillBoard = () => {
    const newGrid: string[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const row: string[] = [];
      for (let c = 0; c < COLS; c++) {
        // Simple generation, might create pre-existing matches but that's fine for simple version, they will clear on first move or we can clear them now.
        // Let's create a board with no initial matches for cleaner start.
        let item = getRandomItem();
        while (
           (c >= 2 && row[c-1] === item && row[c-2] === item) ||
           (r >= 2 && newGrid[r-1][c] === item && newGrid[r-2][c] === item)
        ) {
           item = getRandomItem();
        }
        row.push(item);
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
    setScore(0);
  };

  const checkMatches = (currentGrid: string[][]) => {
    const matched = new Set<string>();
    
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        const item = currentGrid[r][c];
        if (item && item === currentGrid[r][c+1] && item === currentGrid[r][c+2]) {
          matched.add(`${r},${c}`);
          matched.add(`${r},${c+1}`);
          matched.add(`${r},${c+2}`);
        }
      }
    }

    // Vertical
    for (let r = 0; r < ROWS - 2; r++) {
      for (let c = 0; c < COLS; c++) {
        const item = currentGrid[r][c];
        if (item && item === currentGrid[r+1][c] && item === currentGrid[r+2][c]) {
          matched.add(`${r},${c}`);
          matched.add(`${r+1},${c}`);
          matched.add(`${r+2},${c}`);
        }
      }
    }
    return matched;
  };

  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    setIsProcessing(true);
    const tempGrid = grid.map(row => [...row]);
    
    // Swap
    const temp = tempGrid[r1][c1];
    tempGrid[r1][c1] = tempGrid[r2][c2];
    tempGrid[r2][c2] = temp;
    setGrid(tempGrid);
    playSound.move();

    // Check matches
    const matches = checkMatches(tempGrid);

    if (matches.size > 0) {
       await processMatches(tempGrid, matches);
    } else {
       // Swap back if no match
       setTimeout(() => {
           tempGrid[r2][c2] = tempGrid[r1][c1];
           tempGrid[r1][c1] = temp;
           setGrid(tempGrid);
           setIsProcessing(false);
           playSound.click(); // Error sound essentially
       }, 300);
    }
    setSelected(null);
  };

  const processMatches = async (boardState: string[][], initialMatches: Set<string>) => {
     let currentMatches = initialMatches;
     let currentBoard = boardState;
     let multiplier = 1;

     while (currentMatches.size > 0) {
        // Wait for visual update
        await new Promise(r => setTimeout(r, 300));
        playSound.pop();

        // 1. Clear Matches
        const newBoard = currentBoard.map(row => [...row]);
        currentMatches.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            newBoard[r][c] = '';
        });
        setGrid(newBoard);
        setScore(s => s + (currentMatches.size * 10 * multiplier));
        setCombo(multiplier);
        multiplier++;

        await new Promise(r => setTimeout(r, 300));

        // 2. Drop Gravity
        for (let c = 0; c < COLS; c++) {
            let emptySlots = 0;
            for (let r = ROWS - 1; r >= 0; r--) {
                if (newBoard[r][c] === '') {
                    emptySlots++;
                } else if (emptySlots > 0) {
                    newBoard[r + emptySlots][c] = newBoard[r][c];
                    newBoard[r][c] = '';
                }
            }
            // Fill top
            for (let r = 0; r < emptySlots; r++) {
                newBoard[r][c] = getRandomItem();
            }
        }
        setGrid([...newBoard]); // Force re-render

        // 3. Check new matches
        currentMatches = checkMatches(newBoard);
        currentBoard = newBoard;
     }
     
     setIsProcessing(false);
     setCombo(0);
  };

  const handleCellClick = (r: number, c: number) => {
    if (isProcessing) return;

    if (selected) {
      // Check adjacency
      const dist = Math.abs(selected.r - r) + Math.abs(selected.c - c);
      if (dist === 1) {
        handleSwap(selected.r, selected.c, r, c);
      } else {
        setSelected({r, c});
        playSound.click();
      }
    } else {
      setSelected({r, c});
      playSound.click();
    }
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-md mx-auto">
      <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Match 3"
          rules={tRules(lang, 'match3Rules')}
      />

      <div className="flex justify-between items-center w-full mb-4 px-4">
         <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">← {t(lang, 'back')}</button>
         <div className="flex flex-col items-end">
             <span className="text-xs text-gray-400 font-bold uppercase">{t(lang, 'score')}</span>
             <span className="text-2xl font-black text-pink-600 font-mono">{score}</span>
         </div>
      </div>
      
      {combo > 1 && <div className="absolute top-24 z-10 text-4xl font-black text-yellow-400 animate-bounce drop-shadow-md">COMBO x{combo}!</div>}

      <div className="bg-pink-100 p-2 rounded-xl shadow-inner border-4 border-pink-200">
          <div 
             className="grid gap-1 bg-white p-1 rounded-lg"
             style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
              {grid.map((row, r) => row.map((item, c) => {
                  const isSelected = selected?.r === r && selected?.c === c;
                  return (
                      <div 
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        className={`
                            w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl cursor-pointer rounded-full transition-all duration-200
                            ${isSelected ? 'bg-pink-300 scale-110 ring-4 ring-pink-200 z-10' : 'hover:bg-pink-50'}
                            ${item === '' ? 'scale-0' : 'scale-100'}
                        `}
                      >
                          {item}
                      </div>
                  );
              }))}
          </div>
      </div>
      
      <button onClick={fillBoard} className="mt-8 px-6 py-2 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 shadow-md">
          {t(lang, 'reset')}
      </button>
    </div>
  );
};