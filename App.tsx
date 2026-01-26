
import React, { useState, useRef, useEffect } from 'react';
import Cattu from './components/Cattu';
import { sendMessageToGemini, generateSpeech } from './services/geminiService';
import { ChatMessage, Emotion } from './types';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('pakoda_user_name'));
  const [tempName, setTempName] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>(Emotion.NEUTRAL);
  const [chaiLevel, setChaiLevel] = useState(5);

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
    const name = tempName.trim();
    setUserName(name);
    localStorage.setItem('pakoda_user_name', name);
  };

  const handleSend = async (manualInput?: string) => {
    const textToSend = manualInput || input;
    if (!textToSend.trim() || loading || chaiLevel <= 0) return;

    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);
    setChaiLevel(prev => Math.max(0, prev - 1));

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await sendMessageToGemini(textToSend, history);
      
      setCurrentEmotion(response.emotion);

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

      setMessages(prev => [...prev, { role: 'model', text: response.text, emotion: response.emotion }]);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setCurrentEmotion(Emotion.ANGRY);
    }
  };

  if (!userName) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-gallery">
        <div className="max-w-md w-full text-center space-y-12 animate-fade-in">
          <div className="flex justify-center">
            <Cattu size="lg" emotion={Emotion.NEUTRAL} isTalking={false} isLoading={false} />
          </div>
          <div className="space-y-3">
            <h1 className="text-6xl text-slateInk leading-tight">Identify yourself.</h1>
            <p className="text-slateInk/40 text-sm font-medium tracking-widest uppercase">The Dojo awaits its next chomu</p>
          </div>
          <div className="space-y-6">
            <input 
              type="text" 
              value={tempName} 
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitName()}
              placeholder="Name, if you have one..." 
              className="w-full bg-paper border border-slateInk/10 p-5 text-lg font-medium rounded-full outline-none focus:border-coralDusk/40 transition-all text-center shadow-sm"
            />
            <button 
              onClick={submitName} 
              className="w-full py-5 editorial-button font-bold uppercase tracking-widest text-sm"
            >
              Enter Dojo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-gallery text-slateInk">
      {/* Navigation Bar - Refined and Breathable */}
      <nav className="flex items-center justify-between px-8 py-6 bg-paper/50 backdrop-blur-lg border-b border-slateInk/5 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slateInk flex items-center justify-center font-bold text-paper text-sm">P</div>
          <h2 className="text-xl tracking-tight font-black uppercase text-slateInk/80">
            Pakoda <span className="text-coralDusk font-serif italic lowercase font-normal">sensei</span>
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 bg-paper px-4 py-2 rounded-full border border-slateInk/5 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${chaiLevel > 0 ? 'bg-coralDusk' : 'bg-slateInk/10'} animate-pulse`}></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slateInk/60">Logic Status: Critical</span>
          </div>
          <button 
            onClick={() => {localStorage.clear(); window.location.reload();}} 
            className="p-3 hover:bg-paper rounded-full transition-all text-slateInk/40 hover:text-coralDusk border border-transparent hover:border-slateInk/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </nav>

      {/* Main Interaction Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 min-h-0">
        <div className="w-full max-w-5xl h-full flex flex-col editorial-card overflow-hidden">
          
          <div className="flex-1 flex flex-col min-h-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 scrollbar-hide">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-fade-in opacity-50">
                  <Cattu size="md" emotion={currentEmotion} isTalking={isSpeaking} isLoading={loading} />
                  <div className="space-y-2">
                    <h3 className="text-4xl">Speak, if you must.</h3>
                    <p className="text-sm tracking-widest uppercase font-medium">I have all day to judge you.</p>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  <div className={`group relative max-w-[85%] md:max-w-[70%] p-5 md:p-7 ${m.role === 'user' ? 'message-user' : 'message-model'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
                        {m.role === 'user' ? userName : 'Pakoda Sensei'}
                      </span>
                      {m.role === 'model' && (
                        <div className={`w-1.5 h-1.5 rounded-full ${m.emotion === Emotion.SAVAGE ? 'bg-mist' : m.emotion === Emotion.ANGRY ? 'bg-coralDusk' : 'bg-slateInk/20'}`} />
                      )}
                    </div>
                    <p className={`text-base md:text-lg leading-relaxed ${m.role === 'model' && m.emotion === Emotion.ANGRY ? 'text-coralDusk font-medium' : 'text-slateInk'}`}>
                      {m.text}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 items-center text-[10px] font-bold uppercase tracking-widest text-slateInk/20 px-2 animate-pulse">
                  <div className="w-1 h-1 rounded-full bg-slateInk/20"></div>
                  Generating roasting sequence...
                </div>
              )}
            </div>
          </div>

          {/* Action Bar - Clean and Balanced */}
          <div className="p-8 md:p-10 bg-gallery/30 border-t border-slateInk/5">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {["Roast my soul", "Is this real life?", "Say something stoic", "Help me, sensei"].map(chip => (
                  <button 
                    key={chip} 
                    onClick={() => handleSend(chip)}
                    disabled={loading || chaiLevel <= 0}
                    className="px-5 py-2.5 bg-paper border border-slateInk/5 rounded-full text-[10px] font-bold uppercase tracking-wider text-slateInk/50 hover:text-coralDusk hover:border-coralDusk/20 transition-all whitespace-nowrap shadow-sm disabled:opacity-20"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              
              <div className="input-wrapper flex items-center p-1.5 pl-8 pr-1.5">
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Enter your query, mortal..."
                  className="flex-1 bg-transparent border-none outline-none text-base font-medium py-3 placeholder:text-slateInk/20"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim() || chaiLevel <= 0}
                  className="w-14 h-14 editorial-button flex items-center justify-center disabled:opacity-10"
                  aria-label="Submit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Minimal and Sophisticated */}
      <footer className="px-12 py-6 flex items-center justify-between border-t border-slateInk/5 bg-paper/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase opacity-20 tracking-[0.3em]">Sensei Engine v4.0</span>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex gap-1.5">
             {[...Array(5)].map((_, i) => (
               <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i < chaiLevel ? 'bg-coralDusk' : 'bg-slateInk/5'}`} />
             ))}
           </div>
           <span className="text-[10px] font-bold uppercase tracking-widest text-slateInk/30">Chai Reserves</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
