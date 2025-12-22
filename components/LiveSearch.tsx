
import React, { useState, useEffect, useRef } from 'react';
import { searchInternet, getSearchSuggestions } from '../services/geminiService';

const LiveSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [result, setResult] = useState<{ text: string; sources: { title: string; uri: string }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [savedQueries, setSavedQueries] = useState<string[]>([]);
  const [suggestionError, setSuggestionError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved queries
  useEffect(() => {
    const saved = localStorage.getItem('anidel_saved_queries');
    if (saved) {
      try {
        setSavedQueries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load queries", e);
      }
    }
  }, []);

  // AI-powered suggestions with debouncing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2 && !suggestionError) {
        try {
          const fetched = await getSearchSuggestions(query);
          setSuggestions(fetched);
          setShowSuggestions(true);
        } catch (e: any) {
          console.warn("Suggestions fetch failed");
          if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) {
            setSuggestionError(true);
            setTimeout(() => setSuggestionError(false), 30000);
          }
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [query, suggestionError]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const targetQuery = customQuery || query;
    if (!targetQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    setResult(null);
    try {
      const data = await searchInternet(targetQuery);
      if (!data.text || data.text.trim() === "") {
        setError(
          <div className="text-center py-2">
            <p className="font-bold text-base mb-1">No data extracted.</p>
            <p className="text-xs opacity-70">Try a different neural query.</p>
          </div>
        );
      } else {
        setResult(data);
      }
      if (customQuery) setQuery(customQuery);
    } catch (err: any) {
      console.error(err);
      const isRateLimit = err.message?.includes('RATE_LIMIT');
      setError(
        <div className="flex flex-col gap-1">
          <p className="font-bold text-sm text-red-400">{isRateLimit ? 'Neural Congestion Detected' : 'Neural bridge interrupted.'}</p>
          <p className="text-[11px] opacity-80 leading-tight">
            {isRateLimit ? 'The hub is currently at maximum capacity. Please wait a moment.' : (err.message || "Connection failure.")}
          </p>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuery = (q: string) => {
    if (!q.trim() || savedQueries.includes(q)) return;
    const updated = [q, ...savedQueries].slice(0, 10);
    setSavedQueries(updated);
    localStorage.setItem('anidel_saved_queries', JSON.stringify(updated));
  };

  const removeSavedQuery = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedQueries.filter(item => item !== q);
    setSavedQueries(updated);
    localStorage.setItem('anidel_saved_queries', JSON.stringify(updated));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(undefined, suggestion);
  };

  return (
    <div className="p-4 md:p-10 lg:p-16 max-w-5xl mx-auto w-full pb-32">
      <div className="mb-12 lg:mb-20">
        <h2 className="text-5xl lg:text-7xl font-black mb-6 tracking-tighter italic leading-none">Live Intelligence</h2>
        <p className="text-muted text-xl lg:text-2xl font-medium max-w-3xl leading-relaxed opacity-70">
          Synthesize global knowledge via advanced Search grounding.
        </p>
      </div>

      <div className="glass rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-12 mb-10 shadow-2xl relative border border-white/10 group overflow-visible" ref={dropdownRef}>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-all"></div>
        
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-6 items-center md:items-end relative">
          <div className="flex-1 w-full relative">
            <label className="block text-[11px] font-black mb-4 text-primary uppercase tracking-[0.4em]">Synaptic Query</label>
            <div className="relative">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim().length > 2 && !suggestionError && setShowSuggestions(true)}
                placeholder="Ask about anime, news, or trends..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl lg:rounded-3xl px-8 py-5 focus:outline-none transition-all duration-500 font-bold text-lg lg:text-xl placeholder:text-muted/20"
              />
              {/* AI Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 glass rounded-3xl border border-white/10 shadow-3xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
                  <div className="p-3 border-b border-white/5 bg-primary/5">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest px-4 py-1">Neural Recommendations</p>
                  </div>
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-7 py-4.5 text-base font-bold text-foreground/80 hover:bg-white/5 hover:text-primary transition-all flex items-center gap-5 border-b border-white/5 last:border-0"
                    >
                      <svg className="w-5 h-5 text-muted shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              {suggestionError && (
                <div className="absolute top-full left-0 right-0 mt-4 p-4 glass-light rounded-2xl border border-red-500/20 text-red-300 text-[10px] font-black uppercase tracking-widest text-center animate-in zoom-in-95">
                  Neural Congestion (Rate Limit) - Auto-suggestions paused.
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto h-[68px] lg:h-[76px]">
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 md:w-auto px-10 lg:px-14 gradient-bg text-white font-black rounded-2xl lg:rounded-3xl shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-4 shrink-0 border border-white/10"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden lg:inline animate-pulse">ANALYZING...</span>
                </div>
              ) : (
                <>
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   <span>SEARCH</span>
                </>
              )}
            </button>
            {result && (
              <button 
                type="button"
                onClick={() => handleSaveQuery(query)}
                className={`w-20 flex items-center justify-center glass-light border border-white/10 rounded-2xl lg:rounded-3xl transition-all ${savedQueries.includes(query) ? 'text-primary border-primary/40 bg-primary/10' : 'text-muted hover:text-white'}`}
              >
                <svg className="w-7 h-7" fill={savedQueries.includes(query) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              </button>
            )}
          </div>
        </form>
      </div>

      {savedQueries.length > 0 && (
        <div className="mb-16 px-4 animate-in slide-in-from-top-4 duration-500">
           <h3 className="text-[11px] font-black text-muted/60 uppercase tracking-[0.4em] mb-6">Recent Intel</h3>
           <div className="flex flex-wrap gap-3">
              {savedQueries.map((q, idx) => (
                <div 
                  key={idx} 
                  onClick={() => { setQuery(q); handleSearch(undefined, q); }}
                  className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-primary/40 cursor-pointer transition-all group animate-in fade-in scale-in-95"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <span className="text-sm font-bold text-foreground/80 group-hover:text-white">{q}</span>
                  <button onClick={(e) => removeSavedQuery(q, e)} className="text-muted/40 hover:text-red-400 transition-colors p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
           </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-10 rounded-[2.5rem] mb-16 animate-in fade-in slide-in-from-top-4 shadow-xl">
          <div className="flex items-start gap-8">
             <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/20">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
             <div className="flex-1">
                {error}
             </div>
          </div>
        </div>
      )}

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 space-y-12">
          <div className="glass rounded-[3rem] lg:rounded-[4rem] p-10 lg:p-16 border border-white/10 shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none"></div>
            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-8 italic">Synthesized Neural Report</h3>
            <p className="text-foreground/90 leading-relaxed text-xl lg:text-2xl font-medium whitespace-pre-wrap tracking-tight">{result.text}</p>
          </div>

          {result.sources.length > 0 && (
            <div className="space-y-8 px-2">
              <div className="flex items-center gap-8">
                <h4 className="text-[11px] font-black text-muted uppercase tracking-[0.4em] italic shrink-0">Grounded Sources</h4>
                <div className="flex-1 h-px bg-white/5"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {result.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="glass p-6 lg:p-8 rounded-3xl border border-white/5 hover:border-primary/50 hover:bg-white/[0.08] transition-all flex items-center justify-between group shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-right-4"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-all"></div>
                    <div className="flex-1 overflow-hidden pr-6">
                      <p className="font-black text-base lg:text-lg truncate group-hover:text-primary transition-all tracking-tight mb-1">{source.title}</p>
                      <p className="text-[10px] lg:text-[11px] text-muted truncate opacity-50 font-bold uppercase tracking-wider">{new URL(source.uri).hostname}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                       <svg className="w-6 h-6 text-muted group-hover:text-primary transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </div>
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

export default LiveSearch;
