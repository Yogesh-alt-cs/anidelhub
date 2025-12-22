
import React, { useState, useEffect } from 'react';
import { fetchUpcomingNexus } from '../services/geminiService';

const CATEGORIES = ['Anime Releases', 'AI Technology', 'Global Tech Trends', 'Gaming 2026'];

const AnimeNexus: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [data, setData] = useState<{ text: string; sources: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNexus = async (cat: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUpcomingNexus(cat);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to bridge to the 2026 Nexus.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNexus(activeCategory);
  }, [activeCategory]);

  return (
    <div className="p-4 md:p-10 lg:p-16 max-w-5xl mx-auto w-full pb-32">
      <div className="mb-12 lg:mb-20">
        <h2 className="text-5xl lg:text-7xl font-black mb-6 tracking-tighter italic leading-none">Anime Nexus 2026</h2>
        <p className="text-muted text-xl lg:text-2xl font-medium max-w-3xl leading-relaxed opacity-70">
          Real-time intelligence on upcoming releases, global trends, and neural evolution for 2025 and 2026.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-12">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeCategory === cat ? 'gradient-bg text-white shadow-xl scale-105' : 'glass-light text-muted hover:text-white border border-white/5'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-primary font-black uppercase tracking-[0.4em] text-xs animate-pulse">Syncing Future Timelines...</p>
        </div>
      ) : error ? (
        <div className="glass p-10 rounded-[3rem] border-red-500/20 text-red-400 flex items-center gap-6">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="font-bold">{error}</p>
        </div>
      ) : data && (
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 space-y-12">
          <div className="glass rounded-[3rem] lg:rounded-[4rem] p-10 lg:p-16 border border-white/10 shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-8">
               <span className="px-3 py-1 bg-primary/20 rounded-lg text-primary text-[10px] font-black uppercase tracking-widest border border-primary/30">LATEST INTEL</span>
               <span className="text-muted/40 font-black text-[10px] uppercase tracking-widest">Grounding Date: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="prose prose-invert max-w-none">
               <p className="text-foreground/90 leading-relaxed text-lg lg:text-xl font-medium whitespace-pre-wrap tracking-tight">{data.text}</p>
            </div>
          </div>

          {data.sources.length > 0 && (
            <div className="space-y-6">
              <h4 className="text-[11px] font-black text-muted uppercase tracking-[0.4em] italic pl-4">Neural Grounding Citations</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="glass p-6 rounded-2xl border border-white/5 hover:border-primary/50 hover:bg-white/[0.08] transition-all flex items-center justify-between group shadow-lg"
                  >
                    <div className="flex-1 overflow-hidden pr-4">
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-all mb-1">{source.title}</p>
                      <p className="text-[10px] text-muted truncate opacity-50 uppercase tracking-widest font-black">{new URL(source.uri).hostname}</p>
                    </div>
                    <svg className="w-5 h-5 text-muted/30 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnimeNexus;
