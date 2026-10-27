import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { Dice5, Heart, X, ArrowRight } from 'lucide-react';
import { ALL_BY_ID, getActiveCatalog } from '../catalog/active';
import { toCocktailRecipe, artFor } from '../catalog/adapter';
import { CocktailRecipe } from '../types/cocktail';
import { Family, Taste } from '../catalog/types';
import { FAMILY_LABEL, TASTE_LABEL } from '../engine/text';
import { CocktailArt } from './CocktailArt';
import { CatalogBrowser } from './CatalogBrowser';
import { RecipeCard, SectionHead } from './ui';
import { sounds } from '../utils/audio';

interface Props {
  barIds: Set<string>;
  barKnown: boolean;
  recentIds: string[];
  favoriteIds: string[];
  preferredTastes: Taste[];
  initialTastes?: Taste[];
  initialCollection?: string;
  mode: 'swipe' | 'catalog';
  onModeChange: (m: 'swipe' | 'catalog') => void;
  onSelectCocktail: (c: CocktailRecipe) => void;
  onLike: (c: CocktailRecipe) => void;
  onPass: (c: CocktailRecipe) => void;
}

const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

/** Swipe deck: like = add to collection (and learn taste), pass = learn dislike. */
const SwipeDeck: React.FC<{ onOpen: (c: CocktailRecipe) => void; onLike: (c: CocktailRecipe) => void; onPass: (c: CocktailRecipe) => void; exclude: string[] }> = ({ onOpen, onLike, onPass, exclude }) => {
  const [deck, setDeck] = useState(() => shuffle(getActiveCatalog().filter((r) => !exclude.includes(r.id))).slice(0, 30).map(toCocktailRecipe));
  const [dir, setDir] = useState(0);
  const top = deck[0];
  const next = (liked: boolean) => {
    if (!top) return;
    setDir(liked ? 1 : -1);
    sounds.playTap();
    liked ? onLike(top) : onPass(top);
    setDeck((d) => d.slice(1));
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 110) next(true);
    else if (info.offset.x < -110) next(false);
  };
  return (
    <div className="relative">
      <div className="relative h-[min(440px,52svh)] min-h-[340px]">
        <AnimatePresence custom={dir}>
          {deck.slice(0, 3).reverse().map((c, i, arr) => {
            const isTop = i === arr.length - 1;
            const a = artFor(c);
            return (
              <motion.div key={c.id} drag={isTop ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.9} onDragEnd={onDragEnd}
                initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1 - (arr.length - 1 - i) * 0.05, y: (arr.length - 1 - i) * 14, opacity: 1 }}
                variants={{ out: (d: number) => ({ x: d * 420, rotate: d * 25, opacity: 0, transition: { duration: 0.35 } }) }} exit="out" custom={dir}
                whileDrag={{ rotate: 0 }} style={{ ['--drink' as string]: a.color, zIndex: i }}
                className="absolute inset-0 tk-glass rounded-[32px] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,color-mix(in_srgb,var(--drink)_55%,transparent),transparent_65%)]" />
                <CocktailArt {...a} animated={isTop} className="absolute left-1/2 -translate-x-1/2 top-4 h-[62%]" />
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="tk-mono text-[9.5px] text-white/60">{FAMILY_LABEL[ALL_BY_ID[c.catalogId!].family]}</div>
                  <div className="tk-display text-[44px] text-white">{c.name}</div>
                  <p className="text-[12.5px] text-white/70 line-clamp-2">{c.description}</p>
                  {isTop && <button onClick={() => onOpen(c)} className="mt-2 text-[12px] font-semibold text-white flex items-center gap-1">Voir la recette <ArrowRight className="w-3.5 h-3.5" /></button>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {!top && <div className="absolute inset-0 flex items-center justify-center text-white/60 text-[13px]">Plus de cartes. Reviens plus tard !</div>}
      </div>
      <div className="flex justify-center gap-6 mt-5">
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => next(false)} aria-label="Pass" className="tk-liquid h-16 px-6 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold text-white/85"><X className="w-6 h-6" />Pass</motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => next(true)} aria-label="Smash : ajouter à ma collection" className="tk-cta h-16 px-6 rounded-full flex items-center justify-center gap-2 text-[14px] font-bold text-white"><Heart className="w-6 h-6" />Smash</motion.button>
      </div>
      <p className="text-center text-[11px] text-white/40 mt-3">Glisse à droite pour Smash (enregistré dans ta collection), à gauche pour Pass. TIKITIKI apprend tes goûts.</p>
    </div>
  );
};

export const DiscoveriesView: React.FC<Props> = (p) => {
  const { mode, onModeChange: setMode } = p;
  const [roulette, setRoulette] = useState<CocktailRecipe | null>(null);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    setSpinning(true);
    let n = 0;
    const iv = setInterval(() => {
      n++;
      sounds.playTick();
      setRoulette(toCocktailRecipe(getActiveCatalog()[Math.floor(Math.random() * getActiveCatalog().length)]));
      if (n > 14) { clearInterval(iv); setSpinning(false); sounds.playSuccessChime(); }
    }, 70);
  };

  return (
    <div className="tk-safe-bottom space-y-8 pt-2">
      <header>
        <div className="tk-mono text-[10px] text-white/50">{getActiveCatalog().length} recettes · hors ligne</div>
        <h1 className="tk-display text-[56px] text-white mt-1">Décou<span className="italic tk-gradient-text">vertes</span></h1>
        <div className="grid grid-cols-2 gap-1 p-1 mt-4 rounded-full tk-glass">
          {(['swipe', 'catalog'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="relative h-10 rounded-full text-[12.5px] font-bold">
              {mode === m && <motion.span layoutId="disc-seg" className="absolute inset-0 rounded-full bg-white" />}
              <span className={`relative ${mode === m ? 'text-[#0b0b10]' : 'text-white/60'}`}>{m === 'swipe' ? 'Pass or Smash' : 'Catalogue'}</span>
            </button>
          ))}
        </div>
      </header>

      {mode === 'swipe' ? (
        <>
          <SwipeDeck onOpen={p.onSelectCocktail} onLike={p.onLike} onPass={p.onPass} exclude={p.favoriteIds} />

          <section className="tk-glass rounded-[28px] p-5 text-center" style={{ ['--drink' as string]: roulette?.color ?? '#7c5cff' }}>
            <div className="tk-mono text-[9.5px] text-white/45">Roulette du catalogue</div>
            <div className="h-36 my-2 flex items-center justify-center">
              {roulette ? <CocktailArt {...artFor(roulette)} animated={!spinning} className="h-full" /> : <Dice5 className="w-14 h-14 text-white/30" />}
            </div>
            <div className="tk-display text-[34px] text-white h-10">{roulette?.name ?? '???'}</div>
            <div className="flex gap-2 mt-4">
              <button onClick={spin} disabled={spinning} className="tk-cta flex-1 h-12 rounded-full text-[13px] font-bold text-white flex items-center justify-center gap-2"><Dice5 className="w-4 h-4" />{spinning ? 'Tirage…' : 'Lancer'}</button>
              {roulette && !spinning && <button onClick={() => p.onSelectCocktail(roulette)} className="tk-glass flex-1 h-12 rounded-full text-[13px] font-bold text-white">Voir la recette</button>}
            </div>
          </section>

        </>
      ) : (
        <CatalogBrowser {...p} onOpen={p.onSelectCocktail} />
      )}
    </div>
  );
};

export { TASTE_LABEL };
