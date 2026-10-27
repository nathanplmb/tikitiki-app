import { CocktailRecipe } from '../types/cocktail';
import { CatalogRecipe, Glass, Ice } from './types';
import { INGREDIENTS } from './ingredients';
import { formatQty, GLASS_NAME } from './build';
import { TASTE_LABEL } from '../engine/text';
import type { CocktailArtProps } from '../components/CocktailArt';

const CATEGORY_MAP: Record<string, CocktailRecipe['ingredients'][number]['category']> = {
  spirit: 'alcool', liqueur: 'alcool', wine: 'alcool', aperitif: 'alcool', bitters: 'alcool', beer: 'alcool',
  mixer: 'diluant', juice: 'diluant', syrup: 'sirop', fresh: 'garniture', garnish: 'garniture', dairy: 'autre', pantry: 'autre',
};

const THEME_FROM_TASTE = (c: CatalogRecipe): CocktailRecipe['tasteProfile']['colorTheme'] => {
  if (c.tastes.includes('tropical')) return 'tropical';
  if (c.tastes.includes('amer') || c.tastes.includes('herbace')) return 'botanical-bitter';
  if (c.tastes.includes('epice') || c.tastes.includes('fume') || c.tastes.includes('cafe')) return 'spiced-warm';
  if (c.tastes.includes('floral')) return 'floral';
  if (c.tastes.includes('acidule')) return 'citrus-fresh';
  return 'dark-berry';
};

export const PROVENANCE_LABEL = {
  iba: 'Catalogue TIKITIKI · classique de la liste IBA',
  classic: 'Catalogue TIKITIKI · classique',
  tikitiki: 'Catalogue TIKITIKI · recette maison',
} as const;

/** Converts a catalog recipe into the app-wide CocktailRecipe shape (favorites, detail, compare, shopping). */
export function toCocktailRecipe(c: CatalogRecipe): CocktailRecipe {
  return {
    id: `cat-${c.id}`,
    catalogId: c.id,
    name: c.name,
    type: c.tastes.length && c.sweetness <= 2 ? 'signature' : 'consensuelle',
    tagline: c.tastes.map((t) => TASTE_LABEL[t]).join(' · '),
    description: c.description,
    tasteProfile: {
      primaryNotes: c.tastes.map((t) => TASTE_LABEL[t]),
      sweetness: c.sweetness,
      fruitiness: c.tastes.includes('fruite') || c.tastes.includes('tropical') ? 4 : 2,
      originality: c.provenance.kind === 'tikitiki' ? 3 : 2,
      profileName: c.tastes.map((t) => TASTE_LABEL[t]).join(', '),
      colorTheme: THEME_FROM_TASTE(c),
    },
    ingredients: c.ingredients.map((i) => ({
      name: INGREDIENTS[i.id].name,
      amount: formatQty(i),
      category: CATEGORY_MAP[INGREDIENTS[i.id].category] ?? 'autre',
      supermarketCommon: true,
      optional: i.optional,
    })),
    steps: c.steps,
    glassType: GLASS_NAME[c.glass],
    prepTimeMinutes: c.prepMinutes,
    difficulty: c.difficulty === 1 ? 'Très facile' : c.difficulty === 2 ? 'Facile' : 'Moyen',
    distinctIngredientsCount: c.ingredients.length,
    // The catalog has no price data: cost is left explicitly unknown instead of invented.
    estimatedCost: { min: 0, max: 0, currency: 'EUR', status: 'a_verifier', note: 'Prix non renseigné dans le catalogue.' },
    aromaticCoherence: c.description,
    simplerAlternative: c.substitutions?.map((s) => s.note).join(' ') ?? '',
    mocktailVariant: '',
    isMocktailOnly: !c.alcoholic,
    allergens: c.ingredients.some((i) => ['egg_white', 'egg_yolk', 'whole_egg'].includes(i.id)) ? ['Œuf'] : c.ingredients.some((i) => ['cream', 'milk', 'irish_cream'].includes(i.id)) ? ['Lait'] : [],
    alcoholEstimate: !c.alcoholic ? '0.0% Sans alcool' : ['Léger', 'Léger', 'Modéré', 'Fort'][c.strength],
    imageUrl: '',
    source: 'catalog',
    color: c.color,
    glassKind: c.glass,
    iceKind: c.ice,
    garnish: c.garnish,
    tastes: c.tastes,
    provenanceLabel: PROVENANCE_LABEL[c.provenance.kind],
    timerSeconds: c.method === 'shake' || c.method === 'dry-shake' || c.method === 'shake-top' ? 12 : undefined,
  };
}

const THEME_COLOR: Record<string, string> = {
  'dark-berry': '#8e1f4f', tropical: '#f2a33a', 'citrus-fresh': '#c9e86a', floral: '#b9a6ff',
  'botanical-bitter': '#c93c2a', 'spiced-warm': '#c8742f', 'mystic-dark': '#5b3cc4',
};

function glassFromText(t = ''): Glass {
  const s = t.toLowerCase();
  if (s.includes('coupe')) return 'coupe';
  if (s.includes('martini')) return 'martini';
  if (s.includes('flûte') || s.includes('flute')) return 'flute';
  if (s.includes('ballon') || s.includes('vin')) return 'wine';
  if (s.includes('highball') || s.includes('collins') || s.includes('long')) return 'highball';
  if (s.includes('hurricane')) return 'hurricane';
  if (s.includes('cuivre')) return 'copper';
  return 'rocks';
}

/** Illustration props for any recipe (catalog, AI or legacy). */
export function artFor(c: CocktailRecipe): CocktailArtProps {
  const tastes = c.tastes ?? [];
  const text = (c.ingredients ?? []).map((i) => i.name.toLowerCase()).join(' ');
  return {
    color: c.color ?? THEME_COLOR[c.tasteProfile?.colorTheme ?? 'dark-berry'] ?? '#ff4f8b',
    glass: c.glassKind ?? glassFromText(c.glassType),
    ice: (c.iceKind as Ice) ?? 'cubes',
    garnish: c.garnish ?? c.ingredients?.find((i) => i.category === 'garniture')?.name,
    sparkling: tastes.includes('petillant') || /tonic|gazeuse|soda|prosecco|champagne|ginger|limonade|cola/.test(text),
    creamy: tastes.includes('cremeux') || /cr[eè]me|blanc d|coco/.test(text),
  };
}
