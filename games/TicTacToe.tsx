import React, { useState, useEffect } from 'react';
import { Language, Player } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';

interface TicTacToeProps {
  onBack: () => void;
  lang: Language;
}

export const TicTacToe: React.FC<TicTacToeProps> = ({ onBack, lang }) => {
  const [board, setBoard] = useState<number[]>(Array(9).fill(0));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    setShowTutorial(true);
  }, []);

  const checkWinner = (squares: number[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 3, 6], [1, 4, 7], [2, 5, 8], 
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a] === Player.USER ? Player.USER : Player.AI;
      }
    }
    if (squares.every(s => s !== 0)) return 'DRAW';
    return null;
  };

  // Minimax Algorithm for Unbeatable AI
  const minimax = (squares: number[], depth: number, isMaximizing: boolean): number => {
      const result = checkWinner(squares);
      if (result === Player.AI) return 10 - depth;
      if (result === Player.USER) return depth - 10;
      if (result === 'DRAW') return 0;

      if (isMaximizing) {
          let bestScore = -Infinity;
          for (let i = 0; i < 9; i++) {
              if (squares[i] === 0) {
                  squares[i] = Player.AI;
                  const score = minimax(squares, depth + 1, false);
                  squares[i] = 0;
                  bestScore = Math.max(score, bestScore);
              }
          }
          return bestScore;
      } else {
          let bestScore = Infinity;
          for (let i = 0; i < 9; i++) {
              if (squares[i] === 0) {
                  squares[i] = Player.USER;
                  const score = minimax(squares, depth + 1, true);
                  squares[i] = 0;
                  bestScore = Math.min(score, bestScore);
              }
          }
          return bestScore;
      }
  };

  const getBestMove = (squares: number[]) => {
      let bestScore = -Infinity;
      let move = -1;
      for (let i = 0; i < 9; i++) {
          if (squares[i] === 0) {
              squares[i] = Player.AI;
              const score = minimax(squares, 0, false);
              squares[i] = 0;
              if (score > bestScore) {
                  bestScore = score;
                  move = i;
              }
          }
      }
      return move;
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      setThinking(true);
      const timer = setTimeout(() => {
        const move = getBestMove(board);
        if (move !== -1) {
            const newBoard = [...board];
            newBoard[move] = Player.AI;
            setBoard(newBoard);
            const w = checkWinner(newBoard);
            setWinner(w);
            setIsPlayerTurn(true);
            playSound.pop();
            if (w) {
                 if (w === Player.AI) playSound.lose();
                 else playSound.win(); // Should be impossible for Minimax
            }
        }
        setThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, board]);

  const handleClick = (i: number) => {
    if (board[i] !== 0 || winner || !isPlayerTurn) return;
    
    playSound.click();
    const newBoard = [...board];
    newBoard[i] = Player.USER;
    setBoard(newBoard);
    
    const w = checkWinner(newBoard);
    if (w) {
        setWinner(w);
        if (w === Player.USER) playSound.win();
        else if (w === 'DRAW') playSound.lose();
    } else {
        setIsPlayerTurn(false);
    }
  };

  const resetGame = () => {
      setBoard(Array(9).fill(0));
      setWinner(null);
      setIsPlayerTurn(true);
      playSound.click();
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-md mx-auto">
      <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Tic Tac Toe"
          rules={tRules(lang, 'tictactoeRules')}
      />

      <div className="flex justify-between items-center w-full mb-8 px-4">
         <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">← {t(lang, 'back')}</button>
         <button onClick={() => setShowTutorial(true)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">?</button>
      </div>

      <div className="mb-6 text-center h-10">
          {winner ? (
              <h2 className="text-3xl font-bold animate-bounce text-slate-800">
                  {winner === 'DRAW' ? t(lang, 'draw') : winner === Player.USER ? t(lang, 'victory') : t(lang, 'aiWin')}
              </h2>
          ) : (
              <h2 className="text-xl font-bold text-gray-600 flex items-center gap-2 justify-center">
                  {thinking ? <><span className="animate-spin">⏳</span> {t(lang, 'thinking')}</> : (isPlayerTurn ? t(lang, 'you') + " (X)" : t(lang, 'ai') + " (O)")}
              </h2>
          )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-xl border-4 border-orange-200">
          <div className="grid grid-cols-3 gap-2">
              {board.map((cell, i) => (
                  <button 
                      key={i} 
                      onClick={() => handleClick(i)}
                      className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-50 rounded-lg text-4xl sm:text-6xl font-black flex items-center justify-center hover:bg-orange-100 transition-colors"
                  >
                      {cell === Player.USER && <span className="text-blue-500 animate-scaleIn">X</span>}
                      {cell === Player.AI && <span className="text-red-500 animate-scaleIn">O</span>}
                  </button>
              ))}
          </div>
      </div>

      <button onClick={resetGame} className="mt-8 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:bg-slate-700 hover:scale-105 transition-all">
          {t(lang, 'reset')}
      </button>
    </div>
  );
};