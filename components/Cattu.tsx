import React, { useMemo } from 'react';
import { Emotion } from '../types';

interface CattuProps {
  emotion: Emotion;
  isTalking: boolean;
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Cattu: React.FC<CattuProps> = ({ emotion, isTalking, isLoading, size = 'lg' }) => {
  const sizeClasses = { 
    sm: 'w-14 h-14 lg:w-16 lg:h-16', 
    md: 'w-40 h-40 lg:w-56 lg:h-56', 
    lg: 'w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-[380px] lg:h-[380px]' 
  };

  const containerClass = useMemo(() => {
    let base = `${sizeClasses[size]} transition-all duration-1000 relative overflow-visible origin-bottom `;
    
    // Base Animations
    if (isLoading && !isTalking && emotion === Emotion.NEUTRAL) {
      base += "animate-thinking-float ";
    } else {
      switch (emotion) {
        case Emotion.ANNOYED: base += "animate-breath-annoyed grayscale-[0.2] opacity-80 "; break;
        case Emotion.CONFIDENT: base += "animate-breath-confident "; break;
        case Emotion.ANGRY: base += "animate-intense-shake brightness-[1.2] contrast-[1.1] "; break;
        case Emotion.SAVAGE: base += "animate-status-glitch scale-[1.01] "; break;
        default: base += "animate-breath-neutral animate-sway-neutral "; break;
      }
    }

    // Interactive Unique Hover Reactions (Only for larger sizes or desktop-like interactions)
    if (!isLoading && !isTalking) {
      switch (emotion) {
        case Emotion.ANGRY: 
          base += "group-hover:animate-hover-angry group-hover:drop-shadow-[0_0_35px_rgba(255,0,0,0.6)] "; 
          break;
        case Emotion.CONFIDENT: 
          base += "group-hover:animate-hover-confident group-hover:drop-shadow-[0_0_25px_rgba(255,255,0,0.2)] "; 
          break;
        case Emotion.ANNOYED: 
          base += "group-hover:animate-hover-annoyed "; 
          break;
        case Emotion.SAVAGE: 
          base += "group-hover:animate-hover-savage group-hover:drop-shadow-[0_0_20px_rgba(0,255,255,0.3)] "; 
          break;
        default: 
          base += "group-hover:animate-hover-neutral "; 
          break;
      }
    }

    return base;
  }, [emotion, isLoading, isTalking, size]);

  const renderEyebrows = () => {
    switch (emotion) {
      case Emotion.ANNOYED: return (
        <g className="transition-all duration-700 group-hover:translate-y-2">
          <path d="M 55 98 Q 65 95, 75 98" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          <path d="M 125 98 Q 135 95, 145 98" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </g>
      );
      case Emotion.ANGRY: return (
        <g className="transition-all duration-150 animate-intense-shake origin-center">
          <path d="M 20 70 L 90 125" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
          <path d="M 180 70 L 110 125" stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
        </g>
      );
      case Emotion.SAVAGE: return (
        <g className="transition-all duration-500 origin-center animate-status-glitch">
          <path d="M 35 105 Q 65 70, 95 105" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
          <path d="M 105 105 Q 135 70, 165 105" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
        </g>
      );
      case Emotion.CONFIDENT: return (
        <g className="transition-all duration-500 group-hover:-translate-y-5">
          <path d="M 45 80 Q 65 70, 85 80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <path d="M 115 80 Q 135 70, 155 80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        </g>
      );
      default: return (
        <g className="opacity-40 transition-all duration-500 group-hover:scale-x-125 origin-center">
          <path d="M 55 95 Q 65 88, 75 95" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 125 95 Q 135 88, 145 95" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    }
  };

  const renderEyes = () => {
    if (isLoading && !isTalking && emotion === Emotion.NEUTRAL) return (
      <g className="animate-pulse opacity-30">
        <rect x="55" y="118" width="25" height="5" rx="2" fill="currentColor" />
        <rect x="120" y="118" width="25" height="5" rx="2" fill="currentColor" />
      </g>
    );
    const isAngry = emotion === Emotion.ANGRY;
    const isSavage = emotion === Emotion.SAVAGE;
    const r = isAngry ? 26 : isSavage ? 12 : emotion === Emotion.ANNOYED ? 13 : emotion === Emotion.CONFIDENT ? 16 : 14;
    
    return (
      <g className={`transition-all duration-700 ${isAngry ? 'animate-intense-shake' : ''}`}>
        <circle cx="65" cy="120" r={r} fill="currentColor" />
        <g className={!isAngry && !isLoading && !isTalking ? 'animate-eye-glance-spontaneous' : ''}>
           <circle cx="68" cy="115" r={isAngry ? 6 : 7} fill={isAngry ? "red" : "white"} className="transition-transform group-hover:scale-150 origin-center" />
        </g>
        <circle cx="135" cy="120" r={r} fill="currentColor" />
        <g className={!isAngry && !isLoading && !isTalking ? 'animate-eye-glance-spontaneous' : ''} style={{ animationDelay: '0.15s' }}>
           <circle cx="138" cy="115" r={isAngry ? 6 : 7} fill={isAngry ? "red" : "white"} className="transition-transform group-hover:scale-150 origin-center" />
        </g>
      </g>
    );
  };

  const renderMouth = () => {
    if (isTalking) return (
      <g className="animate-pulse">
        <path d="M 80 165 Q 100 215 120 165" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round" />
      </g>
    );
    if (isLoading && emotion === Emotion.NEUTRAL) return null;
    
    switch (emotion) {
      case Emotion.ANNOYED: return <path d="M 80 170 L 120 170" stroke="currentColor" strokeWidth="10" strokeLinecap="round" className="group-hover:scale-x-150 origin-center transition-transform" />;
      case Emotion.ANGRY: return <path d="M 55 200 Q 100 120 145 200" stroke="currentColor" strokeWidth="22" fill="none" strokeLinecap="round" className="animate-intense-shake group-hover:scale-y-110" />;
      case Emotion.SAVAGE: return <path d="M 65 160 Q 105 215 145 160" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" className="animate-status-glitch group-hover:translate-x-3" />;
      case Emotion.CONFIDENT: return <path d="M 80 155 Q 100 168, 120 155" stroke="currentColor" strokeWidth="9" strokeLinecap="round" className="group-hover:translate-y-3 transition-transform" />;
      default: return <path d="M 85 155 Q 100 175 115 155" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" className="group-hover:scale-y-175 origin-top transition-transform" />;
    }
  };

  return (
    <div className={containerClass + " text-black dark:text-white group cursor-help"}>
      <svg viewBox="0 0 200 230" className="w-full h-full drop-shadow-2xl overflow-visible transition-all duration-700 ease-in-out">
         {/* Tail with Dynamic Speed */}
         <path d="M 160 170 Q 200 140, 190 180 Q 185 200, 175 190" fill="none" stroke="currentColor" strokeWidth="22" strokeLinecap="round" 
               className={`${emotion === Emotion.ANGRY ? 'animate-tail-angry' : 'animate-tail-flick-spontaneous'} group-hover:scale-x-125 origin-right transition-transform`} 
               style={{ animationDuration: (emotion === Emotion.ANGRY || emotion === Emotion.SAVAGE) ? '0.2s' : '1.5s' }} />
         
         {/* Ears with Reactive Hover Positioning */}
         <path d="M 45 60 L 30 15 Q 55 0, 80 30 L 75 55" fill={emotion === Emotion.ANGRY ? '#1a0000' : 'currentColor'} stroke="currentColor" strokeWidth="12" 
               className={`transition-all duration-700 animate-ear-twitch-spontaneous ${emotion === Emotion.ANGRY ? 'rotate-[-45deg] translate-x-[-20px]' : ''} group-hover:rotate-[-40deg] group-hover:-translate-y-4 opacity-90`} />
         <path d="M 120 55 L 130 15 Q 160 0, 170 60 L 155 65" fill={emotion === Emotion.ANGRY ? '#1a0000' : 'currentColor'} stroke="currentColor" strokeWidth="12" 
               className={`transition-all duration-700 animate-ear-twitch-spontaneous ${emotion === Emotion.ANGRY ? 'rotate-[45deg] translate-x-[20px]' : ''} group-hover:rotate-[40deg] group-hover:-translate-y-4 opacity-90`} style={{ animationDelay: '6s' }} />
         
         {/* Body */}
         <path 
            d="M 45 60 Q 100 40, 155 60 Q 180 70, 180 120 L 180 170 Q 185 185, 175 195 Q 165 205, 160 190 L 160 210 Q 160 225, 140 225 L 125 225 Q 110 225, 110 210 L 90 210 Q 90 225, 70 225 L 55 225 Q 35 225, 35 210 L 35 190 Q 30 205, 20 195 Q 10 185, 15 170 L 15 120 Q 15 70, 45 60 Z" 
            stroke="currentColor" 
            strokeWidth="14" 
            className={`transition-all duration-700 group-hover:stroke-[16px] ${emotion === Emotion.ANGRY ? 'fill-red-950/30' : 'fill-white dark:fill-charcoal'}`} 
         />
         
         {renderEyebrows()}
         {renderEyes()}
         {renderMouth()}
         <path d="M 100 190 Q 92 180, 100 168 Q 108 180, 100 190" fill={emotion === Emotion.ANGRY ? 'red' : 'currentColor'} className="transition-all scale-110 origin-center group-hover:scale-150" />
      </svg>
      {/* Immersive Aura */}
      <div className={`absolute inset-0 -z-10 blur-[120px] rounded-full scale-[1.6] transition-all duration-1000 
        ${emotion === Emotion.ANGRY ? 'bg-red-500/15 opacity-100' : 
          emotion === Emotion.SAVAGE ? 'bg-cyan-500/5 opacity-100' : 
          emotion === Emotion.CONFIDENT ? 'bg-yellow-500/5 opacity-100' : 'bg-transparent opacity-0'}`} />
    </div>
  );
};

export default Cattu;