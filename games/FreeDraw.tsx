import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';

const DEFAULT_SIZE = 15;
const MAX_SIZE = 32;
const MIN_SIZE = 5;
const PALETTE = ['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
const SIZE_PRESETS = [10, 15, 20, 24, 32];

interface FreeDrawProps {
  onBack: () => void;
  lang: Language;
}

interface SavedDrawing {
  id: number;
  date: number;
  grid: string[][];
  rows: number;
  cols: number;
}

// Helper to create empty grid
const createGrid = (rows: number, cols: number, fill: string) => 
  Array(rows).fill(0).map(() => Array(cols).fill(fill));

// Pre-defined Templates (Always 15x15)
const TEMPLATES = [
  {
    key: 'puppy',
    icon: '🐶',
    generate: () => {
      const g = createGrid(15, 15, '#ffffff');
      const B = '#000000'; // Black
      const Y = '#eab308'; // Yellow
      const R = '#ef4444'; // Red
      
      // Ears
      g[2][4] = B; g[3][4] = B; g[4][4] = B; g[5][4] = B; g[6][4] = B;
      g[2][10] = B; g[3][10] = B; g[4][10] = B; g[5][10] = B; g[6][10] = B;
      
      // Inner Ear
      g[3][5] = Y; g[4][5] = Y; g[5][5] = Y;
      g[3][9] = Y; g[4][9] = Y; g[5][9] = Y;
      
      // Ear Outline Top/Side
      g[2][5] = B; g[2][9] = B;
      g[3][3] = B; g[4][3] = B; g[5][3] = B; g[6][3] = B;
      g[3][11] = B; g[4][11] = B; g[5][11] = B; g[6][11] = B;

      // Head Top
      g[4][6] = B; g[4][7] = B; g[4][8] = B;
      g[5][7] = B; // Fur tuft?

      // Face Outline
      g[7][3] = B; g[8][3] = B; g[9][4] = B; g[10][5] = B; g[11][6] = B;
      g[7][11] = B; g[8][11] = B; g[9][10] = B; g[10][9] = B; g[11][8] = B;

      // Eyes
      g[7][5] = B; g[7][9] = B;

      // Nose
      g[8][7] = Y;

      // Mouth
      g[9][6] = R; g[9][7] = R; g[9][8] = R;

      // Chin
      g[10][6] = B; g[10][8] = B;
      g[11][7] = B;
      
      return g;
    }
  },
  {
    key: 'fish',
    icon: '🐠',
    generate: () => {
      const g = createGrid(15, 15, '#ffffff');
      const O = '#f97316'; // Orange
      const B = '#3b82f6'; // Blue
      const K = '#000000'; // Black

      // Fish Body
      for(let r=5; r<=9; r++) {
         for(let c=4; c<=10; c++) {
             if ((r===5 || r===9) && (c<6 || c>8)) continue;
             g[r][c] = O;
         }
      }
      
      // Tail
      g[6][2] = O; g[8][2] = O;
      g[5][1] = O; g[6][1] = O; g[7][1] = O; g[8][1] = O; g[9][1] = O;

      // Eye
      g[6][8] = '#ffffff'; 
      g[6][9] = K;

      // Bubbles
      g[4][12] = B;
      g[3][13] = B;

      return g;
    }
  },
  {
    key: 'heart',
    icon: '❤️',
    generate: () => {
      const g = createGrid(15, 15, '#ffffff');
      const R = '#ef4444';
      
      const pattern = [
        "000000000000000",
        "000000000000000",
        "000111000111000",
        "001111101111100",
        "001111111111100",
        "001111111111100",
        "001111111111100",
        "000111111111000",
        "000111111111000",
        "000011111110000",
        "000001111100000",
        "000000111000000",
        "000000010000000",
        "000000000000000",
        "000000000000000"
      ];
      
      for(let r=0; r<15; r++) {
          for(let c=0; c<15; c++) {
              if (pattern[r][c] === '1') g[r][c] = R;
          }
      }
      return g;
    }
  }
];

export const FreeDraw: React.FC<FreeDrawProps> = ({ onBack, lang }) => {
  const [grid, setGrid] = useState<string[][]>(() => createGrid(DEFAULT_SIZE, DEFAULT_SIZE, '#ffffff'));
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [savedDrawings, setSavedDrawings] = useState<SavedDrawing[]>([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  
  // Resize State
  const [rows, setRows] = useState(DEFAULT_SIZE);
  const [cols, setCols] = useState(DEFAULT_SIZE);
  const [newRows, setNewRows] = useState(DEFAULT_SIZE);
  const [newCols, setNewCols] = useState(DEFAULT_SIZE);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('drawings');
    if (saved) {
      setSavedDrawings(JSON.parse(saved));
    }
  }, []);

  const paint = (r: number, c: number) => {
    if (r >= rows || c >= cols) return;
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
      grid: grid,
      rows,
      cols
    };
    const updated = [newSave, ...savedDrawings];
    setSavedDrawings(updated);
    localStorage.setItem('drawings', JSON.stringify(updated));
    playSound.match(); // Success sound
  };

  const loadDrawing = (drawing: SavedDrawing) => {
    // Legacy support for drawings without rows/cols
    const r = drawing.rows || drawing.grid.length;
    const c = drawing.cols || drawing.grid[0].length;
    
    setGrid(drawing.grid);
    setRows(r);
    setCols(c);
    setNewRows(r);
    setNewCols(c);

    setShowLoadMenu(false);
    playSound.flip();
  };

  const loadTemplate = (generator: () => string[][]) => {
      const g = generator();
      setGrid(g);
      setRows(15);
      setCols(15);
      setNewRows(15);
      setNewCols(15);
      setShowTemplateMenu(false);
      playSound.flip();
  };

  const deleteDrawing = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDrawings.filter(d => d.id !== id);
    setSavedDrawings(updated);
    localStorage.setItem('drawings', JSON.stringify(updated));
    playSound.click();
  };

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const pixelSize = 32; // Export resolution per block
    canvas.width = cols * pixelSize;
    canvas.height = rows * pixelSize;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // 1. Draw Pixels
      grid.forEach((row, r) => {
        row.forEach((color, c) => {
          ctx.fillStyle = color;
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
        });
      });

      // 2. Draw Grid Lines (Dark Gray for visibility)
      ctx.strokeStyle = '#6b7280'; // Tailwind gray-500
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      // Vertical lines
      for (let x = 0; x <= cols; x++) {
          ctx.moveTo(x * pixelSize, 0);
          ctx.lineTo(x * pixelSize, rows * pixelSize);
      }
      // Horizontal lines
      for (let y = 0; y <= rows; y++) {
          ctx.moveTo(0, y * pixelSize);
          ctx.lineTo(0 + cols * pixelSize, y * pixelSize);
      }
      ctx.stroke();
      
      // Border around the whole image
      ctx.strokeStyle = '#374151'; // Darker border
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.download = `pixel-art-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      playSound.match();
    }
  };

  const adjustZoom = (delta: number) => {
    setZoomLevel(prev => {
      const next = prev + delta;
      return Math.min(Math.max(next, 0.5), 3.0);
    });
    playSound.click();
  };

  const applySize = (r: number, c: number) => {
     // Clamp values
    const safeR = Math.min(Math.max(r, MIN_SIZE), MAX_SIZE);
    const safeC = Math.min(Math.max(c, MIN_SIZE), MAX_SIZE);
    
    // Create new grid conserving old data
    const newGrid = Array(safeR).fill(0).map((_, rowIdx) => 
        Array(safeC).fill(0).map((_, colIdx) => {
            if (rowIdx < rows && colIdx < cols) {
                return grid[rowIdx][colIdx];
            }
            return '#ffffff';
        })
    );

    setGrid(newGrid);
    setRows(safeR);
    setCols(safeC);
    setNewRows(safeR);
    setNewCols(safeC);
    playSound.pop();
    setShowPresets(false);
  }

  const handleResizeGrid = () => {
    applySize(newRows, newCols);
  };

  const baseCellSize = 24; // Base px size for calculation
  const currentCellSize = Math.floor(baseCellSize * zoomLevel);

  return (
    <div className="flex flex-col items-center h-full w-full max-w-4xl mx-auto touch-none">
      <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          lang={lang}
          title="Free Draw"
          rules={tRules(lang, 'drawRules')}
      />

      <div className="flex justify-between items-center w-full mb-2 px-2 sm:px-4">
        <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
          ← {t(lang, 'back')}
        </button>
        <div className="flex gap-2 flex-wrap justify-end">
           <button onClick={saveDrawing} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-bold shadow-sm flex items-center gap-1">
             <span>💾</span> <span className="hidden sm:inline">{t(lang, 'save')}</span>
           </button>
           
           <div className="relative">
             <button onClick={() => { setShowLoadMenu(!showLoadMenu); setShowTemplateMenu(false); playSound.click(); }} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-bold shadow-sm flex items-center gap-1">
               <span>📂</span> <span className="hidden sm:inline">{t(lang, 'load')}</span>
             </button>
             {showLoadMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white p-2 rounded-xl shadow-xl border border-gray-100 z-30 max-h-48 overflow-y-auto">
                   {savedDrawings.length === 0 && <p className="text-center text-gray-400 text-xs py-2">{t(lang, 'emptySlots')}</p>}
                   {savedDrawings.map(d => (
                     <div key={d.id} onClick={() => loadDrawing(d)} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer border-b border-gray-50 last:border-0 group">
                       <span className="text-xs text-gray-600 font-mono">{new Date(d.date).toLocaleTimeString()} {d.rows ? `(${d.rows}x${d.cols})` : ''}</span>
                       <button onClick={(e) => deleteDrawing(d.id, e)} className="text-gray-300 hover:text-red-500 px-1 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                     </div>
                   ))}
                </div>
              )}
           </div>

           <div className="relative">
             <button onClick={() => { setShowTemplateMenu(!showTemplateMenu); setShowLoadMenu(false); playSound.click(); }} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-bold shadow-sm flex items-center gap-1">
               <span>🧩</span> <span className="hidden sm:inline">{t(lang, 'templates')}</span>
             </button>
             {showTemplateMenu && (
               <div className="absolute top-full right-0 mt-2 w-32 bg-white p-2 rounded-xl shadow-xl border border-gray-100 z-30">
                  {TEMPLATES.map(tmpl => (
                    <button 
                      key={tmpl.key} 
                      onClick={() => loadTemplate(tmpl.generate)} 
                      className="w-full text-left p-2 hover:bg-yellow-50 rounded-lg text-sm text-gray-700 flex items-center gap-2"
                    >
                      <span>{tmpl.icon}</span>
                      <span>{t(lang, tmpl.key as any)}</span>
                    </button>
                  ))}
               </div>
             )}
           </div>

           <button onClick={handleDownload} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-bold shadow-sm flex items-center gap-1" title={t(lang, 'downloadImage')}>
             <span>📷</span>
           </button>
           <button onClick={() => setShowTutorial(true)} className="text-gray-400 hover:text-gray-600 ml-1">?</button>
        </div>
      </div>

      {/* Toolbar: Colors, Resize, and Zoom */}
      <div className="bg-gray-200 p-2 rounded-xl mb-4 flex flex-col gap-2 w-full shadow-inner">
         
         {/* Top Row: Resize and Zoom Controls */}
         <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 pb-2 mb-1">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm px-2 relative">
                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap">{t(lang, 'canvasSize')}:</span>
                    <input 
                        type="number" 
                        min={MIN_SIZE} max={MAX_SIZE} 
                        value={newCols} 
                        onChange={(e) => setNewCols(parseInt(e.target.value))} 
                        className="w-10 text-xs text-center border rounded bg-gray-50 p-1"
                        placeholder={t(lang, 'gridCols')}
                        title={t(lang, 'gridCols')}
                    />
                    <span className="text-xs text-gray-400 font-mono">x</span>
                    <input 
                        type="number" 
                        min={MIN_SIZE} max={MAX_SIZE} 
                        value={newRows} 
                        onChange={(e) => setNewRows(parseInt(e.target.value))} 
                        className="w-10 text-xs text-center border rounded bg-gray-50 p-1"
                        placeholder={t(lang, 'gridRows')}
                        title={t(lang, 'gridRows')}
                    />
                    <button onClick={handleResizeGrid} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded font-bold shadow-sm ml-1 transition-colors">{t(lang, 'apply')}</button>
                    
                    {/* Presets Button */}
                    <button onClick={() => setShowPresets(!showPresets)} className="ml-1 text-gray-400 hover:text-gray-600 text-xs">▼</button>
                    {showPresets && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-2 grid grid-cols-2 gap-1 min-w-[120px]">
                         <span className="text-[10px] text-gray-400 col-span-2 text-center mb-1">{t(lang, 'presets')}</span>
                         {SIZE_PRESETS.map(size => (
                           <button 
                              key={size} 
                              onClick={() => applySize(size, size)}
                              className="px-2 py-1 text-xs bg-gray-50 hover:bg-blue-50 text-gray-700 rounded border border-gray-100"
                           >
                             {size}x{size}
                           </button>
                         ))}
                      </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm">
                <span className="text-xs text-gray-400 font-mono ml-1 hidden sm:inline">{t(lang, 'zoom')}:</span>
                <button onClick={() => adjustZoom(-0.25)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-lg font-bold">-</button>
                <span className="text-xs font-mono text-gray-500 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => adjustZoom(0.25)} className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded text-lg font-bold">+</button>
            </div>
         </div>

         {/* Bottom Row: Colors */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar items-center w-full justify-between">
            <div className="flex gap-2 items-center">
              {PALETTE.map(color => (
                <button
                  key={color}
                  onClick={() => { setSelectedColor(color); playSound.click(); }}
                  className={`w-8 h-8 rounded-full border-2 flex-shrink-0 transition-transform ${selectedColor === color ? 'scale-110 border-gray-600 shadow-md ring-1 ring-white' : 'border-transparent scale-100'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center border-l border-gray-400 pl-2 ml-1">
              <button 
                  onClick={() => { setGrid(createGrid(rows, cols, '#ffffff')); playSound.pop(); }}
                  className="px-3 py-1 bg-white text-red-500 border border-red-200 rounded-lg hover:bg-red-50 text-xs font-bold whitespace-nowrap shadow-sm"
                >
                  {t(lang, 'clear')}
              </button>
            </div>
         </div>
      </div>

      <div className="flex-1 w-full overflow-auto flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-4">
          <div 
            className="bg-gray-300 p-1 sm:p-2 rounded-lg shadow-xl"
            onPointerUp={() => setIsDrawing(false)}
            onPointerLeave={() => setIsDrawing(false)}
            style={{ touchAction: 'none' }} // Prevent scrolling while drawing
          >
            <div 
              className="grid gap-[1px] bg-gray-400 border border-gray-400"
              style={{ 
                gridTemplateColumns: `repeat(${cols}, ${currentCellSize}px)`
              }}
            >
              {grid.map((row, r) => (
                row.map((color, c) => (
                  <div
                    key={`${r}-${c}`}
                    onPointerDown={(e) => {
                      e.currentTarget.releasePointerCapture(e.pointerId); 
                      handlePointerDown(r, c);
                    }}
                    onPointerEnter={() => handlePointerEnter(r, c)}
                    className="cursor-pointer"
                    style={{ 
                      backgroundColor: color, 
                      width: `${currentCellSize}px`, 
                      height: `${currentCellSize}px`
                    }}
                  />
                ))
              ))}
            </div>
          </div>
      </div>

      <p className="mt-2 text-gray-400 text-xs text-center">{lang === 'zh' ? '点击或拖动绘制，支持缩放与导出' : 'Tap or drag to paint. Zoom and export supported.'}</p>
    </div>
  );
};