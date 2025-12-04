import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, ScamLikelihood } from '../types';
import { ShieldCheck, ShieldAlert, Siren, TriangleAlert, Check, X, RotateCcw, Volume2, Loader2, Quote, StopCircle, Activity, Gauge, Download, Crosshair, Tag, Fish, Coins, Headset, VideoOff, Gift, HeartCrack, ShoppingBag, Briefcase, CreditCard, Skull, ChevronDown, ChevronUp, Scan, Fingerprint, ThumbsUp, ThumbsDown, Copy, Youtube, Target, Triangle, UserX, Bug, Lock, FileWarning } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResultView: React.FC<Props> = ({ result, onReset }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showThoughtProcess, setShowThoughtProcess] = useState(false);
  const [userRating, setUserRating] = useState<'up' | 'down' | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Generate a pseudo-ID for the feedback key based on summary content hash
  const feedbackKey = `feedback_${btoa(result.summary.slice(0, 20) + (result.timestamp || ''))}`;

  useEffect(() => {
    const savedRating = localStorage.getItem(feedbackKey);
    if (savedRating === 'up' || savedRating === 'down') {
        setUserRating(savedRating);
    }

    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [feedbackKey]);

  const handleRating = (rating: 'up' | 'down') => {
      setUserRating(rating);
      localStorage.setItem(feedbackKey, rating);
      // In a real app, send this to analytics endpoint
  };

  const RiskIcon = () => {
    switch (result.riskLevel) {
      case ScamLikelihood.LOW: return <ShieldCheck className="w-12 h-12 text-emerald-500" />;
      case ScamLikelihood.MEDIUM: return <TriangleAlert className="w-12 h-12 text-yellow-500" />;
      case ScamLikelihood.HIGH: return <ShieldAlert className="w-12 h-12 text-orange-500" />;
      case ScamLikelihood.CRITICAL: return <Siren className="w-12 h-12 text-red-500 animate-pulse" />;
      default: return <ShieldCheck className="w-12 h-12 text-zinc-500" />;
    }
  };

  const getScamIcon = (scamType: string) => {
    const type = scamType?.toLowerCase() || '';
    const iconProps = { size: 14 };

    // Expanded Icon Mapping
    if (type.includes('youtube') || type.includes('video platform')) return <Youtube {...iconProps} className="text-red-500" />;
    if (type.includes('spear') || type.includes('target')) return <Target {...iconProps} className="text-red-600" />;
    if (type.includes('ponzi') || type.includes('pyramid') || type.includes('scheme')) return <Triangle {...iconProps} className="text-orange-500" />;
    if (type.includes('impersonat') || type.includes('fake profile') || type.includes('identity')) return <UserX {...iconProps} className="text-purple-500" />;
    if (type.includes('malware') || type.includes('virus') || type.includes('trojan') || type.includes('apk')) return <Bug {...iconProps} className="text-lime-500" />;
    if (type.includes('ransom') || type.includes('lock')) return <Lock {...iconProps} className="text-rose-600" />;
    if (type.includes('phish')) return <Fish {...iconProps} className="text-blue-400" />;
    if (type.includes('invest') || type.includes('crypto') || type.includes('pig') || type.includes('money')) return <Coins {...iconProps} className="text-yellow-400" />;
    if (type.includes('tech') || type.includes('support')) return <Headset {...iconProps} className="text-purple-400" />;
    if (type.includes('sex') || type.includes('blackmail')) return <VideoOff {...iconProps} className="text-red-400" />;
    if (type.includes('giveaway') || type.includes('lottery') || type.includes('free')) return <Gift {...iconProps} className="text-pink-400" />;
    if (type.includes('romance') || type.includes('love') || type.includes('date')) return <HeartCrack {...iconProps} className="text-rose-500" />;
    if (type.includes('shop') || type.includes('store') || type.includes('purchase')) return <ShoppingBag {...iconProps} className="text-orange-400" />;
    if (type.includes('job') || type.includes('employ') || type.includes('work')) return <Briefcase {...iconProps} className="text-cyan-400" />;
    if (type.includes('bank') || type.includes('card')) return <CreditCard {...iconProps} className="text-emerald-400" />;
    if (type.includes('safe') || type.includes('benign')) return <ShieldCheck {...iconProps} className="text-emerald-500" />;
    
    return <FileWarning {...iconProps} className="text-zinc-400" />;
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const handleSpeak = async () => {
    if (isPlaying) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setIsSpeaking(true);
    try {
      const script = `Analysis complete. Verdict: ${result.verdict}. Risk level: ${result.riskLevel}. ${result.summary} My advice: ${result.advice}`;
      const audioBase64 = await generateSpeech(script);
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      const rawBytes = decodeBase64(audioBase64);
      const dataInt16 = new Int16Array(rawBytes.buffer);
      const float32Data = new Float32Array(dataInt16.length);
      for (let i = 0; i < dataInt16.length; i++) {
        float32Data[i] = dataInt16[i] / 32768.0;
      }
      
      const buffer = ctx.createBuffer(1, float32Data.length, 24000);
      buffer.getChannelData(0).set(float32Data);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        audioSourceRef.current = null;
      };
      
      audioSourceRef.current = source;
      source.start();
      setIsPlaying(true);

    } catch (err) {
      console.error("Failed to play TTS", err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = `Verdict: ${result.verdict}\nSummary: ${result.summary}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    });
  };

  const handleExport = () => {
    const reportDate = new Date().toLocaleString();
    const content = `SHADOW SCAN REPORT\n=====================\nDate: ${reportDate}\n\nVERDICT: ${result.verdict}\nRISK LEVEL: ${result.riskLevel}\nSCAM PROBABILITY: ${result.scamLikelihood}%\nVIBE SCORE: ${result.vibeScore}/100\n\nTHREAT INTELLIGENCE\n---------------------\nType: ${result.scamType || 'N/A'}\nGoal: ${result.senderIntent || 'N/A'}\n\nANALYSIS CONTEXT\n---------------------\nContent: ${result.contentAnalysis || 'N/A'}\nReasoning: ${result.thoughtProcess || 'N/A'}\n\n---------------------\nEXECUTIVE SUMMARY\n---------------------\n${result.summary}\n\n---------------------\nADVICE\n---------------------\n${result.advice}\n\n=====================\nGenerated by Shadow Scan AI`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadow_scan_report_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const riskColorClass = 
    result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH' ? 'text-red-500' : 
    result.riskLevel === 'MEDIUM' ? 'text-yellow-500' : 'text-emerald-500';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Analysis Context & Trace */}
      <div className="bg-zinc-950/80 rounded-lg border border-blue-500/20 overflow-hidden shadow-[0_0_20px_-10px_rgba(59,130,246,0.15)] relative group">
         <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
         <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/30">
            <div className="flex items-center gap-4">
               <div className="bg-blue-500/10 p-2 rounded-md border border-blue-500/20">
                  <Scan size={20} className="text-blue-400" />
               </div>
               <div>
                   <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-0.5">Input Recognition</h3>
                   <div className="flex items-center gap-2">
                      <span className="text-zinc-200 font-bold font-mono text-sm tracking-tight">{result.contentAnalysis || "Processing Input..."}</span>
                   </div>
               </div>
            </div>
            <div className="text-xs font-mono text-zinc-500 flex items-center gap-2">
                <Fingerprint size={12} />
                <span>ID: {Date.now().toString(36).toUpperCase()}</span>
            </div>
         </div>
         {result.thoughtProcess && (
            <div className="border-t border-white/5">
                <button 
                    onClick={() => setShowThoughtProcess(!showThoughtProcess)}
                    className="w-full flex items-center justify-between p-3 text-xs font-mono text-zinc-500 hover:text-blue-400 hover:bg-white/5 transition-colors group"
                >
                    <span className="flex items-center gap-2">
                       {showThoughtProcess ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                       VIEW_AI_REASONING_TRACE
                    </span>
                    <span className="text-[10px] bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-500 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-colors">
                        CONFIDENCE: HIGH
                    </span>
                </button>
                {showThoughtProcess && (
                    <div className="p-5 bg-black/40 text-zinc-300 font-mono text-xs leading-relaxed border-t border-white/5 animate-in slide-in-from-top-2">
                        <div className="flex gap-3">
                            <div className="w-px bg-zinc-800 my-1"></div>
                            <p className="whitespace-pre-line flex-1">{result.thoughtProcess}</p>
                        </div>
                    </div>
                )}
            </div>
         )}
      </div>

      {/* Header Verdict Card */}
      <div className="bg-black rounded-lg p-8 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/5 to-transparent blur-3xl rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2`}></div>

        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 bg-zinc-900 rounded-full border border-white/5 shadow-lg shadow-black/50">
            <RiskIcon />
          </div>
          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
              Final Verdict 
              <div className="h-px bg-zinc-800 w-12"></div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">{result.verdict}</h2>
            <div className={`inline-flex items-center px-2 py-0.5 rounded border ${
              result.riskLevel === 'CRITICAL' || result.riskLevel === 'HIGH' ? 'border-red-500/30 bg-red-500/10 text-red-500' : 
              result.riskLevel === 'MEDIUM' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
            }`}>
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Risk Level: {result.riskLevel}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 ml-auto md:ml-0 relative z-10">
          <div className="flex gap-2">
            <button
                onClick={handleSpeak}
                disabled={isSpeaking}
                title="Read Summary"
                className={`group flex items-center justify-center w-10 h-10 rounded-full border transition-all ${isPlaying ? 'bg-red-500/10 text-red-500 border-red-500 hover:bg-red-500/20' : 'bg-black text-white border-zinc-700 hover:border-white hover:bg-zinc-900'}`}
            >
                {isSpeaking ? <Loader2 size={16} className="animate-spin" /> : isPlaying ? <StopCircle size={16} /> : <Volume2 size={16} />}
            </button>
            <button 
                onClick={handleCopy} 
                title="Copy Analysis Summary" 
                className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-700 bg-black text-white hover:border-white hover:bg-zinc-900 transition-all"
            >
                {hasCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
            <button onClick={handleExport} title="Download Report" className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-700 bg-black text-white hover:border-white hover:bg-zinc-900 transition-all">
                <Download size={16} />
            </button>
          </div>
          <button onClick={onReset} className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-100 text-black hover:bg-white rounded-full transition-colors font-medium text-sm border border-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform duration-500" />
            New Scan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Scam Probability */}
        <div className="bg-black rounded-lg p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors flex flex-col justify-between h-56">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
                <Activity className="text-zinc-500 w-4 h-4" />
                <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Risk Probability</h3>
            </div>
            <span className={`text-2xl font-bold font-mono ${riskColorClass}`}>{result.scamLikelihood}%</span>
          </div>
          <div className="relative w-full flex-1 flex flex-col justify-center">
             <div className="flex justify-between mb-2">
                 <span className="text-[10px] font-mono text-emerald-500">SAFE</span>
                 <span className="text-[10px] font-mono text-red-500">CRITICAL</span>
             </div>
             <div className="relative h-8 bg-zinc-900/50 rounded flex gap-1 p-1 border border-white/5">
                {[...Array(20)].map((_, i) => {
                    const threshold = (i + 1) * 5;
                    const isFilled = result.scamLikelihood >= threshold || (result.scamLikelihood > threshold - 5 && result.scamLikelihood < threshold);
                    const isPartial = result.scamLikelihood > threshold - 5 && result.scamLikelihood < threshold;
                    let barColor = 'bg-zinc-800';
                    if (isFilled) {
                        if (threshold <= 30) barColor = 'bg-emerald-500';
                        else if (threshold <= 70) barColor = 'bg-yellow-500';
                        else barColor = 'bg-red-500';
                    }
                    return (
                        <div key={i} className={`flex-1 rounded-sm transition-all duration-500 ${barColor} ${isPartial ? 'opacity-50' : ''}`} style={{ opacity: isFilled ? 1 : 0.2 }}></div>
                    );
                })}
             </div>
             <p className="text-xs text-zinc-500 font-mono mt-4 text-left border-l-2 border-zinc-800 pl-3">Calculated based on linguistic patterns, urgency markers, and known threat signatures.</p>
          </div>
        </div>

        {/* Vibe Score */}
        <div className="bg-black rounded-lg p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-colors flex flex-col h-56">
          <div className="flex justify-between items-start mb-2">
             <div className="flex items-center gap-2">
                <Gauge className="text-zinc-500 w-4 h-4" />
                <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider">Vibe Check</h3>
             </div>
             <div className="text-right">
                <span className="text-2xl font-bold font-mono text-white block leading-none">{result.vibeScore}</span>
                <span className="text-[10px] text-zinc-500 font-mono">OUT OF 100</span>
             </div>
          </div>
          
          <div className="flex-1 relative flex items-end justify-center pb-0">
             <svg viewBox="0 0 200 110" className="w-full h-full max-h-[160px]">
                <defs>
                    <linearGradient id="vibeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="45%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <path d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke="#18181b" strokeWidth="12" strokeLinecap="butt" />
                {Array.from({ length: 11 }).map((_, i) => {
                    const angle = 180 + (i * 18);
                    const rad = (angle * Math.PI) / 180;
                    const rInner = 80; const rOuter = 88;
                    const x1 = 100 + rInner * Math.cos(rad); const y1 = 100 + rInner * Math.sin(rad);
                    const x2 = 100 + rOuter * Math.cos(rad); const y2 = 100 + rOuter * Math.sin(rad);
                    return (<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 5 === 0 ? "#52525b" : "#27272a"} strokeWidth={i % 5 === 0 ? 2 : 1} />);
                })}
                <path d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke="url(#vibeGradient)" strokeWidth="8" strokeLinecap="butt" strokeDasharray="219.9" strokeDashoffset={219.9 - (219.9 * result.vibeScore / 100)} className="transition-all duration-1000 ease-out" filter="url(#glow)" />
                <g className="transition-transform duration-1000 ease-out" style={{ transformOrigin: '100px 100px', transform: `rotate(${(result.vibeScore / 100) * 180 - 90}deg)` }}>
                    <circle cx="100" cy="100" r="6" fill="#18181b" stroke="white" strokeWidth="2" />
                    <path d="M 100 100 L 100 45 L 97 90 L 103 90 Z" fill="white" />
                </g>
                <text x="30" y="115" className="fill-red-500 text-[9px] font-mono uppercase font-bold tracking-widest">Creepy</text>
                <text x="170" y="115" textAnchor="end" className="fill-emerald-500 text-[9px] font-mono uppercase font-bold tracking-widest">Chill</text>
             </svg>
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-black rounded-lg p-8 border border-white/10">
            <div className="flex items-center gap-2 mb-6 pb-6 border-b border-white/5">
                <Crosshair className="text-zinc-500" size={16} />
                <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">Threat Intelligence</h3>
                <div className="ml-auto bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-xs font-mono text-white flex items-center gap-2">
                    {getScamIcon(result.scamType)}
                    {result.scamType || "General Suspicion"}
                </div>
            </div>
            {result.senderIntent && (
                <div className="mb-8 bg-zinc-900/30 p-4 rounded border-l-2 border-orange-500">
                    <h4 className="text-xs font-mono text-orange-500 uppercase tracking-wider mb-2">Detected Intent</h4>
                    <p className="text-zinc-200 text-sm font-medium leading-relaxed font-mono">"{result.senderIntent}"</p>
                </div>
            )}
            <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">Executive Summary</h3>
            <p className="text-zinc-100 leading-relaxed text-lg font-light">{result.summary}</p>
            {result.transcription && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Quote size={12} /> Audio Transcription</h3>
                <div className="bg-zinc-900/50 p-4 rounded border border-white/5 text-zinc-300 italic text-sm leading-relaxed font-mono">"{result.transcription}"</div>
              </div>
            )}
            <div className="mt-8 pt-8 border-t border-white/5">
               <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">Recommended Action</h3>
               <p className="text-white font-medium">{result.advice}</p>
            </div>
            
            {/* Feedback Section */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Was this analysis accurate?</span>
                <div className="flex gap-3">
                    <button 
                        onClick={() => handleRating('up')}
                        className={`p-2 rounded-full border transition-all ${userRating === 'up' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-800 text-zinc-500 hover:text-emerald-400 hover:border-emerald-500/50'}`}
                        title="Good Analysis"
                    >
                        <ThumbsUp size={16} />
                    </button>
                    <button 
                        onClick={() => handleRating('down')}
                        className={`p-2 rounded-full border transition-all ${userRating === 'down' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/50'}`}
                        title="Bad Analysis"
                    >
                        <ThumbsDown size={16} />
                    </button>
                </div>
            </div>

          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-black rounded-lg p-5 border border-red-500/20 shadow-[0_0_30px_-10px_rgba(239,68,68,0.1)]">
            <h3 className="text-red-500 font-mono text-xs uppercase tracking-wider mb-3 flex items-center gap-2"><X size={14} /> Red Flags</h3>
            <ul className="space-y-3">
              {result.redFlags.length > 0 ? ( result.redFlags.map((flag, idx) => (<li key={idx} className="text-zinc-300 text-sm leading-snug p-2 rounded hover:bg-white/5 hover:translate-x-1 transition-all duration-200 flex items-start"><span className="text-red-900 mr-2 text-xs mt-1">●</span>{flag}</li>)) ) : ( <li className="text-zinc-500 italic text-sm">None detected.</li> )}
            </ul>
          </div>
          <div className="bg-black rounded-lg p-5 border border-emerald-500/20 shadow-[0_0_30px_-10px_rgba(16,185,129,0.1)]">
            <h3 className="text-emerald-500 font-mono text-xs uppercase tracking-wider mb-3 flex items-center gap-2"><Check size={14} /> Green Flags</h3>
            <ul className="space-y-3">
              {result.greenFlags.length > 0 ? ( result.greenFlags.map((flag, idx) => (<li key={idx} className="text-zinc-300 text-sm leading-snug p-2 rounded hover:bg-white/5 hover:translate-x-1 transition-all duration-200 flex items-start"><span className="text-emerald-900 mr-2 text-xs mt-1">●</span>{flag}</li>)) ) : ( <li className="text-zinc-500 italic text-sm">No specific positive indicators.</li> )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultView;