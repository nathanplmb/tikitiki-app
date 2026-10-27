import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Minus, Plus, ShoppingCart, Check, Users } from 'lucide-react';
import { CocktailRecipe, PartyPlan } from '../types/cocktail';
import { planParty } from '../engine/search';
import { TASTE_LABEL } from '../engine/text';
import { Taste } from '../catalog/types';
import { toCocktailRecipe } from '../catalog/adapter';
import { CocktailArt } from './CocktailArt';
import { artFor } from '../catalog/adapter';
import { sounds } from '../utils/audio';

interface Props {
  barIds: Set<string>;
  onAddAllToShoppingList: (plan: PartyPlan) => void;
  onSelectCocktail: (cocktail: CocktailRecipe) => void;
}

const VIBES: Taste[] = ['fruite', 'tropical', 'petillant', 'acidule', 'amer', 'herbace'];

export const PartyPlannerView: React.FC<Props> = ({ barIds, onAddAllToShoppingList, onSelectCocktail }) => {
  const [guests, setGuests] = useState(8);
  const [perGuest, setPerGuest] = useState(2);
  const [vibe, setVibe] = useState<Taste[]>([]);
  const [added, setAdded] = useState(false);
  const plan = useMemo(() => planParty({ guests, drinksPerGuest: perGuest, tastes: vibe.length ? vibe : undefined, bar: barIds.size ? barIds : undefined }), [guests, perGuest, vibe.join(), barIds]);
  const recipes = plan.menu.map((m) => toCocktailRecipe(m.recipe));

  const toPartyPlan = (): PartyPlan => ({
    guestCount: guests, budgetTotalEur: 0, theme: vibe.map((t) => TASTE_LABEL[t]).join(', ') || 'Sélection TIKITIKI',
    recipes: recipes.filter((r) => !r.isMocktailOnly), mocktailRecipe: recipes.find((r) => r.isMocktailOnly),
    consolidatedShopping: plan.shopping.filter((s) => !s.inBar).map((s) => ({
      item: s.name,
      bottlesNeeded: s.bottles70 ? `${s.bottles70} bouteille(s) 70 cl (${s.qty} cl)` : s.qty ? `${s.qty} ${s.unit ?? ''}`.trim() : 'selon besoin',
      category: 'autre',
    })),
    prepTimeline: [],
  });

  return (
    <div className="tk-safe-bottom space-y-7 pt-2">
      <header>
        <div className="tk-mono text-[10px] text-white/50">Mode soirée · sans IA, depuis le catalogue</div>
        <h1 className="tk-display text-[56px] text-white mt-1">La carte <span className="italic tk-gradient-text">du soir</span></h1>
      </header>

      <section className="tk-glass rounded-[28px] p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70 text-[13px]"><Users className="w-4 h-4" /> Invités</div>
          <div className="flex items-center gap-4">
            <button aria-label="Moins d'invités" onClick={() => setGuests(Math.max(2, guests - 1))} className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
            <motion.span key={guests} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="tk-display text-[44px] w-14 text-center text-white">{guests}</motion.span>
            <button aria-label="Plus d'invités" onClick={() => setGuests(Math.min(60, guests + 1))} className="w-10 h-10 rounded-full bg-white/8 border border-white/10 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="flex items-center justify-between text-[13px] text-white/70">
          Verres par personne
          <div className="flex gap-1.5">{[1, 2, 3].map((n) => <button key={n} data-on={perGuest === n} onClick={() => setPerGuest(n)} className="tk-chip w-10 h-9 rounded-full text-[12px] font-bold">{n}</button>)}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VIBES.map((t) => <button key={t} data-on={vibe.includes(t)} onClick={() => setVibe(vibe.includes(t) ? vibe.filter((x) => x !== t) : [...vibe, t])} className="tk-chip px-3 py-1.5 rounded-full text-[11.5px] font-semibold">{TASTE_LABEL[t]}</button>)}
        </div>
      </section>

      {/* Premium bar menu card */}
      <section className="relative rounded-[32px] overflow-hidden border border-[#d9b779]/30 bg-[linear-gradient(180deg,#14100a,#0b0907)] p-6">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_0%,#d9b77955,transparent_60%)]" />
        <div className="relative text-center mb-6">
          <div className="tk-mono text-[9.5px] text-[#d9b779]">Carte · {guests} invités · {plan.drinks} verres</div>
          <div className="tk-display text-[40px] text-[#f3e3c3] mt-1">Ce soir</div>
          <div className="mx-auto mt-2 w-16 h-px bg-[#d9b779]/50" />
        </div>
        <div className="relative space-y-4">
          {recipes.map((r, i) => (
            <motion.button key={r.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} onClick={() => onSelectCocktail(r)}
              className="w-full flex items-center gap-4 text-left group">
              <div className="w-16 h-20 shrink-0"><CocktailArt {...artFor(r)} animated={false} glow={false} className="w-full h-full" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="tk-display text-[26px] text-[#f3e3c3] group-hover:text-white truncate">{r.name}</span>
                  <span className="flex-1 border-b border-dotted border-[#d9b779]/30 translate-y-[-4px]" />
                  <span className="tk-mono text-[9px] text-[#d9b779] shrink-0">{r.isMocktailOnly ? '0,0 %' : `×${plan.perRecipe}`}</span>
                </div>
                <div className="text-[11.5px] text-[#f3e3c3]/55 line-clamp-2 mt-0.5">{r.ingredients.filter((x) => !x.optional).map((x) => x.name).join(' · ')}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <h2 className="tk-display text-[32px] text-white">Courses consolidées</h2>
          <button onClick={() => { sounds.playTap(); onAddAllToShoppingList(toPartyPlan()); setAdded(true); setTimeout(() => setAdded(false), 2000); }}
            className="tk-cta px-4 h-10 rounded-full text-[12px] font-bold text-white flex items-center gap-1.5">
            {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}{added ? 'Ajouté' : 'Tout ajouter'}
          </button>
        </div>
        <div className="tk-glass rounded-[24px] divide-y divide-white/5">
          {plan.shopping.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className={`text-[13.5px] ${s.inBar ? 'text-white/40 line-through' : 'text-white'}`}>{s.name}</div>
                <div className="text-[10.5px] text-white/40 truncate">{s.recipes.join(', ')}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12.5px] font-semibold text-white">{s.qty ? `${s.qty} ${s.unit === 'cl' ? 'cl' : s.unit ?? ''}` : '—'}</div>
                {s.bottles70 && <div className="text-[10px] text-white/45">≈ {s.bottles70} × 70 cl</div>}
                {s.inBar && <div className="text-[10px] text-[var(--tk-ready)]">déjà au bar</div>}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10.5px] text-white/40 px-1">Quantités calculées à partir des recettes (un « complément » de soda compte pour 10 cl). Prévois aussi la glace : environ 300 g par verre.</p>
      </section>
    </div>
  );
};
