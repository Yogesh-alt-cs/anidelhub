
import React, { useState, useEffect } from 'react';
import { imagineScene, getSceneSuggestions } from '../services/geminiService';
import { GeneratedImage, AnimeStyle, AspectRatio, DetailLevel } from '../types';

// Fix: Change 'Studio Ghibli-esque' to 'Studio Ghibli' to match the AnimeStyle type definition
const STYLES: AnimeStyle[] = ['Shonen', 'Shojo', 'Cyberpunk', 'Studio Ghibli', 'Dark Fantasy', 'Retro 90s'];
const ASPECTS: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];
const DETAILS: DetailLevel[] = ['Standard', 'High', 'Ultra'];

const SceneImaginer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<AnimeStyle>('Shonen');
  const [aspect, setAspect] = useState<AspectRatio>('16:9');
  const [detail, setDetail] = useState<DetailLevel>('High');
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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

  const saveToHistory = (img: GeneratedImage) => {
    let updated = [img, ...history];
    // Keep a reasonable soft limit first
    if (updated.length > 10) updated = updated.slice(0, 10);
    
    let success = false;
    while (!success && updated.length > 0) {
      try {
        localStorage.setItem('anidel_image_history', JSON.stringify(updated));
        setHistory(updated);
        success = true;
      } catch (e) {
        // If QuotaExceeded, remove the oldest item and try again
        updated.pop();
        if (updated.length === 0) {
          console.error("Storage completely full even for a single image.");
          localStorage.removeItem('anidel_image_history');
          setHistory([]);
          break;
        }
      }
    }
  };

  const handleGenerate = async (customPrompt?: string, customStyle?: AnimeStyle, customAspect?: AspectRatio, customDetail?: DetailLevel) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim()) return;
    
    setLoading(true);
    setApiError(null);
    try {
      const imageUrl = await imagineScene(
        targetPrompt, 
        customStyle || style, 
        customAspect || aspect, 
        customDetail || detail
      );
      setCurrentImage(imageUrl);
      saveToHistory({ 
        url: imageUrl, 
        prompt: targetPrompt, 
        timestamp: Date.now(),
        style: customStyle || style,
        aspect: customAspect || aspect,
        detail: customDetail || detail
      });
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || "Failed to imagine scene.");
    } finally {
      setLoading(false);
    }
  };

  const handleVariation = (item: GeneratedImage) => {
    const variationPrompt = `${item.prompt}, alternative composition, variation`;
    setPrompt(variationPrompt);
    setStyle(item.style);
    setAspect(item.aspect);
    setDetail(item.detail);
    handleGenerate(variationPrompt, item.style, item.aspect, item.detail);
  };

  const downloadImage = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName.trim().replace(/\s+/g, '_')}_anidel.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFixKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setApiError(null);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full pb-32">
      <div className="mb-6 lg:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl lg:text-4xl font-display font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Scene Imaginer</h2>
          <p className="text-muted text-sm lg:text-base font-medium">Synthesize high-fidelity anime visuals using advanced neural diffusion.</p>
        </div>
        <div className="flex gap-2">
            <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-full">FLASH IMAGE</span>
            <span className="px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-full">3 PRO</span>
        </div>
      </div>

      <div className="glass rounded-2xl lg:rounded-[2rem] p-5 lg:p-8 mb-6 space-y-6 lg:space-y-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 lg:w-2 h-full bg-gradient-to-b from-accent to-primary"></div>
        
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-[10px] font-black text-accent uppercase tracking-[0.2em]">INPUT MANIFESTO</label>
            <button 
              onClick={fetchSuggestions}
              disabled={loadingSuggestions}
              className="text-[9px] font-black text-primary/60 hover:text-primary uppercase tracking-widest flex items-center gap-1.5 transition-colors disabled:opacity-30"
            >
              {loadingSuggestions ? 'Summoning...' : 'New Inspiration'}
              <svg className={`w-3 h-3 ${loadingSuggestions ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
          <textarea 
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A floating academy at sunset..."
            className="w-full bg-background/50 border border-white/10 rounded-xl lg:rounded-2xl px-5 py-4 lg:py-5 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none font-bold text-base lg:text-lg placeholder:text-muted/30"
          />
          
          {/* Suggestions Chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setPrompt(suggestion)}
                className="px-3 py-1.5 glass-light border border-white/5 rounded-full text-[10px] font-bold text-foreground/70 hover:text-white hover:border-primary/40 hover:bg-primary/10 transition-all active:scale-95 text-left max-w-xs truncate"
                title={suggestion}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="space-y-3 lg:space-y-4">
            <label className="block text-[9px] lg:text-[10px] font-black text-muted uppercase tracking-[0.2em]">ARTISTIC STYLE</label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-2 gap-2">
              {STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-2 py-2 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black tracking-tighter xs:tracking-widest transition-all uppercase truncate ${style === s ? 'bg-accent text-white shadow-lg shadow-accent/20 border-accent' : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white border border-transparent'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <label className="block text-[9px] lg:text-[10px] font-black text-muted uppercase tracking-[0.2em]">ASPECT DIMENSIONS</label>
            <div className="flex flex-wrap gap-2">
              {ASPECTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAspect(a)}
                  className={`flex-1 min-w-[50px] lg:min-w-[60px] py-2 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black transition-all border ${aspect === a ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/5 text-muted hover:bg-white/10 hover:text-white'}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 lg:space-y-4">
            <label className="block text-[9px] lg:text-[10px] font-black text-muted uppercase tracking-[0.2em]">PRECISION</label>
            <div className="grid grid-cols-1 gap-2">
              {DETAILS.map(d => (
                <button
                  key={d}
                  onClick={() => setDetail(d)}
                  className={`w-full py-2 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black transition-all border flex items-center justify-between px-4 ${detail === d ? 'bg-white border-white text-black' : 'bg-white/5 border-white/5 text-muted hover:bg-white/10 hover:text-white'}`}
                >
                  <span>{d.toUpperCase()}</span>
                  {d === 'Ultra' && <span className="text-[7px] lg:text-[8px] bg-accent text-white px-1.5 py-0.5 rounded ml-2">G3P</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => handleGenerate()}
          disabled={loading}
          className="w-full gradient-bg hover:opacity-90 active:scale-[0.98] disabled:opacity-50 text-white font-black py-4 lg:py-5 px-6 lg:px-8 rounded-xl lg:rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 text-lg lg:text-xl tracking-[0.1em]"
        >
          {loading ? (
            <div className="w-6 h-6 lg:w-8 lg:h-8 border-3 lg:border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-5 h-5 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              MANIFEST VISION
            </>
          )}
        </button>
      </div>

      {apiError && (
        <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-red-200 font-bold mb-1">Link Failure</p>
            <p className="text-red-300/80 text-xs">{apiError.includes('RATE_LIMIT') ? 'Neural network is congested. Please wait a moment.' : 'Model access restricted.'}</p>
          </div>
          {!apiError.includes('RATE_LIMIT') && (
            <button 
              onClick={handleFixKey}
              className="px-4 py-2 bg-white text-black font-black rounded-lg text-[9px] tracking-widest uppercase hover:bg-white/90 active:scale-95 transition-all shadow-lg"
            >
              Fix Access
            </button>
          )}
        </div>
      )}

      {currentImage && !apiError && (
        <div className="mb-12 lg:mb-16 animate-in zoom-in slide-in-from-bottom-8 duration-700">
          <div className="glass p-3 lg:p-4 rounded-2xl lg:rounded-[2.5rem] shadow-2xl overflow-hidden relative group border-white/10">
            <div className="relative rounded-xl lg:rounded-[2rem] overflow-hidden shadow-2xl">
              <img 
                src={currentImage} 
                alt="Generated scene" 
                className="w-full h-auto max-h-[70vh] object-contain bg-black/40"
              />
              <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => downloadImage(currentImage, prompt.slice(0, 20))}
                    className="p-2.5 bg-black/60 backdrop-blur-xl rounded-full text-white hover:bg-primary transition-all border border-white/20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
              </div>
            </div>
            <div className="mt-6 lg:mt-8 px-4 lg:px-6 pb-2 lg:pb-4 flex flex-col md:flex-row md:items-end justify-between gap-5 lg:gap-6">
              <div className="flex-1">
                <span className="bg-accent text-white px-2.5 py-0.5 rounded-md text-[8px] lg:text-[10px] font-black tracking-widest mb-2 inline-block uppercase">Manifested</span>
                <p className="text-white font-black text-xl lg:text-3xl italic leading-tight mb-4">"{prompt}"</p>
                <div className="flex flex-wrap gap-3 lg:gap-4 p-3 lg:p-4 bg-white/5 rounded-xl lg:rounded-2xl border border-white/5">
                  <MetaBadge label="STYLE" value={style} />
                  <MetaBadge label="ASPECT" value={aspect} />
                  <MetaBadge label="PRECISION" value={detail} />
                </div>
              </div>
              <button 
                onClick={() => downloadImage(currentImage, prompt.slice(0, 30))}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 lg:px-8 py-3.5 lg:py-4 bg-white text-black font-black rounded-xl lg:rounded-2xl shadow-xl hover:bg-white/90 active:scale-95 transition-all text-xs lg:text-sm tracking-widest border border-white/20 shrink-0"
              >
                <svg className="w-4 h-4 lg:w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                DOWNLOAD
              </button>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-16 lg:mt-20">
          <h3 className="text-xl lg:text-2xl font-black mb-8 flex items-center gap-4 lg:gap-6 text-muted uppercase tracking-[0.2em] lg:tracking-[0.3em]">
            <span className="flex-1 h-px bg-white/10"></span>
            Chronicles
            <span className="flex-1 h-px bg-white/10"></span>
          </h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8">
            {history.map((item) => (
              <div 
                key={item.timestamp} 
                className="glass p-2.5 rounded-2xl group hover:border-accent/40 transition-all duration-500 hover:-translate-y-1 relative"
              >
                <div className="relative aspect-video overflow-hidden rounded-xl shadow-lg">
                    <img src={item.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Chronicle" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 lg:gap-3">
                         <button 
                            onClick={() => handleVariation(item)}
                            className="p-2.5 bg-accent rounded-lg text-white shadow-xl hover:scale-110 active:scale-95 transition-all"
                        >
                            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                        <button 
                            onClick={() => downloadImage(item.url, item.prompt.slice(0, 15))}
                            className="p-2.5 bg-white text-black rounded-lg shadow-xl hover:scale-110 active:scale-95 transition-all"
                        >
                            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                    </div>
                </div>
                <div className="mt-3 p-1.5">
                    <p className="text-[11px] lg:text-xs font-bold text-foreground line-clamp-1 leading-relaxed mb-1.5 group-hover:text-accent transition-colors">"{item.prompt}"</p>
                    <div className="flex justify-between items-center text-[8px] lg:text-[9px] font-black text-muted tracking-widest uppercase">
                        <span>{item.style}</span>
                        <span className="opacity-50">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MetaBadge = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[7px] lg:text-[8px] font-black text-muted uppercase tracking-widest">{label}</span>
    <span className="text-[9px] lg:text-[10px] font-bold text-white uppercase">{value}</span>
  </div>
);

export default SceneImaginer;
