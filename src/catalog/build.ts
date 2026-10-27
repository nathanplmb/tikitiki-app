import { INGREDIENTS } from './ingredients';
import {
  BaseSpirit,
  CatalogRecipe,
  Family,
  Glass,
  Ice,
  Method,
  Provenance,
  RecipeIngredient,
  Taste,
  Unit,
} from './types';

const UNITS: Unit[] = ['dash', 'barspoon', 'tsp', 'piece', 'leaves', 'slice', 'wedge', 'top', 'drop', 'g', 'cl'];

/**
 * Parses the compact ingredient notation used in recipes.ts:
 * `gin:4.5` (cl), `angostura:2dash`, `mint:8leaves`, `soda_water:top`, `salt?` (optional).
 */
export function parseIngredients(spec: string): RecipeIngredient[] {
  return spec
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const optional = token.endsWith('?');
      const clean = optional ? token.slice(0, -1) : token;
      const [id, amount] = clean.split(':');
      if (!INGREDIENTS[id]) throw new Error(`Unknown ingredient "${id}"`);
      const out: RecipeIngredient = { id };
      if (optional) out.optional = true;
      if (amount) {
        if (amount === 'top') out.unit = 'top';
        else {
          const m = amount.match(/^([\d.]+)([a-z]*)$/);
          if (!m) throw new Error(`Bad amount "${amount}" for ${id}`);
          out.qty = parseFloat(m[1]);
          const unit = (m[2] || 'cl') as Unit;
          if (!UNITS.includes(unit)) throw new Error(`Bad unit "${unit}" for ${id}`);
          out.unit = unit;
        }
      }
      return out;
    });
}

const UNIT_LABEL: Record<Unit, [string, string]> = {
  cl: ['cl', 'cl'],
  dash: ['trait', 'traits'],
  barspoon: ['cuillère de bar', 'cuillères de bar'],
  tsp: ['cuillère à café', 'cuillères à café'],
  piece: ['', ''],
  leaves: ['feuille', 'feuilles'],
  slice: ['tranche', 'tranches'],
  wedge: ['quartier', 'quartiers'],
  top: ['', ''],
  drop: ['goutte', 'gouttes'],
  g: ['g', 'g'],
};

export function formatQty(ing: RecipeIngredient, multiplier = 1): string {
  if (ing.unit === 'top') return 'pour compléter';
  if (ing.qty === undefined) return ing.optional ? 'facultatif' : 'selon le goût';
  const q = Math.round(ing.qty * multiplier * 10) / 10;
  const n = String(q).replace('.', ',');
  const [one, many] = UNIT_LABEL[ing.unit ?? 'cl'];
  const label = q > 1 ? many : one;
  return label ? `${n} ${label}` : n;
}

const GLASS_LABEL: Record<Glass, string> = {
  coupe: 'une coupe',
  martini: 'un verre à martini',
  nick: 'un verre Nick & Nora',
  rocks: 'un verre old fashioned',
  highball: 'un verre highball',
  collins: 'un verre collins',
  flute: 'une flûte',
  wine: 'un verre à vin',
  hurricane: 'un verre hurricane',
  tiki: 'un mug tiki',
  mug: 'une tasse',
  copper: 'un mug en cuivre',
  shot: 'un verre à shot',
  julep: 'une timbale julep',
  irish: 'un verre à irish coffee',
  pint: 'un verre à bière',
  solo: 'un gobelet en plastique',
  bottle: 'une petite bouteille de 50 cl',
  can: 'une canette de 50 cl',
  slimcan: 'une canette slim',
  ball: 'une boule de 20 cl',
};

export const GLASS_NAME: Record<Glass, string> = {
  coupe: 'Coupe',
  martini: 'Verre à martini',
  nick: 'Nick & Nora',
  rocks: 'Old fashioned',
  highball: 'Highball',
  collins: 'Collins',
  flute: 'Flûte',
  wine: 'Verre à vin',
  hurricane: 'Hurricane',
  tiki: 'Mug tiki',
  mug: 'Tasse',
  copper: 'Mug en cuivre',
  shot: 'Shot',
  julep: 'Timbale julep',
  irish: 'Verre irish coffee',
  pint: 'Pinte',
  solo: 'Gobelet',
  bottle: 'Bouteille 50 cl',
  can: 'Canette 50 cl',
  slimcan: 'Canette slim',
  ball: 'Boule 20 cl',
};

const ICE_TEXT: Record<Ice, string> = {
  cubes: 'rempli de glaçons',
  crushed: 'rempli de glace pilée',
  large: 'sur un gros glaçon',
  none: 'sans glace',
};

const list = (items: RecipeIngredient[]) =>
  items
    .map((i) => `${i.unit === 'top' ? '' : formatQty(i) + ' de '}${INGREDIENTS[i.id].name.toLowerCase()}`)
    .join(', ');

/** Generates preparation steps from the method so every recipe has consistent, correct instructions. */
export function generateSteps(r: { method: Method; glass: Glass; ice: Ice; garnish?: string; ingredients: RecipeIngredient[] }): string[] {
  const top = r.ingredients.filter((i) => i.unit === 'top');
  const muddled = r.ingredients.filter((i) => ['fresh'].includes(INGREDIENTS[i.id].category) && !['egg_white', 'egg_yolk', 'whole_egg', 'aquafaba'].includes(i.id));
  const body = r.ingredients.filter((i) => i.unit !== 'top' && i.id !== 'ice' && !(r.method === 'muddle' && muddled.includes(i)));
  const glass = GLASS_LABEL[r.glass];
  const steps: string[] = [];
  if (r.glass === 'bottle' && (r.method === 'build' || r.method === 'build-top')) {
    // Pre-mix straight in a 50 cl soft-drink or water bottle, the pre-party way.
    const spirits = r.ingredients.filter((i) => i.unit !== 'top' && INGREDIENTS[i.id].alcoholic);
    const softs = r.ingredients.filter((i) => !INGREDIENTS[i.id].alcoholic && i.id !== 'ice');
    steps.push(
      `Prendre une bouteille de 50 cl de ${softs.map((i) => INGREDIENTS[i.id].name.toLowerCase()).join(' et ') || 'soft'} bien fraîche et en boire ou retirer un peu pour faire de la place.`,
      spirits.length ? `Verser ${list(spirits)} dans la bouteille.` : 'Compléter la bouteille avec les autres ingrédients.',
      'Refermer et retourner doucement deux ou trois fois (sans secouer si c’est gazeux). À garder au frais.'
    );
    return steps;
  }
  switch (r.method) {
    case 'shake':
      steps.push(`Verser dans un shaker : ${list(body)}.`, 'Remplir de glaçons et frapper énergiquement 10 à 12 secondes.', `Filtrer dans ${glass} ${ICE_TEXT[r.ice]}.`);
      break;
    case 'shake-top':
      steps.push(`Verser dans un shaker : ${list(body)}.`, 'Ajouter des glaçons et frapper 10 secondes.', `Filtrer dans ${glass} ${ICE_TEXT[r.ice]}.`, `Compléter avec ${list(top)}.`);
      break;
    case 'dry-shake':
      steps.push(`Verser dans un shaker sans glace : ${list(body)}.`, 'Frapper 10 secondes à sec pour émulsionner.', 'Ajouter des glaçons et frapper à nouveau 12 secondes.', `Double-filtrer dans ${glass} ${ICE_TEXT[r.ice]}.`);
      if (top.length) steps.push(`Compléter avec ${list(top)}.`);
      break;
    case 'stir':
      steps.push(`Verser dans un verre à mélange : ${list(body)}.`, 'Remplir de glaçons et remuer 20 à 30 secondes pour refroidir et diluer.', `Filtrer dans ${glass} ${ICE_TEXT[r.ice]}.`);
      break;
    case 'build':
      steps.push(`Remplir ${glass} ${r.ice === 'none' ? '' : 'de glace'}`.trim() + '.', `Verser dans l'ordre : ${list(body)}.`, 'Remuer brièvement.');
      if (top.length) steps.push(`Compléter avec ${list(top)}.`);
      break;
    case 'build-top':
      steps.push(`Remplir ${glass} de glaçons.`, `Verser : ${list(body)}.`, `Compléter avec ${list(top)} et remuer délicatement pour garder les bulles.`);
      break;
    case 'muddle':
      steps.push(`Dans ${glass}, piler délicatement : ${list(muddled)}${body.some((i) => ['sugar', 'cane_sugar', 'simple_syrup'].includes(i.id)) ? ' avec le sucre' : ''}.`, `Ajouter ${list(body)}.`, `Remplir ${r.ice === 'crushed' ? 'de glace pilée' : 'de glaçons'} et remuer de bas en haut.`);
      if (top.length) steps.push(`Compléter avec ${list(top)}.`);
      break;
    case 'blend':
      steps.push(`Verser dans un blender : ${list(body)}.`, 'Ajouter une tasse de glace et mixer jusqu’à texture lisse.', `Servir dans ${glass}.`);
      break;
    case 'swizzle':
      steps.push(`Verser dans ${glass} : ${list(body)}.`, 'Remplir de glace pilée et faire tourner une cuillère (swizzle) entre les mains jusqu’à givrer le verre.', 'Rajouter de la glace pilée en dôme.');
      if (top.length) steps.push(`Compléter avec ${list(top)}.`);
      break;
    case 'layer':
      steps.push(`Dans ${glass}, superposer dans l'ordre, en versant lentement sur le dos d'une cuillère : ${list(body)}.`);
      break;
    case 'hot':
      steps.push(`Préchauffer ${glass} avec de l'eau chaude puis la vider.`, `Verser : ${list(body)}.`, 'Remuer pour dissoudre et servir aussitôt.');
      if (top.length) steps.push(`Compléter avec ${list(top)}.`);
      break;
  }
  if (r.garnish) steps.push(`Garnir : ${r.garnish.toLowerCase()}.`);
  return steps;
}

export type Row = {
  id: string;
  name: string;
  d: string; // description
  f: Family;
  t: string; // comma separated tastes
  b: BaseSpirit;
  g: Glass;
  ice: Ice;
  m: Method;
  c: string; // colour
  sw: number;
  st: 0 | 1 | 2 | 3;
  min?: number;
  dif?: 1 | 2 | 3;
  ing: string;
  gar?: string;
  p: 'i' | 'c' | 't';
  aka?: string[];
  steps?: string[];
  subs?: CatalogRecipe['substitutions'];
  pack?: CatalogRecipe['pack'];
};

const PROV: Record<Row['p'], Provenance> = { i: { kind: 'iba' }, c: { kind: 'classic' }, t: { kind: 'tikitiki' } };

export function buildRecipe(r: Row): CatalogRecipe {
  const ingredients = parseIngredients(r.ing);
  const alcoholic = ingredients.some((i) => !i.optional && INGREDIENTS[i.id].alcoholic);
  return {
    id: r.id,
    name: r.name,
    aka: r.aka,
    description: r.d,
    family: r.f,
    tastes: r.t.split(',').map((s) => s.trim()).filter(Boolean) as Taste[],
    base: r.b,
    alcoholic,
    glass: r.g,
    ice: r.ice,
    garnish: r.gar,
    method: r.m,
    ingredients,
    steps: r.steps ?? generateSteps({ method: r.m, glass: r.g, ice: r.ice, garnish: r.gar, ingredients }),
    prepMinutes: r.min ?? (r.m === 'build' || r.m === 'build-top' ? 2 : r.m === 'dry-shake' || r.m === 'blend' ? 4 : 3),
    difficulty: r.dif ?? (r.m === 'build' || r.m === 'build-top' ? 1 : r.m === 'dry-shake' || r.m === 'layer' ? 3 : 2),
    color: r.c,
    sweetness: r.sw,
    strength: alcoholic ? r.st : 0,
    substitutions: r.subs,
    provenance: PROV[r.p],
    pack: r.pack,
  };
}
