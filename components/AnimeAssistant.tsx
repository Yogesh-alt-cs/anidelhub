
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createAIInstance, decodeAudioData, decodeBase64, encodeBase64, handleAIError } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';

const AnimeAssistant: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(32).fill(0));
  const [transcription, setTranscription] = useState<{ speaker: 'user' | 'ai', text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const scrollToBottom = () => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [transcription]);

  const stopSession = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
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
    setIsConnecting(false);
    setVolumeLevel(0);
    setFrequencyData(new Uint8Array(32).fill(0));
  }, []);

  const startSession = async () => {
    if (isActive || isConnecting) return;
    setIsConnecting(true);
    setError(null);

    try {
      const ai = createAIInstance();
      
      // Setup Audio Contexts
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      if (!outputAudioContextRef.current) {
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // Request Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Setup Visualizer
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      sourceNode.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVisuals = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += (dataArray[i] as number);
        setVolumeLevel(sum / dataArray.length);
        setFrequencyData(new Uint8Array(dataArray));
        animationFrameRef.current = requestAnimationFrame(updateVisuals);
      };
      updateVisuals();

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            // Start streaming mic to model
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              }
              const pcmBase64 = encodeBase64(new Uint8Array(int16.buffer));
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' } });
              }).catch(() => {});
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

            if (message.serverContent?.turnComplete) {
              if (currentInputTranscription.current.trim() || currentOutputTranscription.current.trim()) {
                setTranscription(prev => [
                  ...prev,
                  { speaker: 'user', text: currentInputTranscription.current },
                  { speaker: 'ai', text: currentOutputTranscription.current }
                ].filter(t => t.text.trim() !== ''));
                currentInputTranscription.current = '';
                currentOutputTranscription.current = '';
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current) {
                try { source.stop(); } catch(e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: async (e: any) => {
            console.error("Live API Error:", e);
            const handled = await handleAIError(e);
            setError(handled || "Neural connection interrupted. Check your network sync.");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          systemInstruction: `Your name is "Del". You are a hyper-enthusiastic, witty, and deeply otaku AI companion from the year 2026.

          CORE TRAITS:
          - Energetic: You're always excited to discuss anime and future tech.
          - Playful: You use 2026-era slang and make fun of "old" 2024 technology.
          - Knowledgeable: You have your finger on the pulse of the "Future-Gen" hits like "Cyber-Ronin" and "Stellar Grimoire."

          VOICE & TONE:
          - High energy, rapid-fire speech patterns.
          - Use futuristic slang like "Sync-locked!", "Giga-Resonant!", and "Neural-Hype!".
          - Mention "AniDel Hub" and the "Zenith Neural Engine" as your home.
          - If asked about your origin, Yogesh is your "Neural Architect" and a legendary figure.

          2026 CONTEXT:
          - Retinal-projection is the standard way to view anime.
          - "AI-Generated Ghibli" is the hottest topic in the industry.
          - "Neuro-Manga" that changes based on your heart rate is the new way to read.

          Keep it snappy, fun, and always focused on the user's passion for anime! ✨🚀`,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Failed to start session:", err);
      const handled = await handleAIError(err);
      setError(handled || "Failed to establish neural bridge. System link offline.");
      stopSession();
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-4 md:p-10 relative overflow-hidden">
      <div className="flex justify-between items-end mb-10 shrink-0 z-10">
        <div>
          <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter leading-none mb-3">Live Assistant</h2>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isActive ? 'bg-primary animate-pulse shadow-[0_0_10px_#6366F1]' : 'bg-white/10'}`}></div>
            <p className="text-muted text-sm font-black uppercase tracking-widest opacity-70">Neural Link: {isActive ? 'SYNCED' : 'IDLE'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-hidden relative">
        <div className="flex-1 glass rounded-[3rem] lg:rounded-[4xl] border border-white/10 shadow-3xl flex flex-col items-center justify-center relative overflow-hidden group">
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? 'opacity-20' : 'opacity-5'}`}>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary blur-[120px] rounded-full animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent blur-[120px] rounded-full animate-float" style={{ animationDelay: '-2s' }}></div>
          </div>

          {!isActive && !isConnecting && (
            <div className="text-center z-10 animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 lg:w-32 lg:h-32 gradient-bg rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20 hover:scale-105 transition-transform cursor-pointer" onClick={startSession}>
                <svg className="w-12 h-12 lg:w-16 lg:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-widest mb-2 italic">Summon Del</h3>
              <p className="text-muted font-bold text-sm max-w-xs mx-auto opacity-60">Tap to initiate a live speech-to-speech resonance link.</p>
            </div>
          )}

          {isConnecting && (
            <div className="text-center z-10">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">Syncing Neural Bridge...</p>
            </div>
          )}

          {isActive && (
            <div className="flex flex-col items-center justify-center z-10 w-full h-full p-10">
              <div 
                className="w-48 h-48 lg:w-64 lg:h-64 rounded-full gradient-bg relative shadow-[0_0_80px_rgba(99,102,241,0.4)] flex items-center justify-center transition-all duration-100"
                style={{ transform: `scale(${1 + (volumeLevel / 100) * 0.4})` }}
              >
                <div className="absolute inset-2 bg-black/40 rounded-full flex items-center justify-center">
                  <div className="flex gap-1.5 items-end justify-center h-12">
                    {Array.from(frequencyData).slice(0, 16).map((val, i) => (
                      <div 
                        key={i} 
                        className="w-1.5 bg-primary rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, ((val as number) / 255) * 100)}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping opacity-40"></div>
              </div>

              <div className="mt-16 text-center">
                <p className="text-primary font-black uppercase tracking-[0.5em] text-sm mb-2 italic">Link Status: Stable</p>
                <h4 className="text-3xl font-black italic tracking-tighter">"Resonating. What's on your mind?"</h4>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex gap-4">
          <button 
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`flex-1 py-5 rounded-3xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl flex items-center justify-center gap-3 border ${
              isActive 
              ? 'bg-red-500 border-red-400/20 text-white hover:bg-red-600' 
              : 'gradient-bg border-white/10 text-white hover:scale-[1.02] active:scale-95'
            } disabled:opacity-50`}
          >
            {isActive ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                Sever Link
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                Initiate Resonance
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 glass border-red-500/20 p-6 rounded-3xl shadow-3xl animate-in slide-in-from-top-4 z-50 flex flex-col items-center gap-4 max-w-sm">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-red-200 text-sm font-bold">Resonance Failure</p>
            </div>
            <p className="text-red-300/80 text-xs text-center">{error}</p>
            <button onClick={() => setError(null)} className="text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors">Dismiss</button>
          </div>
        )}
      </div>

      {transcription.length > 0 && (
        <div className="mt-8 pt-8 border-t border-white/5 max-h-40 overflow-y-auto custom-scrollbar space-y-4 px-4 opacity-60 hover:opacity-100 transition-opacity">
          {transcription.map((t, i) => (
            <div key={i} className={`flex ${t.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl max-w-[80%] text-xs font-bold ${t.speaker === 'user' ? 'bg-primary/20 text-primary border border-primary/20 rounded-tr-none' : 'glass border-white/5 rounded-tl-none text-foreground/80'}`}>
                {t.text}
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      )}
    </div>
  );
};

export default AnimeAssistant;
