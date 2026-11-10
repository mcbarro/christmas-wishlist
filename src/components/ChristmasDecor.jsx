import { useEffect, useRef } from 'react';
import { useTheme } from '../theme/ThemeProvider';

function ChristmasTree() {
  return (
    <div className="christmas-tree" aria-hidden="true">
      <svg viewBox="0 0 240 330" role="presentation">
        <rect x="108" y="262" width="24" height="58" rx="4" fill="#5b3a1e" />
        <polygon points="120,28 205,160 35,160" fill="#14532d" />
        <polygon points="120,92 220,230 20,230" fill="#166534" />
        <polygon points="120,160 234,305 6,305" fill="#15803d" />
        <path
          d="M120 6 L128 28 L151 28 L133 43 L140 66 L120 52 L100 66 L107 43 L89 28 L112 28 Z"
          fill="#fbbf24"
        />
        <circle cx="92" cy="132" r="5" fill="#fca5a5" />
        <circle cx="150" cy="118" r="4" fill="#fde68a" />
        <circle cx="74" cy="206" r="5" fill="#fca5a5" />
        <circle cx="160" cy="196" r="4" fill="#fef3c7" />
        <circle cx="118" cy="222" r="5" fill="#fca5a5" />
        <circle cx="62" cy="280" r="4" fill="#fde68a" />
        <circle cx="178" cy="274" r="5" fill="#fca5a5" />
        <circle cx="118" cy="292" r="4" fill="#fef3c7" />
      </svg>
    </div>
  );
}

export default function ChristmasDecor() {
  const { theme } = useTheme();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (theme !== 'christmas') return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let width = 0;
    let height = 0;
    let flakes = [];
    let settled = [];
    let frame = 0;
    let animationFrame = 0;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.shadowColor = 'rgba(148, 163, 184, 0.35)';
      context.shadowBlur = 3;

      for (const mound of settled) {
        context.beginPath();
        context.arc(mound.x, mound.y, mound.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${mound.alpha})`;
        context.fill();
      }

      for (const flake of flakes) {
        context.beginPath();
        context.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(255, 255, 255, ${flake.alpha})`;
        context.fill();
      }

      context.shadowBlur = 0;
      context.fillStyle = 'rgba(255, 255, 255, 0.18)';
      context.fillRect(0, height - 3, width, 3);
    };

    const resetSnow = () => {
      const count = Math.min(
        90,
        Math.max(32, Math.floor(width / 20))
      );
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.7 + Math.random() * 1.8,
        speed: 0.25 + Math.random() * 0.75,
        drift: (Math.random() - 0.5) * 0.35,
        alpha: 0.3 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
      }));

      settled = Array.from(
        { length: Math.max(18, Math.floor(width / 12)) },
        () => ({
          x: Math.random() * width,
          y: height - 2 - Math.random() * 9,
          r: 1 + Math.random() * 3,
          alpha: 0.18 + Math.random() * 0.35,
        })
      );
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      resetSnow();

      if (reduceMotion) draw();
    };

    const tick = (time) => {
      for (const flake of flakes) {
        flake.y += flake.speed;
        flake.x += Math.sin(time / 2400 + flake.phase) * flake.drift;

        if (flake.x < -4) flake.x = width + 4;
        if (flake.x > width + 4) flake.x = -4;

        if (flake.y > height - 2) {
          settled.push({
            x: flake.x,
            y: height - 2 - Math.random() * 9,
            r: flake.r * 0.9,
            alpha: 0.18 + Math.random() * 0.3,
          });
          if (settled.length > 260) settled.shift();

          flake.y = -6 - Math.random() * 24;
          flake.x = Math.random() * width;
        }
      }

      draw();
      frame = window.requestAnimationFrame(tick);
    };

    const handleVisibility = () => {
      if (reduceMotion) return;
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else if (!frame) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    const handleResize = () => resize();

    resize();
    if (!reduceMotion) frame = window.requestAnimationFrame(tick);

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [theme]);

  if (theme !== 'christmas') return null;

  return (
    <>
      <div className="christmas-decor" aria-hidden="true">
        <canvas ref={canvasRef} className="christmas-snow" />
      </div>
      <ChristmasTree />
    </>
  );
}
