export type CocktailType = 'consensuelle' | 'signature' | 'audacieuse';
export type CocktailSource =
  | 'reference'
  | 'gemini_ia'
  | 'user_custom'
  | 'party_menu'
  | 'catalog' // built-in TIKITIKI catalog
  | 'ai_adapted' // catalog recipe adapted by AI
  | 'ai_original'; // original AI creation (checked against the catalog for duplicates)

export interface IngredientItem {
  name: string;
  amount: string; // e.g. "4 cl", "12 cl", "1 tranche"
  unit?: string;
  category: 'alcool' | 'diluant' | 'sirop' | 'garniture' | 'autre';
  supermarketCommon: boolean;
  estimatedPrice?: string;
  formatAdvice?: string;
  optional?: boolean;
}

export interface EstimatedCost {
  min: number;
  max: number;
  currency: string;
  status: 'estime' | 'a_verifier';
  note: string;
}

export interface TasteProfile {
  primaryNotes: string[];
  sweetness: number; // 1-5
  fruitiness: number; // 1-5
  originality: number; // 1-5
  profileName: string;
  colorTheme?: 'dark-berry' | 'tropical' | 'citrus-fresh' | 'floral' | 'botanical-bitter' | 'spiced-warm' | 'mystic-dark';
}

export interface CocktailRecipe {
  id: string;
  name: string;
  type: CocktailType;
  tagline: string;
  description: string;
  tasteProfile: TasteProfile;
  ingredients: IngredientItem[];
  steps: string[];
  glassType: string;
  prepTimeMinutes: number;
  difficulty: 'Très facile' | 'Facile' | 'Moyen';
  distinctIngredientsCount: number;
  estimatedCost: EstimatedCost;
  aromaticCoherence: string;
  simplerAlternative: string;
  mocktailVariant: string;
  isMocktailOnly?: boolean;
  allergens: string[];
  alcoholEstimate: string; // e.g. "Modéré (~9% vol.)" ou "0.0% Sans alcool"
  imageUrl: string;
  isExample?: boolean;
  source?: CocktailSource;
  testedByUser?: boolean;
  createdAt?: string;
  userRating?: number; // 1-5
  userTags?: string[]; // e.g. ["Parfait", "À refaire"]
  userNotes?: string;
  timerSeconds?: number; // optional timer in seconds for shaking or infusion
  catalogId?: string; // id in the built-in catalog (catalog recipes and AI adaptations)
  color?: string; // drink colour for the procedural illustration
  glassKind?: import('../catalog/types').Glass;
  iceKind?: import('../catalog/types').Ice;
  garnish?: string;
  tastes?: import('../catalog/types').Taste[];
  provenanceLabel?: string;
  pack?: import('../catalog/types').Pack;
  riskNote?: string;
}

export interface CreationConfig {
  freeIntent?: string; // e.g. "un cocktail acidulé, élégant et peu sucré"
  isMocktailMode?: boolean; // First-class non-alcoholic mode
  selectedBases: string[];
  singleBottleOnly: boolean;
  selectedMixers: string[];
  selectedAromatics: string[];
  profileName: string;
  fruitiness: number; // 1-5
  sweetness: number; // 1-5
  originality: number; // 1-5
  crowdPleaser: boolean;
  servings?: number;
  advancedFilters: {
    budgetLimit: 'low' | 'medium' | 'any';
    servings: number;
    maxBottlesToCarry: number;
    useBarOnly: boolean;
    prepTimeMax: number;
    frenchSupermarketOnly: boolean;
    noSyrup: boolean;
    noFreshFruits: boolean;
    noEnergyDrinks: boolean;
  };
}

export interface UserBarItem {
  id: string;
  name: string;
  category: 'alcool' | 'diluant' | 'sirop' | 'garniture';
  inStock: boolean;
  ingredientId?: string; // catalog ingredient id when the entry is recognised
  brand?: string;
  openedDate?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: 'alcool' | 'diluant' | 'sirop' | 'garniture' | 'autre';
  recipesUsing: string[];
  formatNote?: string;
  totalQuantity?: string;
  estimatedCost?: string;
  checked: boolean;
}

export interface UserTastePreferences {
  preferredSweetness: number; // 1-5
  preferredFruitiness: number; // 1-5
  preferredOriginality: number; // 1-5
  favoriteBases: string[];
  dislikedIngredients: string[];
  preferMocktails: boolean;
  lastUpdated: string;
}

export interface PartyPlan {
  guestCount: number;
  budgetTotalEur: number;
  theme: string;
  recipes: CocktailRecipe[];
  mocktailRecipe?: CocktailRecipe;
  consolidatedShopping: {
    item: string;
    bottlesNeeded: string;
    category: string;
  }[];
  prepTimeline: string[];
}
