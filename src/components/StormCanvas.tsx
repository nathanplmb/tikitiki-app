import React, { useEffect, useRef } from 'react';

// Crackhead storm engine (one canvas): drifting storm clouds lit from inside by each strike,
// floating charged particles, branching lightning from any edge, impact spark showers and crackling plasma arcs.
// Everything is tinted with the current --accent colour.
// 'hero' = dense top-of-home storm; 'ambient' = lighter layer behind the whole app.
// Reduced motion: a single static frame of clouds, no flashes.

type Pt = { x: number; y: number };
type Bolt = { pts: Pt[]; branches: Pt[][]; t0: number; restrikes: number[] };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number };
type Arc = { pts: Pt[]; t0: number; life: number };
type Puff = { x: number; y: number; r: number; speed: number; shade: number };

function jag(a: Pt, b: Pt, depth: number, spread: number): Pt[] {
  if (depth === 0) return [a, b];
  const mid = { x: (a.x + b.x) / 2 + (Math.random() - 0.5) * spread, y: (a.y + b.y) / 2 + (Math.random() - 0.5) * spread * 0.35 };
  return [...jag(a, mid, depth - 1, spread / 2).slice(0, -1), ...jag(mid, b, depth - 1, spread / 2)];
}

function makeBolt(w: number, h: number, topBias: boolean): Bolt {
  const r = Math.random;
  const edge = topBias && r() < 0.6 ? 0 : Math.floor(r() * 4);
  const start = edge === 0 ? { x: w * r(), y: -10 } : edge === 1 ? { x: w + 10, y: h * r() } : edge === 2 ? { x: w * r(), y: h + 10 } : { x: -10, y: h * r() };
  const end = {
    x: edge === 1 ? w * r() * 0.6 : edge === 3 ? w * (0.4 + r() * 0.6) : w * r(),
    y: edge === 0 ? h * (topBias ? 0.25 + r() * 0.45 : 0.35 + r() * 0.6) : edge === 2 ? h * r() * 0.65 : h * r(),
  };
  const len = Math.hypot(end.x - start.x, end.y - start.y);
  const pts = jag(start, end, 7, Math.max(80, len * 0.35));
  const branches: Pt[][] = [];
  for (let i = 8; i < pts.length - 10; i += 6 + Math.floor(r() * 10)) {
    if (r() < 0.55) {
      const ang = Math.atan2(end.y - start.y, end.x - start.x) + (r() < 0.5 ? -1 : 1) * (0.4 + r() * 0.8);
      const bl = 40 + r() * len * 0.35;
      branches.push(jag(pts[i], { x: pts[i].x + Math.cos(ang) * bl, y: pts[i].y + Math.sin(ang) * bl }, 5, 60));
    }
  }
  return { pts, branches, t0: performance.now(), restrikes: [260, 380, 520].slice(0, 1 + Math.floor(r() * 3)) };
}

function boltIntensity(b: Bolt, now: number): { grow: number; k: number } {
  const t = now - b.t0;
  if (t < 140) return { grow: t / 140, k: 0.25 };
  if (t < 200) return { grow: 1, k: 1 };
  let k = Math.max(0, 1 - (t - 200) / 700) * 0.55;
  for (const r of b.restrikes) if (t > r && t < r + 45) k = 0.95;
  return { grow: 1, k };
}

function path(ctx: CanvasRenderingContext2D, pts: Pt[], upto = 1) {
  const n = Math.max(2, Math.floor(pts.length * upto));
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
}

function glowStroke(ctx: CanvasRenderingContext2D, pts: Pt[], upto: number, widths: [number, number, number], accent: string, a: number) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const passes: [number, string, number, number][] = [
    [widths[0], accent, a * 0.35, 40],
    [widths[1], accent, a * 0.9, 18],
    [widths[2], '#ffffff', a, 6],
  ];
  for (const [lw, col, al, blur] of passes) {
    ctx.globalAlpha = al;
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.shadowColor = col;
    ctx.shadowBlur = blur;
    path(ctx, pts, upto);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

export const StormCanvas: React.FC<{ variant?: 'hero' | 'ambient'; fixed?: boolean; className?: string }> = ({ variant = 'ambient', fixed = false, className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const hero = variant === 'hero';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, raf = 0, alive = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // clouds: dense band at the top for the hero, a thinner veil for the ambient layer
    const puffs: Puff[] = Array.from({ length: hero ? 26 : 14 }, () => ({
      x: Math.random() * 1.2 - 0.1,
      y: hero ? Math.random() * 0.32 : Math.random() * 0.9,
      r: (hero ? 70 : 90) + Math.random() * 110,
      speed: (0.004 + Math.random() * 0.008) * (Math.random() < 0.5 ? -1 : 1),
      shade: 0.25 + Math.random() * 0.35,
    }));
    // charged particles: slow upward drift with a wobble, twinkle, flare on every strike
  const ions = Array.from({ length: hero ? 70 : 40 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6, v: 0.01 + Math.random() * 0.03, ph: Math.random() * Math.PI * 2 }));
    let bolts: Bolt[] = [];
    let sparks: Spark[] = [];
    let arcs: Arc[] = [];
    let nextBolt = performance.now() + 500 + Math.random() * 900;
    let nextArc = performance.now() + 300;
    let last = performance.now();

    const draw = (now: number) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff2a1a';
      ctx.clearRect(0, 0, w, h);

      // schedule strikes (hero: ~every 2–3 s, ambient: ~every 3–4.5 s) and plasma crackle
      if (!reduced && now > nextBolt) {
        const b = makeBolt(w, h, hero);
        bolts.push(b);
        const hit = b.pts[b.pts.length - 1];
        for (let i = 0; i < (hero ? 34 : 22); i++) {
          const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 260;
          sparks.push({ x: hit.x, y: hit.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 0, max: 0.5 + Math.random() * 0.7 });
        }
        nextBolt = now + (hero ? 2000 + Math.random() * 1200 : 3000 + Math.random() * 1500);
      }
      if (!reduced && now > nextArc) {
        // short crackling arcs: across the logo area for the hero, anywhere for the ambient layer
        const y0 = hero ? h * (0.05 + Math.random() * 0.2) : Math.random() * h;
        const x0 = w * (0.1 + Math.random() * 0.8);
        const len = 30 + Math.random() * (hero ? 120 : 70);
        const ang = (Math.random() - 0.5) * Math.PI;
        arcs.push({ pts: jag({ x: x0, y: y0 }, { x: x0 + Math.cos(ang) * len, y: y0 + Math.sin(ang) * len }, 4, 26), t0: now, life: 90 + Math.random() * 140 });
        nextArc = now + (hero ? 140 + Math.random() * 260 : 500 + Math.random() * 900);
      }

      // overall flash level drives cloud illumination
      let flash = 0;
      for (const b of bolts) flash = Math.max(flash, boltIntensity(b, now).k);

      // clouds
      for (const p of puffs) {
        if (!reduced) {
          p.x += p.speed * dt;
          if (p.x > 1.25) p.x = -0.25;
          if (p.x < -0.25) p.x = 1.25;
        }
        const cx = p.x * w, cy = p.y * h;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, p.r);
        g.addColorStop(0, `rgba(28,22,26,${p.shade})`);
        g.addColorStop(1, 'rgba(10,8,10,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (flash > 0.05) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = flash * 0.55 * p.shade;
          const lg = ctx.createRadialGradient(cx, cy + p.r * 0.2, 0, cx, cy, p.r);
          lg.addColorStop(0, '#ffffff');
          lg.addColorStop(0.35, accent);
          lg.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = lg;
          ctx.beginPath();
          ctx.arc(cx, cy, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // charged particles
      for (const p of ions) {
        if (!reduced) {
          p.y -= p.v * dt;
          p.ph += dt * 2.2;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        }
        const x = (p.x + Math.sin(p.ph) * 0.006) * w, y = p.y * h;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(p.ph * 1.7));
        const glow = Math.min(1, tw * 0.6 + flash * 1.2);
        ctx.globalAlpha = glow;
        ctx.fillStyle = flash > 0.3 ? '#ffffff' : accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 6 + flash * 14;
        ctx.beginPath();
        ctx.arc(x, y, p.r * (1 + flash * 0.8), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // lightning
      bolts = bolts.filter((b) => now - b.t0 < 950);
      for (const b of bolts) {
        const { grow, k } = boltIntensity(b, now);
        if (k > 0.6) {
          const c = b.pts[Math.floor(b.pts.length / 2)];
          const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(w, h) * 0.8);
          g.addColorStop(0, `rgba(255,255,255,${0.18 * k})`);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
        glowStroke(ctx, b.pts, grow, [10, 3.2, 1.3], accent, k);
        for (const br of b.branches) glowStroke(ctx, br, grow, [5, 1.6, 0.7], accent, k * 0.6);
      }

      // plasma arcs
      arcs = arcs.filter((a) => now - a.t0 < a.life);
      for (const a of arcs) {
        const flicker = Math.random() < 0.3 ? 0.25 : 0.8;
        glowStroke(ctx, a.pts, 1, [4, 1.4, 0.6], accent, flicker * (1 - (now - a.t0) / a.life));
      }

      // impact sparks
      sparks = sparks.filter((s) => s.life < s.max);
      ctx.lineCap = 'round';
      for (const s of sparks) {
        s.life += dt;
        s.vy += 520 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const a = 1 - s.life / s.max;
        ctx.globalAlpha = a;
        ctx.strokeStyle = Math.random() < 0.5 ? '#fff' : accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (!reduced) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [variant]);

  return <canvas ref={ref} className={`${fixed ? 'fixed' : 'absolute'} inset-0 w-full h-full pointer-events-none ${className}`} aria-hidden />;
};
