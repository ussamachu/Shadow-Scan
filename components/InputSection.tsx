import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Search, Image as ImageIcon, FileText, Loader2, ArrowRight, Camera, SwitchCamera, Square, Trash2, Play, Pause, Bold, Italic, Code, Eye, EyeOff, Film, FileAudio, Clock, Activity, BrainCircuit, ScanLine, Mail, Info, ChevronDown, ChevronUp, Wand2, Youtube } from 'lucide-react';

interface Props {
  onAnalyze: (text: string, image: string | undefined, audio: string | undefined, video: string | undefined, isThinking: boolean) => void;
  isLoading: boolean;
}

interface FileStats {
  name: string;
  size: string;
  type: 'image' | 'video' | 'audio';
  estimatedTime: string;
}

const InputSection: React.FC<Props> = ({ onAnalyze, isLoading }) => {
  const [inputMode, setInputMode] = useState<'text' | 'email' | 'youtube'>('text');
  
  // Text Mode State
  const [text, setText] = useState('');
  
  // Email Mode State
  const [emailFrom, setEmailFrom] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailHeaders, setEmailHeaders] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showHeaders, setShowHeaders] = useState(false);

  // YouTube Mode State
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [fileStats, setFileStats] = useState<FileStats | null>(null);
  const [useThinking, setUseThinking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const emlInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Audio state (Upload only)
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Loading state management
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  // --- Sound Effects Utility ---
  const playSound = (type: 'click' | 'upload' | 'success' | 'delete' | 'scan') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'click') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      } else if (type === 'upload') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.linearRampToValueAtTime(600, now + 0.2);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
      } else if (type === 'delete') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
      } else if (type === 'scan') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.linearRampToValueAtTime(2000, now + 0.1);
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.linearRampToValueAtTime(0.02, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      }
    } catch (e) {
      // Ignore audio errors
    }
  };

  useEffect(() => {
    let messageInterval: ReturnType<typeof setInterval>;
    let progressInterval: ReturnType<typeof setInterval>;

    if (isLoading) {
      playSound('scan');
      setProgress(0);
      const messages = useThinking ? [
        "Initiating deep thought process...",
        "Deconstructing complex patterns...",
        "Evaluating multi-modal context...",
        "Simulating potential threat vectors...",
        "Synthesizing detailed reasoning...",
        "Finalizing comprehensive report..."
      ] : [
        "Reading input stream...",
        "Scanning linguistic patterns...",
        "Checking threat databases...",
        "Analyzing sentiment vectors...",
        "Calculating risk probability...",
        "Finalizing report..."
      ];
      
      let msgIndex = 0;
      setLoadingMessage(messages[0]);

      messageInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        setLoadingMessage(messages[msgIndex]);
      }, 1500); 

      // Simulate progress bar
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev;
          const remaining = 100 - prev;
          const jump = Math.random() * (remaining * (useThinking ? 0.05 : 0.1));
          return prev + Math.max(0.2, jump);
        });
      }, 200);

    } else {
      setProgress(0);
    }

    return () => {
      if (messageInterval) clearInterval(messageInterval);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading, useThinking]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Text formatting logic
  const applyFormat = (format: 'bold' | 'italic' | 'code') => {
    playSound('click');
    if (inputMode === 'email' || inputMode === 'youtube') return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = text.substring(start, end);
    
    let prefix = '';
    let suffix = '';

    if (format === 'bold') {
        prefix = '**';
        suffix = '**';
    } else if (format === 'italic') {
        prefix = '*';
        suffix = '*';
    } else if (format === 'code') {
        prefix = '```\n';
        suffix = '\n```';
    }

    const newText = text.substring(0, start) + prefix + selection + suffix + text.substring(end);
    setText(newText);

    setTimeout(() => {
        textarea.focus();
        if (selection.length > 0) {
            const newPos = start + prefix.length + selection.length + suffix.length;
            textarea.setSelectionRange(newPos, newPos);
        } else {
             const newPos = start + prefix.length;
             textarea.setSelectionRange(newPos, newPos);
        }
    }, 0);
  };

  const renderMarkdown = (inputText: string) => {
    if (!inputText) return { __html: '<span class="text-zinc-600 italic">Preview will appear here...</span>' };

    let html = inputText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-950 border border-white/10 p-3 rounded-md my-2 font-mono text-xs overflow-x-auto text-emerald-400">$1</pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-xs">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-zinc-300">$1</em>')
      .replace(/\n/g, '<br />');

    return { __html: html };
  };

  const deleteAudio = () => {
    playSound('delete');
    setAudioUrl(null);
    setAudioBase64(null);
    setFileStats(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioInputRef.current) {
        audioInputRef.current.value = '';
    }
  };

  const toggleAudioPlayback = () => {
    playSound('click');
    if (audioPlayerRef.current) {
      if (isPlayingAudio) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const startCamera = async () => {
    playSound('click');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Play error:", e));
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    playSound('click'); // Shutter sound
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setImagePreview(dataUrl);
        const sizeInBytes = Math.ceil((dataUrl.length * 3) / 4);
        setFileStats({
            name: `capture_${new Date().getTime()}.png`,
            size: formatBytes(sizeInBytes),
            type: 'image',
            estimatedTime: calculateProcessingTime(sizeInBytes, 'image')
        });
        stopCamera();
      }
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const calculateProcessingTime = (bytes: number, type: 'image' | 'video' | 'audio') => {
    const sizeInMB = bytes / (1024 * 1024);
    let seconds = 3; 

    if (type === 'image') seconds += sizeInMB * 0.5;
    if (type === 'audio') seconds += sizeInMB * 1.5;
    if (type === 'video') seconds += sizeInMB * 2.0;
    
    if (useThinking) seconds = seconds * 2 + 5;

    return `~${Math.ceil(seconds)}s`;
  };

  const updateFileStats = (file: File, type: 'image' | 'video' | 'audio') => {
    playSound('upload');
    setFileStats({
        name: file.name,
        size: formatBytes(file.size),
        type,
        estimatedTime: calculateProcessingTime(file.size, type)
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        updateFileStats(file, 'image');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
          alert("Video file is too large. Please upload a video smaller than 20MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
        updateFileStats(file, 'video');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
          alert("Audio file is too large. Please upload a file smaller than 20MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAudioBase64(result);
        setAudioUrl(result);
        updateFileStats(file, 'audio');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleEmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const text = reader.result as string;
              // If we are in text mode, switch to email mode automatically
              if (inputMode === 'text') {
                  setInputMode('email');
              }
              // If empty email body, populate it with the EML content
              if (!emailBody) {
                  parseRawEmail(text) || setEmailBody(text);
              } else {
                  // If body already exists, append or handle as separate attachment logic
                  setEmailBody(prev => prev + "\n\n--- ATTACHED .EML CONTENT ---\n" + text);
              }
              playSound('upload');
          };
          reader.readAsText(file);
      }
      e.target.value = '';
  };

  const clearImage = () => {
    playSound('delete');
    setImagePreview(null);
    setFileStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearVideo = () => {
    playSound('delete');
    setVideoPreview(null);
    setFileStats(null);
    if (videoInputRef.current) {
        videoInputRef.current.value = '';
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) {
        setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
        playSound('upload');
        const fileType = file.type.split('/')[0];
        
        if (file.name.endsWith('.eml')) {
             const reader = new FileReader();
             reader.onloadend = () => {
                 const text = reader.result as string;
                 setInputMode('email');
                 parseRawEmail(text) || setEmailBody(text);
             };
             reader.readAsText(file);
             return;
        }
        
        if (fileType === 'image') {
             const reader = new FileReader();
             reader.onloadend = () => {
                 setImagePreview(reader.result as string);
                 updateFileStats(file, 'image');
             };
             reader.readAsDataURL(file);
        } else if (fileType === 'audio') {
             if (file.size > 20 * 1024 * 1024) {
                alert("Audio file is too large.");
                return;
             }
             const reader = new FileReader();
             reader.onloadend = () => {
                 const res = reader.result as string;
                 setAudioBase64(res);
                 setAudioUrl(res);
                 updateFileStats(file, 'audio');
             };
             reader.readAsDataURL(file);
        } else if (fileType === 'video') {
             if (file.size > 20 * 1024 * 1024) {
                alert("Video file is too large.");
                return;
             }
             const reader = new FileReader();
             reader.onloadend = () => {
                 setVideoPreview(reader.result as string);
                 updateFileStats(file, 'video');
             };
             reader.readAsDataURL(file);
        }
    }
  };

  // Smart Email Parsing
  const parseRawEmail = (raw: string) => {
    let newHeaders = emailHeaders;
    let newBody = emailBody;
    let newFrom = emailFrom;
    let newSubject = emailSubject;

    // Check if user pasted a full raw email block
    const headerEndIndex = raw.indexOf('\n\n');
    if (headerEndIndex !== -1 && /^(From|To|Subject|Received|Date):/im.test(raw)) {
         newHeaders = raw.substring(0, headerEndIndex);
         newBody = raw.substring(headerEndIndex + 2);
         
         const fromMatch = newHeaders.match(/^From:\s*(.+)$/m);
         if (fromMatch) newFrom = fromMatch[1].trim();

         const subjectMatch = newHeaders.match(/^Subject:\s*(.+)$/m);
         if (subjectMatch) newSubject = subjectMatch[1].trim();
         
         setEmailHeaders(newHeaders);
         setEmailBody(newBody);
         setEmailFrom(newFrom);
         setEmailSubject(newSubject);
         setShowHeaders(true);
         return true;
    }
    return false;
  };
  
  const handleBodyPaste = (e: React.ClipboardEvent) => {
      const pastedData = e.clipboardData.getData('Text');
      if (inputMode === 'email' && !emailHeaders && !emailFrom) {
          if (parseRawEmail(pastedData)) {
              e.preventDefault();
              playSound('success');
          }
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound('click');
    
    let finalPayload = text;
    
    // Construct email payload if in email mode
    if (inputMode === 'email') {
        if (!emailBody && !emailHeaders && !emailSubject) return;
        
        finalPayload = `
[ANALYSIS_TYPE: EMAIL]
Sender: ${emailFrom || 'Unknown'}
Subject: ${emailSubject || 'Unknown'}

--- HEADERS ---
${emailHeaders || 'N/A'}

--- BODY ---
${emailBody}
        `.trim();
    } 
    else if (inputMode === 'youtube') {
        if (!youtubeUrl) return;
        finalPayload = youtubeUrl; // Service will handle fetching
    }
    else {
        if (!text.trim() && !imagePreview && !audioBase64 && !videoPreview) return;
    }

    onAnalyze(finalPayload, imagePreview || undefined, audioBase64 || undefined, videoPreview || undefined, useThinking);
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <style>{`
        @keyframes wave {
          0%, 100% { height: 15%; opacity: 0.5; }
          50% { height: 80%; opacity: 1; }
        }
      `}</style>
      
      {/* Camera Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-3xl h-full max-h-[80vh] bg-black rounded-xl overflow-hidden border border-white/20 shadow-2xl flex flex-col">
            
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 absolute top-0 left-0 right-0 z-10 backdrop-blur-sm">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                LIVE_FEED
              </span>
              <button 
                onClick={stopCamera}
                title="Close Camera"
                className="p-2 bg-black/50 text-white rounded-full hover:bg-zinc-800 transition-colors border border-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 bg-zinc-900 relative flex items-center justify-center">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none opacity-30">
                 <div className="w-full h-full border-2 border-white/10 relative">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-white/20"></div>
                    <div className="absolute left-1/2 top-0 w-px h-full bg-white/20"></div>
                 </div>
              </div>
            </div>

            <div className="p-8 bg-black border-t border-white/10 flex items-center justify-center gap-8">
               <button 
                 onClick={capturePhoto}
                 title="Capture Photo"
                 className="w-16 h-16 rounded-full bg-white border-4 border-zinc-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
               >
                 <div className="w-14 h-14 rounded-full border-2 border-black"></div>
               </button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Input Container with Drag & Drop */}
        <div 
            className="relative group perspective-1000"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
          {isDragging && (
             <div className="absolute inset-0 z-20 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center backdrop-blur-sm transition-all animate-in fade-in duration-200 pointer-events-none">
                 <div className="text-blue-200 font-mono text-lg flex flex-col items-center gap-3">
                     <Upload size={40} className="animate-bounce" />
                     DROP_FILE_TO_SCAN
                 </div>
             </div>
          )}

          <div className={`relative bg-zinc-900/30 rounded-lg border group-hover:border-white/40 group-hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out overflow-hidden ${
              isDragging ? 'border-blue-500' : 'border-white/10 group-focus-within:border-white/40'
          }`}>
            
            {/* Enhanced Scanning Animation Overlay */}
            {isLoading && (
               <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                   {/* Laser Line */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-75 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                   {/* Grid Overlay */}
                   <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
               </div>
            )}

            {/* Toolbar Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-zinc-900/30 rounded-t-lg transition-colors group-hover:bg-zinc-900/50 flex-wrap gap-2">
                <div className="flex items-center gap-1">
                    {inputMode === 'text' && (
                        <>
                            <button type="button" onClick={() => applyFormat('bold')} title="Bold Text" className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 hover:shadow-lg rounded transition-all duration-200 transform hover:scale-110"><Bold size={14} /></button>
                            <button type="button" onClick={() => applyFormat('italic')} title="Italic Text" className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 hover:shadow-lg rounded transition-all duration-200 transform hover:scale-110"><Italic size={14} /></button>
                            <button type="button" onClick={() => applyFormat('code')} title="Code Block" className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 hover:shadow-lg rounded transition-all duration-200 transform hover:scale-110"><Code size={14} /></button>
                        </>
                    )}
                    
                    {inputMode === 'email' && (
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                             <Mail size={14} className="text-blue-400" />
                             <span>EMAIL_MODE</span>
                             <div className="group/info relative">
                                <Info size={14} className="cursor-help hover:text-white transition-colors" />
                                <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-white/10 p-3 rounded text-[10px] text-zinc-400 hidden group-hover/info:block z-50 shadow-xl">
                                    Scans for spoofed senders, SPF/DKIM failures in headers, malicious links, and social engineering urgency.
                                </div>
                             </div>
                        </div>
                    )}

                    {inputMode === 'youtube' && (
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                             <Youtube size={14} className="text-red-500" />
                             <span>YOUTUBE_MODE</span>
                             <div className="group/info relative">
                                <Info size={14} className="cursor-help hover:text-white transition-colors" />
                                <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-white/10 p-3 rounded text-[10px] text-zinc-400 hidden group-hover/info:block z-50 shadow-xl">
                                    Analyzes video metadata, title, and channel info for scams like crypto doubling, fake giveaways, or malicious tutorials.
                                </div>
                             </div>
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => { playSound('click'); setInputMode('text'); }}
                        title="Switch to Text Mode"
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all duration-200 ${inputMode === 'text' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <FileText size={14} />
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => { playSound('click'); setInputMode('email'); }}
                        title="Switch to Email Analysis"
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all duration-200 ${inputMode === 'email' ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <Mail size={14} />
                    </button>

                    <button
                        type="button"
                        onClick={() => { playSound('click'); setInputMode('youtube'); }}
                        title="Switch to YouTube Analysis"
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all duration-200 ${inputMode === 'youtube' ? 'bg-red-500/10 text-red-500' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <Youtube size={14} />
                    </button>
                    
                    {inputMode === 'text' && (
                        <button
                            type="button"
                            onClick={() => { playSound('click'); setShowPreview(!showPreview); }}
                            title={showPreview ? "Hide Markdown Preview" : "Show Markdown Preview"}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all duration-200 transform hover:scale-105 ${
                                showPreview ? 'text-white bg-white/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {inputMode === 'text' ? (
                <div className={showPreview ? "grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10" : ""}>
                    <textarea
                        ref={textareaRef}
                        className={`w-full bg-transparent text-zinc-100 p-5 outline-none resize-none placeholder:text-zinc-600 group-hover:placeholder:text-zinc-500 font-mono text-sm leading-relaxed transition-colors duration-300 ${
                            showPreview ? 'min-h-[200px] h-full' : 'min-h-[160px]'
                        }`}
                        placeholder="// Paste text, drop files, or record audio for scanning..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isLoading}
                        spellCheck={false}
                    />
                    {showPreview && (
                        <div className="bg-black/20 p-5 font-mono text-sm leading-relaxed text-zinc-300 break-words h-full max-h-[400px] overflow-y-auto">
                            <div dangerouslySetInnerHTML={renderMarkdown(text)} />
                        </div>
                    )}
                </div>
            ) : inputMode === 'youtube' ? (
                <div className="p-8 space-y-4">
                    <div className="max-w-xl mx-auto space-y-2">
                        <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">YouTube Video URL</label>
                        <div className="relative">
                            <input 
                                value={youtubeUrl}
                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full bg-black/20 border border-white/5 rounded px-4 py-3 pl-10 text-zinc-200 focus:border-red-500/50 outline-none transition-colors font-mono text-sm"
                            />
                            <Youtube className="absolute left-3 top-3 text-zinc-500" size={16} />
                        </div>
                        <p className="text-[10px] text-zinc-600 font-mono text-center">
                            We'll fetch the video metadata to analyze for scams.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="p-4 space-y-3 font-mono text-sm">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <div className="relative">
                             <span className="absolute left-3 top-2.5 text-xs text-zinc-500 pointer-events-none">FROM:</span>
                             <input 
                                value={emailFrom}
                                onChange={(e) => setEmailFrom(e.target.value)}
                                placeholder="sender@example.com"
                                className="w-full bg-black/20 border border-white/5 rounded px-3 py-2 pl-14 text-zinc-200 focus:border-white/20 outline-none transition-colors"
                             />
                         </div>
                         <div className="relative">
                             <span className="absolute left-3 top-2.5 text-xs text-zinc-500 pointer-events-none">SUBJ:</span>
                             <input 
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                                placeholder="Urgent Action Required..."
                                className="w-full bg-black/20 border border-white/5 rounded px-3 py-2 pl-14 text-zinc-200 focus:border-white/20 outline-none transition-colors"
                             />
                         </div>
                     </div>
                     
                     <div className="border border-white/5 rounded overflow-hidden">
                        <button 
                            type="button" 
                            onClick={() => setShowHeaders(!showHeaders)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-black/20 text-xs text-zinc-500 hover:bg-white/5 transition-colors"
                        >
                            <span>HEADERS (Recommended for deep trace)</span>
                            {showHeaders ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        {showHeaders && (
                            <textarea 
                                value={emailHeaders}
                                onChange={(e) => setEmailHeaders(e.target.value)}
                                placeholder={`Received: from mail.bad-actor.com\nDKIM-Signature: v=1; a=rsa-sha256...`}
                                className="w-full h-24 bg-black/30 p-3 text-xs text-zinc-400 font-mono resize-none outline-none border-t border-white/5"
                            />
                        )}
                     </div>
                     
                     <textarea
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        onPaste={handleBodyPaste}
                        className="w-full bg-black/10 text-zinc-100 p-3 outline-none resize-none placeholder:text-zinc-600 font-mono text-sm min-h-[150px] rounded border border-white/5 focus:border-white/20 transition-colors"
                        placeholder="Paste email body here. (Pro Tip: Paste full raw email here to auto-fill headers!)"
                     />
                </div>
            )}
            
            {/* Attachments Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 rounded-b-lg bg-zinc-900/10 group-hover:bg-zinc-900/30 transition-colors flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => { playSound('click'); fileInputRef.current?.click(); }}
                  title="Upload Image"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 rounded transition-all duration-200 transform active:scale-95"
                  disabled={isLoading}
                >
                  <ImageIcon size={14} />
                  <span className="hidden sm:inline">IMG</span>
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

                <div className="w-px h-4 bg-white/10 mx-1 group-hover:bg-white/20 transition-colors hidden sm:block"></div>

                <button
                  type="button"
                  onClick={() => { playSound('click'); videoInputRef.current?.click(); }}
                  title="Upload Video"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 rounded transition-all duration-200 transform active:scale-95"
                  disabled={isLoading}
                >
                  <Film size={14} />
                  <span className="hidden sm:inline">VIDEO</span>
                </button>
                <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoChange} />

                <div className="w-px h-4 bg-white/10 mx-1 group-hover:bg-white/20 transition-colors hidden sm:block"></div>

                <button
                  type="button"
                  onClick={() => { playSound('click'); emlInputRef.current?.click(); }}
                  title="Upload Email File (.eml)"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 rounded transition-all duration-200 transform active:scale-95"
                  disabled={isLoading}
                >
                  <Mail size={14} />
                  <span className="hidden sm:inline">FILE</span>
                </button>
                <input type="file" ref={emlInputRef} className="hidden" accept=".eml" onChange={handleEmlUpload} />
                
                <div className="w-px h-4 bg-white/10 mx-1 group-hover:bg-white/20 transition-colors hidden sm:block"></div>

                <button
                  type="button"
                  onClick={() => { playSound('click'); audioInputRef.current?.click(); }}
                  title="Upload Audio File"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 rounded transition-all duration-200 transform active:scale-95"
                  disabled={isLoading}
                >
                  <FileAudio size={14} />
                  <span className="hidden sm:inline">AUDIO</span>
                </button>
                <input type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioUpload} />

                <div className="w-px h-4 bg-white/10 mx-1 group-hover:bg-white/20 transition-colors hidden sm:block"></div>

                <button
                  type="button"
                  onClick={startCamera}
                  title="Capture from Camera"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 rounded transition-all duration-200 transform active:scale-95"
                  disabled={isLoading}
                >
                  <Camera size={14} />
                  <span className="hidden sm:inline">CAM</span>
                </button>

              </div>

              <div className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-500 transition-colors hidden sm:block ml-auto">
                {inputMode === 'email' ? 'EMAIL_MODE' : inputMode === 'youtube' ? 'YOUTUBE_MODE' : `${text.length} CHARS`}
              </div>
            </div>
          </div>
        </div>

        {/* File Stats */}
        {fileStats && (
            <div title="File Information" className="flex items-center gap-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs font-mono text-blue-300 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                   <FileText size={14} />
                   <span className="truncate max-w-[200px] font-bold">{fileStats.name}</span>
                </div>
                <div className="w-px h-3 bg-blue-500/30"></div>
                <span>{fileStats.size}</span>
                <div className="w-px h-3 bg-blue-500/30"></div>
                <div className="flex items-center gap-1.5">
                   <Clock size={12} />
                   <span>Est. time: {fileStats.estimatedTime}</span>
                </div>
            </div>
        )}

        {/* Attachments Area */}
        <div className="flex flex-wrap gap-4">
          
          {imagePreview && (
            <div className="relative bg-zinc-900/50 p-3 rounded-lg border border-white/10 inline-block animate-in zoom-in duration-300">
              <img src={imagePreview} alt="Preview" className="h-24 rounded border border-white/5 object-cover" />
              <button type="button" onClick={clearImage} title="Remove Image" disabled={isLoading} className="absolute -top-2 -right-2 bg-black text-zinc-400 p-1 rounded-full hover:text-white hover:bg-zinc-800 transition-colors border border-white/10"><X size={14} /></button>
            </div>
          )}

          {videoPreview && (
            <div className="relative bg-zinc-900/50 p-3 rounded-lg border border-white/10 inline-block animate-in zoom-in duration-300">
                <video src={videoPreview} className="h-24 rounded border border-white/5 object-cover w-32" controls />
                <button type="button" onClick={clearVideo} title="Remove Video" disabled={isLoading} className="absolute -top-2 -right-2 bg-black text-zinc-400 p-1 rounded-full hover:text-white hover:bg-zinc-800 transition-colors border border-white/10"><X size={14} /></button>
            </div>
          )}

          {audioUrl && (
             <div className="relative bg-zinc-900/50 p-3 rounded-lg border border-white/10 flex items-center gap-4 animate-in zoom-in duration-300 w-full md:w-auto">
                <button type="button" onClick={toggleAudioPlayback} title={isPlayingAudio ? "Pause" : "Play"} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors shrink-0">
                  {isPlayingAudio ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                </button>
                <div className="flex-1 mx-4 h-10 flex items-center justify-center gap-1 min-w-[150px]">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-colors duration-300 ${isPlayingAudio ? 'bg-emerald-400' : 'bg-zinc-700'}`}
                      style={{
                        height: isPlayingAudio ? `${Math.max(20, Math.random() * 100)}%` : '4px',
                        animation: isPlayingAudio ? `wave 1s ease-in-out infinite ${i * 0.1}s` : 'none'
                      }}
                    />
                  ))}
                </div>
                <button type="button" onClick={deleteAudio} title="Remove Audio" disabled={isLoading} className="text-zinc-500 hover:text-red-500 transition-colors shrink-0"><Trash2 size={16} /></button>
                <audio ref={audioPlayerRef} src={audioUrl} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
             </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-2 gap-4 md:gap-0">
            
            <div className="relative group/deepscan w-full md:w-auto">
              <button
                  type="button"
                  onClick={() => { playSound('click'); setUseThinking(!useThinking); }}
                  disabled={isLoading}
                  title="Enable Deep Scan: Uses Gemini 3 Pro for deeper reasoning and analysis. Note: This process may take longer."
                  className={`flex items-center justify-center md:justify-start gap-2 px-3 py-2 rounded-full text-xs font-mono transition-all duration-300 hover:scale-105 active:scale-95 border w-full md:w-auto ${
                      useThinking 
                      ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]' 
                      : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 hover:border-white/20'
                  }`}
              >
                  <BrainCircuit size={14} className={useThinking ? "animate-pulse" : ""} />
                  <span>DEEP SCAN</span>
              </button>
              {/* Custom Tooltip */}
              <div className="absolute bottom-full left-0 mb-3 w-64 bg-zinc-900 border border-purple-500/20 p-3 rounded text-[10px] text-zinc-400 hidden group-hover/deepscan:block z-50 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                 <strong className="text-purple-400 block mb-1">Gemini 3 Pro Enabled</strong>
                 Activates advanced reasoning capabilities for complex threats. Analysis will be more thorough but may take longer to complete.
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || (inputMode === 'text' && !text && !imagePreview && !audioBase64 && !videoPreview) || (inputMode === 'email' && !emailBody && !emailHeaders && !emailSubject) || (inputMode === 'youtube' && !youtubeUrl)}
              title="Start Analysis"
              className={`
                group relative overflow-hidden rounded-full px-8 py-3 font-semibold text-sm transition-all duration-300
                ${isLoading 
                  ? 'bg-zinc-900 text-zinc-500 cursor-wait border border-white/10 w-full md:w-auto ml-auto' 
                  : 'bg-white text-black hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] w-full md:w-auto shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.6)]'
                }
              `}
            >
              {isLoading && (
                <div className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all duration-200 ease-out z-0" style={{ width: `${progress}%` }} />
              )}

              <div className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="font-mono text-xs uppercase tracking-wider">{loadingMessage}</span>
                  </>
                ) : (
                  <>
                    <ScanLine size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span className="tracking-wide">Scannn</span>
                  </>
                )}
              </div>
            </button>
        </div>

        {/* Hints */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 opacity-60">
            <button type="button" onClick={() => { playSound('click'); setInputMode('text'); }} className="flex flex-col items-center text-center gap-2 p-3 rounded border border-transparent hover:border-white/5 hover:bg-white/5 hover:scale-105 transition-all duration-300 group/hint">
                <FileText size={18} className="text-zinc-500 group-hover/hint:text-white transition-colors"/>
                <span className="text-[10px] text-zinc-500 group-hover/hint:text-zinc-300 font-mono transition-colors">TEXT_MSG</span>
            </button>
            <button type="button" onClick={() => { playSound('click'); setInputMode('text'); }} className="flex flex-col items-center text-center gap-2 p-3 rounded border border-transparent hover:border-white/5 hover:bg-white/5 hover:scale-105 transition-all duration-300 group/hint">
                <ImageIcon size={18} className="text-zinc-500 group-hover/hint:text-white transition-colors"/>
                <span className="text-[10px] text-zinc-500 group-hover/hint:text-zinc-300 font-mono transition-colors">IMAGES</span>
            </button>
             <button type="button" onClick={() => { playSound('click'); setInputMode('youtube'); }} className="flex flex-col items-center text-center gap-2 p-3 rounded border border-transparent hover:border-white/5 hover:bg-white/5 hover:scale-105 transition-all duration-300 group/hint">
                <Youtube size={18} className="text-zinc-500 group-hover/hint:text-white transition-colors"/>
                <span className="text-[10px] text-zinc-500 group-hover/hint:text-zinc-300 font-mono transition-colors">YOUTUBE</span>
            </button>
            <button type="button" onClick={() => { playSound('click'); setInputMode('email'); }} className="flex flex-col items-center text-center gap-2 p-3 rounded border border-transparent hover:border-white/5 hover:bg-white/5 hover:scale-105 transition-all duration-300 group/hint">
                <Mail size={18} className="text-zinc-500 group-hover/hint:text-white transition-colors"/>
                <span className="text-[10px] text-zinc-500 group-hover/hint:text-zinc-300 font-mono transition-colors">EMAIL</span>
            </button>
        </div>

      </form>
    </div>
  );
};

export default InputSection;