
// Implemented the missing submitName function and updated AudioContext initialization for better compatibility and compliance with Gemini API examples.
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

// Decoding PCM audio data manually as per Gemini API guidelines.
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
      case Emotion.ANGRY: return ["CHAI_THANDA_HO_RAHA", "USER_KA_KACHRA_DECODING", "CALCULATING_MAX_INSULT"];
      case Emotion.SAVAGE: return ["AUKAT_RECHECK_KAR_RAHA", "SKEWERING_SELF_ESTEEM", "DELETING_YOUR_EGO"];
      case Emotion.ANNOYED: return ["SIGHING_IN_REAL_TIME", "LOOKING_FOR_LOGIC_404", "WRESTLING_WITH_YOUR_IQ"];
      default: return ["SCANNING_VICTIM", "COLLECTING_BS", "READYING_BURN"];
    }
  };

  useEffect(() => {
    const messages = getStatusMessages();
    const targetText = messages[Math.floor(Math.random() * messages.length)];
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index <= targetText.length) {
        setDisplayedText(targetText.slice(0, index++));
      } else clearInterval(typingInterval);
    }, 40);
    return () => clearInterval(typingInterval);
  }, [emotion]);

  return (
    <div className="flex items-center gap-4 px-8 py-4 rounded-full border border-black/5 dark:border-white/5 bg-gray-50 dark:bg-zinc-900/50 animate-slide-up">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <span className="text-[10px] font-black tracking-widest uppercase font-mono opacity-60">{displayedText}</span>
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Fix: Implemented the missing submitName function for handling onboarding.
  const submitName = async () => {
    if (!tempName.trim()) return;
    setIsValidating(true);
    // Mimic processing delay for immersion
    await new Promise(r => setTimeout(r, 1000));
    setUserName(tempName.trim());
    localStorage.setItem('pakoda_user_name', tempName.trim());
    setIsValidating(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const currentInput = input;
    setMessages(prev => [...prev, { role: 'user', text: currentInput }]);
    setInput('');
    setLoading(true);
    setCurrentEmotion(Emotion.ANNOYED);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessageToGemini(currentInput, history);
      
      setCurrentEmotion(response.emotion);

      if (voiceEnabled) {
        const audioData = await generateSpeech(response.text, response.emotion);
        if (audioData) {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          }
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
      setCurrentEmotion(Emotion.ANGRY);
    }
  };

  if (!userName) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-obsidian text-white p-6">
        <Cattu size="lg" emotion={isValidating ? Emotion.ANNOYED : Emotion.NEUTRAL} isTalking={false} isLoading={isValidating} />
        <div className="w-full max-w-xs space-y-6 mt-12 text-center relative z-10">
          <input 
            type="text" 
            value={tempName} 
            onChange={e => setTempName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitName()}
            placeholder="Kiske peeche pade ho?" 
            className="w-full bg-transparent border-b-2 border-white/20 p-4 text-xl font-bold text-center outline-none focus:border-white transition-all uppercase placeholder:opacity-20"
          />
          <button 
            onClick={submitName} 
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest active:scale-95 transition-all"
          >
            PEHCHAN KAUN?
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-obsidian text-black dark:text-white transition-colors duration-500 font-sans">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-80 xl:w-96 flex-col border-r border-black/5 dark:border-white/5 bg-gray-50 dark:bg-zinc-950/50 p-10 z-30">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">PAKODA</h1>
          <div className="flex items-center gap-2 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase">Waiting for logic</span>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center my-12">
          <Cattu size="md" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-4 rounded-2xl border border-black/5 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 transition-all flex-1">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-4 rounded-2xl border transition-all flex-1 ${voiceEnabled ? 'bg-black dark:bg-white text-white dark:text-black border-transparent' : 'border-black/5 dark:border-white/5 opacity-40'}`}>
              Voice {voiceEnabled ? 'On' : 'Off'}
            </button>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 rounded-2xl border border-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/5 transition-all">
            Get Lost
          </button>
        </div>
      </aside>

      {/* CHAT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 lg:px-16 xl:px-32 pt-16 pb-44 space-y-12 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 select-none text-center">
              <div className="lg:hidden mb-12"><Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} /></div>
              <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none mb-6 italic">KYA CHAHIYE?</h2>
              <p className="text-xs font-mono tracking-[0.4em] uppercase">Don't waste my chai break.</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[85%] lg:max-w-[70%] ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className="text-[9px] font-mono font-bold opacity-20 tracking-widest mb-2 uppercase">
                  {m.role === 'user' ? userName : 'PAKODA'}
                </div>
                <div className={`text-xl lg:text-3xl font-bold leading-relaxed ${m.role === 'user' ? 'opacity-40 italic' : 'text-black dark:text-white'}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {loading && <TypingIndicator emotion={currentEmotion} />}
        </div>

        {/* INPUT */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-12 bg-gradient-to-t from-white dark:from-obsidian via-white/90 dark:via-obsidian/90 to-transparent">
          <div className="max-w-4xl mx-auto flex items-center gap-4 bg-gray-50/80 dark:bg-zinc-900/80 border border-black/5 dark:border-white/5 backdrop-blur-2xl rounded-[2.5rem] p-3 pl-8 shadow-2xl focus-within:border-black/20 dark:focus-within:border-white/20 transition-all group">
            <textarea 
              rows={1} 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
              placeholder="Bakwaas shuru karo..." 
              className="flex-1 bg-transparent border-none outline-none text-lg lg:text-2xl font-bold py-4 resize-none placeholder:opacity-20 scrollbar-hide"
            />
            <button 
              onClick={handleSend} 
              disabled={loading || !input.trim()} 
              className="p-5 lg:p-6 bg-black dark:bg-white text-white dark:text-black rounded-full transition-all disabled:opacity-5 active:scale-90 hover:scale-105 shadow-xl"
            >
              <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
