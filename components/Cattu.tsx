
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Emotion } from '../types';

interface CattuProps {
  emotion: Emotion;
  isTalking: boolean;
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
}

type MicroAction = 'none' | 'blink' | 'ear-twitch' | 'eye-glance' | 'tail-flick' | 'yawn';

const Cattu: React.FC<CattuProps> = ({ emotion, isTalking, isLoading, size = 'lg' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeAction, setActiveAction] = useState<MicroAction>('none');
  const [glancePos, setGlancePos] = useState({ x: 0, y: 0 });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const triggerRandomAction = () => {
      const actions: MicroAction[] = ['blink', 'ear-twitch', 'eye-glance', 'tail-flick', 'yawn'];
      let weights = [0.3, 0.15, 0.35, 0.15, 0.05]; 

      if (emotion === Emotion.ANGRY) {
        weights = [0.1, 0.4, 0.1, 0.4, 0.0]; 
      } else if (emotion === Emotion.ANNOYED) {
        weights = [0.2, 0.1, 0.5, 0.1, 0.1]; 
      }

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
        const mult = emotion === Emotion.ANNOYED ? 2.0 : 1.0;
        setGlancePos({
          x: (Math.random() - 0.5) * 15 * mult,
          y: (Math.random() - 0.5) * 8 * mult
        });
      }

      setActiveAction(selectedAction);
      const duration = selectedAction === 'yawn' ? 1200 : selectedAction === 'blink' ? 150 : 800;
      setTimeout(() => setActiveAction('none'), duration);

      const baseDelay = isTalking ? 5000 : 1500;
      timerRef.current = window.setTimeout(triggerRandomAction, baseDelay + Math.random() * 3000);
    };

    timerRef.current = window.setTimeout(triggerRandomAction, 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [emotion, isTalking]);

  const sizeClasses = { 
    sm: 'w-24 h-24 lg:w-16 lg:h-16', 
    md: 'w-56 h-56 lg:w-64 lg:h-64', 
    lg: 'w-72 h-72 md:w-[450px] md:h-[450px] lg:w-[380px] lg:h-[380px]' 
  };

  const emotionClass = useMemo(() => {
    let classes = "";
    if (isHovered) {
      classes += "scale-[1.02] ";
      if (emotion === Emotion.ANGRY) classes += "animate-shake-hard ";
    } else {
      switch (emotion) {
        case Emotion.ANNOYED: classes += "animate-breath-annoyed opacity-80 "; break;
        case Emotion.ANGRY: classes += "animate-jitter saturate-[1.3] "; break;
        case Emotion.SAVAGE: classes += "animate-float-savage "; break;
        case Emotion.CONFIDENT: classes += "animate-breath-confident "; break;
        default: classes += "animate-breath-neutral animate-sway-neutral "; break;
      }
    }
    return classes;
  }, [emotion, isHovered]);

  const renderEyes = () => {
    if (activeAction === 'blink' && !isTalking) {
      return (
        <g className="transition-all duration-75">
          <path d="M 50 120 L 80 120" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          <path d="M 120 120 L 150 120" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        </g>
      );
    }

    const isAngry = emotion === Emotion.ANGRY;
    const isAnnoyed = emotion === Emotion.ANNOYED;
    const radius = isAngry ? 24 : isAnnoyed ? 12 : 16;
    
    let eyeStyle: React.CSSProperties = {};
    if (activeAction === 'eye-glance') {
      eyeStyle = { transform: `translate(${glancePos.x}px, ${glancePos.y}px)` };
    }

    return (
      <g style={eyeStyle} className="transition-transform duration-300">
        <circle cx="65" cy="120" r={radius} fill="currentColor" />
        <circle cx="135" cy="120" r={radius} fill="currentColor" />
        <circle cx="67" cy="116" r={isAngry ? 8 : 6} fill={isAngry ? "#ff0000" : "white"} />
        <circle cx="137" cy="116" r={isAngry ? 8 : 6} fill={isAngry ? "#ff0000" : "white"} />
      </g>
    );
  };

  const renderMouth = () => {
    if (isTalking) return <path d="M 85 170 Q 100 200 115 170" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" className="animate-pulse" />;
    if (activeAction === 'yawn') return <circle cx="100" cy="175" r="12" fill="none" stroke="currentColor" strokeWidth="8" className="animate-pulse" />;
    
    switch (emotion) {
      case Emotion.ANNOYED: return <path d="M 90 180 L 110 180" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />;
      case Emotion.ANGRY: return <path d="M 70 190 Q 100 150 130 190" stroke="currentColor" strokeWidth="14" fill="none" strokeLinecap="round" />;
      case Emotion.SAVAGE: return <path d="M 85 170 Q 110 185 125 165" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />;
      case Emotion.CONFIDENT: return <path d="M 80 170 Q 100 185 120 170" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" />;
      default: return <path d="M 90 170 Q 100 178 110 170" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />;
    }
  };

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center relative group`}>
      <div className={`w-full h-full ${emotionClass} transition-all duration-700`}>
        <svg viewBox="0 0 200 230" className="w-full h-full text-black dark:text-white drop-shadow-xl overflow-visible">
          {/* Ear Micro-actions */}
          <g className={`${activeAction === 'ear-twitch' ? 'animate-ear-twitch-once' : ''} origin-bottom`}>
            <path d="M 45 60 L 25 10 Q 55 -5, 80 30" fill="currentColor" stroke="currentColor" strokeWidth="10" className={emotion === Emotion.ANNOYED ? 'rotate-[-20deg]' : ''} />
            <path d="M 120 55 L 135 10 Q 165 -5, 175 60" fill="currentColor" stroke="currentColor" strokeWidth="10" className={emotion === Emotion.ANNOYED ? 'rotate-[20deg]' : ''} />
          </g>
          
          {/* Face Base */}
          <path d="M 45 60 Q 100 40, 155 60 Q 185 75, 185 125 L 185 175 Q 160 215, 100 215 Q 40 215, 15 175 L 15 125 Q 15 75, 45 60" 
                fill="white" fillOpacity="0.05" stroke="currentColor" strokeWidth="12" className="dark:fill-zinc-900" />
          
          {renderEyes()}
          {renderMouth()}
          
          {/* Nose */}
          <path d="M 98 160 Q 100 155, 102 160" fill="currentColor" />
        </svg>
      </div>
      <div className={`absolute inset-0 -z-10 blur-[100px] rounded-full scale-[1.3] transition-all duration-1000 
        ${emotion === Emotion.ANGRY ? 'bg-red-500/10' : emotion === Emotion.SAVAGE ? 'bg-cyan-500/10' : 'bg-white/5'}`} />
    </div>
  );
};

export default Cattu;
