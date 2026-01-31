
import React from 'react';

interface BunProps {
  isVisible: boolean;
  comment: string;
}

const Bun: React.FC<BunProps> = ({ isVisible, comment }) => {
  return (
    <div 
      className={`absolute bottom-full left-12 mb-8 transition-all duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div className={`relative group flex flex-col items-center ${isVisible ? 'animate-maska-slide' : ''}`}>
        {/* Bun Sprite */}
        <div className="w-24 h-20 animate-soft-float">
          <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-lg">
            <defs>
              <radialGradient id="bunBody" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF4E0" />
                <stop offset="100%" stopColor="#FFD8A8" />
              </radialGradient>
              <linearGradient id="maskaMelt" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF9DB" />
                <stop offset="100%" stopColor="#FAB005" />
              </linearGradient>
            </defs>
            
            {/* The Bun Body */}
            <path 
              d="M 10 70 Q 10 20 60 20 Q 110 20 110 70 Q 110 90 60 90 Q 10 90 10 70" 
              fill="url(#bunBody)" 
              stroke="#2D3748" 
              strokeWidth="2.5" 
              className="animate-body-pulse origin-center"
            />
            
            {/* The Maska (Butter) */}
            <g transform="translate(45, 15)" className="animate-bounce-subtle">
              <rect width="30" height="15" rx="4" fill="url(#maskaMelt)" stroke="#2D3748" strokeWidth="1.5" />
              <path d="M 5 15 Q 5 25 10 20 Q 15 25 20 20 Q 25 25 25 15" fill="#FAB005" stroke="#2D3748" strokeWidth="1.2" />
            </g>

            {/* Zen Face */}
            <g transform="translate(60, 60)">
              {/* Chill Eyes */}
              <path d="M -15 -5 Q -10 -10 -5 -5" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" />
              <path d="M 5 -5 Q 10 -10 15 -5" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" />
              
              {/* Calm Smile */}
              <path d="M -8 10 Q 0 15 8 10" fill="none" stroke="#2D3748" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </g>

            {/* Blush */}
            <circle cx="35" cy="65" r="5" fill="#FAB005" opacity="0.2" />
            <circle cx="85" cy="65" r="5" fill="#FAB005" opacity="0.2" />
          </svg>
        </div>
        
        {/* Soft Speech Bubble - Delayed until after slide */}
        <div 
          className={`mt-4 bg-[#FFF9DB] border-[3px] border-slateInk/20 p-5 rounded-[2rem] rounded-bl-none shadow-[6px_6px_0px_rgba(250,176,5,0.1)] text-[11px] font-bold italic text-slateInk/80 w-48 text-center transition-all duration-300 delay-600 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
        >
          <span className="text-[#FAB005] not-italic font-black block text-[9px] mb-1 uppercase tracking-widest">Bun Maska:</span>
          "{comment}"
          <div className="absolute bottom-[-10px] left-0 w-5 h-5 bg-[#FFF9DB] border-l-[3px] border-b-[3px] border-slateInk/20 -z-10 rotate-[-15deg]"></div>
        </div>
      </div>
    </div>
  );
};

export default Bun;
