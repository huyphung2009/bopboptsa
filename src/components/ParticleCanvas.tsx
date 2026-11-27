import React, { useEffect, useRef } from 'react';

const PALETTE = ['#dc263e', '#ef6c7e', '#f799a6', '#ffd2d8', '#e63950'];

interface Particle {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  color: string;
  alpha: number;
  phase: number;
}

interface ParticleCanvasProps {
  className?: string;
}

export const ParticleCanvas: React.FC<ParticleCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let rafId: number | null = null;
    let running = false;
    const mouse = { x: -9999, y: -9999 };

    const makeParticle = (fromBottom: boolean): Particle => ({
      x: Math.random() * width,
      y: fromBottom ? height + Math.random() * 60 : Math.random() * height,
      r: 0.9 + Math.random() * 2.0,
      vy: -(0.07 + Math.random() * 0.28),
      vx: (Math.random() - 0.5) * 0.12,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      alpha: 0.16 + Math.random() * 0.34,
      phase: Math.random() * Math.PI * 2,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(72, Math.round((width * height) / 18000));
      particles = Array.from({ length: target }, () => makeParticle(false));
    };

    const drawFrame = (t: number) => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx + Math.sin(t * 0.0007 + p.phase) * 0.14;
        p.y += p.vy;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        const radius = 120;
        if (dist2 < radius * radius) {
          const dist = Math.sqrt(dist2) || 1;
          const force = (radius - dist) / radius;
          p.x += (dx / dist) * force * 2.1;
          p.y += (dy / dist) * force * 2.1;
        }

        if (p.y < -24) {
          p.y = height + 24;
          p.x = Math.random() * width;
        }
        if (p.x < -24) p.x = width + 24;
        if (p.x > width + 24) p.x = -24;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const loop = (t: number) => {
      if (!running) return;
      drawFrame(t);
      rafId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (running || prefersReduced) return;
      running = true;
      rafId = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const onPointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    };

    const onVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { threshold: 0.02 }
    );

    resize();
    if (prefersReduced) {
      drawFrame(performance.now());
    }
    observer.observe(canvas);

    return () => {
      stopLoop();
      observer.disconnect();
      window.clearTimeout(resizeTimer);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
};
