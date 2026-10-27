import { getActiveCatalog } from '../catalog/active';
import { INGREDIENTS } from '../catalog/ingredients';
import { BaseSpirit, CatalogRecipe, Taste } from '../catalog/types';
import { normalize, parseQuery } from './text';

export type Availability = 'ready' | 'substitute' | 'missing';

export interface Match {
  recipe: CatalogRecipe;
  score: number;
  availability: Availability;
  missing: string[];
  substitutions: { need: string; use: string }[];
  reasons: string[];
}

export interface SearchCriteria {
  query?: string;
  tastes?: Taste[];
  bases?: BaseSpirit[];
  alcohol?: 'any' | 'with' | 'without';
  required?: string[];
  excluded?: string[];
  maxMinutes?: number;
  maxDifficulty?: 1 | 2 | 3;
  onlyMakeable?: boolean;
}

export interface SearchContext {
  bar?: Set<string>;
  preferredTastes?: Taste[];
  preferredSweetness?: number;
  recentIds?: string[];
  favoriteIds?: string[];
}

/** Garnish, staples and optional items never block a recipe. */
function isEssential(id: string, optional?: boolean): boolean {
  if (optional) return false;
  const def = INGREDIENTS[id];
  return !(def.staple || def.category === 'garnish');
}

export function availabilityFor(recipe: CatalogRecipe, bar?: Set<string>) {
  const missing: string[] = [];
  const substitutions: Match['substitutions'] = [];
  if (!bar) return { availability: 'missing' as Availability, missing, substitutions, known: false };
  for (const ing of recipe.ingredients) {
    if (!isEssential(ing.id, ing.optional) || bar.has(ing.id)) continue;
    const sub = INGREDIENTS[ing.id].subs?.find((s) => bar.has(s));
    if (sub) substitutions.push({ need: ing.id, use: sub });
    else missing.push(ing.id);
  }
  const availability: Availability = missing.length ? 'missing' : substitutions.length ? 'substitute' : 'ready';
  return { availability, missing, substitutions, known: true };
}

function textScore(recipe: CatalogRecipe, tokens: string[], full: string): number {
  if (!tokens.length) return 0;
  const name = normalize(recipe.name + ' ' + (recipe.aka ?? []).join(' '));
  if (name === full) return 60;
  let s = name.startsWith(full) ? 30 : 0;
  const hay = normalize(
    [recipe.description, recipe.family, recipe.tastes.join(' '), recipe.base,
      ...recipe.ingredients.map((i) => INGREDIENTS[i.id].name + ' ' + INGREDIENTS[i.id].synonyms.join(' '))].join(' ')
  );
  for (const t of tokens) {
    if (name.includes(t)) s += 12;
    else if (hay.includes(t)) s += 4;
  }
  return s;
}

/** Local search & recommendation. Pure: no network, no AI. Hard filters remove, soft signals rank. */
export function searchCatalog(criteria: SearchCriteria, ctx: SearchContext = {}, catalog: CatalogRecipe[] = getActiveCatalog()): Match[] {
  const parsed = parseQuery(criteria.query ?? '');
  const tastes = new Set([...(criteria.tastes ?? []), ...parsed.tastes]);
  const bases = new Set([...(criteria.bases ?? []), ...parsed.bases]);
  const required = criteria.required ?? [];
  const excluded = criteria.excluded ?? [];
  const alcohol = parsed.alcoholFree ? 'without' : criteria.alcohol ?? 'any';
  const recent = ctx.recentIds ?? [];
  const results: Match[] = [];

  for (const recipe of catalog) {
    const ids = new Set(recipe.ingredients.map((i) => i.id));
    if (alcohol === 'without' && recipe.alcoholic) continue;
    if (alcohol === 'with' && !recipe.alcoholic) continue;
    if (excluded.some((x) => ids.has(x))) continue;
    if (required.some((x) => !ids.has(x))) continue;
    if (bases.size && !bases.has(recipe.base)) continue;
    if (criteria.maxMinutes && recipe.prepMinutes > criteria.maxMinutes) continue;
    if (criteria.maxDifficulty && recipe.difficulty > criteria.maxDifficulty) continue;

    const av = availabilityFor(recipe, ctx.bar);
    if (criteria.onlyMakeable && av.availability === 'missing') continue;

    const reasons: string[] = [];
    let score = textScore(recipe, parsed.tokens, parsed.text);
    const structured = tastes.size || bases.size || parsed.ingredients.length || parsed.alcoholFree;
    if (parsed.tokens.length && score === 0 && !structured) continue;

    if (parsed.ingredients.length) {
      const hits = parsed.ingredients.filter((i) => ids.has(i)).length;
      if (!hits && score < 12) continue;
      score += hits * 15;
    }
    if (tastes.size) {
      const hit = recipe.tastes.filter((t) => tastes.has(t));
      if (!hit.length) continue;
      score += hit.length * 14;
    }
    if (av.known) {
      if (av.availability === 'ready') { score += 25; reasons.push('Réalisable avec ton bar'); }
      else if (av.availability === 'substitute') { score += 14; reasons.push('Réalisable avec une substitution'); }
      else score -= Math.min(20, av.missing.length * 6);
    }
    if (ctx.preferredTastes?.length) {
      const pref = recipe.tastes.filter((t) => ctx.preferredTastes!.includes(t)).length;
      if (pref) { score += pref * 4; reasons.push('Proche de tes goûts'); }
    }
    if (ctx.preferredSweetness) score -= Math.abs(recipe.sweetness - ctx.preferredSweetness) * 1.5;
    const ri = recent.indexOf(recipe.id);
    if (ri >= 0) score -= Math.max(4, 18 - ri * 2);
    if (ctx.favoriteIds?.includes(recipe.id)) score += 2;

    results.push({ recipe, score, availability: av.availability, missing: av.missing, substitutions: av.substitutions, reasons });
  }
  results.sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name));
  return diversify(results);
}

/** Avoids runs of the same base+family at the top. */
function diversify(list: Match[]): Match[] {
  const out: Match[] = [];
  const pool = [...list];
  while (pool.length) {
    const last = out.slice(-2);
    let idx = pool.findIndex((m, i) => i < 6 && !last.some((l) => l.recipe.base === m.recipe.base && l.recipe.family === m.recipe.family));
    if (idx < 0) idx = 0;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function dailyPick(date = new Date(), catalog: CatalogRecipe[] = getActiveCatalog()): CatalogRecipe {
  const day = Math.floor(date.getTime() / 86400000);
  return catalog[(day * 7919) % catalog.length];
}

/** Party menu from the catalog: diverse, makeable-first, with an alcohol-free option and consolidated shopping. */
export function planParty(opts: { guests: number; drinksPerGuest?: number; tastes?: Taste[]; bar?: Set<string> }) {
  const ranked = searchCatalog({ tastes: opts.tastes, alcohol: 'with', maxDifficulty: 2 }, { bar: opts.bar })
    .filter((m) => m.recipe.family !== 'hot' && m.recipe.family !== 'shot');
  const menu: Match[] = [];
  for (const m of ranked) {
    if (menu.length >= 3) break;
    if (menu.some((x) => x.recipe.base === m.recipe.base || x.recipe.family === m.recipe.family)) continue;
    menu.push(m);
  }
  const mocktail = searchCatalog({ tastes: opts.tastes, alcohol: 'without', maxDifficulty: 2 }, { bar: opts.bar })
    .find((m) => m.recipe.family !== 'hot');
  if (mocktail) menu.push(mocktail);

  const drinks = Math.max(1, Math.round(opts.guests * (opts.drinksPerGuest ?? 2)));
  const perRecipe = Math.ceil(drinks / Math.max(1, menu.length));
  const totals = new Map<string, { qty: number; unit?: string; recipes: string[] }>();
  for (const m of menu) {
    for (const ing of m.recipe.ingredients) {
      if (INGREDIENTS[ing.id].staple) continue;
      const unit = ing.unit === 'top' ? 'cl' : ing.unit;
      const cur = totals.get(ing.id) ?? { qty: 0, unit, recipes: [] };
      if (ing.unit === 'top') cur.qty += 10 * perRecipe;
      else if (ing.qty !== undefined && unit === cur.unit) cur.qty += ing.qty * perRecipe;
      if (!cur.recipes.includes(m.recipe.name)) cur.recipes.push(m.recipe.name);
      totals.set(ing.id, cur);
    }
  }
  const shopping = [...totals.entries()].map(([id, t]) => ({
    id,
    name: INGREDIENTS[id].name,
    qty: t.qty ? Math.round(t.qty * 10) / 10 : undefined,
    unit: t.unit,
    bottles70: t.unit === 'cl' && INGREDIENTS[id].alcoholic && t.qty ? Math.ceil(t.qty / 70) : undefined,
    inBar: opts.bar?.has(id) ?? false,
    recipes: t.recipes,
  }));
  return { menu, drinks, perRecipe, shopping };
}
