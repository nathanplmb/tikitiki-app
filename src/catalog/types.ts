// Shared data model for the built-in TIKITIKI recipe catalog.
// Every catalog recipe follows this model; the engine and the UI only read these types.

export const CATALOG_VERSION = '2026.10.1';

export type IngredientCategory =
  | 'spirit'
  | 'liqueur'
  | 'wine'
  | 'aperitif'
  | 'bitters'
  | 'beer'
  | 'mixer'
  | 'juice'
  | 'syrup'
  | 'fresh'
  | 'dairy'
  | 'pantry'
  | 'garnish';

export interface IngredientDef {
  id: string;
  name: string;
  category: IngredientCategory;
  alcoholic: boolean;
  /** Lower-case French/English aliases used by search and bar matching (accents are stripped at runtime). */
  synonyms: string[];
  /** Ingredient ids that can replace this one with an acceptable result. */
  subs?: string[];
  /** Always considered available (ice, water). */
  staple?: boolean;
}

export type Taste =
  | 'fruite'
  | 'tropical'
  | 'acidule'
  | 'amer'
  | 'sec'
  | 'epice'
  | 'petillant'
  | 'doux'
  | 'herbace'
  | 'cremeux'
  | 'fume'
  | 'floral'
  | 'cafe';

export type Family =
  | 'sour'
  | 'highball'
  | 'spirit-forward'
  | 'tiki'
  | 'fizz'
  | 'spritz'
  | 'cream'
  | 'julep'
  | 'punch'
  | 'hot'
  | 'shot'
  | 'champagne'
  | 'neat'; // served as bought, no mixing

export type BaseSpirit =
  | 'gin'
  | 'vodka'
  | 'rum'
  | 'tequila'
  | 'mezcal'
  | 'whisky'
  | 'brandy'
  | 'cachaca'
  | 'pisco'
  | 'wine'
  | 'aperitif'
  | 'liqueur'
  | 'beer'
  | 'none';

export type Glass =
  | 'coupe'
  | 'martini'
  | 'nick'
  | 'rocks'
  | 'highball'
  | 'collins'
  | 'flute'
  | 'wine'
  | 'hurricane'
  | 'tiki'
  | 'mug'
  | 'copper'
  | 'shot'
  | 'julep'
  | 'irish'
  | 'pint'
  | 'solo' // red plastic party cup
  | 'bottle' // small 50 cl clear plastic water bottle
  | 'can' // 50 cl can
  | 'slimcan' // 25–33 cl slim can
  | 'ball'; // 20 cl spherical plastic bottle

export type Method =
  | 'shake'
  | 'shake-top'
  | 'dry-shake'
  | 'stir'
  | 'build'
  | 'build-top'
  | 'muddle'
  | 'blend'
  | 'swizzle'
  | 'layer'
  | 'hot';

export type Ice = 'cubes' | 'crushed' | 'large' | 'none';

export type Unit = 'cl' | 'dash' | 'barspoon' | 'tsp' | 'piece' | 'leaves' | 'slice' | 'wedge' | 'top' | 'drop' | 'g';

export interface RecipeIngredient {
  id: string;
  qty?: number;
  unit?: Unit;
  optional?: boolean;
  note?: string;
}

export type Provenance =
  /** Cocktail that appears on the official IBA list; quantities are TIKITIKI's own metric rendering. */
  | { kind: 'iba' }
  /** Widely documented public-domain classic; quantities are TIKITIKI's own rendering. */
  | { kind: 'classic' }
  /** Recipe written for TIKITIKI (house creation, mostly alcohol-free drinks). */
  | { kind: 'tikitiki' }
  /** Popular French pre-party mix (no single authoritative source). */
  | { kind: 'flash' };

export interface CatalogRecipe {
  id: string;
  name: string;
  aka?: string[];
  description: string;
  family: Family;
  tastes: Taste[];
  base: BaseSpirit;
  alcoholic: boolean;
  glass: Glass;
  ice: Ice;
  garnish?: string;
  method: Method;
  ingredients: RecipeIngredient[];
  steps: string[];
  prepMinutes: number;
  difficulty: 1 | 2 | 3;
  /** Approximate drink colour, used by the procedural illustration and the adaptive lighting. */
  color: string;
  /** 1 (dry) … 5 (very sweet) */
  sweetness: number;
  /** 0 (alcohol-free) … 3 (strong) */
  strength: 0 | 1 | 2 | 3;
  substitutions?: { from: string; to: string; note: string }[];
  provenance: Provenance;
  /** Packaging colours for ready-to-drink products (shape + colour code only, never a brand logo). */
  pack?: Pack;
}

export interface Pack {
  bg: string;
  band: string;
  text: string;
  ink?: string;
}
