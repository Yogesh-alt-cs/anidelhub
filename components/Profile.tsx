
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';

interface Achievement {
  id: string;
  title: string;
  desc: string;
  howToUnlock: string;
  icon: string;
  completed: boolean;
}

interface ProfileProps {
  user: UserProfile | null;
  onLogout: () => void;
  onUpdateUser: (data: UserProfile) => void;
}

const AVATARS = [
  '⚡', '⚔️', '✨', '📜', '📚', '🤖', '🦊', '🌙', '🌌', '🎨'
];

const Profile: React.FC<ProfileProps> = ({ user, onLogout, onUpdateUser }) => {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile | null>(user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditData(user);
  }, [user]);

  if (!user) return null;

  const charCount = JSON.parse(localStorage.getItem('anidel_characters') || '[]').length;
  const historyCount = JSON.parse(localStorage.getItem('anidel_image_history') || '[]').length;
  const sessionCount = JSON.parse(localStorage.getItem('anidel_live_sessions') || '[]').length;
  
  const imageHistory = JSON.parse(localStorage.getItem('anidel_image_history') || '[]');
  const hasUltraImage = imageHistory.some((img: any) => img.detail === 'Ultra');

  const achievements: Achievement[] = [
    {
      id: 'first-spark',
      title: "Spark of Creation",
      desc: "Saved your first forged legend.",
      howToUnlock: "Head to the 'Character Forge' and save your first generated character.",
      icon: "⚡",
      completed: charCount > 0
    },
    {
      id: 'first-chronicle',
      title: "First Archive",
      desc: "Logged a conversation in the archives.",
      howToUnlock: "Use the 'Archive Current' button in the Live Companion.",
      icon: "📜",
      completed: sessionCount > 0
    },
    {
      id: 'legendary-creator',
      title: "Legendary Forger",
      desc: "Forged more than 5 unique anime characters.",
      howToUnlock: "Create and save at least 5 unique anime legends.",
      icon: "⚔️",
      completed: charCount >= 5
    },
    {
      id: 'visionary',
      title: "Ultra Visionary",
      desc: "Manifested a scene in Ultra Quality.",
      howToUnlock: "Generate a vision with Ultra Neural Precision.",
      icon: "✨",
      completed: hasUltraImage
    },
    {
      id: 'chronicler',
      title: "Lore Keeper",
      desc: "Amassed a collection of 3 or more archives.",
      howToUnlock: "Archive at least 3 different sync sessions.",
      icon: "📚",
      completed: sessionCount >= 3
    }
  ];

  const handleSaveProfile = () => {
    if (editData) {
      onUpdateUser(editData);
      setIsEditing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditData(prev => prev ? { ...prev, avatar: base64String } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const isImageAvatar = (avatar?: string) => avatar?.startsWith('data:image');

  const renderAvatarContent = (avatar?: string, username: string = 'U') => {
    if (isImageAvatar(avatar)) {
      return <img src={avatar} alt={username} className="w-full h-full object-cover" />;
    }
    return <span>{avatar || username[0]}</span>;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full relative">
      <div className="mb-8 lg:mb-12 flex flex-col md:flex-row items-center md:items-start lg:items-center gap-6 lg:gap-8 animate-in slide-in-from-top-4 duration-500">
        <div 
          className="w-24 h-24 lg:w-32 lg:h-32 rounded-[1.5rem] lg:rounded-[2.5rem] bg-gradient-to-br from-primary to-accent p-1 shadow-2xl relative group cursor-pointer"
          onClick={() => isEditing && fileInputRef.current?.click()}
        >
          <div className="w-full h-full rounded-[1.4rem] lg:rounded-[2.3rem] bg-background flex items-center justify-center text-3xl lg:text-5xl font-black uppercase border border-white/10 overflow-hidden relative">
            {renderAvatarContent(isEditing ? editData?.avatar : user.avatar, user.username)}
            {isEditing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p className="text-[8px] font-black text-white uppercase tracking-widest">UPLOAD</p>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        <div className="text-center md:text-left flex-1 w-full">
          {isEditing ? (
            <div className="space-y-4 max-w-sm mx-auto md:mx-0">
              <div>
                <label className="text-[8px] font-black text-primary uppercase tracking-widest mb-1 block">Handle</label>
                <input 
                  type="text" 
                  value={editData?.username} 
                  onChange={e => setEditData(prev => prev ? {...prev, username: e.target.value} : null)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-lg font-display font-black focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-primary uppercase tracking-widest mb-1 block">Biography</label>
                <textarea 
                  placeholder="Neural bio..."
                  value={editData?.bio || ''} 
                  onChange={e => setEditData(prev => prev ? {...prev, bio: e.target.value} : null)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-muted h-20 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-primary uppercase tracking-widest mb-2 block">Icon Presets</label>
                <div className="flex gap-1.5 flex-wrap justify-center md:justify-start">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 text-muted hover:bg-primary/20 hover:text-primary transition-all border border-white/10"
                    title="Upload Custom Image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  </button>
                  {AVATARS.map(icon => (
                    <button 
                      key={icon}
                      onClick={() => setEditData(prev => prev ? {...prev, avatar: icon} : null)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${editData?.avatar === icon ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-white/5 text-muted hover:bg-white/10 border border-white/10'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl lg:text-4xl font-display font-black mb-1">{user.username}</h2>
              <p className="text-muted text-xs lg:text-sm font-bold mb-3">{user.email}</p>
              <p className="text-xs lg:text-sm text-muted/80 italic mb-5 max-w-md mx-auto md:mx-0">{user.bio || "No neural biography defined."}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[8px] lg:text-[10px] font-black tracking-widest rounded-full uppercase">S-Rank Creator</span>
                <span className="px-3 py-1 bg-accent/10 border border-accent/20 text-accent text-[8px] lg:text-[10px] font-black tracking-widest rounded-full uppercase">Neural pioneer</span>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto md:ml-auto">
          {isEditing ? (
            <button 
              onClick={handleSaveProfile}
              className="flex-1 md:w-32 lg:w-40 px-4 py-3 bg-primary text-white rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              SAVE
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 md:w-32 lg:w-40 px-4 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              EDIT
            </button>
          )}
          <button 
            onClick={onLogout}
            className="flex-1 md:w-32 lg:w-40 px-4 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            LOG OUT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 lg:gap-6 mb-10 lg:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <StatCard label="Legends" value={charCount} icon="⚔️" />
        <StatCard label="Visions" value={historyCount} icon="✨" />
        <StatCard label="Archives" value={sessionCount} icon="📜" />
      </div>

      <div className="glass rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-8 border-white/10 shadow-2xl mb-12 lg:mb-20 animate-in zoom-in-95 duration-700">
        <div className="flex justify-between items-center mb-6 lg:mb-8 pb-3 border-b border-white/5">
          <h3 className="text-lg lg:text-xl font-black uppercase tracking-widest flex items-center gap-2">
            <svg className="w-5 h-5 lg:w-6 lg:h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>
            Accolades
          </h3>
          <span className="text-[8px] lg:text-[10px] font-bold text-muted uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full">Unlockable</span>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:gap-4">
          {achievements.map((achievement) => (
            <AchievementItem 
              key={achievement.id}
              achievement={achievement}
              onClick={() => setSelectedAchievement(achievement)}
            />
          ))}
        </div>
      </div>

      {/* Achievement Modal Responsive */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setSelectedAchievement(null)}></div>
          <div className="glass w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-white/20 relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="flex justify-center mb-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl ${selectedAchievement.completed ? 'bg-primary/20 text-primary ring-2 ring-primary/50' : 'bg-white/5 text-muted grayscale opacity-50'}`}>
                {selectedAchievement.completed ? selectedAchievement.icon : '🔒'}
              </div>
            </div>
            
            <div className="text-center">
              <h4 className="text-2xl font-black mb-2 uppercase tracking-tight italic">"{selectedAchievement.title}"</h4>
              <p className="text-muted font-bold text-xs mb-6 px-2 leading-relaxed">{selectedAchievement.desc}</p>
              
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
                <h5 className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-2">Requirement</h5>
                <p className="text-xs font-medium leading-relaxed text-foreground/90">
                  {selectedAchievement.completed ? "Synchronized successfully." : selectedAchievement.howToUnlock}
                </p>
              </div>

              <button 
                onClick={() => setSelectedAchievement(null)}
                className="mt-8 w-full py-3.5 bg-white text-black font-black rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all text-[10px] tracking-[0.2em] uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string, value: number, icon: string }) => (
  <div className="glass p-5 lg:p-8 rounded-2xl lg:rounded-[2rem] border-white/5 flex flex-col items-center text-center group hover:border-primary/50 transition-all hover:shadow-xl relative overflow-hidden">
    <div className="text-2xl lg:text-3xl mb-2 lg:mb-4 group-hover:scale-110 transition-transform duration-500">{icon}</div>
    <div className="text-3xl lg:text-5xl font-black mb-1 tracking-tighter">{value}</div>
    <div className="text-[8px] lg:text-[10px] font-black text-muted uppercase tracking-[0.2em]">{label}</div>
  </div>
);

const AchievementItem: React.FC<{ achievement: Achievement; onClick: () => void }> = ({ achievement, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-4 lg:gap-6 p-4 rounded-xl lg:rounded-2xl border cursor-pointer transition-all active:scale-[0.98] group relative overflow-hidden ${achievement.completed ? 'bg-white/5 border-primary/20 hover:border-primary/50' : 'border-white/5 opacity-50 hover:bg-white/5'}`}
  >
    <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-lg lg:rounded-2xl flex items-center justify-center text-xl lg:text-2xl transition-all duration-500 group-hover:rotate-12 ${achievement.completed ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10' : 'bg-white/5 text-muted'}`}>
      {achievement.completed ? achievement.icon : '🔒'}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className={`font-black text-xs lg:text-sm uppercase tracking-wider transition-colors truncate ${achievement.completed ? 'text-white group-hover:text-primary' : 'text-muted'}`}>{achievement.title}</h4>
      <p className="text-[10px] lg:text-xs text-muted font-medium line-clamp-1 mt-0.5">{achievement.desc}</p>
    </div>
    <div className={`text-[8px] lg:text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-md border shrink-0 ${achievement.completed ? 'border-primary/30 text-primary bg-primary/5' : 'border-white/5 text-muted'}`}>
      {achievement.completed ? 'UP' : 'OFF'}
    </div>
  </div>
);

export default Profile;
