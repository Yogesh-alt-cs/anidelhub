
import React from 'react';
import { AppTab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  user: { username: string; email: string; avatar?: string } | null;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user }) => {
  const isImageAvatar = (avatar?: string) => avatar?.startsWith('data:image');

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 glass border-r border-white/5 p-8 gap-8 z-20 shrink-0 h-screen overflow-y-auto custom-scrollbar">
        <div 
          className="flex items-center gap-4 cursor-pointer group mb-4" 
          onClick={() => setActiveTab(AppTab.FORGE)}
        >
          <div className="w-11 h-11 gradient-bg rounded-2xl flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(129,140,248,0.4)] transition-ultra group-hover:scale-105 group-active:scale-95 border border-white/20">
            A
          </div>
          <h1 className="text-xl font-black tracking-tight">
            ANI<span className="text-primary italic">DEL</span>
          </h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <NavItem 
            label="Character Forge" 
            active={activeTab === AppTab.FORGE} 
            onClick={() => setActiveTab(AppTab.FORGE)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.183.394l-1.434.956a2 2 0 00-.73 2.732l.5 1a2 2 0 002.732.73l.956-.537a2 2 0 011.827-.14l1.311.524a2 2 0 001.562 0l1.311-.524a2 2 0 011.827.14l.956.537a2 2 0 002.732-.73l.5-1a2 2 0 00-.73-2.732l-1.434-.956z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 3h6v6" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14L21 3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 18v3h3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 18v3h-3" /></svg>}
          />
          <NavItem 
            label="World Builder" 
            active={activeTab === AppTab.WORLD} 
            onClick={() => setActiveTab(AppTab.WORLD)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <NavItem 
            label="Manifest Realm" 
            active={activeTab === AppTab.MANIFEST} 
            onClick={() => setActiveTab(AppTab.MANIFEST)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          />
          <NavItem 
            label="Anime Artist" 
            active={activeTab === AppTab.ARTIST} 
            onClick={() => setActiveTab(AppTab.ARTIST)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
          <NavItem 
            label="Live Companion" 
            active={activeTab === AppTab.ASSISTANT} 
            onClick={() => setActiveTab(AppTab.ASSISTANT)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
          />
          <NavItem 
            label="Intelligence" 
            active={activeTab === AppTab.SEARCH} 
            onClick={() => setActiveTab(AppTab.SEARCH)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
        </nav>

        {user && (
          <div 
            className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-ultra border mt-auto ${
              activeTab === AppTab.PROFILE 
                ? 'bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(129,140,248,0.1)]' 
                : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
            }`}
            onClick={() => setActiveTab(AppTab.PROFILE)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold shadow-lg overflow-hidden shrink-0 border border-white/10">
              {isImageAvatar(user.avatar) ? (
                <img src={user.avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-sm">{user.avatar || user.username[0]}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{user.username}</p>
              <p className="text-[10px] text-primary uppercase font-black tracking-widest opacity-60">Status: Active</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-[100dvh]">
        <div className="flex-1 overflow-y-auto pb-32 md:pb-0 custom-scrollbar">
          {children}
        </div>
      </main>

      {/* Mobile Nav - Floating Dock style */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 glass rounded-[2.5rem] border border-white/10 flex justify-around items-center p-3 z-50 shadow-2xl">
        <MobileNavItem active={activeTab === AppTab.FORGE} onClick={() => setActiveTab(AppTab.FORGE)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.183.394l-1.434.956a2 2 0 00-.73 2.732l.5 1a2 2 0 002.732.73l.956-.537a2 2 0 011.827-.14l1.311.524a2 2 0 001.562 0l1.311-.524a2 2 0 011.827.14l.956.537a2 2 0 002.732-.73l.5-1a2 2 0 00-.73-2.732l-1.434-.956z" /></svg>} />
        <MobileNavItem active={activeTab === AppTab.WORLD} onClick={() => setActiveTab(AppTab.WORLD)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <MobileNavItem active={activeTab === AppTab.MANIFEST} onClick={() => setActiveTab(AppTab.MANIFEST)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
        <MobileNavItem active={activeTab === AppTab.PROFILE} onClick={() => setActiveTab(AppTab.PROFILE)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
      </nav>
    </div>
  );
};

const NavItem = ({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-ultra ${
      active 
        ? 'bg-white/[0.06] text-white shadow-xl border border-white/10' 
        : 'text-muted hover:text-white hover:bg-white/[0.02]'
    }`}
  >
    <div className={`transition-transform duration-500 ${active ? 'text-primary scale-110' : 'text-muted'}`}>{icon}</div>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) => (
  <button 
    onClick={onClick} 
    className={`p-4 rounded-2xl transition-ultra ${
      active ? 'text-primary bg-primary/15 scale-110 shadow-lg shadow-primary/20' : 'text-muted'
    }`}
  >
    {icon}
  </button>
);

export default Layout;
