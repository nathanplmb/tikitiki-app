import { afterEach, describe, expect, it } from 'vitest';
import { FLASH_CATALOG } from './flash';
import { CATALOG } from './recipes';
import { catalogFor } from './active';
import { searchCatalog, planParty } from '../engine/search';
import { normalize } from '../engine/text';

describe('crackhead flash catalog', () => {
  it('has distinct, valid recipes including the requested flashes', () => {
    expect(FLASH_CATALOG.length).toBeGreaterThanOrEqual(25);
    expect(new Set(FLASH_CATALOG.map((r) => r.id)).size).toBe(FLASH_CATALOG.length);
    expect(new Set(FLASH_CATALOG.map((r) => normalize(r.name))).size).toBe(FLASH_CATALOG.length);
    for (const id of ['vodka-schweppes-agrumes', 'vodka-red-bull-myrtille', 'gin-red-bull', 'captain-coca']) {
      expect(FLASH_CATALOG.some((r) => r.id === id)).toBe(true);
    }
  });

  it('never shares ids with the chic catalog', () => {
    const chic = new Set(CATALOG.map((r) => r.id));
    expect(FLASH_CATALOG.filter((r) => chic.has(r.id))).toEqual([]);
  });

  it('keeps alcohol-free SAM options truly alcohol-free', () => {
    const sam = searchCatalog({ alcohol: 'without' }, {}, catalogFor('crackhead'));
    expect(sam.length).toBeGreaterThanOrEqual(3);
    for (const m of sam) expect(m.recipe.alcoholic).toBe(false);
  });

  it('finds flashes by brand-style words', () => {
    const r = searchCatalog({ query: 'red bull' }, {}, FLASH_CATALOG).map((m) => m.recipe.id);
    expect(r).toContain('vodka-red-bull');
    expect(r).toContain('jagerbomb');
  });

  it('plans a party from the flash catalog', () => {
    const p = planParty({ guests: 10 });
    expect(p.menu.length).toBeGreaterThan(0);
  });
});

describe('épicerie de nuit shelf', () => {
  it('includes the researched ready-to-drink products with packaging colours', () => {
    for (const id of ['huit-six-original', 'huit-six-red', 'huit-six-gold', 'huit-six-extreme', 'huit-six-cherry', 'buzzball-type', 'vody-type', 'smirnoff-ice-type', 'jack-coke-can']) {
      const r = FLASH_CATALOG.find((x) => x.id === id);
      expect(r, id).toBeDefined();
      if (r!.glass !== 'solo') expect(r!.pack, id).toBeDefined();
    }
  });
  it('finds products by street names', () => {
    expect(searchCatalog({ query: 'buzzballz' }, {}, FLASH_CATALOG)[0].recipe.id).toBe('buzzball-type');
    expect(searchCatalog({ query: 'vody' }, {}, FLASH_CATALOG)[0].recipe.id).toBe('vody-type');
    expect(searchCatalog({ query: '8.6 cherry' }, {}, FLASH_CATALOG)[0].recipe.id).toBe('huit-six-cherry');
  });
  it('never puts straight products in a party menu', () => {
    for (const m of planParty({ guests: 6 }).menu) expect(m.recipe.family).not.toBe('neat');
  });
});
