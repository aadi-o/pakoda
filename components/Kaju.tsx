
import React from 'react';

interface KajuProps {
  isVisible: boolean;
  comment: string;
}

const Kaju: React.FC<KajuProps> = ({ isVisible, comment }) => {
  return (
    <div 
      className={`absolute top-12 right-12 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
    >
      <div className={`flex flex-col items-center ${isVisible ? 'animate-divine-descent' : ''}`}>
        {/* Kaju Sprite */}
        <div className="w-20 h-24 animate-soft-float">
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_0_15px_rgba(147,197,253,0.3)]">
            <defs>
              <linearGradient id="kajuBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E0F2FE" />
              </linearGradient>
              <filter id="serenityGlow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            {/* Halo */}
            <ellipse cx="50" cy="20" rx="25" ry="5" fill="none" stroke="#93C5FD" strokeWidth="1" opacity="0.6" className="animate-pulse" />

            {/* Cashew Body */}
            <path 
              d="M 30 40 Q 15 60 30 90 Q 50 110 75 80 Q 85 60 65 45 Q 50 35 30 40" 
              fill="url(#kajuBody)" 
              stroke="#93C5FD" 
              strokeWidth="1.5"
              filter="url(#serenityGlow)"
            />
            
            {/* Tiny Spectacles */}
            <g transform="translate(45, 60)" opacity="0.8">
              <circle cx="-10" cy="0" r="5" fill="none" stroke="#2D3748" strokeWidth="0.8" />
              <circle cx="10" cy="0" r="5" fill="none" stroke="#2D3748" strokeWidth="0.8" />
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#2D3748" strokeWidth="0.8" />
            </g>

            {/* Peaceful Face */}
            <g transform="translate(50, 75)">
              <path d="M -8 0 Q 0 4 8 0" fill="none" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Shimmer Sparkles */}
            <circle cx="25" cy="55" r="1.5" fill="white" className="animate-ping" style={{ animationDuration: '3s' }} />
            <circle cx="70" cy="95" r="1" fill="white" className="animate-ping" style={{ animationDuration: '4s' }} />
          </svg>
        </div>

        {/* Serene Speech Bubble - Delayed until after descent */}
        <div 
          className={`mt-2 bg-blue-50/90 backdrop-blur-sm border-2 border-blue-100 p-4 rounded-[2rem] rounded-tr-none shadow-sm text-[10px] font-medium italic text-blue-900/70 w-44 text-center transition-all duration-500 delay-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          <span className="text-blue-400 not-italic font-black block text-[8px] mb-1 uppercase tracking-widest">Kaju Spirit:</span>
          "{comment}"
          <div className="absolute top-[-8px] right-0 w-4 h-4 bg-blue-50/90 border-t-2 border-r-2 border-blue-100 rotate-45 -z-10"></div>
        </div>
      </div>
    </div>
  );
};

export default Kaju;
