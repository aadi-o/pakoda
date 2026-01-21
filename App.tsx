import React, { useState, useRef, useEffect } from 'react';
import Cattu from './components/Cattu';
import { sendMessageToGemini, generateSpeech } from './services/geminiService';
import { ChatMessage, Emotion } from './types';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Audio Utilities
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

const TypingIndicator: React.FC<{ emotion: Emotion }> = ({ emotion }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  const getStatusMessages = () => {
    switch (emotion) {
      case Emotion.ANGRY: return ["SYSTEM_OVERHEAT", "FATAL_ERROR", "KHOON_KHAUL_RAHA"];
      case Emotion.SAVAGE: return ["BYPASSING_FILTERS", "AUKAT_REVEAL", "DAMAGING_EGO"];
      case Emotion.CONFIDENT: return ["SYNTHESIZING_LOGIC", "JUDGING_HUMAN", "OPTIMIZING"];
      case Emotion.ANNOYED: return ["SIGH_INITIATED", "LOW_IQ_DETECTED", "WAITING"];
      default: return ["FORMULATING_ROAST", "ANALYZING_BS", "SCANNING"];
    }
  };

  useEffect(() => {
    const messages = getStatusMessages();
    const targetText = messages[Math.floor(Math.random() * messages.length)];
    let currentText = '', index = 0;
    setDisplayedText('');
    const typingInterval = setInterval(() => {
      if (index < targetText.length) {
        currentText += targetText[index++];
        setDisplayedText(currentText);
      } else clearInterval(typingInterval);
    }, 40);
    return () => clearInterval(typingInterval);
  }, [emotion]);

  const getDotStyle = () => {
    switch (emotion) {
      case Emotion.ANGRY: return 'bg-red-500 shadow-[0_0_8px_red]';
      case Emotion.SAVAGE: return 'bg-black dark:bg-white animate-glitch-fast';
      case Emotion.CONFIDENT: return 'bg-black dark:bg-white scale-110';
      case Emotion.ANNOYED: return 'opacity-20 bg-gray-400';
      default: return 'bg-black dark:bg-white opacity-40';
    }
  };

  return (
    <div className="flex flex-col gap-2 animate-slide-up">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-charcoal/60 backdrop-blur-xl ${emotion === Emotion.ANGRY ? 'border-red-500/30' : ''}`}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full animate-pulse ${getDotStyle()}`} style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <div className="flex items-center gap-2 pl-2 font-mono">
        <div className={`w-0.5 h-2.5 ${emotion === Emotion.ANGRY ? 'bg-red-500' : 'bg-black dark:bg-white'} animate-cursor`} />
        <span className={`text-[9px] font-black tracking-widest uppercase ${emotion === Emotion.ANGRY ? 'text-red-400' : 'text-muted/60'}`}>{displayedText}</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.NEUTRAL);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    theme === 'dark' ? html.classList.add('dark') : html.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 15, y: (e.clientY / window.innerHeight - 0.5) * 15 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = (event: any) => {
        setInput(prev => `${prev} ${event.results[0][0].transcript}`.trim());
        setIsListening(false);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const playResponseAudio = async (base64Audio: string, onStart?: () => void) => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      if (onStart) onStart();
      source.start();
      
      return new Promise<void>(resolve => source.addEventListener('ended', () => resolve()));
    } catch (e) { 
      console.error(e); 
      setIsSpeaking(false); 
      if (onStart) onStart();
    }
  };

  const handleSend = async (textOverride?: string) => {
    const finalInput = textOverride || input;
    if (!finalInput.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: finalInput }]);
    setInput('');
    setLoading(true);
    setCurrentEmotion(Emotion.NEUTRAL);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessageToGemini(finalInput, history);
      
      // Update emotion immediately so Cattu transitions while speech is generating
      setCurrentEmotion(response.emotion);

      if (voiceEnabled) {
        // We stay in 'loading' state while speech generates to keep the indicator active
        const audioData = await generateSpeech(response.text, response.emotion);
        setLoading(false); // Only stop loading when we're about to speak or show text
        
        if (audioData) {
          // Play audio and show text simultaneously
          await playResponseAudio(audioData, () => {
            setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion }]);
          });
        } else {
          setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion }]);
        }
      } else {
        setLoading(false);
        setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', text: "Critical error. Your brain logic is leaking into my system.", emotion: Emotion.ANGRY }]);
      setLoading(false);
    }
  };

  const isInitialState = messages.length === 0;

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-white dark:bg-obsidian text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black overflow-hidden relative font-inter">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
      
      {/* SIDEBAR / HEADER */}
      <aside className="relative z-50 flex flex-col border-black/5 dark:border-white/5 bg-gray-50/80 dark:bg-charcoal/80 backdrop-blur-3xl transition-all duration-500 w-full lg:w-[400px] h-auto lg:h-full border-b lg:border-r">
          <div className="p-4 lg:p-10 flex items-center justify-between lg:flex-col lg:items-start lg:gap-12">
              <div className="flex items-center gap-4">
                  <div className="lg:hidden">
                    <Cattu size="sm" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-[14px] font-black tracking-[0.4em] uppercase text-black dark:text-white">Pakoda</h1>
                    <div className="flex items-center gap-2 opacity-40">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentEmotion === Emotion.ANGRY ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-black dark:bg-white animate-pulse'}`} />
                      <span className="text-[9px] font-mono tracking-widest uppercase">System v6.0</span>
                    </div>
                  </div>
              </div>
              
              <div className="flex items-center gap-2 lg:w-full lg:grid lg:grid-cols-2 lg:gap-3">
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 lg:p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 transition-all flex items-center justify-center shadow-lg active:scale-90">
                    {theme === 'dark' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                  </button>
                  <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-3 lg:p-5 rounded-2xl border transition-all flex items-center justify-center shadow-lg active:scale-90 ${voiceEnabled ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'bg-transparent border-black/10 dark:border-white/10 opacity-30'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  </button>
              </div>
          </div>

          {/* DESKTOP MASCOT */}
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative overflow-visible" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
              <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
              <div className="mt-16 text-center">
                  <span className={`text-[12px] font-black tracking-[0.6em] uppercase transition-all duration-700 ${currentEmotion === Emotion.ANGRY ? 'text-red-500 scale-110 drop-shadow-[0_0_15px_red]' : 'text-muted/60'}`}>
                    {loading ? 'Processing...' : isSpeaking ? 'Transmitting...' : 'Kernel Idle'}
                  </span>
                  <div className="flex justify-center gap-1.5 mt-4 opacity-30">
                    {[...Array(5)].map((_, i) => <div key={i} className={`w-0.5 h-4 bg-black dark:bg-white rounded-full ${isSpeaking ? 'animate-pulse' : ''}`} style={{ animationDelay: `${i * 0.1}s`, height: `${10 + Math.random() * 10}px` }} />)}
                  </div>
              </div>
          </div>

          {/* SYSTEM STATS */}
          <div className="hidden lg:flex p-10 flex-col gap-6 bg-black/[0.03] dark:bg-white/[0.01]">
              <div className="flex justify-between items-center group">
                  <button onClick={() => { setMessages([]); setCurrentEmotion(Emotion.NEUTRAL); }} className="text-[11px] font-black uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-150 transition-transform" /> Purge Neural Memory
                  </button>
              </div>
          </div>
      </aside>

      {/* CHAT THREAD */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-obsidian transition-colors duration-700 relative">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 lg:px-24 xl:px-44 pt-24 lg:pt-36 pb-48 space-y-10 lg:space-y-20 scroll-smooth">
              {isInitialState && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-slide-up pointer-events-none lg:pointer-events-auto">
                      <div className="max-w-5xl">
                          <h2 className="text-5xl lg:text-[9rem] font-black tracking-tighter leading-[0.8] mb-12 dark:text-white text-black drop-shadow-2xl">
                             BRUTAL <br/><span className="text-transparent bg-clip-text bg-gradient-to-b from-black dark:from-white via-black/30 dark:via-white/20 to-transparent">HONESTY.</span>
                          </h2>
                          <div className="hidden lg:flex flex-wrap justify-center gap-5 mt-16 pointer-events-auto">
                              {[
                                { label: "Hinglish Roast", prompt: "Mera career Hinglish mein roast kar." },
                                { label: "Honest Feedback", prompt: "Give me an honest, savage opinion on my existence." },
                                { label: "Logic Check", prompt: "Try to find logic in my life choices (spoiler: you won't)." }
                              ].map((b, i) => (
                                <button key={i} onClick={() => handleSend(b.prompt)} className="px-10 py-5 rounded-full border border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-charcoal/40 text-[11px] font-black uppercase tracking-[0.3em] hover:scale-110 transition-all opacity-40 hover:opacity-100 hover:border-black/20 shadow-2xl">
                                  {b.label}
                                </button>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                      <div className={`max-w-[95%] lg:max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-3 mb-3 text-[9px] font-black uppercase opacity-20 tracking-widest ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                             <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                             <span>{msg.role === 'user' ? 'USER_INPUT' : 'PAKODA_SYNTH'}</span>
                          </div>
                          <div className={`text-2xl lg:text-5xl font-bold leading-tight tracking-tight ${msg.role === 'user' ? 'text-muted italic opacity-70' : 'text-black dark:text-white drop-shadow-lg'}`}>
                              {msg.text}
                          </div>
                      </div>
                  </div>
              ))}
              {loading && <div className="flex justify-start pt-10"><TypingIndicator emotion={currentEmotion} /></div>}
          </div>

          {/* INPUT AREA */}
          <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-14 bg-gradient-to-t from-white dark:from-obsidian via-white/95 dark:via-obsidian/95 to-transparent z-40">
              <div className="max-w-5xl mx-auto">
                  <div className="relative bg-gray-50/90 dark:bg-charcoal/90 border border-black/10 dark:border-white/10 backdrop-blur-3xl rounded-[2.5rem] lg:rounded-[4rem] p-2.5 lg:p-5 flex items-center gap-4 lg:gap-8 shadow-2xl transition-all focus-within:scale-[1.02] focus-within:border-black/30 dark:focus-within:border-white/30">
                      <button onClick={() => { recognitionRef.current?.start(); setIsListening(true); }} className={`p-5 lg:p-8 rounded-[2rem] lg:rounded-[3rem] transition-all flex-shrink-0 ${isListening ? 'bg-black dark:bg-white text-white dark:text-black animate-pulse' : 'hover:bg-black/5 dark:hover:bg-white/5 text-muted/50'}`}>
                          <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </button>
                      
                      <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder={isListening ? "Listening to your nonsense..." : "Input thought stream..."} className="flex-1 bg-transparent border-none outline-none text-xl lg:text-3xl font-bold text-black dark:text-white placeholder:text-muted/10 py-4 resize-none scrollbar-hide" />
                      
                      <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="p-5 lg:p-8 bg-black dark:bg-white text-white dark:text-black rounded-[2rem] lg:rounded-[3rem] transition-all disabled:opacity-5 shadow-2xl active:scale-90">
                          <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                  </div>
              </div>
          </div>
      </main>
    </div>
  );
};

export default App;