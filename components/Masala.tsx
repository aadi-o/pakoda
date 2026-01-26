
import React from 'react';

interface MasalaProps {
  isVisible: boolean;
  comment: string;
}

const Masala: React.FC<MasalaProps> = ({ isVisible, comment }) => {
  if (!isVisible && !comment) return null;

  return (
    <div 
      className={`absolute bottom-full right-0 mb-4 transition-opacity duration-300 ${isVisible ? 'animate-pop-bounce opacity-100' : 'opacity-0 pointer-events-none'}`}
    >
      <div className="relative group">
        {/* Masala Sprite */}
        <div className="w-16 h-16 animate-bounce-subtle">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <radialGradient id="masalaGlow">
                <stop offset="0%" stopColor="#FFD8A8" />
                <stop offset="100%" stopColor="#FF922B" />
              </radialGradient>
            </defs>
            {/* Spice Cloud Body */}
            <path 
              d="M 30 50 Q 20 30 50 20 Q 80 30 70 50 Q 85 70 50 80 Q 15 70 30 50" 
              fill="url(#masalaGlow)" 
              stroke="#2D3748" 
              strokeWidth="1.5" 
            />
            {/* Eyes */}
            <circle cx="40" cy="45" r="3" fill="#2D3748" />
            <circle cx="60" cy="45" r="3" fill="#2D3748" />
            {/* Cheeky Grin */}
            <path d="M 40 60 Q 50 70 60 60" fill="none" stroke="#2D3748" strokeWidth="1.5" strokeLinecap="round" />
            {/* Little arms */}
            <path d="M 25 55 L 15 60" stroke="#2D3748" strokeWidth="1.5" />
            <path d="M 75 55 L 85 60" stroke="#2D3748" strokeWidth="1.5" />
          </svg>
        </div>
        
        {/* Speech Bubble */}
        <div className="absolute right-full bottom-full mb-2 mr-2 w-36 bg-paper border border-slateInk/10 p-3 rounded-2xl rounded-br-none shadow-xl text-[10px] font-bold uppercase tracking-wider text-slateInk animate-reveal">
          <span className="text-mutedRose block mb-1">Masala:</span>
          {comment}
          <div className="absolute bottom-[-6px] right-0 w-3 h-3 bg-paper border-r border-b border-slateInk/10 rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

export default Masala;
