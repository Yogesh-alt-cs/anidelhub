
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googlePass, setGooglePass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && email) {
      onLogin({ username, email });
    }
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ 
      username: googleEmail.split('@')[0] || 'Google_User', 
      email: googleEmail || 'user@gmail.com',
      avatar: '🤖',
      bio: 'Neural link established via Google Protocol.'
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative h-full">
      {/* Cinematic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-primary/20 blur-[150px] animate-float"></div>
         <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[40%] bg-accent/20 blur-[120px] animate-pulse"></div>
      </div>

      <div className="w-full max-w-md animate-in zoom-in fade-in duration-1000 relative z-10">
        <div className="glass rounded-[3rem] lg:rounded-[4rem] p-10 lg:p-14 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.6)] border-white/10 relative overflow-hidden">
          {/* Light reflection flare */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/[0.05] blur-[80px] rounded-full"></div>
          
          <div className="flex flex-col items-center mb-12">
            <div className="w-16 h-16 gradient-bg rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-2xl border border-white/20 mb-6">
              AD
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-black tracking-tighter italic mb-1">ANI<span className="text-primary">DEL</span></h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.5em]">Neural Hub Access</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted/60 uppercase tracking-[0.3em] ml-2">Handle</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Shinji_77"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-apple font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted/60 uppercase tracking-[0.3em] ml-2">Neural ID</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@anidel.ai"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-apple font-bold"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full gradient-bg hover:scale-105 active:scale-95 text-white font-black py-5 rounded-[1.5rem] shadow-2xl transition-apple flex items-center justify-center gap-3 text-sm tracking-[0.2em] mt-8 uppercase border border-white/10"
            >
              SYNCHRONIZE
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-white/5"></div>
                <span className="text-[10px] font-black text-muted/40 uppercase tracking-[0.2em]">Liquid Link</span>
                <div className="flex-1 h-px bg-white/5"></div>
            </div>
            <button 
              onClick={() => setShowGoogleModal(true)}
              className="w-full flex items-center justify-center gap-4 py-4 glass-light rounded-2xl border-white/10 hover:bg-white/[0.08] transition-apple group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-apple" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545 11.033v3.123h8.341c-.244 1.406-1.12 3.593-4.322 3.593c-2.775 0-5.04-2.296-5.04-5.125s2.265-5.125 5.04-5.125c1.579 0 2.637.669 3.238 1.25l2.458-2.368C20.686 4.965 18.528 4 15.564 4c-4.418 0-8 3.582-8 8s3.582 8 8 8c4.609 0 7.674-3.245 7.674-7.811c0-.527-.057-1.03-.162-1.531l-10.531.075z"/></svg>
              <span className="font-bold text-sm tracking-tight">Sync via Google</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mock Google Login Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl" onClick={() => setShowGoogleModal(false)}></div>
          <div className="w-full max-w-sm glass rounded-[3rem] p-10 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)] relative z-10 animate-in zoom-in-95 duration-500 border-white/20">
            <div className="text-center mb-8">
              <div className="w-14 h-14 glass-light rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <svg className="w-7 h-7" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              </div>
              <h3 className="text-2xl font-black italic">Google Protocol</h3>
              <p className="text-sm text-muted/60 font-medium">Synchronizing Secure Link...</p>
            </div>
            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              <input 
                type="email" 
                required 
                placeholder="Google Mail"
                value={googleEmail}
                onChange={e => setGoogleEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-1 focus:ring-primary/40 outline-none font-bold"
              />
              <input 
                type="password" 
                required 
                placeholder="Password"
                value={googlePass}
                onChange={e => setGooglePass(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-1 focus:ring-primary/40 outline-none font-bold"
              />
              <div className="flex justify-between items-center pt-6">
                <button type="button" onClick={() => setShowGoogleModal(false)} className="text-muted font-bold text-sm hover:text-white transition-apple px-2">Abort</button>
                <button type="submit" className="bg-white text-black font-black px-8 py-3 rounded-2xl hover:scale-105 transition-apple active:scale-95 shadow-2xl uppercase text-[11px] tracking-widest">Connect</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
