import React, { useEffect, useMemo, useRef } from 'react';
import { setFocusColor } from '../utils/theme';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowRight, Sparkles, PartyPopper, Dice5, ShoppingBag, Wine } from 'lucide-react';
import { CocktailRecipe, UserTastePreferences } from '../types/cocktail';
import { getActiveCatalog } from '../catalog/active';
import { toCocktailRecipe } from '../catalog/adapter';
import { dailyPick, searchCatalog } from '../engine/search';
import { TASTE_LABEL } from '../engine/text';
import { Taste } from '../catalog/types';
import { CocktailArt } from './CocktailArt';
import { artFor } from '../catalog/adapter';
import { RecipeCard, SectionHead } from './ui';
import { sounds } from '../utils/audio';

interface DashboardProps {
  onStartLab: () => void;
  onOpenRoulette: () => void;
  onOpenParty: () => void;
  onOpenShopping: () => void;
  onOpenMood: (taste: Taste) => void;
  onOpenBar: () => void;
  recentCocktails: CocktailRecipe[];
  onSelectCocktail: (cocktail: CocktailRecipe) => void;
  barIds: Set<string>;
  barKnown: boolean;
  recentIds: string[];
  favoriteIds: string[];
  tastePrefs: UserTastePreferences;
  preferredTastes: Taste[];
  shoppingCount: number;
}

const BOKEH = [
  { x: 6, y: 10, r: 70, c: '#ffb36b', blur: 18, o: 0.55 },
  { x: 72, y: 6, r: 90, c: '#ff5f8f', blur: 24, o: 0.45 },
  { x: 84, y: 34, r: 46, c: '#ffd18a', blur: 10, o: 0.6 },
  { x: 18, y: 38, r: 38, c: '#9ad1ff', blur: 9, o: 0.4 },
  { x: 40, y: 4, r: 30, c: '#fff1c9', blur: 6, o: 0.5 },
  { x: 58, y: 44, r: 26, c: '#ff9a5a', blur: 7, o: 0.45 },
  { x: -4, y: 48, r: 110, c: '#7c5cff', blur: 30, o: 0.3 },
  { x: 90, y: 14, r: 22, c: '#ffffff', blur: 5, o: 0.35 },
];

const MOODS: { t: Taste; emoji: string; c: string }[] = [
  { t: 'tropical', emoji: '🌴', c: '#ffb547' },
  { t: 'acidule', emoji: '🍋', c: '#d4f25a' },
  { t: 'amer', emoji: '🍊', c: '#ff5a3c' },
  { t: 'petillant', emoji: '🫧', c: '#7cd7ff' },
  { t: 'herbace', emoji: '🌿', c: '#3ee6a6' },
  { t: 'cremeux', emoji: '🥥', c: '#f4e3c8' },
  { t: 'epice', emoji: '🌶️', c: '#ff6b6b' },
  { t: 'fume', emoji: '🔥', c: '#c8742f' },
];

export const Dashboard: React.FC<DashboardProps> = ({
  onStartLab, onOpenRoulette, onOpenParty, onOpenShopping, onOpenMood, onOpenBar, recentCocktails, onSelectCocktail,
  barIds, barKnown, recentIds, favoriteIds, tastePrefs, preferredTastes, shoppingCount,
}) => {
  const hero = useMemo(() => toCocktailRecipe(dailyPick()), []);
  const art = artFor(hero);
  useEffect(() => setFocusColor(art.color), [art.color]);

  // Interactive tilt + scroll parallax for the hero glass
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 120, damping: 14 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 120, damping: 14 });
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, 120]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.85]);
  const titleY = useTransform(scrollY, [0, 400], [0, -60]);

  const ctx = { bar: barKnown ? barIds : undefined, recentIds, favoriteIds, preferredTastes, preferredSweetness: tastePrefs.preferredSweetness };
  const makeable = useMemo(() => (barKnown ? searchCatalog({ onlyMakeable: true }, ctx).slice(0, 10) : []), [barIds, barKnown, recentIds.join()]);
  const forYou = useMemo(() => searchCatalog({ tastes: preferredTastes.length ? preferredTastes : undefined }, { ...ctx, bar: undefined }).filter((m) => m.recipe.id !== hero.catalogId).slice(0, 10), [preferredTastes.join(), recentIds.join()]);
  const zeroProof = useMemo(() => searchCatalog({ alcohol: 'without' }, ctx).slice(0, 8), [recentIds.join()]);

  return (
    <div className="tk-safe-bottom -mx-4 sm:mx-0">
      {/* ── HERO ── */}
      <section
        ref={ref}
        onPointerMove={(e) => {
          const r = ref.current?.getBoundingClientRect();
          if (!r) return;
          mx.set((e.clientX - r.left) / r.width - 0.5);
          my.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
        className="relative h-[86svh] min-h-[560px] max-h-[820px] overflow-hidden"
        style={{ ['--drink' as string]: art.color }}
      >
        {/* Night bar scene: out-of-focus bottle lights (bokeh), warm back-light, reflective counter */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,color-mix(in_srgb,var(--drink)_32%,#1a0f14)_0%,#0a0709_55%,#050406_100%)]" />
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          {BOKEH.map((b, i) => (
            <motion.span key={i} className="absolute rounded-full" style={{ left: b.x + '%', top: b.y + '%', width: b.r, height: b.r, background: b.c, filter: `blur(${b.blur}px)`, opacity: b.o, mixBlendMode: 'screen' }}
              animate={{ y: [0, -8, 0], opacity: [b.o, b.o * 0.6, b.o] }} transition={{ repeat: Infinity, duration: 5 + (i % 4), delay: i * 0.3, ease: 'easeInOut' }} />
          ))}
        </div>
        <div className="absolute inset-x-0 top-[56%] h-[44%] bg-[linear-gradient(180deg,rgba(40,24,18,0.0)_0%,rgba(28,16,12,0.85)_8%,#0b0706_100%)]" />
        <div className="absolute inset-x-0 top-[56%] h-px bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--drink)_70%,#fff)] to-transparent opacity-60" />

        <motion.div style={{ y: heroY, scale: heroScale, rotateX: rx, rotateY: ry, transformPerspective: 900 }} className="absolute inset-x-0 top-[8%] flex justify-center">
          <div className="tk-float w-[78vw] max-w-[380px]">
            <CocktailArt {...art} className="w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]" />
          </div>
        </motion.div>

        {/* reflection of the glass in the polished counter */}
        <motion.div style={{ y: heroY, rotateY: ry, transformPerspective: 900 }} className="absolute inset-x-0 top-[57%] flex justify-center pointer-events-none" aria-hidden>
          <div className="w-[78vw] max-w-[380px] -scale-y-100 opacity-25 blur-[1.5px] [mask-image:linear-gradient(to_top,transparent_55%,black_100%)] [-webkit-mask-image:linear-gradient(to_top,transparent_55%,black_100%)] -translate-y-[38%]">
            <CocktailArt {...art} animated={false} glow={false} className="w-full" />
          </div>
        </motion.div>

        <motion.div style={{ y: titleY }} className="absolute inset-x-0 bottom-0 px-5 pb-8 pt-24 bg-gradient-to-t from-[var(--tk-bg)] via-[var(--tk-bg)]/80 to-transparent">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="tk-mono text-[10px] text-white/60 flex items-center gap-2">
            <span className="w-6 h-px bg-white/40" /> Cocktail du jour · Catalogue
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.25, duration: 0.8 }} className="tk-display tk-gradient-text text-[64px] sm:text-[84px] mt-2">
            {hero.name}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-[13.5px] leading-relaxed text-white/70 mt-3 max-w-[34ch]">
            {hero.description}
          </motion.p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(hero.tastes ?? []).map((t) => (
              <span key={t} className="text-[10.5px] px-2.5 py-1 rounded-full bg-white/8 border border-white/12 text-white/80 backdrop-blur">{TASTE_LABEL[t]}</span>
            ))}
            <span className="text-[10.5px] px-2.5 py-1 rounded-full bg-white/8 border border-white/12 text-white/80">{hero.prepTimeMinutes} min</span>
          </div>
          <div className="flex gap-2.5 mt-5">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { sounds.playGlassClink(); onSelectCocktail(hero); }} className="tk-cta flex-1 h-14 rounded-full text-[15px] font-bold text-white flex items-center justify-center gap-2">
              Voir la recette <ArrowRight className="w-4.5 h-4.5" />
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onStartLab} aria-label="Créer avec l'IA" className="tk-glass h-14 w-14 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </motion.div>
      </section>

      <div className="px-4 space-y-10 relative">
        {/* ── QUICK ACTIONS ── */}
        <section className="grid grid-cols-3 gap-2.5 -mt-2">
          {[
            { label: 'Mode soirée', sub: 'Menu & courses', icon: PartyPopper, onClick: onOpenParty, c: '#ff4f8b' },
            { label: 'Roulette', sub: 'Au hasard', icon: Dice5, onClick: onOpenRoulette, c: '#7c5cff' },
            { label: 'Courses', sub: shoppingCount ? `${shoppingCount} à acheter` : 'Liste vide', icon: ShoppingBag, onClick: onOpenShopping, c: '#ffb547' },
          ].map((a, i) => (
            <motion.button key={a.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.07 }} whileTap={{ scale: 0.94 }}
              onClick={() => { sounds.playTap(); a.onClick(); }} style={{ ['--drink' as string]: a.c }}
              className="tk-glass rounded-[24px] p-3.5 text-left overflow-hidden">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: `radial-gradient(circle at 30% 20%, ${a.c}, ${a.c}33)`, boxShadow: `0 8px 24px -6px ${a.c}` }}>
                <a.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-[13px] font-bold text-white leading-tight">{a.label}</div>
              <div className="text-[10.5px] text-white/50 mt-0.5">{a.sub}</div>
            </motion.button>
          ))}
        </section>

        {/* ── MAKEABLE NOW ── */}
        <section>
          <SectionHead kicker={barKnown ? `${makeable.length ? 'Selon ton bar' : 'Ton bar est presque vide'}` : 'Mon bar'} title="Prêt à shaker" />
          {makeable.length ? (
            <div className="tk-scroll-x gap-3 -mx-4 px-4 pb-2">
              {makeable.map((m, i) => (
                <RecipeCard key={m.recipe.id} index={i} c={toCocktailRecipe(m.recipe)} availability={m.availability} missing={m.missing} subs={m.substitutions} onOpen={() => onSelectCocktail(toCocktailRecipe(m.recipe))} />
              ))}
            </div>
          ) : (
            <button onClick={onOpenBar} className="tk-glass w-full text-left rounded-[24px] p-5 flex items-center gap-4">
              <Wine className="w-8 h-8 text-white/40 shrink-0" />
              <p className="text-[13px] text-white/65">Coche ce que tu as dans <b className="text-white">Labo › Mon bar</b> : TIKITIKI te montrera ce que tu peux préparer tout de suite.</p>
            </button>
          )}
        </section>

        {/* ── MOODS ── */}
        <section>
          <SectionHead kicker="Explorer" title="Quelle humeur ?" />
          <div className="grid grid-cols-4 gap-2">
            {MOODS.map((m, i) => (
              <motion.button key={m.t} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.9 }}
                onClick={() => onOpenMood(m.t)} className="relative aspect-square rounded-[22px] overflow-hidden border border-white/10 flex flex-col items-center justify-center gap-1"
                style={{ background: `radial-gradient(circle at 50% 30%, ${m.c}55, ${m.c}10 70%)` }}>
                <span className="text-2xl drop-shadow">{m.emoji}</span>
                <span className="text-[10.5px] font-semibold text-white/90">{TASTE_LABEL[m.t]}</span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── FOR YOU ── */}
        <section>
          <SectionHead kicker={preferredTastes.length ? `D'après tes goûts : ${preferredTastes.map((t) => TASTE_LABEL[t]).join(', ')}` : 'Sélection du catalogue'} title="Pour toi" />
          <div className="tk-scroll-x gap-3 -mx-4 px-4 pb-2">
            {forYou.map((m, i) => (
              <RecipeCard key={m.recipe.id} index={i} c={toCocktailRecipe(m.recipe)} onOpen={() => onSelectCocktail(toCocktailRecipe(m.recipe))} />
            ))}
          </div>
        </section>

        {/* ── ZERO PROOF ── */}
        <section>
          <SectionHead kicker="0,0 % · aussi bons" title="Sans alcool" />
          <div className="tk-scroll-x gap-3 -mx-4 px-4 pb-2">
            {zeroProof.map((m, i) => (
              <RecipeCard key={m.recipe.id} size="sm" index={i} c={toCocktailRecipe(m.recipe)} onOpen={() => onSelectCocktail(toCocktailRecipe(m.recipe))} />
            ))}
          </div>
        </section>

        {/* ── HISTORY ── */}
        {recentCocktails.length > 0 && (
          <section>
            <SectionHead kicker="Historique" title="Récemment" />
            <div className="tk-scroll-x gap-3 -mx-4 px-4 pb-2">
              {recentCocktails.slice(0, 10).map((c, i) => (
                <RecipeCard key={c.id} size="sm" index={i} c={c} onOpen={() => onSelectCocktail(c)} />
              ))}
            </div>
          </section>
        )}

        <p className="text-center text-[10.5px] text-white/35 pb-4">
          {getActiveCatalog().length} recettes intégrées, disponibles hors ligne · L’abus d’alcool est dangereux pour la santé.
        </p>
      </div>
    </div>
  );
};
