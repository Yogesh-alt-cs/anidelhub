
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { imagineScene, createAIInstance, handleAIError } from '../services/geminiService';
import { GeneratedImage, AnimeStyle, AspectRatio, DetailLevel, NeuralFilters } from '../types';

const STYLES: AnimeStyle[] = [
  'Studio Ghibli', 'Makoto Shinkai', 'Mappa Style', 'Cyberpunk', 
  'Shonen', 'Shojo', 'Seinen', 'Dark Fantasy', 'Isekai fantasy',
  'Samurai / Edo-era anime', 'Mecha', 'Slice of Life', 'Gothic anime',
  'Neon sci-fi anime', 'Traditional hand-drawn anime'
];

const ASPECTS: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3'];
const DETAILS: DetailLevel[] = ['Standard', 'High', 'Ultra'];
const COLOR_GRADES = ['None', 'Warm', 'Cool', 'Pastel', 'Neon'];

const LOADING_MESSAGES = [
  "Synchronizing reality matrix...",
  "Rendering synaptic line art...",
  "Applying cel-shading protocols...",
  "Synthesizing chromatic layers...",
  "Finalizing neural manifestation...",
  "Manifesting artistic vision..."
];

const AnimeArtist: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [batchSize, setBatchSize] = useState<number>(1);
  const [aspect, setAspect] = useState<AspectRatio>('16:9');
  const [detail, setDetail] = useState<DetailLevel>('High');
  const [loading, setLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState(LOADING_MESSAGES[0]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  
  // Style Mixing State (Object of style names to percentage)
  const [styleMix, setStyleMix] = useState<Record<string, number>>({
    'Studio Ghibli': 100
  });

  // Neural Filters State
  const [filters, setFilters] = useState<NeuralFilters>({
    lineArt: 50,
    faceDetail: 50,
    eyeClarity: 50,
    lightingIntensity: 50,
    colorGrading: 'None',
    grain: false,
    shadowDepth: 50
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('anidel_image_history_v2');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('anidel_image_history_v2', JSON.stringify(history));
  }, [history]);

  // Real-time Recommendations Logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (prompt.trim().length > 3) {
        try {
          const ai = createAIInstance();
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `As an anime prompt assistant, suggest 4 short keywords (comma separated) to enhance this anime prompt for a search engine: "${prompt}". Focus on lighting, mood, camera angle. ONLY CSV.`
          });
          const text = response.text || "";
          setRecommendations(text.split(',').map(s => s.trim()).filter(Boolean));
        } catch (e) {
          console.warn("Recommendations failed", e);
        }
      } else {
        setRecommendations([]);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [prompt]);

  // Loading Message Cycle
  useEffect(() => {
    let interval: any;
    if (loading) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setProgressMessage(LOADING_MESSAGES[idx]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async (regenPrompt?: string) => {
    const targetPrompt = regenPrompt || prompt;
    if (!targetPrompt.trim()) return;
    
    setLoading(true);
    setApiError(null);
    
    try {
      // Calculate mixed style prompt
      // Fix: Cast 'v' to number to avoid 'unknown' comparison error when filtering styleMix entries
      const activeStyles = Object.entries(styleMix).filter(([_, v]) => (v as number) > 0);
      const stylePrompt = activeStyles.map(([name, val]) => `${val}% influence of ${name} style`).join(', ');

      // Bake filters into the prompt using Number() conversion to avoid 'unknown' comparison issues in TypeScript
      // Fixed: Simplified filter comparison to Number(value) > 50 to ensure type safety even with optional properties.
      const filterString = [
        (Number(filters.lineArt) > 50) ? 'sharp defined line art' : '',
        (Number(filters.faceDetail) > 50) ? 'highly detailed facial features' : '',
        (Number(filters.eyeClarity) > 50) ? 'shimmering expressive detailed eyes' : '',
        (Number(filters.lightingIntensity) > 50) ? 'dramatic cinematic lighting' : 'soft natural lighting',
        filters.colorGrading !== 'None' ? `${filters.colorGrading?.toLowerCase()} color palette` : '',
        filters.grain ? 'vintage film grain texture' : '',
        (Number(filters.shadowDepth) > 50) ? 'deep volumetric shadows' : ''
      ].filter(Boolean).join(', ');

      const finalPrompt = `Masterpiece anime art, ${targetPrompt}. Mix of styles: ${stylePrompt}. Attributes: ${filterString}. Perfect anatomy, professional digital art.`;
      
      const generationTasks = Array.from({ length: batchSize }).map(async (_, idx) => {
        // We add a tiny seed or variation string to ensure batch uniqueness if calling same model multiple times
        const variedPrompt = batchSize > 1 ? `${finalPrompt} (variant ${idx + 1})` : finalPrompt;
        const imageUrl = await imagineScene(variedPrompt, activeStyles[0]?.[0] || 'Shonen', aspect, detail);
        return {
          id: crypto.randomUUID(),
          url: imageUrl,
          prompt: targetPrompt,
          timestamp: Date.now() + idx,
          style: stylePrompt,
          aspect,
          detail,
          filters: { ...filters },
          isPinned: false,
          isFavorite: false
        };
      });

      const newImages = await Promise.all(generationTasks);
      setHistory(prev => [...newImages, ...prev].slice(0, 100));
      
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      
    } catch (err: any) {
      const msg = await handleAIError(err);
      setApiError(msg || "Visual manifestation failed.");
    } finally {
      setLoading(false);
    }
  };

  const clearRecent = () => {
    setHistory(prev => prev.filter(img => img.isPinned || img.isFavorite));
  };

  const togglePin = (id: string) => {
    setHistory(prev => prev.map(img => img.id === id ? { ...img, isPinned: !img.isPinned } : img));
  };

  const toggleFavorite = (id: string) => {
    setHistory(prev => prev.map(img => img.id === id ? { ...img, isFavorite: !img.isFavorite } : img));
  };

  const downloadImage = (url: string, p: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `anidel_${p.slice(0, 15).replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.click();
  };

  const updateStyleMix = (s: string, val: number) => {
    setStyleMix(prev => ({ ...prev, [s]: val }));
  };

  const sortedGallery = useMemo(() => {
    return [...history].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp - a.timestamp;
    });
  }, [history]);

  return (
    <div className="min-h-full flex flex-col p-6 md:p-12 lg:p-20 max-w-7xl mx-auto w-full pb-48">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-1.5 h-6 bg-accent rounded-full shadow-[0_0_15px_var(--color-accent)]"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-accent">Neural Artist Interface v4.0</p>
        </div>
        <div className="flex justify-between items-end">
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter italic leading-none">Anime Artist.</h2>
          <button 
            onClick={clearRecent}
            className="px-6 py-3 glass rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-red-400 border border-white/10 transition-ultra"
          >
            Clear Recent History
          </button>
        </div>
      </header>

      {/* Control Center */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start mb-24">
        
        {/* Input & Prompting */}
        <div className="xl:col-span-7 space-y-10">
          <div className="glass rounded-[3rem] p-8 lg:p-12 border border-white/10 shadow-5xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-accent opacity-20 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <label className="text-[11px] font-black text-muted uppercase tracking-[0.4em]">Master Prompt</label>
                <div className="flex gap-2">
                  {recommendations.map((rec, i) => (
                    <button 
                      key={i}
                      onClick={() => setPrompt(prev => prev + (prev.length ? ', ' : '') + rec)}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[9px] font-bold text-primary transition-all animate-in fade-in slide-in-from-right-4"
                    >
                      + {rec}
                    </button>
                  ))}
                </div>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A magical girl standing on a skyscraper overlooking Neo-Tokyo..."
                className="w-full bg-white/[0.04] border border-white/10 rounded-[2rem] px-8 py-8 focus:outline-none transition-ultra text-2xl lg:text-3xl font-black min-h-[160px] resize-none placeholder:opacity-20 italic leading-tight"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-12">
               <div className="space-y-6">
                 <label className="text-[11px] font-black text-muted uppercase tracking-[0.4em]">Batch manifest</label>
                 <div className="flex gap-2">
                    {[1, 2, 4, 6].map(n => (
                      <button key={n} onClick={() => setBatchSize(n)} className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-ultra ${batchSize === n ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-muted hover:text-white'}`}>{n}x</button>
                    ))}
                 </div>
               </div>
               <div className="space-y-6">
                 <label className="text-[11px] font-black text-muted uppercase tracking-[0.4em]">Dimensions</label>
                 <div className="flex gap-2">
                    {ASPECTS.map(a => (
                      <button key={a} onClick={() => setAspect(a)} className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-ultra ${aspect === a ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-muted hover:text-white'}`}>{a}</button>
                    ))}
                 </div>
               </div>
            </div>

            <button 
              onClick={() => handleGenerate()}
              disabled={loading}
              className="w-full mt-12 gradient-bg hover:opacity-95 active:scale-[0.99] disabled:opacity-50 text-white font-black py-7 rounded-[2.5rem] shadow-6xl transition-ultra flex items-center justify-center gap-6 text-2xl tracking-[0.2em] uppercase italic border border-white/20"
            >
              {loading ? (
                <div className="flex items-center gap-6">
                  <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="animate-pulse">{progressMessage.toUpperCase()}</span>
                </div>
              ) : `MANIFEST ${batchSize > 1 ? batchSize + 'x ' : ''}VISION`}
            </button>
          </div>
        </div>

        {/* Style Mixing & Filters */}
        <div className="xl:col-span-5 space-y-10">
          <div className="glass rounded-[3rem] p-10 border border-white/10 shadow-5xl">
            <h3 className="text-xl font-black mb-10 uppercase tracking-[0.2em] text-accent flex items-center gap-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Neural Tuning
            </h3>
            
            <div className="space-y-12">
               {/* Style Mixing Sliders */}
               <div className="space-y-6">
                 <label className="text-[11px] font-black text-muted uppercase tracking-[0.4em]">Style Synthesis (Top 5)</label>
                 <div className="space-y-4">
                   {STYLES.slice(0, 5).map(s => (
                     <div key={s} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black">
                         <span className={styleMix[s] > 0 ? 'text-primary' : 'text-muted'}>{s.toUpperCase()}</span>
                         <span>{styleMix[s] || 0}%</span>
                       </div>
                       <input 
                         type="range" min="0" max="100" value={styleMix[s] || 0}
                         onChange={(e) => updateStyleMix(s, parseInt(e.target.value))}
                         className="w-full accent-primary h-1.5 bg-white/5 rounded-full"
                       />
                     </div>
                   ))}
                 </div>
               </div>

               {/* Neural Filters */}
               <div className="grid grid-cols-1 gap-6 pt-10 border-t border-white/5">
                 <FilterSlider label="Eye Clarity" value={filters.eyeClarity!} onChange={(v) => setFilters(f => ({...f, eyeClarity: v}))} />
                 <FilterSlider label="Face Detail" value={filters.faceDetail!} onChange={(v) => setFilters(f => ({...f, faceDetail: v}))} />
                 
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Color Grade</span>
                    <select 
                      value={filters.colorGrading} 
                      onChange={(e) => setFilters(f => ({...f, colorGrading: e.target.value as any}))}
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-primary uppercase focus:outline-none"
                    >
                      {COLOR_GRADES.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                    </select>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="mb-20 glass border-red-500/30 bg-red-500/5 p-8 rounded-4xl flex items-center gap-8 animate-in slide-in-from-top-4">
          <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0 border border-red-500/20"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
          <div className="flex-1 text-red-300 font-bold">{apiError}</div>
        </div>
      )}

      {/* Gallery Section */}
      <div ref={scrollRef} className="pt-12">
        <div className="flex items-center gap-10 mb-16">
          <h3 className="text-3xl font-black italic tracking-tighter shrink-0">Neural Gallery</h3>
          <div className="flex-1 h-px bg-white/10"></div>
          <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em] opacity-40">{history.length} Masterpieces</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedGallery.map((item) => (
            <div 
              key={item.id} 
              className={`glass rounded-[3rem] p-3 border transition-ultra group relative overflow-hidden flex flex-col animate-message ${
                item.isPinned ? 'border-primary/40 shadow-2xl ring-2 ring-primary/20' : 'border-white/5 hover:border-accent/40'
              }`}
            >
              <div className="aspect-square relative rounded-[2.5rem] overflow-hidden bg-black/20 shadow-2xl mb-6">
                <img src={item.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-ultra flex flex-col items-center justify-center p-8 text-center gap-4">
                  <div className="flex gap-4">
                    <button onClick={() => togglePin(item.id)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-ultra ${item.isPinned ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-primary'}`}>
                      <svg className="w-6 h-6" fill={item.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </button>
                    <button onClick={() => toggleFavorite(item.id)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-ultra ${item.isFavorite ? 'bg-accent text-white' : 'bg-white/10 text-white hover:bg-accent'}`}>
                      <svg className="w-6 h-6" fill={item.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                  </div>
                  <button 
                    onClick={() => downloadImage(item.url, item.prompt)}
                    className="px-6 py-3 bg-white rounded-full text-black font-black text-[10px] uppercase tracking-widest shadow-3xl"
                  >
                    Download HQ
                  </button>
                  <button 
                    onClick={() => handleGenerate(item.prompt)}
                    className="text-[9px] font-black text-white hover:text-primary uppercase tracking-widest mt-2"
                  >
                    Regenerate
                  </button>
                </div>
                
                {/* Top Corner Badge for Pinned */}
                {item.isPinned && (
                  <div className="absolute top-6 left-6 px-3 py-1 bg-primary rounded-full text-[8px] font-black text-white uppercase tracking-widest shadow-xl">
                    Pinned
                  </div>
                )}
              </div>
              
              <div className="px-5 pb-5 space-y-4 flex-1 flex flex-col">
                <p className="text-sm font-bold line-clamp-2 italic opacity-80 flex-1 leading-relaxed">"{item.prompt}"</p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                    {item.style.length > 20 ? 'Mixed Aesthetic' : item.style}
                  </span>
                  <span className="text-[9px] font-black text-muted/40 uppercase tracking-widest">
                    {item.aspect} • {item.detail[0]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FilterSlider = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end">
      <span className="text-[10px] font-black text-muted uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-black text-primary">{value}%</span>
    </div>
    <input 
      type="range" min="0" max="100" value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full accent-accent h-1.5 bg-white/5 rounded-full"
    />
  </div>
);

export default AnimeArtist;
