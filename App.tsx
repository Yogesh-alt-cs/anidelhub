
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import CharacterForge from './components/CharacterForge';
import AnimeArtist from './components/AnimeArtist';
import LiveSearch from './components/LiveSearch';
import LiveCompanion from './components/LiveCompanion';
import Profile from './components/Profile';
import Settings from './components/Settings';
import Login from './components/Login';
import Intro from './components/Intro';
import { AppTab, UserProfile } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.FORGE);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showIntro, setShowIntro] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('anidel_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem('anidel_user', JSON.stringify(userData));
    setActiveTab(AppTab.FORGE);
  };

  const handleUpdateUser = (updatedData: UserProfile) => {
    setUser(updatedData);
    localStorage.setItem('anidel_user', JSON.stringify(updatedData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('anidel_user');
    setActiveTab(AppTab.LOGIN);
  };

  const startApp = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return <Intro onComplete={startApp} />;
  }

  const renderContent = () => {
    if (!user && activeTab !== AppTab.LOGIN) {
        setActiveTab(AppTab.LOGIN);
        return <Login onLogin={handleLogin} />;
    }

    switch (activeTab) {
      case AppTab.FORGE:
        return <CharacterForge />;
      case AppTab.ARTIST:
      case AppTab.IMAGINER: // Legacy fallback
        return <AnimeArtist />;
      case AppTab.SEARCH:
        return <LiveSearch />;
      case AppTab.ASSISTANT:
        return <LiveCompanion />;
      case AppTab.PROFILE:
        return <Profile user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />;
      case AppTab.SETTINGS:
        return <Settings />;
      case AppTab.LOGIN:
        return <Login onLogin={handleLogin} />;
      default:
        return <CharacterForge />;
    }
  };

  return (
    <Layout activeTab={activeTab === AppTab.IMAGINER ? AppTab.ARTIST : activeTab} setActiveTab={setActiveTab} user={user}>
      <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="z-10 h-full overflow-y-auto overflow-x-hidden">
            <div key={activeTab} className="tab-content-enter h-full">
              {renderContent()}
            </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
