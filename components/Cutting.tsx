
import React from 'react';

interface CuttingProps {
  isVisible: boolean;
  comment: string;
}

const Cutting: React.FC<CuttingProps> = ({ isVisible, comment }) => {
  return (
    <div 
      className={`absolute bottom-full left-0 mb-4 transition-all duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div className={`relative flex flex-col items-center ${isVisible ? 'animate-steam-burst' : ''}`}>
        {/* Hype Man Glass - Cutting */}
        <div className="w-20 h-24 relative animate-soft-float">
          {/* Steam lines */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-1 h-4 bg-slateInk/10 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-1 h-6 bg-slateInk/20 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-3 bg-slateInk/10 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>

          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[4px_4px_0px_#2D3748]">
            {/* Glass Body */}
            <path 
              d="M 25 20 L 35 110 Q 50 115 65 110 L 75 20 Z" 
              fill="white" 
              stroke="#2D3748" 
              strokeWidth="3" 
            />
            {/* Tea Level */}
            <path 
              d="M 32 80 L 35 110 Q 50 115 65 110 L 68 80 Q 50 75 32 80" 
              fill="#E57373" 
              className="animate-pulse"
            />
            {/* Glass Facets (Reflections) */}
            <line x1="40" y1="30" x2="45" y2="100" stroke="#2D3748" strokeWidth="1" opacity="0.1" />
            <line x1="60" y1="30" x2="55" y2="100" stroke="#2D3748" strokeWidth="1" opacity="0.1" />
            
            {/* Hyper Face */}
            <g transform="translate(50, 55)">
              {/* Bulging Eyes */}
              <circle cx="-12" cy="0" r="6" fill="white" stroke="#2D3748" strokeWidth="2" />
              <circle cx="12" cy="0" r="6" fill="white" stroke="#2D3748" strokeWidth="2" />
              <circle cx="-12" cy="0" r="2" fill="#2D3748" className="animate-ping" />
              <circle cx="12" cy="0" r="2" fill="#2D3748" className="animate-ping" />
              
              {/* Wide Mouth */}
              <path d="M -8 15 Q 0 25 8 15" fill="none" stroke="#2D3748" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </svg>

          {/* Motion Lines */}
          <div className="absolute -left-4 top-1/2 w-3 h-1 bg-slateInk/20 rounded-full"></div>
          <div className="absolute -right-4 top-1/3 w-2 h-1 bg-slateInk/20 rounded-full"></div>
        </div>
        
        {/* Shout Box - Delayed until after burst */}
        <div 
          className={`mt-4 bg-slateInk text-white p-4 rounded-3xl rounded-tl-none border-[3px] border-slateInk shadow-[6px_6px_0px_#E57373] text-[10px] font-black uppercase tracking-tighter w-40 text-center transition-all duration-300 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <span className="text-mutedRose block text-[8px] mb-1">Cutting Hype:</span>
          "{comment}"
          <div className="absolute top-[-8px] left-0 w-4 h-4 bg-slateInk border-t-[3px] border-l-[3px] border-slateInk rotate-45 -z-10"></div>
        </div>
      </div>
    </div>
  );
};

export default Cutting;
