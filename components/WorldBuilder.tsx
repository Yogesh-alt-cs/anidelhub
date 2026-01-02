
import React, { useState, useEffect, useMemo } from 'react';
import { forgeWorld, imagineScene, handleAIError } from '../services/geminiService';
import { AnimeWorld } from '../types';

const WorldBuilder: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [world, setWorld] = useState<AnimeWorld | null>(null);
  const [savedWorlds, setSavedWorlds] = useState<AnimeWorld[]>([]);
  const [loading, setLoading] = useState(false);
  const [manifestingImage, setManifestingImage] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('anidel_world_archives');
    if (saved) {
      try { setSavedWorlds(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveWorlds = (updated: AnimeWorld[]) => {
    setSavedWorlds(updated);
    localStorage.setItem('anidel_world_archives', JSON.stringify(updated));
  };

  const handleForge = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setApiError(null);
    try {
      const result = await forgeWorld(prompt);
      setWorld(result);
    } catch (error: any) {
      const msg = await handleAIError(error);
      setApiError(msg || "Neural resonance lost.");
    } finally {
      setLoading(false);
    }
  };

  const manifestVisual = async () => {
    if (!world || manifestingImage) return;
    setManifestingImage(true);
    try {
      const url = await imagineScene(`Anime environment: ${world.visualPrompt}`, 'Studio Ghibli', '16:9', 'High');
      setWorld({ ...world, portrait: url });
    } catch (e) {
      setApiError("Visual manifestation failed.");
    } finally {
      setManifestingImage(false);
    }
  };

  const archiveWorld = () => {
    if (!world) return;
    const updated = [world, ...savedWorlds.filter(w => w.id !== world.id)].slice(0, 20);
    saveWorlds(updated);
  };

  const togglePin = (id: string) => {
    const updated = savedWorlds.map(w => w.id === id ? { ...w, isPinned: !w.isPinned } : w);
    saveWorlds(updated);
  };

  const deleteWorld = (id: string) => {
    if (confirm("De-manifest this world?")) {
      saveWorlds(savedWorlds.filter(w => w.id !== id));
    }
  };

  const sortedWorlds = useMemo(() => {
    return [...savedWorlds].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
  }, [savedWorlds]);

  return (
    <div className="p-6 md:p-12 lg:p-20 max-w-7xl mx-auto w-full pb-48">
      <header className="mb-20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-1.5 h-6 bg-secondary rounded-full shadow-[0_0_15px_var(--color-secondary)]"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-secondary">Neural Nexus V1.0</p>
        </div>
        <h2 className="text-6xl md:text-9xl font-black tracking-tighter italic leading-none mb-6">World Builder.</h2>
        <p className="text-muted text-xl lg:text-2xl font-medium max-w-2xl opacity-70">Synthesize original dimensions for your narratives.</p>
      </header>

      <div className="glass rounded-[3rem] p-10 lg:p-14 mb-24 shadow-5xl border border-white/10 relative group overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-secondary opacity-20 group-hover:opacity-100 transition-opacity"></div>
        <div className="space-y-8">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A floating continent where magic is fueled by starlight..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-4xl px-8 py-8 focus:outline-none transition-ultra text-2xl lg:text-3xl font-black min-h-[160px] resize-none italic placeholder:opacity-20"
          />
          <button 
            onClick={handleForge}
            disabled={loading}
            className="w-full bg-secondary hover:opacity-95 text-white font-black py-6 rounded-[2rem] shadow-6xl transition-ultra uppercase italic tracking-[0.2em]"
          >
            {loading ? "MANIFESTING NEXUS..." : "FORGE REALM"}
          </button>
        </div>
      </div>

      {apiError && <div className="mb-10 text-red-500 font-bold">{apiError}</div>}

      {world && (
        <div className="animate-message space-y-12">
          <div className="glass rounded-[4rem] p-10 border border-white/10 grid grid-cols-1 xl:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10">
                {world.portrait ? (
                  <img src={world.portrait} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                    <button onClick={manifestVisual} disabled={manifestingImage} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                      {manifestingImage ? "Visualizing..." : "Manifest Visual"}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button onClick={archiveWorld} className="flex-1 py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-xs">Save to Archives</button>
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="text-5xl font-black italic tracking-tighter mb-2">{world.name}</h3>
                <p className="text-secondary font-black text-xs uppercase tracking-widest">{world.era}</p>
              </div>
              <p className="text-xl font-medium leading-relaxed italic">"{world.description}"</p>
              <div className="p-6 glass-light rounded-3xl border border-white/5">
                <h4 className="text-[10px] font-black uppercase text-secondary/60 mb-2">Magic System</h4>
                <p className="font-bold">{world.magicSystem}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase text-secondary/60 mb-4">Dominant Factions</h4>
                <div className="flex flex-wrap gap-2">
                  {world.factions.map(f => (
                    <span key={f} className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase border border-white/5">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {savedWorlds.length > 0 && (
        <div className="mt-32">
          <h3 className="text-3xl font-black italic tracking-tighter mb-12">World Archives</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedWorlds.map(w => (
              <div key={w.id} className={`glass p-6 rounded-[2.5rem] border ${w.isPinned ? 'border-secondary/40 bg-secondary/5' : 'border-white/5'} transition-ultra group relative overflow-hidden`}>
                <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-white/5">
                  {w.portrait && <img src={w.portrait} className="w-full h-full object-cover" alt="" />}
                </div>
                <h4 className="text-2xl font-black italic mb-2">{w.name}</h4>
                <p className="text-xs text-muted font-bold line-clamp-2 mb-6 italic">"{w.description}"</p>
                <div className="flex gap-2">
                  <button onClick={() => setWorld(w)} className="flex-1 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Recall</button>
                  <button onClick={() => togglePin(w.id)} className={`p-2 rounded-xl transition-all ${w.isPinned ? 'bg-secondary text-white' : 'glass border-white/10'}`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                  </button>
                  <button onClick={() => deleteWorld(w.id)} className="p-2 glass border-white/10 text-muted hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldBuilder;
