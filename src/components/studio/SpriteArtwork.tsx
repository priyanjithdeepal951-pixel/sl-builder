import React from 'react';
import { SpriteCostume, StudioBackdrop } from '../../types/studio';

interface SpriteArtworkProps {
  presetKey: SpriteCostume['presetKey'];
  className?: string;
  flipX?: boolean;
  tint?: string;
}

export const SpriteArtwork: React.FC<SpriteArtworkProps> = ({
  presetKey,
  className = 'w-20 h-20',
  flipX = false,
  tint,
}) => {
  const filterStyle = tint ? { filter: `hue-rotate(${tint})` } : undefined;
  const transformStyle = flipX ? { transform: 'scaleX(-1)' } : undefined;

  switch (presetKey) {
    case 'robot':
      return (
        <svg viewBox="0 0 100 100" className={className} style={{ ...filterStyle, ...transformStyle }}>
          <line x1="50" y1="8" x2="50" y2="20" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="8" r="5" fill="#38bdf8" stroke="#0f172a" strokeWidth="2" />
          <rect x="24" y="20" width="52" height="38" rx="12" fill="#4C97FF" stroke="#1e293b" strokeWidth="3" />
          <rect x="31" y="28" width="38" height="20" rx="6" fill="#0f172a" />
          <circle cx="41" cy="38" r="4.5" fill="#38bdf8" />
          <circle cx="59" cy="38" r="4.5" fill="#38bdf8" />
          <rect x="30" y="60" width="40" height="26" rx="8" fill="#60a5fa" stroke="#1e293b" strokeWidth="3" />
          <rect x="40" y="67" width="20" height="10" rx="3" fill="#e2e8f0" />
          <line x1="20" y1="68" x2="30" y2="68" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
          <line x1="70" y1="68" x2="80" y2="68" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
          <rect x="35" y="86" width="10" height="9" rx="3" fill="#334155" />
          <rect x="55" y="86" width="10" height="9" rx="3" fill="#334155" />
        </svg>
      );

    case 'rocket':
      return (
        <svg viewBox="0 0 100 100" className={className} style={{ ...filterStyle, ...transformStyle }}>
          <path d="M50 8 C66 25 70 48 66 72 L34 72 C30 48 34 25 50 8 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="3" />
          <path d="M50 8 C58 17 63 26 65 34 L35 34 C37 26 42 17 50 8 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="50" cy="48" r="9" fill="#38bdf8" stroke="#1e293b" strokeWidth="3" />
          <path d="M34 55 L20 75 L34 72 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="2.5" />
          <path d="M66 55 L80 75 L66 72 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="2.5" />
          <path d="M40 72 L50 93 L60 72 Z" fill="#fbbf24" stroke="#ea580c" strokeWidth="2" />
        </svg>
      );

    case 'star':
      return (
        <svg viewBox="0 0 100 100" className={className} style={{ ...filterStyle, ...transformStyle }}>
          <polygon
            points="50,8 62,36 92,38 69,58 76,88 50,72 24,88 31,58 8,38 38,36"
            fill="#facc15"
            stroke="#b45309"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <circle cx="42" cy="47" r="3.5" fill="#1e293b" />
          <circle cx="58" cy="47" r="3.5" fill="#1e293b" />
          <path d="M44 58 Q50 64 56 58" fill="none" stroke="#1e293b" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      );

    case 'ball':
      return (
        <svg viewBox="0 0 100 100" className={className} style={{ ...filterStyle, ...transformStyle }}>
          <defs>
            <radialGradient id="cyberBallGrad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="65%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#312e81" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="38" fill="url(#cyberBallGrad)" stroke="#1e1b4b" strokeWidth="3" />
          <ellipse cx="38" cy="34" rx="11" ry="6" transform="rotate(-25 38 34)" fill="rgba(255,255,255,0.45)" />
        </svg>
      );

    case 'cat':
    default:
      return (
        <svg viewBox="0 0 110 110" className={className} style={{ ...filterStyle, ...transformStyle }}>
          {/* Tail */}
          <path d="M26 74 Q10 66 14 48" fill="none" stroke="#FF9F1C" strokeWidth="7" strokeLinecap="round" />
          <path d="M26 74 Q10 66 14 48" fill="none" stroke="#222" strokeWidth="1.5" strokeLinecap="round" />
          {/* Body */}
          <ellipse cx="48" cy="72" rx="18" ry="16" fill="#FF9F1C" stroke="#222" strokeWidth="2.5" />
          <ellipse cx="52" cy="74" rx="9" ry="10" fill="#FFF7ED" />
          {/* Legs */}
          <path d="M38 84 L32 98 L40 98" fill="none" stroke="#FF9F1C" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M58 84 L66 96 L73 94" fill="none" stroke="#FF9F1C" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          {/* Arms */}
          <path d="M34 66 L24 72" fill="none" stroke="#FF9F1C" strokeWidth="6" strokeLinecap="round" />
          <path d="M62 66 L74 71" fill="none" stroke="#FF9F1C" strokeWidth="6" strokeLinecap="round" />
          {/* Ears */}
          <polygon points="31,32 34,12 48,25" fill="#FF9F1C" stroke="#222" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points="62,25 76,12 79,32" fill="#FF9F1C" stroke="#222" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Head */}
          <ellipse cx="55" cy="40" rx="25" ry="20" fill="#FF9F1C" stroke="#222" strokeWidth="2.5" />
          {/* Muzzle */}
          <ellipse cx="58" cy="48" rx="14" ry="9" fill="#FFF7ED" />
          {/* Eyes */}
          <ellipse cx="48" cy="36" rx="5.5" ry="7" fill="#FFFFFF" stroke="#222" strokeWidth="2" />
          <ellipse cx="64" cy="36" rx="5.5" ry="7" fill="#FFFFFF" stroke="#222" strokeWidth="2" />
          <circle cx="50" cy="37" r="2.6" fill="#111827" />
          <circle cx="66" cy="37" r="2.6" fill="#111827" />
          {/* Nose & Smile */}
          <polygon points="55,44 61,44 58,48" fill="#111827" />
          <path d="M51 50 Q58 56 66 50" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" />
          {/* Whiskers */}
          <line x1="25" y1="43" x2="38" y2="45" stroke="#222" strokeWidth="1.5" />
          <line x1="25" y1="49" x2="38" y2="49" stroke="#222" strokeWidth="1.5" />
          <line x1="74" y1="45" x2="88" y2="43" stroke="#222" strokeWidth="1.5" />
          <line x1="74" y1="49" x2="88" y2="49" stroke="#222" strokeWidth="1.5" />
        </svg>
      );
  }
};

export function getBackdropStyle(presetKey: StudioBackdrop['presetKey']): React.CSSProperties {
  switch (presetKey) {
    case 'xy-grid':
      return {
        backgroundColor: '#ffffff',
        backgroundImage:
          'linear-gradient(to right, rgba(76, 151, 255, 0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(76, 151, 255, 0.16) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      };
    case 'blue-sky':
      return {
        background: 'linear-gradient(180deg, #60a5fa 0%, #bae6fd 70%, #86efac 70%, #4ade80 100%)',
      };
    case 'neon-space':
      return {
        background: 'radial-gradient(circle at 30% 25%, #312e81 0%, #0f172a 55%, #020617 100%)',
      };
    case 'sunset':
      return {
        background: 'linear-gradient(180deg, #4f46e5 0%, #ec4899 50%, #fbbf24 100%)',
      };
    case 'white':
    default:
      return {
        backgroundColor: '#ffffff',
      };
  }
}
