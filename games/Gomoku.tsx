import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Move, GameMode, Difficulty, Language, GameType } from '../types';
import { getStrategyMove, getGameCoachTip } from '../services/geminiService';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';

const GRID_SIZE = 15;
const TURN_TIME_LIMIT = 30; // seconds

interface GomokuProps {
  onBack: () => void;
  lang: Language;
}

interface GameHistoryState {
  grid: number[][];
  currentPlayer: Player;
  lastMove: Move | null;
  winner: Player | null;
}

export const Gomoku: React.FC<GomokuProps> = ({ onBack, lang }) => {
  // Game Setup State
  const [setupMode, setSetupMode] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SINGLE_PLAYER);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  // Game Play State
  const [grid, setGrid] = useState<number[][]>(() => 
    Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.USER);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isThinking, setIsThinking] = useState(false); // AI or Remote Opponent
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [coachTip, setCoachTip] = useState<string>("");
  const [hintMove, setHintMove] = useState<Move | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // History State
  const [history, setHistory] = useState<GameHistoryState[]>([]);
  const [historyStep, setHistoryStep] = useState(0);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(TURN_TIME_LIMIT);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Tip
  useEffect(() => {
    setCoachTip(lang === 'zh' ? "五子连珠，胜券在握！" : "Place 5 in a row to win!");
  }, [lang]);

  // Reset timer on turn change
  useEffect(() => {
    if (winner || setupMode || isMatchmaking) return;

    setTimeLeft(TURN_TIME_LIMIT);
    
    // Clear existing timer
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, winner, setupMode, isMatchmaking]);

  // Initialize history
  useEffect(() => {
    if (!setupMode && history.length === 0) {
      const initialState: GameHistoryState = {
        grid: Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)),
        currentPlayer: Player.USER,
        lastMove: null,
        winner: null,
      };
      setHistory([initialState]);
      setHistoryStep(0);
    }
  }, [setupMode]);

  const saveToHistory = (newGrid: number[][], nextPlayer: Player, move: Move, win: Player | null) => {
    const newState: GameHistoryState = {
      grid: newGrid,
      currentPlayer: nextPlayer,
      lastMove: move,
      winner: win,
    };

    // Remove future history if we are in the middle (for redo)
    const currentHistory = history.slice(0, historyStep + 1);
    
    // Limit to last 5 moves (+1 for initial state)
    let newHistory = [...currentHistory, newState];
    if (newHistory.length > 6) {
      newHistory = newHistory.slice(newHistory.length - 6);
    }

    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0 && !isThinking) {
      playSound.click();
      const prevStep = historyStep - 1;
      const state = history[prevStep];
      setGrid(state.grid);
      setCurrentPlayer(state.currentPlayer);
      setLastMove(state.lastMove);
      setWinner(state.winner);
      setHistoryStep(prevStep);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1 && !isThinking) {
      playSound.click();
      const nextStep = historyStep + 1;
      const state = history[nextStep];
      setGrid(state.grid);
      setCurrentPlayer(state.currentPlayer);
      setLastMove(state.lastMove);
      setWinner(state.winner);
      setHistoryStep(nextStep);
    }
  };

  const handleTimeout = () => {
    playSound.lose();
    setCoachTip(t(lang, 'timeUp'));
    const nextPlayer = currentPlayer === Player.USER ? Player.AI : Player.USER;
    setCurrentPlayer(nextPlayer);
    
    // If it switched to AI, trigger AI
    if ((gameMode === GameMode.SINGLE_PLAYER || gameMode === GameMode.ONLINE_MULTI) && nextPlayer === Player.AI) {
      setIsThinking(true);
    }
  };

  const checkWin = useCallback((board: number[][], player: Player, lastMove: Move): boolean => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];
    const { row, col } = lastMove;
    for (const [dr, dc] of directions) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || board[r][c] !== player) break;
        count++;
      }
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE || board[r][c] !== player) break;
        count++;
      }
      if (count >= 5) return true;
    }
    return false;
  }, []);

  const handleCellClick = async (r: number, c: number) => {
    if (grid[r][c] !== Player.NONE || winner) return;
    if (gameMode === GameMode.SINGLE_PLAYER && currentPlayer === Player.AI) return;
    if (gameMode === GameMode.ONLINE_MULTI && currentPlayer === Player.AI) return;

    playSound.move();

    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = currentPlayer;
    const move = { row: r, col: c };
    
    // Determine result first
    let win: Player | null = null;
    if (checkWin(newGrid, currentPlayer, move)) {
      win = currentPlayer;
      playSound.win();
    }

    const nextPlayer = currentPlayer === Player.USER ? Player.AI : Player.USER;

    // Update state
    setGrid(newGrid);
    setLastMove(move);
    setHintMove(null);
    if (win) setWinner(win);
    else setCurrentPlayer(nextPlayer);

    // Save to history
    saveToHistory(newGrid, win ? currentPlayer : nextPlayer, move, win);

    // Trigger AI Move
    if (!win && (gameMode === GameMode.SINGLE_PLAYER || gameMode === GameMode.ONLINE_MULTI) && nextPlayer === Player.AI) {
      setIsThinking(true);
    }
  };

  // AI / Remote Opponent Logic
  useEffect(() => {
    if ((gameMode === GameMode.SINGLE_PLAYER || gameMode === GameMode.ONLINE_MULTI) && currentPlayer === Player.AI && !winner && !setupMode && !isMatchmaking) {
      const makeAIMove = async () => {
        try {
          const move = await getStrategyMove(grid, GameType.GOMOKU, difficulty);
          
          let aiWin: Player | null = null;
          let nextP = Player.USER;

          // Compute new state
          const newGrid = grid.map(row => [...row]);
          newGrid[move.row][move.col] = Player.AI;
          
          if (checkWin(newGrid, Player.AI, move)) {
            aiWin = Player.AI;
            playSound.lose();
            nextP = Player.AI; // Game over, keep AI as current
          } else {
             nextP = Player.USER;
          }

          setGrid(newGrid);
          setLastMove(move);
          if (aiWin) setWinner(aiWin);
          else setCurrentPlayer(nextP);
          playSound.pop();

          saveToHistory(newGrid, nextP, move, aiWin);

        } catch (e) {
          console.error("AI Error", e);
          setCurrentPlayer(Player.USER);
        } finally {
          setIsThinking(false);
        }
      };
      
      const delay = gameMode === GameMode.ONLINE_MULTI ? 2000 : 500;
      const timer = setTimeout(makeAIMove, delay);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, winner, setupMode, isMatchmaking]);

  // Coach Tip Logic (Win/Loss)
  useEffect(() => {
    if (winner === Player.USER) setCoachTip(t(lang, 'victory'));
    else if (winner === Player.AI) setCoachTip(gameMode === GameMode.LOCAL_MULTI ? t(lang, 'p2Win') : t(lang, 'defeat'));
  }, [winner, lang, gameMode]);

  const requestHint = async () => {
    if (winner || isThinking || isLoadingHint || (gameMode !== GameMode.LOCAL_MULTI && currentPlayer === Player.AI)) return;
    setIsLoadingHint(true);
    setCoachTip(t(lang, 'thinking'));
    try {
      const suggestedMove = await getStrategyMove(grid, GameType.GOMOKU, Difficulty.HARD);
      setHintMove(suggestedMove);
      const tipText = await getGameCoachTip("Gomoku", "Player needs a suggestion", lang);
      setCoachTip(tipText);
      playSound.flip();
    } catch (e) { console.error(e); } finally { setIsLoadingHint(false); }
  };

  const startMatchmaking = () => {
    setGameMode(GameMode.ONLINE_MULTI);
    setIsMatchmaking(true);
    setSetupMode(false);
    setTimeout(() => {
      setIsMatchmaking(false);
      setCoachTip(t(lang, 'matchFound'));
      playSound.match();
    }, 3000);
  };

  const startGame = (mode: GameMode) => {
    playSound.click();
    setGameMode(mode);
    setHistory([]);
    setHistoryStep(0);
    if (mode === GameMode.ONLINE_MULTI) startMatchmaking();
    else setSetupMode(false);
  };

  if (setupMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto animate-fadeIn">
        <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} lang={lang} title="Gomoku" rules={tRules(lang, 'gomokuRules')} />
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Gomoku Setup</h2>
        <div className="w-full space-y-4">
          <button onClick={() => { setGameMode(GameMode.SINGLE_PLAYER); playSound.click(); }} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${gameMode === GameMode.SINGLE_PLAYER ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <span className="font-bold text-gray-700">{t(lang, 'singlePlayer')}</span><span className="text-2xl">🤖</span>
          </button>
          <button onClick={() => { setGameMode(GameMode.LOCAL_MULTI); playSound.click(); }} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${gameMode === GameMode.LOCAL_MULTI ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <span className="font-bold text-gray-700">{t(lang, 'localMulti')}</span><span className="text-2xl">👥</span>
          </button>
          <button onClick={() => { setGameMode(GameMode.ONLINE_MULTI); playSound.click(); }} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${gameMode === GameMode.ONLINE_MULTI ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
             <div className="text-left"><span className="font-bold text-gray-700 block">{t(lang, 'onlineMulti')}</span><span className="text-xs text-gray-400">Matchmaking Server (Sim)</span></div><span className="text-2xl">🌍</span>
          </button>
        </div>
        {(gameMode === GameMode.SINGLE_PLAYER || gameMode === GameMode.ONLINE_MULTI) && (
          <div className="w-full mt-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase">{t(lang, 'difficulty')}</h3>
            <div className="flex gap-2">
               {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((d) => (
                 <button key={d} onClick={() => { setDifficulty(d); playSound.click(); }} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${difficulty === d ? 'bg-slate-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>{t(lang, d === Difficulty.EASY ? 'easy' : d === Difficulty.MEDIUM ? 'medium' : 'hard')}</button>
               ))}
            </div>
          </div>
        )}
        <div className="w-full mt-8 flex gap-3">
           <button onClick={() => { onBack(); playSound.click(); }} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300">{t(lang, 'back')}</button>
           <button onClick={() => { setShowTutorial(true); playSound.click(); }} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200">{t(lang, 'tutorial')}</button>
        </div>
        <button onClick={() => startGame(gameMode)} className="w-full mt-3 py-4 bg-slate-800 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-700 hover:scale-[1.02] transition-all">{t(lang, 'startGame')}</button>
      </div>
    );
  }

  if (isMatchmaking) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full animate-fadeIn">
        <div className="relative w-24 h-24 mb-6">
           <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
           <span className="absolute inset-0 flex items-center justify-center text-3xl">🌍</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t(lang, 'searching')}</h2>
        <p className="text-gray-500 text-sm">{t(lang, 'connecting')}</p>
        <button onClick={() => setIsMatchmaking(false)} className="mt-8 text-red-500 text-sm hover:underline">Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full w-full max-w-2xl mx-auto">
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} lang={lang} title="Gomoku" rules={tRules(lang, 'gomokuRules')} />

      <div className="flex justify-between items-center w-full mb-4 px-4">
        <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">← {t(lang, 'back')}</button>
        <div className="flex gap-2 items-center">
          {!winner && !isThinking && (
             <button onClick={requestHint} disabled={isLoadingHint} className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-bold shadow-sm"><span>💡</span>{t(lang, 'hint')}</button>
          )}
          <button onClick={() => { setShowTutorial(true); playSound.click(); }} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">?</button>
        </div>
      </div>

      <div className="w-full bg-slate-800 text-white p-4 rounded-xl mb-6 shadow-lg flex flex-col items-center transition-all duration-300 relative overflow-hidden">
         {!winner && (
            <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / TURN_TIME_LIMIT) * 100}%` }}></div>
         )}
         {winner ? (
           <div className="text-2xl font-bold animate-bounce text-center">
             {winner === Player.USER ? t(lang, gameMode === GameMode.LOCAL_MULTI ? 'p1Win' : 'victory') : t(lang, gameMode === GameMode.LOCAL_MULTI ? 'p2Win' : 'aiWin')}
           </div>
         ) : (
           <div className="flex items-center gap-3 w-full justify-between px-4">
             <div className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${currentPlayer === Player.USER ? 'bg-slate-700 ring-1 ring-slate-500 scale-105' : 'opacity-50'}`}>
               <div className="w-3 h-3 rounded-full bg-black border border-white"></div>
               <div className="flex flex-col items-start">
                   <span className="font-medium text-sm">{gameMode === GameMode.LOCAL_MULTI ? t(lang, 'player1') : t(lang, 'you')}</span>
                   {currentPlayer === Player.USER && <span className={`text-xs ${timeLeft < 10 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>{timeLeft}s</span>}
               </div>
             </div>
             <div className="text-slate-500 text-xs font-mono">VS</div>
             <div className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${currentPlayer === Player.AI ? 'bg-slate-700 ring-1 ring-slate-500 scale-105' : 'opacity-50'}`}>
               <div className="flex flex-col items-end">
                   <span className="font-medium text-sm">{isThinking ? t(lang, 'thinking') : (gameMode === GameMode.LOCAL_MULTI ? t(lang, 'player2') : gameMode === GameMode.ONLINE_MULTI ? t(lang, 'opponent') : t(lang, 'ai'))}</span>
                   {currentPlayer === Player.AI && <span className={`text-xs ${timeLeft < 10 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>{timeLeft}s</span>}
               </div>
               <div className="w-3 h-3 rounded-full bg-white"></div>
             </div>
           </div>
         )}
         <div className="mt-3 text-xs text-slate-300 italic text-center max-w-sm bg-slate-700/50 px-3 py-1 rounded-full">
           {isLoadingHint ? <span className="animate-pulse">Analyzing...</span> : `"${coachTip}"`}
         </div>
      </div>

      <div className="bg-[#eecfa1] p-2 sm:p-4 rounded-lg shadow-2xl border-4 border-[#dcb386] relative">
        <div className="grid gap-[1px] bg-[#dcb386]" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
          {grid.map((row, r) => (
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                disabled={cell !== 0 || !!winner || (currentPlayer === Player.AI && gameMode !== GameMode.LOCAL_MULTI)}
                className="w-5 h-5 sm:w-8 sm:h-8 bg-[#eecfa1] relative flex items-center justify-center hover:bg-[#e4c290] transition-colors disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-[1px] bg-[#8b5a2b] absolute"></div>
                  <div className="h-full w-[1px] bg-[#8b5a2b] absolute"></div>
                </div>
                {hintMove && hintMove.row === r && hintMove.col === c && !cell && (
                  <>
                  <div className="absolute w-[60%] h-[60%] border-2 border-dashed border-blue-500 rounded-full animate-ping z-0"></div>
                  <div className="absolute w-[40%] h-[40%] bg-blue-500/30 rounded-full z-0"></div>
                  </>
                )}
                {cell === Player.USER && <div className="w-[80%] h-[80%] bg-black rounded-full shadow-sm z-10 animate-scaleIn"><div className="w-[30%] h-[30%] bg-gray-700 rounded-full ml-[20%] mt-[20%] opacity-50"></div></div>}
                {cell === Player.AI && <div className="w-[80%] h-[80%] bg-white rounded-full shadow-sm z-10 border border-gray-300 animate-scaleIn"><div className="w-[30%] h-[30%] bg-white rounded-full ml-[15%] mt-[15%] opacity-80 shadow-inner"></div></div>}
                {lastMove?.row === r && lastMove?.col === c && <div className="absolute w-2 h-2 bg-red-500 rounded-full z-20 animate-ping"></div>}
              </button>
            ))
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-4 w-full justify-between max-w-sm px-4">
         <div className="flex gap-2">
            <button 
              onClick={handleUndo} 
              disabled={historyStep <= 0 || isThinking || !!winner}
              className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm"
            >
              ⟲ {t(lang, 'undo')}
            </button>
            <button 
              onClick={handleRedo} 
              disabled={historyStep >= history.length - 1 || isThinking || !!winner}
              className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm"
            >
              ⟳ {t(lang, 'redo')}
            </button>
         </div>

         <div className="flex gap-2">
          <button onClick={() => { playSound.click(); setSetupMode(true); }} className="text-gray-500 hover:text-gray-800 underline text-sm">Menu</button>
          <span className="text-gray-300">|</span>
          <button 
            onClick={() => {
              playSound.click();
              setGrid(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)));
              setWinner(null);
              setCurrentPlayer(Player.USER);
              setLastMove(null);
              setCoachTip("");
              setHintMove(null);
              setHistory([]);
              setHistoryStep(0);
            }}
            className="text-gray-500 hover:text-gray-800 underline text-sm"
          >
            {t(lang, 'reset')}
          </button>
         </div>
      </div>
    </div>
  );
};