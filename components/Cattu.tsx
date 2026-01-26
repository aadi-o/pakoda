import React, { useMemo } from 'react';
import { Emotion } from '../types';

interface CattuProps {
  emotion: Emotion;
  isTalking: boolean;
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Cattu: React.FC<CattuProps> = ({ emotion, isTalking, size = 'lg' }) => {
  const sizeClasses = { 
    sm: 'w-16 h-16', 
    md: 'w-36 h-36', 
    lg: 'w-64 h-64 md:w-80 md:h-80' 
  };

  const emotionGlow = useMemo(() => {
    switch (emotion) {
      case Emotion.ANGRY: return 'rgba(229, 115, 115, 0.15)';
      case Emotion.SAVAGE: return 'rgba(45, 55, 72, 0.08)';
      default: return 'rgba(45, 55, 72, 0.03)';
    }
  }, [emotion]);

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center relative select-none animate-soft-float`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm transition-transform duration-500">
        <defs>
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FDFBF7" />
          </linearGradient>
        </defs>

        {/* Dynamic Background Glow */}
        <circle cx="100" cy="100" r="90" fill={emotionGlow} className="transition-all duration-1000 ease-in-out" />
        
        {/* Ears */}
        <path d="M 55 65 L 35 15 Q 75 5 85 45" fill="url(#headGradient)" stroke="#2D3748" strokeWidth="1" strokeLinejoin="round" />
        <path d="M 145 65 L 165 15 Q 125 5 115 45" fill="url(#headGradient)" stroke="#2D3748" strokeWidth="1" strokeLinejoin="round" />
        
        {/* Main Head Shape */}
        <path 
          d="M 45 75 Q 100 55 155 75 Q 185 100 175 145 Q 165 185 100 185 Q 35 185 25 145 Q 15 100 45 75" 
          fill="url(#headGradient)" 
          stroke="#2D3748" 
          strokeWidth="1" 
        />

        <g transform="translate(0, 15)">
          {/* Eyes Group with Eye-Blink Animation */}
          <g 
            className="animate-eye-blink" 
            style={{ transformOrigin: 'center', transformBox: 'fill-box' } as any}
          >
            {/* Left Eye */}
            <g transform="translate(68, 105)">
              <circle r="9" fill="white" stroke="#2D3748" strokeWidth="0.8" />
              <circle r="3.5" fill="#2D3748" cx={emotion === Emotion.ANGRY ? -1 : 0} cy={isTalking ? -0.8 : 0} />
            </g>
            {/* Right Eye */}
            <g transform="translate(132, 105)">
              <circle r="9" fill="white" stroke="#2D3748" strokeWidth="0.8" />
              <circle r="3.5" fill="#2D3748" cx={emotion === Emotion.ANGRY ? 1 : 0} cy={isTalking ? -0.8 : 0} />
            </g>
          </g>

          {/* Expression Overlays */}
          {emotion === Emotion.ANGRY && (
            <g transform="translate(100, 90)" opacity="0.6" className="animate-reveal">
              <path d="M -40 -3 Q -25 -10 -10 -3" fill="none" stroke="#2D3748" strokeWidth="1" />
              <path d="M 40 -3 Q 25 -10 10 -3" fill="none" stroke="#2D3748" strokeWidth="1" />
            </g>
          )}

          {/* Mouth with Conditional Talking-Mouth Animation */}
          <g transform="translate(100, 145)">
            {isTalking ? (
              <path 
                d="M -14 0 Q 0 18 14 0 Q 0 6 -14 0" 
                fill="#E57373" 
                stroke="#2D3748" 
                strokeWidth="1.2" 
                opacity="0.95"
                className="animate-talking-mouth"
                style={{ transformOrigin: 'center', transformBox: 'fill-box' } as any}
              />
            ) : (
              <path 
                d="M -10 2 Q 0 -2 10 2" 
                fill="none" 
                stroke="#2D3748" 
                strokeWidth="1.6" 
                strokeLinecap="round" 
                opacity="0.8" 
              />
            )}
          </g>
        </g>

        {/* Savage Sunglasses Mode */}
        {emotion === Emotion.SAVAGE && (
          <g transform="translate(52, 98)" className="animate-pop-bounce">
            <rect width="36" height="14" rx="2" fill="#2D3748" stroke="#2D3748" strokeWidth="1" />
            <rect x="58" width="36" height="14" rx="2" fill="#2D3748" stroke="#2D3748" strokeWidth="1" />
            <line x1="36" y1="7" x2="58" y2="7" stroke="#2D3748" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default Cattu;