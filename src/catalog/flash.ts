import { buildRecipe, Row } from './build';
import { CatalogRecipe } from './types';

// "Crackhead" mode catalog: the simple, cheap pre-party mixes people actually drink before a club night.
// p: 'f' is rendered as provenance { kind: 'flash' } (popular mix, no single authoritative source),
// 'c' for documented classics. Quantities are TIKITIKI's own rendering.
type FlashRow = Omit<Row, 'p'> & { p: 'f' | 'c' };

const ROWS: FlashRow[] = [
  { id: 'vodka-schweppes-agrumes', name: 'Vodka Schweppes Agrumes', d: 'Le classique absolu de la pré-soirée : vodka et soda agrumes, ça pique, ça passe.', f: 'highball', t: 'acidule,petillant', b: 'vodka', g: 'solo', ice: 'cubes', m: 'build-top', c: '#ffd84a', sw: 3, st: 2, ing: 'vodka:5 citrus_soda:top', p: 'f' },
  { id: 'vodka-red-bull', name: 'Vodka Red Bull', d: 'Vodka et boisson énergisante : le carburant officiel du dancefloor.', f: 'highball', t: 'doux,petillant', b: 'vodka', g: 'solo', ice: 'cubes', m: 'build-top', c: '#f2c230', sw: 4, st: 2, ing: 'vodka:5 energy_drink:top', p: 'f' },
  { id: 'vodka-red-bull-myrtille', name: 'Vodka Red Bull Myrtille', d: 'La version bleue qui tache la langue : vodka et énergisante myrtille.', f: 'highball', t: 'fruite,doux,petillant', b: 'vodka', g: 'solo', ice: 'cubes', m: 'build-top', c: '#3c6bff', sw: 4, st: 2, ing: 'vodka:5 energy_drink_blue:top', p: 'f' },
  { id: 'gin-red-bull', name: 'Gin Red Bull', d: 'Pour ceux qui trouvent le gin tonic trop calme.', f: 'highball', t: 'herbace,doux,petillant', b: 'gin', g: 'solo', ice: 'cubes', m: 'build-top', c: '#e7d26a', sw: 4, st: 2, ing: 'gin:5 energy_drink:top', p: 'f' },
  { id: 'captain-coca', name: 'Captain Coca', d: 'Rhum épicé et cola : vanille, caramel, et des décisions discutables.', f: 'highball', t: 'doux,epice,petillant', b: 'rum', g: 'solo', ice: 'cubes', m: 'build-top', c: '#4a1c0c', sw: 4, st: 2, ing: 'spiced_rum:5 cola:top lime:1wedge?', p: 'f' },
  { id: 'whisky-coca', name: 'Whisky Coca', d: 'Le duo du comptoir de boîte, sans chichi.', f: 'highball', t: 'doux,petillant', b: 'whisky', g: 'solo', ice: 'cubes', m: 'build-top', c: '#3c170a', sw: 4, st: 2, ing: 'scotch:5 cola:top', p: 'f' },
  { id: 'whisky-red-bull', name: 'Whisky Red Bull', d: 'Malté, sucré, électrique.', f: 'highball', t: 'doux,petillant', b: 'whisky', g: 'solo', ice: 'cubes', m: 'build-top', c: '#d9a23a', sw: 4, st: 2, ing: 'scotch:5 energy_drink:top', p: 'f' },
  { id: 'rhum-coca', name: 'Rhum Coca', d: 'Le Cuba Libre qui a oublié le citron vert.', f: 'highball', t: 'doux,petillant', b: 'rum', g: 'solo', ice: 'cubes', m: 'build-top', c: '#3f160a', sw: 4, st: 2, ing: 'white_rum:5 cola:top', p: 'f' },
  { id: 'vodka-pomme', name: 'Vodka Pomme', d: 'Le flash le plus commandé au bar étudiant : vodka et jus de pomme.', f: 'highball', t: 'fruite,doux', b: 'vodka', g: 'solo', ice: 'cubes', m: 'build', c: '#e8c45a', sw: 3, st: 2, ing: 'vodka:5 apple_juice:12', p: 'f' },
  { id: 'vodka-orange', name: 'Vodka Orange', d: 'Vitamine C + vodka = équilibre alimentaire (non).', f: 'highball', t: 'fruite,doux', b: 'vodka', g: 'solo', ice: 'cubes', m: 'build', c: '#ff9a1f', sw: 3, st: 2, ing: 'vodka:5 orange_juice:12', p: 'f' },
  { id: 'vodka-ice-tea', name: 'Vodka Ice Tea Pêche', d: 'Thé glacé pêche et vodka : ça se boit comme du jus, attention.', f: 'highball', t: 'fruite,doux', b: 'vodka', g: 'solo', ice: 'cubes', m: 'build', c: '#d78a2c', sw: 4, st: 2, ing: 'vodka:5 iced_tea:12', p: 'f' },
  { id: 'vodka-oasis', name: 'Vodka Oasis Tropical', d: 'La boisson tropicale du goûter devient un flash de soirée.', f: 'highball', t: 'tropical,doux', b: 'vodka', g: 'solo', ice: 'cubes', m: 'build', c: '#ff7a2f', sw: 5, st: 2, ing: 'vodka:5 tropical_drink:12', p: 'f' },
  { id: 'vodka-sprite', name: 'Vodka Sprite', d: 'Limonade et vodka : transparent, comme tes intentions.', f: 'highball', t: 'doux,petillant', b: 'vodka', g: 'solo', ice: 'cubes', m: 'build-top', c: '#e9f7e2', sw: 4, st: 2, ing: 'vodka:5 lemon_soda:top', p: 'f' },
  { id: 'vodka-orangina', name: 'Vodka Orangina', d: 'Secoue la bouteille, pas le verre.', f: 'highball', t: 'fruite,petillant,doux', b: 'vodka', g: 'solo', ice: 'cubes', m: 'build-top', c: '#ffa733', sw: 4, st: 2, ing: 'vodka:5 orange_soda:top', p: 'f' },
  { id: 'malibu-ananas', name: 'Malibu Ananas', d: 'Rhum coco et ananas : la plage version parking.', f: 'highball', t: 'tropical,doux', b: 'rum', g: 'solo', ice: 'cubes', m: 'build', c: '#f6e07a', sw: 5, st: 1, ing: 'coconut_rum:5 pineapple_juice:12', p: 'f' },
  { id: 'malibu-cranberry', name: 'Malibu Cranberry', d: 'Coco et cranberry, rose et sucré.', f: 'highball', t: 'fruite,tropical,doux', b: 'rum', g: 'solo', ice: 'cubes', m: 'build', c: '#e0385c', sw: 5, st: 1, ing: 'coconut_rum:5 cranberry_juice:12', p: 'f' },
  { id: 'jagerbomb', name: 'Jägerbomb', d: 'Un shot de Jäger lâché dans un verre de boisson énergisante. Cul sec, évidemment.', f: 'shot', t: 'herbace,doux,petillant', b: 'liqueur', g: 'pint', ice: 'none', m: 'build', c: '#7a3a12', sw: 4, st: 2, ing: 'energy_drink:12 jagermeister:3', p: 'c', steps: ['Verser la boisson énergisante dans un verre.', 'Remplir un shooter de Jägermeister.', 'Lâcher le shooter dans le verre et boire immédiatement.'] },
  { id: 'jager-red-bull-long', name: 'Jäger Red Bull', d: 'Le Jägerbomb en version longue, pour faire durer.', f: 'highball', t: 'herbace,doux,petillant', b: 'liqueur', g: 'solo', ice: 'cubes', m: 'build-top', c: '#8a4515', sw: 4, st: 2, ing: 'jagermeister:4 energy_drink:top', p: 'f' },
  { id: 'get-sprite', name: 'Get Sprite', d: 'Liqueur de menthe et limonade : vert fluo, goût chewing-gum.', f: 'highball', t: 'herbace,doux,petillant', b: 'liqueur', g: 'solo', ice: 'cubes', m: 'build-top', c: '#2ee86b', sw: 5, st: 1, ing: 'creme_de_menthe:4 lemon_soda:top', p: 'f' },
  { id: 'jaune', name: 'Le Jaune', aka: ['Ricard', 'Pastaga'], d: 'Pastis, eau fraîche, glaçons. Un pour cinq, comme au bar-tabac.', f: 'highball', t: 'herbace', b: 'aperitif', g: 'highball', ice: 'cubes', m: 'build', c: '#f2e7a4', sw: 2, st: 1, ing: 'pastis:2 water:10', p: 'c' },
  { id: 'monaco', name: 'Monaco', d: 'Bière, limonade et grenadine : le panaché qui rougit.', f: 'highball', t: 'doux,petillant', b: 'beer', g: 'pint', ice: 'none', m: 'build', c: '#ee6a4a', sw: 4, st: 1, ing: 'grenadine:2 lager:15 lemon_soda:15', p: 'c' },
  { id: 'tango', name: 'Tango', d: 'Bière blonde et grenadine.', f: 'highball', t: 'doux,petillant', b: 'beer', g: 'pint', ice: 'none', m: 'build', c: '#d9542e', sw: 3, st: 1, ing: 'grenadine:2 lager:25', p: 'c' },
  { id: 'picon-biere', name: 'Picon Bière', d: 'Amer orange et bière : le flash du Nord et de l’Est.', f: 'highball', t: 'amer,petillant', b: 'beer', g: 'pint', ice: 'none', m: 'build', c: '#c9772a', sw: 2, st: 1, ing: 'picon:3 lager:25', p: 'c' },
  { id: 'rose-pamplemousse', name: 'Rosé Pamplemousse', d: 'Rosé et sirop de pamplemousse : l’apéro piscine, même sans piscine.', f: 'spritz', t: 'fruite,doux', b: 'wine', g: 'wine', ice: 'cubes', m: 'build', c: '#f6a3a0', sw: 4, st: 1, ing: 'rose_wine:12 grapefruit_syrup:2', p: 'f' },
  { id: 'cidre-cassis', name: 'Cidre Cassis', d: 'Cidre et crème de cassis : le kir breton, en bolée ou en gobelet.', f: 'spritz', t: 'fruite,petillant', b: 'wine', g: 'solo', ice: 'none', m: 'build', c: '#8a2340', sw: 3, st: 1, ing: 'creme_de_cassis:1.5 cider:15', p: 'c' },
  { id: 'tequila-paf', name: 'Tequila Paf', aka: ['Tequila Boum'], d: 'Tequila et limonade, on couvre, on tape sur la table, on boit d’un coup.', f: 'shot', t: 'petillant', b: 'tequila', g: 'shot', ice: 'none', m: 'build', c: '#f3f0c8', sw: 3, st: 2, ing: 'tequila:3 lemon_soda:3', p: 'f', steps: ['Verser la tequila puis la limonade dans un verre épais.', 'Couvrir avec la main, taper le verre sur la table pour faire mousser.', 'Boire d’un trait pendant que ça mousse.'] },
  { id: 'shooter-vodka-citron', name: 'Shooter Vodka Citron', d: 'Vodka, citron, sucre, secoué : le shot qui fait grimacer.', f: 'shot', t: 'acidule', b: 'vodka', g: 'shot', ice: 'none', m: 'shake', c: '#f4f1b0', sw: 2, st: 2, ing: 'vodka:3 lemon_juice:1 simple_syrup:1', p: 'f' },
  { id: 'punch-du-seau', name: 'Punch du Seau', d: 'Le punch maison servi à la louche : rhum, jus, grenadine. Pour 1 verre ici, multiplie pour le seau.', f: 'punch', t: 'tropical,fruite,doux', b: 'rum', g: 'solo', ice: 'cubes', m: 'build', c: '#ff5a3a', sw: 5, st: 2, ing: 'white_rum:4 orange_juice:6 pineapple_juice:6 grenadine:1.5 simple_syrup:1?', p: 'f' },
  // ── SAM (Sans Alcool, Mais fun) ──
  { id: 'diabolo-menthe', name: 'Diabolo Menthe', d: 'Pour le SAM : sirop de menthe et limonade, vert pétard.', f: 'highball', t: 'herbace,doux,petillant', b: 'none', g: 'solo', ice: 'cubes', m: 'build-top', c: '#3ee67a', sw: 5, st: 0, ing: 'mint_syrup:3 lemon_soda:top', p: 'c' },
  { id: 'diabolo-grenadine', name: 'Diabolo Grenadine', d: 'Le SAM version rose bonbon.', f: 'highball', t: 'fruite,doux,petillant', b: 'none', g: 'solo', ice: 'cubes', m: 'build-top', c: '#ff3b6b', sw: 5, st: 0, ing: 'grenadine:3 lemon_soda:top', p: 'c' },
  { id: 'red-bull-agrumes-sam', name: 'Red Bull Agrumes (SAM)', d: 'Énergisante et soda agrumes : du peps sans alcool pour celui qui conduit.', f: 'highball', t: 'acidule,petillant,doux', b: 'none', g: 'solo', ice: 'cubes', m: 'build', c: '#ffe14a', sw: 4, st: 0, ing: 'energy_drink:12 citrus_soda:10', p: 'f' },
  { id: 'ice-tea-peche-sam', name: 'Ice Tea Pêche Citron (SAM)', d: 'Thé glacé, sirop de pêche et citron sur glace.', f: 'highball', t: 'fruite,doux', b: 'none', g: 'solo', ice: 'cubes', m: 'build', c: '#e09a3c', sw: 4, st: 0, ing: 'iced_tea:15 peach_syrup:1 lemon_juice:1', p: 'f' },
];

export const FLASH_CATALOG: CatalogRecipe[] = ROWS.map((r) => {
  const built = buildRecipe({ ...r, p: r.p === 'c' ? 'c' : 't' });
  return r.p === 'f' ? { ...built, provenance: { kind: 'flash' } } : built;
});

export const FLASH_BY_ID: Record<string, CatalogRecipe> = Object.fromEntries(FLASH_CATALOG.map((r) => [r.id, r]));
