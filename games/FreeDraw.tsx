import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { t, tRules } from '../utils/translations';
import { TutorialModal } from '../components/TutorialModal';
import { playSound } from '../utils/sound';
import { generatePixelArt } from '../services/geminiService';

const DEFAULT_SIZE = 16;
const MAX_SIZE = 500;
const MIN_SIZE = 5;
const PALETTE = ['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#8b5cf6', '#6366f1', '#0ea5e9', '#10b981', '#84cc16', '#71717a', '#52525b'];
const SIZE_PRESETS = [10, 16, 24, 32, 48, 64];

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

// Pre-defined Templates based on uploaded images (16x16)
const TEMPLATES = [
  {
    key: 'girl',
    icon: '👧',
    generate: () => {
      const g = createGrid(16, 16, '#ffffff');
      const B = '#000000'; // Black
      const W = '#ffffff'; // White
      const O = '#f97316'; // Orange (Blush/Mouth)
      const R = '#ef4444'; // Red (Mouth)
      const Y = '#eab308'; // Yellow (Tie)
      
      // Hair
      // Top Hair
      for(let c=6; c<=9; c++) g[3][c] = B;
      for(let c=5; c<=10; c++) g[4][c] = B;
      g[5][4] = B; g[5][5] = B; g[5][10] = B; g[5][11] = B;
      
      // Ponytail
      g[2][12] = B; g[3][13] = B; g[4][14] = B; g[5][14] = B;
      g[3][14] = B;
      
      // Hair tie
      g[3][11] = Y; g[3][12] = Y;

      // Side hair
      g[6][3] = B; g[7][3] = B; g[8][3] = B; g[9][3] = B; g[10][3] = B; 
      g[11][3] = B; g[12][4] = B;
      g[6][12] = B; g[7][12] = B; g[8][12] = B; g[9][12] = B; g[10][12] = B;
      g[11][12] = B; g[12][11] = B;

      // Face (White background mostly handles it, but let's outline)
      // Eyes
      g[8][5] = B; g[9][5] = B;
      g[8][9] = B; g[9][9] = B;

      // Blush
      g[10][4] = O; g[10][5] = O;
      g[10][9] = O; g[10][10] = O;
      g[10][7] = Y; // Nose?

      // Mouth
      g[12][6] = R; g[12][7] = R; g[12][8] = R;
      g[13][6] = O; g[13][7] = O; g[13][8] = O;

      // Body (Stick figure style in image)
      g[14][7] = B; g[15][7] = B; // Neck/Body
      g[15][6] = B; g[15][8] = B;

      return g;
    }
  },
  {
    key: 'fish',
    icon: '🐠',
    generate: () => {
      const g = createGrid(16, 16, '#3b82f6'); // Blue background
      const O = '#f97316'; // Orange
      const B = '#000000'; // Black
      const W = '#ffffff'; // White
      const Y = '#eab308'; // Yellow

      // Clownfish shape roughly
      for(let r=4; r<=12; r++) {
        for(let c=3; c<=12; c++) {
           // Ellipse approximate
           if ((r===4||r===12) && (c<5||c>10)) continue;
           if ((r===5||r===11) && (c<4||c>11)) continue;
           g[r][c] = O;
        }
      }

      // Fins
      g[3][7] = Y; g[3][8] = Y; // Top
      g[13][7] = Y; g[13][8] = Y; // Bottom
      g[8][13] = Y; g[7][13] = Y; g[9][13] = Y; // Tail

      // White Stripe
      for(let r=4; r<=12; r++) {
         if(g[r][7] === O) g[r][7] = W;
         if(g[r][8] === O) g[r][8] = W;
      }

      // Eye
      g[6][5] = W; g[6][6] = B;

      // Outline (Simplified)
      g[8][13] = B;

      return g;
    }
  },
  {
    key: 'rabbit',
    icon: '🐰',
    generate: () => {
      const g = createGrid(16, 16, '#ffffff');
      const B = '#000000'; // Black outline
      const R = '#ef4444'; // Red details
      const P = '#ec4899'; // Pink
      const U = '#3b82f6'; // Blue decorations
      
      // Ears
      g[2][4] = B; g[3][4] = B; g[4][4] = B; g[5][4] = B;
      g[2][5] = P; g[3][5] = P; g[4][5] = P; 
      g[2][6] = B; g[3][6] = B; g[4][6] = B; g[5][6] = B;

      g[2][9] = B; g[3][9] = B; g[4][9] = B; g[5][9] = B;
      g[2][10] = P; g[3][10] = P; g[4][10] = P;
      g[2][11] = B; g[3][11] = B; g[4][11] = B; g[5][11] = B;

      // Face Outline
      g[6][3] = B; g[7][3] = B; g[8][3] = B; g[9][3] = B; g[10][3] = B;
      g[6][12] = B; g[7][12] = B; g[8][12] = B; g[9][12] = B; g[10][12] = B;
      g[11][4] = B; g[11][11] = B;
      g[12][5] = B; g[12][6] = B; g[12][7] = B; g[12][8] = B; g[12][9] = B; g[12][10] = B;

      // Eyes
      g[8][5] = B; g[9][5] = B;
      g[8][10] = B; g[9][10] = B;

      // Cheeks
      g[9][3] = R; g[9][12] = R; 

      // Mouth/Nose
      g[10][7] = B; g[10][8] = B;
      g[11][7] = R; g[11][8] = R;

      // Blue stars
      g[4][1] = U; g[3][2] = U; g[5][2] = U; g[4][3] = U;
      g[8][14] = U; 

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
  
  // History State
  const [history, setHistory] = useState<string[][][]>(() => [createGrid(DEFAULT_SIZE, DEFAULT_SIZE, '#ffffff')]);
  const [historyStep, setHistoryStep] = useState(0);

  // Resize State
  const [rows, setRows] = useState(DEFAULT_SIZE);
  const [cols, setCols] = useState(DEFAULT_SIZE);
  const [newRows, setNewRows] = useState(DEFAULT_SIZE);
  const [newCols, setNewCols] = useState(DEFAULT_SIZE);
  const [showPresets, setShowPresets] = useState(false);

  // AI & Upload State
  const [showAiModal, setShowAiModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('drawings');
    if (saved) {
      setSavedDrawings(JSON.parse(saved));
    }
  }, []);

  const pushToHistory = (newGrid: string[][]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newGrid);
    if (newHistory.length > 20) newHistory.shift();
    
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
        const nextStep = historyStep - 1;
        const prevGrid = history[nextStep];
        setGrid(prevGrid);
        setHistoryStep(nextStep);
        setRows(prevGrid.length);
        setCols(prevGrid[0].length);
        setNewRows(prevGrid.length);
        setNewCols(prevGrid[0].length);
        playSound.click();
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
        const nextStep = historyStep + 1;
        const nextGrid = history[nextStep];
        setGrid(nextGrid);
        setHistoryStep(nextStep);
        setRows(nextGrid.length);
        setCols(nextGrid[0].length);
        setNewRows(nextGrid.length);
        setNewCols(nextGrid[0].length);
        playSound.click();
    }
  };

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

  const handlePointerUp = () => {
    if (isDrawing) {
        setIsDrawing(false);
        // Save to history if changed
        if (historyStep >= 0 && grid !== history[historyStep]) {
             pushToHistory(grid);
        }
    }
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
    pushToHistory(drawing.grid);

    setShowLoadMenu(false);
    playSound.flip();
  };

  const loadTemplate = (generator: () => string[][]) => {
      const g = generator();
      setGrid(g);
      setRows(16);
      setCols(16);
      setNewRows(16);
      setNewCols(16);
      pushToHistory(g);
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
      // 10% to 500%
      return Math.min(Math.max(next, 0.1), 5.0);
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
    pushToHistory(newGrid);
    playSound.pop();
    setShowPresets(false);
  }

  const handleResizeGrid = () => {
    applySize(newRows, newCols);
  };

  const handleClear = () => {
    const newG = createGrid(rows, cols, '#ffffff');
    setGrid(newG);
    pushToHistory(newG);
    playSound.pop();
  };

  // --- AI Gen ---
  const handleAiGen = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const aiGrid = await generatePixelArt(prompt, rows, cols);
      // AI might return different size, we just map it 1:1 to current top-left
      // Or resize current board to match AI result if we wanted, but let's stick to current canvas size constraints
      
      const newGrid = Array(rows).fill(0).map((_, r) => 
        Array(cols).fill(0).map((_, c) => {
            if (aiGrid[r] && aiGrid[r][c]) return aiGrid[r][c];
            return '#ffffff';
        })
      );
      setGrid(newGrid);
      pushToHistory(newGrid);
      playSound.match();
      setShowAiModal(false);
    } catch (e) {
      alert("AI Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Image Upload ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Resize image to fit grid using a canvas
            const canvas = document.createElement('canvas');
            canvas.width = cols;
            canvas.height = rows;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Draw image scaled to grid size
            ctx.drawImage(img, 0, 0, cols, rows);
            
            // Get pixel data
            const imgData = ctx.getImageData(0, 0, cols, rows).data;
            const newGrid = createGrid(rows, cols, '#ffffff');

            // Convert rgba to hex
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const i = (r * cols + c) * 4;
                    const red = imgData[i];
                    const green = imgData[i + 1];
                    const blue = imgData[i + 2];
                    const alpha = imgData[i + 3];
                    
                    if (alpha > 128) { // If visible
                        const hex = "#" + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
                        newGrid[r][c] = hex;
                    } else {
                        newGrid[r][c] = '#ffffff';
                    }
                }
            }
            setGrid(newGrid);
            pushToHistory(newGrid);
            playSound.pop();
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
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

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">✨ {t(lang, 'aiGen')}</h3>
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t(lang, 'enterPrompt')}
              className="w-full border-2 border-gray-300 rounded-lg p-2 mb-4 focus:border-purple-500 outline-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAiModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">{t(lang, 'cancel')}</button>
              <button 
                onClick={handleAiGen} 
                disabled={isGenerating || !prompt}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isGenerating ? t(lang, 'generating') : t(lang, 'generate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header / Top Toolbar */}
      <div className="flex justify-between items-center w-full mb-2 px-2 sm:px-4">
        <button onClick={() => { onBack(); playSound.click(); }} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">
          ← {t(lang, 'back')}
        </button>
        <div className="flex gap-2 flex-wrap justify-end">
           {/* Save */}
           <button onClick={saveDrawing} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-bold shadow-sm flex items-center gap-1">
             <span>💾</span> <span className="hidden sm:inline">{t(lang, 'save')}</span>
           </button>
           
           {/* Load */}
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

           {/* Templates */}
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

           {/* AI Button */}
           <button onClick={() => setShowAiModal(true)} className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:opacity-90 text-sm font-bold shadow-sm flex items-center gap-1 border border-purple-300">
             <span>✨</span> <span className="hidden sm:inline">{t(lang, 'aiGen')}</span>
           </button>

           {/* Upload Button */}
           <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-bold shadow-sm flex items-center gap-1 border border-gray-300" title={t(lang, 'uploadTip')}>
             <span>📤</span> <span className="hidden sm:inline">{t(lang, 'uploadImg')}</span>
           </button>
           <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

           {/* Download */}
           <button onClick={handleDownload} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-bold shadow-sm flex items-center gap-1 border border-gray-300" title={t(lang, 'downloadImage')}>
             <span>📷</span>
           </button>
           <button onClick={() => setShowTutorial(true)} className="text-gray-400 hover:text-gray-600 ml-1">?</button>
        </div>
      </div>

      {/* Toolbar: Resize and Zoom Controls (Redesigned) */}
      <div className="bg-gray-200 p-3 rounded-xl mb-4 flex flex-col gap-3 w-full shadow-inner border border-gray-300">
         
         <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Grid Resize */}
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl shadow-sm border border-gray-200">
                <span className="text-sm text-slate-700 font-bold whitespace-nowrap px-1">{t(lang, 'canvasSize')}:</span>
                <div className="flex items-center gap-1">
                    <input 
                        type="number" 
                        min={MIN_SIZE} max={MAX_SIZE} 
                        value={newCols} 
                        onChange={(e) => setNewCols(parseInt(e.target.value))} 
                        className="w-14 h-9 text-lg font-bold text-center border-2 border-slate-300 rounded-lg bg-gray-50 focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                        placeholder={t(lang, 'gridCols')}
                    />
                    <span className="text-slate-400 font-bold mx-1">×</span>
                    <input 
                        type="number" 
                        min={MIN_SIZE} max={MAX_SIZE} 
                        value={newRows} 
                        onChange={(e) => setNewRows(parseInt(e.target.value))} 
                        className="w-14 h-9 text-lg font-bold text-center border-2 border-slate-300 rounded-lg bg-gray-50 focus:border-blue-500 focus:bg-white transition-all text-slate-800"
                        placeholder={t(lang, 'gridRows')}
                    />
                </div>
                
                <div className="relative ml-1">
                     <button onClick={handleResizeGrid} className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95">
                        {t(lang, 'apply')}
                     </button>
                     {/* Presets Toggle */}
                     <button onClick={() => setShowPresets(!showPresets)} className="absolute -right-3 -top-3 w-5 h-5 bg-gray-300 hover:bg-gray-400 rounded-full text-[10px] flex items-center justify-center text-gray-700 font-bold border border-white shadow-sm">
                        ▼
                     </button>
                     {showPresets && (
                      <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 p-2 grid grid-cols-3 gap-2 w-48 animate-fadeIn">
                         <span className="text-xs text-gray-400 col-span-3 text-center font-bold uppercase tracking-wider mb-1">{t(lang, 'presets')}</span>
                         {SIZE_PRESETS.map(size => (
                           <button 
                              key={size} 
                              onClick={() => applySize(size, size)}
                              className="py-2 text-sm font-bold bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 transition-colors"
                           >
                             {size}×{size}
                           </button>
                         ))}
                      </div>
                    )}
                </div>
            </div>

            {/* Right: Zoom */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-2 shadow-sm border border-gray-200 ml-auto">
                <span className="text-xs text-gray-400 font-bold uppercase ml-1 hidden sm:inline">{t(lang, 'zoom')}</span>
                <button onClick={() => adjustZoom(-0.25)} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-lg font-bold transition-colors">-</button>
                <span className="text-sm font-mono font-bold text-slate-600 w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => adjustZoom(0.25)} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-lg font-bold transition-colors">+</button>
            </div>
         </div>

         {/* Bottom Row: Colors */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar items-center w-full justify-between pt-1 border-t border-gray-300/50">
            <div className="flex gap-1 sm:gap-2 items-center">
              {PALETTE.map(color => (
                <button
                  key={color}
                  onClick={() => { setSelectedColor(color); playSound.click(); }}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 flex-shrink-0 transition-all ${selectedColor === color ? 'scale-110 border-gray-600 shadow-lg ring-2 ring-white z-10' : 'border-transparent hover:scale-105 shadow-sm'}`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center border-l border-gray-400 pl-3 ml-1 gap-1">
              <button 
                  onClick={handleUndo} 
                  disabled={historyStep <= 0}
                  className="px-2 py-1 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t(lang, 'undo')}
                >
                  ⟲
              </button>
              <button 
                  onClick={handleRedo} 
                  disabled={historyStep >= history.length - 1}
                  className="px-2 py-1 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t(lang, 'redo')}
                >
                  ⟳
              </button>
              <button 
                  onClick={handleClear}
                  className="px-3 py-1 bg-white text-red-500 border border-red-200 rounded-lg hover:bg-red-50 text-xs font-bold whitespace-nowrap shadow-sm transition-colors"
                >
                  {t(lang, 'clear')}
              </button>
            </div>
         </div>
      </div>

      <div className="flex-1 w-full overflow-auto flex items-center justify-center bg-gray-100 rounded-xl border-4 border-dashed border-gray-300 p-4 relative">
          <div className="absolute top-2 left-2 text-xs text-gray-300 font-mono select-none pointer-events-none">{rows}×{cols}</div>
          <div 
            className="bg-white p-1 shadow-2xl transition-all duration-300 ease-out"
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ 
                touchAction: 'none',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' 
            }}
          >
            <div 
              className="grid gap-[1px] bg-gray-200 border border-gray-200"
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

      <p className="mt-2 text-gray-400 text-xs text-center">{lang === 'zh' ? '点击或拖动绘制，AI生成与图片上传已启用' : 'Tap or drag to paint. AI Gen & Upload enabled.'}</p>
    </div>
  );
};