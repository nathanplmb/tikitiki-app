export interface IngredientOption {
  id: string;
  name: string;
  category: 'alcool' | 'diluant' | 'sirop' | 'garniture' | 'autre';
  subCategory?: string;
  description: string;
  supermarketAvailability: 'très facile' | 'facile' | 'spécialisé';
  isEnergyDrink?: boolean;
  notes?: string;
}

export const ALCOHOL_BASES: IngredientOption[] = [
  {
    id: 'vodka-classique',
    name: 'Vodka classique',
    category: 'alcool',
    subCategory: 'Neutre & pur',
    description: 'Profil pur, neutre et cristallin, idéal pour sublimer les arômes fruités ou acidulés.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'vodka-aromatisee',
    name: 'Vodka aromatisée',
    category: 'alcool',
    subCategory: 'Fruité & moderne',
    description: 'Notes subtiles de vanille, pomme ou baies rouges selon la bouteille.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'gin',
    name: 'Gin',
    category: 'alcool',
    subCategory: 'Botanique & frais',
    description: 'Baies de genièvre, notes d’agrumes et d’épices végétales. Parfait pour les profils frais ou floraux.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'rhum-blanc',
    name: 'Rhum blanc',
    category: 'alcool',
    subCategory: 'Canne & soleil',
    description: 'Notes douces et rondes de canne à sucre, incontournable pour les profils exotiques et estivaux.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'rhum-ambre',
    name: 'Rhum ambré',
    category: 'alcool',
    subCategory: 'Boisé & vanillé',
    description: 'Notes chaudes de vanille, caramel et bois toasté. Apporte une belle rondeur.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'malibu-coco',
    name: 'Malibu & liqueurs de coco',
    category: 'alcool',
    subCategory: 'Gourmand & exotique',
    description: 'Douceur crémeuse de noix de coco, très consensuel et festif.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'passoa-passion',
    name: 'Passoã & liqueurs de passion',
    category: 'alcool',
    subCategory: 'Acidulé & festif',
    description: 'Arôme acidulé éclatant de fruit de la passion, signature emblématique des apéritifs festifs.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'liqueur-peche',
    name: 'Liqueur de pêche',
    category: 'alcool',
    subCategory: 'Doux & velouté',
    description: 'Douceur veloutée de pêche blanche ou jaune, s’accorde magnifiquement avec le cranberry ou le tonic.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'liqueurs-fruits-rouges',
    name: 'Liqueurs de fruits rouges (Cassis, Mûre)',
    category: 'alcool',
    subCategory: 'Baies & sombre',
    description: 'Richesse gourmande du cassis ou de la mûre sauvage, apporte une couleur pourpre spectaculaire.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'whisky-bourbon',
    name: 'Whisky & Bourbon',
    category: 'alcool',
    subCategory: 'Chaleureux & céréales',
    description: 'Notes de malt, vanille et chêne. Idéal twisté avec du ginger ale ou du jus de pomme.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'tequila',
    name: 'Tequila',
    category: 'alcool',
    subCategory: 'Agave & vif',
    description: 'Vivacité végétale d’agave, sublime avec pamplemousse, tonic ou jus d’ananas.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'jagermeister-herbal',
    name: 'Jägermeister & liqueurs herbacées',
    category: 'alcool',
    subCategory: 'Herbacé & épicé',
    description: '56 herbes et épices, notes de réglisse et d’agrumes. Étonnant avec du tonic ou du jus de pomme.',
    supermarketAvailability: 'facile',
  },
];

export const MIXERS: IngredientOption[] = [
  // Sodas & bulles
  {
    id: 'schweppes-tonic',
    name: 'Schweppes Indian Tonic',
    category: 'diluant',
    subCategory: 'Sodas & pétillants',
    description: 'Amertume nette de la quinine et fines bulles rafraîchissantes.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'schweppes-agrumes',
    name: 'Schweppes Agrumes',
    category: 'diluant',
    subCategory: 'Sodas & pétillants',
    description: 'Mélange d’orange, pamplemousse et mandarine avec une pointe d’amertume douce.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'schweppes-pink-tonic',
    name: 'Schweppes Pink Tonic',
    category: 'diluant',
    subCategory: 'Sodas & pétillants',
    description: 'Nuance fruitée de baies rouges et touche florale très raffinée.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'limonade',
    name: 'Limonade artisanale',
    category: 'diluant',
    subCategory: 'Sodas & pétillants',
    description: 'Bulles douces et pointe de citron sucré, base ultra consensuelle.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'ginger-beer',
    name: 'Ginger Beer',
    category: 'diluant',
    subCategory: 'Sodas & pétillants',
    description: 'Pétillement vif avec le piquant chaleureux du gingembre fermenté.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'ginger-ale',
    name: 'Ginger Ale',
    category: 'diluant',
    subCategory: 'Sodas & pétillants',
    description: 'Plus doux que la ginger beer, notes légères de gingembre et caramel.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'cola',
    name: 'Cola',
    category: 'diluant',
    subCategory: 'Sodas & pétillants',
    description: 'Épices chaudes, vanille et caramel avec acidité stimulante.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'soda-citron',
    name: 'Soda citron / Sprite',
    category: 'diluant',
    subCategory: 'Sodas & pétillants',
    description: 'Fraîcheur citron-citron vert tonique et sucrée.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'eau-petillante',
    name: 'Eau pétillante',
    category: 'diluant',
    subCategory: 'Sodas & pétillants',
    description: 'Zéro sucre, effervescence pure pour aérer le cocktail.',
    supermarketAvailability: 'très facile',
  },

  // Boissons fruitées
  {
    id: 'jus-cranberry',
    name: 'Jus de Cranberry (Canneberge)',
    category: 'diluant',
    subCategory: 'Boissons fruitées',
    description: 'Acidité astringente et belle couleur rubis, équilibre le sucre.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'jus-pomme',
    name: 'Jus de pomme pur jus',
    category: 'diluant',
    subCategory: 'Boissons fruitées',
    description: 'Douceur acidulée naturelle, s’associe avec rhum, vodka ou whisky.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'jus-ananas',
    name: 'Jus d’ananas',
    category: 'diluant',
    subCategory: 'Boissons fruitées',
    description: 'Texture soyeuse créant une belle mousse à l’agitation, arôme tropical.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'jus-orange',
    name: 'Jus d’orange avec pulpe',
    category: 'diluant',
    subCategory: 'Boissons fruitées',
    description: 'Classique fruité et tonique, riche en agrumes ensoleillés.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'nectar-peche',
    name: 'Nectar de pêche',
    category: 'diluant',
    subCategory: 'Boissons fruitées',
    description: 'Onctuosité veloutée et parfum d’été très flatteur.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'jus-fruits-rouges',
    name: 'Boisson / Nectar aux fruits rouges',
    category: 'diluant',
    subCategory: 'Boissons fruitées',
    description: 'Association gourmande fraise, cassis, framboise et mûre.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'oasis-tropical',
    name: 'Oasis Tropical',
    category: 'diluant',
    subCategory: 'Boissons fruitées',
    description: 'Boisson aux fruits très conviviale et sucrée, prisée en soirée décontractée.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'boisson-mure-myrtille',
    name: 'Boisson mûre ou myrtille',
    category: 'diluant',
    subCategory: 'Boissons fruitées',
    description: 'Notes sombres et boisées de baies sauvages.',
    supermarketAvailability: 'facile',
  },

  // Boissons énergisantes (avec avertissement)
  {
    id: 'redbull-classique',
    name: 'Red Bull classique',
    category: 'diluant',
    subCategory: 'Boissons énergisantes',
    description: 'Profil acidulé caractéristique. Note : caféine présente.',
    supermarketAvailability: 'très facile',
    isEnergyDrink: true,
    notes: 'La caféine peut masquer la sensation d’ébriété. À consommer avec discernement.',
  },
  {
    id: 'redbull-fruits',
    name: 'Red Bull aromatisé aux fruits',
    category: 'diluant',
    subCategory: 'Boissons énergisantes',
    description: 'Éditions pastèque, fruits tropicaux ou abricot-fraise.',
    supermarketAvailability: 'facile',
    isEnergyDrink: true,
    notes: 'La caféine peut masquer la sensation d’ébriété. À consommer avec discernement.',
  },
];

export const AROMATICS: IngredientOption[] = [
  // Sirops
  {
    id: 'sirop-mure',
    name: 'Sirop de mûre',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Saveur profonde de baie sauvage, robe violacée superbe.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'sirop-violette',
    name: 'Sirop de violette',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Parfum floral délicat et rétro, touche bonbon magique.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'sirop-grenadine',
    name: 'Sirop de grenadine',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Incontournable des fêtes, notes douces de vanille et fruits rouges.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'sirop-framboise',
    name: 'Sirop de framboise',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Acidité délicate et fruité éclatant.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'sirop-fraise',
    name: 'Sirop de fraise',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Gourmandise enfantine et rondeur sucrée.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'sirop-peche',
    name: 'Sirop de pêche',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Parfum solaire et tendre de pêche de vigne.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'sirop-fleur-sureau',
    name: 'Sirop de fleur de sureau (Elderflower)',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Finesse botanique raffinée, très tendance en mixologie moderne.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'sirop-passion',
    name: 'Sirop de passion',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Puissance exotique très concentrée.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'sirop-citron',
    name: 'Sirop de citron',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Équilibre acide-sucre pour vivifier le verre.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'sirop-vanille',
    name: 'Sirop de vanille',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Notes enveloppantes et réconfortantes de gousse de vanille.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'curacao-bleu-sans-alcool',
    name: 'Sirop de Curaçao bleu (sans alcool)',
    category: 'sirop',
    subCategory: 'Sirops',
    description: 'Notes d’orange amère (laraha) et couleur bleu lagon lumineuse.',
    supermarketAvailability: 'facile',
  },

  // Garnitures & Fruits
  {
    id: 'citron-vert',
    name: 'Citron vert frais (quartiers ou jus)',
    category: 'garniture',
    subCategory: 'Garnitures & Fruits',
    description: 'L’acidité tranchante essentielle pour l’équilibre du cocktail.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'citron-jaune',
    name: 'Citron jaune frais',
    category: 'garniture',
    subCategory: 'Garnitures & Fruits',
    description: 'Zeste aromatique et fraîcheur vive.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'fruits-rouges-frais',
    name: 'Fruits rouges / Framboises fraîches',
    category: 'garniture',
    subCategory: 'Garnitures & Fruits',
    description: 'Visuel premium et petits éclats fruités dans le verre.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'myrtilles-mures',
    name: 'Myrtilles ou mûres fraîches',
    category: 'garniture',
    subCategory: 'Garnitures & Fruits',
    description: 'Touche esthétique néon sombre au fond du verre.',
    supermarketAvailability: 'facile',
  },
  {
    id: 'tranche-orange',
    name: 'Tranches d’orange fraîche',
    category: 'garniture',
    subCategory: 'Garnitures & Fruits',
    description: 'Ambiance coucher de soleil et parfum d’écorce.',
    supermarketAvailability: 'très facile',
  },

  // Autres options
  {
    id: 'menthe-fraiche',
    name: 'Feuilles de menthe fraîche',
    category: 'autre',
    subCategory: 'Herbes & Épices',
    description: 'Effluves mentholés vivifiants à frapper entre les paumes.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'gingembre-frais',
    name: 'Tranches fines de gingembre frais',
    category: 'autre',
    subCategory: 'Herbes & Épices',
    description: 'Piquant naturel et dynamisme aromatique.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'gouttes-citron',
    name: 'Quelques gouttes de jus de citron',
    category: 'autre',
    subCategory: 'Herbes & Épices',
    description: 'Touche d’acidité minimale pour réveiller les saveurs.',
    supermarketAvailability: 'très facile',
  },
  {
    id: 'glacons-piles',
    name: 'Glaçons pleins ou glace pilée',
    category: 'autre',
    subCategory: 'Essentiels',
    description: 'Fraîcheur thermique maximale et dilution contrôlée.',
    supermarketAvailability: 'très facile',
  },
];

export interface FlavorProfile {
  id: string;
  name: string;
  shortTag: string;
  description: string;
  color: string;
  accentClass: string;
  borderClass: string;
  colorTheme: 'dark-berry' | 'tropical' | 'citrus-fresh' | 'floral' | 'botanical-bitter' | 'spiced-warm' | 'neutral';
}

export const FLAVOR_PROFILES: FlavorProfile[] = [
  {
    id: 'fruite-bonbon',
    name: 'Fruité et bonbon',
    shortTag: 'Gourmand & éclatant',
    description: 'Douceur acidulée rappelant les confiseries aux fruits, accessible et festive.',
    color: '#ec4899',
    accentClass: 'from-pink-500/20 to-purple-500/10 text-pink-300',
    borderClass: 'border-pink-500/30 hover:border-pink-400',
    colorTheme: 'dark-berry',
  },
  {
    id: 'fruits-noirs',
    name: 'Fruits noirs : mûre, cassis, myrtille',
    shortTag: 'Baies sauvages',
    description: 'Profondeur aromatique boisée, robe pourpre veloutée et élégance sombre.',
    color: '#9333ea',
    accentClass: 'from-purple-600/25 to-indigo-600/10 text-purple-300',
    borderClass: 'border-purple-500/30 hover:border-purple-400',
    colorTheme: 'dark-berry',
  },
  {
    id: 'acidule-frais',
    name: 'Acidulé et frais',
    shortTag: 'Zesté & tonique',
    description: 'Explosion d’agrumes tonifiants et effervescence nette, désaltérant à souhait.',
    color: '#06b6d4',
    accentClass: 'from-cyan-500/20 to-emerald-500/10 text-cyan-300',
    borderClass: 'border-cyan-500/30 hover:border-cyan-400',
    colorTheme: 'citrus-fresh',
  },
  {
    id: 'tropical-ensoleille',
    name: 'Tropical et ensoleillé',
    shortTag: 'Exotique & soyeux',
    description: 'Ananas, fruit de la passion et mangue pour une évasion lumineuse.',
    color: '#f59e0b',
    accentClass: 'from-amber-500/20 to-orange-500/10 text-amber-300',
    borderClass: 'border-amber-500/30 hover:border-amber-400',
    colorTheme: 'tropical',
  },
  {
    id: 'doux-gourmand',
    name: 'Doux et gourmand',
    shortTag: 'Rondeur & velouté',
    description: 'Texture enveloppante, vanille et fruits mûrs, idéal pour les amateurs de douceur.',
    color: '#f43f5e',
    accentClass: 'from-rose-500/20 to-pink-500/10 text-rose-300',
    borderClass: 'border-rose-500/30 hover:border-rose-400',
    colorTheme: 'dark-berry',
  },
  {
    id: 'floral-elegant',
    name: 'Floral et élégant',
    shortTag: 'Délicat & aérien',
    description: 'Sureau, violette et notes botaniques pour une dégustation tout en finesse.',
    color: '#a855f7',
    accentClass: 'from-fuchsia-500/20 to-purple-500/10 text-fuchsia-300',
    borderClass: 'border-fuchsia-500/30 hover:border-fuchsia-400',
    colorTheme: 'floral',
  },
  {
    id: 'amer-botanique',
    name: 'Amer et botanique',
    shortTag: 'Herbes & quinine',
    description: 'Quinine, genièvre et écorces pour les palais qui fuient le sucre.',
    color: '#10b981',
    accentClass: 'from-emerald-500/20 to-teal-500/10 text-emerald-300',
    borderClass: 'border-emerald-500/30 hover:border-emerald-400',
    colorTheme: 'botanical-bitter',
  },
  {
    id: 'epice-chaleureux',
    name: 'Épicé et chaleureux',
    shortTag: 'Gingembre & bois',
    description: 'Gingembre piquant, épices douces et chaleur réconfortante.',
    color: '#ea580c',
    accentClass: 'from-orange-600/20 to-amber-600/10 text-orange-300',
    borderClass: 'border-orange-500/30 hover:border-orange-400',
    colorTheme: 'spiced-warm',
  },
  {
    id: 'mysterieux-sombre',
    name: 'Mystérieux et sombre',
    shortTag: 'Nocturne & intense',
    description: 'Association d’herbes et de baies profondes pour une signature unique.',
    color: '#6366f1',
    accentClass: 'from-indigo-600/25 to-purple-700/15 text-indigo-300',
    borderClass: 'border-indigo-500/30 hover:border-indigo-400',
    colorTheme: 'dark-berry',
  },
  {
    id: 'tres-original-accessible',
    name: 'Très original, mais facile à apprécier',
    shortTag: 'Twist surprenant',
    description: 'Contraste inattendu tout en restant harmonieux et séduisant pour un groupe.',
    color: '#00f0ff',
    accentClass: 'from-cyan-400/20 to-fuchsia-500/10 text-cyan-200',
    borderClass: 'border-cyan-400/30 hover:border-cyan-300',
    colorTheme: 'citrus-fresh',
  },
];

export interface PairingSuggestion {
  title: string;
  base: string;
  mixer: string;
  aromatic: string;
  tagline: string;
  description: string;
  whyItWorks: string;
}

export const CURATED_PAIRINGS: PairingSuggestion[] = [
  {
    title: 'Le Midnight Botanical',
    base: 'Gin',
    mixer: 'Schweppes Pink Tonic',
    aromatic: 'Sirop de mûre',
    tagline: 'Genièvre frais × Baies sauvages',
    description: 'Une alliance pourpre lumineuse où la baie de genièvre rencontre la gourmandise sombre de la mûre.',
    whyItWorks: 'Le piquant résineux du gin tempère le sucre de la mûre, sublimé par les bulles douces du pink tonic.',
  },
  {
    title: 'L’Oasis Sunset',
    base: 'Rhum blanc',
    mixer: 'Jus de Cranberry',
    aromatic: 'Citron vert frais',
    tagline: 'Canne douce × Acidité vive',
    description: 'Un cocktail rubis étincelant, vif, fruité et incroyablement rafraîchissant.',
    whyItWorks: 'La rondeur de la canne adoucit l’astringence naturelle du cranberry pour un équilibre parfait.',
  },
  {
    title: 'Le Velvet Passion',
    base: 'Passoã',
    mixer: 'Limonade artisanale',
    aromatic: 'Feuilles de menthe fraîche',
    tagline: 'Fruit de la passion × Menthe frappée',
    description: 'Pétillant, acidulé et convivial, un incontournable des soirées festives.',
    whyItWorks: 'La menthe apporte une bouffée d’air frais qui dynamise le fruit de la passion sans masquer sa signature.',
  },
];
