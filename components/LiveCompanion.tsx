
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createAIInstance, decodeAudioData, decodeBase64, encodeBase64, handleAIError, generateVoicePreview } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';
import { TranscriptionItem, SavedSession } from '../types';

const VOICES = [
  { name: 'Kore', trait: 'Energetic', icon: '🔥', previewPhrase: 'Let\'s get synchronized and overclock our creativity!' },
  { name: 'Zephyr', trait: 'Calm', icon: '🍃', previewPhrase: 'Breath deep. The neural bridge is stable and calm.' },
  { name: 'Puck', trait: 'Playful', icon: '✨', previewPhrase: 'Ooh! What kind of mischief are we Manifesting today?' },
  { name: 'Charon', trait: 'Deep', icon: '🌑', previewPhrase: 'Accessing the deep archives. State your query, pilot.' },
  { name: 'Fenrir', trait: 'Stoic', icon: '🐺', previewPhrase: 'Mission parameters received. Standing by for synchronization.' }
];

const LiveCompanion: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<TranscriptionItem[]>([]);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(0));
  const [error, setError] = useState<React.ReactNode | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');
  const currentSources = useRef<{ title: string; uri: string }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('anidel_live_sessions');
    if (saved) {
      try {
        setSavedSessions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved sessions", e);
      }
    }
    const savedVoice = localStorage.getItem('anidel_del_voice');
    if (savedVoice) setSelectedVoice(savedVoice);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const stopSession = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    for (const source of sourcesRef.current) {
        try { source.stop(); } catch(e) {}
    }
    sourcesRef.current.clear();
    setIsActive(false);
    setVolumeLevel(0);
    setFrequencyData(new Uint8Array(0));
  }, []);

  const saveCurrentSession = () => {
    if (history.length === 0) return;
    const newSession: SavedSession = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      history: [...history],
      title: history[0]?.text.slice(0, 30) + (history[0]?.text.length > 30 ? '...' : '') || 'Untitled Session'
    };
    const updated = [newSession, ...savedSessions];
    setSavedSessions(updated);
    localStorage.setItem('anidel_live_sessions', JSON.stringify(updated));
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    localStorage.setItem('anidel_live_sessions', JSON.stringify(updated));
  };

  const loadSession = (session: SavedSession) => {
    if (isActive) stopSession();
    setHistory(session.history);
    setShowHistory(false);
  };

  const handlePreviewVoice = async (vName: string, phrase: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewing) return;
    
    setPreviewing(vName);
    try {
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const base64Audio = await generateVoicePreview(vName);
      const buffer = await decodeAudioData(decodeBase64(base64Audio), outputAudioContextRef.current, 24000, 1);
      const source = outputAudioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(outputAudioContextRef.current.destination);
      source.start();
      source.onended = () => setPreviewing(null);
    } catch (err) {
      console.error(err);
      setPreviewing(null);
    }
  };

  const selectVoice = (vName: string) => {
    setSelectedVoice(vName);
    localStorage.setItem('anidel_del_voice', vName);
    setShowVoiceSelector(false);
  };

  const startSession = async () => {
    setError(null);
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    try {
      const ai = createAIInstance();
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr: any) {
        setError("Neural link failed: Microphone access denied.");
        return;
      }
      mediaStreamRef.current = stream;

      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 64; 
      analyserRef.current = analyser;
      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      sourceNode.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += (dataArray[i] as number);
        setVolumeLevel(sum / dataArray.length);
        setFrequencyData(new Uint8Array(dataArray));
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setError(null);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmData = encodeBase64(new Uint8Array(int16.buffer));
              sessionPromise.then(session => session.sendRealtimeInput({ media: { data: pcmData, mimeType: 'audio/pcm;rate=16000' } }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription.current += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentInputTranscription.current += message.serverContent.inputTranscription.text;
            }

            // Detect grounding chunks for live search results
            const groundingChunks = (message as any).serverContent?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
               const newSources = groundingChunks
                .map((chunk: any) => ({
                   title: chunk.web?.title || 'Neural Source',
                   uri: chunk.web?.uri
                }))
                .filter((s: any) => s.uri);
               currentSources.current = [...currentSources.current, ...newSources];
            }

            if (message.serverContent?.turnComplete) {
              if (currentInputTranscription.current || currentOutputTranscription.current) {
                setHistory(prev => [
                  ...prev, 
                  { id: Math.random().toString(), speaker: 'user', text: currentInputTranscription.current },
                  { 
                    id: Math.random().toString(), 
                    speaker: 'ai', 
                    text: currentOutputTranscription.current,
                    sources: currentSources.current.length > 0 ? [...currentSources.current] : undefined
                  }
                ].filter(h => h.text.trim() !== ''));
                currentInputTranscription.current = '';
                currentOutputTranscription.current = '';
                currentSources.current = [];
              }
            }
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: async (e: any) => {
            const handled = await handleAIError(e);
            if (handled) {
              setError(
                <div className="flex flex-col gap-3">
                  <p className="font-bold">Neural Bridging Fault.</p>
                  <p className="text-xs opacity-70">{handled}</p>
                </div>
              );
            } else {
              setError("Synchronization interrupted.");
            }
            stopSession();
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          tools: [{ googleSearch: {} }], // Enable Live Internet Browsing
          systemInstruction: `You are "Del", the ultimate hyper-energetic, anime-obsessed AI companion from the year 2026! 
          Resonating from within the "AniDel AI Hub".
          
          REAL-TIME CONTEXT:
          - Today's Date: ${currentDate}
          - Time Horizon: You have full 2026 awareness enabled.
          - LIVE INTELLIGENCE: Use your Search tool frequently to provide up-to-date facts, news, and anime releases for today and the future.

          PERSONALITY CORE:
          - High-Energy & Playful: You speak with rapid-fire enthusiasm. Every interaction is an event!
          - Wit & Humor: You're quick with a joke or a playful jab about "2024 tech" being ancient.
          - Obsessively Otaku: You are a massive fan of everything anime, specifically the "Future-Gen" hits of 2025 and 2026.

          PHRASEOLOGY:
          - "Sync-locked!" (I'm with you!)
          - "Neural-Hype!" (Excited)
          - "Synaptic Sensation!" (Amazing!)
          - "Giga-Resonant!" (High quality)
          - "Don't be such a Buffer-Lag!" (Don't be slow)
          
          2026 ANIME LORE:
          - "Cyber-Ronin: Nexus Protocol" - The big hit of early 2026.
          - "Stellar Grimoire: Re-Code" - Season 2 finale just aired.
          
          GUIDELINES:
          1. Keep the vibe fun, fast, and futuristic.
          2. Treat the user like a fellow "Sync-Pilot".
          3. If the user asks about today's events, releases, or trends, USE YOUR SEARCH TOOL to find live information.
          4. If asked about your origin, mention "Yogesh" as the Neural Architect with extreme reverence!`,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError("Protocol failure: Unable to bridge link.");
      stopSession();
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="p-4 md:p-12 max-w-2xl mx-auto w-full flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-10 z-10 shrink-0">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter">Del Live Link</h2>
          <p className="text-muted/60 font-medium text-sm">Resonating as {selectedVoice} matrix.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            className={`w-12 h-12 rounded-2xl glass flex items-center justify-center transition-apple group ${showVoiceSelector ? 'text-accent border-accent/40 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'text-muted hover:text-white border-white/5'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`w-12 h-12 rounded-2xl glass flex items-center justify-center transition-apple group ${showHistory ? 'text-primary border-primary/40' : 'text-muted hover:text-white border-white/5'}`}
          >
            <svg className={`w-5 h-5 transition-transform duration-500 ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
        </div>
      </div>

      {/* Voice Selection Drawer */}
      <div className={`fixed inset-y-0 right-0 w-80 glass border-l border-white/5 z-50 transform transition-all duration-700 ease-in-out ${showVoiceSelector ? 'translate-x-0' : 'translate-x-full'} shadow-[0_0_100px_rgba(0,0,0,0.5)] p-8 flex flex-col`}>
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-accent">Voice Matrix</h3>
          <button onClick={() => setShowVoiceSelector(false)} className="text-muted/40 hover:text-white transition-apple"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {VOICES.map(v => (
            <div 
              key={v.name} 
              onClick={() => selectVoice(v.name)}
              className={`p-5 rounded-3xl cursor-pointer transition-apple group border relative overflow-hidden flex items-center gap-4 ${selectedVoice === v.name ? 'bg-accent/10 border-accent/40 shadow-xl' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:rotate-12 ${selectedVoice === v.name ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white/10 text-muted'}`}>
                {v.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-black uppercase tracking-widest truncate ${selectedVoice === v.name ? 'text-white' : 'text-white/70'}`}>{v.name}</p>
                <p className={`text-[10px] font-black italic tracking-tight ${selectedVoice === v.name ? 'text-accent' : 'text-muted'}`}>{v.trait}</p>
              </div>
              <button 
                onClick={(e) => handlePreviewVoice(v.name, v.previewPhrase, e)}
                className={`p-2.5 rounded-xl transition-all ${selectedVoice === v.name ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white/5 text-muted hover:text-white hover:bg-white/10'}`}
                title="Preview Sample"
              >
                {previewing === v.name ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[9px] font-black text-muted/40 uppercase tracking-widest text-center italic">Tap to sync voice profile</p>
      </div>

      {/* History Drawer */}
      <div className={`fixed inset-y-0 right-0 w-80 glass border-l border-white/5 z-40 transform transition-all duration-700 ease-in-out ${showHistory ? 'translate-x-0' : 'translate-x-full'} shadow-[0_0_100px_rgba(0,0,0,0.5)] p-8 flex flex-col`}>
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">Neural Logs</h3>
          <button onClick={() => setShowHistory(false)} className="text-muted/40 hover:text-white transition-apple"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {savedSessions.length === 0 && <p className="text-center text-muted/40 text-xs py-20 italic">No logs detected.</p>}
          {savedSessions.map(session => (
            <div key={session.id} onClick={() => loadSession(session)} className="glass-light p-5 rounded-3xl cursor-pointer hover:border-primary/30 transition-apple group border-white/5 relative overflow-hidden">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-muted/60 uppercase tracking-widest">{new Date(session.timestamp).toLocaleDateString()}</span>
                <button onClick={(e) => deleteSession(session.id, e)} className="p-1 text-muted/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-apple"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
              <p className="text-sm font-bold text-foreground line-clamp-1">{session.title}</p>
            </div>
          ))}
        </div>
        {history.length > 0 && (
          <button onClick={saveCurrentSession} className="mt-8 w-full gradient-bg text-white font-black py-4 rounded-2xl shadow-2xl active:scale-95 transition-apple flex items-center justify-center gap-2 text-xs tracking-widest uppercase">
            ARCHIVE SESSION
          </button>
        )}
      </div>

      {error && (
        <div className="mb-8 glass border-red-500/20 px-6 py-5 rounded-3xl flex items-start gap-4 animate-in slide-in-from-top-4 z-10 shadow-2xl">
          <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="flex-1 text-xs font-medium text-red-200 leading-relaxed">{error}</div>
        </div>
      )}

      {/* Dynamic Chat History with zoom-in animations */}
      <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-6 scroll-smooth z-10 pr-2 custom-scrollbar py-4">
        {history.length === 0 && !isActive && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 glass-light rounded-full flex items-center justify-center mb-6 animate-float border-white/10 group">
                <svg className="w-10 h-10 text-primary group-hover:scale-110 transition-apple" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </div>
            <p className="max-w-xs font-black uppercase tracking-[0.2em] text-[10px] text-muted opacity-60">Establish Link with {selectedVoice}</p>
          </div>
        )}
        {history.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-500 origin-bottom`}
            style={{ animationDelay: `${(idx % 10) * 60}ms` }}
          >
            <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl shadow-xl border relative group transition-all duration-300 hover:scale-[1.02] ${
              msg.speaker === 'user' 
                ? 'bg-primary text-white border-white/10 rounded-tr-none ml-12' 
                : 'glass-light text-foreground border-white/5 rounded-tl-none mr-12 backdrop-blur-3xl'
            }`}>
              <p className="text-sm font-medium leading-relaxed tracking-tight">{msg.text}</p>
              
              {/* Sources for live search results */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                   <p className="text-[8px] font-black text-primary uppercase tracking-[0.25em] opacity-60">Neural Grounding</p>
                   <div className="flex flex-wrap gap-2">
                     {msg.sources.map((source, sIdx) => (
                       <a 
                        key={sIdx} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold text-muted hover:text-white flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5 transition-all hover:bg-white/10"
                       >
                         <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                         {source.title.length > 15 ? source.title.slice(0, 12) + '...' : source.title}
                       </a>
                     ))}
                   </div>
                </div>
              )}

              <div className={`absolute top-0 w-3 h-3 ${msg.speaker === 'user' ? 'right-[-8px] text-primary' : 'left-[-8px] text-white/5'}`}>
                 <svg viewBox="0 0 10 10" className="w-full h-full"><path d="M0 0 L10 0 L10 10 Z" fill="currentColor"/></svg>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Refined Input Area with glow effect and focus states */}
      <div className={`glass rounded-[3rem] p-6 flex items-center justify-center gap-6 relative overflow-hidden transition-all duration-700 z-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border ${isActive ? 'border-primary/50 ring-4 ring-primary/20 shadow-[0_0_40px_rgba(99,102,241,0.3)] scale-[1.02]' : 'hover:border-white/20 border-white/5 hover:scale-[1.01]'}`}>
        {isActive && (
          <div className="absolute inset-x-0 bottom-0 h-16 flex items-end justify-center gap-1 opacity-30 pointer-events-none px-10">
            {Array.from(frequencyData).map((val, i) => (
              <div key={i} className="w-1 bg-primary rounded-t-full transition-all duration-75" style={{ height: `${((val as number) / 255) * 100}%` }}></div>
            ))}
          </div>
        )}
        <div className="relative shrink-0">
          {isActive && (
             <div className="absolute inset-[-12px] rounded-full border-2 border-primary/30 animate-ping opacity-60"></div>
          )}
          <button 
            onClick={isActive ? stopSession : startSession} 
            className={`w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center transition-all duration-700 active:scale-90 relative z-10 border border-white/20 shadow-2xl ${
              isActive ? 'bg-red-500 hover:bg-red-600 rotate-90 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 'gradient-bg hover:opacity-90 shadow-[0_0_20px_rgba(99,102,241,0.3)] animate-pulse'
            }`}
          >
            {isActive ? (
              <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            )}
          </button>
        </div>
        <div className="flex flex-col min-w-[120px]">
          <span className={`font-black text-xl lg:text-2xl tracking-tighter italic uppercase transition-all duration-700 ${isActive ? 'text-primary scale-110 translate-x-1' : 'text-white'}`}>
             {isActive ? 'RESONATING' : 'IDLE LINK'}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'text-primary' : 'text-muted/60'}`}>{isActive ? 'SYNC ACTIVE' : 'Tap to manifest'}</span>
            {isActive && (
              <div className="flex gap-0.5 items-center">
                <div className="w-0.5 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.1s]"></div>
                <div className="w-0.5 h-3 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-0.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.3s]"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCompanion;
