
import React, { useState, useEffect, useRef } from 'react';
import { imagineScene, getSceneSuggestions } from '../services/geminiService';
import { GeneratedImage, AnimeStyle, AspectRatio, DetailLevel } from '../types';

const STYLES: AnimeStyle[] = [
  'Studio Ghibli', 
  'Makoto Shinkai', 
  'Mappa Style', 
  'Ufotable Style', 
  'Cyberpunk', 
  'Shonen', 
  'Shojo', 
  'Dark Fantasy', 
  'Retro 90s', 
  'Ukiyo-e', 
  'Watercolor'
];

const ASPECTS: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const DETAILS: DetailLevel[] = ['Standard', 'High', 'Ultra'];

const EFFECTS = [
  { id: 'ray-tracing', label: 'Ray Tracing', tag: 'unreal engine 5, ray traced reflections, cinematic lighting' },
  { id: 'vhs', label: 'VHS Retro', tag: 'vhs glitch, 90s grainy aesthetic, tracking lines' },
  { id: 'chromatic', label: 'Chromatic', tag: 'chromatic aberration, lens distortion, anamorphic' },
  { id: 'neon', label: 'Neon Pulse', tag: 'bioluminescent, vibrant neon, high contrast synthwave' },
  { id: 'ethereal', label: 'Ethereal', tag: 'volumetric fog, god rays, bloom effect, angelic glow' },
  { id: 'ink', label: 'Ink wash', tag: 'sumi-e style, rough ink strokes, paper texture' }
];

const RECIPES = [
  { category: 'Cinematic', prompts: ['A panoramic view of Neo-Tokyo 2026 under a meteor shower', 'Two characters standing on a salt flat with reflecting sky'] },
  { category: 'Environments', prompts: ['Lush Studio Ghibli forest with hidden spirit shrines', 'Cyberpunk rainy alleyway with neon signs and steam'] },
  { category: 'Portraits', prompts: ['Close up of a mecha pilot with reflecting HUD in eyes', 'A magical girl transforming in a swirl of starlight'] }
];

const AnimeArtist: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<AnimeStyle>('Studio Ghibli');
  const [aspect, setAspect] = useState<AspectRatio>('16:9');
  const [detail, setDetail] = useState<DetailLevel>('High');
  const [activeEffects, setActiveEffects] = useState<string[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('anidel_image_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load image history", e);
      }
    }
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const fetched = await getSceneSuggestions();
      setSuggestions(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleEffect = (id: string) => {
    setActiveEffects(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const saveToHistory = (img: GeneratedImage) => {
    let updated = [img, ...history];
    if (updated.length > 20) updated = updated.slice(0, 20);
    
    try {
      localStorage.setItem('anidel_image_history', JSON.stringify(updated));
      setHistory(updated);
    } catch (e) {
      updated = updated.slice(0, 5);
      localStorage.setItem('anidel_image_history', JSON.stringify(updated));
      setHistory(updated);
    }
  };

  const deleteFromHistory = (timestamp: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.timestamp !== timestamp);
    setHistory(updated);
    localStorage.setItem('anidel_image_history', JSON.stringify(updated));
    if (currentImage && history.find(h => h.timestamp === timestamp)?.url === currentImage) {
      setCurrentImage(null);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all manifested visions from the archive?")) {
      setHistory([]);
      localStorage.removeItem('anidel_image_history');
      setCurrentImage(null);
    }
  };

  const handleGenerate = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim() && !referenceImage) return;
    
    const effectTags = activeEffects.map(id => EFFECTS.find(e => e.id === id)?.tag).filter(Boolean).join(', ');
    const styleTag = `Hand-drawn anime style inspired by ${style}.`;
    const fullPrompt = `${styleTag} ${targetPrompt}${effectTags ? ', ' + effectTags : ''}`;
    
    setLoading(true);
    setApiError(null);
    try {
      const imageUrl = await imagineScene(
        fullPrompt, 
        style, 
        aspect, 
        detail,
        referenceImage || undefined
      );
      setCurrentImage(imageUrl);
      saveToHistory({ 
        url: imageUrl, 
        prompt: targetPrompt || "Manifested Vision", 
        timestamp: Date.now(),
        style,
        aspect,
        detail,
        isReference: !!referenceImage
      });
      
      // Refresh suggestions after a recommendation is "used" (successfully generated)
      fetchSuggestions();
      
    } catch (error: any) {
      setApiError(error.message || "Neural manifestation aborted.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `AD_${fileName.trim().replace(/\s+/g, '_').slice(0, 20)}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-[1400px] mx-auto w-full pb-32">
      {/* Header Section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter leading-none mb-4">Anime Artist</h2>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <p className="text-muted text-sm font-bold uppercase tracking-widest opacity-60">Neural Matrix Active</p>
          </div>
        </div>
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
          {ASPECTS.map(a => (
            <button 
              key={a} 
              onClick={() => setAspect(a)} 
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${aspect === a ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
          <div className="glass rounded-3xl p-6 border border-white/10 shadow-xl space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block">Studio DNA</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={`text-left px-4 py-3 rounded-xl text-[11px] font-bold transition-all border ${style === s ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/5 text-muted hover:text-white hover:bg-white/10'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-accent uppercase tracking-[0.3em] block">Effect Matrix</label>
              <div className="flex flex-wrap gap-2">
                {EFFECTS.map(eff => (
                  <button
                    key={eff.id}
                    onClick={() => toggleEffect(eff.id)}
                    className={`px-4 py-2 rounded-full text-[10px] font-black transition-all border ${activeEffects.includes(eff.id) ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/5 text-muted hover:text-white'}`}
                  >
                    {eff.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] block">Neural Fidelity</label>
              <div className="grid grid-cols-3 gap-2">
                {DETAILS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDetail(d)}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border ${detail === d ? 'bg-white border-white text-black' : 'bg-white/5 border-white/5 text-muted hover:text-white'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 border border-white/10 shadow-xl">
             <label className="text-[10px] font-black text-muted uppercase tracking-[0.3em] block mb-4">Input Resonance (Optional)</label>
             <div 
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-video rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${referenceImage ? 'border-primary/40 bg-primary/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
            >
              {referenceImage ? (
                <img src={referenceImage} className="w-full h-full object-cover" alt="Reference" />
              ) : (
                <div className="text-center p-4">
                  <svg className="w-8 h-8 text-muted/30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <p className="text-[9px] font-black text-muted/50 uppercase tracking-widest">Structural Template</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          </div>
        </div>

        {/* Manifest Area */}
        <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
          <div className="glass rounded-[2.5rem] p-8 lg:p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full gradient-bg opacity-40 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">Manifesto Query</label>
                <button 
                  onClick={fetchSuggestions}
                  disabled={loadingSuggestions}
                  className="text-[10px] font-black text-muted/60 hover:text-primary uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                  {loadingSuggestions ? 'Scanning...' : 'Roll Inspiration'}
                </button>
              </div>

              <textarea 
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A samurai sitting in a lofi cafe overlooking Neo-Osaka..."
                className="w-full bg-black/40 border border-white/10 rounded-3xl px-8 py-6 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none font-bold text-xl lg:text-3xl placeholder:text-muted/10 custom-scrollbar"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {RECIPES.map(recipe => (
                  <div key={recipe.category} className="space-y-3">
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest px-2">{recipe.category}</p>
                    {recipe.prompts.map(p => (
                      <button
                        key={p}
                        onClick={() => { setPrompt(p); handleGenerate(p); }}
                        className="w-full text-left p-3 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl text-[10px] font-bold text-muted/80 hover:text-white transition-all line-clamp-1 border border-white/5"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => handleGenerate()}
              disabled={loading}
              className="w-full mt-10 gradient-bg hover:opacity-90 active:scale-[0.99] disabled:opacity-50 text-white font-black py-6 rounded-3xl shadow-3xl transition-all flex items-center justify-center gap-4 text-2xl tracking-[0.1em] italic uppercase"
            >
              {loading ? (
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="animate-pulse">Synthesizing Vision...</span>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Manifest Vision
                </>
              )}
            </button>
          </div>

          {/* Current Manifestation Container */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 z-10 glass rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_linear_infinite] shadow-[0_0_15px_#6366F1]"></div>
                <div className="text-center">
                  <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
                  <p className="text-primary font-black uppercase tracking-[0.4em] text-sm italic">Resolving Timelines</p>
                </div>
              </div>
            )}

            {currentImage ? (
              <div className="glass p-4 rounded-[3rem] border border-white/10 shadow-4xl animate-in zoom-in slide-in-from-bottom-8 duration-700">
                <div className="relative rounded-[2rem] overflow-hidden bg-black/40 group/img">
                  <img src={currentImage} className="w-full h-auto max-h-[75vh] object-contain mx-auto" alt="Current Manifestation" />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all bg-black/20 backdrop-blur-sm">
                    <button 
                      onClick={() => downloadImage(currentImage, prompt)}
                      className="px-10 py-5 bg-white text-black font-black rounded-2xl shadow-2xl hover:bg-primary hover:text-white transition-all flex items-center gap-4 text-sm tracking-widest uppercase active:scale-95"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Secure Download
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 px-4 pb-2">
                   <div className="flex-1">
                      <p className="text-muted font-black text-[10px] uppercase tracking-widest opacity-60 mb-1">Manifesto Ref</p>
                      <p className="text-xl font-bold italic truncate opacity-90">"{prompt}"</p>
                   </div>
                   <div className="flex gap-4">
                      <MetaStat label="STYLE" value={style} />
                      <MetaStat label="RES" value={detail === 'Ultra' ? '2K' : '1K'} />
                   </div>
                </div>
              </div>
            ) : !loading && (
              <div className="h-96 glass rounded-[3rem] border border-white/5 flex flex-col items-center justify-center opacity-40">
                <svg className="w-16 h-16 text-muted/20 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-muted font-black uppercase tracking-[0.5em] text-[10px]">Neural Void: Send a Request</p>
              </div>
            )}
          </div>

          {apiError && (
            <div className="glass border-red-500/20 p-6 rounded-3xl flex items-center gap-6 animate-in slide-in-from-top-4 shadow-2xl">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-red-300 font-bold text-sm">{apiError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Archive Grid */}
      {history.length > 0 && (
        <div className="mt-24">
          <div className="flex items-center gap-8 mb-12">
            <h3 className="text-3xl font-black italic tracking-tighter shrink-0">Neural Archive</h3>
            <button 
              onClick={clearHistory}
              className="text-[10px] font-black text-muted/40 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              Clear Archives
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <div className="flex-1 h-px bg-white/5"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {history.map((item) => (
              <div 
                key={item.timestamp} 
                className="glass p-3 rounded-3xl group hover:border-primary/40 transition-all duration-500 cursor-pointer"
                onClick={() => setCurrentImage(item.url)}
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl shadow-xl">
                  <img src={item.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Archive" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadImage(item.url, item.prompt); }}
                      className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                    <button 
                      onClick={(e) => deleteFromHistory(item.timestamp, e)}
                      className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                <div className="mt-4 px-2 overflow-hidden">
                  <p className="text-[10px] font-bold text-muted line-clamp-1 italic mb-2 opacity-70">"{item.prompt}"</p>
                  <div className="flex justify-between items-center">
                     <span className="text-[8px] font-black text-primary uppercase tracking-widest">{item.style}</span>
                     <span className="text-[8px] font-black text-muted/40 uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

const MetaStat = ({ label, value }: { label: string, value: string }) => (
  <div className="text-right">
    <p className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className="text-[10px] font-black text-white uppercase tracking-widest">{value}</p>
  </div>
);

export default AnimeArtist;
