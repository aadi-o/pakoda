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

// Minimal Icons
const ThemeIcon = ({ isDark }: { isDark: boolean }) => (
  <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {isDark ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    )}
  </svg>
);

const VoiceIcon = ({ enabled }: { enabled: boolean }) => (
  <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {enabled ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 9l4 4m0-4l-4 4" />
    )}
  </svg>
);

const TypingIndicator: React.FC<{ emotion: Emotion }> = ({ emotion }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    const messages = {
      [Emotion.ANGRY]: "SYSTEM_CRITICAL_RAGE",
      [Emotion.SAVAGE]: "PREPARING_FATALITY",
      [Emotion.CONFIDENT]: "LOGIC_SUPREMACY",
      [Emotion.ANNOYED]: "SIGH_IN_PROGRESS",
      [Emotion.NEUTRAL]: "PROCESSING_BS"
    };
    const targetText = messages[emotion] || messages[Emotion.NEUTRAL];
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= targetText.length) {
        setDisplayedText(targetText.slice(0, index++));
      } else clearInterval(typingInterval);
    }, 30);
    return () => clearInterval(typingInterval);
  }, [emotion]);

  const variants = {
    [Emotion.ANGRY]: 'text-red-500 animate-shake-hard',
    [Emotion.SAVAGE]: 'text-cyan-400 animate-glitch-savage',
    [Emotion.CONFIDENT]: 'text-yellow-500 animate-glow-pulse-confident',
    [Emotion.ANNOYED]: 'text-zinc-500 animate-fade-annoyed',
    [Emotion.NEUTRAL]: 'text-zinc-600'
  };

  return (
    <div className="flex items-center gap-3 py-4 animate-slide-up">
      <div className={`text-[10px] font-mono font-bold tracking-[0.4em] uppercase ${variants[emotion]}`}>
        {displayedText}
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('pakoda_user_name'));
  const [tempName, setTempName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.NEUTRAL);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = (e: any) => setInput(prev => `${prev} ${e.results[0][0].transcript}`.trim());
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    setCurrentEmotion(Emotion.ANNOYED);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const res = await sendMessageToGemini(msg, history);
      setCurrentEmotion(res.emotion);

      if (voiceEnabled) {
        const audio = await generateSpeech(res.text, res.emotion);
        if (audio) {
          if (!audioContextRef.current) audioContextRef.current = new AudioContext();
          const buffer = await decodeAudioData(decodeBase64(audio), audioContextRef.current, 24000, 1);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          setIsSpeaking(true);
          source.onended = () => setIsSpeaking(false);
          source.start();
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: res.text, emotion: res.emotion }]);
    } catch (e) {
      setCurrentEmotion(Emotion.ANGRY);
    } finally {
      setLoading(false);
    }
  };

  const submitName = async () => {
    if (!tempName.trim()) return;
    setIsValidating(true);
    await new Promise(r => setTimeout(r, 1200));
    setUserName(tempName.trim());
    localStorage.setItem('pakoda_user_name', tempName.trim());
    setIsValidating(false);
  };

  if (!userName) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-obsidian text-white">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <Cattu size="lg" emotion={isValidating ? Emotion.ANNOYED : Emotion.NEUTRAL} isTalking={false} isLoading={isValidating} />
        <div className="mt-12 w-full max-w-xs space-y-6 relative z-10">
          <input 
            type="text" 
            value={tempName} 
            onChange={e => setTempName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitName()}
            placeholder="WHO ARE YOU?" 
            className="w-full bg-transparent border-b border-white/20 p-4 text-xl font-bold text-center outline-none focus:border-white transition-all uppercase placeholder:opacity-20"
          />
          <button onClick={submitName} disabled={isValidating} className="w-full py-4 bg-white text-black font-extrabold uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-20 hover:bg-zinc-200">
            {isValidating ? 'SCANNING...' : 'ACCESS'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-obsidian text-white font-sans overflow-hidden">
      {/* COMMAND SIDEBAR */}
      <aside className="w-full lg:w-72 xl:w-80 flex flex-col border-b lg:border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl z-30">
        <div className="p-6 lg:p-8 flex flex-row lg:flex-col items-center lg:items-start justify-between h-full">
          <div className="space-y-1">
            <h1 className="text-xl font-black tracking-tighter uppercase">PAKODA</h1>
            <div className="flex items-center gap-2 opacity-30">
              <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Session.Active</span>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center w-full my-8">
            <Cattu size="md" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
          </div>

          <div className="flex lg:flex-col gap-3">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="group p-3 rounded-xl border border-white/5 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all">
              <ThemeIcon isDark={theme === 'dark'} />
            </button>
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`group p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 ${voiceEnabled ? 'bg-white text-black border-white' : 'border-white/5 text-white/40 hover:bg-white/5'}`}>
              <VoiceIcon enabled={voiceEnabled} />
            </button>
            <button onClick={() => { localStorage.clear(); location.reload(); }} className="hidden lg:flex p-3 rounded-xl border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 hover:scale-105 active:scale-95 transition-all uppercase text-[10px] font-bold tracking-widest mt-4">
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* CHAT INTERFACE */}
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none" />
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 lg:px-12 xl:px-24 pt-12 pb-40 space-y-12 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 select-none">
              <h2 className="text-6xl lg:text-8xl font-black tracking-tighter leading-none mb-6">INPUT<br/>REQUIRED</h2>
              <p className="text-xs font-mono uppercase tracking-[0.5em]">System standing by for judgement.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[85%] lg:max-w-[70%] ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className="text-[9px] font-mono font-bold opacity-20 tracking-widest mb-2 uppercase">
                  {m.role === 'user' ? userName : 'PAKODA_CORE'}
                </div>
                <div className={`text-lg lg:text-2xl font-semibold leading-relaxed ${m.role === 'user' ? 'text-zinc-500 italic' : 'text-white'}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {loading && <TypingIndicator emotion={currentEmotion} />}
        </div>

        {/* INPUT BAR */}
        <div className="absolute bottom-0 inset-x-0 p-6 lg:p-12 bg-gradient-to-t from-obsidian via-obsidian/90 to-transparent">
          <div className="max-w-4xl mx-auto flex items-center gap-4 bg-zinc-950/80 border border-white/5 backdrop-blur-2xl rounded-3xl p-2 pl-6 shadow-2xl transition-all duration-500 transform focus-within:-translate-y-1 focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10 group">
            <textarea 
              rows={1} 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
              placeholder="Waste my time..." 
              className="flex-1 bg-transparent border-none outline-none text-lg py-4 resize-none placeholder:opacity-20 scrollbar-hide"
            />
            <button 
              onClick={handleSend} 
              disabled={loading || !input.trim()} 
              className="p-4 bg-white text-black rounded-2xl disabled:opacity-10 hover:bg-zinc-100 hover:scale-105 active:scale-90 transition-all shadow-xl group-focus-within:shadow-white/5"
            >
              <svg className="w-6 h-6 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;