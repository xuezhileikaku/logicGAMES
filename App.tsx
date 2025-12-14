import React, { useState } from 'react';
import { GameType, Language } from './types';
import { GameCard } from './components/GameCard';
import { Gomoku } from './games/Gomoku';
import { MemoryGame } from './games/Memory';
import { FreeDraw } from './games/FreeDraw';
import { Snake } from './games/Snake';
import { GoGame } from './games/Go';
import { t } from './utils/translations';
import { playSound } from './utils/sound';

// SVG Icons
const GomokuIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" fill="currentColor" />
  </svg>
);

const GoIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" fill="currentColor" opacity="0.5" />
    <circle cx="8" cy="8" r="1" fill="white" />
    <circle cx="16" cy="16" r="1" fill="black" />
  </svg>
);

const MemoryIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 2v20" />
    <path d="M2 12h20" />
  </svg>
);

const DrawIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const SnakeIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 12h4" />
    <path d="M12 12v4" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
  </svg>
);

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [lang, setLang] = useState<Language>('en');

  const renderGame = () => {
    switch (activeGame) {
      case GameType.GOMOKU:
        return <Gomoku onBack={() => setActiveGame(null)} lang={lang} />;
      case GameType.GO:
        return <GoGame onBack={() => setActiveGame(null)} lang={lang} />;
      case GameType.MEMORY:
        return <MemoryGame onBack={() => setActiveGame(null)} lang={lang} />;
      case GameType.FREEDRAW:
        return <FreeDraw onBack={() => setActiveGame(null)} lang={lang} />;
      case GameType.SNAKE:
        return <Snake onBack={() => setActiveGame(null)} lang={lang} />;
      default:
        return null;
    }
  };

  const handleGameSelect = (type: GameType) => {
    playSound.click();
    setActiveGame(type);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center p-4">
      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button 
          onClick={() => { setLang(l => l === 'en' ? 'zh' : 'en'); playSound.click(); }}
          className="bg-white px-3 py-1 rounded-full shadow-md text-sm font-bold text-gray-700 hover:bg-gray-100 border border-gray-200"
        >
          {lang === 'en' ? '🇨🇳 中文' : '🇺🇸 EN'}
        </button>
      </div>

      <div className="w-full max-w-4xl bg-gray-100 rounded-[40px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border-8 border-gray-200 p-6 sm:p-10 relative overflow-hidden min-h-[80vh] flex flex-col">
        
        {/* Decorative Device "Chin" */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-300 rounded-b-xl z-0"></div>

        {/* Header */}
        <header className="relative z-10 flex flex-col items-center mb-8">
           <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">{t(lang, 'appTitle')}</h1>
           <p className="text-gray-500 text-sm mt-1">{t(lang, 'subtitle')}</p>
        </header>

        {/* Content Area */}
        <div className="relative z-10 flex-grow flex items-center justify-center">
          {activeGame ? (
            <div className="w-full animate-fadeIn">
              {renderGame()}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-3xl">
              <GameCard 
                title={lang === 'en' ? 'Gomoku' : '五子棋'}
                description={t(lang, 'gomokuDesc')}
                icon={<GomokuIcon />} 
                color="bg-emerald-500"
                onClick={() => handleGameSelect(GameType.GOMOKU)}
              />
              <GameCard 
                title={lang === 'en' ? 'Go (Weiqi)' : '围棋'}
                description={t(lang, 'goDesc')}
                icon={<GoIcon />} 
                color="bg-slate-700"
                onClick={() => handleGameSelect(GameType.GO)}
              />
              <GameCard 
                title={lang === 'en' ? 'Memory Match' : '记忆配对'}
                description={t(lang, 'memoryDesc')}
                icon={<MemoryIcon />} 
                color="bg-blue-500"
                onClick={() => handleGameSelect(GameType.MEMORY)}
              />
              <GameCard 
                title={lang === 'en' ? 'Snake' : '贪吃蛇'}
                description={t(lang, 'snakeDesc')}
                icon={<SnakeIcon />} 
                color="bg-green-600"
                onClick={() => handleGameSelect(GameType.SNAKE)}
              />
              <GameCard 
                title={lang === 'en' ? 'Free Draw' : '自由绘画'}
                description={t(lang, 'drawDesc')}
                icon={<DrawIcon />} 
                color="bg-purple-500"
                onClick={() => handleGameSelect(GameType.FREEDRAW)}
              />
               <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center opacity-60">
                <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center mb-4 text-gray-400">
                  <span className="text-2xl font-bold">?</span>
                </div>
                <h3 className="text-lg font-bold text-gray-400 mb-1">Tetris</h3>
                <p className="text-xs text-gray-400">Coming Soon</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Device Controls */}
        <div className="mt-8 flex justify-center gap-4 relative z-10 opacity-30 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-gray-400"></div>
          <div className="w-12 h-12 rounded-full border-4 border-gray-400"></div>
        </div>

      </div>
      
      <p className="mt-6 text-gray-400 text-xs text-center max-w-md">
        Powered by Gemini 2.5 Flash. Requires API Key for AI Opponent. <br/>
        Super Logic Board 1.3
      </p>
    </div>
  );
};

export default App;