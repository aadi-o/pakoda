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
          container: 'bg-red-500/10 border-red-500/30 animate-pulse',
          dots: 'bg-red-500',
          text: 'text-red-500'
        };
      case Emotion.SAVAGE: 
        return {
          container: 'bg-black/90 dark:bg-white/5 border-white/20',
          dots: 'bg-cyan-400',
          text: 'text-cyan-400 font-mono'
        };
      default: 
        return {
          container: 'bg-gray-100 dark:bg-charcoal border-black/5 dark:border-white/5',
          dots: 'bg-current',
          text: 'opacity-50 font-mono'
        };
    }
  };

  const styles = getIndicatorStyles();

  return (
    <div className="flex flex-col gap-2 animate-slide-up py-4">
      <div className={`flex items-center gap-4 px-5 py-3 rounded-full border backdrop-blur-3xl transition-all duration-300 ${styles.container}`}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className={`w-1.5 h-1.5 rounded-full animate-bounce ${styles.dots}`} 
              style={{ animationDelay: `${i * 0.15}s` }} 
            />
          ))}
        </div>
        <span className={`text-[10px] font-black tracking-widest uppercase ${styles.text}`}>
          {displayedText}
        </span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('pakoda_user_name'));
  const [tempName, setTempName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStep, setValidationStep] = useState('');
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, isSpeaking]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ 
        x: (e.clientX / window.innerWidth - 0.5) * 20, 
        y: (e.clientY / window.innerHeight - 0.5) * 20 
      });
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
      setCurrentEmotion(response.emotion);

      if (voiceEnabled) {
        const audioData = await generateSpeech(response.text, response.emotion);
        if (audioData) {
          if (!audioContextRef.current) audioContextRef.current = new AudioContext();
          const buffer = await decodeAudioData(decodeBase64(audioData), audioContextRef.current, 24000, 1);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          setIsSpeaking(true);
          source.onended = () => setIsSpeaking(false);
          source.start();
        }
      }

      setLoading(false);
      setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion }]);
    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'model', text: "Error. My brain logic is leaking.", emotion: Emotion.ANGRY }]);
    }
  };

  const submitName = async () => {
    if (!tempName.trim() || isValidating) return;
    setIsValidating(true);
    const steps = ["SCANNING...", "CALCULATING_AUKAT...", "FOUND_ZERO_LOGIC...", "VALIDATED"];
    for (const step of steps) {
      setValidationStep(step);
      await new Promise(r => setTimeout(r, 600));
    }
    setUserName(tempName.trim());
    localStorage.setItem('pakoda_user_name', tempName.trim());
    setIsValidating(false);
  };

  const purgeMemory = () => {
    setMessages([]);
    setUserName(null);
    localStorage.removeItem('pakoda_user_name');
  };

  if (!userName) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-white dark:bg-obsidian text-black dark:text-white p-6 relative overflow-hidden transition-all duration-1000">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-12">
           <Cattu size="lg" emotion={isValidating ? Emotion.ANGRY : Emotion.NEUTRAL} isTalking={false} isLoading={isValidating} />
           <div className="w-full space-y-6">
              <div className="text-center">
                <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">NEURAL_ID</h1>
                <p className="text-[10px] font-mono tracking-widest opacity-40 uppercase">{isValidating ? validationStep : 'Waiting for identity...'}</p>
              </div>
              <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitName()}
                  placeholder="ENTER NAME..." 
                  className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 p-4 text-2xl font-black text-center outline-none focus:border-black dark:focus:border-white transition-all uppercase"
              />
              <button 
                onClick={submitName}
                disabled={!tempName.trim() || isValidating}
                className="w-full py-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest disabled:opacity-10 active:scale-95 transition-all shadow-xl"
              >
                {isValidating ? 'VALIDATING...' : 'ACCESS ARCHIVE'}
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-white dark:bg-obsidian text-black dark:text-white transition-colors duration-700 overflow-hidden font-inter">
      {/* SIDEBAR / HEADER */}
      <aside className="shrink-0 flex flex-col border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-charcoal/50 backdrop-blur-2xl w-full lg:w-[350px] xl:w-[450px] border-b lg:border-r z-50">
          <div className="p-4 sm:p-6 lg:p-10 flex items-center justify-between lg:flex-col lg:items-start lg:gap-12">
              <div className="flex items-center gap-4 lg:gap-8">
                  <div className="lg:hidden scale-75 origin-left">
                    <Cattu size="sm" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
                  </div>
                  <div>
                    <h1 className="text-[18px] lg:text-[24px] font-black tracking-[0.3em] uppercase">Pakoda</h1>
                    <div className="flex items-center gap-2 opacity-30 mt-1">
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      <span className="text-[9px] lg:text-[11px] font-mono tracking-widest uppercase">System Active</span>
                    </div>
                  </div>
              </div>
              
              <div className="flex gap-2 lg:w-full lg:grid lg:grid-cols-2">
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90">
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                  <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-3 rounded-xl border transition-all active:scale-90 ${voiceEnabled ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'opacity-30 border-black/10'}`}>
                    {voiceEnabled ? '🔊' : '🔇'}
                  </button>
                  <button onClick={purgeMemory} className="hidden lg:flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all col-span-2 text-[11px] font-black uppercase tracking-widest mt-4">
                    Purge Memory
                  </button>
              </div>
          </div>

          <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 relative overflow-visible" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
              <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
          </div>
      </aside>

      {/* CHAT AREA */}
      <main className="flex-1 flex flex-col relative bg-white dark:bg-obsidian">
          <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none"></div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-12 lg:px-24 pt-8 lg:pt-32 pb-40 space-y-12 scrollbar-hide">
              {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none px-4">
                      <div className="lg:hidden mb-12 transform scale-125">
                        <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
                      </div>
                      <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none mb-6">PURE<br/>AUDACITY</h2>
                      <p className="text-[10px] sm:text-[12px] font-mono tracking-[0.4em] uppercase">Kernel Initialized</p>
                  </div>
              )}

              {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                      <div className={`max-w-[92%] sm:max-w-[85%] lg:max-w-[75%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-2 mb-2 text-[9px] font-black opacity-20 tracking-widest ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                             <div className="w-1.5 h-1.5 rounded-full bg-current" />
                             <span>{msg.role === 'user' ? 'USER_ID' : 'PAKODA_SYNTH'}</span>
                          </div>
                          <div className={`text-[17px] sm:text-[24px] lg:text-[28px] font-bold leading-tight ${msg.role === 'user' ? 'text-muted italic' : 'text-black dark:text-white'}`}>
                              {msg.text}
                          </div>
                      </div>
                  </div>
              ))}
              {loading && <TypingIndicator emotion={currentEmotion} />}
          </div>

          {/* FLOATING INPUT BAR */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 lg:p-12 bg-gradient-to-t from-white dark:from-obsidian via-white/80 dark:via-obsidian/80 to-transparent z-[60] pb-safe">
              <div className="max-w-4xl mx-auto relative group">
                  <div className={`flex items-center gap-2 sm:gap-4 bg-white/90 dark:bg-charcoal/90 border-2 backdrop-blur-3xl rounded-[2.5rem] p-2 sm:p-3 transition-all duration-300 shadow-2xl ${input ? 'border-black dark:border-white' : 'border-black/5 dark:border-white/5'}`}>
                      <button 
                        onClick={() => { recognitionRef.current?.start(); setIsListening(true); }}
                        className={`p-4 sm:p-5 rounded-full transition-all flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-muted/30 hover:bg-black/5'}`}
                      >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </button>
                      
                      <textarea 
                        rows={1} 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                        placeholder={isListening ? "Listening..." : "Roast me..."} 
                        className="flex-1 bg-transparent border-none outline-none text-lg sm:text-2xl font-bold text-black dark:text-white placeholder:text-muted/10 py-2 sm:py-4 resize-none scrollbar-hide" 
                      />
                      
                      <button 
                        onClick={() => handleSend()} 
                        disabled={loading || !input.trim()} 
                        className="p-4 sm:p-5 bg-black dark:bg-white text-white dark:text-black rounded-full transition-all disabled:opacity-5 shadow-xl active:scale-90 flex-shrink-0"
                      >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                  </div>
              </div>
          </div>
      </main>
    </div>
  );
};

export default App;