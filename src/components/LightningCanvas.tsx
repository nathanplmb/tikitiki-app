import React, { useEffect, useRef } from 'react';

// Procedural lightning: a jagged, branching bolt grown by midpoint displacement,
// drawn as a stepped leader, then the return stroke (bright flash), 1–3 restrikes, and a cooling afterglow.
// Tinted with the current --accent colour. Disabled when the user prefers reduced motion.
// Photosensitivity: one strike every few seconds, flicker well under 3 flashes per second.

type Pt = { x: number; y: number };
type Bolt = { main: Pt[]; branches: Pt[][] };

function jag(a: Pt, b: Pt, depth: number, spread: number): Pt[] {
  if (depth === 0) return [a, b];
  const mid = { x: (a.x + b.x) / 2 + (Math.random() - 0.5) * spread, y: (a.y + b.y) / 2 + (Math.random() - 0.5) * spread * 0.25 };
  const left = jag(a, mid, depth - 1, spread / 2);
  return [...left.slice(0, -1), ...jag(mid, b, depth - 1, spread / 2)];
}

function makeBolt(w: number, h: number): Bolt {
  const start = { x: w * (0.15 + Math.random() * 0.7), y: -10 };
  const end = { x: start.x + (Math.random() - 0.5) * w * 0.5, y: h * (0.45 + Math.random() * 0.3) };
  const main = jag(start, end, 7, w * 0.35);
  const branches: Pt[][] = [];
  for (let i = 8; i < main.length - 10; i += 6 + Math.floor(Math.random() * 10)) {
    if (Math.random() < 0.55) {
      const from = main[i];
      const dir = Math.random() < 0.5 ? -1 : 1;
      const to = { x: from.x + dir * (30 + Math.random() * w * 0.25), y: from.y + 30 + Math.random() * h * 0.18 };
      branches.push(jag(from, to, 5, 60));
    }
  }
  return { main, branches };
}

function stroke(ctx: CanvasRenderingContext2D, pts: Pt[], upto: number, width: number, color: string, alpha: number, blur: number) {
  const n = Math.max(2, Math.floor(pts.length * upto));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();
}

export const LightningCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let timer = 0;
    let alive = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const strike = () => {
      if (!alive) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const bolt = makeBolt(w, h);
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff2a1a';
      // timeline (ms): leader 0–140, return stroke 140–200, restrikes, afterglow fade to ~900
      const restrikes = [260, 380, 520].slice(0, 1 + Math.floor(Math.random() * 3));
      const t0 = performance.now();

      const frame = (now: number) => {
        const t = now - t0;
        ctx.clearRect(0, 0, w, h);
        let intensity = 0;
        let grow = 1;
        if (t < 140) { grow = t / 140; intensity = 0.25; }
        else if (t < 200) intensity = 1;
        else {
          intensity = Math.max(0, 1 - (t - 200) / 700) * 0.55;
          for (const r of restrikes) if (t > r && t < r + 45) intensity = 0.95;
        }
        if (intensity > 0.6) {
          // sky / wall illumination
          const g = ctx.createRadialGradient(bolt.main[0].x, 0, 0, bolt.main[0].x, 0, h * 0.9);
          g.addColorStop(0, `rgba(255,255,255,${0.22 * intensity})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
        const all = [bolt.main, ...bolt.branches];
        all.forEach((pts, i) => {
          const isMain = i === 0;
          const a = isMain ? intensity : intensity * 0.6;
          stroke(ctx, pts, grow, isMain ? 10 : 5, accent, a * 0.35, 40);
          stroke(ctx, pts, grow, isMain ? 3.2 : 1.6, accent, a * 0.9, 18);
          stroke(ctx, pts, grow, isMain ? 1.3 : 0.7, '#ffffff', a, 6);
        });
        if (t < 950) raf = requestAnimationFrame(frame);
        else {
          ctx.clearRect(0, 0, w, h);
          timer = window.setTimeout(strike, 2500 + Math.random() * 4500);
        }
      };
      raf = requestAnimationFrame(frame);
    };

    timer = window.setTimeout(strike, 900);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={`absolute inset-0 w-full h-full pointer-events-none ${className}`} aria-hidden />;
};
