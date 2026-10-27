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

/** A bolt can start from any edge and travel in any direction across the screen. */
function makeBolt(w: number, h: number): Bolt {
  const edge = Math.floor(Math.random() * 4);
  const r = Math.random;
  const start =
    edge === 0 ? { x: w * r(), y: -10 } : edge === 1 ? { x: w + 10, y: h * r() } : edge === 2 ? { x: w * r(), y: h + 10 } : { x: -10, y: h * r() };
  // aim at a random point, biased towards the opposite half so bolts cross the screen
  const end = {
    x: edge === 1 ? w * r() * 0.6 : edge === 3 ? w * (0.4 + r() * 0.6) : w * r(),
    y: edge === 0 ? h * (0.35 + r() * 0.6) : edge === 2 ? h * r() * 0.65 : h * r(),
  };
  const len = Math.hypot(end.x - start.x, end.y - start.y);
  const main = jag(start, end, 7, Math.max(80, len * 0.35));
  const branches: Pt[][] = [];
  for (let i = 8; i < main.length - 10; i += 6 + Math.floor(Math.random() * 10)) {
    if (Math.random() < 0.55) {
      const from = main[i];
      const dir = Math.random() < 0.5 ? -1 : 1;
      const ang = Math.atan2(end.y - start.y, end.x - start.x) + dir * (0.4 + Math.random() * 0.8);
      const bl = 40 + Math.random() * len * 0.35;
      const to = { x: from.x + Math.cos(ang) * bl, y: from.y + Math.sin(ang) * bl };
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

export const LightningCanvas: React.FC<{ className?: string; minGap?: number; maxGap?: number; fixed?: boolean }> = ({ className = '', minGap = 2800, maxGap = 4000, fixed = false }) => {
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
        if (!w || !h) return;
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
          const c = bolt.main[Math.floor(bolt.main.length / 2)];
          const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(w, h) * 0.8);
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
          timer = window.setTimeout(strike, minGap + Math.random() * (maxGap - minGap));
        }
      };
      raf = requestAnimationFrame(frame);
    };

    timer = window.setTimeout(strike, 600 + Math.random() * 1200);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [minGap, maxGap]);

  return <canvas ref={ref} className={`${fixed ? 'fixed' : 'absolute'} inset-0 w-full h-full pointer-events-none ${className}`} aria-hidden />;
};
