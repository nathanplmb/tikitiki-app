import React, { useMemo, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useAnimationControls } from 'motion/react';
import { RefreshCw, AlertTriangle, Dice5, PartyPopper, ShoppingBag } from 'lucide-react';
import { CocktailRecipe } from '../types/cocktail';
import { FLASH_CATALOG } from '../catalog/flash';
import { toCocktailRecipe, artFor } from '../catalog/adapter';
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
}

const LASERS = [
  { a: '-38deg', c: '#ff1fae', d: '0s' },
  { a: '24deg', c: '#00e5ff', d: '-1.2s' },
  { a: '-12deg', c: '#c6ff00', d: '-2.1s' },
  { a: '42deg', c: '#ff1fae', d: '-0.6s' },
  { a: '6deg', c: '#00e5ff', d: '-3s' },
];
const STICKERS = ['SANS CHICHI', '100% SUPERMARCHÉ', 'PRÉ-SOIRÉE', 'CUL SEC ?'];

/** Crackhead mode home: club lights, a tilting red party cup, flash-of-the-night roulette. */
export const CrackheadHome: React.FC<Props> = ({ barIds, barKnown, recentIds, onSelectCocktail, onOpenRoulette, onOpenParty, onOpenShopping }) => {
  const alcoholic = useMemo(() => FLASH_CATALOG.filter((r) => r.alcoholic), []);
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * alcoholic.length));
  const flash = toCocktailRecipe(alcoholic[idx]);
  const art = artFor(flash);
  const cup = useAnimationControls();

  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [18, -18]), { stiffness: 150, damping: 12 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-24, 24]), { stiffness: 150, damping: 12 });

  const reroll = async () => {
    sounds.playGlassClink();
    await cup.start({ rotate: [0, -16, 14, -10, 8, 0], y: [0, -24, 0, -10, 0], transition: { duration: 0.6 } });
    let next = idx;
    while (next === idx) next = Math.floor(Math.random() * alcoholic.length);
    setIdx(next);
  };

  const ready = useMemo(() => (barKnown ? searchCatalog({ onlyMakeable: true }, { bar: barIds, recentIds }).slice(0, 10) : []), [barIds, barKnown]);
  const all = useMemo(() => searchCatalog({ alcohol: 'with' }, { recentIds }), [recentIds.join()]);
  const sam = useMemo(() => searchCatalog({ alcohol: 'without' }), []);

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
        className="relative h-[88svh] min-h-[600px] max-h-[860px] overflow-hidden"
        style={{ ['--drink' as string]: art.color }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,#3a0050_0%,#12001c_45%,#07000c_100%)]" />
        <div className="tk-lasers" aria-hidden>
          {LASERS.map((l, i) => <i key={i} style={{ ['--a' as string]: l.a, color: l.c, animationDelay: l.d, left: `${20 + i * 15}%` }} />)}
        </div>
        <div className="tk-strobe" aria-hidden />
        {/* disco floor */}
        <div className="absolute inset-x-[-20%] bottom-0 h-[38%] [transform:perspective(400px)_rotateX(60deg)] origin-bottom opacity-60"
          style={{ backgroundImage: 'linear-gradient(#ff1fae 1px, transparent 1px), linear-gradient(90deg, #00e5ff 1px, transparent 1px)', backgroundSize: '44px 44px', maskImage: 'linear-gradient(to top, black, transparent)', WebkitMaskImage: 'linear-gradient(to top, black, transparent)' }} />

        {STICKERS.map((s, i) => (
          <motion.span key={s} initial={{ scale: 0, rotate: 0 }} animate={{ scale: 1, rotate: [-12, 8, -6, 10][i] }} transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 300, damping: 12 }}
            className="tk-sticker absolute text-[11px] z-10" style={{ top: ['14%', '22%', '50%', '58%'][i], [i % 2 ? 'right' : 'left']: ['5%', '4%', '3%', '6%'][i] }}>{s}</motion.span>
        ))}

        <motion.button
          aria-label={`Voir ${flash.name}`}
          onClick={() => onSelectCocktail(flash)}
          style={{ rotateX: rx, rotateY: ry, transformPerspective: 700 }}
          className="absolute inset-x-0 top-[9%] flex justify-center"
        >
          <motion.div animate={cup} className="w-[62vw] max-w-[300px] tk-float">
            <CocktailArt {...art} glass="solo" cup="red" className="w-full drop-shadow-[0_0_40px_rgba(255,31,174,0.55)]" />
          </motion.div>
        </motion.button>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-8 pt-20 bg-gradient-to-t from-[#07000c] via-[#07000c]/85 to-transparent">
          <div className="tk-tape inline-block -rotate-2 px-2 py-1 text-[11px] mb-3"><span>FLASH DU SOIR</span></div>
          <motion.h1 key={flash.id} initial={{ opacity: 0, scale: 1.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="tk-display tk-gradient-text tk-glitch text-[44px] sm:text-[60px] uppercase">
            {flash.name}
          </motion.h1>
          <p className="text-[13.5px] text-white/80 mt-2 max-w-[36ch]">{flash.description}</p>
          <div className="flex gap-2.5 mt-5">
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => onSelectCocktail(flash)} className="tk-cta flex-1 h-14 rounded-2xl text-[15px] font-black uppercase tracking-wide">
              La recette
            </motion.button>
            <motion.button whileTap={{ scale: 0.88, rotate: -20 }} onClick={reroll} aria-label="Un autre flash" className="tk-liquid h-14 px-4 rounded-2xl flex items-center gap-2 text-[13px] font-black uppercase text-white">
              <RefreshCw className="w-5 h-5" /> Ressers
            </motion.button>
          </div>
        </div>
      </section>

      <div className="px-4 space-y-9">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { l: 'La roue', s: 'Pass or Smash', i: Dice5, f: onOpenRoulette, c: '#ff1fae' },
            { l: 'Soirée', s: 'Calcul du seau', i: PartyPopper, f: onOpenParty, c: '#c6ff00' },
            { l: 'Courses', s: 'Direction Lidl', i: ShoppingBag, f: onOpenShopping, c: '#00e5ff' },
          ].map((a, i) => (
            <motion.button key={a.l} whileTap={{ scale: 0.9, rotate: i % 2 ? 3 : -3 }} onClick={() => { sounds.playTap(); a.f(); }}
              className="tk-glass rounded-2xl p-3 text-left" style={{ rotate: `${[-2, 1.5, -1][i]}deg` }}>
              <a.i className="w-6 h-6 mb-2" style={{ color: a.c, filter: `drop-shadow(0 0 8px ${a.c})` }} />
              <div className="tk-display text-[15px] text-white uppercase">{a.l}</div>
              <div className="text-[10.5px] text-white/55">{a.s}</div>
            </motion.button>
          ))}
        </div>

        {ready.length > 0 && (
          <section>
            <h2 className="tk-display text-[26px] text-white uppercase mb-3">Faisable <span className="tk-gradient-text">direct</span></h2>
            <div className="tk-scroll-x gap-3 -mx-4 px-4 pb-2">
              {ready.map((m, i) => <RecipeCard key={m.recipe.id} index={i} c={toCocktailRecipe(m.recipe)} availability={m.availability} missing={m.missing} subs={m.substitutions} onOpen={() => onSelectCocktail(toCocktailRecipe(m.recipe))} />)}
            </div>
          </section>
        )}

        <section>
          <h2 className="tk-display text-[26px] text-white uppercase mb-3">Tous les <span className="tk-gradient-text">flashs</span></h2>
          <div className="grid grid-cols-2 gap-3">
            {all.map((m, i) => (
              <div key={m.recipe.id} style={{ rotate: `${(i % 3) - 1}deg` }}>
                <RecipeCard size="fluid" index={i} c={toCocktailRecipe(m.recipe)} onOpen={() => onSelectCocktail(toCocktailRecipe(m.recipe))} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="tk-display text-[26px] text-white uppercase mb-1">Le coin du <span className="tk-gradient-text">SAM</span></h2>
          <p className="text-[12px] text-white/55 mb-3">Celui qui conduit mérite aussi son flash.</p>
          <div className="tk-scroll-x gap-3 -mx-4 px-4 pb-2">
            {sam.map((m, i) => <RecipeCard key={m.recipe.id} size="sm" index={i} c={toCocktailRecipe(m.recipe)} onOpen={() => onSelectCocktail(toCocktailRecipe(m.recipe))} />)}
          </div>
        </section>

        <section className="rounded-2xl border-2 border-[#c6ff00] bg-[#c6ff00]/10 p-4 flex gap-3">
          <AlertTriangle className="w-6 h-6 text-[#c6ff00] shrink-0" />
          <p className="text-[12.5px] text-white/85 leading-relaxed">
            Alcool + boisson énergisante : la caféine masque l’ivresse, on se sent moins saoul qu’on ne l’est. Alterne avec de l’eau, mange avant, et désigne ton SAM.
            L’abus d’alcool est dangereux pour la santé.
          </p>
        </section>
      </div>
    </div>
  );
};
