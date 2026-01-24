import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Emotion } from '../types';

interface CattuProps {
  emotion: Emotion;
  isTalking: boolean;
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
}

type MicroAction = 'none' | 'blink' | 'ear-twitch' | 'eye-glance' | 'tail-flick';

const Cattu: React.FC<CattuProps> = ({ emotion, isTalking, isLoading, size = 'lg' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeAction, setActiveAction] = useState<MicroAction>('none');
  const [glancePos, setGlancePos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const triggerRandomAction = () => {
      const actions: MicroAction[] = ['blink', 'ear-twitch', 'eye-glance', 'tail-flick'];
      let weights = [0.3, 0.2, 0.3, 0.2];

      if (emotion === Emotion.ANGRY) weights = [0.1, 0.5, 0.1, 0.3];
      else if (emotion === Emotion.ANNOYED) weights = [0.3, 0.1, 0.5, 0.1];
      else if (emotion === Emotion.SAVAGE) weights = [0.2, 0.1, 0.1, 0.6];

      const random = Math.random();
      let cumulative = 0;
      let selectedAction: MicroAction = 'none';
      for (let i = 0; i < actions.length; i++) {
        cumulative += weights[i];
        if (random < cumulative) {
          selectedAction = actions[i];
          break;
        }
      }

      if (selectedAction === 'eye-glance') {
        setGlancePos({ x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 8 });
      }

      setActiveAction(selectedAction);
      setTimeout(() => setActiveAction('none'), selectedAction === 'blink' ? 120 : 700);
      
      const delay = emotion === Emotion.ANGRY ? 600 : 2500;
      timerRef.current = window.setTimeout(triggerRandomAction, delay + Math.random() * 2000);
    };

    timerRef.current = window.setTimeout(triggerRandomAction, 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [emotion]);

  const sizeClasses = { 
    sm: 'w-16 h-16', 
    md: 'w-48 h-48', 
    lg: 'w-64 h-64 lg:w-80 lg:h-80' 
  };

  const emotionClass = useMemo(() => {
    if (isHovered) {
      switch (emotion) {
        case Emotion.ANNOYED: return "rotate-[-2deg] scale-[0.98]";
        case Emotion.ANGRY: return "animate-shake-hard";
        default: return "scale-[1.02]";
      }
    }
    switch (emotion) {
      case Emotion.ANNOYED: return "animate-breath-annoyed opacity-70 grayscale-[0.3]";
      case Emotion.CONFIDENT: return "animate-breath-confident";
      case Emotion.ANGRY: return "animate-jitter saturate-[1.5]";
      case Emotion.SAVAGE: return "animate-float-savage saturate-[1.2]";
      default: return "animate-breath-neutral animate-sway-neutral";
    }
  }, [emotion, isHovered]);

  const stateClass = useMemo(() => {
    let cls = "transition-all duration-300 ";
    if (isLoading) cls += "opacity-50 blur-[1px] ";
    if (isTalking) cls += emotion === Emotion.ANGRY ? "animate-explosive-vibration " : "scale-[1.03] ";
    return cls;
  }, [isLoading, isTalking, emotion]);

  return (
    <div 
      className={`${sizeClasses[size]} relative flex items-center justify-center transition-all duration-500 cursor-crosshair`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`w-full h-full ${emotionClass}`}>
        <div className={`w-full h-full ${stateClass}`}>
          <svg viewBox="0 0 200 230" className="w-full h-full text-current drop-shadow-2xl overflow-visible">
            {/* Minimal SVG logic - keeping path structure from previous but optimized for size */}
            <g className={`${activeAction === 'tail-flick' ? 'animate-tail-flick-once' : ''} origin-right`}>
              <path d="M 160 170 Q 210 130, 195 185" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
            </g>
            <path d="M 45 60 Q 100 40, 155 60 Q 185 75, 185 125 L 185 175 Q 160 215, 100 215 Q 40 215, 15 175 L 15 125 Q 15 75, 45 60" 
                  fill="white" fillOpacity="0.03" stroke="currentColor" strokeWidth="12" className="dark:fill-zinc-900" />
            
            {/* Eyes */}
            <g transform={activeAction === 'eye-glance' ? `translate(${glancePos.x}, ${glancePos.y})` : ''} className="transition-transform duration-300">
              <circle cx="65" cy="120" r={emotion === Emotion.ANGRY ? 22 : 16} fill="currentColor" />
              <circle cx="135" cy="120" r={emotion === Emotion.ANGRY ? 22 : 16} fill="currentColor" />
              <circle cx="67" cy="116" r="6" fill={emotion === Emotion.ANGRY ? '#f00' : 'white'} />
              <circle cx="137" cy="116" r="6" fill={emotion === Emotion.ANGRY ? '#f00' : 'white'} />
            </g>
            
            {/* Mouth */}
            <path 
              d={isTalking ? "M 80 165 Q 100 200 120 165" : emotion === Emotion.ANNOYED ? "M 90 175 L 110 175" : "M 88 165 Q 100 175 112 165"} 
              stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" 
              className={isTalking ? "animate-pulse" : ""}
            />
          </svg>
        </div>
      </div>
      
      {/* Dynamic Glow */}
      <div className={`absolute inset-0 -z-10 blur-[80px] rounded-full scale-[1.4] transition-all duration-1000 
        ${emotion === Emotion.ANGRY ? 'bg-red-500/10' : 
          emotion === Emotion.SAVAGE ? 'bg-cyan-500/10' : 
          emotion === Emotion.CONFIDENT ? 'bg-yellow-500/10' : 'bg-white/5'}`} />
    </div>
  );
};

export default Cattu;