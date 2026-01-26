
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Cattu from './components/Cattu';
import Masala from './components/Masala';
import Cutting from './components/Cutting';
import Bun from './components/Bun';
import Kaju from './components/Kaju';
import { sendMessageToGemini, generateSpeech } from './services/geminiService';
import { ChatMessage, Emotion, RoastIntensity, INTENSITY_MAP } from './types';

const TypewriterText: React.FC<{ text: string; duration: number; onComplete?: () => void }> = ({ text, duration, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (!duration || duration <= 0) {
      setDisplayedText(text);
      onComplete?.();
      return;
    }

    let start: number | null = null;
    let frameId: number;
    
    const animate = (time: number) => {
      if (start === null) start = time;
      const progress = (time - start) / (duration * 1000);
      const currentLength = Math.floor(text.length * Math.min(progress, 1.05)); // Slight buffer for sync
      
      setDisplayedText(text.slice(0, currentLength));
      
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [text, duration]);

  return <>{displayedText}</>;
};

const ArchitectOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 pointer-events-none">
      <div className="fixed inset-0 bg-slateInk/20 backdrop-blur-md pointer-events-auto animate-reveal" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white border-[3px] border-slateInk shadow-[10px_10px_0px_#2D3748] rounded-[2rem] overflow-hidden pointer-events-auto animate-pop-bounce flex flex-col max-h-[90dvh]">
        <div className="h-2 bg-mutedRose w-full border-b-[3px] border-slateInk shrink-0" />
        <div className="p-6 sm:p-12 space-y-8 overflow-y-auto custom-scroll">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slateInk/20 hover:text-slateInk transition-all hover:rotate-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-mutedRose">System Architect</h3>
            <p className="signature text-5xl text-slateInk">Aadi</p>
          </div>
          <p className="text-xs leading-relaxed text-clay italic font-medium bg-haze/50 p-4 rounded-2xl border-2 border-slateInk/5">
            "Crafted for the sake of amusement. This is a digital temple of sass."
          </p>
        </div>
      </div>
    </div>
  );
};

const ArtistCredit: React.FC<{ isOpen: boolean; onOpen: () => void; onClose: () => void }> = ({ isOpen, onOpen, onClose }) => (
  <>
    <div className="flex flex-col items-end gap-1.5 group select-none">
      <span className="text-[7px] font-black uppercase tracking-[0.5em] text-slateInk/25 translate-x-1 group-hover:text-mutedRose transition-colors">Architect</span>
      <button onClick={onOpen} className="relative px-5 py-2 sm:px-8 sm:py-3 bg-white border-[2.5px] border-slateInk rounded-[1.2rem] shadow-[4px_4px_0px_#2D3748] hover:shadow-[3px_3px_0px_#E57373] active:translate-x-0.5 transition-all group/btn overflow-hidden">
        <div className="relative flex items-center gap-3">
          <div className="signature text-2xl sm:text-4xl text-slateInk group-hover/btn:text-mutedRose transition-colors">Aadi</div>
        </div>
      </button>
    </div>
    <ArchitectOverlay isOpen={isOpen} onClose={onClose} />
  </>
);

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('pakoda_user_name'));
  const [tempName, setTempName] = useState('');
  const [input, setInput] = useState('');
  const [intensityValue, setIntensityValue] = useState(2); 
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.NEUTRAL);
  const [userIQ, setUserIQ] = useState(80); 
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [lastMessageDuration, setLastMessageDuration] = useState(0);

  // Reaction states
  const [showMasala, setShowMasala] = useState(false);
  const [showCutting, setShowCutting] = useState(false);
  const [showBun, setShowBun] = useState(false);
  const [showKaju, setShowKaju] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const intensity = useMemo(() => INTENSITY_MAP[intensityValue], [intensityValue]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading, isSpeaking]);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handleEnterDojo = () => {
    initAudio();
    const name = tempName.trim();
    if (!name) return;
    setUserName(name);
    localStorage.setItem('pakoda_user_name', name);
    setIsCreditOpen(true);
    setTimeout(() => setIsCreditOpen(false), 2000);
  };

  const handleSend = async (manualInput?: string) => {
    initAudio();
    const textToSend = manualInput || input;
    if (!textToSend.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessageToGemini(textToSend, history, intensity);
      
      const audioData = await generateSpeech(response.text, response.emotion);
      let duration = 0;

      if (audioData && audioContextRef.current) {
        const binary = atob(audioData);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        duration = buffer.duration;
        setLastMessageDuration(duration);
        
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        
        setIsSpeaking(true);
        source.start();
      }

      setCurrentEmotion(response.emotion);
      setUserIQ(prev => Math.max(-50, prev + response.iqAdjustment));
      
      setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion }]);
      setLoading(false);

      // Random side-kick reactions
      const roll = Math.random();
      if (roll > 0.8) setShowMasala(true);
      if (roll < 0.2) setShowBun(true);
      if (response.iqAdjustment < -10) setShowCutting(true);
      setTimeout(() => { setShowMasala(false); setShowBun(false); setShowCutting(false); }, 3000);

    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (!userName) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-ceramic text-slateInk">
        <div className="max-w-md w-full space-y-12 text-center animate-reveal px-4">
          <Cattu size="lg" emotion={Emotion.NEUTRAL} isTalking={false} isLoading={false} />
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-8xl tracking-tighter">The Dojo.</h1>
            <p className="text-[10px] font-black tracking-[0.5em] uppercase opacity-20">Name declare kar, chomu.</p>
          </div>
          <div className="space-y-4">
            <input 
              type="text" value={tempName} onChange={e => setTempName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEnterDojo()}
              placeholder="Your name..." 
              className="w-full bg-white border-[3px] border-slateInk p-4 sm:p-6 text-xl rounded-[1.5rem] shadow-[6px_6px_0px_#2D3748] text-center font-bold"
            />
            <button onClick={handleEnterDojo} className="w-full py-4 sm:py-6 bg-slateInk text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-[1.5rem] shadow-[6px_6px_0px_#E57373] active:translate-x-1 transition-all">
              Step Into The Fire
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-ceramic overflow-hidden text-slateInk">
      <header className="px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between border-b-[3px] border-slateInk bg-white z-[100]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-slateInk flex items-center justify-center text-white font-black rounded-xl border-[2px] border-slateInk">P</div>
          <h2 className="text-lg sm:text-3xl font-black uppercase tracking-tighter">Pakoda</h2>
        </div>
        <ArtistCredit isOpen={isCreditOpen} onOpen={() => setIsCreditOpen(true)} onClose={() => setIsCreditOpen(false)} />
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 lg:border-r-[3px] border-slateInk bg-white/50 relative">
          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-10 space-y-8 pb-24">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-8">
                <Cattu size="md" emotion={Emotion.NEUTRAL} isTalking={false} isLoading={false} />
                <h3 className="mt-8 serif italic text-2xl">Bol bhai, wait kis baat ka hai?</h3>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-reveal`}>
                <div className={`max-w-[90%] sm:max-w-[75%] p-5 sm:p-8 border-[2px] border-slateInk shadow-[5px_5px_0px_#2D3748] rounded-[1.5rem] ${m.role === 'user' ? 'bg-haze' : 'bg-white'}`}>
                   <p className="text-base sm:text-xl font-bold tracking-tight">
                    {m.role === 'model' && i === messages.length - 1 && isSpeaking ? (
                      <TypewriterText text={m.text} duration={lastMessageDuration} />
                    ) : (
                      m.text
                    )}
                   </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-1 p-2">
                <div className="w-2 h-2 bg-slateInk/20 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slateInk/20 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-slateInk/20 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
          </div>

          <div className="shrink-0 p-4 sm:p-10 border-t-[3px] border-slateInk bg-white pb-safe">
            <div className="relative flex items-center bg-white border-[3px] border-slateInk rounded-[1.5rem] p-1 shadow-[6px_6px_0px_#2D3748] focus-within:shadow-[6px_6px_0px_#E57373] transition-all group">
              <input 
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask something..."
                className="flex-1 bg-transparent border-none outline-none text-lg font-bold italic p-4"
              />
              <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="w-12 h-12 sm:w-16 sm:h-16 bg-slateInk rounded-[1rem] flex items-center justify-center disabled:opacity-20">
                <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </main>

        <aside className="hidden lg:flex w-[400px] flex-col items-center justify-center p-12 bg-ceramic border-l-[3px] border-slateInk relative">
          <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
          <div className="mt-12 text-center w-full space-y-8">
            <div className="bg-white border-[3px] border-slateInk rounded-[2rem] p-8 shadow-[8px_8px_0px_#2D3748]">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20">Brain Activity</span>
              <div className="text-7xl font-black italic tracking-tighter mt-2">{userIQ}</div>
              <div className="h-2 bg-haze rounded-full mt-6 overflow-hidden border-2 border-slateInk">
                <div className="h-full bg-slateInk transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, userIQ))}%` }} />
              </div>
            </div>
          </div>
          <div className="absolute top-10 right-10 pointer-events-none"><Masala isVisible={showMasala} comment="Lmao look at this guy." /></div>
          <div className="absolute bottom-40 left-10 pointer-events-none"><Cutting isVisible={showCutting} comment="Logic zero!" /></div>
        </aside>
      </div>
    </div>
  );
};

export default App;
