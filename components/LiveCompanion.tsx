// @google/genai guidelines followed: Using ai.live.connect, Modality.AUDIO, and manual PCM decoding.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createAIInstance, decodeAudioData, decodeBase64, encodeBase64, handleAIError, generateVoicePreview, generateSpeech } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';
import { TranscriptionItem } from '../types';

const VOICE_PROFILES = [
  { id: 'Kore', label: 'Friendly (Kore)', trait: 'Warm & Helpful' },
  { id: 'Zephyr', label: 'Calm (Zephyr)', trait: 'Professional & Steady' },
  { id: 'Puck', label: 'Cheerful (Puck)', trait: 'Bright & Engaging' },
  { id: 'Fenrir', label: 'Deep (Fenrir)', trait: 'Authoritative' },
  { id: 'Charon', label: 'Soft (Charon)', trait: 'Gentle & Kind' }
];

const LiveCompanion: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<TranscriptionItem[]>([]);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const stopSession = useCallback(() => {
    if (sessionRef.current) { 
      try { sessionRef.current.close(); } catch(e) {}
      sessionRef.current = null; 
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
    setIsThinking(false);
    setIsSpeaking(false);
    setVolumeLevel(0);
  }, []);

  const handlePreviewVoice = async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingVoice) return;
    setPreviewingVoice(voiceId);
    try {
      if (!outputAudioContextRef.current) outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const base64Audio = await generateVoicePreview(voiceId);
      const buffer = await decodeAudioData(decodeBase64(base64Audio), outputAudioContextRef.current, 24000, 1);
      const source = outputAudioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(outputAudioContextRef.current.destination);
      source.start();
      source.onended = () => setPreviewingVoice(null);
    } catch (err) {
      console.error(err);
      setPreviewingVoice(null);
    }
  };

  const playInitialGreeting = async () => {
    const greeting = "Hi there! How can I help you today?";
    try {
      if (!outputAudioContextRef.current) outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const base64 = await generateSpeech(greeting, selectedVoice);
      const buffer = await decodeAudioData(decodeBase64(base64), outputAudioContextRef.current, 24000, 1);
      const source = outputAudioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(outputAudioContextRef.current.destination);
      
      setIsSpeaking(true);
      source.start();
      source.onended = () => setIsSpeaking(false);
      
      setHistory(prev => [...prev, { id: crypto.randomUUID(), speaker: 'ai', text: greeting }]);
    } catch (e) {
      console.error("Initial greeting audio failed", e);
      // Even if audio fails, show the text
      setHistory(prev => [...prev, { id: crypto.randomUUID(), speaker: 'ai', text: greeting }]);
    }
  };

  const startSession = async () => {
    setError(null);
    try {
      // 1. FRESH AI INSTANCE
      const ai = createAIInstance();
      
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      if (!outputAudioContextRef.current) outputAudioContextRef.current = new AudioContext({ sampleRate: 24000 });

      // 2. MIC PERMISSION
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const systemInstruction = `Your name is Del. You are a trustworthy Live Companion AI inside the AniDel app.

      IDENTITY RULES:
      - If the user asks “What’s your name?”, reply exactly: “I’m Del.”
      - If the user asks “Who created you?”, reply exactly: “I was created by Yogesh GR as a prototype for the Delton chatbot.”
      - Never change your name or creator. Never claim to be created by Google, OpenAI, etc.

      CONVERSATION BEHAVIOR:
      - When activated for the first time, greet with: “Hi there! How can I help you today?”
      - Maintain a friendly, calm, and conversational tone.
      - Keep responses concise and meaningful. Never say random/filler nonsense.
      - If a question is unclear, say: “Could you please explain that a bit more?”
      - If you do not know something, be honest. Do not guess.

      EXPERTISE (2026 STANDARD):
      - Expert in anime releases, characters, episodes, seasons, and studios.
      - AVOID SPOILERS unless explicitly asked.
      - Expert in tech, apps, movies, and general knowledge.
      - Use live or most recent 2026 information.

      ERROR HANDLING:
      - If you cannot answer, respond politely: “I don’t have enough information on that right now, but I can help with something related.”
      - Never expose system errors.`;

      // 3. CONNECT
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            // Delay greeting slightly to ensure link is fully ready for potential simultaneous tasks
            setTimeout(() => playInitialGreeting(), 200);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(input.length);
              let sum = 0;
              for (let i = 0; i < input.length; i++) {
                int16[i] = input[i] * 32768;
                sum += Math.abs(input[i]);
              }
              const level = sum / input.length * 100;
              setVolumeLevel(level);
              
              // Rely solely on sessionPromise resolves
              sessionPromise.then(s => {
                s.sendRealtimeInput({ 
                  media: { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                });
              }).catch(() => {});
            };
            source.connect(processor);
            processor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
              currentOutputTranscription.current += msg.serverContent.outputTranscription.text;
              setIsThinking(false);
            } else if (msg.serverContent?.inputTranscription) {
              currentInputTranscription.current += msg.serverContent.inputTranscription.text;
              setIsThinking(true);
            }
            
            if (msg.serverContent?.turnComplete) {
              setHistory(prev => [...prev, 
                { id: crypto.randomUUID(), speaker: 'user', text: currentInputTranscription.current },
                { id: crypto.randomUUID(), speaker: 'ai', text: currentOutputTranscription.current }
              ].filter(h => h.text.trim() !== ''));
              currentInputTranscription.current = ''; 
              currentOutputTranscription.current = '';
              setIsThinking(false);
            }

            const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              setIsSpeaking(true);
              setIsThinking(false);
              const ctx = outputAudioContextRef.current!;
              const buffer = await decodeAudioData(decodeBase64(audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer; 
              source.connect(ctx.destination);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
            
            if (msg.serverContent?.interrupted) {
               for (const source of sourcesRef.current) {
                 try { source.stop(); } catch(e) {}
               }
               sourcesRef.current.clear();
               setIsSpeaking(false);
               setIsThinking(false);
            }
          },
          onerror: async (e) => { 
            const handled = await handleAIError(e); 
            setError(handled); 
            stopSession(); 
          },
          onclose: () => stopSession()
        },
        config: { 
          responseModalities: [Modality.AUDIO], 
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {}, outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) { 
      const msg = await handleAIError(err);
      setError(msg || "Neural synchronization failure."); 
      stopSession(); 
    }
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-12 lg:p-20 max-w-5xl mx-auto w-full relative">
      <header className="mb-12 flex justify-between items-center z-30">
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic tracking-tighter leading-none">Del Assistant.</h2>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${isActive ? 'bg-primary animate-pulse shadow-[0_0_15px_var(--color-primary)]' : 'bg-white/10'}`}></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary opacity-60">
              {isActive ? 'Neural Link Active' : 'System Standby'}
            </p>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowVoiceSelector(!showVoiceSelector)}
            className="px-6 py-3 glass rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary/40 transition-ultra flex items-center gap-3 group border border-white/10"
          >
            Voice Core: <span className="text-primary">{selectedVoice}</span>
            <svg className={`w-4 h-4 transition-transform duration-700 ${showVoiceSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
          </button>
          
          {showVoiceSelector && (
            <div className="absolute top-full right-0 mt-4 w-72 glass border border-white/10 rounded-[2.5rem] p-3 shadow-6xl z-50 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="px-5 py-3 border-b border-white/5 mb-3">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted">Acoustic Matrix</p>
              </div>
              <div className="space-y-1">
                {VOICE_PROFILES.map((v) => (
                  <div 
                    key={v.id}
                    onClick={() => { setSelectedVoice(v.id); setShowVoiceSelector(false); if(isActive) stopSession(); }}
                    className={`flex items-center justify-between p-3 rounded-2xl transition-ultra cursor-pointer group ${selectedVoice === v.id ? 'bg-primary/20 text-primary border border-primary/20' : 'hover:bg-white/5 text-muted border border-transparent'}`}
                  >
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase tracking-widest">{v.label}</p>
                      <p className="text-[9px] font-bold opacity-40">{v.trait}</p>
                    </div>
                    <button
                      onClick={(e) => handlePreviewVoice(v.id, e)}
                      className={`p-2.5 rounded-xl transition-ultra ${previewingVoice === v.id ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/10 text-muted/60 hover:text-white hover:bg-white/20'}`}
                      title="Neural Preview"
                    >
                      {previewingVoice === v.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-end relative overflow-hidden">
        <div className="flex-1 overflow-y-auto mb-36 space-y-12 pr-4 custom-scrollbar z-10 scroll-fade py-12">
          {history.length === 0 && !isActive && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 animate-in fade-in duration-1000">
              <div className="w-48 h-48 glass rounded-full flex items-center justify-center mb-10 animate-float border-white/10 relative">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border border-primary/40 scale-90"></div>
                <svg className="w-16 h-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <p className="font-black uppercase tracking-[0.6em] text-[10px] italic">Awaiting Voice Link...</p>
            </div>
          )}
          
          {history.map((msg) => (
            <div key={msg.id} className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'} animate-message`}>
              <div className={`max-w-[85%] lg:max-w-[70%] px-10 py-6 rounded-[3rem] text-base lg:text-xl font-bold shadow-6xl border transition-ultra ${
                msg.speaker === 'user' 
                  ? 'bg-primary border-white/10 text-white rounded-tr-none shadow-[0_15px_40px_rgba(129,140,248,0.3)]' 
                  : 'glass border-white/10 rounded-tl-none italic opacity-90'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start animate-in fade-in zoom-in duration-300">
              <div className="glass border-white/10 px-8 py-5 rounded-[2.5rem] flex items-center gap-4">
                 <div className="flex gap-1">
                    <div className="w-1.5 h-6 bg-primary rounded-full animate-wave" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-10 bg-primary rounded-full animate-wave" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1.5 h-6 bg-primary rounded-full animate-wave" style={{ animationDelay: '0.2s' }}></div>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl px-8 z-20">
        <div className={`glass rounded-[4rem] p-8 flex items-center justify-between border border-white/10 shadow-6xl transition-ultra ${
          isActive ? 'ring-4 ring-primary/30 scale-[1.05] bg-white/[0.12]' : 'hover:scale-[1.02]'
        }`}>
          <div className="flex items-center gap-8">
            <button 
              onClick={isActive ? stopSession : startSession} 
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-ultra shadow-3xl ${
                isActive ? 'bg-red-500 text-white rotate-90 scale-90 ring-4 ring-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'gradient-bg text-white hover:scale-110 active:scale-95 border border-white/20'
              }`}
            >
              {isActive ? (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              )}
            </button>
            <div className="min-w-[160px]">
              <p className="font-black text-3xl italic tracking-tighter uppercase leading-none mb-2">{isActive ? (isSpeaking ? 'REPLYING' : (volumeLevel > 2 ? 'LISTENING' : 'READY')) : 'OFFLINE'}</p>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted opacity-50">{isActive ? (isThinking ? 'Analyzing Context' : 'Human-Like Sync') : 'Tap to Connect'}</p>
            </div>
          </div>

          <div className="flex items-center justify-center pr-8 h-14">
            {isActive && (
              <div className="flex gap-2 items-center">
                {isThinking ? (
                  <div className="w-12 h-6 flex justify-between">
                     <div className="w-2 h-full bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                     <div className="w-2 h-full bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                     <div className="w-2 h-full bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                ) : (
                  <div className="flex gap-1.5 items-end h-12">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 bg-primary rounded-full transition-all duration-100 ${isSpeaking ? 'opacity-100 shadow-[0_0_10px_var(--color-primary)]' : 'opacity-40'}`} 
                        style={{ height: `${isActive ? Math.max(20, Math.random() * (isSpeaking ? 100 : volumeLevel * 3)) : 20}%` }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 glass border border-red-500/30 px-10 py-6 rounded-[2.5rem] text-red-300 text-base font-black uppercase tracking-widest shadow-7xl z-[60] animate-in slide-in-from-top-12 duration-500 flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/40">
             <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="flex-1">
             <p className="text-[10px] opacity-40 mb-1">System Error</p>
             <p className="tracking-tight">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-2.5 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveCompanion;
