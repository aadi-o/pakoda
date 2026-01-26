
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
  const [activeAction, setActiveAction] = useState<MicroAction>('none');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const triggerRandomAction = () => {
      const actions: MicroAction[] = ['blink', 'ear-twitch', 'eye-glance', 'tail-flick'];
      const random = Math.random();
      let selected: MicroAction = 'none';
      if (random < 0.2) selected = 'blink';
      else if (random < 0.4) selected = 'ear-twitch';
      else if (random < 0.6) selected = 'tail-flick';
      
      setActiveAction(selected);
      setTimeout(() => setActiveAction('none'), 500);
      timerRef.current = window.setTimeout(triggerRandomAction, 3000 + Math.random() * 5000);
    };

    timerRef.current = window.setTimeout(triggerRandomAction, 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const sizeClasses = { 
    sm: 'w-24 h-24', 
    md: 'w-48 h-48 lg:w-64 lg:h-64', 
    lg: 'w-72 h-72 md:w-[400px] md:h-[400px]' 
  };

  const animationClass = useMemo(() => {
    switch (emotion) {
      case Emotion.ANGRY: return "animate-shake";
      case Emotion.SAVAGE: return "animate-bounce";
      case Emotion.ANNOYED: return "opacity-80 scale-95 transition-transform duration-500";
      default: return "animate-pulse";
    }
  }, [emotion]);

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center relative`}>
      <div className={`w-full h-full transition-all duration-300 ${animationClass}`}>
        <svg viewBox="0 0 200 230" className="w-full h-full drop-shadow-2xl">
          {/* Persona Accents */}
          {emotion === Emotion.SAVAGE && (
            <g transform="translate(40, 100)" className="z-20 text-black">
              <rect width="120" height="30" rx="4" fill="currentColor" />
              <rect x="10" y="5" width="40" height="20" rx="2" fill="#111" />
              <rect x="70" y="5" width="40" height="20" rx="2" fill="#111" />
              <path d="M 50 15 L 70 15" stroke="currentColor" strokeWidth="4" />
            </g>
          )}

          {/* Body/Face */}
          <path 
            d="M 45 60 Q 100 40, 155 60 Q 185 75, 185 125 L 185 175 Q 160 215, 100 215 Q 40 215, 15 175 L 15 125 Q 15 75, 45 60" 
            fill="currentColor" 
            className={`${emotion === Emotion.ANGRY ? 'text-toxicRed' : emotion === Emotion.SAVAGE ? 'text-streetCyan' : 'text-white'} opacity-10 transition-colors duration-500`}
          />
          <path 
            d="M 45 60 Q 100 40, 155 60 Q 185 75, 185 125 L 185 175 Q 160 215, 100 215 Q 40 215, 15 175 L 15 125 Q 15 75, 45 60" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="12"
            className={`${emotion === Emotion.ANGRY ? 'text-toxicRed' : emotion === Emotion.SAVAGE ? 'text-streetCyan' : 'text-white'} transition-colors duration-500`}
          />

          {/* Ears */}
          <g className={activeAction === 'ear-twitch' ? 'animate-ear-twitch-once' : ''}>
            <path d="M 45 60 L 25 10 Q 55 -5, 80 30" fill="currentColor" className="text-current transition-colors duration-500" />
            <path d="M 120 55 L 135 10 Q 165 -5, 175 60" fill="currentColor" className="text-current transition-colors duration-500" />
          </g>

          {/* Eyes */}
          {activeAction !== 'blink' && (
            <g className={`${isTalking ? 'animate-pulse' : ''}`}>
              <circle cx="65" cy="120" r="16" fill="currentColor" className="text-current transition-colors duration-500" />
              <circle cx="135" cy="120" r="16" fill="currentColor" className="text-current transition-colors duration-500" />
              
              {/* Pupils with specific ANGRY flicker */}
              <circle 
                cx="67" cy="116" r="6" 
                fill={emotion === Emotion.ANGRY ? '#ef4444' : 'black'} 
                className={emotion === Emotion.ANGRY ? 'animate-eye-flicker' : 'transition-colors duration-500'} 
              />
              <circle 
                cx="137" cy="116" r="6" 
                fill={emotion === Emotion.ANGRY ? '#ef4444' : 'black'} 
                className={emotion === Emotion.ANGRY ? 'animate-eye-flicker' : 'transition-colors duration-500'} 
              />
            </g>
          )}

          {/* Mouth */}
          <g transform="translate(100, 170)">
            {isTalking ? (
              <path d="M -20 0 Q 0 20 20 0" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" className="transition-colors duration-500" />
            ) : (
              <path d="M -15 5 L 15 5" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="transition-colors duration-500" />
            )}
          </g>
        </svg>
      </div>
      
      {/* Background Glow */}
      <div className={`absolute -z-10 w-[150%] h-[150%] rounded-full blur-[120px] transition-all duration-1000
        ${emotion === Emotion.ANGRY ? 'bg-toxicRed opacity-40' : emotion === Emotion.SAVAGE ? 'bg-streetCyan opacity-20' : 'bg-white opacity-10'}`} 
      />
    </div>
  );
};

export default Cattu;
