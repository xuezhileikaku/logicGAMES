import React, { useState, useEffect } from 'react';
import { Player, Move, GameMode, Difficulty, Language, GameType } from '../types';
import { getStrategyMove, getGameCoachTip } from '../services/geminiService';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';
import { applyGoMove } from '../utils/goLogic';

const GRID_SIZE = 15;

interface GoProps {
  onBack: () => void;
  lang: Language;
}

export const GoGame: React.FC<GoProps> = ({ onBack, lang }) => {
  const [setupMode, setSetupMode] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.SINGLE_PLAYER);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  const [grid, setGrid] = useState<number[][]>(() => 
    Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.USER);
  const [isThinking, setIsThinking] = useState(false);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [coachTip, setCoachTip] = useState<string>("");
  const [capturedCounts, setCapturedCounts] = useState<{ [key in Player]: number }>({ [Player.USER]: 0, [Player.AI]: 0 });
  
  // Go specific states
  const [passCount, setPassCount] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    setCoachTip(lang === 'zh' ? "围地吃子，步步为营。" : "Surround territory and capture stones.");
  }, [lang]);

  const endGame = () => {
    setGameEnded(true);
    playSound.win(); // Sound to indicate game end
  };

  const calculateScore = (player: Player) => {
    let stonesOnBoard = 0;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] === player) stonesOnBoard++;
      }
    }
    // Note: This matches the user's requested simplified scoring logic (Stones + Captures).
    return stonesOnBoard + capturedCounts[player];
  };

  const handleCellClick = async (r: number, c: number) => {
    if (grid[r][c] !== Player.NONE || isThinking || gameEnded) return;
    if (gameMode === GameMode.SINGLE_PLAYER && currentPlayer === Player.AI) return;

    // Apply Move Logic (check liberties, capture, suicide)
    const { board: nextBoard, invalid, captured } = applyGoMove(grid, r, c, currentPlayer);
    
    if (invalid) {
      playSound.lose(); // Error sound
      return;
    }

    playSound.move();
    if (captured > 0) {
      playSound.eat();
      setCapturedCounts(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + captured }));
    }

    setGrid(nextBoard);
    setLastMove({ row: r, col: c });
    setPassCount(0); // Reset pass count on valid move

    // Switch Player
    const nextPlayer = currentPlayer === Player.USER ? Player.AI : Player.USER;
    setCurrentPlayer(nextPlayer);

    if ((gameMode === GameMode.SINGLE_PLAYER || gameMode === GameMode.ONLINE_MULTI) && nextPlayer === Player.AI) {
      setIsThinking(true);
    }
  };

  const handlePass = () => {
    playSound.click();
    const newPassCount = passCount + 1;
    setPassCount(newPassCount);
    
    if (newPassCount >= 2) {
      endGame();
      return;
    }

    const nextPlayer = currentPlayer === Player.USER ? Player.AI : Player.USER;
    setCurrentPlayer(nextPlayer);
    setCoachTip(t(lang, 'opponent') + " " + t(lang, 'pass'));
    
    if ((gameMode === GameMode.SINGLE_PLAYER || gameMode === GameMode.ONLINE_MULTI) && nextPlayer === Player.AI) {
      setIsThinking(true);
    }
  };

  useEffect(() => {
    if ((gameMode === GameMode.SINGLE_PLAYER || gameMode === GameMode.ONLINE_MULTI) && currentPlayer === Player.AI && !setupMode && !isMatchmaking && !gameEnded) {
      const makeAIMove = async () => {
        try {
          const move = await getStrategyMove(grid, GameType.GO, difficulty);
          
          // AI Logic Application
          const { board: nextBoard, invalid, captured } = applyGoMove(grid, move.row, move.col, Player.AI);
          
          if (!invalid) {
            setGrid(nextBoard);
            setLastMove(move);
            setPassCount(0);
            playSound.pop();
             if (captured > 0) {
                playSound.eat();
                setCapturedCounts(prev => ({ ...prev, [Player.AI]: prev[Player.AI] + captured }));
            }
          } else {
             // AI decides to pass (or invalid move treated as pass fallback)
             const newPassCount = passCount + 1;
             setPassCount(newPassCount);
             setCoachTip("AI " + t(lang, 'pass'));
             if (newPassCount >= 2) {
                endGame();
                return;
             }
          }
          setCurrentPlayer(Player.USER);
        } catch (e) {
          setCurrentPlayer(Player.USER);
        } finally {
          setIsThinking(false);
        }
      };
      
      const timer = setTimeout(makeAIMove, 1000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, setupMode, isMatchmaking, gameEnded]);

   // Mock Matchmaking
  const startMatchmaking = () => {
    setGameMode(GameMode.ONLINE_MULTI);
    setIsMatchmaking(true);
    setSetupMode(false);
    
    setTimeout(() => {
      setIsMatchmaking(false);
      setCoachTip(t(lang, 'matchFound'));
      playSound.match();
    }, 2000);
  };

  const startGame = (mode: GameMode) => {
    playSound.click();
    setGameMode(mode);
    setCapturedCounts({ [Player.USER]: 0, [Player.AI]: 0 });
    setPassCount(0);
    setGameEnded(false);
    if (mode === GameMode.ONLINE_MULTI) {
      startMatchmaking();
    } else {
      setSetupMode(false);
    }
  };

  if (setupMode) {
     return (
      <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto animate-fadeIn">
        <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Go (Weiqi)"
          rules={tRules(lang, 'goRules')}
        />

        <h2 className="text-2xl font-bold mb-6 text-gray-800">Go Setup</h2>
        
        <div className="w-full space-y-4">
          <button onClick={() => { setGameMode(GameMode.SINGLE_PLAYER); playSound.click(); }} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${gameMode === GameMode.SINGLE_PLAYER ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <span className="font-bold text-gray-700">{t(lang, 'singlePlayer')}</span>
            <span className="text-2xl">🤖</span>
          </button>
          
          <button onClick={() => { setGameMode(GameMode.LOCAL_MULTI); playSound.click(); }} className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${gameMode === GameMode.LOCAL_MULTI ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
            <span className="font-bold text-gray-700">{t(lang, 'localMulti')}</span>
            <span className="text-2xl">👥</span>
          </button>
        </div>

        {(gameMode === GameMode.SINGLE_PLAYER) && (
          <div className="w-full mt-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase">{t(lang, 'difficulty')}</h3>
            <div className="flex gap-2">
               {[Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD].map((d) => (
                 <button 
                  key={d}
                  onClick={() => { setDifficulty(d); playSound.click(); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${difficulty === d ? 'bg-slate-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                 >
                   {t(lang, d === Difficulty.EASY ? 'easy' : d === Difficulty.MEDIUM ? 'medium' : 'hard')}
                 </button>
               ))}
            </div>
          </div>
        )}

        <div className="w-full mt-8 flex gap-3">
           <button onClick={() => { onBack(); playSound.click(); }} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300">
             {t(lang, 'back')}
           </button>
           <button onClick={() => { setShowTutorial(true); playSound.click(); }} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200">
             {t(lang, 'tutorial')}
           </button>
        </div>
        
        <button onClick={() => startGame(gameMode)} className="w-full mt-3 py-4 bg-slate-800 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-700 hover:scale-[1.02] transition-all">
           {t(lang, 'startGame')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full w-full max-w-2xl mx-auto">
       <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Go (Weiqi)"
          rules={tRules(lang, 'goRules')}
      />
      <div className="flex justify-between items-center w-full mb-4 px-4">
        <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">← {t(lang, 'back')}</button>
         <div className="flex gap-2">
          <button onClick={() => { setShowTutorial(true); playSound.click(); }} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">?</button>
        </div>
      </div>

       <div className="w-full bg-slate-800 text-white p-4 rounded-xl mb-6 shadow-lg flex flex-col items-center">
         <div className="flex justify-between w-full px-8 mb-2">
            <div className="text-center">
              <span className="block text-xs text-gray-400">Black (P1)</span>
              <span className="text-xl font-bold">{capturedCounts[Player.USER]}</span>
              <span className="text-xs text-gray-500">{t(lang, 'captures')}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs text-gray-400">White (AI/P2)</span>
              <span className="text-xl font-bold">{capturedCounts[Player.AI]}</span>
              <span className="text-xs text-gray-500">{t(lang, 'captures')}</span>
            </div>
         </div>
         <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${currentPlayer === Player.USER ? 'bg-slate-700 ring-1 ring-slate-500 scale-105' : 'opacity-50'}`}>
               <div className="w-3 h-3 rounded-full bg-black border border-white"></div>
               <span className="font-medium">{gameMode === GameMode.LOCAL_MULTI ? t(lang, 'player1') : t(lang, 'you')}</span>
             </div>
             <div className="text-slate-500 text-xs">VS</div>
             <div className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${currentPlayer === Player.AI ? 'bg-slate-700 ring-1 ring-slate-500 scale-105' : 'opacity-50'}`}>
               <div className="w-3 h-3 rounded-full bg-white"></div>
               <span className="font-medium">
                 {isThinking ? t(lang, 'thinking') : (gameMode === GameMode.LOCAL_MULTI ? t(lang, 'player2') : t(lang, 'ai'))}
               </span>
             </div>
           </div>
           <div className="mt-2 text-xs text-slate-400 italic text-center max-w-sm">"{coachTip}"</div>
       </div>

       {gameEnded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform scale-100">
               <h2 className="text-2xl font-bold text-gray-800 mb-4">{t(lang, 'gameEnded')}</h2>
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-gray-100 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-600 mb-2">Black (P1)</h3>
                    <div className="text-xs text-gray-500 flex justify-between"><span>{t(lang, 'stones')}:</span> <span>{grid.flat().filter(c => c === Player.USER).length}</span></div>
                    <div className="text-xs text-gray-500 flex justify-between"><span>{t(lang, 'captures')}:</span> <span>{capturedCounts[Player.USER]}</span></div>
                    <div className="mt-2 pt-2 border-t border-gray-300 text-xl font-bold text-gray-800">{calculateScore(Player.USER)}</div>
                 </div>
                 <div className="bg-slate-800 text-white p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-gray-300 mb-2">White (P2)</h3>
                    <div className="text-xs text-gray-400 flex justify-between"><span>{t(lang, 'stones')}:</span> <span>{grid.flat().filter(c => c === Player.AI).length}</span></div>
                    <div className="text-xs text-gray-400 flex justify-between"><span>{t(lang, 'captures')}:</span> <span>{capturedCounts[Player.AI]}</span></div>
                    <div className="mt-2 pt-2 border-t border-gray-600 text-xl font-bold">{calculateScore(Player.AI)}</div>
                 </div>
               </div>
               
               <div className="text-lg font-bold text-blue-600 mb-6">
                  {calculateScore(Player.USER) > calculateScore(Player.AI) ? t(lang, 'p1Win') : calculateScore(Player.USER) < calculateScore(Player.AI) ? t(lang, 'p2Win') : t(lang, 'draw')}
               </div>

               <button 
                  onClick={() => { setGameEnded(false); setGrid(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0))); setCapturedCounts({ [Player.USER]: 0, [Player.AI]: 0 }); setCurrentPlayer(Player.USER); setPassCount(0); }}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
               >
                 {t(lang, 'playAgain')}
               </button>
            </div>
          </div>
       )}

       <div className="bg-[#eecfa1] p-2 sm:p-4 rounded-lg shadow-2xl border-4 border-[#dcb386] relative">
        <div className="grid gap-[1px] bg-[#dcb386]" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
          {grid.map((row, r) => (
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className="w-5 h-5 sm:w-8 sm:h-8 bg-[#eecfa1] relative flex items-center justify-center hover:bg-[#e4c290] transition-colors"
              >
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-[1px] bg-[#8b5a2b] absolute"></div>
                  <div className="h-full w-[1px] bg-[#8b5a2b] absolute"></div>
                </div>
                {cell === Player.USER && (
                  <div className="w-[85%] h-[85%] bg-black rounded-full shadow-sm z-10 animate-scaleIn">
                     <div className="w-[30%] h-[30%] bg-gray-700 rounded-full ml-[20%] mt-[20%] opacity-50"></div>
                  </div>
                )}
                {cell === Player.AI && (
                  <div className="w-[85%] h-[85%] bg-white rounded-full shadow-sm z-10 border border-gray-300 animate-scaleIn">
                    <div className="w-[30%] h-[30%] bg-white rounded-full ml-[15%] mt-[15%] opacity-80 shadow-inner"></div>
                  </div>
                )}
                 {lastMove?.row === r && lastMove?.col === c && (
                  <div className="absolute w-2 h-2 bg-red-500 rounded-full z-20 animate-ping"></div>
                )}
              </button>
            ))
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button 
          onClick={() => {
            playSound.click();
            setGrid(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)));
            setCapturedCounts({[Player.USER]: 0, [Player.AI]: 0});
            setCurrentPlayer(Player.USER);
            setLastMove(null);
            setCoachTip("");
            setPassCount(0);
            setGameEnded(false);
          }}
          className="text-gray-500 hover:text-gray-800 underline text-sm"
        >
          {t(lang, 'reset')}
        </button>
         <span className="text-gray-300">|</span>
        <button onClick={handlePass} disabled={gameEnded} className="text-gray-500 hover:text-gray-800 underline text-sm disabled:opacity-50">{t(lang, 'pass')}</button>
        <span className="text-gray-300">|</span>
        <button 
          onClick={() => { playSound.click(); setSetupMode(true); }}
          className="text-gray-500 hover:text-gray-800 underline text-sm"
        >
          Menu
        </button>
      </div>
    </div>
  );
};