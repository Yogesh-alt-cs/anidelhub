
import React, { useState, useEffect, useMemo } from 'react';
import { forgeCharacter, imagineScene, handleAIError } from '../services/geminiService';
import { AnimeCharacter, CharacterOutfit } from '../types';

const STAT_KEYS = ['strength', 'speed', 'intelligence', 'endurance', 'agility', 'luck'] as const;

const CharacterForge: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [character, setCharacter] = useState<AnimeCharacter | null>(null);
  const [savedCharacters, setSavedCharacters] = useState<AnimeCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [manifestingOutfit, setManifestingOutfit] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [newOutfitName, setNewOutfitName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('anidel_forge_archives_v2');
    if (saved) {
      try { setSavedCharacters(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveToDisk = (updated: AnimeCharacter[]) => {
    setSavedCharacters(updated);
    localStorage.setItem('anidel_forge_archives_v2', JSON.stringify(updated));
  };

  const handleForge = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setApiError(null);
    try {
      const result = await forgeCharacter(prompt);
      setCharacter(result);
    } catch (error: any) {
      const msg = await handleAIError(error);
      setApiError(msg || "Neural resonance lost during forging.");
    } finally {
      setLoading(false);
    }
  };

  const handleManifestVisual = async (index: number) => {
    if (!character || manifestingOutfit) return;
    setManifestingOutfit(true);
    setApiError(null);
    try {
      const currentOutfit = character.outfits[index];
      const visualPrompt = `Cinematic anime character concept art, ${character.name}, ${character.title}. Outfit: ${currentOutfit.name}. Traits: ${character.personality}. Masterpiece lighting, sharp details, high fidelity.`;
      const imageUrl = await imagineScene(visualPrompt, 'Shonen', '3:4', 'High');
      
      const updatedOutfits = [...character.outfits];
      updatedOutfits[index] = { ...currentOutfit, portrait: imageUrl };
      
      const updatedChar = { ...character, outfits: updatedOutfits, currentOutfitIndex: index };
      setCharacter(updatedChar);
    } catch (error: any) {
      const msg = await handleAIError(error);
      setApiError(msg || "Visual manifestation failed.");
    } finally {
      setManifestingOutfit(false);
    }
  };

  const addOutfit = () => {
    if (!character || !newOutfitName.trim()) return;
    const updatedChar = {
      ...character,
      outfits: [...character.outfits, { name: newOutfitName, portrait: '' }],
      currentOutfitIndex: character.outfits.length
    };
    setCharacter(updatedChar);
    setNewOutfitName('');
  };

  const deleteOutfit = (index: number) => {
    if (!character || character.outfits.length <= 1) return;
    const updatedOutfits = character.outfits.filter((_, i) => i !== index);
    setCharacter({
      ...character,
      outfits: updatedOutfits,
      currentOutfitIndex: 0
    });
  };

  const updateStat = (key: keyof AnimeCharacter['stats'], value: number) => {
    if (!character) return;
    setCharacter({
      ...character,
      stats: { ...character.stats, [key]: value }
    });
  };

  const togglePin = (id: string) => {
    const updated = savedCharacters.map(c => c.id === id ? { ...c, isPinned: !c.isPinned } : c);
    saveToDisk(updated);
  };

  const archiveCharacter = () => {
    if (!character) return;
    const updated = [character, ...savedCharacters.filter(c => c.id !== character.id)].slice(0, 50);
    saveToDisk(updated);
  };

  const removeCharacter = (id: string) => {
    if (confirm("De-manifest this legend from the archives?")) {
      const updated = savedCharacters.filter(c => c.id !== id);
      saveToDisk(updated);
    }
  };

  const exportText = () => {
    if (!character) return;
    const text = `
NAME: ${character.name}
TITLE: ${character.title}
PERSONALITY: ${character.personality}
STATS: ${Object.entries(character.stats).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(', ')}
MOVE: ${character.specialMove}
BACKSTORY: ${character.backstory}
    `.trim();
    navigator.clipboard.writeText(text);
    alert("Character dossier copied to clipboard.");
  };

  const exportJSON = () => {
    if (!character) return;
    const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${character.name}_data.json`;
    link.click();
  };

  const sortedArchives = useMemo(() => {
    return [...savedCharacters].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [savedCharacters]);

  return (
    <div className="p-6 md:p-12 lg:p-20 max-w-7xl mx-auto w-full pb-48">
      <header className="mb-20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_var(--color-primary)]"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-primary">Neural Forge V4.2</p>
        </div>
        <h2 className="text-6xl md:text-9xl font-black tracking-tighter italic leading-none mb-6">Forge Legend.</h2>
        <p className="text-muted text-xl lg:text-2xl font-medium max-w-2xl opacity-70">Synthesize unique identities from the synaptic currents of the 2026 anime database.</p>
      </header>

      {/* Forging Input */}
      <div className="glass rounded-[3rem] p-8 lg:p-14 mb-24 shadow-5xl border border-white/10 relative group overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-primary opacity-20 group-hover:opacity-100 transition-opacity"></div>
        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-muted uppercase tracking-[0.4em]">Origin Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cybernetic samurai with gravity-defying hair who wanders Neo-Tokyo..."
              className="w-full bg-white/[0.04] border border-white/10 rounded-4xl px-8 py-8 focus:outline-none transition-ultra text-2xl lg:text-3xl font-black min-h-[180px] resize-none italic placeholder:opacity-20"
            />
          </div>
          <button 
            onClick={handleForge}
            disabled={loading}
            className="w-full gradient-bg hover:opacity-95 active:scale-[0.99] disabled:opacity-50 text-white font-black py-7 rounded-[2.5rem] shadow-6xl transition-ultra flex items-center justify-center gap-6 text-2xl tracking-[0.2em] uppercase italic border border-white/20"
          >
            {loading ? (
              <div className="flex items-center gap-6">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="animate-pulse">FORGING SOUL...</span>
              </div>
            ) : 'FORGE ARCHETYPE'}
          </button>
        </div>
      </div>

      {apiError && (
        <div className="mb-20 glass border-red-500/30 bg-red-500/5 p-8 rounded-4xl flex items-center gap-8 animate-in slide-in-from-top-4">
          <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0 border border-red-500/20"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
          <div className="flex-1 text-red-300 font-bold">{apiError}</div>
        </div>
      )}

      {/* Forged Character Workspace */}
      {character && (
        <div className="animate-in fade-in zoom-in-95 duration-1000 space-y-20">
          <div className="glass rounded-[4rem] overflow-hidden border border-white/10 shadow-5xl relative">
            <div className="grid grid-cols-1 xl:grid-cols-12">
              
              {/* Visual Panel */}
              <div className="xl:col-span-5 p-8 lg:p-14 border-b xl:border-b-0 xl:border-r border-white/5 bg-white/[0.01]">
                <div className="relative aspect-[3/4] rounded-[3rem] overflow-hidden bg-white/5 border border-white/10 shadow-3xl mb-12 group">
                  {character.outfits[character.currentOutfitIndex].portrait ? (
                    <img src={character.outfits[character.currentOutfitIndex].portrait} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                      {manifestingOutfit ? (
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse italic">Visualizing Resonance</p>
                        </div>
                      ) : (
                        <div className="space-y-6 opacity-30">
                          <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <p className="text-[10px] font-black uppercase tracking-widest italic">Awaiting Manifestation</p>
                        </div>
                      )}
                    </div>
                  )}
                  {!character.outfits[character.currentOutfitIndex].portrait && !manifestingOutfit && (
                    <button 
                      onClick={() => handleManifestVisual(character.currentOutfitIndex)}
                      className="absolute inset-0 bg-primary/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-ultra flex items-center justify-center font-black text-xs uppercase tracking-[0.4em] text-white"
                    >
                      Manifest Visual
                    </button>
                  )}
                </div>

                {/* Outfit Manager */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Outfit Matrix</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {character.outfits.map((o, idx) => (
                      <div key={idx} className="relative group/outfit">
                        <button 
                          onClick={() => setCharacter({ ...character, currentOutfitIndex: idx })}
                          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-ultra ${character.currentOutfitIndex === idx ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 text-muted hover:text-white'}`}
                        >
                          {o.name}
                        </button>
                        {character.outfits.length > 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteOutfit(idx); }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover/outfit:opacity-100 transition-opacity hover:scale-110"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newOutfitName}
                      onChange={(e) => setNewOutfitName(e.target.value)}
                      placeholder="Add outfit name..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-[10px] font-black focus:outline-none"
                    />
                    <button onClick={addOutfit} className="p-3 glass rounded-2xl text-primary hover:bg-primary/20 transition-ultra">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Data & Tuning Panel */}
              <div className="xl:col-span-7 p-8 lg:p-14 flex flex-col h-full bg-background">
                <header className="mb-14">
                   <div className="flex items-center gap-3 mb-4">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">Manifesting Identity</span>
                   </div>
                   <h3 className="text-5xl lg:text-7xl font-black italic tracking-tighter mb-2 leading-none">{character.name}</h3>
                   <p className="text-2xl lg:text-3xl font-bold italic text-muted/50 tracking-tight">{character.title}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14 mb-16">
                  {STAT_KEYS.map(k => (
                    <div key={k} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">{k}</span>
                        <span className="text-2xl font-black italic text-primary">{character.stats[k]}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={character.stats[k]}
                        onChange={(e) => updateStat(k, parseInt(e.target.value))}
                        className="w-full h-1.5 bg-white/5 rounded-full accent-primary"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-8 flex-1">
                   <div className="glass-light p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 group-hover:bg-primary transition-colors"></div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/40 mb-3">Lore Background</h4>
                      <p className="text-lg font-bold italic leading-relaxed">"{character.backstory}"</p>
                   </div>
                   <div className="glass-light p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-accent/30 group-hover:bg-accent transition-colors"></div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-accent/40 mb-3">Ultimate Resonator</h4>
                      <p className="text-3xl lg:text-4xl font-black italic tracking-tighter">{character.specialMove}</p>
                   </div>
                </div>

                <div className="mt-14 flex flex-wrap gap-4">
                  <button onClick={archiveCharacter} className="flex-1 px-8 py-5 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-3xl hover:opacity-90 active:scale-95 transition-ultra shadow-2xl">Archive Legend</button>
                  <div className="flex gap-2">
                    <button onClick={exportText} className="p-5 glass rounded-3xl text-muted hover:text-white transition-ultra" title="Copy Dossier">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </button>
                    <button onClick={exportJSON} className="p-5 glass rounded-3xl text-muted hover:text-white transition-ultra" title="Export JSON">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archives Gallery */}
      {savedCharacters.length > 0 && (
        <div className="mt-40">
          <div className="flex items-center gap-10 mb-16">
            <h3 className="text-3xl font-black italic tracking-tighter shrink-0">Synaptic Archives</h3>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedArchives.map(char => (
              <div 
                key={char.id} 
                className={`glass p-8 rounded-[3rem] transition-ultra group relative overflow-hidden border ${char.isPinned ? 'border-primary/50 bg-primary/5 shadow-2xl' : 'border-white/5 hover:border-primary/30 hover:-translate-y-2'}`}
              >
                {char.isPinned && <div className="absolute top-6 right-8 text-primary"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg></div>}
                <div className="flex gap-6 items-center mb-8">
                  <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    {char.outfits[char.currentOutfitIndex].portrait && (
                      <img src={char.outfits[char.currentOutfitIndex].portrait} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-2xl truncate group-hover:text-primary transition-ultra italic tracking-tight leading-none mb-1">{char.name}</h4>
                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] truncate opacity-50">{char.title}</p>
                  </div>
                </div>
                <p className="text-sm text-muted font-bold line-clamp-2 italic mb-10 opacity-60 leading-relaxed">"{char.backstory}"</p>
                <div className="flex gap-2">
                   <button onClick={() => setCharacter(char)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Restore</button>
                   <button onClick={() => togglePin(char.id)} className={`p-3 rounded-2xl border transition-all ${char.isPinned ? 'bg-primary border-primary text-white' : 'glass border-white/10 text-muted'}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg></button>
                   <button onClick={() => removeCharacter(char.id)} className="p-3 glass rounded-2xl text-muted hover:text-red-400 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterForge;
