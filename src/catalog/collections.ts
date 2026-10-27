import { AppMode } from './active';
import { CatalogRecipe } from './types';

export interface Collection {
  id: string;
  title: string;
  kicker: string;
  color: string;
  match: (r: CatalogRecipe) => boolean;
}

const has = (r: CatalogRecipe, ...ids: string[]) => r.ingredients.some((i) => ids.includes(i.id));

/** Editorial collections built from catalog metadata (no hand-picked fake lists). */
export const COLLECTIONS: Record<AppMode, Collection[]> = {
  chic: [
    { id: 'iba', title: 'Les officiels IBA', kicker: 'Classiques de référence', color: '#d9b779', match: (r) => r.provenance.kind === 'iba' },
    { id: 'aperitivo', title: 'Aperitivo italiano', kicker: 'Amers & spritz', color: '#f26b21', match: (r) => has(r, 'campari', 'aperol', 'sweet_vermouth') && r.strength <= 3 && r.family !== 'sour' },
    { id: 'tiki', title: 'Tiki paradise', kicker: 'Rhums & îles', color: '#f2a33a', match: (r) => r.family === 'tiki' || (r.base === 'rum' && r.tastes.includes('tropical')) },
    { id: 'bubbles', title: 'Bulles & champagne', kicker: 'Pour trinquer', color: '#f4e3a0', match: (r) => has(r, 'champagne', 'prosecco') },
    { id: 'nightcap', title: 'Le dernier verre', kicker: 'Courts, ambrés, intenses', color: '#9c4a20', match: (r) => r.family === 'spirit-forward' && ['whisky', 'brandy', 'rum'].includes(r.base) },
    { id: 'garden', title: 'Jardin d’herbes', kicker: 'Menthe, basilic, concombre', color: '#3ee6a6', match: (r) => has(r, 'mint', 'basil', 'cucumber', 'rosemary') },
    { id: 'zero', title: 'Zéro degré, 100 % style', kicker: 'Sans alcool', color: '#b9a6ff', match: (r) => !r.alcoholic },
    { id: 'agave', title: 'Route de l’agave', kicker: 'Tequila & mezcal', color: '#d4f25a', match: (r) => r.base === 'tequila' || r.base === 'mezcal' },
  ],
  crackhead: [
    { id: 'avant-boite', title: 'Avant la boîte', kicker: 'Les flashs en bouteille', color: '#ff2a1a', match: (r) => r.glass === 'bottle' && r.alcoholic && r.family !== 'neat' },
    { id: 'energie', title: 'Énergisante gang', kicker: 'Red Bull & co', color: '#ff7a1a', match: (r) => has(r, 'energy_drink', 'energy_drink_blue') && r.alcoholic },
    { id: 'sans-melange', title: 'Sans mélange', kicker: 'Canettes, 8.6 & cubis', color: '#e6a91e', match: (r) => r.family === 'neat' },
    { id: 'bieres', title: 'Bières de combat', kicker: 'Tout ce qui mousse', color: '#f2c14a', match: (r) => r.base === 'beer' },
    { id: 'shots', title: 'Cul sec', kicker: 'Shots & bombes', color: '#ffffff', match: (r) => r.family === 'shot' },
    { id: 'sucre', title: 'Sucré qui trompe', kicker: 'Ça se boit comme du jus', color: '#ff4f8b', match: (r) => r.alcoholic && r.sweetness >= 4 && r.family !== 'neat' },
    { id: 'sam', title: 'Le coin du SAM', kicker: 'Sans alcool', color: '#7cd7ff', match: (r) => !r.alcoholic },
  ],
};
