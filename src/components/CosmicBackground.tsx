import React, { useEffect, useRef, useState } from 'react';
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
  color: string;
  tailColor: string;
  isFireball: boolean;
  sparks: MeteorSpark[];
}

interface MeteorSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  decay: number;
  color: string;
}

interface CosmicBackgroundProps {
  meteorShowerMode?: boolean;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({ meteorShowerMode = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { themeConfig } = useTheme();
  const themeRef = useRef(themeConfig);
  const showerModeRef = useRef(meteorShowerMode);

  useEffect(() => {
    themeRef.current = themeConfig;
  }, [themeConfig]);

  useEffect(() => {
    showerModeRef.current = meteorShowerMode;
  }, [meteorShowerMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Starfield particles
    const starCount = Math.min(150, Math.floor((width * height) / 8000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.008 + 0.003,
      twinkleOffset: Math.random() * Math.PI * 2,
      colorIndex: Math.random() > 0.35 ? 0 : 1,
    }));

    // Active Meteors (උල්කාපාත)
    let meteors: Meteor[] = [];

    const spawnMeteor = (customX?: number, customY?: number, isClick = false) => {
      const activeTheme = themeRef.current;
      const angle = (Math.random() * 15 + 30) * (Math.PI / 180); // 30-45 deg trajectory
      const speed = isClick ? Math.random() * 6 + 12 : Math.random() * 7 + 9;
      const isFireball = !isClick && Math.random() < 0.2;
      const length = isFireball ? Math.random() * 120 + 160 : Math.random() * 70 + 90;

      const startX = customX !== undefined ? customX : Math.random() * (width + 200) - 100;
      const startY = customY !== undefined ? customY : -50;

      const meteor: Meteor = {
        x: startX,
        y: startY,
        length,
        speed,
        angle,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        radius: isFireball ? Math.random() * 1.8 + 2.2 : Math.random() * 1.2 + 1.2,
        alpha: 1,
        decay: isFireball ? 0.006 : 0.012,
        color: isFireball ? '#ffffff' : '#ffffff',
        tailColor: activeTheme.accentHex,
        isFireball,
        sparks: [],
      };

      meteors.push(meteor);
    };

    // User Interactive Click & Drag Meteor Trigger
    let isMouseDown = false;
    let lastSpawnTime = 0;

    const handlePointerDown = (e: MouseEvent) => {
      isMouseDown = true;
      spawnMeteor(e.clientX, e.clientY, true);
    };

    const handlePointerUp = () => {
      isMouseDown = false;
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (isMouseDown) {
        const now = performance.now();
        if (now - lastSpawnTime > 120) {
          spawnMeteor(e.clientX, e.clientY, true);
          lastSpawnTime = now;
        }
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('mousemove', handlePointerMove);

    // Periodic Meteor Spawner
    let nextMeteorTime = performance.now() + 800;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const activeTheme = themeRef.current;

      // 1. Subtle cosmic background radial aura
      const ambientGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.3,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      ambientGrad.addColorStop(0, `${activeTheme.accentHex}10`);
      ambientGrad.addColorStop(0.5, `${activeTheme.secondaryHex}05`);
      ambientGrad.addColorStop(1, 'rgba(7, 9, 14, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Stars rendering with twinkling
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.1) {
          star.speed = -star.speed;
        }

        const color = activeTheme.particleColors[star.colorIndex];
        const pulse = (Math.sin(time * 0.002 + star.twinkleOffset) + 1) * 0.5;
        const currentAlpha = Math.max(0.1, Math.min(1, star.alpha * (0.6 + pulse * 0.4)));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${currentAlpha * 0.85})`;
        if (star.radius > 1.2) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = activeTheme.accentHex;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Periodic Meteor Spawn Check
      const showerMultiplier = showerModeRef.current ? 0.35 : 1;
      if (time > nextMeteorTime) {
        spawnMeteor();
        if (showerModeRef.current && Math.random() < 0.6) {
          // Double burst in meteor shower mode
          setTimeout(() => spawnMeteor(), 150);
        }
        nextMeteorTime = time + (Math.random() * 1800 + 1200) * showerMultiplier;
      }

      // 4. Update and Render Meteors (උල්කාපාත)
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];

        // Move meteor
        m.x += m.dx;
        m.y += m.dy;
        m.alpha -= m.decay;

        // Tail origin coordinates
        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        // Emit cosmic dust sparks along trail
        if (Math.random() < (m.isFireball ? 0.75 : 0.45)) {
          m.sparks.push({
            x: m.x - Math.cos(m.angle) * (Math.random() * m.length * 0.6),
            y: m.y - Math.sin(m.angle) * (Math.random() * m.length * 0.6),
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            alpha: 0.9,
            size: Math.random() * 1.5 + 0.6,
            decay: Math.random() * 0.03 + 0.02,
            color: Math.random() > 0.4 ? '#ffffff' : activeTheme.accentHex,
          });
        }

        // Draw glowing meteor tail (Gradient beam)
        if (m.alpha > 0) {
          ctx.save();
          const tailGrad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
          tailGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
          tailGrad.addColorStop(0.3, `${activeTheme.accentHex}40`);
          tailGrad.addColorStop(0.8, `${activeTheme.accentHex}cc`);
          tailGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(m.x, m.y);
          ctx.strokeStyle = tailGrad;
          ctx.lineWidth = m.isFireball ? m.radius * 2.5 : m.radius * 1.8;
          ctx.lineCap = 'round';
          ctx.shadowBlur = m.isFireball ? 16 : 8;
          ctx.shadowColor = activeTheme.accentHex;
          ctx.stroke();

          // Draw Glowing Meteor Head (White hot core)
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = m.isFireball ? 20 : 12;
          ctx.shadowColor = '#ffffff';
          ctx.fill();

          // Secondary radial glare around fireball
          if (m.isFireball) {
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.radius * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `${activeTheme.accentHex}30`;
            ctx.fill();
          }

          ctx.restore();
        }

        // Update and draw sparks
        for (let s = m.sparks.length - 1; s >= 0; s--) {
          const sp = m.sparks[s];
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.alpha -= sp.decay;

          if (sp.alpha <= 0) {
            m.sparks.splice(s, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
          ctx.fillStyle = sp.color === '#ffffff' ? `rgba(255, 255, 255, ${sp.alpha})` : `${sp.color}`;
          ctx.fill();
        }

        // Remove dead meteors
        if (
          m.alpha <= 0 ||
          m.x > width + 250 ||
          m.y > height + 250 ||
          (m.alpha <= 0 && m.sparks.length === 0)
        ) {
          meteors.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('mousemove', handlePointerMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 select-none"
      style={{ opacity: 0.95 }}
    />
  );
};
