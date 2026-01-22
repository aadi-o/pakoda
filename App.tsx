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
      case Emotion.ANGRY: return ["SYSTEM_OVERHEAT", "FATAL_ERROR", "REBOOTING_LOGIC"];
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

  const styles = {
    ANGRY: 'bg-red-500/10 border-red-500/30 text-red-500',
    SAVAGE: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    NEUTRAL: 'bg-gray-100 dark:bg-charcoal border-black/5 dark:border-white/5 opacity-50'
  };

  const currentStyle = styles[emotion as keyof typeof styles] || styles.NEUTRAL;

  return (
    <div className="flex flex-col gap-2 animate-slide-up py-4">
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-full border backdrop-blur-3xl transition-all duration-300 ${currentStyle}`}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <span className="text-[10px] font-black tracking-[0.2em] uppercase font-mono">{displayedText}</span>
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
        x: (e.clientX / window.innerWidth - 0.5) * 15, 
        y: (e.clientY / window.innerHeight - 0.5) * 15 
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
      setMessages(prev => [...prev, { role: 'model', text: "System break down. Logic non-existent.", emotion: Emotion.ANGRY }]);
    }
  };

  const submitName = async () => {
    if (!tempName.trim() || isValidating) return;
    setIsValidating(true);
    const steps = ["SCANNING...", "REJECTING...", "WHATEVER..."];
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
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-white dark:bg-obsidian text-black dark:text-white p-6 transition-all duration-1000">
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>
        <div className="w-full max-w-sm flex flex-col items-center gap-10 relative z-10">
           <Cattu size="lg" emotion={isValidating ? Emotion.ANNOYED : Emotion.NEUTRAL} isTalking={false} isLoading={isValidating} />
           <div className="w-full space-y-4 text-center">
              <h1 className="text-3xl font-black tracking-widest uppercase mb-6">IDENTIFY</h1>
              <input 
                  type="text" 
                  value={tempName} 
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitName()}
                  placeholder="NAME..." 
                  className="w-full bg-transparent border-b-2 border-black/10 dark:border-white/10 p-4 text-xl font-black text-center outline-none focus:border-black dark:focus:border-white transition-all uppercase"
              />
              <p className="text-[10px] font-mono tracking-widest opacity-40 h-4">{validationStep}</p>
              <button 
                onClick={submitName}
                disabled={!tempName.trim() || isValidating}
                className="w-full py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest disabled:opacity-20 active:scale-95 transition-all shadow-xl"
              >
                {isValidating ? '...' : 'ACCESS'}
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-white dark:bg-obsidian text-black dark:text-white overflow-hidden transition-colors duration-500">
      
      {/* SIDEBAR (Desktop) / TOPBAR (Mobile) */}
      <aside className="w-full lg:w-[320px] xl:w-[420px] flex flex-col border-b lg:border-r border-black/5 dark:border-white/5 bg-gray-50/50 dark:bg-charcoal/50 backdrop-blur-2xl z-50 shrink-0">
          <div className="p-4 sm:p-6 lg:p-10 flex items-center justify-between lg:flex-col lg:items-start lg:gap-12">
              <div className="flex items-center gap-4 lg:gap-8">
                  <div className="lg:hidden">
                    <Cattu size="sm" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-black tracking-tighter uppercase">PAKODA</h1>
                    <div className="flex items-center gap-1.5 opacity-30 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span className="text-[9px] font-mono uppercase tracking-widest">Core Active</span>
                    </div>
                  </div>
              </div>
              
              <div className="flex lg:flex-col gap-2 w-auto lg:w-full">
                  <div className="flex gap-2">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2.5 sm:p-3 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all">
                      {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-2.5 sm:p-3 rounded-xl border transition-all ${voiceEnabled ? 'bg-black dark:bg-white text-white dark:text-black' : 'opacity-30 border-black/10'}`}>
                      {voiceEnabled ? '🔊' : '🔇'}
                    </button>
                  </div>
                  <button onClick={purgeMemory} className="hidden lg:flex items-center justify-center p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-widest mt-4">
                    Clear Logic
                  </button>
              </div>
          </div>

          {/* Desktop Only Mascot Display */}
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 overflow-visible" style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}>
              <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
          </div>
      </aside>

      {/* CHAT INTERFACE */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none"></div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-12 xl:px-32 pt-10 pb-44 space-y-10 scrollbar-hide">
              {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-10 select-none text-center px-4">
                      <div className="lg:hidden mb-10 transform scale-125">
                         <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
                      </div>
                      <h2 className="text-4xl sm:text-7xl font-black tracking-tighter leading-none mb-4">LOGIC<br/>REQUIRED</h2>
                      <p className="text-[10px] sm:text-xs font-mono tracking-[0.4em] uppercase">Ready to judge you.</p>
                  </div>
              )}

              {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
                      <div className={`max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          <div className={`flex items-center gap-2 mb-1 text-[9px] font-black opacity-20 tracking-widest ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                             <div className="w-1 h-1 rounded-full bg-current" />
                             <span>{msg.role === 'user' ? 'USER_ID' : 'PAKODA_SYNTH'}</span>
                          </div>
                          <div className={`text-lg sm:text-2xl lg:text-3xl font-bold leading-snug break-words ${msg.role === 'user' ? 'opacity-40 italic' : 'text-black dark:text-white'}`}>
                              {msg.text}
                          </div>
                      </div>
                  </div>
              ))}
              {loading && <TypingIndicator emotion={currentEmotion} />}
          </div>

          {/* INPUT AREA */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 lg:p-12 bg-gradient-to-t from-white dark:from-obsidian via-white/90 dark:via-obsidian/90 to-transparent pointer-events-none">
              <div className="max-w-4xl mx-auto pointer-events-auto">
                  <div className={`flex items-center gap-2 sm:gap-4 bg-white/80 dark:bg-charcoal/80 border-2 backdrop-blur-3xl rounded-3xl sm:rounded-[2.5rem] p-2 sm:p-3 shadow-2xl transition-all duration-300 ${input.trim() ? 'border-black dark:border-white' : 'border-black/5 dark:border-white/5'}`}>
                      <button 
                        onClick={() => { recognitionRef.current?.start(); setIsListening(true); }}
                        className={`p-3.5 sm:p-5 rounded-full transition-all flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-muted/40 hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </button>
                      
                      <textarea 
                        rows={1} 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                        placeholder={isListening ? "Listening to your nonsense..." : "Waste my time..."} 
                        className="flex-1 bg-transparent border-none outline-none text-base sm:text-xl lg:text-2xl font-bold text-black dark:text-white placeholder:text-muted/20 py-2 sm:py-4 resize-none scrollbar-hide" 
                      />
                      
                      <button 
                        onClick={() => handleSend()} 
                        disabled={loading || !input.trim()} 
                        className="p-3.5 sm:p-5 bg-black dark:bg-white text-white dark:text-black rounded-full transition-all disabled:opacity-10 active:scale-90 flex-shrink-0 shadow-lg"
                      >
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </button>
                  </div>
              </div>
          </div>
      </main>
    </div>
  );
};

export default App;