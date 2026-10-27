import React, { useDeferredValue, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { searchCatalog, SearchCriteria } from '../engine/search';
import { BASE_LABEL, TASTE_LABEL } from '../engine/text';
import { BaseSpirit, Taste } from '../catalog/types';
import { toCocktailRecipe } from '../catalog/adapter';
import { CocktailRecipe } from '../types/cocktail';
import { RecipeCard } from './ui';

interface Props {
  barIds: Set<string>;
  barKnown: boolean;
  recentIds: string[];
  favoriteIds: string[];
  preferredTastes: Taste[];
  initialTastes?: Taste[];
  onOpen: (c: CocktailRecipe) => void;
}

const TASTES = Object.keys(TASTE_LABEL) as Taste[];
const BASES: BaseSpirit[] = ['gin', 'vodka', 'rum', 'tequila', 'mezcal', 'whisky', 'brandy', 'cachaca', 'pisco', 'wine', 'aperitif', 'liqueur'];

const Chip: React.FC<{ on: boolean; onClick: () => void; children: React.ReactNode }> = ({ on, onClick, children }) => (
  <button data-on={on} onClick={onClick} className="tk-chip shrink-0 px-3 py-1.5 rounded-full text-[11.5px] font-semibold">{children}</button>
);

/** Catalog search: works offline, no AI. Filters change the actual results. */
export const CatalogBrowser: React.FC<Props> = ({ barIds, barKnown, recentIds, favoriteIds, preferredTastes, initialTastes, onOpen }) => {
  const [query, setQuery] = useState('');
  const [tastes, setTastes] = useState<Taste[]>(initialTastes ?? []);
  const [bases, setBases] = useState<BaseSpirit[]>([]);
  const [alcohol, setAlcohol] = useState<SearchCriteria['alcohol']>('any');
  const [maxMinutes, setMaxMinutes] = useState<number | undefined>();
  const [onlyMakeable, setOnlyMakeable] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(24);
  const q = useDeferredValue(query);

  const results = useMemo(
    () => searchCatalog({ query: q, tastes, bases, alcohol, maxMinutes, onlyMakeable: barKnown && onlyMakeable },
      { bar: barKnown ? barIds : undefined, recentIds, favoriteIds, preferredTastes }),
    [q, tastes.join(), bases.join(), alcohol, maxMinutes, onlyMakeable, barIds, barKnown, recentIds.join()]
  );
  const groups = barKnown
    ? [
        { key: 'ready', title: 'Réalisables tout de suite', items: results.filter((r) => r.availability === 'ready') },
        { key: 'substitute', title: 'Avec une substitution', items: results.filter((r) => r.availability === 'substitute') },
        { key: 'missing', title: 'Il te manque quelque chose', items: results.filter((r) => r.availability === 'missing') },
      ]
    : [{ key: 'all', title: '', items: results }];

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const activeCount = tastes.length + bases.length + (alcohol !== 'any' ? 1 : 0) + (maxMinutes ? 1 : 0) + (onlyMakeable ? 1 : 0);
  let shown = 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <label className="tk-glass flex-1 h-12 rounded-full flex items-center gap-2 px-4">
          <Search className="w-4 h-4 text-white/50" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setLimit(24); }} placeholder="Nom, ingrédient, « frais sans alcool »…" aria-label="Rechercher une recette"
            className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/35" />
          {query && <button onClick={() => setQuery('')} aria-label="Effacer"><X className="w-4 h-4 text-white/50" /></button>}
        </label>
        <button onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} aria-label="Filtres" className="tk-glass relative w-12 h-12 rounded-full flex items-center justify-center">
          <SlidersHorizontal className="w-4.5 h-4.5 text-white" />
          {activeCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--tk-accent)] text-[10px] font-bold flex items-center justify-center">{activeCount}</span>}
        </button>
      </div>

      <div className="tk-scroll-x gap-1.5 -mx-4 px-4">
        {(['any', 'with', 'without'] as const).map((a) => (
          <Chip key={a} on={alcohol === a} onClick={() => setAlcohol(a)}>{{ any: 'Tous', with: 'Avec alcool', without: 'Sans alcool' }[a]}</Chip>
        ))}
        {barKnown && <Chip on={onlyMakeable} onClick={() => setOnlyMakeable(!onlyMakeable)}>✓ Faisable avec mon bar</Chip>}
        {TASTES.slice(0, 8).map((t) => <Chip key={t} on={tastes.includes(t)} onClick={() => setTastes(toggle(tastes, t))}>{TASTE_LABEL[t]}</Chip>)}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="tk-glass rounded-[24px] p-4 space-y-4">
              <div>
                <div className="tk-mono text-[9.5px] text-white/45 mb-2">Goûts</div>
                <div className="flex flex-wrap gap-1.5">{TASTES.map((t) => <Chip key={t} on={tastes.includes(t)} onClick={() => setTastes(toggle(tastes, t))}>{TASTE_LABEL[t]}</Chip>)}</div>
              </div>
              <div>
                <div className="tk-mono text-[9.5px] text-white/45 mb-2">Base</div>
                <div className="flex flex-wrap gap-1.5">{BASES.map((b) => <Chip key={b} on={bases.includes(b)} onClick={() => setBases(toggle(bases, b))}>{BASE_LABEL[b]}</Chip>)}</div>
              </div>
              <div>
                <div className="tk-mono text-[9.5px] text-white/45 mb-2">Temps disponible</div>
                <div className="flex gap-1.5">{[undefined, 2, 3, 4].map((m) => <Chip key={String(m)} on={maxMinutes === m} onClick={() => setMaxMinutes(m)}>{m ? `≤ ${m} min` : 'Peu importe'}</Chip>)}</div>
              </div>
              <button onClick={() => { setTastes([]); setBases([]); setAlcohol('any'); setMaxMinutes(undefined); setOnlyMakeable(false); }} className="text-[12px] text-white/60 underline underline-offset-4">Réinitialiser les filtres</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="tk-mono text-[9.5px] text-white/45 px-1" aria-live="polite">{results.length} recette{results.length > 1 ? 's' : ''} du catalogue</div>

      {results.length === 0 && (
        <div className="tk-glass rounded-[24px] p-6 text-center text-[13px] text-white/65">
          Aucune recette du catalogue ne correspond. Retire un filtre, ou demande une création à l’IA.
        </div>
      )}

      {groups.map((g) => {
        if (!g.items.length || shown >= limit) return null;
        const slice = g.items.slice(0, Math.max(0, limit - shown));
        shown += slice.length;
        return (
          <section key={g.key} className="space-y-3">
            {g.title && <h3 className="tk-display text-[26px] text-white px-1">{g.title} <span className="text-white/35 text-[18px]">{g.items.length}</span></h3>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slice.map((m, i) => (
                <RecipeCard key={m.recipe.id} size="fluid" index={i} c={toCocktailRecipe(m.recipe)} availability={barKnown ? m.availability : undefined} missing={m.missing} subs={m.substitutions} onOpen={() => onOpen(toCocktailRecipe(m.recipe))} />
              ))}
            </div>
          </section>
        );
      })}
      {results.length > limit && (
        <button onClick={() => setLimit(limit + 24)} className="tk-glass w-full h-12 rounded-full text-[13px] font-semibold text-white">Voir plus ({results.length - limit})</button>
      )}
    </div>
  );
};
