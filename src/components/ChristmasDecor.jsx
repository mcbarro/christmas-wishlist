import { useEffect, useRef } from 'react';
import treeImage from '../assets/christmas-tree.svg';
import { useTheme } from '../theme/ThemeProvider';

function ChristmasTree() {
  return (
    <div className="christmas-tree" aria-hidden="true">
      <img src={treeImage} alt="" draggable="false" />
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
        context.shadowBlur = flake.big ? 7 : 2;
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
        280,
        Math.max(110, Math.floor(width / 5))
      );
      flakes = Array.from({ length: count }, () => {
        const big = Math.random() < 0.24;

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: big ? 2.4 + Math.random() * 1.7 : 0.8 + Math.random() * 1.5,
          speed: big ? 0.16 + Math.random() * 0.34 : 0.28 + Math.random() * 0.78,
          drift: (Math.random() - 0.5) * 0.45,
          alpha: big ? 0.28 + Math.random() * 0.3 : 0.42 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          big,
        };
      });

      settled = Array.from(
        { length: Math.max(72, Math.floor(width / 5)) },
        () => ({
          x: Math.random() * width,
          y: height - 2 - Math.random() * 11,
          r: 1.2 + Math.random() * 3.8,
          alpha: 0.25 + Math.random() * 0.4,
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
      draw();
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
          if (settled.length > 360) settled.shift();

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
