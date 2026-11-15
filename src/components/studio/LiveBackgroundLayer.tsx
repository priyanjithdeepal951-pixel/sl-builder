import React from 'react';
import { PageStyleSettings } from '../../types/builder';
import {
  getAnimationCount,
  getAnimationSpeedMultiplier,
} from '../../utils/pageStylePresets';

interface LiveBackgroundLayerProps {
  pageStyle?: PageStyleSettings;
}

export const LiveBackgroundLayer: React.FC<LiveBackgroundLayerProps> = ({ pageStyle }) => {
  const animType = pageStyle?.liveAnimation || 'none';
  if (animType === 'none') return null;

  const color = pageStyle?.animationColor || '#818cf8';
  const count = getAnimationCount(pageStyle?.animationDensity);
  const speedMul = getAnimationSpeedMultiplier(pageStyle?.animationSpeed);

  const items = Array.from({ length: count }, (_, idx) => idx);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      {/* 1. METEORS (උල්කාපාත) */}
      {animType === 'meteors' &&
        items.map((idx) => {
          const topPct = ((idx * 17 + 4) % 72) - 8;
          const leftPct = ((idx * 23 + 18) % 95) + 12;
          const widthPx = 90 + ((idx * 29) % 110);
          const durationSec = ((2.4 + (idx % 5) * 0.65) * speedMul).toFixed(2);
          const delaySec = ((idx * 0.55) % 4.5).toFixed(2);
          return (
            <span
              key={idx}
              className="sl-anim-item absolute block"
              style={{
                top: `${topPct}%`,
                left: `${leftPct}%`,
                width: `${widthPx}px`,
                height: '2px',
                borderRadius: '9999px',
                background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0))`,
                boxShadow: `0 0 10px ${color}`,
                animation: `slMeteorFall ${durationSec}s linear ${delaySec}s infinite`,
                opacity: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '-1.5px',
                  width: '5px',
                  height: '5px',
                  borderRadius: '9999px',
                  backgroundColor: '#ffffff',
                  boxShadow: `0 0 12px 2px ${color}`,
                }}
              />
            </span>
          );
        })}

      {/* 2. STARFIELD */}
      {animType === 'starfield' &&
        items.concat(items).map((idx, renderIdx) => {
          const topPct = (renderIdx * 13 + 7) % 96;
          const leftPct = (renderIdx * 19 + 11) % 97;
          const sizePx = renderIdx % 4 === 0 ? 3 : renderIdx % 2 === 0 ? 2 : 1.5;
          const durationSec = ((1.8 + (renderIdx % 5) * 0.6) * speedMul).toFixed(2);
          const delaySec = ((renderIdx * 0.37) % 3.5).toFixed(2);
          return (
            <span
              key={renderIdx}
              className="sl-anim-item absolute rounded-full"
              style={{
                top: `${topPct}%`,
                left: `${leftPct}%`,
                width: `${sizePx}px`,
                height: `${sizePx}px`,
                backgroundColor: color,
                boxShadow: `0 0 ${sizePx * 3}px ${color}`,
                animation: `slStarTwinkle ${durationSec}s ease-in-out ${delaySec}s infinite`,
              }}
            />
          );
        })}

      {/* 3. AURORA GLOW */}
      {animType === 'aurora' && (
        <>
          <div
            className="sl-anim-item absolute -top-24 -left-16 w-[65%] h-[55%] rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${color}55 0%, transparent 70%)`,
              animation: `slAuroraDrift ${(9 * speedMul).toFixed(1)}s ease-in-out infinite`,
            }}
          />
          <div
            className="sl-anim-item absolute top-1/3 -right-16 w-[60%] h-[55%] rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${color}40 0%, transparent 72%)`,
              animation: `slAuroraDrift ${(12 * speedMul).toFixed(1)}s ease-in-out 2s infinite reverse`,
            }}
          />
        </>
      )}

      {/* 4. FLOATING PARTICLES */}
      {animType === 'particles' &&
        items.map((idx) => {
          const leftPct = (idx * 17 + 6) % 94;
          const bottomPct = (idx * 11) % 35;
          const sizePx = 4 + (idx % 4) * 2;
          const durationSec = ((4.5 + (idx % 5) * 0.9) * speedMul).toFixed(2);
          const delaySec = ((idx * 0.48) % 4).toFixed(2);
          return (
            <span
              key={idx}
              className="sl-anim-item absolute rounded-full"
              style={{
                left: `${leftPct}%`,
                bottom: `${bottomPct}%`,
                width: `${sizePx}px`,
                height: `${sizePx}px`,
                backgroundColor: color,
                boxShadow: `0 0 12px ${color}`,
                animation: `slFloatUp ${durationSec}s ease-in-out ${delaySec}s infinite`,
                opacity: 0,
              }}
            />
          );
        })}

      {/* 5. CYBER PULSE GRID */}
      {animType === 'cyber-grid' && (
        <div
          className="sl-anim-item absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(to right, ${color}33 1px, transparent 1px), linear-gradient(to bottom, ${color}33 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
            animation: `slGridPulse ${(3.2 * speedMul).toFixed(2)}s ease-in-out infinite`,
          }}
        />
      )}

      {/* 6. GENTLE SNOWFALL */}
      {animType === 'snow' &&
        items.map((idx) => {
          const leftPct = (idx * 15 + 4) % 96;
          const sizePx = 3 + (idx % 3) * 1.5;
          const durationSec = ((4.2 + (idx % 6) * 0.85) * speedMul).toFixed(2);
          const delaySec = ((idx * 0.42) % 4).toFixed(2);
          return (
            <span
              key={idx}
              className="sl-anim-item absolute rounded-full"
              style={{
                top: '-10px',
                left: `${leftPct}%`,
                width: `${sizePx}px`,
                height: `${sizePx}px`,
                backgroundColor: color,
                boxShadow: `0 0 6px ${color}88`,
                animation: `slSnowFall ${durationSec}s linear ${delaySec}s infinite`,
                opacity: 0,
              }}
            />
          );
        })}
    </div>
  );
};
