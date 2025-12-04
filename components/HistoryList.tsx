import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { Terminal, Image as ImageIcon, FileText, Trash2, ChevronDown, ChevronUp, Mic, Film, Fish, Coins, Headset, VideoOff, Gift, HeartCrack, ShoppingBag, Briefcase, CreditCard, Skull, ShieldCheck, ArrowUpRight, Target, Triangle, UserX, Bug, Lock, FileWarning, Youtube } from 'lucide-react';

interface Props {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryList: React.FC<Props> = ({ history, onSelect, onClear }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) return null;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const getScamIcon = (scamType: string) => {
    const type = scamType?.toLowerCase() || '';
    const iconProps = { size: 10, className: "text-zinc-400" };

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
    
    return <FileWarning {...iconProps} />;
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between mb-4 px-2 pb-2 border-b border-white/5">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 font-mono">
          <Terminal size={14} className="text-white" />
          SYSTEM_LOGS
        </h3>
        <button
          onClick={onClear}
          className="text-[10px] font-mono font-bold text-zinc-600 hover:text-red-500 flex items-center gap-2 transition-colors hover:bg-white/5 px-2 py-1 rounded uppercase tracking-wider"
        >
          <Trash2 size={12} />
          PURGE_LOGS
        </button>
      </div>

      <div className="space-y-1">
        {history.map((item) => {
          const isHighRisk = item.result.riskLevel === 'CRITICAL' || item.result.riskLevel === 'HIGH';
          const isExpanded = expandedId === item.id;
          
          // Determine if text was part of the analysis
          const defaultPlaceholders = ["Audio Analysis", "Image Analysis", "Content Analysis", "Video Analysis"];
          const hasText = !defaultPlaceholders.includes(item.snippet);

          return (
            <div
              key={item.id}
              className="w-full group relative overflow-hidden bg-black border border-white/5 hover:border-white/20 transition-all duration-200 text-left mb-1 rounded-sm"
            >
              <div 
                className="flex h-full items-stretch cursor-pointer select-none"
                onClick={(e) => toggleExpand(item.id, e)}
              >
                {/* Risk Indicator Bar */}
                <div className={`w-1 ${
                  isHighRisk ? 'bg-red-600' : 
                  item.result.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-emerald-500'
                }`} />

                <div className="flex-1 p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm font-mono tracking-wider ${
                         isHighRisk ? 'text-red-500 bg-red-500/10' : 
                         item.result.riskLevel === 'MEDIUM' ? 'text-yellow-500 bg-yellow-500/10' : 'text-emerald-500 bg-emerald-500/10'
                      }`}>
                        {item.result.riskLevel}
                      </span>
                      {item.result.scamType && (
                        <div className="flex items-center gap-1.5 text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded hidden sm:flex">
                          {getScamIcon(item.result.scamType)}
                          <span className="text-[10px] font-mono">
                            {item.result.scamType}
                          </span>
                        </div>
                      )}
                      <span className="text-[10px] text-zinc-600 font-mono ml-auto">
                        {new Date(item.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})} {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-zinc-300">
                       {/* Modality Icons Container */}
                       <div className="flex items-center gap-1.5 bg-zinc-900/50 px-1.5 py-0.5 rounded border border-white/5">
                           {hasText && <FileText size={12} className="text-zinc-400" aria-label="Text content" />}
                           {item.hasImage && <ImageIcon size={12} className="text-blue-400" aria-label="Image content" />}
                           {item.hasAudio && <Mic size={12} className="text-red-400" aria-label="Audio content" />}
                           {item.hasVideo && <Film size={12} className="text-purple-400" aria-label="Video content" />}
                       </div>

                       <span className="font-bold text-sm tracking-tight group-hover:text-white transition-colors font-space truncate">
                          {item.result.verdict}
                       </span>
                    </div>

                    {!isExpanded && (
                      <p className="text-xs text-zinc-500 mt-1 truncate font-mono pl-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        {item.snippet}
                      </p>
                    )}
                  </div>

                  <div className="self-center text-zinc-600 group-hover:text-zinc-400 transition-colors">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="bg-zinc-900/30 border-t border-white/5 p-4 pl-6 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                            <h4 className="text-[10px] uppercase text-zinc-500 font-mono mb-1">Scam Type</h4>
                            <p className="text-zinc-300 text-sm font-mono flex items-center gap-2">
                                {getScamIcon(item.result.scamType)} {item.result.scamType}
                            </p>
                        </div>
                         <div>
                            <h4 className="text-[10px] uppercase text-zinc-500 font-mono mb-1">Intent</h4>
                            <p className="text-zinc-300 text-sm font-mono">{item.result.senderIntent || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <h4 className="text-[10px] uppercase text-zinc-500 font-mono mb-1">Full Snippet</h4>
                        <p className="text-zinc-400 text-xs font-mono bg-black/50 p-2 rounded border border-white/5 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                           {item.snippet}
                        </p>
                    </div>

                    <button 
                        onClick={(e) => { e.stopPropagation(); onSelect(item); }}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded font-mono text-xs font-bold hover:bg-zinc-200 transition-colors shadow-lg"
                    >
                        OPEN_FULL_REPORT <ArrowUpRight size={14} />
                    </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryList;