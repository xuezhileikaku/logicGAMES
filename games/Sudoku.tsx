import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';
import { getGameCoachTip } from '../services/geminiService';

interface SudokuProps {
  onBack: () => void;
  lang: Language;
}

// Basic Sudoku Generator logic (simplified for client-side)
const BLANK = 0;
const SIZE = 9;

const isValid = (board: number[][], row: number, col: number, num: number) => {
    for (let x = 0; x < 9; x++) if (board[row][x] === num || board[x][col] === num) return false;
    const startRow = row - row % 3, startCol = col - col % 3;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (board[i + startRow][j + startCol] === num) return false;
    return true;
};

const solveSudoku = (board: number[][]) => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === BLANK) {
                for (let num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) return true;
                        board[row][col] = BLANK;
                    }
                }
                return false;
            }
        }
    }
    return true;
};

const generateSudoku = (difficulty: 'easy' | 'medium' | 'hard') => {
    // 1. Fill diagonal 3x3 boxes (independent)
    const newBoard = Array(9).fill(0).map(() => Array(9).fill(0));
    for (let i = 0; i < 9; i = i + 3) {
        fillBox(newBoard, i, i);
    }
    // 2. Solve the rest
    solveSudoku(newBoard);
    // 3. Remove K digits
    const solved = newBoard.map(row => [...row]);
    const attempts = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 45 : 55;
    let count = attempts;
    while (count > 0) {
        let r = Math.floor(Math.random() * 9);
        let c = Math.floor(Math.random() * 9);
        if (newBoard[r][c] !== BLANK) {
            newBoard[r][c] = BLANK;
            count--;
        }
    }
    return { puzzle: newBoard, solution: solved };
};

const fillBox = (board: number[][], row: number, col: number) => {
    let num;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            do {
                num = Math.floor(Math.random() * 9) + 1;
            } while (!isSafeInBox(board, row, col, num));
            board[row + i][col + j] = num;
        }
    }
};

const isSafeInBox = (board: number[][], rowStart: number, colStart: number, num: number) => {
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (board[rowStart + i][colStart + j] === num) return false;
    return true;
};

export const Sudoku: React.FC<SudokuProps> = ({ onBack, lang }) => {
  const [board, setBoard] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [initialMask, setInitialMask] = useState<boolean[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [notes, setNotes] = useState<Set<number>[][]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('easy');
  const [showTutorial, setShowTutorial] = useState(false);
  const [coachTip, setCoachTip] = useState("");

  const newGame = (diff: 'easy' | 'medium' | 'hard') => {
      const { puzzle, solution } = generateSudoku(diff);
      setBoard(puzzle.map(r => [...r]));
      setSolution(solution);
      setInitialMask(puzzle.map(r => r.map(c => c !== 0)));
      setNotes(Array(9).fill(0).map(() => Array(9).fill(0).map(() => new Set<number>())));
      setMistakes(0);
      setIsComplete(false);
      setDifficulty(diff);
      playSound.click();
  };

  useEffect(() => {
      newGame('easy');
      setShowTutorial(true);
  }, []);

  const handleInput = (num: number) => {
      if (!selectedCell || isComplete) return;
      const { r, c } = selectedCell;
      if (initialMask[r][c]) return;

      if (noteMode) {
          playSound.click();
          setNotes(prev => {
              const newNotes = prev.map(row => [...row]);
              const cellNotes = new Set(prev[r][c]);
              if (cellNotes.has(num)) cellNotes.delete(num);
              else cellNotes.add(num);
              newNotes[r][c] = cellNotes;
              return newNotes;
          });
      } else {
          // Check validity immediately
          if (num === solution[r][c]) {
              playSound.pop();
              const newBoard = board.map(row => [...row]);
              newBoard[r][c] = num;
              setBoard(newBoard);
              
              // Check completion
              let filled = true;
              for(let i=0; i<9; i++) for(let j=0; j<9; j++) if(newBoard[i][j] === 0) filled = false;
              
              if (filled) {
                  setIsComplete(true);
                  playSound.win();
              }
          } else {
              playSound.lose();
              setMistakes(m => m + 1);
          }
      }
  };

  const getHint = async () => {
    setCoachTip(t(lang, 'thinking'));
    const tip = await getGameCoachTip("Sudoku", "Player needs help finding the next logic step", lang);
    setCoachTip(tip);
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-lg mx-auto">
      <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Sudoku"
          rules={tRules(lang, 'sudokuRules')}
      />

      <div className="flex justify-between items-center w-full mb-2 px-2">
         <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">← {t(lang, 'back')}</button>
         <div className="flex gap-2">
             <button onClick={() => newGame('easy')} className={`text-xs px-2 py-1 rounded ${difficulty === 'easy' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>{t(lang, 'easy')}</button>
             <button onClick={() => newGame('medium')} className={`text-xs px-2 py-1 rounded ${difficulty === 'medium' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>{t(lang, 'medium')}</button>
             <button onClick={() => newGame('hard')} className={`text-xs px-2 py-1 rounded ${difficulty === 'hard' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>{t(lang, 'hard')}</button>
         </div>
      </div>

      <div className="mb-2 flex justify-between w-full px-4 text-sm font-bold text-gray-600">
          <span>{t(lang, 'penalty')}: {mistakes}/3</span>
          <button onClick={getHint} className="text-indigo-500 hover:underline">💡 {t(lang, 'hint')}</button>
      </div>

      {coachTip && <div className="text-xs text-indigo-500 mb-2 italic animate-fadeIn bg-indigo-50 px-2 py-1 rounded">{coachTip}</div>}

      {/* Board */}
      <div className="bg-black p-1 rounded-lg shadow-xl select-none">
          <div className="grid grid-cols-9 gap-[1px] bg-gray-400 border-2 border-gray-800">
              {board.map((row, r) => row.map((val, c) => {
                  const isInitial = initialMask[r] && initialMask[r][c];
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  const isRelated = selectedCell && (selectedCell.r === r || selectedCell.c === c || (Math.floor(selectedCell.r/3) === Math.floor(r/3) && Math.floor(selectedCell.c/3) === Math.floor(c/3)));
                  
                  // Borders for 3x3
                  const borderR = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-gray-800' : '';
                  const borderB = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-gray-800' : '';

                  return (
                      <div 
                          key={`${r}-${c}`}
                          onClick={() => { setSelectedCell({r, c}); playSound.click(); }}
                          className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center cursor-pointer bg-white relative
                             ${borderR} ${borderB}
                             ${isSelected ? '!bg-indigo-200' : isRelated ? '!bg-indigo-50' : ''}
                             ${val !== 0 && !isInitial ? 'text-indigo-600' : ''}
                             ${isInitial ? 'font-bold text-black' : ''}
                          `}
                      >
                          {val !== 0 ? val : (
                              // Notes
                              <div className="grid grid-cols-3 w-full h-full text-[8px] text-gray-500 leading-none">
                                  {[1,2,3,4,5,6,7,8,9].map(n => (
                                      <div key={n} className="flex items-center justify-center">
                                          {notes[r] && notes[r][c].has(n) ? n : ''}
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  )
              }))}
          </div>
      </div>

      {/* Controls */}
      <div className="mt-4 w-full px-2">
          <div className="flex justify-between mb-2">
              <button 
                onClick={() => setNoteMode(!noteMode)} 
                className={`flex-1 py-2 rounded-lg font-bold text-sm mr-2 border transition-colors ${noteMode ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                  ✏️ {t(lang, 'noteMode')} {noteMode ? 'ON' : 'OFF'}
              </button>
              <button 
                 onClick={() => { if(selectedCell && !initialMask[selectedCell.r][selectedCell.c]) { const newBoard = [...board]; newBoard[selectedCell.r][selectedCell.c] = 0; setBoard(newBoard); } }}
                 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm"
              >
                  {t(lang, 'erase')}
              </button>
          </div>
          <div className="grid grid-cols-9 gap-1 sm:gap-2">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button 
                    key={n}
                    onClick={() => handleInput(n)}
                    className="aspect-square bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg font-bold text-lg sm:text-xl shadow-sm transition-transform active:scale-95"
                  >
                      {n}
                  </button>
              ))}
          </div>
      </div>
      
      {isComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn">
              <div className="bg-white p-6 rounded-2xl text-center">
                  <h2 className="text-3xl font-bold text-green-500 mb-4">{t(lang, 'solved')}</h2>
                  <button onClick={() => newGame(difficulty)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
                      {t(lang, 'playAgain')}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};