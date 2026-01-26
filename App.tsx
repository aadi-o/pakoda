import React, { useState, useRef, useEffect, useMemo } from 'react';
import Cattu from './components/Cattu';
import Masala from './components/Masala';
import Cutting from './components/Cutting';
import { sendMessageToGemini, generateSpeech } from './services/geminiService';
import { ChatMessage, Emotion, RoastIntensity, INTENSITY_MAP } from './types';

const ArchitectOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
      <div 
        className="fixed inset-0 bg-slateInk/20 backdrop-blur-md pointer-events-auto animate-reveal"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white border-[3px] border-slateInk shadow-[10px_10px_0px_#2D3748] sm:shadow-[16px_16px_0px_#2D3748] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden pointer-events-auto animate-pop-bounce flex flex-col max-h-[90dvh]">
        <div className="h-2 sm:h-3 bg-mutedRose w-full border-b-[3px] border-slateInk shrink-0" />
        
        <div className="p-6 sm:p-12 space-y-8 sm:space-y-12 overflow-y-auto custom-scroll">
          <button 
            onClick={onClose}
            className="absolute top-6 sm:top-8 right-6 sm:right-8 p-2 text-slateInk/20 hover:text-slateInk transition-all hover:rotate-90"
            aria-label="Close"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>

          <div className="space-y-3">
            <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.5em] text-mutedRose">System Architect</h3>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-[3px] border-slateInk/10 pb-4 sm:pb-6 gap-2">
              <p className="signature text-5xl sm:text-7xl text-slateInk leading-none tracking-tighter">Aadi</p>
              <div className="sm:text-right">
                <span className="block text-[8px] font-black uppercase tracking-widest text-clay/50">Core Cluster</span>
                <span className="text-[10px] sm:text-xs font-mono font-bold text-slateInk tracking-widest uppercase">NODE:3.5-STABLE</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slateInk border-l-4 border-mutedRose pl-3">Infrastructure</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 p-2 bg-haze rounded-xl border border-slateInk/5">
                  <svg className="w-5 h-5 opacity-60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slateInk/70">GitHub CI/CD</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-haze rounded-xl border border-slateInk/5">
                  <div className="w-5 h-5 bg-slateInk rounded flex items-center justify-center text-[8px] font-bold text-white">R</div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slateInk/70">Render Cloud</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slateInk border-l-4 border-slateInk pl-3">Architecture</h4>
              <div className="flex flex-wrap gap-1.5">
                {['React 19', 'TypeScript', 'Tailwind', 'Web Audio'].map(tech => (
                  <span key={tech} className="px-2 py-1 bg-slateInk text-white rounded-lg text-[8px] font-black uppercase tracking-tighter">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slateInk/30">Project Goal</h4>
            <p className="text-xs sm:text-sm leading-relaxed text-clay italic font-medium bg-haze/50 p-4 rounded-2xl border-2 border-slateInk/5">
              "Crafted for the sake of amusement. This is a digital temple of sass where logic is optional but the Master's burns are absolute."
            </p>
          </div>

          <div className="pt-6 sm:pt-8 border-t-[3px] border-slateInk/5 flex flex-col items-center gap-2">
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.5em] text-slateInk/15">Est. MMXXV • Aadi Digital Core</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ArtistCredit: React.FC = () => {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOverlayOpen(true)}
        className="group relative flex flex-col items-end transition-all active:translate-y-0.5 tap-highlight-transparent"
      >
        <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.4em] text-slateInk/20 group-hover:text-mutedRose transition-colors">Architect</span>
        <div className="signature text-2xl sm:text-4xl text-slateInk group-hover:text-mutedRose transition-colors leading-none tracking-tighter relative">
          Aadi
          <div className="hidden sm:block absolute -bottom-1 left-0 w-0 h-1 bg-mutedRose group-hover:w-full transition-all duration-300 rounded-full" />
        </div>
      </button>
      <ArchitectOverlay isOpen={isOverlayOpen} onClose={() => setIsOverlayOpen(false)} />
    </>
  );
};

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('pakoda_user_name'));
  const [tempName, setTempName] = useState('');
  const [input, setInput] = useState('');
  const [intensityValue, setIntensityValue] = useState(2); 
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.NEUTRAL);
  const [chaiLevel, setChaiLevel] = useState(5);
  const [showMasala, setShowMasala] = useState(false);
  const [masalaComment, setMasalaComment] = useState("");
  const [showCutting, setShowCutting] = useState(false);
  const [cuttingComment, setCuttingComment] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intensity = useMemo(() => INTENSITY_MAP[intensityValue], [intensityValue]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async (manualInput?: string) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim() || loading || chaiLevel <= 0) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);
    setChaiLevel(prev => Math.max(0, prev - 1));

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessageToGemini(textToSend, history, intensity);
      
      setCurrentEmotion(response.emotion);
      setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion }]);
      
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
      
      const roll = Math.random();
      if (roll > 0.8) {
        setMasalaComment(response.emotion === Emotion.SAVAGE ? "MASTER IS COOKING!" : "Ouch...");
        setShowMasala(true);
        setTimeout(() => setShowMasala(false), 3000);
      } else if (roll < 0.2 || (chaiLevel <= 1 && roll < 0.6)) {
        const cuttingLines = ["WAAH WAAH!", "Khatam Gaya!", "Pure Destruction!", "Tea is cold!", "Aur Sunao Chomu!"];
        setCuttingComment(cuttingLines[Math.floor(Math.random() * cuttingLines.length)]);
        setShowCutting(true);
        setTimeout(() => setShowCutting(false), 2500);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  if (!userName) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-ceramic">
        <div className="max-w-md w-full space-y-12 sm:space-y-16 text-center animate-reveal px-4">
          <Cattu size="lg" emotion={Emotion.NEUTRAL} isTalking={false} isLoading={false} />
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-8xl text-slateInk tracking-tighter leading-none">The Dojo.</h1>
            <p className="text-[9px] sm:text-[10px] font-black tracking-[0.5em] uppercase text-slateInk/20">Prove your Aukat.</p>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <input 
              type="text" 
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setUserName(tempName.trim())}
              placeholder="Who goes there?..." 
              className="w-full bg-white border-[3px] border-slateInk p-4 sm:p-6 text-xl sm:text-2xl rounded-[1.5rem] sm:rounded-[2rem] outline-none focus:bg-haze shadow-[6px_6px_0px_#2D3748] transition-all text-center font-bold italic"
            />
            <button 
              onClick={() => setUserName(tempName.trim())}
              className="w-full py-4 sm:py-6 bg-slateInk text-white font-black uppercase tracking-[0.4em] text-[10px] sm:text-xs rounded-[1.5rem] sm:rounded-[2rem] shadow-[6px_6px_0px_#E57373] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              Step Into The Fire
            </button>
          </div>
          <ArtistCredit />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-ceramic overflow-hidden">
      {/* Optimized Multi-Device Header */}
      <header className="px-4 sm:px-8 md:px-14 py-3 sm:py-5 flex items-center justify-between border-b-[3px] border-slateInk bg-white z-[100] shrink-0">
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-slateInk flex items-center justify-center text-white font-black rounded-xl sm:rounded-2xl shadow-[3px_3px_0px_#2D3748] border-[2px] sm:border-[3px] border-slateInk text-sm sm:text-lg">P</div>
          <div className="leading-none">
            <h2 className="text-lg sm:text-3xl font-black uppercase tracking-tighter">Pakoda</h2>
            <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-mutedRose animate-pulse" />
              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-mutedRose">Master Judger</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-8">
          {/* Mobile Spice Control (Simple) vs Desktop (Slider) */}
          <div className="flex flex-col items-center gap-1 px-2 sm:px-6 sm:border-x-[3px] border-slateInk/5">
             <div className="flex items-center gap-2 sm:gap-5 bg-haze px-3 sm:px-6 py-1.5 rounded-xl sm:rounded-2xl border-2 border-slateInk shadow-[3px_3px_0px_#2D3748]">
               <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slateInk/40">Spice</span>
               <input 
                 type="range" min="1" max="3" step="1" 
                 value={intensityValue} 
                 onChange={e => setIntensityValue(parseInt(e.target.value))}
                 className="w-12 sm:w-24 accent-mutedRose cursor-pointer"
               />
               <span className="text-[10px] sm:text-sm font-black text-slateInk w-3">{intensityValue}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <ArtistCredit />
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="p-2 sm:p-3 border-[2px] sm:border-[3px] border-slateInk rounded-lg sm:rounded-xl hover:bg-haze transition-all shadow-[3px_3px_0px_#2D3748] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              title="Reset"
            >
              <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* Main Panel: Responsive Chat Strip */}
        <main className="flex-1 flex flex-col min-h-0 lg:border-r-[3px] border-slateInk bg-white/50 relative">
          
          {/* Character Visibility on Mobile - Inline in Chat top */}
          <div className="lg:hidden p-4 bg-white/80 backdrop-blur-sm border-b-2 border-slateInk flex items-center justify-between shrink-0 animate-reveal">
            <div className="flex items-center gap-4">
              <Cattu size="sm" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
              <div>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slateInk/30">Chai Status</span>
                <div className="flex gap-1.5 mt-1">
                  {[...Array(5)].map((_, i) => <div key={i} className={`w-2 h-2 rounded-full border border-slateInk ${i < chaiLevel ? 'bg-mutedRose' : 'bg-white'}`} />)}
                </div>
              </div>
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest text-mutedRose px-3 py-1 bg-mutedRose/10 rounded-full border border-mutedRose/20">Level: {intensityValue}</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-10 lg:p-14 space-y-8 sm:space-y-12 pb-24 lg:pb-14">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 animate-reveal text-center px-8">
                <Cattu size="md" emotion={Emotion.NEUTRAL} isTalking={false} isLoading={false} />
                <h3 className="mt-8 serif italic text-2xl sm:text-4xl tracking-tight leading-snug">The silence of a coward is deafening... Speak up.</h3>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-reveal`}>
                <div className={`max-w-[92%] sm:max-w-[85%] lg:max-w-[75%] p-5 sm:p-8 border-[2px] sm:border-[3px] border-slateInk shadow-[5px_5px_0px_#2D3748] sm:shadow-[8px_8px_0px_#2D3748] rounded-[1.5rem] sm:rounded-[2.5rem] ${m.role === 'user' ? 'bg-haze rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                   <div className="flex items-center justify-between mb-3 border-b-2 border-slateInk/5 pb-2">
                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                      {m.role === 'user' ? userName : 'Master Pakoda'}
                    </span>
                    {m.role === 'model' && (
                       <div className="flex gap-1">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${m.emotion === Emotion.SAVAGE ? 'bg-slateInk' : m.emotion === Emotion.ANGRY ? 'bg-mutedRose' : 'bg-clay/20'}`} />
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full opacity-30 ${m.emotion === Emotion.SAVAGE ? 'bg-slateInk' : m.emotion === Emotion.ANGRY ? 'bg-mutedRose' : 'bg-clay/20'}`} />
                       </div>
                    )}
                   </div>
                   <p className={`text-base sm:text-xl lg:text-2xl leading-relaxed font-bold tracking-tight ${m.role === 'model' && m.emotion === Emotion.ANGRY ? 'text-mutedRose' : 'text-slateInk/90'}`}>
                    {m.text}
                   </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 items-center px-2 animate-reveal">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slateInk rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slateInk rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-slateInk rounded-full animate-bounce"></div>
                </div>
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-clay/40">Assembling Insult Cluster...</span>
              </div>
            )}
          </div>

          {/* Floating Character Overlays */}
          <div className="absolute top-24 left-4 sm:left-10 z-20 scale-75 sm:scale-100 origin-top-left pointer-events-none">
            <Cutting isVisible={showCutting} comment={cuttingComment} />
          </div>

          {/* Interaction Console - Sticky Bottom */}
          <div className="shrink-0 p-4 sm:p-10 lg:p-12 border-t-[3px] border-slateInk bg-white pb-safe">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
              {/* Responsive Hint Buttons */}
              <div className="flex flex-wrap sm:grid sm:grid-cols-4 gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                {[
                  { l: "Roast", p: "Judge my life choices right now." },
                  { l: "Reality", p: "Am I special or just another chomu?" },
                  { l: "Career", p: "Is my job a joke or am I the comedian?" },
                  { l: "Tea", p: "Pakoda, why are you like this?" }
                ].map(hint => (
                  <button 
                    key={hint.l} 
                    onClick={() => handleSend(hint.p)}
                    disabled={loading || chaiLevel <= 0}
                    className="comic-button py-2 sm:py-4 px-4 sm:px-0 flex-shrink-0 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slateInk/40 hover:text-slateInk hover:border-mutedRose transition-all whitespace-nowrap"
                  >
                    {hint.l}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <div className="relative flex items-center bg-white border-[3px] border-slateInk rounded-[1.5rem] sm:rounded-[2.5rem] p-1 sm:p-3 pl-5 sm:pl-10 shadow-[6px_6px_0px_#2D3748] sm:shadow-[10px_10px_0px_#2D3748] focus-within:shadow-[6px_6px_0px_#E57373] sm:focus-within:shadow-[10px_10px_0px_#E57373] transition-all group">
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Provoke the Master..."
                  className="flex-1 bg-transparent border-none outline-none text-lg sm:text-2xl font-bold italic py-3 sm:py-4 placeholder:text-slateInk/10 min-w-0"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim() || chaiLevel <= 0}
                  className="w-12 h-12 sm:w-16 sm:h-16 comic-button-primary rounded-[1rem] sm:rounded-[1.5rem] flex items-center justify-center transition-all disabled:opacity-20 group/send shrink-0 active:scale-95"
                  aria-label="Send"
                >
                  <svg className="w-5 h-5 sm:w-8 sm:h-8 group-hover/send:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar: Persona Visualization (Desktop Only) */}
        <aside className="hidden lg:flex w-[440px] xl:w-[480px] flex-col items-center justify-between p-12 xl:p-16 bg-ceramic border-l-[3px] border-slateInk relative overflow-hidden shrink-0">
          <div className="flex flex-col items-center space-y-12 xl:space-y-16 w-full z-10">
            <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
            
            <div className="text-center space-y-8 xl:space-y-10 w-full">
              <div className="space-y-4">
                <h3 className="text-5xl xl:text-6xl serif italic tracking-tighter leading-none">The Master.</h3>
                <p className="text-sm xl:text-base font-medium italic text-clay px-6 xl:px-8 leading-relaxed opacity-80">
                  "Listening to you is like watching a car crash. Horrible, but I can't look away from your incompetence."
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-center gap-4 xl:gap-5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-4 h-4 xl:w-5 xl:h-5 rounded-full border-[3px] border-slateInk transition-all duration-1000 ${i < chaiLevel ? 'bg-mutedRose shadow-[3px_3px_0px_#2D3748] xl:shadow-[4px_4px_0px_#2D3748]' : 'bg-white'}`} />
                  ))}
                </div>
                <p className="text-[9px] xl:text-[10px] font-black uppercase tracking-[0.5em] text-slateInk/20">Chai Reserves</p>
              </div>
            </div>
          </div>

          {/* Floating Masala on side */}
          <div className="absolute bottom-40 right-4 sm:right-8 origin-bottom-right scale-90 xl:scale-100 pointer-events-none">
             <Masala isVisible={showMasala} comment={masalaComment} />
          </div>

          <div className="text-center border-t-[3px] border-slateInk/5 pt-10 xl:pt-12 w-full">
            <span className="text-[8px] xl:text-[9px] font-black uppercase tracking-[0.6em] text-slateInk/15">Sourced from the Abyss by</span>
            <div className="signature text-4xl xl:text-5xl text-slateInk mt-2">Aadi</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;