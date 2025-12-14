import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';

const GRID_SIZE = 15;
const PALETTE = ['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

interface FreeDrawProps {
  onBack: () => void;
  lang: Language;
}

interface SavedDrawing {
  id: number;
  date: number;
  grid: string[][];
}

export const FreeDraw: React.FC<FreeDrawProps> = ({ onBack, lang }) => {
  const [grid, setGrid] = useState<string[][]>(() => 
    Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill('#ffffff'))
  );
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState<SavedDrawing[]>([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('drawings');
    if (saved) {
      setSavedDrawings(JSON.parse(saved));
    }
  }, []);

  const paint = (r: number, c: number) => {
    setGrid(prev => {
      const newGrid = prev.map(row => [...row]);
      newGrid[r][c] = selectedColor;
      return newGrid;
    });
  };

  const handlePointerDown = (r: number, c: number) => {
    setIsDrawing(true);
    paint(r, c);
  };

  const handlePointerEnter = (r: number, c: number) => {
    if (isDrawing) paint(r, c);
  };

  const saveDrawing = () => {
    const newSave: SavedDrawing = {
      id: Date.now(),
      date: Date.now(),
      grid: grid
    };
    const updated = [newSave, ...savedDrawings];
    setSavedDrawings(updated);
    localStorage.setItem('drawings', JSON.stringify(updated));
    playSound.match(); // Success sound
  };

  const loadDrawing = (drawing: SavedDrawing) => {
    setGrid(drawing.grid);
    setShowLoadMenu(false);
    playSound.flip();
  };

  const deleteDrawing = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDrawings.filter(d => d.id !== id);
    setSavedDrawings(updated);
    localStorage.setItem('drawings', JSON.stringify(updated));
    playSound.click();
  };

  return (
    <div className="flex flex-col items-center h-full w-full max-w-2xl mx-auto touch-none">
      <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Free Draw"
          rules={tRules(lang, 'drawRules')}
      />

      <div className="flex justify-between items-center w-full mb-4 px-4">
        <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
          ← {t(lang, 'back')}
        </button>
        <div className="flex gap-2">
           <button onClick={saveDrawing} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-bold shadow-sm">
             💾 {t(lang, 'save')}
           </button>
           <button onClick={() => { setShowLoadMenu(!showLoadMenu); playSound.click(); }} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-bold shadow-sm relative">
             📂 {t(lang, 'load')}
           </button>
           <button onClick={() => setShowTutorial(true)} className="text-gray-400 hover:text-gray-600">?</button>
        </div>
      </div>

      {showLoadMenu && (
        <div className="w-full mb-4 bg-white p-3 rounded-xl shadow-lg border border-gray-100 animate-fadeIn max-h-40 overflow-y-auto">
           {savedDrawings.length === 0 && <p className="text-center text-gray-400 text-xs">{t(lang, 'emptySlots')}</p>}
           {savedDrawings.map(d => (
             <div key={d.id} onClick={() => loadDrawing(d)} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer border-b border-gray-50 last:border-0">
               <span className="text-xs text-gray-600 font-mono">{new Date(d.date).toLocaleString()}</span>
               <button onClick={(e) => deleteDrawing(d.id, e)} className="text-red-400 hover:text-red-600 px-2">×</button>
             </div>
           ))}
        </div>
      )}

      <div className="bg-gray-200 p-2 rounded-xl mb-4 flex gap-2 overflow-x-auto max-w-full shadow-inner">
        {PALETTE.map(color => (
          <button
            key={color}
            onClick={() => { setSelectedColor(color); playSound.click(); }}
            className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === color ? 'scale-125 border-gray-600 shadow-md' : 'border-transparent scale-100'}`}
            style={{ backgroundColor: color }}
          />
        ))}
         <button 
             onClick={() => { setGrid(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill('#ffffff'))); playSound.pop(); }}
             className="ml-auto px-2 text-red-500 hover:text-red-700 text-xs font-bold"
           >
             {t(lang, 'clear')}
           </button>
      </div>

      <div 
        className="bg-gray-300 p-1 sm:p-2 rounded-lg shadow-xl"
        onPointerUp={() => setIsDrawing(false)}
        onPointerLeave={() => setIsDrawing(false)}
      >
        <div 
          className="grid gap-[1px] bg-gray-400 border border-gray-400"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) => (
            row.map((color, c) => (
              <div
                key={`${r}-${c}`}
                onPointerDown={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId); // Allows touch drag over multiple elements
                  handlePointerDown(r, c);
                }}
                onPointerEnter={() => handlePointerEnter(r, c)}
                className="w-5 h-5 sm:w-8 sm:h-8 cursor-pointer"
                style={{ backgroundColor: color }}
              />
            ))
          ))}
        </div>
      </div>
       <p className="mt-4 text-gray-500 text-xs text-center">{lang === 'zh' ? '点击或拖动绘制' : 'Tap or drag to paint'}.</p>
    </div>
  );
};