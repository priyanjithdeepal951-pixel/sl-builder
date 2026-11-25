import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  dx: number;
  dy: number;
  radius: number;
  alpha: number;
  decay: number;
}

interface CosmicBackgroundProps {
  meteorShowerMode?: boolean;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ meteorShowerMode = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { themeConfig, colorMode } = useTheme();
  const themeRef = useRef(themeConfig);
  const modeRef = useRef(colorMode);
  const showerModeRef = useRef(meteorShowerMode);

  useEffect(() => {
    themeRef.current = themeConfig;
  }, [themeConfig]);

  useEffect(() => {
    modeRef.current = colorMode;
  }, [colorMode]);

  useEffect(() => {
    showerModeRef.current = meteorShowerMode;
  }, [meteorShowerMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const pointer = { x: width * 0.5, y: height * 0.35, active: false };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handlePointerMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    let meteors: Meteor[] = [];
    const spawnMeteor = (customX?: number, customY?: number) => {
      const angle = (Math.random() * 14 + 32) * (Math.PI / 180);
      const speed = Math.random() * 5 + 9;
      meteors.push({
        x: customX ?? Math.random() * (width + 200) - 80,
        y: customY ?? -40,
        length: Math.random() * 75 + 95,
        speed,
        angle,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        radius: 1.5,
        alpha: 0.9,
        decay: 0.011,
      });
    };

    const handlePointerDown = (e: MouseEvent) => {
      if (showerModeRef.current) {
        spawnMeteor(e.clientX, e.clientY);
      }
    };
    window.addEventListener('mousedown', handlePointerDown);

    let nextMeteorTime = performance.now() + 900;

    // Subtle harmonic contour ribbons + subtle architectural coordinates
    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const activeTheme = themeRef.current;
      const isDark = modeRef.current === 'dark';
      const [c1, c2] = activeTheme.particleColors;
      const t = prefersReducedMotion ? 0 : time * 0.00035;

      // 1. Soft atmospheric radial light following cursor gently
      const focusX = pointer.active ? pointer.x : width * 0.65;
      const focusY = pointer.active ? pointer.y : height * 0.25;
      const glow = ctx.createRadialGradient(focusX, focusY, 20, focusX, focusY, Math.max(width, height) * 0.55);
      glow.addColorStop(0, `rgba(${c1}, ${isDark ? 0.09 : 0.055})`);
      glow.addColorStop(0.5, `rgba(${c2}, ${isDark ? 0.035 : 0.02})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // 2. Smooth flowing architectural contour waves (3 subtle ribbons)
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const baseY = height * (0.28 + w * 0.22);
        const amp = 28 + w * 14;
        const freq = 0.0018 + w * 0.0005;
        const phase = t * (1 + w * 0.35) + w * 1.4;

        for (let x = 0; x <= width; x += 24) {
          const distCursor = Math.hypot(x - focusX, baseY - focusY);
          const cursorLift = pointer.active ? Math.max(0, 1 - distCursor / 340) * 18 : 0;
          const y =
            baseY +
            Math.sin(x * freq + phase) * amp +
            Math.cos(x * freq * 0.5 - phase * 0.7) * (amp * 0.45) -
            cursorLift;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(${w % 2 === 0 ? c1 : c2}, ${isDark ? 0.14 - w * 0.025 : 0.11 - w * 0.02})`;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }

      // 3. Optional Meteor Mode when user activates live meteor streaks
      if (showerModeRef.current && !prefersReducedMotion) {
        if (time > nextMeteorTime) {
          spawnMeteor();
          nextMeteorTime = time + Math.random() * 650 + 350;
        }

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.dx;
          m.y += m.dy;
          m.alpha -= m.decay;

          if (m.alpha <= 0 || m.x > width + 200 || m.y > height + 200) {
            meteors.splice(i, 1);
            continue;
          }

          const tailX = m.x - Math.cos(m.angle) * m.length;
          const tailY = m.y - Math.sin(m.angle) * m.length;

          const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(0.7, `rgba(${c1}, ${m.alpha * 0.65})`);
          grad.addColorStop(1, isDark ? `rgba(255,255,255,${m.alpha})` : `rgba(${c1}, ${m.alpha})`);

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? `rgba(255,255,255,${m.alpha})` : `rgba(${c1}, ${m.alpha})`;
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mousedown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 select-none"
      aria-hidden="true"
    />
  );
};
