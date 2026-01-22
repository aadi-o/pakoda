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
      case Emotion.ANGRY: return ["SYSTEM_OVERHEAT", "FATAL_ERROR", "REBOOTING_LOGIC", "KHOON_KHAUL_RAHA"];
      case Emotion.SAVAGE: return ["BYPASSING_FILTERS", "AUKAT_REVEAL", "DAMAGING_EGO", "CALCULATING_ROAST"];
      case Emotion.CONFIDENT: return ["SYNTHESIZING_LOGIC", "JUDGING_HUMAN", "OPTIMIZING_SUPERIORITY"];
      case Emotion.ANNOYED: return ["SIGH_INITIATED", "LOW_IQ_DETECTED", "WAITING_ON_DHAKKAN"];
      default: return ["FORMULATING_ROAST", "ANALYZING_BS", "SCANNING_INTELLECT"];
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
    }, 30);
    return () => clearInterval(typingInterval);
  }, [emotion]);

  const getIndicatorStyles = () => {
    switch (emotion) {
      case Emotion.ANGRY: 
        return {
          container: 'bg-red-500/20 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] animate-jitter',
          dots: 'bg-red-500',
          dotSpeed: '0.1s',
          text: 'text-red-500'
        };
      case Emotion.SAVAGE: 
        return {
          container: 'bg-black/90 dark:bg-white/10 border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-glitch-flicker',
          dots: 'bg-cyan-400',
          dotSpeed: '0.3s',
          text: 'text-white dark:text-cyan-400 font-bold'
        };
      case Emotion.CONFIDENT: 
        return {
          container: 'bg-yellow-500/10 border-yellow-500/40 animate-superior-pulse',
          dots: 'bg-yellow-500',
          dotSpeed: '0.8s',
          text: 'text-yellow-600 dark:text-yellow-400'
        };
      case Emotion.ANNOYED:
        return {
          container: 'bg-gray-100 dark:bg-charcoal border-white/10 opacity-60 scale-95',
          dots: 'bg-gray-400',
          dotSpeed: '1.2s',
          text: 'text-muted'
        };
      default: 
        return {
          container: 'bg-gray-100 dark:bg-charcoal border-black/10 dark:border-white/10',
          dots: 'bg-current',
          dotSpeed: '0.4s',
          text: 'opacity-80'
        };
    }
  };

  const styles = getIndicatorStyles();

  return (
    <div className="flex flex-col gap-2 animate-slide-up pb-8 pl-4">
      <div className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] border-2 backdrop-blur-3xl transition-all duration-300 relative overflow-hidden ${styles.container}`}>
        <div className="scanline"></div>
        <div className="flex gap-2 relative z-20">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className={`w-2 h-2 rounded-full animate-bounce ${styles.dots}`} 
              style={{ animationDelay: `${i * 0.1}s`, animationDuration: styles.dotSpeed }} 
            />
          ))}
        </div>
        <div className="flex items-center gap-3 font-mono relative z-20">
          <span className={`text-[11px] font-black tracking-widest uppercase ${styles.text}`}>
            {displayedText}
          </span>
          <span className="w-1.5 h-3 bg-current animate-pulse"></span>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('pakoda_user_name'));
  const [tempName, setTempName] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.NEUTRAL);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isFocused, setIsFocused] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    theme === 'dark' ? html.classList.add('dark') : html.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isSpeaking]);

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

  const playResponseAudio = async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      setIsSpeaking(true);
      source.onended = () => setIsSpeaking(false);
      source.start();
      
      return new Promise<void>(resolve => source.addEventListener('ended', () => resolve()));
    } catch (e) { 
      console.error(e); 
      setIsSpeaking(false); 
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
      const contextMessage = userName ? `[System Context: User name is ${userName}. Use it to roast them.] ` : '';
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessageToGemini(contextMessage + finalInput, history);
      
      setCurrentEmotion(response.emotion);

      let audioData: string | undefined;
      if (voiceEnabled) {
        audioData = await generateSpeech(response.text, response.emotion);
      }

      setLoading(false);
      setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion }]);

      if (audioData) {
        playResponseAudio(audioData);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setMessages(prev => [...prev, { role: 'model', text: "Critical error. Your brain logic is leaking into my system.", emotion: Emotion.ANGRY }]);
      setCurrentEmotion(Emotion.ANGRY);
    }
  };

  const submitName = async () => {
    if (!tempName.trim()) return;
    const name = tempName.trim();
    setUserName(name);
    localStorage.setItem('pakoda_user_name', name);
    
    setLoading(true);
    try {
      const response = await sendMessageToGemini(`[NEUTRAL] My name is ${name}. Roast my name and welcome me in your style.`, []);
      setCurrentEmotion(response.emotion);
      
      let audioData: string | undefined;
      if (voiceEnabled) {
        audioData = await generateSpeech(response.text, response.emotion);
      }

      setLoading(false);
      setMessages([{ role: 'model', text: response.text, emotion: response.emotion }]);
      
      if (audioData) {
        playResponseAudio(audioData);
      }
    } catch (e) {
      setLoading(false);
      setMessages([{ role: 'model', text: `${name}? Generic AF.`, emotion: Emotion.SAVAGE }]);
      setCurrentEmotion(Emotion.SAVAGE);
    }
  };

  const purgeMemory = () => {
    setMessages([]);
    setUserName(null);
    localStorage.removeItem('pakoda_user_name');
    setCurrentEmotion(Emotion.NEUTRAL);
  };

  const isInitialState = messages.length === 0;

  if (!userName) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-white dark:bg-obsidian text-black dark:text-white p-4 sm:p-6 relative font-inter overflow-hidden transition-all duration-1000">
        <div className="absolute inset-0 bg-grid opacity-[0.05] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-white/5 pointer-events-none"></div>
        
        {/* Floating background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-black/[0.02] dark:bg-white/[0.01] blur-[120px] rounded-full animate-liquid pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-black/[0.02] dark:bg-white/[0.01] blur-[120px] rounded-full animate-liquid pointer-events-none" style={{ animationDelay: '-4s' }}></div>

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-12 sm:gap-16">
           
           {/* Cattu Presentation */}
           <div className="relative flex flex-col items-center">
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-12 bg-black/10 dark:bg-white/5 blur-2xl rounded-full scale-150"></div>
              <Cattu 
                size="lg" 
                emotion={tempName.length > 8 ? Emotion.ANNOYED : tempName.length > 0 ? Emotion.CONFIDENT : Emotion.NEUTRAL} 
                isTalking={false} 
                isLoading={false} 
              />
              <div className="mt-8 flex items-center gap-4 opacity-20">
                <span className="w-12 h-[1px] bg-current"></span>
                <span className="text-[10px] font-black tracking-[0.5em] uppercase font-mono">Archive v6.4.1</span>
                <span className="w-12 h-[1px] bg-current"></span>
              </div>
           </div>

           <div className="w-full flex flex-col gap-10">
              <div className="space-y-3 text-center">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none">NEURAL <span className="opacity-30">ARCHIVE</span></h1>
                <p className="text-[10px] sm:text-[12px] font-black tracking-[0.3em] uppercase opacity-40 font-mono">Scanning for biological identity...</p>
              </div>

              <div className="relative group/input">
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-black/5 dark:via-white/10 to-transparent opacity-0 group-focus-within/input:opacity-100 transition-opacity blur-xl rounded-full"></div>
                
                <div className="relative flex flex-col gap-4">
                  <input 
                    type="text" 
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitName()}
                    placeholder="ENTER NAME..." 
                    autoFocus
                    className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/5 p-4 sm:p-6 text-2xl sm:text-3xl font-black text-center outline-none focus:border-black dark:focus:border-white transition-all uppercase tracking-widest placeholder:opacity-5"
                  />
                  
                  {/* Logic Integrity Meter */}
                  <div className="w-full h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-current transition-all duration-1000 ease-out animate-pulse" 
                      style={{ width: tempName.length > 0 ? '1%' : '0%', opacity: 0.3 }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-[9px] font-black tracking-widest opacity-20 font-mono">
                    <span>LOGIC_INTEGRITY</span>
                    <span>{tempName.length > 0 ? '0.01%' : '0.00%'}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={submitName}
                disabled={!tempName.trim()}
                className={`group relative w-full py-6 sm:py-8 rounded-2xl sm:rounded-3xl font-black uppercase tracking-[0.5em] transition-all duration-500 overflow-hidden
                  ${tempName.trim() ? 'bg-black dark:bg-white text-white dark:text-black shadow-2xl scale-100' : 'bg-transparent border border-black/10 dark:border-white/10 text-muted opacity-30 scale-95 pointer-events-none'}
                `}
              >
                <div className="absolute inset-0 bg-white dark:bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none opacity-10"></div>
                <span className="relative z-10 text-[11px] sm:text-[13px]">VALIDATE EXISTENCE</span>
              </button>
           </div>

           <div className="flex justify-center gap-12 font-mono text-[8px] sm:text-[9px] font-black opacity-[0.05] uppercase tracking-[0.2em] w-full">
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                 SECURE_LINK
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                 ENCRYPTED_JUDGEMENT
              </div>
           </div>
        </div>
      </div>
    );
  }

  const getEmotionalHighlight = () => {
    if (!isFocused && !input) return "border-black/10 dark:border-white/10";
    switch (currentEmotion) {
        case Emotion.ANGRY: return "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]";
        case Emotion.SAVAGE: return "border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]";
        case Emotion.CONFIDENT: return "border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.2)]";
        default: return "border-black dark:border-white shadow-xl";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-white dark:bg-obsidian text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black overflow-hidden relative font-inter">
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
      
      {/* HEADER / SIDEBAR (STICKY ON MOBILE) */}
      <aside className="sticky top-0 lg:relative z-[60] flex flex-col border-black/5 dark:border-white/5 bg-gray-50/90 dark:bg-charcoal/90 backdrop-blur-3xl transition-all duration-500 w-full lg:w-[320px] xl:w-[420px] h-auto lg:h-full border-b lg:border-r">
          <div className="p-4 sm:p-5 lg:p-10 flex items-center justify-between lg:flex-col lg:items-start lg:gap-10">
              <div className="flex items-center gap-4 lg:gap-6">
                  <div className="lg:hidden scale-125 origin-left transition-transform">
                    <Cattu size="sm" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-[16px] sm:text-[20px] font-black tracking-[0.4em] uppercase text-black dark:text-white">Pakoda</h1>
                    <div className="flex items-center gap-2 opacity-50">
                      <div className={`w-1.5 h-1.5 rounded-full ${currentEmotion === Emotion.ANGRY ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-black dark:bg-white animate-pulse'}`} />
                      <span className="text-[10px] sm:text-[12px] font-mono tracking-widest uppercase">Kernel v6.4</span>
                    </div>
                  </div>
              </div>
              
              <div className="flex items-center gap-2 lg:w-full lg:grid lg:grid-cols-2 lg:gap-3">
                  <button onClick={purgeMemory} className="lg:hidden p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 active:scale-90 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3.5 sm:p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 transition-all flex items-center justify-center shadow-lg active:scale-90">
                    {theme === 'dark' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                  </button>
                  <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-center shadow-lg active:scale-90 ${voiceEnabled ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'bg-transparent border-black/10 dark:border-white/10 opacity-30'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                  </button>
              </div>
          </div>

          <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 relative overflow-visible" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
              <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
              <div className="mt-12 text-center select-none">
                  <span className={`text-[11px] font-black tracking-[0.6em] uppercase transition-all duration-700 ${currentEmotion === Emotion.ANGRY ? 'text-red-500 scale-110 drop-shadow-[0_0_15px_red]' : 'text-muted/60'}`}>
                    {loading ? 'Processing...' : isSpeaking ? 'Transmitting...' : 'Kernel Idle'}
                  </span>
                  <div className="flex justify-center gap-1.5 mt-4 opacity-40">
                    {[...Array(5)].map((_, i) => <div key={i} className={`w-0.5 h-5 bg-black dark:bg-white rounded-full ${isSpeaking ? 'animate-pulse' : ''}`} style={{ animationDelay: `${i * 0.1}s`, height: `${10 + Math.random() * 10}px` }} />)}
                  </div>
              </div>
          </div>

          <div className="hidden lg:flex p-10 flex-col gap-6 bg-black/[0.03] dark:bg-white/[0.01]">
              <div className="flex justify-between items-center group">
                  <button onClick={purgeMemory} className="text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-all flex items-center gap-3 active:scale-95">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover:scale-150 transition-transform" /> Purge Neural Memory
                  </button>
              </div>
          </div>
      </aside>

      {/* CHAT THREAD */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-obsidian transition-colors duration-700 relative z-10 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-10 lg:px-24 xl:px-40 pt-6 sm:pt-10 lg:pt-32 pb-48 space-y-6 sm:space-y-12 lg:space-y-14 scroll-smooth scrollbar-hide">
              {isInitialState && (
                  <div className="min-h-full flex flex-col items-center justify-center p-6 text-center animate-slide-up pointer-events-none lg:pointer-events-auto transition-opacity duration-300">
                      <div className="lg:hidden mb-12 animate-sway-neutral">
                        <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
                      </div>
                      <div className="max-w-4xl">
                          <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.8] mb-8 lg:mb-12 dark:text-white text-black drop-shadow-2xl">
                             PURE <br/><span className="text-transparent bg-clip-text bg-gradient-to-b from-black dark:from-white via-black/30 dark:via-white/20 to-transparent">AUDACITY.</span>
                          </h2>
                          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8 sm:mt-12 pointer-events-auto">
                              {[
                                { label: "Roast Career", prompt: "Mera career roast kar." },
                                { label: "Opinion", prompt: "Give me an honest, savage opinion on my personality." },
                                { label: "Logic", prompt: "Meri life choices mein logic dhoond ke dikha." }
                              ].map((b, i) => (
                                <button key={i} onClick={() => handleSend(b.prompt)} className="px-6 py-4 sm:px-10 sm:py-5 rounded-full border-2 border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-charcoal/40 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] hover:scale-110 transition-all opacity-70 hover:opacity-100 hover:border-black/20 shadow-2xl active:scale-95">
                                  {b.label}
                                </button>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                      <div className={`max-w-[94%] sm:max-w-[85%] lg:max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-2 mb-2 text-[9px] sm:text-[11px] font-black uppercase opacity-30 tracking-widest ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                             <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
                             <span>{msg.role === 'user' ? 'U_INPUT' : 'P_SYNTH'}</span>
                          </div>
                          <div className={`text-lg sm:text-2xl lg:text-3xl font-bold leading-tight tracking-tight ${msg.role === 'user' ? 'text-muted italic opacity-60' : 'text-black dark:text-white drop-shadow-xl'}`}>
                              {msg.text}
                          </div>
                      </div>
                  </div>
              ))}
              {loading && <div className="flex justify-start pt-6"><TypingIndicator emotion={currentEmotion} /></div>}
          </div>

          {/* INPUT BAR (FIXED BOTTOM FOR KEYBOARD COMPATIBILITY) */}
          <div className="fixed lg:absolute bottom-0 left-0 right-0 p-3 sm:p-6 lg:p-10 bg-gradient-to-t from-white dark:from-obsidian via-white/95 dark:via-obsidian/95 to-transparent z-[70] pb-safe">
              <div className="max-w-4xl mx-auto">
                  <div className={`relative bg-white/95 dark:bg-charcoal/95 border-[3px] backdrop-blur-3xl rounded-[2.2rem] sm:rounded-[4rem] p-1.5 sm:p-3 flex items-center gap-2 sm:gap-6 transition-all duration-300 ${getEmotionalHighlight()}`}>
                      <button onClick={() => { recognitionRef.current?.start(); setIsListening(true); }} className={`p-4 sm:p-6 rounded-[1.6rem] sm:rounded-[3rem] transition-all flex-shrink-0 ${isListening ? 'bg-black dark:bg-white text-white dark:text-black animate-pulse' : 'hover:bg-black/5 dark:hover:bg-white/5 text-muted/50'} active:scale-90`}>
                          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </button>
                      
                      <textarea 
                        rows={1} 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                        placeholder={isListening ? "Listening..." : "Roast Pakoda..."} 
                        className="flex-1 bg-transparent border-none outline-none text-lg sm:text-2xl font-bold text-black dark:text-white placeholder:text-muted/20 py-4 sm:py-5 resize-none scrollbar-hide" 
                      />
                      
                      <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="p-4 sm:p-6 bg-black dark:bg-white text-white dark:text-black rounded-[1.6rem] sm:rounded-[3rem] transition-all disabled:opacity-10 shadow-2xl active:scale-90 flex-shrink-0">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                  </div>
              </div>
          </div>
      </main>
    </div>
  );
};

export default App;