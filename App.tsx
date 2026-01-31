
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Cattu from './components/Cattu';
import Masala from './components/Masala';
import Cutting from './components/Cutting';
import Bun from './components/Bun';
import Kaju from './components/Kaju';
import { sendMessageToGemini, generateSpeech } from './services/geminiService';
import { ChatMessage, Emotion, RoastIntensity, INTENSITY_MAP } from './types';

const CrewModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const characters = [
    {
      id: 'pakoda',
      name: 'Master Pakoda',
      role: 'The Judge',
      bio: 'The South Bombay Legend. Sitting at the helm of the premium tea stall, Pakoda doesn\'t just brew tea; he brews reality checks. Confidence level: Infinite. Tolerance for "chomus": Zero.',
      color: 'bg-slateInk',
      textColor: 'text-white',
      avatar: <Cattu size="sm" emotion={Emotion.CONFIDENT} isTalking={false} isLoading={false} />
    },
    {
      id: 'masala',
      name: 'Masala',
      role: 'The Spice',
      bio: 'The Cheeky Sidekick. Loves his tea strong and his insults spicy. If your logic is "fika" (bland), Masala will be the first one to sprinkle some burning truth on it.',
      color: 'bg-orange-500',
      textColor: 'text-white',
      avatar: (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <path d="M 30 50 Q 20 30 50 20 Q 80 30 70 50 Q 85 70 50 80 Q 15 70 30 50" fill="#FF922B" stroke="white" strokeWidth="4" />
          <circle cx="40" cy="45" r="5" fill="white" /><circle cx="60" cy="45" r="5" fill="white" />
        </svg>
      )
    },
    {
      id: 'bun',
      name: 'Bun Maska',
      role: 'The Zen',
      bio: 'The Zen Peacekeeper. Soft, buttery, and surprisingly calm. While the rest of the gang roasts you, Bun tries to "maska" (butter) you up with gentle, zen-like observations.',
      color: 'bg-amber-200',
      textColor: 'text-slateInk',
      avatar: (
        <svg viewBox="0 0 120 100" className="w-14 h-12">
          <path d="M 10 70 Q 10 20 60 20 Q 110 20 110 70 Q 110 90 60 90 Q 10 90 10 70" fill="#FFD8A8" stroke="#2D3748" strokeWidth="4" />
          <rect x="45" y="15" width="30" height="15" rx="4" fill="#FAB005" stroke="#2D3748" strokeWidth="3" />
        </svg>
      )
    },
    {
      id: 'cutting',
      name: 'Cutting',
      role: 'The Hype Man',
      bio: '100% energy, 0% chill. He lives for a good roast and is always ready to hype up Pakoda\'s savage burns. Basically a human espresso shot in a small glass.',
      color: 'bg-mutedRose',
      textColor: 'text-white',
      avatar: (
        <svg viewBox="0 0 100 120" className="w-10 h-12">
          <path d="M 25 20 L 35 110 Q 50 115 65 110 L 75 20 Z" fill="white" stroke="#2D3748" strokeWidth="6" />
          <path d="M 32 80 L 35 110 Q 50 115 65 110 L 68 80 Q 50 75 32 80" fill="#E57373" />
        </svg>
      )
    },
    {
      id: 'kaju',
      name: 'Kaju',
      role: 'The Elite',
      bio: 'The Philosophical Elite. Superior, intellectual, and slightly snobbish. Kaju doesn\'t just judge your IQ; he questions the very nature of your existence from a higher plane.',
      color: 'bg-blue-100',
      textColor: 'text-blue-900',
      avatar: (
        <svg viewBox="0 0 100 120" className="w-10 h-12">
          <path d="M 30 40 Q 15 60 30 90 Q 50 110 75 80 Q 85 60 65 45 Q 50 35 30 40" fill="#E0F2FE" stroke="#93C5FD" strokeWidth="4" />
          <circle cx="50" cy="20" r="15" fill="none" stroke="#93C5FD" strokeWidth="2" opacity="0.4" />
        </svg>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-8">
      <div className="fixed inset-0 bg-slateInk/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-ceramic border-[4px] border-slateInk shadow-[16px_16px_0px_#2D3748] rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90dvh] animate-pop-bounce">
        <header className="bg-slateInk p-6 flex items-center justify-between border-b-[4px] border-slateInk">
          <h2 className="text-white text-3xl font-black uppercase tracking-widest italic">The Stall Crew</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto custom-scroll p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {characters.map(char => (
            <div key={char.id} className="bg-white border-[3px] border-slateInk rounded-[2rem] p-6 shadow-[8px_8px_0px_rgba(45,55,72,0.1)] flex flex-col items-center text-center space-y-4 group hover:-translate-y-1 transition-transform">
              <div className={`w-20 h-20 rounded-2xl ${char.color} flex items-center justify-center border-[3px] border-slateInk shadow-[4px_4px_0px_#2D3748] group-hover:rotate-3 transition-transform`}>
                {char.avatar}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none italic">{char.name}</h3>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-mutedRose">{char.role}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-clay italic">
                "{char.bio}"
              </p>
            </div>
          ))}
        </div>
        <footer className="p-6 border-t-[3px] border-slateInk/5 bg-white text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slateInk/20">Authorized Crew Dossier • MMXXV</p>
        </footer>
      </div>
    </div>
  );
};

const ChatAvatar: React.FC<{ character?: string; emotion?: Emotion; isUser?: boolean }> = ({ character, emotion, isUser }) => {
  if (isUser) {
    return (
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slateInk flex items-center justify-center text-white font-black text-[10px] sm:text-xs border-2 border-slateInk shadow-[2px_2px_0px_#E57373] shrink-0">
        U
      </div>
    );
  }

  const avatarMap: Record<string, React.ReactNode> = {
    pakoda: <Cattu size="sm" emotion={emotion || Emotion.NEUTRAL} isTalking={false} isLoading={false} />,
    masala: (
      <div className="scale-[0.5] origin-center">
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <path d="M 30 50 Q 20 30 50 20 Q 80 30 70 50 Q 85 70 50 80 Q 15 70 30 50" fill="#FF922B" stroke="#2D3748" strokeWidth="4" />
          <circle cx="40" cy="45" r="5" fill="#2D3748" /><circle cx="60" cy="45" r="5" fill="#2D3748" />
        </svg>
      </div>
    ),
    bun: (
      <div className="scale-[0.5] origin-center">
        <svg viewBox="0 0 120 100" className="w-16 h-16">
          <path d="M 10 70 Q 10 20 60 20 Q 110 20 110 70 Q 110 90 60 90 Q 10 90 10 70" fill="#FFD8A8" stroke="#2D3748" strokeWidth="4" />
          <rect x="45" y="15" width="30" height="15" rx="4" fill="#FAB005" stroke="#2D3748" strokeWidth="3" />
        </svg>
      </div>
    ),
    cutting: (
      <div className="scale-[0.4] origin-center">
        <svg viewBox="0 0 100 120" className="w-16 h-20">
          <path d="M 25 20 L 35 110 Q 50 115 65 110 L 75 20 Z" fill="white" stroke="#2D3748" strokeWidth="6" />
          <path d="M 32 80 L 35 110 Q 50 115 65 110 L 68 80 Q 50 75 32 80" fill="#E57373" />
        </svg>
      </div>
    ),
    kaju: (
      <div className="scale-[0.5] origin-center">
        <svg viewBox="0 0 100 120" className="w-16 h-20">
          <path d="M 30 40 Q 15 60 30 90 Q 50 110 75 80 Q 85 60 65 45 Q 50 35 30 40" fill="#E0F2FE" stroke="#93C5FD" strokeWidth="4" />
          <circle cx="50" cy="20" r="15" fill="none" stroke="#93C5FD" strokeWidth="2" opacity="0.4" />
        </svg>
      </div>
    )
  };

  return (
    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-xl border-2 border-slateInk/10 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
      {avatarMap[character || 'pakoda'] || avatarMap.pakoda}
    </div>
  );
};

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
                  <span key={tech} className="px-2 py-1 bg-slateInk text-white rounded-lg text-[8px] font-black uppercase tracking-tighter">{tech}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-slateInk/30">Project Goal</h4>
            <p className="text-xs sm:text-sm leading-relaxed text-clay italic font-medium bg-haze/50 p-4 rounded-2xl border-2 border-slateInk/5">"Crafted for the sake of amusement. This is a digital temple of sass where logic is optional but the Master's burns are absolute."</p>
          </div>
          <div className="pt-6 sm:pt-8 border-t-[3px] border-slateInk/5 flex flex-col items-center gap-2"><p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.5em] text-slateInk/15">Est. MMXXV • Aadi Digital Core</p></div>
        </div>
      </div>
    </div>
  );
};

const ArtistCredit: React.FC<{ isOpen: boolean; onOpen: () => void; onClose: () => void }> = ({ isOpen, onOpen, onClose }) => {
  return (
    <>
      <button onClick={onOpen} className="group relative flex flex-col items-end transition-all active:translate-y-0.5 tap-highlight-transparent">
        <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.4em] text-slateInk/20 group-hover:text-mutedRose transition-colors">Architect</span>
        <div className="signature text-2xl sm:text-4xl text-slateInk group-hover:text-mutedRose transition-colors leading-none tracking-tighter relative">
          Aadi
          <div className="hidden sm:block absolute -bottom-1 left-0 w-0 h-1 bg-mutedRose group-hover:w-full transition-all duration-300 rounded-full" />
        </div>
      </button>
      <ArchitectOverlay isOpen={isOpen} onClose={onClose} />
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
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.NEUTRAL);
  const [userIQ, setUserIQ] = useState(80); 
  const [showMasala, setShowMasala] = useState(false);
  const [masalaComment, setMasalaComment] = useState("");
  const [showCutting, setShowCutting] = useState(false);
  const [cuttingComment, setCuttingComment] = useState("");
  const [showBun, setShowBun] = useState(false);
  const [bunComment, setBunComment] = useState("");
  const [showKaju, setShowKaju] = useState(false);
  const [kajuComment, setKajuComment] = useState("");
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [isCrewOpen, setIsCrewOpen] = useState(false);
  const [autoCreditTimer, setAutoCreditTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const intensity = useMemo(() => INTENSITY_MAP[intensityValue], [intensityValue]);

  useEffect(() => {
    if (scrollRef.current) { scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }
  }, [messages, loading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) handleSend(transcript);
      };
      recognitionRef.current.onerror = (event: any) => { console.error('Speech recognition error', event.error); setIsRecording(false); };
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) { alert("Arey Chomu, your browser doesn't support speaking. Type like a normal person."); return; }
    if (isRecording) recognitionRef.current.stop(); else { setIsRecording(true); recognitionRef.current.start(); }
  };

  const handleEnterDojo = () => {
    const name = tempName.trim();
    if (!name) return;
    setUserName(name);
    localStorage.setItem('pakoda_user_name', name);
    setIsCreditOpen(true);
    const timer = setTimeout(() => setIsCreditOpen(false), 3000);
    setAutoCreditTimer(timer);
  };

  const handleManualOpenCredit = () => {
    if (autoCreditTimer) { clearTimeout(autoCreditTimer); setAutoCreditTimer(null); }
    setIsCreditOpen(true);
  };

  const handleManualCloseCredit = () => {
    if (autoCreditTimer) { clearTimeout(autoCreditTimer); setAutoCreditTimer(null); }
    setIsCreditOpen(false);
  };

  const clearSidekicks = () => { setShowMasala(false); setShowBun(false); setShowCutting(false); setShowKaju(false); };

  const handleSend = async (manualInput?: string) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim() || loading) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);
    clearSidekicks();

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessageToGemini(textToSend, history, intensity);
      
      setCurrentEmotion(response.emotion);
      setUserIQ(prev => {
        let adjustment = response.iqAdjustment;
        const intensityWeight = { 'light': 0.6, 'savage': 1.4, 'legendary': 2.5 }[intensity] || 1;
        if (adjustment < 0) {
          adjustment *= intensityWeight;
          if (prev < 40) adjustment *= 1.3;
          if (prev < 0) adjustment *= 1.5;
        } else {
          adjustment *= (intensity === 'legendary' ? 0.4 : intensity === 'savage' ? 0.7 : 1);
          if (prev < 0) adjustment *= 0.5;
        }
        return Math.max(-120, Math.min(180, Math.floor(prev + adjustment)));
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion, character: 'pakoda' }]);
      
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

      if (response.interjection) {
        const { character, content } = response.interjection;
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'model', text: content, character: character as any }]);
          if (character === 'masala') { setMasalaComment(content); setShowMasala(true); }
          else if (character === 'bun') { setBunComment(content); setShowBun(true); }
          else if (character === 'cutting') { setCuttingComment(content); setShowCutting(true); }
          else if (character === 'kaju') { setKajuComment(content); setShowKaju(true); }
          setTimeout(() => clearSidekicks(), 4000);
        }, 1200);
      }
    } catch (e) { setLoading(false); }
  };

  const getBubbleStyles = (m: ChatMessage) => {
    if (m.role === 'user') return 'bg-haze border-slateInk rounded-tr-none';
    switch (m.character) {
      case 'masala': return 'bg-white border-orange-400/40 rounded-tl-none';
      case 'bun': return 'bg-amber-50/50 border-amber-200 rounded-tl-none';
      case 'cutting': return 'bg-slateInk text-white border-slateInk rounded-tl-none';
      case 'kaju': return 'bg-blue-50/30 border-blue-200 rounded-tl-none';
      default: return 'bg-white border-slateInk rounded-tl-none';
    }
  };

  if (!userName) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-ceramic text-slateInk">
        <div className="max-w-md w-full space-y-12 sm:space-y-16 text-center animate-reveal px-4">
          <Cattu size="lg" emotion={Emotion.NEUTRAL} isTalking={false} isLoading={false} />
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-8xl tracking-tighter leading-none">The Dojo.</h1>
            <p className="text-[9px] sm:text-[10px] font-black tracking-[0.5em] uppercase opacity-20">Declare your name, chomu.</p>
          </div>
          <div className="space-y-4 sm:space-y-6">
            <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEnterDojo()} placeholder="Name here..." className="w-full bg-white border-[3px] border-slateInk p-4 sm:p-6 text-xl sm:text-2xl rounded-[1.5rem] sm:rounded-[2rem] outline-none focus:bg-haze shadow-[6px_6px_0px_#2D3748] transition-all text-center font-bold italic" />
            <button onClick={handleEnterDojo} className="w-full py-4 sm:py-6 bg-slateInk text-white font-black uppercase tracking-[0.4em] text-[10px] sm:text-xs rounded-[1.5rem] sm:rounded-[2rem] shadow-[6px_6px_0px_#E57373] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">Step Into The Fire</button>
          </div>
          <ArtistCredit isOpen={isCreditOpen} onOpen={handleManualOpenCredit} onClose={handleManualCloseCredit} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-ceramic overflow-hidden text-slateInk">
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
          <button 
            onClick={() => setIsCrewOpen(true)}
            className="comic-button px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slateInk/70 hover:text-slateInk hover:border-mutedRose transition-all hidden sm:block"
          >
            The Gang
          </button>
          <div className="hidden md:flex flex-col items-center gap-1 px-6 border-x-[3px] border-slateInk/5">
             <div className="flex items-center gap-5 bg-haze px-6 py-1.5 rounded-2xl border-2 border-slateInk shadow-[3px_3px_0px_#2D3748]">
               <span className="text-[9px] font-black uppercase tracking-widest text-slateInk/40">Roast Intensity</span>
               <input type="range" min="1" max="3" step="1" value={intensityValue} onChange={e => setIntensityValue(parseInt(e.target.value))} className="w-24 accent-mutedRose cursor-pointer" />
               <span className="text-sm font-black w-3">{intensityValue}</span>
             </div>
          </div>
          <ArtistCredit isOpen={isCreditOpen} onOpen={handleManualOpenCredit} onClose={handleManualCloseCredit} />
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-h-0 lg:border-r-[3px] border-slateInk bg-white/50 relative">
          <div className="lg:hidden p-4 bg-white/80 backdrop-blur-sm border-b-2 border-slateInk flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <Cattu size="sm" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
              <div>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-30">IQ Level</span>
                <p className={`text-xl font-black italic tracking-tighter leading-none ${userIQ < 20 ? 'text-mutedRose animate-pulse' : 'text-slateInk'}`}>{userIQ}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsCrewOpen(true)}
              className="comic-button px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-slateInk/70"
            >
              The Gang
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-10 lg:p-14 space-y-8 sm:space-y-12 pb-24 lg:pb-14">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 animate-reveal text-center px-8">
                <Cattu size="md" emotion={Emotion.NEUTRAL} isTalking={false} isLoading={false} />
                <h3 className="mt-8 serif italic text-2xl sm:text-4xl tracking-tight leading-snug">Speak up, if you have something besides air in your head.</h3>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-reveal items-end gap-2 sm:gap-4`}>
                {m.role !== 'user' && <ChatAvatar character={m.character || 'pakoda'} emotion={m.emotion} />}
                <div className={`max-w-[85%] sm:max-w-[75%] p-4 sm:p-7 border-[2px] sm:border-[3px] shadow-[4px_4px_0px_#2D3748] sm:shadow-[6px_6px_0px_#2D3748] rounded-[1.5rem] sm:rounded-[2.2rem] ${getBubbleStyles(m)}`}>
                   <div className="flex items-center justify-between mb-2 border-b-2 border-slateInk/5 pb-1">
                    <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.3em] opacity-40">
                      {m.role === 'user' ? userName : (m.character || 'pakoda').toUpperCase()}
                    </span>
                   </div>
                   <p className={`text-sm sm:text-lg lg:text-xl leading-relaxed font-bold tracking-tight ${m.role === 'model' && m.emotion === Emotion.ANGRY ? 'text-mutedRose' : ''}`}>
                    {m.text}
                   </p>
                </div>
                {m.role === 'user' && <ChatAvatar isUser />}
              </div>
            ))}
            {loading && (
              <div className="flex gap-4 items-center px-2 py-4 animate-reveal">
                <div className="flex gap-1.5 items-end h-4">
                  <div className="w-1.5 h-1.5 bg-slateInk rounded-full animate-dot-hop [animation-delay:-0.3s]"></div>
                  <div className="w-2.5 h-2.5 bg-mutedRose rounded-full animate-dot-hop [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-slateInk rounded-full animate-dot-hop"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] shimmer-text animate-shimmer">Scanning for intelligence...</span>
                  <div className="h-0.5 w-full bg-slateInk/5 mt-1 overflow-hidden rounded-full"><div className="h-full bg-mutedRose w-1/3 animate-[shimmer_1.5s_infinite] origin-left rounded-full" /></div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute top-24 left-4 sm:left-10 z-20 scale-75 sm:scale-100 origin-top-left pointer-events-none"><Cutting isVisible={showCutting} comment={cuttingComment} /></div>
          <div className="absolute top-1/2 left-4 sm:left-10 z-20 scale-75 sm:scale-100 origin-center pointer-events-none"><Bun isVisible={showBun} comment={bunComment} /></div>
          <div className="absolute top-12 right-12 z-20 pointer-events-none"><Kaju isVisible={showKaju} comment={kajuComment} /></div>

          <div className="shrink-0 p-4 sm:p-10 lg:p-12 border-t-[3px] border-slateInk bg-white pb-safe">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
              <div className="flex flex-wrap sm:grid sm:grid-cols-4 gap-2 sm:gap-4 overflow-x-auto pb-1 scrollbar-hide">
                {[{ l: "Roast", p: "Judge my life choices right now." }, { l: "Reality", p: "Am I special or just another chomu?" }, { l: "Career", p: "Is my job a joke or am I the comedian?" }, { l: "Dimaag", p: "Do I actually have a brain or just gas?" }].map(hint => (
                  <button key={hint.l} onClick={() => handleSend(hint.p)} disabled={loading} className="comic-button py-2 sm:py-4 px-4 sm:px-0 flex-shrink-0 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-slateInk/40 hover:text-slateInk hover:border-mutedRose transition-all whitespace-nowrap">{hint.l}</button>
                ))}
              </div>
              <div className={`relative flex items-center bg-white border-[3px] border-slateInk rounded-[1.5rem] sm:rounded-[2.5rem] p-1 sm:p-3 pl-5 sm:pl-10 shadow-[6px_6px_0px_#2D3748] sm:shadow-[10px_10px_0px_#2D3748] transition-all group ${isRecording ? 'border-mutedRose shadow-[6px_6px_0px_#E57373] animate-pulse' : 'focus-within:shadow-[6px_6px_0px_#E57373]'}`}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={isRecording ? "Listening to your nonsense..." : "Ask something stupid..." } className="flex-1 bg-transparent border-none outline-none text-lg sm:text-2xl font-bold italic py-3 sm:py-4 placeholder:text-slateInk/10 min-w-0" disabled={isRecording} />
                <div className="flex items-center gap-2 sm:gap-3 mr-1">
                  <button onClick={toggleRecording} disabled={loading} className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-[1rem] sm:rounded-[1.5rem] border-[3px] border-slateInk transition-all hover:bg-haze active:translate-y-0.5 ${isRecording ? 'bg-mutedRose/20 border-mutedRose text-mutedRose animate-bounce' : 'text-slateInk'}`} title="Voice Input">
                    <svg className="w-5 h-5 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                  </button>
                  <button onClick={() => handleSend()} disabled={loading || !input.trim() || isRecording} className="w-12 h-12 sm:w-16 sm:h-16 comic-button-primary rounded-[1rem] sm:rounded-[1.5rem] flex items-center justify-center transition-all disabled:opacity-20 group/send shrink-0">
                    <svg className="w-5 h-5 sm:w-8 sm:h-8 group-hover/send:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <aside className="hidden lg:flex w-[440px] xl:w-[480px] flex-col items-center justify-between p-12 xl:p-16 bg-ceramic border-l-[3px] border-slateInk relative overflow-hidden shrink-0">
          <div className="flex flex-col items-center space-y-12 xl:space-y-16 w-full z-10">
            <Cattu size="lg" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
            <div className="text-center space-y-8 xl:space-y-10 w-full">
              <div className="space-y-4">
                <h3 className="text-5xl xl:text-6xl serif italic tracking-tighter leading-none">The Master.</h3>
                <p className="text-sm xl:text-base font-medium italic text-clay px-6 leading-relaxed opacity-80">"Your brain is like a demo version - extremely limited and asks too many questions."</p>
              </div>
              <div className="w-full bg-white border-[3px] border-slateInk rounded-[2rem] p-8 shadow-[8px_8px_0px_#2D3748] relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Brain Activity</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${userIQ < 20 ? 'text-mutedRose animate-pulse' : 'text-slateInk'}`}>{userIQ < 20 ? 'CRITICAL' : 'MINIMAL'}</span>
                </div>
                <div className="relative h-4 bg-haze rounded-full border-2 border-slateInk overflow-hidden mb-6"><div className={`absolute inset-y-0 left-0 transition-all duration-1000 ${userIQ < 20 ? 'bg-mutedRose' : 'bg-slateInk'}`} style={{ width: `${Math.min(100, Math.max(0, (userIQ + 120) / 300 * 100))}%` }} /></div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black uppercase tracking-[0.5em] opacity-20 mb-1">User IQ Score</span>
                  <div className={`text-7xl xl:text-8xl font-black italic tracking-tighter leading-none transition-all duration-500 ${userIQ < 20 ? 'text-mutedRose scale-110 drop-shadow-[4px_4px_0px_#2D3748]' : 'text-slateInk'}`}>{userIQ}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-40 right-8 origin-bottom-right scale-90 xl:scale-100 pointer-events-none"><Masala isVisible={showMasala} comment={masalaComment} /></div>
          <div className="text-center border-t-[3px] border-slateInk/5 pt-12 w-full"><span className="text-[9px] font-black uppercase tracking-[0.6em] opacity-15">Brain Scan Provided by</span><div className="signature text-4xl xl:text-5xl opacity-80 mt-2">Aadi</div></div>
        </aside>
      </div>
      <CrewModal isOpen={isCrewOpen} onClose={() => setIsCrewOpen(false)} />
    </div>
  );
};

export default App;
