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

  // Micro-interaction engine: Triggers subtle animations at random intervals
  useEffect(() => {
    const triggerRandomAction = () => {
      const actions: MicroAction[] = ['blink', 'ear-twitch', 'eye-glance', 'tail-flick'];
      let weights = [0.3, 0.2, 0.3, 0.2]; // Neutral weights

      if (emotion === Emotion.ANGRY) {
        weights = [0.1, 0.5, 0.1, 0.3]; // High twitch/tail-flick frequency
      } else if (emotion === Emotion.ANNOYED) {
        weights = [0.3, 0.1, 0.5, 0.1]; // Frequent glances (looking away)
      } else if (emotion === Emotion.SAVAGE) {
        weights = [0.2, 0.1, 0.1, 0.6]; // Dominant tail flicking
      } else if (emotion === Emotion.CONFIDENT) {
        weights = [0.4, 0.1, 0.2, 0.3]; // Relaxed blinks and tail
      }

      // Weighted random selection
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
        // Randomize the glance destination
        const mult = emotion === Emotion.ANNOYED ? 1.5 : 1.0;
        setGlancePos({
          x: (Math.random() - 0.5) * 15 * mult,
          y: (Math.random() - 0.5) * 10 * mult
        });
      }

      setActiveAction(selectedAction);

      // Reset action after its short CSS animation completes
      const duration = selectedAction === 'blink' ? 150 : 800;
      setTimeout(() => setActiveAction('none'), duration);

      // Schedule next action with emotional influence on pacing
      const baseDelay = emotion === Emotion.ANGRY ? 500 : emotion === Emotion.ANNOYED ? 3000 : 1500;
      const randomDelay = Math.random() * (emotion === Emotion.ANGRY ? 800 : 4000);
      
      timerRef.current = window.setTimeout(triggerRandomAction, baseDelay + randomDelay);
    };

    timerRef.current = window.setTimeout(triggerRandomAction, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [emotion]);

  const sizeClasses = { 
    sm: 'w-24 h-24 sm:w-28 sm:h-28 lg:w-16 lg:h-16', 
    md: 'w-56 h-56 lg:w-64 lg:h-64', 
    lg: 'w-72 h-72 sm:w-96 sm:h-96 md:w-[450px] md:h-[450px] lg:w-[380px] lg:h-[380px]' 
  };

  const containerClass = useMemo(() => {
    let base = `${sizeClasses[size]} transition-all duration-700 relative overflow-visible origin-bottom group cursor-help `;
    
    if (isLoading && !isTalking && emotion === Emotion.NEUTRAL) {
      base += "animate-thinking-float ";
    } else if (!isHovered) {
      switch (emotion) {
        case Emotion.ANNOYED: base += "animate-breath-annoyed grayscale-[0.2] scale-[0.98] "; break;
        case Emotion.CONFIDENT: base += "animate-breath-confident "; break;
        case Emotion.ANGRY: base += "animate-jitter brightness-[1.1] "; break;
        case Emotion.SAVAGE: base += "animate-float-savage "; break;
        default: base += "animate-breath-neutral animate-sway-neutral "; break;
      }
    }

    if (isTalking && emotion === Emotion.ANGRY) {
        base += "animate-explosive-vibration ";
    }

    if (isHovered) {
      switch (emotion) {
        case Emotion.NEUTRAL: base += "animate-hover-react-neutral "; break;
        case Emotion.ANNOYED: base += "animate-hover-react-annoyed "; break;
        case Emotion.CONFIDENT: base += "animate-hover-react-confident "; break;
        case Emotion.SAVAGE: base += "animate-hover-react-savage "; break;
        case Emotion.ANGRY: base += "animate-hover-react-angry "; break;
      }
    }

    return base;
  }, [emotion, isLoading, isTalking, size, isHovered]);

  const renderEyebrows = () => {
    let pathClass = "transition-all duration-500 ";
    if (activeAction === 'ear-twitch' && emotion !== Emotion.ANGRY) pathClass += "translate-y-[-1px] ";

    switch (emotion) {
      case Emotion.ANNOYED: return (
        <g className={pathClass + "translate-y-2"}>
          <path d="M 55 98 Q 65 92, 75 98" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M 125 98 Q 135 92, 145 98" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
        </g>
      );
      case Emotion.ANGRY: return (
        <g className="transition-all duration-75 origin-center">
          <path d="M 30 85 L 85 115" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
          <path d="M 170 85 L 115 115" stroke="currentColor" strokeWidth="16" strokeLinecap="round" />
        </g>
      );
      case Emotion.SAVAGE: return (
        <g className={pathClass + "origin-center scale-x-110 translate-y-[-5px]"}>
          <path d="M 35 105 Q 65 75, 95 105" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none" />
          <path d="M 105 105 Q 135 75, 165 105" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none" />
        </g>
      );
      case Emotion.CONFIDENT: return (
        <g className={pathClass + "origin-center translate-y-[-12px]"}>
          <path d="M 45 85 Q 65 72, 85 85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M 115 85 Q 135 72, 155 85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
        </g>
      );
      default: return (
        <g className={pathClass + "opacity-30 origin-center"}>
          <path d="M 55 95 Q 65 88, 75 95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 125 95 Q 135 88, 145 95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      );
    }
  };

  const renderEyes = () => {
    if (isLoading && !isTalking && emotion === Emotion.NEUTRAL) return (
      <g className="animate-pulse opacity-20">
        <rect x="55" y="118" width="25" height="4" rx="2" fill="currentColor" />
        <rect x="120" y="118" width="25" height="4" rx="2" fill="currentColor" />
      </g>
    );

    if (activeAction === 'blink' && !isTalking && emotion !== Emotion.ANGRY) return (
      <g className="transition-all duration-75">
        <path d="M 50 120 L 80 120" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        <path d="M 120 120 L 150 120" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
      </g>
    );

    const isAngry = emotion === Emotion.ANGRY;
    const isSavage = emotion === Emotion.SAVAGE;
    const isAnnoyed = emotion === Emotion.ANNOYED;
    const radius = isAngry ? 26 : isSavage ? 14 : isAnnoyed ? 14 : emotion === Emotion.CONFIDENT ? 18 : 16;
    
    let eyeGroupClass = "transition-all duration-300 origin-center ";
    let eyeStyle: React.CSSProperties = {};
    
    if (activeAction === 'eye-glance') {
      eyeGroupClass += "animate-eye-glance-once ";
      eyeStyle = { '--glance-xy': `translate(${glancePos.x}px, ${glancePos.y}px)` } as React.CSSProperties;
    }

    return (
      <g className={eyeGroupClass} style={eyeStyle}>
        <circle cx="65" cy="120" r={radius} fill="currentColor" className="transition-all duration-500" />
        <circle cx="135" cy="120" r={radius} fill="currentColor" className="transition-all duration-500" />
        
        <g className={`${isAngry ? 'animate-none' : 'animate-eye-drift'}`}>
          <g className="animate-pupil-drift">
            <circle cx="67" cy="116" r={isAngry ? 9 : 7} fill={isAngry ? "#ff1111" : "white"} />
            <circle cx="137" cy="116" r={isAngry ? 9 : 7} fill={isAngry ? "#ff1111" : "white"} />
            {!isAngry && (
               <>
                 <circle cx="63" cy="113" r="2.5" fill="white" fillOpacity="0.8" />
                 <circle cx="133" cy="113" r="2.5" fill="white" fillOpacity="0.8" />
               </>
            )}
          </g>
        </g>
      </g>
    );
  };

  const renderMouth = () => {
    if (isTalking) return (
      <g className="animate-pulse origin-center translate-y-1">
        <path d="M 80 165 Q 100 205 120 165" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" />
      </g>
    );
    
    switch (emotion) {
      case Emotion.ANNOYED: return <path d="M 90 178 L 110 178" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />;
      case Emotion.ANGRY: return <path d="M 60 195 Q 100 135 140 195" stroke="currentColor" strokeWidth="18" fill="none" strokeLinecap="round" />;
      case Emotion.SAVAGE: return <path d="M 85 168 Q 110 185 130 162" stroke="currentColor" strokeWidth="9" fill="none" strokeLinecap="round" />;
      case Emotion.CONFIDENT: return <path d="M 80 165 Q 90 180 100 165 Q 110 180 120 165" stroke="currentColor" strokeWidth="11" fill="none" strokeLinecap="round" />;
      default: return <path d="M 88 165 Q 94 176 100 165 Q 106 176 112 165" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" className="transition-all duration-500" />;
    }
  };

  return (
    <div 
      className={containerClass + " text-black dark:text-white"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg viewBox="0 0 200 230" className="w-full h-full drop-shadow-[0_25px_50px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_25px_50px_rgba(255,255,255,0.05)] overflow-visible transition-all duration-500 ease-in-out">
         {/* Tail Group with JS-triggered flick */}
         <g className={`${emotion === Emotion.ANGRY ? 'animate-jitter' : activeAction === 'tail-flick' ? 'animate-tail-flick-once' : ''} origin-right`}>
            <path d="M 160 170 Q 210 130, 195 185 Q 188 210, 175 190" fill="none" stroke="currentColor" strokeWidth="20" strokeLinecap="round" 
                  className="transition-all duration-700" 
                  style={{ filter: emotion === Emotion.SAVAGE ? 'url(#glitch)' : 'none' }} />
         </g>
         
         {/* Ears Group with JS-triggered twitch */}
         <g className={`${activeAction === 'ear-twitch' ? 'animate-ear-twitch-once' : ''} origin-bottom`}>
           <path d="M 45 60 L 25 10 Q 55 -5, 80 30 L 75 55" fill={emotion === Emotion.ANGRY ? '#200' : 'currentColor'} stroke="currentColor" strokeWidth="12" 
                 className={`transition-all duration-500 ${emotion === Emotion.ANNOYED ? 'rotate-[-25deg] opacity-70' : ''}`} />
           <path d="M 120 55 L 135 10 Q 165 -5, 175 60 L 155 65" fill={emotion === Emotion.ANGRY ? '#200' : 'currentColor'} stroke="currentColor" strokeWidth="12" 
                 className={`transition-all duration-500 ${emotion === Emotion.ANNOYED ? 'rotate-[25deg] opacity-70' : ''}`} />
         </g>
         
         <path 
            d="M 45 60 Q 100 40, 155 60 Q 185 75, 185 125 L 185 175 Q 190 190, 175 200 Q 165 210, 160 195 L 160 215 Q 160 225, 140 225 L 125 225 Q 110 225, 110 210 L 90 210 Q 90 225, 70 225 L 55 225 Q 35 225, 35 210 L 35 190 Q 30 205, 15 195 Q 5 185, 15 170 L 15 120 Q 15 70, 45 60 Z" 
            stroke="currentColor" 
            strokeWidth="14" 
            className={`transition-all duration-1000 ${emotion === Emotion.ANGRY ? 'fill-red-950/40' : 'fill-white dark:fill-charcoal/90'}`} 
         />
         
         {renderEyebrows()}
         {renderEyes()}
         {renderMouth()}

         <path d="M 100 166 Q 95 160, 100 154 Q 105 160, 100 166" fill={emotion === Emotion.ANGRY ? '#ff0000' : 'currentColor'} className="transition-all duration-300 origin-center" />
      
         <g className="opacity-10 dark:opacity-20 pointer-events-none">
            <line x1="40" y1="150" x2="10" y2="145" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="40" y1="160" x2="5" y2="160" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="160" y1="150" x2="190" y2="145" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="160" y1="160" x2="195" y2="160" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
         </g>

         <defs>
            <filter id="glitch">
               <feOffset in="SourceGraphic" dx="-2" dy="0" result="off1" />
               <feOffset in="SourceGraphic" dx="2" dy="0" result="off2" />
               <feColorMatrix in="off1" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
               <feColorMatrix in="off2" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="blue" />
               <feBlend in="red" in2="blue" mode="screen" />
            </filter>
         </defs>
      </svg>
      
      <div className={`absolute inset-0 -z-10 blur-[100px] sm:blur-[140px] rounded-full scale-[1.5] transition-all duration-1000 
        ${emotion === Emotion.ANGRY ? 'bg-red-500/30' : 
          emotion === Emotion.SAVAGE ? 'bg-cyan-400/20' : 
          emotion === Emotion.CONFIDENT ? 'bg-yellow-400/15' : 'bg-transparent'}
        ${isHovered ? 'scale-[2] opacity-100' : 'opacity-40'}`} />
    </div>
  );
};

export default Cattu;