
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { manifestIdea, imagineScene, handleAIError } from '../services/geminiService';
import { ManifestItem } from '../types';

const CATEGORIES = ['Character', 'World', 'Story', 'Scene', 'Concept', 'Vision'];

const ManifestRealm: React.FC = () => {
  const [intent, setIntent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [enableVisuals, setEnableVisuals] = useState(true);
  const [isManifesting, setIsManifesting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [manifestedItem, setManifestedItem] = useState<ManifestItem | null>(null);
  const [history, setHistory] = useState<ManifestItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('anidel_manifest_archives');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveHistory = (updated: ManifestItem[]) => {
    setHistory(updated);
    localStorage.setItem('anidel_manifest_archives', JSON.stringify(updated));
  };

  const handleManifest = async () => {
    if (!intent.trim()) return;
    
    setIsActivating(true);
    setApiError(null);
    
    // Portal Activation Animation delay
    setTimeout(async () => {
      setIsManifesting(true);
      setIsActivating(false);

      try {
        const result = await manifestIdea(intent, category);
        
        let imageUrl = '';
        if (enableVisuals && result.visualPrompt) {
          imageUrl = await imagineScene(result.visualPrompt, 'Shonen', '16:9', 'High');
        }

        const newItem: ManifestItem = {
          id: crypto.randomUUID(),
          intent,
          category,
          title: result.title,
          description: result.description,
          scene: result.scene,
          snapshot: result.snapshot,
          visualPrompt: result.visualPrompt,
          affirmation: result.affirmation,
          imageUrl,
          timestamp: Date.now(),
          isPinned: false
        };

        setManifestedItem(newItem);
        saveHistory([newItem, ...history].slice(0, 50));
        
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
      } catch (err) {
        setApiError(await handleAIError(err));
      } finally {
        setIsManifesting(false);
      }
    }, 1500);
  };

  const togglePin = (id: string) => {
    const updated = history.map(item => item.id === id ? { ...item, isPinned: !item.isPinned } : item);
    saveHistory(updated);
  };

  const deleteManifest = (id: string) => {
    if (confirm("De-manifest this creation from the archives?")) {
      saveHistory(history.filter(item => item.id !== id));
      if (manifestedItem?.id === id) setManifestedItem(null);
    }
  };

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
  }, [history]);

  return (
    <div className="p-6 md:p-12 lg:p-20 max-w-7xl mx-auto w-full pb-48 relative overflow-hidden">
      {/* Background Energy Flow */}
      {isActivating && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] bg-gradient-to-r from-primary/20 via-transparent to-accent/20 animate-spin duration-[10s]"></div>
        </div>
      )}

      <header className="mb-20 relative z-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-1.5 h-6 bg-accent rounded-full shadow-[0_0_15px_var(--color-accent)]"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-accent">Manifest Realm V1.0</p>
        </div>
        <h2 className="text-6xl md:text-9xl font-black tracking-tighter italic leading-none mb-6">Manifest Idea.</h2>
        <p className="text-muted text-xl lg:text-2xl font-medium max-w-2xl opacity-70 italic">Convert raw intention into synaptic reality.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 mb-24 items-start relative z-10">
        {/* Input Panel */}
        <div className="xl:col-span-5 space-y-8">
          <div className="glass rounded-[3rem] p-8 lg:p-12 border border-white/10 shadow-5xl sticky top-10">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-primary uppercase tracking-[0.4em]">The Intention</label>
                <textarea 
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="e.g. A young alchemist searching for the forgotten sound of starlight..."
                  className="w-full bg-white/[0.04] border border-white/10 rounded-4xl px-8 py-8 focus:outline-none transition-ultra text-xl font-bold min-h-[160px] resize-none italic placeholder:opacity-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-muted uppercase tracking-[0.4em]">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-muted uppercase tracking-[0.4em]">Visuals</label>
                  <button 
                    onClick={() => setEnableVisuals(!enableVisuals)}
                    className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${enableVisuals ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-muted'}`}
                  >
                    {enableVisuals ? 'SYNCHRONIZED' : 'TEXT ONLY'}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleManifest}
                disabled={isManifesting || isActivating || !intent.trim()}
                className={`w-full py-7 rounded-[2.5rem] font-black uppercase italic tracking-[0.3em] text-sm transition-all shadow-6xl relative overflow-hidden group ${isActivating ? 'scale-95 opacity-50' : 'gradient-bg hover:scale-[1.02] active:scale-95'}`}
              >
                {isActivating ? (
                  <span className="animate-pulse">ACTIVATING REALM...</span>
                ) : isManifesting ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="animate-pulse">MANIFESTING...</span>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <span className="relative">MANIFEST VISION</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Manifest Output Panel */}
        <div className="xl:col-span-7">
          {manifestedItem ? (
            <div className="animate-message space-y-12 pb-20">
              {/* Visual Result */}
              {manifestedItem.imageUrl && (
                <div className="glass rounded-[4rem] p-3 border border-white/10 shadow-6xl overflow-hidden relative group">
                   <div className="aspect-video rounded-[3rem] overflow-hidden">
                      <img src={manifestedItem.imageUrl} className="w-full h-full object-cover" alt="" />
                   </div>
                   <div className="absolute top-8 left-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-primary border border-primary/20">MANIFESTED VISUAL</span>
                   </div>
                </div>
              )}

              {/* Textual Result */}
              <div className="glass rounded-[4rem] p-10 lg:p-16 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] select-none">
                  <span className="text-[12rem] font-black italic">{manifestedItem.category[0]}</span>
                </div>
                
                <header className="mb-14">
                  <div className="flex items-center gap-3 mb-4">
                     <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_var(--color-primary)]"></span>
                     <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Manifest Established</span>
                  </div>
                  <h3 className="text-5xl lg:text-7xl font-black italic tracking-tighter leading-none mb-4">{manifestedItem.title}</h3>
                  <p className="text-xl lg:text-2xl text-muted font-bold tracking-tight opacity-70 italic">"{manifestedItem.affirmation}"</p>
                </header>

                <div className="space-y-14">
                  <section className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-accent flex items-center gap-4">
                      The Manifestation Description
                      <div className="h-px flex-1 bg-accent/20"></div>
                    </h4>
                    <p className="text-xl lg:text-2xl leading-relaxed font-medium text-foreground/90">{manifestedItem.description}</p>
                  </section>

                  <section className="space-y-6 bg-white/[0.02] p-8 lg:p-12 rounded-[3rem] border border-white/5">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-4">
                      Narrative Scene
                      <div className="h-px flex-1 bg-primary/20"></div>
                    </h4>
                    <p className="text-lg lg:text-xl leading-relaxed italic text-foreground/80 whitespace-pre-wrap">{manifestedItem.scene}</p>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-muted tracking-widest">Snapshot</h4>
                        <div className="p-6 glass-light rounded-3xl border border-white/5 text-sm font-bold opacity-80">{manifestedItem.snapshot}</div>
                     </div>
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-muted tracking-widest">Visual Logic</h4>
                        <div className="p-6 glass-light rounded-3xl border border-white/5 text-[11px] leading-relaxed italic opacity-60 uppercase tracking-wider">{manifestedItem.visualPrompt}</div>
                     </div>
                  </div>

                  <div className="pt-10 flex gap-4">
                    <button onClick={() => setManifestedItem(null)} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Reset Realm</button>
                    <button onClick={() => togglePin(manifestedItem.id)} className="px-8 py-4 glass border-white/10 hover:border-primary/40 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Pin Manifest</button>
                  </div>
                </div>
              </div>
              <div ref={bottomRef}></div>
            </div>
          ) : (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center opacity-10 space-y-10">
               <div className="w-64 h-64 glass rounded-full flex items-center justify-center border-white/10 animate-float relative">
                  <div className="absolute inset-4 rounded-full border-2 border-primary/20 animate-ping"></div>
                  <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 4a2 2 0 114 0v1a2 2 0 002 2h3a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 110 4h-1a2 2 0 00-2 2v1a2 2 0 01-2 2h-3a2 2 0 00-2 2v1a2 2 0 11-4 0v-1a2 2 0 00-2-2H7a2 2 0 01-2-2v-1a2 2 0 00-2-2H4a2 2 0 110-4h1a2 2 0 002-2V9a2 2 0 012-2h3a2 2 0 002-2V4z" /></svg>
               </div>
               <div className="space-y-4">
                  <h3 className="text-4xl font-black italic tracking-tighter uppercase">Realm Standby</h3>
                  <p className="text-xl font-bold">Declare your intent to begin synchronization.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* History Archives */}
      {history.length > 0 && (
        <div className="mt-40 relative z-10">
           <div className="flex items-center gap-10 mb-16">
             <h3 className="text-3xl font-black italic tracking-tighter shrink-0 uppercase">Manifest Archives</h3>
             <div className="flex-1 h-px bg-white/10"></div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedHistory.map(item => (
                <div 
                  key={item.id} 
                  className={`glass p-10 rounded-[3rem] border transition-ultra group relative overflow-hidden flex flex-col ${item.isPinned ? 'border-primary/50 bg-primary/5 shadow-2xl scale-[1.02]' : 'border-white/5 hover:border-accent/30 hover:-translate-y-2'}`}
                >
                   {item.isPinned && (
                     <div className="absolute top-8 right-10 text-primary">
                       <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                     </div>
                   )}
                   
                   <div className="mb-8">
                      {item.imageUrl && (
                        <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-white/5">
                           <img src={item.imageUrl} className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt="" />
                        </div>
                      )}
                      <h4 className="text-2xl font-black italic mb-2 group-hover:text-primary transition-colors leading-tight">{item.title}</h4>
                      <p className="text-[10px] font-black uppercase text-accent tracking-widest">{item.category} • {new Date(item.timestamp).toLocaleDateString()}</p>
                   </div>
                   
                   <p className="text-sm text-muted font-bold line-clamp-3 italic mb-10 opacity-60 leading-relaxed">
                     "{item.description}"
                   </p>

                   <div className="flex gap-2 mt-auto">
                      <button onClick={() => { setManifestedItem(item); setIntent(item.intent); setCategory(item.category); }} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Recall</button>
                      <button onClick={() => togglePin(item.id)} className={`p-3 rounded-2xl border transition-all ${item.isPinned ? 'bg-primary border-primary text-white shadow-lg' : 'glass border-white/10 text-muted'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                      </button>
                      <button onClick={() => deleteManifest(item.id)} className="p-3 glass border-white/10 rounded-2xl text-muted hover:text-red-400 transition-all">
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

export default ManifestRealm;
