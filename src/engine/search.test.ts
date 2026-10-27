import { describe, expect, it } from 'vitest';
import { searchCatalog, availabilityFor, planParty, dailyPick } from './search';
import { CATALOG_BY_ID } from '../catalog/recipes';
import { INGREDIENTS } from '../catalog/ingredients';
import { matchIngredientId } from './text';

const top = (r: ReturnType<typeof searchCatalog>, n = 5) => r.slice(0, n).map((m) => m.recipe.id);

describe('searchCatalog', () => {
  it('different criteria give different results', () => {
    const a = top(searchCatalog({ tastes: ['tropical'] }));
    const b = top(searchCatalog({ tastes: ['amer'], bases: ['gin'] }));
    const c = top(searchCatalog({ alcohol: 'without', tastes: ['herbace'] }));
    expect(a).not.toEqual(b);
    expect(b).not.toEqual(c);
    expect(a.filter((x) => b.includes(x))).toHaveLength(0);
  });

  it('finds by name ignoring accents and case', () => {
    expect(searchCatalog({ query: 'pina colada' })[0].recipe.id).toBe('pina-colada');
    expect(searchCatalog({ query: 'CAÏPIRINHA' })[0].recipe.id).toBe('caipirinha');
  });

  it('finds by ingredient and French synonyms', () => {
    const r = searchCatalog({ query: 'citron vert menthe' });
    expect(r.length).toBeGreaterThan(3);
    expect(r.slice(0, 5).some((m) => m.recipe.id.includes('mojito') || m.recipe.id === 'southside')).toBe(true);
  });

  it('alcohol-free filter and "sans alcool" query exclude all alcoholic recipes', () => {
    for (const m of searchCatalog({ alcohol: 'without' })) expect(m.recipe.alcoholic).toBe(false);
    for (const m of searchCatalog({ query: 'sans alcool fruité' })) expect(m.recipe.alcoholic).toBe(false);
  });

  it('respects required and excluded ingredients', () => {
    for (const m of searchCatalog({ required: ['campari'] })) expect(m.recipe.ingredients.some((i) => i.id === 'campari')).toBe(true);
    for (const m of searchCatalog({ excluded: ['egg_white', 'cream'] }))
      expect(m.recipe.ingredients.some((i) => ['egg_white', 'cream'].includes(i.id))).toBe(false);
  });

  it('respects time and difficulty', () => {
    for (const m of searchCatalog({ maxMinutes: 2, maxDifficulty: 1 })) {
      expect(m.recipe.prepMinutes).toBeLessThanOrEqual(2);
      expect(m.recipe.difficulty).toBe(1);
    }
  });

  it('penalises recently seen recipes', () => {
    const first = searchCatalog({ tastes: ['tropical'] })[0].recipe.id;
    const again = searchCatalog({ tastes: ['tropical'] }, { recentIds: [first] })[0].recipe.id;
    expect(again).not.toBe(first);
  });
});

describe('availability', () => {
  it('classifies ready / substitute / missing', () => {
    const negroni = CATALOG_BY_ID['negroni'];
    expect(availabilityFor(negroni, new Set(['gin', 'campari', 'sweet_vermouth'])).availability).toBe('ready');
    expect(availabilityFor(negroni, new Set(['gin', 'aperol', 'sweet_vermouth'])).availability).toBe('substitute');
    const miss = availabilityFor(negroni, new Set(['gin']));
    expect(miss.availability).toBe('missing');
    expect(miss.missing).toEqual(['campari', 'sweet_vermouth']);
  });

  it('never marks a recipe makeable when an essential ingredient is absent', () => {
    const bar = new Set(['white_rum', 'lime_juice', 'sugar', 'soda_water']);
    const ready = searchCatalog({ onlyMakeable: true }, { bar });
    for (const m of ready) {
      for (const ing of m.recipe.ingredients) {
        const def = INGREDIENTS[ing.id];
        if (ing.optional || def.staple || def.category === 'garnish') continue;
        const ok = bar.has(ing.id) || m.substitutions.some((s) => s.need === ing.id);
        expect(ok).toBe(true);
      }
    }
    expect(ready.some((m) => m.recipe.id === 'daiquiri')).toBe(true);
    expect(ready.some((m) => m.recipe.id === 'mojito')).toBe(false); // no mint
  });

  it('maps free-text bar labels to ingredients', () => {
    expect(matchIngredientId('Rhum blanc Havana')).toBe('white_rum');
    expect(matchIngredientId('Schweppes Indian Tonic')).toBe('tonic');
    expect(matchIngredientId('Feuilles de menthe')).toBe('mint');
  });
});

describe('party & daily', () => {
  it('builds a diverse menu with an alcohol-free option', () => {
    const p = planParty({ guests: 8 });
    expect(p.menu.length).toBe(4);
    expect(p.menu.filter((m) => !m.recipe.alcoholic)).toHaveLength(1);
    expect(new Set(p.menu.map((m) => m.recipe.base)).size).toBe(4);
    expect(p.shopping.length).toBeGreaterThan(3);
  });
  it('daily pick is stable for a date', () => {
    const d = new Date('2026-10-27T12:00:00Z');
    expect(dailyPick(d).id).toBe(dailyPick(new Date(d)).id);
  });
});
