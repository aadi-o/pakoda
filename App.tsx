
import React, { useState, useRef, useEffect } from 'react';
import Cattu from './components/Cattu';
import { sendMessageToGemini, generateSpeech } from './services/geminiService';
import { ChatMessage, Emotion } from './types';

const STREET_NEWS = [
  "LOCAL CHOMU SPOTTED TRYING TO LOOK COOL",
  "IQ LEVELS DROPPING FASTER THAN THE RUPEE",
  "FREE WIFI HUNTERS BEWARE: PAKODA IS WATCHING",
  "USER ATTEMPTING TO USE LOGIC... SYSTEM ERROR",
  "AUKAT CHECK IN PROGRESS... PLEASE STAND BY",
  "CHAPRI ALERT: HAIR COLOR TOO BRIGHT FOR THE SERVER",
];

interface BurnMeterProps {
  level: number;
  horizontal?: boolean;
  className?: string;
}

const BurnMeter = ({ level, horizontal, className = '' }: BurnMeterProps) => (
  <div className={`flex ${horizontal ? 'flex-row items-center gap-2' : 'flex-col items-center gap-2'} group ${className}`}>
    <div className={`${horizontal ? 'w-24 h-2' : 'h-32 lg:h-48 w-4'} bg-zinc-900 rounded-full overflow-hidden border border-white/10 relative`}>
      <div 
        className={`absolute bottom-0 ${horizontal ? 'left-0 h-full' : 'w-full'} burn-meter-gradient transition-all duration-1000 ease-out`}
        style={horizontal ? { width: `${level}%` } : { height: `${level}%` }}
      />
      {level > 80 && <div className="absolute inset-0 bg-toxicRed/20 animate-pulse" />}
    </div>
    <span className="text-[8px] lg:text-[10px] font-black tracking-widest uppercase opacity-40 group-hover:opacity-100 transition-opacity whitespace-nowrap">Burn</span>
  </div>
);

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('pakoda_user_name'));
  const [tempName, setTempName] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.NEUTRAL);
  const [chaiLevel, setChaiLevel] = useState(5);
  const [burnLevel, setBurnLevel] = useState(0);
  const [showBegButton, setShowBegButton] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, loading]);

  const submitName = () => {
    if (!tempName.trim()) return;
    setUserName(tempName.trim());
    localStorage.setItem('pakoda_user_name', tempName.trim());
  };

  const begForChai = () => {
    setLoading(true);
    setTimeout(() => {
      setChaiLevel(5);
      setShowBegButton(false);
      setLoading(false);
      setMessages(prev => [...prev, { role: 'model', text: "Theek hai, thoda aur chai pee aur thoda dimaag laga. Zyada udo mat.", emotion: Emotion.ANNOYED }]);
    }, 2000);
  };

  const handleSend = async (manualInput?: string) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim() || loading || chaiLevel <= 0) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);
    setChaiLevel(prev => prev - 1);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessageToGemini(textToSend, history);
      
      setCurrentEmotion(response.emotion);
      
      if (response.emotion === Emotion.SAVAGE) setBurnLevel(prev => Math.min(100, prev + 25));
      if (response.emotion === Emotion.ANGRY) setBurnLevel(prev => Math.min(100, prev + 40));
      if (response.emotion === Emotion.NEUTRAL) setBurnLevel(prev => Math.max(0, prev - 10));

      const audioData = await generateSpeech(response.text, response.emotion);
      if (audioData) {
        if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const binary = atob(audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        setIsSpeaking(true);
        source.onended = () => setIsSpeaking(false);
        source.start();
      }

      setLoading(false);
      setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion }]);
      
      if (chaiLevel - 1 <= 0) setShowBegButton(true);

    } catch (e) {
      setLoading(false);
      setCurrentEmotion(Emotion.ANGRY);
    }
  };

  if (!userName) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-obsidian p-6 street-texture overflow-hidden">
        <div className="absolute top-0 w-full overflow-hidden bg-neonYellow text-black py-2 font-black text-[10px] md:text-xs z-10">
          <div className="animate-marquee whitespace-nowrap">
            {STREET_NEWS.join(" • ")}
          </div>
        </div>
        <Cattu size="md" emotion={Emotion.NEUTRAL} isTalking={false} isLoading={false} />
        <div className="w-full max-w-sm mt-8 space-y-4">
          <input 
            type="text" 
            value={tempName} 
            onChange={e => setTempName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitName()}
            placeholder="KAUN HAI BE TU?" 
            className="w-full bg-zinc-900/50 border-2 border-white/5 p-4 md:p-5 text-lg md:text-xl font-bold text-center outline-none focus:border-neonYellow transition-all uppercase rounded-2xl"
          />
          <button onClick={submitName} className="w-full py-4 md:py-5 bg-neonYellow text-black font-black uppercase tracking-tighter hover:scale-[1.02] active:scale-95 transition-all rounded-2xl">
            ENTRY MAARO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col lg:flex-row bg-obsidian text-white street-texture selection:bg-neonYellow selection:text-black overflow-hidden ${currentEmotion === Emotion.ANGRY ? 'animate-glitch-screen' : ''}`}>
      
      {/* MOBILE HEADER / DESKTOP SIDEBAR STATS */}
      <aside className="w-full lg:w-20 xl:w-32 flex flex-row lg:flex-col items-center justify-between px-4 py-3 lg:py-10 border-b lg:border-b-0 lg:border-r border-white/5 bg-zinc-950/50 z-20">
        <div className="flex flex-row lg:flex-col items-center gap-4 lg:gap-8">
          <div className="hidden lg:block lg:rotate-90 text-[10px] font-black tracking-[0.5em] uppercase opacity-20 whitespace-nowrap lg:mb-8">PAKODA_v2.0</div>
          <div className="lg:hidden text-[10px] font-black tracking-widest uppercase opacity-40">PAKODA</div>
          <BurnMeter level={burnLevel} horizontal={true} className="lg:hidden" />
          <div className="hidden lg:block"><BurnMeter level={burnLevel} /></div>
        </div>
        
        <div className="flex flex-row lg:flex-col gap-2 lg:gap-4 items-center">
          <div className="flex flex-row lg:flex-col gap-1.5 lg:gap-3">
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full border border-white/20 transition-all ${i < chaiLevel ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-transparent'}`} />
            ))}
          </div>
          <span className="text-[8px] lg:text-[10px] font-bold text-center uppercase opacity-30">Chai</span>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col relative h-full min-h-0 overflow-hidden">
        {/* TOP MARQUEE */}
        <div className="w-full overflow-hidden bg-white/5 text-white/40 py-1.5 md:py-2 border-b border-white/5 font-bold text-[8px] md:text-[10px] shrink-0">
          <div className="animate-marquee whitespace-nowrap">
            {STREET_NEWS.join(" • ")}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-20 py-6 md:py-10 space-y-8 md:space-y-10 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <div className="scale-75 md:scale-100">
                <Cattu size="md" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
              </div>
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-black mt-4 md:mt-8 tracking-tighter italic uppercase">Abey bol na!</h1>
              <p className="text-[10px] font-bold tracking-[0.2em] mt-2">WAITING FOR YOUR NONSENSE...</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`max-w-[90%] md:max-w-[70%] lg:max-w-[60%] ${m.role === 'user' ? 'bg-zinc-900/60 p-4 md:p-5 rounded-2xl rounded-tr-none border border-white/5 shadow-xl' : 'p-2'}`}>
                <div className="text-[8px] md:text-[10px] font-black opacity-20 mb-1 uppercase tracking-widest flex items-center gap-2">
                  {m.role === 'user' ? userName : 'PAKODA'}
                  {m.role === 'model' && <span className={`w-1 h-1 rounded-full ${m.emotion === Emotion.ANGRY ? 'bg-toxicRed' : m.emotion === Emotion.SAVAGE ? 'bg-streetCyan' : 'bg-white'}`} />}
                </div>
                <div className={`text-sm md:text-xl lg:text-2xl font-bold leading-tight ${m.role === 'user' ? 'text-white/80' : (m.emotion === Emotion.SAVAGE ? 'text-streetCyan' : m.emotion === Emotion.ANGRY ? 'text-toxicRed' : 'text-white')}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 animate-pulse text-[10px] font-bold uppercase opacity-30 pl-4">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
              <span>JUDGING YOUR AUKAT...</span>
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="p-4 md:p-6 lg:p-10 shrink-0 bg-gradient-to-t from-obsidian via-obsidian/95 to-transparent">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Quick Actions - Scrollable row on mobile */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 mask-fade-edges">
              {["Roast me hard", "Chai pilao", "Rate my logic", "I am a chapri"].map(btn => (
                <button 
                  key={btn}
                  onClick={() => handleSend(btn)}
                  disabled={loading || chaiLevel <= 0}
                  className="px-3 md:px-4 py-2 bg-zinc-900 border border-white/5 rounded-full text-[8px] md:text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-all whitespace-nowrap disabled:opacity-20 shrink-0"
                >
                  {btn}
                </button>
              ))}
            </div>

            <div className="relative">
              {showBegButton ? (
                <button 
                  onClick={begForChai}
                  className="w-full p-5 md:p-6 bg-toxicRed text-black font-black uppercase text-base md:text-xl rounded-2xl animate-shake shadow-2xl active:scale-95 transition-transform"
                >
                  CHAI KHATAM. MAAFI MAANGO! 🙏
                </button>
              ) : (
                <div className="flex items-center bg-zinc-900/90 border-2 border-white/5 rounded-2xl md:rounded-3xl p-1.5 md:p-2 pl-4 md:pl-6 focus-within:border-neonYellow transition-all shadow-2xl">
                  <input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Bakwaas karo..."
                    className="flex-1 bg-transparent border-none outline-none text-base md:text-xl font-bold py-3 md:py-4 placeholder:opacity-20 min-w-0"
                  />
                  <button 
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className="p-3 md:p-5 bg-white text-black rounded-xl md:rounded-2xl hover:scale-105 active:scale-90 transition-all disabled:opacity-10 shrink-0"
                    aria-label="Send"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CHARACTER PANEL (Desktop Only) */}
      <aside className="hidden xl:flex w-80 2xl:w-96 flex-col border-l border-white/5 bg-zinc-950/30 items-center justify-center p-8 2xl:p-12 relative overflow-hidden">
        <div className="relative z-10 w-full flex flex-col items-center">
          <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
          <div className="mt-8 text-center">
            <h2 className={`text-2xl 2xl:text-3xl font-black italic tracking-tighter uppercase ${currentEmotion === Emotion.SAVAGE ? 'text-streetCyan' : currentEmotion === Emotion.ANGRY ? 'text-toxicRed' : 'text-white'}`}>
              {currentEmotion}
            </h2>
            <div className="h-px w-12 bg-white/20 mx-auto my-3" />
            <p className="text-[9px] 2xl:text-[10px] uppercase font-bold opacity-30 tracking-[0.3em]">Mode: Street Savage</p>
          </div>
        </div>
        
        <button 
          onClick={() => {localStorage.clear(); window.location.reload();}}
          className="mt-auto relative z-10 text-[10px] font-bold uppercase opacity-10 hover:opacity-100 hover:text-toxicRed transition-all p-4"
        >
          Reset Existence
        </button>

        {/* Decor */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-black opacity-[0.02] pointer-events-none select-none -rotate-12">
          PAKODA
        </div>
      </aside>
    </div>
  );
};

export default App;
