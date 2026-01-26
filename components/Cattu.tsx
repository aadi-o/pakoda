
import React, { useMemo, useState, useEffect } from 'react';
import { Emotion } from '../types';

interface CattuProps {
  emotion: Emotion;
  isTalking: boolean;
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Cattu: React.FC<CattuProps> = ({ emotion, isTalking, size = 'lg' }) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 5000);
    return () => clearInterval(blinkInterval);
  }, []);

  const sizeClasses = { 
    sm: 'w-16 h-16', 
    md: 'w-36 h-36', 
    lg: 'w-64 h-64 md:w-80 md:h-80' 
  };

  const emotionGlow = useMemo(() => {
    switch (emotion) {
      case Emotion.ANGRY: return 'rgba(242, 140, 140, 0.15)';
      case Emotion.SAVAGE: return 'rgba(214, 233, 240, 0.4)';
      default: return 'rgba(58, 61, 66, 0.03)';
    }
  }, [emotion]);

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center relative select-none animate-float`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F9F8F6" />
          </linearGradient>
        </defs>

        {/* Soft Background Aura */}
        <circle cx="100" cy="100" r="90" fill={emotionGlow} className="transition-all duration-1000" />
        
        {/* Ears - Refined stroke and shape */}
        <path d="M 55 65 L 35 15 Q 75 5 85 45" fill="url(#headGradient)" stroke="#3A3D42" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M 145 65 L 165 15 Q 125 5 115 45" fill="url(#headGradient)" stroke="#3A3D42" strokeWidth="1.5" strokeLinejoin="round" />
        
        {/* Main Head - Stoic Shape */}
        <path 
          d="M 45 75 Q 100 55 155 75 Q 185 100 175 145 Q 165 185 100 185 Q 35 185 25 145 Q 15 100 45 75" 
          fill="url(#headGradient)" 
          stroke="#3A3D42" 
          strokeWidth="1.5" 
        />

        {/* Face Details */}
        <g transform="translate(0, 15)">
          {/* Eyes - Precise and Mature */}
          {!blink ? (
            <>
              <g transform="translate(68, 105)">
                <circle r="10" fill="white" stroke="#3A3D42" strokeWidth="1" />
                <circle r="4" fill="#3A3D42" cx={emotion === Emotion.ANGRY ? -1 : 0} cy={isTalking ? -1 : 0} />
              </g>
              <g transform="translate(132, 105)">
                <circle r="10" fill="white" stroke="#3A3D42" strokeWidth="1" />
                <circle r="4" fill="#3A3D42" cx={emotion === Emotion.ANGRY ? 1 : 0} cy={isTalking ? -1 : 0} />
              </g>
            </>
          ) : (
            <>
              <path d="M 58 105 Q 68 103 78 105" fill="none" stroke="#3A3D42" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 122 105 Q 132 103 142 105" fill="none" stroke="#3A3D42" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}

          {/* Mature Expression Lines */}
          {emotion === Emotion.ANGRY && (
            <g transform="translate(100, 90)" opacity="0.6">
              <path d="M -45 -5 Q -30 -12 -15 -5" fill="none" stroke="#3A3D42" strokeWidth="1" />
              <path d="M 45 -5 Q 30 -12 15 -5" fill="none" stroke="#3A3D42" strokeWidth="1" />
            </g>
          )}

          {/* Mouth - Subtle and expressive */}
          <g transform="translate(100, 145)">
            {isTalking ? (
              <path d="M -12 0 Q 0 10 12 0" fill="#F28C8C" stroke="#3A3D42" strokeWidth="1.2" opacity="0.9" />
            ) : (
              <path d="M -8 3 Q 0 0 8 3" fill="none" stroke="#3A3D42" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
            )}
          </g>
        </g>

        {/* Minimalist Glasses (Savage Mode) */}
        {emotion === Emotion.SAVAGE && (
          <g transform="translate(50, 95)" className="animate-fade-in">
            <rect width="40" height="18" rx="2" fill="white" stroke="#3A3D42" strokeWidth="1.5" strokeOpacity="0.8" />
            <rect x="60" width="40" height="18" rx="2" fill="white" stroke="#3A3D42" strokeWidth="1.5" strokeOpacity="0.8" />
            <line x1="40" y1="9" x2="60" y2="9" stroke="#3A3D42" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    </div>
  );
};

export default Cattu;
