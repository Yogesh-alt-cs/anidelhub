
import React, { useState, useRef, useEffect } from 'react';
import { generateVoicePreview, decodeAudioData, decodeBase64 } from '../services/geminiService';

const THEMES = [
  { id: 'deep-night', name: 'Deep Night', colors: 'from-slate-950 to-slate-900', accent: 'bg-[#6366F1]' },
  { id: 'cyber-pink', name: 'Cyber Pink', colors: 'from-pink-950 to-slate-950', accent: 'bg-[#EC4899]' },
  { id: 'neon-green', name: 'Neon Green', colors: 'from-emerald-950 to-slate-950', accent: 'bg-[#10B981]' }
];

const VOICES = [
  { name: 'Kore', trait: 'Energetic' },
  { name: 'Zephyr', trait: 'Calm' },
  { name: 'Puck', trait: 'Playful' },
  { name: 'Fenrir', trait: 'Stoic' }
];

const Settings: React.FC = () => {
  const [quality, setQuality] = useState('High');
  const [theme, setTheme] = useState(() => localStorage.getItem('anidel_theme') || 'deep-night');
  const [voice, setVoice] = useState('Kore');
  const [previewing, setPreviewing] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Apply theme to body
    document.body.classList.remove('theme-deep-night', 'theme-cyber-pink', 'theme-neon-green');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('anidel_theme', theme);
  }, [theme]);

  const handlePreviewVoice = async (vName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewing) return;
    
    setPreviewing(vName);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const base64Audio = await generateVoicePreview(vName);
      const buffer = await decodeAudioData(decodeBase64(base64Audio), audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      source.onended = () => setPreviewing(null);
    } catch (err) {
      console.error(err);
      setPreviewing(null);
    }
  };

  const handleAuthFix = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full pb-32">
      <div className="mb-12 animate-in slide-in-from-top-4 duration-500">
        <h2 className="text-4xl font-display font-black mb-2 italic tracking-tight">System Configuration</h2>
        <p className="text-muted font-bold text-lg">Calibrate your neural experience and interface parameters.</p>
      </div>

      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="glass rounded-[2.5rem] p-10 border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <h3 className="text-xl font-black mb-10 uppercase tracking-[0.2em] text-primary flex items-center gap-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Neural Defaults
          </h3>
          <div className="grid gap-10">
            <SettingItem 
              label="Precision Level" 
              desc="Higher precision requires more neural processing and a Gemini 3 Pro link."
              options={['Standard', 'High', 'Ultra']}
              value={quality}
              onChange={setQuality}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4 border-t border-white/5">
              <div className="max-w-md">
                <h4 className="font-black text-sm uppercase tracking-widest text-white mb-1">Authorization Bridge</h4>
                <p className="text-xs text-muted leading-relaxed font-medium">Reset your neural link if you experience permission errors or model restrictions.</p>
              </div>
              <button 
                onClick={handleAuthFix}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] text-primary hover:bg-primary/10 transition-all uppercase tracking-[0.2em] shrink-0"
              >
                Re-Authorize Link
              </button>
            </div>
            
            <div className="space-y-6">
               <div className="flex flex-col">
                  <h4 className="font-black text-sm uppercase tracking-widest text-white mb-1">Companion Voice Core</h4>
                  <p className="text-xs text-muted mb-6">Choose the personality matrix for your Del synchronization.</p>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {VOICES.map(v => (
                    <button
                      key={v.name}
                      onClick={() => setVoice(v.name)}
                      className={`group relative p-6 rounded-[2rem] border transition-all text-left flex items-center gap-5 ${voice === v.name ? 'bg-primary border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-white/5 border-white/5 text-muted hover:bg-white/10 hover:text-white'}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:rotate-12 ${voice === v.name ? 'bg-white text-primary' : 'bg-white/10'}`}>
                         {v.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-black uppercase tracking-[0.2em] ${voice === v.name ? 'text-white' : 'text-white/70'}`}>{v.name}</p>
                        <p className={`text-lg font-black italic tracking-tight ${voice === v.name ? 'text-white' : 'text-primary'}`}>{v.trait}</p>
                      </div>
                      <button 
                        onClick={(e) => handlePreviewVoice(v.name, e)}
                        className={`p-3 rounded-xl transition-all ${voice === v.name ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/5 text-muted hover:text-white hover:bg-white/10'}`}
                      >
                        {previewing === v.name ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                    </button>
                  ))}
               </div>
            </div>
          </div>
        </section>

        <section className="glass rounded-[2.5rem] p-10 border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <h3 className="text-xl font-black mb-10 uppercase tracking-[0.2em] text-accent flex items-center gap-4">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.172-1.172a4 4 0 115.656 5.656L11 17.657l-1.172-1.172" /></svg>
            Visual Interface
          </h3>
          <div className="space-y-8">
            <div className="flex flex-col">
              <h4 className="font-black text-sm uppercase tracking-widest text-white mb-1">Skin Synthesis</h4>
              <p className="text-xs text-muted mb-8">Redefine the aesthetic resonance of your hub.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`relative h-40 rounded-[2rem] border-4 overflow-hidden transition-all group ${theme === t.id ? 'border-primary shadow-2xl scale-[1.02]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-[1.01]'}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${t.colors}`}></div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 bg-black/60 backdrop-blur-md flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white">{t.name}</span>
                       <div className={`w-3 h-3 rounded-full ${t.accent} shadow-lg`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col md:flex-row justify-end gap-4 mt-12">
            <button className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs text-muted hover:text-white hover:bg-white/10 transition-all uppercase tracking-[0.2em]">Restore Defaults</button>
            <button className="px-10 py-4 gradient-bg text-white rounded-2xl font-black shadow-2xl hover:opacity-90 active:scale-95 transition-all text-sm uppercase tracking-[0.2em]">Sync All Config</button>
        </div>
      </div>
    </div>
  );
};

const SettingItem = ({ 
  label, 
  desc, 
  options, 
  value, 
  onChange
}: { 
  label: string, 
  desc: string, 
  options: string[], 
  value: string, 
  onChange: (v: string) => void
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div className="max-w-md">
      <h4 className="font-black text-sm uppercase tracking-widest text-white mb-1">{label}</h4>
      <p className="text-xs text-muted leading-relaxed font-medium">{desc}</p>
    </div>
    <div className="flex gap-1.5 bg-background/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md shrink-0">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${value === opt ? 'bg-white text-black shadow-xl scale-[1.05]' : 'text-muted hover:text-white hover:bg-white/5'}`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export default Settings;
