
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

  const renderAvatarContent = (avatar?: string, username: string = 'U') => {
    if (isImageAvatar(avatar)) {
      return <img src={avatar} alt={username} className="w-full h-full object-cover" />;
    }
    return <span>{avatar || username[0]}</span>;
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 glass border-r border-white/5 p-6 lg:p-8 gap-10 z-20 shrink-0 h-screen">
        <div 
          className="flex items-center gap-4 group cursor-pointer" 
          onClick={() => setActiveTab(AppTab.FORGE)}
        >
          <div className="w-12 h-12 gradient-bg rounded-2xl flex items-center justify-center font-black text-white shadow-2xl transition-apple group-hover:scale-110 active:scale-95 border border-white/20">
            AD
          </div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tighter transition-apple group-hover:tracking-tight italic">
            ANI<span className="text-primary transition-all">DEL</span>
          </h1>
        </div>

        {user && (
          <div 
            className={`flex items-center gap-3 p-3 lg:p-4 rounded-3xl border transition-apple ${
              activeTab === AppTab.PROFILE 
                ? 'glass-light border-primary/40 ring-1 ring-primary/20' 
                : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'
            } cursor-pointer`}
            onClick={() => setActiveTab(AppTab.PROFILE)}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold shadow-xl uppercase text-sm border border-white/20 overflow-hidden shrink-0">
              {renderAvatarContent(user.avatar, user.username)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-xs lg:text-sm truncate">{user.username}</p>
              <p className="text-[9px] text-primary/80 truncate uppercase tracking-[0.2em] font-black">ACTIVE LINK</p>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1">
          <NavItem 
            label="Character Forge" 
            active={activeTab === AppTab.FORGE} 
            onClick={() => setActiveTab(AppTab.FORGE)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
          />
          <NavItem 
            label="Anime Artist" 
            active={activeTab === AppTab.ARTIST || activeTab === AppTab.IMAGINER} 
            onClick={() => setActiveTab(AppTab.ARTIST)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
          />
          <NavItem 
            label="Del Live Link" 
            active={activeTab === AppTab.ASSISTANT} 
            onClick={() => setActiveTab(AppTab.ASSISTANT)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
          />
          <NavItem 
            label="Live Intelligence" 
            active={activeTab === AppTab.SEARCH} 
            onClick={() => setActiveTab(AppTab.SEARCH)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
          <div className="h-px bg-white/5 my-4 mx-2"></div>
          <NavItem 
            label="Settings" 
            active={activeTab === AppTab.SETTINGS} 
            onClick={() => setActiveTab(AppTab.SETTINGS)}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.370 2.370a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.310-2.37 2.370a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.940-3.310-.826-2.370-2.370a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.940-1.543.826-3.310 2.370-2.370.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden h-[100dvh]">
        <div className="flex-1 overflow-y-auto pb-32 md:pb-0 scroll-smooth">
          {children}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 glass rounded-[2.5rem] border border-white/10 flex justify-around items-center p-3 z-50 shadow-3xl backdrop-blur-3xl safe-area-bottom">
        <MobileNavItem 
          active={activeTab === AppTab.FORGE} 
          onClick={() => setActiveTab(AppTab.FORGE)}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>}
        />
        <MobileNavItem 
          active={activeTab === AppTab.ARTIST} 
          onClick={() => setActiveTab(AppTab.ARTIST)}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
        />
        <MobileNavItem 
          active={activeTab === AppTab.ASSISTANT} 
          onClick={() => setActiveTab(AppTab.ASSISTANT)}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
        />
        <MobileNavItem 
          active={activeTab === AppTab.PROFILE} 
          onClick={() => setActiveTab(AppTab.PROFILE)}
          icon={
            <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center font-black transition-all ${activeTab === AppTab.PROFILE ? 'bg-primary text-white' : 'bg-white/10 text-muted'}`}>
              {isImageAvatar(user?.avatar) ? (
                <img src={user?.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px]">{user?.avatar || user?.username[0] || '?'}</span>
              )}
            </div>
          }
        />
      </nav>
    </div>
  );
};

const NavItem = ({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`group flex items-center gap-4 px-5 py-3.5 rounded-3xl transition-apple relative overflow-hidden ${
      active 
        ? 'glass-light text-white shadow-xl ring-1 ring-white/10' 
        : 'text-muted hover:bg-white/[0.04] hover:text-white hover:translate-x-1'
    }`}
  >
    <div className={`transition-apple ${active ? 'text-primary scale-110' : 'group-hover:text-foreground'}`}>
        {icon}
    </div>
    <span className={`font-bold tracking-tight text-sm whitespace-nowrap ${active ? 'text-white' : 'text-muted'}`}>{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`p-3.5 rounded-2xl transition-apple active:scale-75 ${
      active 
        ? 'text-primary bg-primary/10 shadow-[inset_0_0_10px_rgba(99,102,241,0.2)] scale-110' 
        : 'text-muted hover:text-white'
    }`}
  >
    {icon}
  </button>
);

export default Layout;
