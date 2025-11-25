import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, BrainCircuit, Info, Eye, Zap, Timer as TimerIcon } from 'lucide-react';
import GridBoard from './components/GridBoard';
import StatsChart from './components/StatsChart';
import { GameStatus, GameResult, GridCellData, AIAnalysisResponse } from './types';
import { analyzePerformance } from './services/geminiService';

function App() {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [gridNumbers, setGridNumbers] = useState<GridCellData[]>([]);
  const [nextExpected, setNextExpected] = useState<number>(1);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [lastWrongClick, setLastWrongClick] = useState<number | null>(null);
  const [history, setHistory] = useState<GameResult[]>([]);
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);

  const timerRef = useRef<number | null>(null);

  const generateGrid = useCallback(() => {
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    // Fisher-Yates shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    const cells: GridCellData[] = numbers.map((val, idx) => ({ value: val, id: idx }));
    setGridNumbers(cells);
  }, []);

  const startGame = () => {
    generateGrid();
    setNextExpected(1);
    setMistakes(0);
    setLastWrongClick(null);
    setCurrentTime(0);
    setAiAnalysis(null);
    setStatus(GameStatus.PLAYING);
    setStartTime(Date.now());
  };

  const stopGame = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishGame = useCallback(() => {
    stopGame();
    setStatus(GameStatus.FINISHED);
    
    if (startTime) {
      const finalTime = (Date.now() - startTime) / 1000;
      setCurrentTime(finalTime);
      
      const newResult: GameResult = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        timeSeconds: finalTime,
        mistakes
      };
      
      setHistory(prev => [...prev, newResult]);
    }
  }, [startTime, mistakes, stopGame]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timerRef.current = window.setInterval(() => {
        if (startTime) {
          setCurrentTime((Date.now() - startTime) / 1000);
        }
      }, 50);
    } else {
      stopGame();
    }
    return () => stopGame();
  }, [status, startTime, stopGame]);

  // Initial Grid
  useEffect(() => {
    generateGrid();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCellClick = (num: number) => {
    if (status !== GameStatus.PLAYING) return;

    if (num === nextExpected) {
      if (nextExpected === 25) {
        finishGame();
      } else {
        setNextExpected(prev => prev + 1);
      }
    } else {
      setMistakes(prev => prev + 1);
      setLastWrongClick(num);
      setTimeout(() => setLastWrongClick(null), 500);
    }
  };

  const handleAiAnalysis = async () => {
    if (history.length === 0) return;
    setAiLoading(true);
    const lastGame = history[history.length - 1];
    const analysis = await analyzePerformance(lastGame, history.slice(0, -1)); // Pass history excluding current if needed, or all.
    setAiAnalysis(analysis);
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Eye className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Schulte Focus</h1>
              <p className="text-xs text-gray-500 font-medium">Peripheral Vision Trainer</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
               <TimerIcon className="w-4 h-4 text-indigo-500" />
               <span className="tabular-nums w-12 text-right text-indigo-700 font-bold">
                 {currentTime.toFixed(2)}s
               </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Game Board */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center gap-4">
               <div className="text-center">
                 <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Next</div>
                 <div className="text-2xl font-bold text-indigo-600">{status === GameStatus.FINISHED ? '-' : nextExpected}</div>
               </div>
               <div className="w-px h-8 bg-gray-200"></div>
               <div className="text-center">
                 <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Errors</div>
                 <div className={`text-2xl font-bold ${mistakes > 0 ? 'text-red-500' : 'text-gray-600'}`}>{mistakes}</div>
               </div>
             </div>
             
             {status === GameStatus.IDLE || status === GameStatus.FINISHED ? (
               <button 
                onClick={startGame}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-xl active:scale-95"
               >
                 <Play className="w-5 h-5" fill="currentColor" />
                 {status === GameStatus.FINISHED ? 'Play Again' : 'Start Game'}
               </button>
             ) : (
               <button 
                onClick={() => { stopGame(); setStatus(GameStatus.IDLE); }}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-all"
               >
                 <RotateCcw className="w-5 h-5" />
                 Reset
               </button>
             )}
          </div>

          <div className="relative">
             <GridBoard 
               numbers={gridNumbers}
               nextExpected={nextExpected}
               onCellClick={handleCellClick}
               isGameActive={status === GameStatus.PLAYING}
               lastWrongClick={lastWrongClick}
             />
             
             {/* Instructions Overlay if Idle */}
             {status === GameStatus.IDLE && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-2xl flex items-center justify-center p-6">
                   <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-100 max-w-sm text-center">
                      <Zap className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">How to Play</h3>
                      <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                        Find and click numbers from <span className="font-bold text-indigo-600">1 to 25</span> in ascending order as fast as possible. Keep your eyes on the center grid cell to train your peripheral vision.
                      </p>
                      <button onClick={startGame} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition">
                        Start Now
                      </button>
                   </div>
                </div>
             )}
          </div>

        </div>

        {/* Right Column: Stats & AI */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* AI Analysis Section */}
          {status === GameStatus.FINISHED && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
               
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4">
                   <BrainCircuit className="w-6 h-6 text-indigo-200" />
                   <h2 className="text-lg font-bold">AI Performance Coach</h2>
                 </div>
                 
                 {!aiAnalysis ? (
                   <div className="text-center py-4">
                     <p className="text-indigo-100 mb-4 text-sm">Get personalized feedback on your attention stability and speed using Gemini AI.</p>
                     <button 
                      onClick={handleAiAnalysis}
                      disabled={aiLoading}
                      className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:bg-indigo-50 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                     >
                       {aiLoading ? (
                         <>
                           <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                           Analyzing...
                         </>
                       ) : (
                         <>
                           <Zap className="w-4 h-4" />
                           Analyze My Game
                         </>
                       )}
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-4 animate-pop">
                     <div className="flex justify-between items-end border-b border-white/20 pb-2">
                       <span className="text-indigo-200 text-sm">Rating</span>
                       <span className="text-xl font-bold text-white">{aiAnalysis.rating}</span>
                     </div>
                     <p className="text-sm leading-relaxed text-indigo-50 italic">"{aiAnalysis.feedback}"</p>
                     <div className="space-y-2">
                       <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Pro Tips:</p>
                       <ul className="space-y-1">
                         {aiAnalysis.tips.map((tip, idx) => (
                           <li key={idx} className="text-sm flex gap-2 items-start">
                             <span className="mt-1 block w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                             {tip}
                           </li>
                         ))}
                       </ul>
                     </div>
                     <button onClick={() => setAiAnalysis(null)} className="text-xs text-indigo-200 hover:text-white underline mt-2">
                       Clear Analysis
                     </button>
                   </div>
                 )}
               </div>
            </div>
          )}

          <StatsChart history={history} />
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
               <Info className="w-5 h-5 text-gray-400" />
               About Schulte Tables
             </h3>
             <p className="text-sm text-gray-600 leading-relaxed mb-4">
               Originally developed by German psychiatrist Walter Schulte, this grid is a standard test for measuring attention properties.
             </p>
             <ul className="space-y-2 text-sm text-gray-600">
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                 <span>Improves <strong>peripheral vision</strong> for speed reading.</span>
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                 <span>Trains <strong>speed of visual search</strong>.</span>
               </li>
               <li className="flex gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                 <span>Enhances <strong>focused attention</strong> stability.</span>
               </li>
             </ul>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
