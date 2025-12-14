import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';

const GRID_SIZE = 15;
const INITIAL_SNAKE = [{ r: 7, c: 7 }];
const INITIAL_DIR = { r: 0, c: 1 };

type SpeedMode = 'slow' | 'normal' | 'fast';

const SPEEDS: Record<SpeedMode, number> = {
  slow: 300,
  normal: 200,
  fast: 100
};

interface SnakeProps {
  onBack: () => void;
  lang: Language;
}

export const Snake: React.FC<SnakeProps> = ({ onBack, lang }) => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ r: 3, c: 10 });
  const [direction, setDirection] = useState(INITIAL_DIR);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Setup Mode State
  const [setupMode, setSetupMode] = useState(true);
  const [speedMode, setSpeedMode] = useState<SpeedMode>('normal');

  // Use ref for direction to avoid closure staleness in interval
  const dirRef = useRef(INITIAL_DIR);

  useEffect(() => {
    const stored = localStorage.getItem('snakeHighScore');
    if (stored) setHighScore(parseInt(stored));
    // Don't show tutorial immediately, show setup screen first
  }, []);

  useEffect(() => {
    dirRef.current = direction;
  }, [direction]);

  const generateFood = (currentSnake: {r: number, c: number}[]) => {
    let newFood;
    while (true) {
      newFood = {
        r: Math.floor(Math.random() * GRID_SIZE),
        c: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(seg => seg.r === newFood.r && seg.c === newFood.c);
      if (!isOnSnake) break;
    }
    setFood(newFood);
  };

  const startGame = () => {
    setSetupMode(false);
    resetGame();
  };

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIR);
    dirRef.current = INITIAL_DIR;
    setScore(0);
    setGameOver(false);
    setIsNewRecord(false);
    setIsPlaying(true);
    generateFood(INITIAL_SNAKE);
    playSound.click();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isPlaying) return;
    switch(e.key) {
      case 'ArrowUp': 
        if (dirRef.current.r !== 1) setDirection({ r: -1, c: 0 });
        break;
      case 'ArrowDown': 
        if (dirRef.current.r !== -1) setDirection({ r: 1, c: 0 });
        break;
      case 'ArrowLeft': 
        if (dirRef.current.c !== 1) setDirection({ r: 0, c: -1 });
        break;
      case 'ArrowRight': 
        if (dirRef.current.c !== -1) setDirection({ r: 0, c: 1 });
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver || setupMode) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = prev[0];
        const newHead = {
          r: head.r + dirRef.current.r,
          c: head.c + dirRef.current.c,
        };

        // Check Wall Collision
        if (newHead.r < 0 || newHead.r >= GRID_SIZE || newHead.c < 0 || newHead.c >= GRID_SIZE) {
          endGame();
          return prev;
        }

        // Check Self Collision
        if (prev.some(seg => seg.r === newHead.r && seg.c === newHead.c)) {
           endGame();
          return prev;
        }

        const newSnake = [newHead, ...prev];

        // Check Food
        if (newHead.r === food.r && newHead.c === food.c) {
          const newScore = score + 10;
          setScore(newScore);
          playSound.eat();
          generateFood(newSnake);
        } else {
          newSnake.pop(); // Remove tail
        }

        return newSnake;
      });
    };
    
    const endGame = () => {
        setGameOver(true);
        playSound.lose();
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('snakeHighScore', score.toString());
            setIsNewRecord(true);
            playSound.win(); // Celebrate high score
        }
    }

    const baseSpeed = SPEEDS[speedMode];
    // Speed increases slightly as score goes up, capped at 50ms
    const currentSpeed = Math.max(50, baseSpeed - Math.floor(score / 50) * 10);

    const gameLoop = setInterval(moveSnake, currentSpeed); 
    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, food, score, highScore, setupMode, speedMode]);

  // Render Setup Screen
  if (setupMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto animate-fadeIn">
        <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Snake"
          rules={tRules(lang, 'snakeRules')}
        />
        <div className="text-6xl mb-6">🐍</div>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Snake Setup</h2>
        
        <div className="w-full space-y-4 mb-6">
           <h3 className="text-sm font-semibold text-gray-500 uppercase">{t(lang, 'speed')}</h3>
           <div className="flex gap-2 w-full">
             {(['slow', 'normal', 'fast'] as SpeedMode[]).map((mode) => (
                <button 
                  key={mode}
                  onClick={() => { setSpeedMode(mode); playSound.click(); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    speedMode === mode 
                    ? (mode === 'fast' ? 'bg-red-500 text-white' : mode === 'normal' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white') + ' shadow-lg scale-105' 
                    : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t(lang, mode)}
                </button>
             ))}
           </div>
        </div>

        <div className="w-full flex flex-col gap-3">
           <button onClick={startGame} className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-700 hover:scale-[1.02] transition-all">
             {t(lang, 'startGame')}
           </button>
           
           <div className="flex gap-3">
             <button onClick={() => { onBack(); playSound.click(); }} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300">
               {t(lang, 'back')}
             </button>
             <button onClick={() => { setShowTutorial(true); playSound.click(); }} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200">
               {t(lang, 'tutorial')}
             </button>
           </div>
        </div>
        
        <div className="mt-6 text-gray-400 text-xs">
           {t(lang, 'highScore')}: {highScore}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full w-full max-w-lg mx-auto">
      <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => { setShowTutorial(false); /* Don't reset if in game, just close */ }} 
          lang={lang}
          title="Snake"
          rules={tRules(lang, 'snakeRules')}
      />

      <div className="flex justify-between items-center w-full mb-4 px-2">
        <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
          ← {t(lang, 'back')}
        </button>
        <div className="flex gap-4 items-center">
           <button onClick={() => setShowTutorial(true)} className="text-gray-400 hover:text-gray-600">?</button>
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-gray-500 uppercase tracking-widest">{t(lang, 'highScore')} {highScore}</span>
             <div className="bg-slate-800 text-green-400 font-mono px-4 py-1 rounded-lg text-lg tracking-widest border-2 border-slate-600 shadow-inner">
               {score.toString().padStart(4, '0')}
             </div>
           </div>
        </div>
      </div>

      {gameOver && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-black/80 p-8 rounded-2xl text-center backdrop-blur-sm animate-bounce w-3/4 max-w-sm">
          {isNewRecord && (
             <h3 className="text-yellow-400 font-bold text-xl mb-2 animate-pulse">🏆 {t(lang, 'newRecord')}</h3>
          )}
          <h2 className="text-3xl font-bold text-red-500 mb-2">{t(lang, 'defeat')}</h2>
          <p className="text-white mb-6">{t(lang, 'score')}: {score}</p>
          <div className="space-y-3">
            <button 
              onClick={resetGame}
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg w-full"
            >
              {t(lang, 'playAgain')}
            </button>
            <button 
              onClick={() => setSetupMode(true)}
              className="px-6 py-2 text-gray-300 hover:text-white text-sm underline"
            >
              Menu
            </button>
          </div>
        </div>
      )}

      {/* Game Board */}
      <div className="w-full aspect-square bg-[#9ca3af] p-2 rounded-lg shadow-xl border-4 border-slate-500 relative touch-none">
        <div 
          className="grid gap-px bg-slate-400 w-full h-full"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
          }}
        >
          {Array(GRID_SIZE * GRID_SIZE).fill(0).map((_, i) => {
            const r = Math.floor(i / GRID_SIZE);
            const c = i % GRID_SIZE;
            const isSnake = snake.some(s => s.r === r && s.c === c);
            const isHead = snake[0].r === r && snake[0].c === c;
            const isFood = food.r === r && food.c === c;

            let bgClass = "bg-[#bdc3c7]"; // Empty cell (LCD style gray)
            if (isHead) bgClass = "bg-green-600";
            else if (isSnake) bgClass = "bg-green-500";
            else if (isFood) bgClass = "bg-red-500 animate-pulse";

            return (
              <div key={i} className={`w-full h-full ${bgClass} rounded-sm relative`}>
                 {/* Internal pixel glow */}
                 {(isSnake || isFood) && <div className="absolute inset-[10%] bg-white/20 rounded-sm"></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* D-Pad Controls for Mobile */}
      <div className="mt-6 grid grid-cols-3 gap-2 w-full max-w-[200px]">
        <div></div>
        <button 
          onPointerDown={() => { if(dirRef.current.r !== 1) setDirection({ r: -1, c: 0 }); playSound.click(); }}
          className="w-14 h-14 bg-slate-700 rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none flex items-center justify-center text-white text-xl mx-auto"
        >▲</button>
        <div></div>
        <button 
          onPointerDown={() => { if(dirRef.current.c !== 1) setDirection({ r: 0, c: -1 }); playSound.click(); }}
          className="w-14 h-14 bg-slate-700 rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none flex items-center justify-center text-white text-xl mx-auto"
        >◀</button>
        <button 
          onPointerDown={() => { if(dirRef.current.r !== -1) setDirection({ r: 1, c: 0 }); playSound.click(); }}
          className="w-14 h-14 bg-slate-700 rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none flex items-center justify-center text-white text-xl mx-auto"
        >▼</button>
        <button 
          onPointerDown={() => { if(dirRef.current.c !== -1) setDirection({ r: 0, c: 1 }); playSound.click(); }}
          className="w-14 h-14 bg-slate-700 rounded-lg shadow-[0_4px_0_0_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none flex items-center justify-center text-white text-xl mx-auto"
        >▶</button>
      </div>

      {/* Menu Button */}
       <button 
          onClick={() => { playSound.click(); setSetupMode(true); }}
          className="mt-4 text-gray-500 hover:text-gray-800 underline text-sm"
        >
          Menu
       </button>

    </div>
  );
};