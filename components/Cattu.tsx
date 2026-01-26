
import React, { useMemo, useEffect, useRef } from 'react';
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

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isTalking) {
      // Initialize AudioContext on first talk to ensure it's allowed by user gesture
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const playBlip = () => {
        if (!audioCtxRef.current) return;
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();

        // Mechanical "tick" sound using a low square wave with a fast decay
        osc.type = 'square'; 
        osc.frequency.setValueAtTime(150, audioCtxRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtxRef.current.currentTime + 0.1);

        gain.gain.setValueAtTime(0.015, audioCtxRef.current.currentTime); // Very subtle volume
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);

        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.1);
      };

      // Play immediately and then every 200ms to match 'talking-mouth' animation cycle (0.2s)
      playBlip();
      interval = setInterval(playBlip, 200);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTalking]);

  const emotionGlow = useMemo(() => {
    switch (emotion) {
      case Emotion.ANGRY: return 'rgba(229, 115, 115, 0.15)';
      case Emotion.SAVAGE: return 'rgba(45, 55, 72, 0.1)';
      default: return 'rgba(45, 55, 72, 0.03)';
    }
  }, [emotion]);

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center relative select-none animate-soft-float`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm transition-transform duration-500">
        <defs>
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F9F7F2" />
          </linearGradient>
        </defs>

        {/* Dynamic Background Glow */}
        <circle cx="100" cy="100" r="95" fill={emotionGlow} className="transition-all duration-1000 ease-in-out" />
        
        {/* Character Main Group with 'Postural awareness' Animation */}
        <g className="animate-aware-tilt origin-center">
          
          {/* Outer Body Group for posture shifting */}
          <g className="animate-posture-shift origin-bottom">
            {/* Tail */}
            <path 
              d="M 160 160 Q 185 160 185 135 Q 185 115 170 125" 
              fill="none" 
              stroke="#2D3748" 
              strokeWidth="3.5" 
              strokeLinecap="round"
              className="animate-whisker-twitch origin-[160px_160px]"
            />

            {/* Ears */}
            <path 
              d="M 55 65 L 30 20 Q 75 10 85 45" 
              fill="url(#headGradient)" 
              stroke="#2D3748" 
              strokeWidth="1.2" 
              strokeLinejoin="round" 
              className="animate-ear-flick origin-[55px_65px]"
            />
            <path 
              d="M 145 65 L 170 20 Q 125 10 115 45" 
              fill="url(#headGradient)" 
              stroke="#2D3748" 
              strokeWidth="1.2" 
              strokeLinejoin="round" 
              className="animate-ear-flick origin-[145px_65px] [animation-delay:1.5s]"
            />
            
            {/* Main Head Shape with 'Breathing' body-pulse */}
            <path 
              d="M 40 75 Q 100 50 160 75 Q 190 100 180 145 Q 165 188 100 188 Q 35 188 20 145 Q 10 100 40 75" 
              fill="url(#headGradient)" 
              stroke="#2D3748" 
              strokeWidth="1.2" 
              className="animate-body-pulse origin-center"
            />

            <g transform="translate(0, 15)">
              {/* Whiskers */}
              <g className="animate-whisker-twitch">
                <path d="M 35 125 Q 15 122 5 128" fill="none" stroke="#2D3748" strokeWidth="0.8" opacity="0.3" />
                <path d="M 35 132 Q 15 132 5 138" fill="none" stroke="#2D3748" strokeWidth="0.8" opacity="0.3" />
                <path d="M 165 125 Q 185 122 195 128" fill="none" stroke="#2D3748" strokeWidth="0.8" opacity="0.3" />
                <path d="M 165 132 Q 185 132 195 138" fill="none" stroke="#2D3748" strokeWidth="0.8" opacity="0.3" />
              </g>

              {/* Blush - Only if not angry */}
              {emotion !== Emotion.ANGRY && (
                <g className="animate-blush-pulse">
                  <ellipse cx="50" cy="135" rx="12" ry="6" fill="#E57373" opacity="0.4" />
                  <ellipse cx="150" cy="135" rx="12" ry="6" fill="#E57373" opacity="0.4" />
                </g>
              )}

              {/* Eyes Group - Attentive Focus with Darting Pupils */}
              <g 
                className="animate-eye-blink" 
                style={{ transformOrigin: 'center', transformBox: 'fill-box' } as any}
              >
                {/* Left Eye */}
                <g transform="translate(65, 110)">
                  <circle r="12" fill="#2D3748" />
                  {/* Darting Pupil/Sparkle Group */}
                  <g className="animate-eye-dart">
                    <circle r="4" fill="white" cx="-3" cy="-3" />
                    <circle r="1.5" fill="white" cx="4" cy="4" />
                  </g>
                </g>
                {/* Right Eye */}
                <g transform="translate(135, 110)">
                  <circle r="12" fill="#2D3748" />
                  <g className="animate-eye-dart">
                    <circle r="4" fill="white" cx="-3" cy="-3" />
                    <circle r="1.5" fill="white" cx="4" cy="4" />
                  </g>
                </g>
              </g>

              {/* Expression Overlays */}
              {emotion === Emotion.ANGRY && (
                <g transform="translate(100, 95)" opacity="0.8" className="animate-reveal">
                  <path d="M -45 -5 Q -30 -15 -15 -5" fill="none" stroke="#2D3748" strokeWidth="1.5" />
                  <path d="M 45 -5 Q 30 -15 15 -5" fill="none" stroke="#2D3748" strokeWidth="1.5" />
                </g>
              )}

              {/* Nose/Mouth area */}
              <g transform="translate(100, 138)">
                <path d="M -3 0 L 3 0 L 0 3 Z" fill="#2D3748" />
                
                <g transform="translate(0, 8)">
                  {isTalking ? (
                    <path 
                      d="M -15 0 Q 0 20 15 0 Q 0 8 -15 0" 
                      fill="#E57373" 
                      stroke="#2D3748" 
                      strokeWidth="1.4" 
                      className="animate-talking-mouth"
                      style={{ transformOrigin: 'center', transformBox: 'fill-box' } as any}
                    />
                  ) : (
                    <path 
                      d="M -8 2 Q -4 -2 0 2 Q 4 -2 8 2" 
                      fill="none" 
                      stroke="#2D3748" 
                      strokeWidth="1.6" 
                      strokeLinecap="round" 
                    />
                  )}
                </g>
              </g>
            </g>

            {/* Savage Sunglasses Mode */}
            {emotion === Emotion.SAVAGE && (
              <g transform="translate(48, 102)" className="animate-pop-bounce">
                <rect width="40" height="18" rx="4" fill="#2D3748" />
                <rect x="64" width="40" height="18" rx="4" fill="#2D3748" />
                <line x1="40" y1="9" x2="64" y2="9" stroke="#2D3748" strokeWidth="2.5" />
              </g>
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};

export default Cattu;
