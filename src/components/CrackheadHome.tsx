import React, { useEffect, useMemo, useRef, useState } from 'react';
import { setFocusColor } from '../utils/theme';
import { motion, useMotionValue, useSpring, useTransform, useAnimationControls } from 'motion/react';
import { RefreshCw, AlertTriangle, Flame, PartyPopper, ShoppingBag } from 'lucide-react';
import { CocktailRecipe } from '../types/cocktail';
import { FLASH_CATALOG } from '../catalog/flash';
import { toCocktailRecipe, artFor } from '../catalog/adapter';
import { COLLECTIONS } from '../catalog/collections';
import { searchCatalog } from '../engine/search';
import { CocktailArt } from './CocktailArt';
import { RecipeCard } from './ui';
import { sounds } from '../utils/audio';

interface Props {
  barIds: Set<string>;
  barKnown: boolean;
  recentIds: string[];
  onSelectCocktail: (c: CocktailRecipe) => void;
  onOpenRoulette: () => void;
  onOpenParty: () => void;
  onOpenShopping: () => void;
  onOpenCollection: (id: string) => void;
}

const EMBERS = Array.from({ length: 18 }, (_, i) => ({ left: (i * 37) % 100, delay: (i * 0.7) % 6, dur: 6 + (i % 5), dx: `${((i % 7) - 3) * 14}px` }));

/** Original heavy-metal wordmark: molten red lettering split by a lightning bolt. */
export const MetalLogo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative flex items-center justify-center gap-1 tk-logo-burn ${className}`} aria-label="TikiTiki version crackhead">
    <span className="tk-display tk-gradient-text text-[64px] sm:text-[84px] leading-none">TIKI</span>
    <svg viewBox="0 0 40 80" className="h-[64px] sm:h-[84px] -mx-1 drop-shadow-[0_0_12px_var(--accent)]" aria-hidden>
      <defs>
        <linearGradient id="bolt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3d6" />
          <stop offset="0.4" stopColor="var(--accent)" />
          <stop offset="1" stopColor="#7a0500" />
        </linearGradient>
      </defs>
      <path d="M26 0 L4 44 L18 44 L10 80 L36 30 L22 30 L32 0 Z" fill="url(#bolt)" stroke="#ffd2c0" strokeWidth="1" />
    </svg>
    <span className="tk-display tk-gradient-text text-[64px] sm:text-[84px] leading-none">TIKI</span>
  </div>
);

export const CrackheadHome: React.FC<Props> = ({ barIds, barKnown, recentIds, onSelectCocktail, onOpenRoulette, onOpenParty, onOpenShopping, onOpenCollection }) => {
  const pool = useMemo(() => FLASH_CATALOG.filter((r) => r.alcoholic && r.glass === 'bottle'), []);
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * pool.length));
  const flash = toCocktailRecipe(pool[idx]);
  const art = artFor(flash);
  useEffect(() => setFocusColor(flash.pack?.bg && flash.pack.bg !== '#0d0d0d' ? flash.pack.bg : art.color, 4), [flash.id]);
  const bottle = useAnimationControls();

  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [16, -16]), { stiffness: 140, damping: 13 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-28, 28]), { stiffness: 140, damping: 13 });

  const reroll = async () => {
    sounds.playGlassClink();
    await bottle.start({ rotate: [0, 180, 360], y: [0, -40, 0], transition: { duration: 0.7, ease: 'easeInOut' } });
    bottle.set({ rotate: 0 });
    let next = idx;
    while (next === idx) next = Math.floor(Math.random() * pool.length);
    setIdx(next);
  };

  const ready = useMemo(() => (barKnown ? searchCatalog({ onlyMakeable: true }, { bar: barIds, recentIds }).slice(0, 10) : []), [barIds, barKnown]);
  const collections = COLLECTIONS.crackhead;

  return (
    <div className="tk-safe-bottom -mx-4 sm:mx-0">
      <section
        ref={ref}
        onPointerMove={(e) => {
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
        className="relative h-[90svh] min-h-[640px] max-h-[880px] overflow-hidden bg-[#050505]"
        style={{ ['--drink' as string]: art.color }}
      >
        {/* stage: red spotlights, smoke, embers, rare lightning */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#3a0602_0%,#120202_45%,#050505_80%)]" />
        <div className="tk-spot left-[-8%]" style={{ ['--a' as string]: '-18deg' }} aria-hidden />
        <div className="tk-spot right-[-8%]" style={{ ['--a' as string]: '18deg', animationDelay: '-3s' }} aria-hidden />
        <div className="tk-smoke w-[90%] h-[30%] left-[-20%] top-[48%]" aria-hidden />
        <div className="tk-smoke w-[80%] h-[26%] right-[-25%] top-[58%]" style={{ animationDelay: '-7s' }} aria-hidden />
        {EMBERS.map((e, i) => (
          <span key={i} className="tk-ember" aria-hidden style={{ left: `${e.left}%`, animationDelay: `${e.delay}s`, animationDuration: `${e.dur}s`, ['--dx' as string]: e.dx }} />
        ))}
        <div className="tk-lightning" aria-hidden />

        <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.9, ease: [0.2, 1, 0.3, 1] }}
          className="absolute inset-x-0 top-[calc(env(safe-area-inset-top)+64px)] flex flex-col items-center">
          <MetalLogo />
          <div className="tk-display text-[22px] text-white/90 -mt-1 [text-shadow:0_0_14px_color-mix(in_srgb,var(--accent)_80%,transparent)]">version crackhead</div>
          <div className="tk-mono text-[9px] mt-1 tracking-[0.45em]">Pré-soirée · Épicerie de nuit · {FLASH_CATALOG.length} références</div>
        </motion.div>

        {/* bottle on a smoked-glass plinth, tilts with the finger, flips on reroll */}
        <motion.button aria-label={`Voir ${flash.name}`} onClick={() => onSelectCocktail(flash)} style={{ rotateX: rx, rotateY: ry, transformPerspective: 700 }}
          className="absolute inset-x-0 top-[25%] flex justify-center">
          <motion.div animate={bottle} className="w-[46vw] max-w-[220px] tk-float">
            <CocktailArt {...art} glass="bottle" className="w-full drop-shadow-[0_0_40px_color-mix(in_srgb,var(--accent)_55%,transparent)]" />
          </motion.div>
        </motion.button>
        <div className="absolute left-1/2 -translate-x-1/2 top-[62%] w-[64vw] max-w-[300px] h-6 rounded-[50%] bg-[radial-gradient(ellipse,color-mix(in_srgb,var(--accent)_55%,transparent),transparent_70%)] blur-md" aria-hidden />

        <div className="absolute inset-x-0 bottom-0 px-5 pb-8 pt-16 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent">
          <div className="flex items-center gap-2 tk-mono text-[10px]"><Flame className="w-3.5 h-3.5 text-[var(--accent)]" /> Flash du soir</div>
          <motion.h1 key={flash.id} initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            className="tk-display text-[42px] sm:text-[56px] text-white mt-1 [text-shadow:0_0_18px_color-mix(in_srgb,var(--accent)_65%,transparent)]">
            {flash.name}
          </motion.h1>
          <p className="text-[13px] text-white/70 mt-1.5 max-w-[36ch]">{flash.description}</p>
          <div className="flex gap-2.5 mt-5">
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => onSelectCocktail(flash)} className="tk-cta flex-1 h-14 rounded-2xl text-[14px] font-extrabold uppercase tracking-[0.12em]">
              La recette
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={reroll} aria-label="Un autre flash" className="tk-liquid h-14 px-4 rounded-2xl flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-white">
              <RefreshCw className="w-4.5 h-4.5" /> Ressers
            </motion.button>
          </div>
        </div>
      </section>

      <div className="px-4 space-y-9">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { l: 'Pass or Smash', i: Flame, f: onOpenRoulette },
            { l: 'Soirée', i: PartyPopper, f: onOpenParty },
            { l: 'Courses', i: ShoppingBag, f: onOpenShopping },
          ].map((a) => (
            <motion.button key={a.l} whileTap={{ scale: 0.92 }} onClick={() => { sounds.playTap(); a.f(); }} className="tk-glass rounded-2xl p-3.5 text-left">
              <a.i className="w-5 h-5 mb-3 text-[var(--accent)] drop-shadow-[0_0_8px_var(--accent)]" />
              <div className="text-[12.5px] font-extrabold uppercase tracking-wide text-white">{a.l}</div>
            </motion.button>
          ))}
        </div>

        <section>
          <h2 className="tk-display text-[34px] text-white mb-3">Collections</h2>
          <div className="space-y-3">
            {collections.map((c, i) => {
              const items = FLASH_CATALOG.filter(c.match);
              return (
                <motion.button key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => onOpenCollection(c.id)} style={{ ['--drink' as string]: c.color }}
                  className="tk-glass relative w-full h-[96px] rounded-[22px] overflow-hidden flex items-center text-left px-4">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_50%,color-mix(in_srgb,var(--drink)_40%,transparent),transparent_55%)]" />
                  <div className="relative flex-1">
                    <div className="tk-mono text-[9px]">{c.kicker} · {items.length}</div>
                    <div className="tk-display text-[26px] text-white leading-tight">{c.title}</div>
                  </div>
                  <div className="relative flex -space-x-6 mr-1">
                    {items.slice(0, 3).map((r, j) => (
                      <div key={r.id} className="w-12 h-[84px]" style={{ transform: `rotate(${(j - 1) * 9}deg) translateY(${j === 1 ? -4 : 4}px)` }}>
                        <CocktailArt color={r.color} glass={r.glass} ice={r.ice} pack={r.pack} animated={false} glow={false} className="w-full h-full" />
                      </div>
                    ))}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {ready.length > 0 && (
          <section>
            <h2 className="tk-display text-[34px] text-white mb-3">Faisable direct</h2>
            <div className="tk-scroll-x gap-3 -mx-4 px-4 pb-2">
              {ready.map((m, i) => <RecipeCard key={m.recipe.id} index={i} c={toCocktailRecipe(m.recipe)} availability={m.availability} missing={m.missing} subs={m.substitutions} onOpen={() => onSelectCocktail(toCocktailRecipe(m.recipe))} />)}
            </div>
          </section>
        )}

        <section className="tk-glass rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-6 h-6 text-[var(--accent)] shrink-0" />
          <p className="text-[12.5px] text-white/80 leading-relaxed">
            Bières fortes et boissons énergisantes trompent : la caféine masque l’ivresse et une canette de bière forte compte comme plusieurs verres.
            Alterne avec de l’eau, mange avant, désigne ton SAM. L’abus d’alcool est dangereux pour la santé.
          </p>
        </section>
      </div>
    </div>
  );
};
