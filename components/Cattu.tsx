import React, { useMemo, useState } from 'react';
import { Emotion } from '../types';

interface CattuProps {
  emotion: Emotion;
  isTalking: boolean;
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Cattu: React.FC<CattuProps> = ({ emotion, isTalking, isLoading, size = 'lg' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const sizeClasses = { 
    sm: 'w-24 h-24 sm:w-28 sm:h-28 lg:w-16 lg:h-16', 
    md: 'w-56 h-56 lg:w-64 lg:h-64', 
    lg: 'w-72 h-72 sm:w-96 sm:h-96 md:w-[450px] md:h-[450px] lg:w-[380px] lg:h-[380px]' 
  };

  const containerClass = useMemo(() => {
    let base = `${sizeClasses[size]} transition-all duration-700 relative overflow-visible origin-bottom group cursor-help `;
    
    // Core idle behavior (only active when not hovering or for specific states)
    if (isLoading && !isTalking && emotion === Emotion.NEUTRAL) {
      base += "animate-thinking-float ";
    } else if (!isHovered) {
      switch (emotion) {
        case Emotion.ANNOYED: 
          base += "animate-breath-annoyed grayscale-[0.2] scale-[0.98] "; 
          break;
        case Emotion.CONFIDENT: 
          base += "animate-breath-confident "; 
          break;
        case Emotion.ANGRY: 
          base += "animate-jitter brightness-[1.1] "; 
          break;
        case Emotion.SAVAGE: 
          base += "animate-status-glitch animate-float-savage "; 
          break;
        default: 
          base += "animate-breath-neutral animate-sway-neutral "; 
          break;
      }
    }

    // Talking intensity
    if (isTalking && emotion === Emotion.ANGRY) {
        base += "animate-explosive-vibration ";
    }

    // Unique Hover Reaction Logic
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
    switch (emotion) {
      case Emotion.ANNOYED: return (
        <g className="transition-all duration-300 translate-y-2">
          <path d="M 55 98 Q 65 95, 75 98" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M 125 98 Q 135 95, 145 98" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </g>
      );
      case Emotion.ANGRY: return (
        <g className="transition-all duration-75 origin-center">
          <path d="M 20 70 L 90 125" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
          <path d="M 180 70 L 110 125" stroke="currentColor" strokeWidth="20" strokeLinecap="round" />
        </g>
      );
      case Emotion.SAVAGE: return (
        <g className="transition-all duration-300 origin-center scale-x-125 translate-y-[-5px]">
          <path d="M 35 105 Q 65 70, 95 105" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
          <path d="M 105 105 Q 135 70, 165 105" stroke="currentColor" strokeWidth="14" strokeLinecap="round" />
        </g>
      );
      case Emotion.CONFIDENT: return (
        <g className="transition-all duration-500 origin-center translate-y-[-10px]">
          <path d="M 45 80 Q 65 70, 85 80" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
          <path d="M 115 80 Q 135 70, 155 80" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
        </g>
      );
      default: return (
        <g className="opacity-40 transition-all duration-300 origin-center">
          <path d="M 55 95 Q 65 88, 75 95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M 125 95 Q 135 88, 145 95" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
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
    const isAnnoyed = emotion === Emotion.ANNOYED;
    const radius = isAngry ? 28 : isSavage ? 14 : isAnnoyed ? 15 : emotion === Emotion.CONFIDENT ? 18 : 16;
    
    return (
      <g className="transition-all duration-500 origin-center animate-eye-glance-spontaneous">
        {/* Sockets */}
        <circle cx="65" cy="120" r={radius} fill="currentColor" className="transition-all duration-500" />
        <circle cx="135" cy="120" r={radius} fill="currentColor" className="transition-all duration-500" />
        
        {/* Pupils */}
        <g className={`${isAngry ? 'animate-none' : 'animate-eye-drift'}`}>
          <g className="animate-pupil-drift">
            <circle cx="68" cy="115" r={isAngry ? 8 : 7} fill={isAngry ? "#ff0000" : "white"} />
            <circle cx="138" cy="115" r={isAngry ? 8 : 7} fill={isAngry ? "#ff0000" : "white"} />
            {/* Glossy shine for cuteness */}
            {!isAngry && (
               <>
                 <circle cx="63" cy="112" r="2.5" fill="white" fillOpacity="0.8" />
                 <circle cx="133" cy="112" r="2.5" fill="white" fillOpacity="0.8" />
               </>
            )}
          </g>
        </g>
      </g>
    );
  };

  const renderMouth = () => {
    if (isTalking) return (
      <g className="animate-pulse origin-center">
        <path d="M 80 165 Q 100 215 120 165" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round" />
      </g>
    );
    
    switch (emotion) {
      case Emotion.ANNOYED: 
        return <path d="M 90 175 L 110 175" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />;
      case Emotion.ANGRY: 
        return <path d="M 55 200 Q 100 120 145 200" stroke="currentColor" strokeWidth="24" fill="none" strokeLinecap="round" />;
      case Emotion.SAVAGE: 
        // Smirk
        return <path d="M 85 165 Q 105 190 125 160" stroke="currentColor" strokeWidth="10" fill="none" strokeLinecap="round" />;
      case Emotion.CONFIDENT: 
        // Puffed W
        return <path d="M 80 165 Q 90 182 100 165 Q 110 182 120 165" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round" />;
      default: 
        // Cute Mew Mouth
        return <path d="M 88 165 Q 94 178 100 165 Q 106 178 112 165" stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round" className="transition-all duration-500" />;
    }
  };

  return (
    <div 
      className={containerClass + " text-black dark:text-white"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Internal Scanline for intense emotions */}
      {(emotion === Emotion.SAVAGE || emotion === Emotion.ANGRY || isLoading) && <div className="scanline-layer text-current"></div>}

      <svg viewBox="0 0 200 230" className="w-full h-full drop-shadow-2xl overflow-visible transition-all duration-500 ease-in-out">
         {/* Tail with Spontaneous Movement */}
         <path d="M 160 170 Q 200 140, 190 180 Q 185 200, 175 190" fill="none" stroke="currentColor" strokeWidth="24" strokeLinecap="round" 
               className={`${emotion === Emotion.ANGRY ? 'animate-tail-angry' : 'animate-tail-flick-spontaneous'} origin-right transition-all`} 
               style={{ animationDuration: (emotion === Emotion.CONFIDENT) ? '3s' : (emotion === Emotion.ANNOYED) ? '1s' : '2s' }} />
         
         {/* Ears with Spontaneous Twitching */}
         <g className="animate-ear-twitch-spontaneous origin-bottom">
           <path d="M 45 60 L 30 15 Q 55 0, 80 30 L 75 55" fill={emotion === Emotion.ANGRY ? '#300' : 'currentColor'} stroke="currentColor" strokeWidth="14" 
                 className={`transition-all duration-300 ${emotion === Emotion.ANNOYED ? 'rotate-[-30deg] opacity-60' : ''}`} />
           <path d="M 120 55 L 130 15 Q 160 0, 170 60 L 155 65" fill={emotion === Emotion.ANGRY ? '#300' : 'currentColor'} stroke="currentColor" strokeWidth="14" 
                 className={`transition-all duration-300 ${emotion === Emotion.ANNOYED ? 'rotate-[30deg] opacity-60' : ''}`} />
         </g>
         
         {/* Main Body */}
         <path 
            d="M 45 60 Q 100 40, 155 60 Q 180 70, 180 120 L 180 170 Q 185 185, 175 195 Q 165 205, 160 190 L 160 210 Q 160 225, 140 225 L 125 225 Q 110 225, 110 210 L 90 210 Q 90 225, 70 225 L 55 225 Q 35 225, 35 210 L 35 190 Q 30 205, 20 195 Q 10 185, 15 170 L 15 120 Q 15 70, 45 60 Z" 
            stroke="currentColor" 
            strokeWidth="16" 
            className={`transition-all duration-500 ${emotion === Emotion.ANGRY ? 'fill-red-950/50' : 'fill-white dark:fill-charcoal'}`} 
         />
         
         {renderEyebrows()}
         {renderEyes()}
         {renderMouth()}

         {/* Nose */}
         <path d="M 100 168 Q 94 162, 100 156 Q 106 162, 100 168" fill={emotion === Emotion.ANGRY ? '#ff0000' : 'currentColor'} className="transition-all duration-300 origin-center" />
      </svg>
      
      {/* Background Glow */}
      <div className={`absolute inset-0 -z-10 blur-[130px] rounded-full scale-[1.7] transition-all duration-1000 
        ${emotion === Emotion.ANGRY ? 'bg-red-500/40' : 
          emotion === Emotion.SAVAGE ? 'bg-cyan-500/30' : 
          emotion === Emotion.CONFIDENT ? 'bg-yellow-500/25' : 'bg-transparent'}
        ${isHovered ? 'scale-[2.4] opacity-100' : 'opacity-60'}`} />
    </div>
  );
};

export default Cattu;