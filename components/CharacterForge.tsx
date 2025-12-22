
import React, { useState, useEffect } from 'react';
import { forgeCharacter, imagineScene } from '../services/geminiService';
import { AnimeCharacter } from '../types';

const CharacterForge: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [character, setCharacter] = useState<AnimeCharacter | null>(null);
  const [savedCharacters, setSavedCharacters] = useState<AnimeCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('anidel_characters');
    if (saved) {
      try {
        setSavedCharacters(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved characters", e);
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setApiError(null);
    try {
      const result = await forgeCharacter(prompt);
      setCharacter(result);
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || "Failed to forge character.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePortrait = async () => {
    if (!character || portraitLoading) return;
    setPortraitLoading(true);
    setApiError(null);
    try {
      const portraitPrompt = `Anime character portrait of ${character.name}, ${character.title}. ${character.personality}. ${character.backstory}. Masterpiece, high detail.`;
      const imageUrl = await imagineScene(portraitPrompt, 'Shonen', '1:1', 'High');
      setCharacter(prev => prev ? { ...prev, portrait: imageUrl } : null);
    } catch (error: any) {
      console.error(error);
      setApiError(error.message || "Failed to manifest portrait.");
    } finally {
      setPortraitLoading(false);
    }
  };

  const saveCharacter = () => {
    if (!character) return;
    const isAlreadySaved = savedCharacters.some(c => c.id === character.id);
    if (isAlreadySaved) {
        // Update if already exists (for cases where portrait is generated later)
        const updated = savedCharacters.map(c => c.id === character.id ? character : c);
        setSavedCharacters(updated);
        localStorage.setItem('anidel_characters', JSON.stringify(updated));
        return;
    }
    const updated = [character, ...savedCharacters];
    setSavedCharacters(updated);
    localStorage.setItem('anidel_characters', JSON.stringify(updated));
  };

  const exportCharacter = (char: AnimeCharacter) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(char, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${char.name.replace(/\s+/g, '_')}_legend.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const deleteSavedCharacter = (id: string) => {
    const updated = savedCharacters.filter(c => c.id !== id);
    setSavedCharacters(updated);
    localStorage.setItem('anidel_characters', JSON.stringify(updated));
  };

  const clearCollection = () => {
    setSavedCharacters([]);
    localStorage.removeItem('anidel_characters');
    setShowClearConfirm(false);
  };

  return (
    <div className="p-4 md:p-10 lg:p-14 max-w-5xl mx-auto w-full pb-32">
      <div className="mb-12 lg:mb-20">
        <h2 className="text-5xl lg:text-7xl font-black mb-6 tracking-tighter leading-none italic">Character Forge</h2>
        <p className="text-muted text-xl lg:text-2xl font-medium max-w-3xl leading-relaxed opacity-70">
          Describe a destiny, a soul, or a hidden power to summon a new anime legend into the archives.
        </p>
      </div>

      <div className="bg-card rounded-4xl lg:rounded-5xl p-8 lg:p-12 mb-12 flex flex-col md:flex-row gap-8 items-center md:items-end shadow-2xl relative border border-white/10 group transition-all">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-all"></div>
        <div className="flex-1 w-full">
          <label className="block text-[12px] font-black mb-4 text-primary uppercase tracking-[0.4em]">Synaptic Theme</label>
          <input 
            type="text" 
            value={prompt}
            disabled={loading}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A ronin haunted by lightning spirits..."
            className="w-full bg-background border border-white/10 rounded-2xl lg:rounded-3xl px-8 py-5 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-bold text-lg lg:text-xl placeholder:text-muted/20 disabled:opacity-50"
          />
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full md:w-auto gradient-bg hover:scale-[1.02] active:scale-95 disabled:opacity-70 text-white font-black py-5 px-12 lg:px-16 rounded-2xl lg:rounded-3xl shadow-2xl transition-all flex items-center justify-center gap-3 shrink-0 uppercase tracking-widest text-sm relative overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="animate-pulse">FORGING...</span>
            </div>
          ) : (
            <span>Forge Legacy</span>
          )}
        </button>
      </div>

      {apiError && (
        <div className="mb-12 bg-red-500/10 border border-red-500/20 rounded-3xl p-8 flex items-center gap-8 animate-in slide-in-from-top-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <p className="text-red-300 font-bold text-base leading-relaxed">{apiError}</p>
        </div>
      )}

      {character && !apiError && (
        <div className={`animate-in fade-in zoom-in-95 duration-1000 mb-24 lg:mb-36 ${loading ? 'opacity-30 grayscale blur-[1px] transition-all' : 'transition-all'}`}>
          <div className="bg-card rounded-5xl overflow-hidden shadow-2xl relative border border-white/5">
            <div className="gradient-bg p-10 lg:p-16 text-white relative flex flex-col md:flex-row gap-10 items-center">
              <div className="absolute top-0 right-0 p-10 lg:p-16 text-white/10 font-black text-8xl lg:text-9xl select-none leading-none pointer-events-none italic">
                {character.stats.strength > 85 ? 'S+' : 'LGD'}
              </div>
              
              {/* Portrait Display */}
              <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-3xl overflow-hidden bg-black/30 border-2 border-white/20 shadow-2xl shrink-0 relative group/portrait">
                {character.portrait ? (
                  <img src={character.portrait} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    {portraitLoading ? (
                        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
                    ) : (
                        <svg className="w-12 h-12 text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{portraitLoading ? 'Visualizing...' : 'No Portrait manifested'}</p>
                  </div>
                )}
                {!character.portrait && !portraitLoading && (
                  <button 
                    onClick={handleGeneratePortrait}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/portrait:opacity-100 transition-opacity flex items-center justify-center p-6"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-white text-center">Tap to Manifest Visuals</span>
                  </button>
                )}
              </div>

              <div className="relative z-20 flex-1">
                <div className="mb-5 flex flex-wrap gap-3">
                  <span className="px-4 py-1.5 bg-black/30 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-white/20 shadow-xl">
                    LEGEND SUMMONED
                  </span>
                  {!character.portrait && (
                    <button 
                        onClick={handleGeneratePortrait}
                        disabled={portraitLoading}
                        className="px-4 py-1.5 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {portraitLoading ? 'MANIFESTING...' : 'MANIFEST PORTRAIT'}
                    </button>
                  )}
                </div>
                <h3 className="text-4xl lg:text-7xl font-black mb-3 tracking-tighter italic leading-none">{character.name}</h3>
                <p className="text-xl lg:text-3xl font-bold opacity-80 italic mb-8">{character.title}</p>
                
                <div className="flex flex-col xs:flex-row gap-4">
                  <button 
                    onClick={saveCharacter}
                    className="bg-white text-primary hover:scale-105 px-8 py-4 rounded-2xl text-[12px] font-black shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 border border-white/20 uppercase tracking-widest"
                  >
                    {savedCharacters.some(c => c.id === character.id) ? 'SYNC UPDATE' : 'ADD TO COLLECTION'}
                  </button>
                  <button 
                    onClick={() => exportCharacter(character)}
                    className="bg-black/20 hover:bg-black/40 px-8 py-4 rounded-2xl text-[12px] font-black transition-all active:scale-95 border border-white/10 uppercase tracking-widest"
                  >
                    EXPORT DATA
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-10 lg:p-16 grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 bg-card/50 relative">
              <div className="space-y-12">
                <div>
                  <h4 className="text-primary font-black uppercase tracking-[0.4em] text-[11px] mb-5 opacity-60 italic">Neural Origin</h4>
                  <p className="text-foreground/90 leading-relaxed text-xl lg:text-2xl font-medium tracking-tight">{character.backstory}</p>
                </div>
                <div>
                  <h4 className="text-secondary font-black uppercase tracking-[0.4em] text-[11px] mb-5 opacity-60 italic">Psych Core</h4>
                  <p className="text-foreground/80 italic text-xl leading-relaxed">"{character.personality}"</p>
                </div>
                <div className="bg-white/5 rounded-4xl p-10 border border-white/5 shadow-inner group transition-all hover:bg-white/10">
                  <h4 className="text-primary font-black uppercase tracking-[0.4em] text-[11px] mb-4 opacity-60 italic">Signature Move</h4>
                  <p className="text-3xl lg:text-5xl font-black text-white group-hover:scale-105 transition-all origin-left italic">{character.specialMove}</p>
                </div>
              </div>

              <div className="space-y-12">
                <h4 className="text-muted font-black uppercase tracking-[0.4em] text-[11px] mb-8 opacity-60 text-center md:text-left italic">Combat Capabilities</h4>
                <div className="space-y-10">
                  <StatBar label="Power" value={character.stats.strength} color="bg-red-500" />
                  <StatBar label="Speed" value={character.stats.agility} color="bg-emerald-500" />
                  <StatBar label="Mind" value={character.stats.intelligence} color="bg-blue-500" />
                  <StatBar label="Force" value={character.stats.charisma} color="bg-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {savedCharacters.length > 0 && (
        <div className="mt-24">
          <div className="flex items-center justify-between mb-16 pb-6 border-b border-white/10">
            <h3 className="text-4xl font-black tracking-tight italic">The Archives</h3>
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="text-muted/40 hover:text-red-500 text-[11px] font-black uppercase tracking-[0.3em] px-6 py-3 rounded-2xl hover:bg-red-500/10 transition-all flex items-center gap-4"
            >
              WIPE ARCHIVE
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10">
            {savedCharacters.map(char => (
              <div key={char.id} className="bg-card p-10 rounded-4xl group hover:border-primary/40 transition-all hover:shadow-2xl hover:-translate-y-3 relative overflow-hidden border border-white/5 flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-5 items-center flex-1 min-w-0">
                    {char.portrait && (
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shrink-0 border border-white/10">
                            <img src={char.portrait} alt={char.name} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                        <h4 className="font-black text-3xl truncate group-hover:text-primary transition-all italic">{char.name}</h4>
                        <p className="text-[11px] text-muted font-black uppercase tracking-[0.3em] mt-1 italic">{char.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 ml-4 shrink-0">
                    <button 
                      onClick={() => deleteSavedCharacter(char.id)}
                      className="p-4 bg-red-500/5 rounded-2xl text-muted/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                
                <p className="text-base text-muted font-medium leading-relaxed mb-8 line-clamp-3">
                  {char.backstory}
                </p>
                
                <div className="grid grid-cols-4 gap-4 mt-auto">
                    <MiniStat color="bg-red-500" value={char.stats.strength} />
                    <MiniStat color="bg-emerald-500" value={char.stats.agility} />
                    <MiniStat color="bg-blue-500" value={char.stats.intelligence} />
                    <MiniStat color="bg-amber-500" value={char.stats.charisma} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowClearConfirm(false)}></div>
          <div className="bg-card w-full max-w-md rounded-5xl p-12 shadow-2xl border border-white/10 relative z-10 animate-in zoom-in-95 duration-500 text-center">
            <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h4 className="text-3xl font-black mb-3 italic">Purge Archive?</h4>
            <p className="text-muted font-medium text-base mb-12 leading-relaxed px-4">
              All forged legends will be permanently exiled from the neural database. This action is irreversible.
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={clearCollection}
                className="w-full py-5 bg-red-500 text-white font-black rounded-2xl shadow-xl hover:bg-red-600 transition-all uppercase tracking-widest text-sm"
              >
                CONFIRM OBLITERATION
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="w-full py-5 bg-white/5 text-muted font-black rounded-2xl hover:text-white transition-all uppercase tracking-widest text-sm"
              >
                ABORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    // Reset and then trigger animation when the value prop changes or on mount
    setAnimatedWidth(0);
    const timer = setTimeout(() => {
      setAnimatedWidth(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="group">
      <div className="flex justify-between mb-3 items-end">
        <span className="text-[12px] font-black uppercase tracking-[0.4em] text-muted/60 group-hover:text-white transition-all italic">{label}</span>
        <span className="text-xl font-black italic">{value}<span className="text-[12px] text-muted opacity-40 ml-1">/ 100</span></span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-3 p-0.5 border border-white/5 relative overflow-hidden shadow-inner">
        <div 
          className={`${color} h-full rounded-full transition-all duration-1000 ease-out relative group-hover:scale-y-110 shadow-lg`}
          style={{ width: `${animatedWidth}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ color, value }: { color: string, value: number }) => (
  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
    <div className={`h-full ${color} opacity-80 group-hover:opacity-100 transition-all shadow-xl`} style={{ width: `${value}%` }}></div>
  </div>
);

export default CharacterForge;
