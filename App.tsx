import React, { useState, useEffect } from 'react';
import { AnalysisResult, HistoryItem } from './types';
import { analyzeContent } from './services/geminiService';
import InputSection from './components/InputSection';
import AnalysisResultView from './components/AnalysisResultView';
import HistoryList from './components/HistoryList';
import LetterGlitch from './components/LetterGlitch';
import { Shield, Radar, User, SquareTerminal } from 'lucide-react';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // History initialization from localStorage
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('vibe_scamalyze_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  const playSuccessSound = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) { /* ignore */ }
  };

  const handleAnalyze = async (text: string, image: string | undefined, audio: string | undefined, video: string | undefined, isThinking: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const analysis = await analyzeContent(text, image, audio, video, isThinking);
      const timestamp = Date.now();
      const analysisWithTimestamp = { ...analysis, timestamp };
      
      setResult(analysisWithTimestamp);
      playSuccessSound();

      // Create history item
      let snippetText = text;
      if (!snippetText) {
        if (video) snippetText = "Video Analysis";
        else if (audio) snippetText = "Audio Analysis";
        else if (image) snippetText = "Image Analysis";
        else snippetText = "Content Analysis";
      }

      const newItem: HistoryItem = {
        id: timestamp.toString(),
        timestamp: timestamp,
        snippet: snippetText.length > 80 ? snippetText.slice(0, 80) + '...' : snippetText,
        result: analysisWithTimestamp,
        hasImage: !!image,
        hasAudio: !!audio,
        hasVideo: !!video
      };

      // Update history state and local storage (limit to 20 items)
      const newHistory = [newItem, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem('vibe_scamalyze_history', JSON.stringify(newHistory));

    } catch (err: any) {
      setError(err.message || "Something went wrong during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistory = (item: HistoryItem) => {
    // Ensure result has timestamp if missing (for legacy history items)
    const resultWithTimestamp = {
      ...item.result,
      timestamp: item.result.timestamp || item.timestamp
    };
    setResult(resultWithTimestamp);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('vibe_scamalyze_history');
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 flex flex-col font-sans selection:bg-white selection:text-black relative">
      
      {/* Animated Background */}
      <div className="fixed inset-0 w-full h-full -z-50 filter brightness-[0.2]">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
        />
      </div>

      {/* Navbar */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={resetAnalysis}>
            <div className="relative">
              <SquareTerminal className={`text-white w-6 h-6 transition-all duration-1000 ${isLoading ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'opacity-80'}`} />
              {isLoading && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
              )}
            </div>
            <span className="text-xl font-bold text-white tracking-tight font-['Space_Grotesk'] group-hover:opacity-80 transition-opacity">
              Shadow Scan
            </span>
          </div>
          <div className="flex items-center gap-4">
             <a href="https://bento.me/oussama-chuiter" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-mono group">
                <span className="group-hover:underline">Connect</span>
                <User size={20} />
             </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
        
        <div className="w-full max-w-4xl">
          
          {!result && (
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter text-white font-['Space_Grotesk'] drop-shadow-lg">
                Shadow Scan.
              </h1>
              <p className="text-zinc-300 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed font-light drop-shadow-md">
                Detect fraud. Reveal manipulation. <br/>Check the vibe before you click.
              </p>
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-950/40 border border-red-900/50 rounded-lg text-red-300 flex items-center gap-3 font-mono text-sm backdrop-blur-sm">
              <span className="text-lg">!</span>
              {error}
            </div>
          )}

          {!result ? (
            <>
              <InputSection onAnalyze={handleAnalyze} isLoading={isLoading} />
              {!isLoading && (
                <HistoryList 
                  history={history} 
                  onSelect={handleSelectHistory} 
                  onClear={clearHistory} 
                />
              )}
            </>
          ) : (
            <AnalysisResultView result={result} onReset={resetAnalysis} />
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/60 backdrop-blur-sm py-8 mt-auto relative z-10">
        <div className="max-w-6xl mx-auto px-4 text-center text-zinc-500 text-xs font-mono">
          <p>Built by Oussama Chuiter</p>
        </div>
      </footer>
    </div>
  );
};

export default App;