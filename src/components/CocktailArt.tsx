import React, { useId } from 'react';
import type { Glass, Ice } from '../catalog/types';

// Procedural, offline cocktail portrait: glass silhouette, liquid in the drink's colour,
// ice, bubbles and garnish. Consistent framing for every recipe, no external image needed.

interface Shape {
  bowl: string; // closed path used to clip the liquid
  rim: [number, number, number]; // y, x1, x2 of the opening
  fill: number; // y of liquid surface
  bottom: number; // y of liquid bottom
  stem?: string;
  handle?: string;
}

const SHAPES: Record<Glass, Shape> = {
  coupe: { bowl: 'M38 70 Q100 150 162 70 Z', rim: [70, 38, 162], fill: 80, bottom: 112, stem: 'M97 112 L97 220 M60 228 Q100 214 140 228' },
  nick: { bowl: 'M52 60 Q54 140 100 142 Q146 140 148 60 Z', rim: [60, 52, 148], fill: 72, bottom: 142, stem: 'M97 142 L97 222 M64 230 Q100 216 136 230' },
  martini: { bowl: 'M30 58 L100 140 L170 58 Z', rim: [58, 30, 170], fill: 70, bottom: 140, stem: 'M98 140 L98 222 M62 230 Q100 216 138 230' },
  rocks: { bowl: 'M46 110 L52 228 Q100 236 148 228 L154 110 Z', rim: [110, 46, 154], fill: 132, bottom: 232 },
  highball: { bowl: 'M58 50 L62 230 Q100 238 138 230 L142 50 Z', rim: [50, 58, 142], fill: 70, bottom: 234 },
  collins: { bowl: 'M64 36 L67 230 Q100 237 133 230 L136 36 Z', rim: [36, 64, 136], fill: 56, bottom: 234 },
  pint: { bowl: 'M52 46 L64 230 Q100 237 136 230 L148 46 Z', rim: [46, 52, 148], fill: 62, bottom: 234 },
  flute: { bowl: 'M78 34 Q74 130 100 150 Q126 130 122 34 Z', rim: [34, 78, 122], fill: 50, bottom: 150, stem: 'M99 150 L99 224 M70 230 Q100 218 130 230' },
  wine: { bowl: 'M48 52 Q40 150 100 156 Q160 150 152 52 Z', rim: [52, 48, 152], fill: 92, bottom: 156, stem: 'M98 156 L98 224 M64 230 Q100 216 136 230' },
  hurricane: { bowl: 'M60 40 Q46 100 72 140 Q52 190 76 220 Q100 230 124 220 Q148 190 128 140 Q154 100 140 40 Z', rim: [40, 60, 140], fill: 58, bottom: 226, stem: 'M78 226 Q100 240 122 226' },
  tiki: { bowl: 'M56 50 Q50 140 60 228 Q100 238 140 228 Q150 140 144 50 Z', rim: [50, 56, 144], fill: 70, bottom: 232 },
  mug: { bowl: 'M50 92 L54 226 Q100 234 146 226 L150 92 Z', rim: [92, 50, 150], fill: 108, bottom: 230, handle: 'M150 120 Q182 124 180 160 Q178 196 148 198' },
  copper: { bowl: 'M48 96 L56 226 Q100 234 144 226 L152 96 Z', rim: [96, 48, 152], fill: 116, bottom: 230, handle: 'M152 120 Q184 124 182 160 Q180 196 146 198' },
  shot: { bowl: 'M70 150 L76 228 Q100 233 124 228 L130 150 Z', rim: [150, 70, 130], fill: 162, bottom: 230 },
  julep: { bowl: 'M54 84 L60 228 Q100 236 140 228 L146 84 Z', rim: [84, 54, 146], fill: 100, bottom: 232 },
  solo: { bowl: 'M44 66 L60 230 Q100 238 140 230 L156 66 Z', rim: [66, 44, 156], fill: 84, bottom: 234 },
  irish: { bowl: 'M56 64 Q52 160 100 168 Q148 160 144 64 Z', rim: [64, 56, 144], fill: 76, bottom: 168, stem: 'M98 168 L98 222 M66 230 Q100 216 134 230', handle: 'M144 90 Q172 96 168 124 Q164 146 140 146' },
};

function garnishKind(text = ''): 'lime' | 'lemon' | 'orange' | 'cherry' | 'mint' | 'olive' | 'berry' | 'pineapple' | 'none' {
  const t = text.toLowerCase();
  if (t.includes('menthe') || t.includes('basilic') || t.includes('romarin')) return 'mint';
  if (t.includes('cerise')) return 'cherry';
  if (t.includes('olive')) return 'olive';
  if (t.includes('mûre') || t.includes('framboise') || t.includes('fraise')) return 'berry';
  if (t.includes('ananas')) return 'pineapple';
  if (t.includes('citron vert')) return 'lime';
  if (t.includes('orange') || t.includes('pamplemousse')) return 'orange';
  if (t.includes('citron')) return 'lemon';
  return 'none';
}

export interface CocktailArtProps {
  color: string;
  glass: Glass;
  ice?: Ice;
  garnish?: string;
  sparkling?: boolean;
  creamy?: boolean;
  className?: string;
  animated?: boolean;
  glow?: boolean;
  /** Party cup look: opaque red (hero) or clear plastic so the drink colour shows. */
  cup?: 'red' | 'clear';
}

export const CocktailArt: React.FC<CocktailArtProps> = ({
  color,
  glass,
  ice = 'none',
  garnish,
  sparkling,
  creamy,
  className = '',
  animated = true,
  glow = true,
  cup = 'clear',
}) => {
  const uid = useId().replace(/:/g, '');
  const s = SHAPES[glass] ?? SHAPES.rocks;
  const [ry, rx1, rx2] = s.rim;
  const g = garnishKind(garnish);
  const w = rx2 - rx1;
  const cubes = ice === 'cubes' || ice === 'large' ? (ice === 'large' ? 1 : Math.max(2, Math.round(w / 34))) : 0;

  // Deterministic condensation droplets on the outside of the glass
  const drops = Array.from({ length: 16 }, (_, i) => ({
    x: rx1 + 6 + ((i * 53) % Math.max(10, w - 12)),
    y: s.fill + 8 + ((i * 37) % Math.max(12, s.bottom - s.fill - 14)),
    r: 0.9 + ((i * 7) % 5) * 0.35,
  }));
  const isTall = s.bottom - ry > 150 && !s.stem;

  return (
    <svg viewBox="0 0 200 260" className={className} role="img" aria-label="Illustration du cocktail">
      <defs>
        <clipPath id={`b${uid}`}>
          <path d={s.bowl} />
        </clipPath>
        {/* liquid: light passes through the centre, edges absorb more (Beer–Lambert look) */}
        <linearGradient id={`l${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={creamy ? 1 : 0.92} />
          <stop offset="0.6" stopColor={color} />
          <stop offset="1" stopColor="#000" stopOpacity={0.6} />
        </linearGradient>
        <linearGradient id={`la${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="0.22" stopColor="#000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity={creamy ? 0.08 : 0.22} />
          <stop offset="0.78" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.6" />
        </linearGradient>
        {/* glass wall: thick, slightly blue-tinted, bright at the silhouette edges */}
        <linearGradient id={`gw${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dff4ff" stopOpacity="0.38" />
          <stop offset="0.08" stopColor="#dff4ff" stopOpacity="0.06" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.015" />
          <stop offset="0.92" stopColor="#dff4ff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#dff4ff" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={`sp${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.15" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`g${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={color} stopOpacity="0.9" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`ic${uid}`} cx="0.3" cy="0.25" r="0.9">
          <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#e9f6ff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#bfe3ff" stopOpacity="0.08" />
        </radialGradient>
        <radialGradient id={`dr${uid}`} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.15" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.45" />
        </radialGradient>
        {/* micro-texture inside the drink so it does not look like flat vector colour */}
        <filter id={`tx${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.09" numOctaves="2" seed="4" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.22 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id={`bl${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id={`bs${uid}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1" /></filter>
      </defs>

      {/* coloured caustic light thrown on the bar top + contact shadow */}
      {glow && (
        <>
          <ellipse cx="100" cy="240" rx="88" ry="16" fill={`url(#g${uid})`} filter={`url(#bl${uid})`} opacity="0.85" />
          <ellipse cx="108" cy="242" rx={w * 0.42} ry="5" fill={color} opacity="0.55" filter={`url(#bs${uid})`} />
          <ellipse cx="100" cy="238" rx={w * 0.48} ry="4" fill="#000" opacity="0.55" filter={`url(#bs${uid})`} />
          <ellipse cx="100" cy={(s.fill + s.bottom) / 2} rx={w * 0.75} ry={(s.bottom - s.fill) * 0.75} fill={`url(#g${uid})`} opacity="0.3" filter={`url(#bl${uid})`} />
        </>
      )}

      <g clipPath={`url(#b${uid})`}>
        {/* liquid body */}
        <rect x="0" y={s.fill} width="200" height={260 - s.fill} fill={`url(#l${uid})`} />
        <rect x="0" y={s.fill} width="200" height={260 - s.fill} fill="#fff" filter={`url(#tx${uid})`} opacity={creamy ? 0.35 : 0.6} />
        <rect x="0" y={s.fill} width="200" height={260 - s.fill} fill={`url(#la${uid})`} />
        {/* meniscus: bright surface ellipse + darker rim */}
        <g className={animated ? 'tk-wave' : undefined}>
          <ellipse cx="100" cy={s.fill + 1} rx={w * 0.62} ry="4.5" fill="#fff" opacity={creamy ? 0.7 : 0.32} />
          <ellipse cx="100" cy={s.fill + 1} rx={w * 0.62} ry="4.5" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="1" />
          {creamy && <rect x="0" y={s.fill - 1} width="200" height="7" fill="#fff8ec" opacity="0.65" filter={`url(#bs${uid})`} />}
        </g>
        {/* ice: translucent faceted cubes, partly submerged */}
        {Array.from({ length: cubes }).map((_, i) => {
          const size = ice === 'large' ? Math.min(58, w * 0.62) : 26;
          const x = ice === 'large' ? 100 - size / 2 : rx1 + 8 + (i * (w - 30)) / Math.max(1, cubes - 1 || 1);
          const y = s.fill - 8 + (i % 2) * 24;
          const rot = (i % 3) * 9 - 8;
          return (
            <g key={i} transform={`rotate(${rot} ${x + size / 2} ${y + size / 2})`}>
              <rect x={x} y={y} width={size} height={size} rx="4" fill={`url(#ic${uid})`} stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
              <path d={`M${x + 3} ${y + 4} L${x + size - 5} ${y + 3} M${x + 4} ${y + 4} L${x + 3} ${y + size - 6}`} stroke="#fff" strokeOpacity="0.85" strokeWidth="1.2" strokeLinecap="round" />
              <rect x={x + size * 0.3} y={y + size * 0.3} width={size * 0.4} height={size * 0.35} rx="3" fill="#fff" opacity="0.12" />
            </g>
          );
        })}
        {ice === 'crushed' &&
          Array.from({ length: 26 }).map((_, i) => (
            <path key={i} d={`M${rx1 + ((i * 37) % w)} ${s.fill + ((i * 23) % Math.max(20, s.bottom - s.fill - 10))} l${4 + (i % 3) * 2} -3 l3 ${5 + (i % 2) * 3} l-6 3 z`} fill={`url(#ic${uid})`} stroke="#fff" strokeOpacity="0.35" strokeWidth="0.5" />
          ))}
        {sparkling &&
          Array.from({ length: 14 }).map((_, i) => (
            <circle
              key={i}
              className={animated ? 'tk-bubble' : undefined}
              style={{ animationDelay: `${(i * 0.37) % 3.4}s`, transformBox: 'fill-box' }}
              cx={rx1 + 10 + ((i * 29) % (w - 20))}
              cy={s.bottom - 6}
              r={1 + (i % 3) * 0.6}
              fill="none"
              stroke="#fff"
              strokeOpacity="0.9"
              strokeWidth="0.6"
            />
          ))}
        {/* glass wall thickness & environment reflections (window light) */}
        <path d={s.bowl} fill={`url(#gw${uid})`} />
        <rect x={rx1 + w * 0.1} y={ry + 6} width={Math.max(3, w * 0.05)} height={(s.bottom - ry) * 0.75} rx="3" fill={`url(#sp${uid})`} />
        <rect x={rx1 + w * 0.18} y={ry + 14} width="1.5" height={(s.bottom - ry) * 0.5} rx="1" fill="#fff" opacity="0.5" />
        <rect x={rx2 - w * 0.13} y={ry + 20} width={Math.max(2, w * 0.035)} height={(s.bottom - ry) * 0.45} rx="2" fill="#fff" opacity="0.22" />
        {/* heavy bottom of tumblers */}
        {isTall || glass === 'rocks' || glass === 'shot' || glass === 'julep' ? (
          <>
            <rect x="0" y={s.bottom - 12} width="200" height="14" fill="#cfeaff" opacity="0.14" />
            <ellipse cx="100" cy={s.bottom - 12} rx={w * 0.46} ry="3.5" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.8" />
          </>
        ) : null}
        {/* condensation */}
        {(ice !== 'none') && drops.map((d, i) => (
          <g key={i}>
            <circle cx={d.x} cy={d.y} r={d.r} fill={`url(#dr${uid})`} opacity="0.75" />
            <circle cx={d.x - d.r * 0.3} cy={d.y - d.r * 0.35} r={d.r * 0.3} fill="#fff" />
          </g>
        ))}
      </g>

      {/* silhouette: soft thick edge + crisp highlight line */}
      <path d={s.bowl} fill="none" stroke="#e8f6ff" strokeOpacity="0.18" strokeWidth="5" filter={`url(#bs${uid})`} />
      <path d={s.bowl} fill="none" stroke="#fff" strokeOpacity="0.62" strokeWidth="1" />
      <ellipse cx="100" cy={ry} rx={w / 2} ry="4.5" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.1" />
      <ellipse cx="100" cy={ry + 1.5} rx={w / 2 - 2} ry="3" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d={`M${rx1 + w * 0.15} ${ry - 2.5} Q100 ${ry - 6} ${rx2 - w * 0.25} ${ry - 3}`} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9" />
      {s.stem && (
        <>
          <path d={s.stem} fill="none" stroke="#e8f6ff" strokeOpacity="0.25" strokeWidth="6" strokeLinecap="round" filter={`url(#bs${uid})`} />
          <path d={s.stem} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {s.handle && <path d={s.handle} fill="none" stroke={glass === 'copper' ? '#d08a52' : 'rgba(232,246,255,0.6)'} strokeWidth="5" strokeLinecap="round" />}
      {glass === 'solo' && cup === 'red' && (
        <>
          {/* opaque red party cup: liquid only visible at the top, white inside lip, moulded ridges */}
          <path d="M45 72 L60 230 Q100 238 140 230 L155 72 Q100 80 45 72 Z" fill="#d61f2c" />
          <path d="M45 72 L60 230 Q100 238 140 230 L155 72 Q100 80 45 72 Z" fill={`url(#gw${uid})`} opacity="0.9" />
          <rect x="58" y="96" width="9" height="122" rx="4" fill="#fff" opacity="0.28" />
          {[120, 160, 200].map((y) => <path key={y} d={`M${46 + (y - 82) * 0.095} ${y} Q100 ${y + 5} ${154 - (y - 82) * 0.095} ${y}`} stroke="#8e0f19" strokeWidth="1.4" fill="none" opacity="0.7" />)}
          {/* drink surface seen from above + rolled white rim */}
          <ellipse cx="100" cy="70" rx="53" ry="7" fill={color} />
          <ellipse cx="100" cy="70" rx="53" ry="7" fill="#fff" opacity="0.18" />
          <ellipse cx="100" cy="68" rx="56" ry="8" fill="none" stroke="#f4f1ea" strokeWidth="3.2" />
        </>
      )}
      {glass === 'solo' && cup === 'clear' && (
        <>
          {[120, 160, 200].map((y) => <path key={y} d={`M${46 + (y - 72) * 0.095} ${y} Q100 ${y + 5} ${154 - (y - 72) * 0.095} ${y}`} stroke="#fff" strokeWidth="1" fill="none" opacity="0.35" />)}
          <ellipse cx="100" cy="66" rx="56" ry="7.5" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2.6" />
        </>
      )}
      {glass === 'copper' && (
        <>
          <path d={s.bowl} fill="#b8693a" opacity="0.78" />
          <rect x={rx1 + w * 0.12} y={ry + 6} width={w * 0.08} height={(s.bottom - ry) * 0.8} rx="4" fill="#ffd2a8" opacity="0.55" />
        </>
      )}


      {/* garnish on the rim */}
      {(g === 'lime' || g === 'lemon' || g === 'orange') && (
        <g transform={`translate(${rx2 - 8} ${ry - 4})`}>
          <circle r="17" fill={g === 'lime' ? '#9be15d' : g === 'lemon' ? '#ffe14d' : '#ff9a3c'} stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1="0" y1="0" x2={14 * Math.cos((i * Math.PI) / 4)} y2={14 * Math.sin((i * Math.PI) / 4)} stroke="#fff" strokeOpacity="0.6" strokeWidth="1" />
          ))}
        </g>
      )}
      {g === 'cherry' && (
        <g transform={`translate(${rx1 + w * 0.65} ${ry - 8})`}>
          <path d="M0 0 Q6 -22 18 -30" stroke="#5b8c3a" strokeWidth="2" fill="none" />
          <circle r="9" fill="#c4122f" />
          <circle cx="-3" cy="-3" r="2.5" fill="#fff" opacity="0.6" />
        </g>
      )}
      {g === 'olive' && (
        <g transform={`translate(${rx1 + w * 0.45} ${s.fill + 10}) rotate(-35)`}>
          <line x1="-30" y1="0" x2="34" y2="0" stroke="#d9c7a3" strokeWidth="1.6" />
          <ellipse cx="6" rx="10" ry="7" fill="#7f9a3a" />
          <circle cx="12" r="2.5" fill="#c0392b" />
        </g>
      )}
      {g === 'mint' && (
        <g transform={`translate(${rx1 + w * 0.3} ${ry})`}>
          {[-30, 0, 28].map((r, i) => (
            <ellipse key={i} cx={i * 10 - 10} cy={-14 - i * 3} rx="7" ry="15" fill={i === 1 ? '#3fae5a' : '#58c96e'} transform={`rotate(${r} ${i * 10 - 10} ${-14 - i * 3})`} />
          ))}
        </g>
      )}
      {g === 'berry' && (
        <g transform={`translate(${rx1 + w * 0.6} ${ry - 6})`}>
          {[[0, 0], [7, -4], [-6, -5], [2, -10]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5.5" fill="#5a0f3c" stroke="#a0306a" strokeWidth="1" />
          ))}
        </g>
      )}
      {g === 'pineapple' && (
        <g transform={`translate(${rx2 - 4} ${ry - 4}) rotate(20)`}>
          <path d="M-14 0 L14 0 L0 -26 Z" fill="#ffd34d" stroke="#fff" strokeOpacity="0.6" />
          <path d="M-4 -26 L0 -44 L4 -26" fill="#3fae5a" />
        </g>
      )}
    </svg>
  );
};
