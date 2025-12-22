
import React, { useState, useEffect, useRef } from 'react';
import { queryAssistant, generateSpeech, decodeAudioData, decodeBase64 } from '../services/geminiService';
import { QuizState } from '../types';

const QuizMaster: React.FC = () => {
  const [gameState, setGameState] = useState<QuizState>({
    score: 0,
    lives: 5,
    currentQuestion: 0,
    totalQuestions: 10,
    isFinished: false
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; success: boolean } | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const startQuiz = () => {
    setGameState({
      score: 0,
      lives: 5,
      currentQuestion: 1,
      totalQuestions: 10,
      isFinished: false
    });
    setIsPlaying(true);
    fetchQuestion(1);
  };

  const fetchQuestion = async (num: number) => {
    setLoading(true);
    setFeedback(null);
    setUserAnswer(null);
    try {
      const response = await queryAssistant(
        `Generate one medium-difficulty multiple choice question about anime, manga, or future tech for an automated quiz. Question number ${num}. Provide exactly one question, 4 options, and state which one is correct. Format your response exactly as: Question: [text] | A: [text] | B: [text] | C: [text] | D: [text] | Correct: [letter]`,
        []
      );

      const text = response.text || "";
      const qMatch = text.match(/Question: (.*?) \|/);
      const aMatch = text.match(/A: (.*?) \|/);
      const bMatch = text.match(/B: (.*?) \|/);
      const cMatch = text.match(/C: (.*?) \|/);
      const dMatch = text.match(/D: (.*?) \|/);
      const correctMatch = text.match(/Correct: ([A-D])/);

      if (qMatch && aMatch && bMatch && cMatch && dMatch && correctMatch) {
        setQuestion(qMatch[1]);
        setOptions([aMatch[1], bMatch[1], cMatch[1], dMatch[1]]);
        setCorrectAnswer(correctMatch[1]);
        
        // Host speaks the question
        playSpeech(qMatch[1]);
      } else {
        throw new Error("Neural formatting error. Re-syncing...");
      }
    } catch (error) {
      console.error(error);
      setFeedback({ text: "Link lost. Retrying manifestation...", success: false });
      setTimeout(() => fetchQuestion(num), 2000);
    } finally {
      setLoading(false);
    }
  };

  const playSpeech = async (text: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const base64Audio = await generateSpeech(text, 'Kore');
      const buffer = await decodeAudioData(decodeBase64(base64Audio), audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (e) {
      console.error("Speech failure", e);
    }
  };

  const handleAnswer = (letter: string) => {
    if (userAnswer || loading) return;
    setUserAnswer(letter);
    
    const isCorrect = letter === correctAnswer;
    if (isCorrect) {
      setGameState(prev => ({ ...prev, score: prev.score + 100 }));
      setFeedback({ text: "SYNC PERFECT! +100 PTS", success: true });
      playSpeech("That's synaptic! Protocol perfect!");
    } else {
      setGameState(prev => ({ ...prev, lives: prev.lives - 1 }));
      setFeedback({ text: `LINK FAILED. Answer was ${correctAnswer}`, success: false });
      playSpeech("Buffer-error! That's incorrect.");
    }

    setTimeout(() => {
      if (gameState.lives <= (isCorrect ? 0 : 1)) {
        setGameState(prev => ({ ...prev, isFinished: true }));
        setIsPlaying(false);
      } else if (gameState.currentQuestion >= gameState.totalQuestions) {
        setGameState(prev => ({ ...prev, isFinished: true }));
        setIsPlaying(false);
      } else {
        const nextQ = gameState.currentQuestion + 1;
        setGameState(prev => ({ ...prev, currentQuestion: nextQ }));
        fetchQuestion(nextQ);
      }
    }, 2500);
  };

  return (
    <div className="p-4 md:p-10 lg:p-14 max-w-4xl mx-auto w-full h-full flex flex-col items-center pb-32">
      <div className="mb-12 text-center animate-in slide-in-from-top-4 duration-500">
        <h2 className="text-5xl lg:text-7xl font-black italic tracking-tighter mb-4">Quiz Master</h2>
        <p className="text-muted text-lg font-medium opacity-70">Overclock your intellect against the AI oracle.</p>
      </div>

      {!isPlaying ? (
        <div className="glass rounded-[3rem] p-12 text-center max-w-md w-full border border-white/10 shadow-3xl animate-in zoom-in-95 duration-700">
          <div className="w-24 h-24 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-primary/40 shadow-2xl">
             <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          {gameState.isFinished ? (
            <div className="mb-10">
               <h3 className="text-3xl font-black mb-2 italic">Session Complete</h3>
               <p className="text-muted font-bold text-sm mb-6 uppercase tracking-widest">Final Neural Sync: {gameState.score}</p>
               <div className="p-5 bg-white/5 rounded-2xl border border-white/5 font-black text-2xl text-primary">
                  {gameState.score >= 800 ? 'S-RANK' : gameState.score >= 500 ? 'A-RANK' : 'RETRY PROTOCOL'}
               </div>
            </div>
          ) : (
            <p className="text-muted font-bold text-sm mb-10 leading-relaxed uppercase tracking-widest">5 Lives. 10 Questions. Unlimited Potential.</p>
          )}
          <button 
            onClick={startQuiz}
            className="w-full py-5 gradient-bg text-white font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-sm tracking-widest uppercase border border-white/10"
          >
            {gameState.isFinished ? 'Restart Resonance' : 'Initiate Challenge'}
          </button>
        </div>
      ) : (
        <div className="w-full space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center px-4">
             <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${i < gameState.lives ? 'bg-red-500 shadow-lg shadow-red-500/20 text-white' : 'bg-white/5 text-muted/20 grayscale'}`}>
                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                  </div>
                ))}
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">NEURAL SCORE</p>
                <p className="text-3xl font-black italic text-primary">{gameState.score}</p>
             </div>
          </div>

          <div className="glass rounded-[3rem] p-10 lg:p-14 border border-white/10 shadow-3xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-primary/40"></div>
             {loading ? (
                <div className="py-24 flex flex-col items-center gap-6">
                   <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                   <p className="text-primary font-black uppercase tracking-widest text-xs animate-pulse">Scanning Data Matrix...</p>
                </div>
             ) : (
               <div className="space-y-10">
                 <div className="space-y-4">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Protocol {gameState.currentQuestion} / {gameState.totalQuestions}</span>
                    <h3 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight">{question}</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {options.map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      return (
                        <button
                          key={letter}
                          onClick={() => handleAnswer(letter)}
                          disabled={!!userAnswer}
                          className={`p-6 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden ${
                            userAnswer === letter 
                              ? (letter === correctAnswer ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl' : 'bg-red-500 border-red-500 text-white shadow-xl')
                              : (userAnswer && letter === correctAnswer ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'glass-light border-white/5 hover:border-white/20 hover:bg-white/5')
                          }`}
                        >
                          <span className="text-xs font-black uppercase opacity-40 mb-2 block tracking-widest">{letter}</span>
                          <p className="font-bold text-lg">{opt}</p>
                        </button>
                      );
                    })}
                 </div>

                 {feedback && (
                   <div className={`p-6 rounded-2xl border animate-in slide-in-from-top-4 duration-500 text-center font-black tracking-widest uppercase text-sm ${feedback.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {feedback.text}
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizMaster;
