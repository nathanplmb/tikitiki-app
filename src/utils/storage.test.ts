import { beforeEach, describe, expect, it } from 'vitest';

const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};

const s = await import('./storage');
import { toCocktailRecipe } from '../catalog/adapter';
import { CATALOG_BY_ID } from '../catalog/recipes';

describe('local persistence', () => {
  beforeEach(() => mem.clear());

  it('starts empty: no example recipes presented as personal favourites', () => {
    expect(s.getFavorites()).toEqual([]);
    expect(s.getHistory()).toEqual([]);
  });

  it('persists favourites, bar stock and shopping list', () => {
    const neg = toCocktailRecipe(CATALOG_BY_ID['negroni']);
    s.saveFavorites([neg]);
    expect(s.getFavorites()[0].catalogId).toBe('negroni');
    const bar = s.getUserBar();
    s.saveUserBar(bar.map((b, i) => (i === 0 ? { ...b, inStock: !b.inStock } : b)));
    expect(s.getUserBar()[0].inStock).toBe(!bar[0].inStock);
    const list = s.addRecipeToShoppingList(neg);
    expect(list.map((i) => i.name)).toContain('Campari');
    expect(s.getShoppingList()).toHaveLength(3);
  });

  it('merges shopping items without mutating previous state', () => {
    const neg = toCocktailRecipe(CATALOG_BY_ID['negroni']);
    const first = s.addRecipeToShoppingList(neg);
    const snapshot = JSON.stringify(first);
    s.addRecipeToShoppingList(toCocktailRecipe(CATALOG_BY_ID['boulevardier']));
    expect(JSON.stringify(first)).toBe(snapshot);
    expect(s.getShoppingList().find((i) => i.name === 'Campari')!.recipesUsing).toEqual(['Negroni', 'Boulevardier']);
  });

  it('keeps legacy v2 data readable and round-trips export/import', () => {
    mem.set('mixlab_favorites_v2', JSON.stringify([{ id: 'recette-black-velvet', name: 'Black Velvet' }]));
    expect(s.getFavorites()[0].name).toBe('Black Velvet');
    const json = s.exportUserDataJSON();
    mem.clear();
    expect(s.importUserDataJSON(json)).toBe(true);
    expect(s.getFavorites()[0].name).toBe('Black Velvet');
  });

  it('learns taste signals and recent ids', () => {
    s.recordTasteSignal(['amer', 'sec'], 2);
    s.recordTasteSignal(['amer'], 2);
    expect(s.topTastes(s.getTasteSignals())).toEqual(['amer']);
    s.pushRecentId('a'); s.pushRecentId('b'); s.pushRecentId('a');
    expect(s.getRecentIds()).toEqual(['a', 'b']);
  });
});
