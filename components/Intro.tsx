
import React, { useState, useEffect } from 'react';

interface IntroProps {
  onComplete: () => void;
}

const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 1500),
      setTimeout(() => setStage(3), 2500)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-background flex items-center justify-center p-6 overflow-hidden select-none">
      {/* Dynamic Background Blobs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-float opacity-50"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[120px] animate-float opacity-40" style={{ animationDelay: '2s' }}></div>
      
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        <div className={`transition-all duration-1000 transform ${stage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          <div className="w-24 h-24 lg:w-32 lg:h-32 gradient-bg rounded-[2rem] lg:rounded-[2.5rem] flex items-center justify-center font-black text-white text-4xl lg:text-5xl shadow-[0_20px_50px_rgba(99,102,241,0.3)] border border-white/20">
            AD
          </div>
        </div>

        <div className={`mt-10 text-center transition-all duration-1000 delay-300 ${stage >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter italic mb-4">
            ANI<span className="text-primary">DEL</span> <span className="text-white/40">HUB</span>
          </h1>
          <p className="text-muted text-sm lg:text-base font-medium tracking-tight px-4 opacity-70 leading-relaxed">
            Synchronizing neural anime archives... bridging the nexus of creativity.
          </p>
        </div>

        <div className={`mt-16 w-full transition-all duration-1000 delay-700 ${stage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <button 
            onClick={onComplete}
            className="w-full glass-light border border-white/10 hover:border-primary/40 hover:bg-primary/10 text-white font-black py-5 rounded-3xl transition-apple shadow-2xl active:scale-95 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="relative z-10 tracking-[0.2em] uppercase text-xs">Initialize Link</span>
          </button>
          
          <div className="mt-8 flex justify-center gap-1.5 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-150"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-300"></div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Neural Core V3.1.0 Stable</p>
      </div>
    </div>
  );
};

export default Intro;
