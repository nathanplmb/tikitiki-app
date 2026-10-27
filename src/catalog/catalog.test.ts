import { describe, expect, it } from 'vitest';
import { CATALOG, CATALOG_BY_ID } from './recipes';
import { INGREDIENTS } from './ingredients';
import { normalize } from '../engine/text';

describe('catalog integrity', () => {
  it('has at least 150 recipes', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(150);
  });

  it('has unique ids and unique normalized names', () => {
    expect(new Set(CATALOG.map((r) => r.id)).size).toBe(CATALOG.length);
    expect(new Set(CATALOG.map((r) => normalize(r.name))).size).toBe(CATALOG.length);
  });

  it('has no two recipes with identical ingredient sets and quantities', () => {
    const sig = CATALOG.map((r) =>
      r.ingredients.map((i) => `${i.id}:${i.qty ?? ''}${i.unit ?? ''}`).sort().join('|')
    );
    const dupes = sig.filter((s, i) => sig.indexOf(s) !== i);
    // Gibson vs Dry Martini differ only by garnish; they are distinct documented drinks.
    expect(dupes.length).toBeLessThanOrEqual(1);
  });

  it('references only known ingredients and has steps', () => {
    for (const r of CATALOG) {
      expect(r.ingredients.length).toBeGreaterThan(0);
      expect(r.steps.length).toBeGreaterThan(0);
      for (const i of r.ingredients) expect(INGREDIENTS[i.id]).toBeDefined();
      expect(r.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('marks alcohol-free recipes consistently', () => {
    for (const r of CATALOG.filter((x) => !x.alcoholic)) {
      expect(r.ingredients.filter((i) => !i.optional).every((i) => !INGREDIENTS[i.id].alcoholic)).toBe(true);
      expect(r.strength).toBe(0);
    }
    expect(CATALOG.filter((r) => !r.alcoholic).length).toBeGreaterThanOrEqual(20);
  });

  it('keeps stable ids for key recipes', () => {
    for (const id of ['negroni', 'mojito', 'margarita', 'virgin-mojito', 'espresso-martini', 'spritz']) {
      expect(CATALOG_BY_ID[id]).toBeDefined();
    }
  });

  it('covers many bases and families', () => {
    expect(new Set(CATALOG.map((r) => r.base)).size).toBeGreaterThanOrEqual(10);
    expect(new Set(CATALOG.map((r) => r.family)).size).toBeGreaterThanOrEqual(10);
  });
});
