import { INGREDIENT_LIST } from '../catalog/ingredients';
import { BaseSpirit, Family, Taste } from '../catalog/types';

/** Lower-case, strip accents and punctuation. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const TASTE_LABEL: Record<Taste, string> = {
  fruite: 'Fruité',
  tropical: 'Tropical',
  acidule: 'Acidulé',
  amer: 'Amer',
  sec: 'Sec',
  epice: 'Épicé',
  petillant: 'Pétillant',
  doux: 'Doux',
  herbace: 'Herbacé',
  cremeux: 'Crémeux',
  fume: 'Fumé',
  floral: 'Floral',
  cafe: 'Café',
};

export const BASE_LABEL: Record<BaseSpirit, string> = {
  gin: 'Gin',
  vodka: 'Vodka',
  rum: 'Rhum',
  tequila: 'Tequila',
  mezcal: 'Mezcal',
  whisky: 'Whisky',
  brandy: 'Cognac & brandy',
  cachaca: 'Cachaça',
  pisco: 'Pisco',
  wine: 'Vins & bulles',
  aperitif: 'Apéritifs & amers',
  liqueur: 'Liqueurs',
  beer: 'Bière',
  none: 'Sans alcool',
};

export const FAMILY_LABEL: Record<Family, string> = {
  sour: 'Sours',
  highball: 'Long drinks',
  'spirit-forward': 'Courts & intenses',
  tiki: 'Tiki',
  fizz: 'Fizz & Collins',
  spritz: 'Spritz & apéritifs',
  cream: 'Crémeux',
  julep: 'Juleps & smash',
  punch: 'Punchs',
  hot: 'Boissons chaudes',
  shot: 'Shots',
  champagne: 'À bulles',
};

/** Free-text words mapped to structured criteria. */
const TASTE_WORDS: Record<string, Taste> = {
  fruite: 'fruite', fruit: 'fruite', fruits: 'fruite', fruity: 'fruite',
  tropical: 'tropical', tropicaux: 'tropical', exotique: 'tropical', tiki: 'tropical',
  acidule: 'acidule', acide: 'acidule', citronne: 'acidule', sour: 'acidule', vif: 'acidule',
  amer: 'amer', amere: 'amer', bitter: 'amer', amertume: 'amer',
  sec: 'sec', seche: 'sec', dry: 'sec', 'peu sucre': 'sec',
  epice: 'epice', epicee: 'epice', piquant: 'epice', spicy: 'epice', gingembre: 'epice',
  petillant: 'petillant', petillante: 'petillant', bulles: 'petillant', gazeux: 'petillant', fizz: 'petillant',
  doux: 'doux', douce: 'doux', sucre: 'doux', gourmand: 'doux', sweet: 'doux',
  herbace: 'herbace', frais: 'herbace', fraiche: 'herbace', menthe: 'herbace', vegetal: 'herbace',
  cremeux: 'cremeux', onctueux: 'cremeux', creme: 'cremeux', velouté: 'cremeux', veloute: 'cremeux',
  fume: 'fume', tourbe: 'fume', smoky: 'fume',
  floral: 'floral', fleur: 'floral', fleurs: 'floral',
  cafe: 'cafe', coffee: 'cafe', espresso: 'cafe',
};

const BASE_WORDS: Record<string, BaseSpirit> = {
  gin: 'gin', vodka: 'vodka', rhum: 'rum', rum: 'rum', tequila: 'tequila', mezcal: 'mezcal',
  whisky: 'whisky', whiskey: 'whisky', bourbon: 'whisky', scotch: 'whisky', rye: 'whisky',
  cognac: 'brandy', brandy: 'brandy', armagnac: 'brandy', calvados: 'brandy',
  cachaca: 'cachaca', pisco: 'pisco', champagne: 'wine', prosecco: 'wine', vin: 'wine',
  biere: 'beer', aperitif: 'aperitif', apero: 'aperitif', pastis: 'aperitif',
};

const ALCOHOL_FREE_WORDS = ['sans alcool', 'mocktail', 'virgin', '0 0', 'zero alcool', 'sobre', 'enfant', 'enfants'];

export interface ParsedQuery {
  text: string;
  tokens: string[];
  tastes: Taste[];
  bases: BaseSpirit[];
  ingredients: string[];
  alcoholFree: boolean;
}

/** Extracts structured hints (tastes, bases, ingredients, alcohol-free) from a French free-text query. */
export function parseQuery(q: string): ParsedQuery {
  const text = normalize(q);
  const tastes = new Set<Taste>();
  const bases = new Set<BaseSpirit>();
  const ingredients = new Set<string>();
  const alcoholFree = ALCOHOL_FREE_WORDS.some((w) => ` ${text} `.includes(` ${w} `));
  const words = text.split(' ').filter(Boolean);
  for (const w of words) {
    if (TASTE_WORDS[w]) tastes.add(TASTE_WORDS[w]);
    if (BASE_WORDS[w]) bases.add(BASE_WORDS[w]);
  }
  if (` ${text} `.includes(' peu sucre ')) tastes.add('sec');
  for (const ing of INGREDIENT_LIST) {
    for (const syn of [ing.name, ...ing.synonyms]) {
      const s = normalize(syn);
      if (s.length >= 3 && ` ${text} `.includes(` ${s} `)) {
        ingredients.add(ing.id);
        break;
      }
    }
  }
  return {
    text,
    tokens: words.filter((w) => w.length >= 2),
    tastes: [...tastes],
    bases: [...bases],
    ingredients: [...ingredients],
    alcoholFree,
  };
}

/** Maps a free-text bar entry ("Rhum Havana 3 ans", "citrons verts") to a catalog ingredient id. */
export function matchIngredientId(label: string): string | undefined {
  const n = normalize(label);
  if (!n) return undefined;
  let best: { id: string; len: number } | undefined;
  for (const ing of INGREDIENT_LIST) {
    for (const syn of [ing.name, ing.id.replace(/_/g, ' '), ...ing.synonyms]) {
      const s = normalize(syn);
      if (!s) continue;
      const hit = n === s || ` ${n} `.includes(` ${s} `) || (s.endsWith('s') ? false : ` ${n} `.includes(` ${s}s `));
      if (hit && (!best || s.length > best.len)) best = { id: ing.id, len: s.length };
    }
  }
  return best?.id;
}
