import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Sparkles, Check, Search } from 'lucide-react';
import { UserBarItem, CocktailRecipe } from '../types/cocktail';
import { INGREDIENT_LIST, INGREDIENTS } from '../catalog/ingredients';
import { IngredientCategory } from '../catalog/types';
import { searchCatalog } from '../engine/search';
import { matchIngredientId, normalize } from '../engine/text';
import { toCocktailRecipe } from '../catalog/adapter';
import { RecipeCard, SectionHead } from './ui';
import { sounds } from '../utils/audio';

interface MyBarViewProps {
  userBar: UserBarItem[];
  barIds: Set<string>;
  onToggleStock: (id: string) => void;
  onAddItem: (name: string, category: UserBarItem['category'], ingredientId?: string) => void;
  onRemoveItem: (id: string) => void;
  onGenerateFromBar: (stockedBases: string[], stockedMixers: string[], stockedAromatics: string[]) => void;
  onSelectCocktail: (c: CocktailRecipe) => void;
  recentIds: string[];
}

const SHELVES: { id: UserBarItem['category']; label: string; cats: IngredientCategory[]; c: string }[] = [
  { id: 'alcool', label: 'Spiritueux & liqueurs', cats: ['spirit', 'liqueur', 'aperitif', 'wine', 'bitters', 'beer'], c: '#ffb547' },
  { id: 'diluant', label: 'Softs & jus', cats: ['mixer', 'juice'], c: '#7cd7ff' },
  { id: 'sirop', label: 'Sirops', cats: ['syrup'], c: '#ff4f8b' },
  { id: 'garniture', label: 'Frais & épicerie', cats: ['fresh', 'dairy', 'pantry', 'garnish'], c: '#3ee6a6' },
];

export const MyBarView: React.FC<MyBarViewProps> = ({ userBar, barIds, onToggleStock, onAddItem, onRemoveItem, onGenerateFromBar, onSelectCocktail, recentIds }) => {
  const [shelf, setShelf] = useState<UserBarItem['category']>('alcool');
  const [q, setQ] = useState('');
  const active = SHELVES.find((s) => s.id === shelf)!;

  const ready = useMemo(() => searchCatalog({ onlyMakeable: true }, { bar: barIds, recentIds }), [barIds]);
  const almost = useMemo(() => searchCatalog({}, { bar: barIds }).filter((m) => m.availability === 'missing' && m.missing.length === 1).slice(0, 12), [barIds]);
  const unlock = useMemo(() => {
    const count = new Map<string, number>();
    for (const m of almost) count.set(m.missing[0], (count.get(m.missing[0]) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [almost]);

  const byName = new Map(userBar.map((b) => [b.ingredientId ?? matchIngredientId(b.name), b]));
  const suggestions = INGREDIENT_LIST.filter((i) => active.cats.includes(i.category) && !i.staple && (!q || normalize(i.name + ' ' + i.synonyms.join(' ')).includes(normalize(q))));
  const custom = userBar.filter((b) => b.category === shelf && !(b.ingredientId ?? matchIngredientId(b.name)));

  const toggle = (ingId: string) => {
    sounds.playTap();
    const existing = byName.get(ingId);
    if (existing) onToggleStock(existing.id);
    else onAddItem(INGREDIENTS[ingId].name, shelf, ingId);
  };

  const stocked = (cat: UserBarItem['category']) => userBar.filter((i) => i.category === cat && i.inStock).map((i) => i.name);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { n: barIds.size, l: 'ingrédients' },
            { n: ready.length, l: 'réalisables' },
            { n: almost.length, l: 'à 1 achat' },
          ].map((s) => (
            <div key={s.l} className="tk-glass rounded-[20px] p-3">
              <div className="tk-display text-[34px] text-white leading-none">{s.n}</div>
              <div className="text-[10.5px] text-white/50 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.96 }} disabled={barIds.size === 0}
          onClick={() => { sounds.playGlassClink(); onGenerateFromBar(stocked('alcool'), stocked('diluant'), [...stocked('sirop'), ...stocked('garniture')]); }}
          className="tk-cta w-full h-13 py-3.5 rounded-full text-[14px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40">
          <Sparkles className="w-4 h-4" /> Créer avec l’IA à partir de mon bar
        </motion.button>
      </header>

      <section>
        <div className="tk-scroll-x gap-2 -mx-4 px-4 mb-3">
          {SHELVES.map((s) => {
            const n = userBar.filter((i) => i.category === s.id && i.inStock).length;
            return (
              <button key={s.id} data-on={shelf === s.id} onClick={() => setShelf(s.id)} className="tk-chip px-3.5 py-2 rounded-full text-[12px] font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: s.c }} />{s.label}<span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
        <label className="tk-glass h-11 rounded-full flex items-center gap-2 px-4 mb-3">
          <Search className="w-4 h-4 text-white/50" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher ou ajouter un ingrédient…" aria-label="Chercher un ingrédient" className="flex-1 bg-transparent outline-none text-[13px] text-white placeholder:text-white/35" />
          {q && !suggestions.length && (
            <button onClick={() => { onAddItem(q.trim(), shelf, matchIngredientId(q)); setQ(''); }} className="text-[11px] font-bold text-white flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Ajouter</button>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((ing) => {
            const item = byName.get(ing.id);
            const on = Boolean(item?.inStock);
            return (
              <motion.button layout key={ing.id} whileTap={{ scale: 0.92 }} onClick={() => toggle(ing.id)} aria-pressed={on}
                className={`px-3 py-2 rounded-2xl text-[12px] font-semibold border transition-all flex items-center gap-1.5 ${on ? 'text-[#0b0b10] border-transparent' : 'text-white/70 border-white/10 bg-white/[0.03]'}`}
                style={on ? { background: active.c, boxShadow: `0 6px 24px -6px ${active.c}` } : undefined}>
                {on && <Check className="w-3.5 h-3.5" />}{ing.name}
              </motion.button>
            );
          })}
          {custom.map((b) => (
            <span key={b.id} className="px-3 py-2 rounded-2xl text-[12px] font-semibold border border-white/15 text-white/80 flex items-center gap-2">
              {b.name} <span className="text-[9px] text-white/40">(non reconnu)</span>
              <button onClick={() => onRemoveItem(b.id)} aria-label={`Supprimer ${b.name}`}><Trash2 className="w-3.5 h-3.5 text-white/50" /></button>
            </span>
          ))}
        </div>
      </section>

      {unlock.length > 0 && (
        <section className="tk-glass rounded-[24px] p-4">
          <div className="tk-mono text-[9.5px] text-white/45 mb-2">Achats qui débloquent le plus</div>
          <div className="space-y-2">
            {unlock.map(([id, n]) => (
              <div key={id} className="flex items-center justify-between text-[13px]">
                <span className="text-white">{INGREDIENTS[id].name}</span>
                <span className="text-white/55">+{n} cocktail{n > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHead kicker="Avec ce que tu as" title={`Réalisables · ${ready.length}`} />
        <AnimatePresence>
          {ready.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ready.slice(0, 18).map((m, i) => (
                <RecipeCard key={m.recipe.id} size="fluid" index={i} c={toCocktailRecipe(m.recipe)} availability={m.availability} missing={m.missing} subs={m.substitutions} onOpen={() => onSelectCocktail(toCocktailRecipe(m.recipe))} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-white/55 px-1">Aucune recette complète pour l’instant. Ajoute des ingrédients ci-dessus.</p>
          )}
        </AnimatePresence>
      </section>

      {almost.length > 0 && (
        <section>
          <SectionHead kicker="Il ne manque qu’un ingrédient" title="Presque prêts" />
          <div className="tk-scroll-x gap-3 -mx-4 px-4 pb-2">
            {almost.map((m, i) => (
              <RecipeCard key={m.recipe.id} index={i} c={toCocktailRecipe(m.recipe)} availability={m.availability} missing={m.missing} onOpen={() => onSelectCocktail(toCocktailRecipe(m.recipe))} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
