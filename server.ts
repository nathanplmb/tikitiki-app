import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { CocktailRecipe, CreationConfig } from './src/types/cocktail';
import { AiError, HTTP_STATUS, USER_MESSAGE, checkConstraints, classifyError, findCatalogDuplicate, isDuplicateOfRecent, withTimeout } from './server/aiCore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '64kb' }));

// Initialize GoogleGenAI SDK on server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Map profile name to color theme for adaptive background
function mapProfileToColorTheme(profileName: string): CocktailRecipe['tasteProfile']['colorTheme'] {
  const p = profileName.toLowerCase();
  if (p.includes('noir') || p.includes('mûre') || p.includes('cassis')) return 'dark-berry';
  if (p.includes('tropical') || p.includes('passion') || p.includes('ananas')) return 'tropical';
  if (p.includes('acidulé') || p.includes('citron') || p.includes('frais')) return 'citrus-fresh';
  if (p.includes('floral') || p.includes('sureau') || p.includes('violette')) return 'floral';
  if (p.includes('amer') || p.includes('botanique') || p.includes('herbacé')) return 'botanical-bitter';
  if (p.includes('épicé') || p.includes('gingembre') || p.includes('chaleureux')) return 'spiced-warm';
  return 'dark-berry';
}

const RECIPES_SCHEMA = {
  type: Type.ARRAY,
  description: 'Exactly 3 distinct recipes: 1 consensuelle, 1 signature, 1 audacieuse',
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Short and memorable cocktail name' },
      type: {
        type: Type.STRING,
        enum: ['consensuelle', 'signature', 'audacieuse'],
        description: 'Cocktail category',
      },
      tagline: { type: Type.STRING, description: 'Catchy 1-sentence subtitle' },
      description: { type: Type.STRING, description: 'Detailed sensory description in French' },
      tasteProfile: {
        type: Type.OBJECT,
        properties: {
          primaryNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 primary aromatic notes',
          },
          sweetness: { type: Type.INTEGER, description: 'Score 1 to 5' },
          fruitiness: { type: Type.INTEGER, description: 'Score 1 to 5' },
          originality: { type: Type.INTEGER, description: 'Score 1 to 5' },
          profileName: { type: Type.STRING, description: 'Name of the flavor profile' },
        },
        required: ['primaryNotes', 'sweetness', 'fruitiness', 'originality', 'profileName'],
      },
      ingredients: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Name of ingredient' },
            amount: { type: Type.STRING, description: 'Quantity e.g. 4 cl, 12 cl, 1 tranche' },
            category: {
              type: Type.STRING,
              enum: ['alcool', 'diluant', 'sirop', 'garniture', 'autre'],
            },
            supermarketCommon: {
              type: Type.BOOLEAN,
              description: 'Whether it is easily found in French supermarkets',
            },
            estimatedPrice: { type: Type.STRING, description: 'Price estimate or note' },
            formatAdvice: {
              type: Type.STRING,
              description: 'e.g. Préférer petit format 25cl pour éviter le gaspillage',
            },
            optional: { type: Type.BOOLEAN },
          },
          required: ['name', 'amount', 'category', 'supermarketCommon'],
        },
      },
      steps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Chronological preparation steps in French',
      },
      glassType: { type: Type.STRING, description: 'Recommended glassware' },
      prepTimeMinutes: { type: Type.INTEGER, description: 'Preparation time in minutes (typically 2-4)' },
      difficulty: {
        type: Type.STRING,
        enum: ['Très facile', 'Facile', 'Moyen'],
      },
      distinctIngredientsCount: { type: Type.INTEGER },
      estimatedCost: {
        type: Type.OBJECT,
        properties: {
          min: { type: Type.NUMBER, description: 'Min cost per glass in EUR' },
          max: { type: Type.NUMBER, description: 'Max cost per glass in EUR' },
          currency: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['estime', 'a_verifier'] },
          note: { type: Type.STRING, description: 'Explanatory note on pricing' },
        },
        required: ['min', 'max', 'currency', 'status', 'note'],
      },
      aromaticCoherence: {
        type: Type.STRING,
        description: 'Clear, grounded mixology explanation of why these ingredients harmonize',
      },
      simplerAlternative: {
        type: Type.STRING,
        description: 'How to make a simpler or more consensual variation with common staples',
      },
      mocktailVariant: {
        type: Type.STRING,
        description: 'Virgin non-alcoholic alternative preserving the taste profile',
      },
      allergens: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Potential allergens if any, otherwise empty',
      },
      alcoholEstimate: {
        type: Type.STRING,
        description: 'e.g. Modéré (~8-10% vol.) ou 0.0% Sans alcool',
      },
      timerSeconds: {
        type: Type.INTEGER,
        description: 'Optional shake or infusion timer in seconds (e.g. 15 for shake, 180 for infusion)',
      },
    },
    required: [
      'name',
      'type',
      'tagline',
      'description',
      'tasteProfile',
      'ingredients',
      'steps',
      'glassType',
      'prepTimeMinutes',
      'difficulty',
      'distinctIngredientsCount',
      'estimatedCost',
      'aromaticCoherence',
      'simplerAlternative',
      'mocktailVariant',
      'allergens',
      'alcoholEstimate',
    ],
  },
};

const SYSTEM_INSTRUCTION = `Tu es un mixologue créatif professionnel pour l'application TIKITIKI, spécialisé dans les cocktails accessibles, les mocktails travaillés et les recettes conviviales.
Tu connais parfaitement les profils aromatiques des alcools, des softs, des thés, des sirops et des garnitures disponibles en France.

Règles impératives :
1. Produire une association aromatique cohérente et savoureuse.
2. Si le mode "Sans Alcool / Mocktail" est actif : 0.0% d'alcool absolu ! Ne retire pas simplement l'alcool : construis un véritable mocktail avec du corps (jus, purées, thés, tonics), de l'acidité et des arômes.
3. Respecter scrupuleusement les contraintes de l'utilisateur (budget, sans sirop, supermarché).
4. Proposer 3 recettes clairement distinctes :
   - Consensuelle (accessible, douce, très facile à apprécier).
   - Signature (meilleur équilibre entre originalité et gourmandise).
   - Audacieuse (association surprenante mais aromatiquement justifiée).
5. Expliquer clairement pourquoi l'association fonctionne.
6. Ne prétends jamais avoir goûté physiquement une recette ni garantir qu'elle plaira à tous.
7. Ne présente pas une forte teneur en alcool comme un avantage.
Langue : Français.`;

// Deterministic Validation Layer
function validateAndNormalizeRecipes(
  rawRecipes: any[],
  config: Partial<CreationConfig>,
  source: CocktailRecipe['source'] = 'gemini_ia'
): CocktailRecipe[] {
  return rawRecipes.map((r, index) => {
    // Ensure ingredients have clean amounts and categories
    const ingredients = (r.ingredients || []).map((ing: any) => ({
      name: String(ing.name || 'Ingrédient'),
      amount: String(ing.amount || '4 cl'),
      category: ['alcool', 'diluant', 'sirop', 'garniture', 'autre'].includes(ing.category)
        ? ing.category
        : config.isMocktailMode
        ? 'diluant'
        : 'autre',
      supermarketCommon: Boolean(ing.supermarketCommon ?? true),
      estimatedPrice: ing.estimatedPrice ? String(ing.estimatedPrice) : undefined,
      formatAdvice: ing.formatAdvice ? String(ing.formatAdvice) : undefined,
      optional: Boolean(ing.optional),
    }));

    // If mocktail mode, ensure no alcohol in ingredients
    // Alcohol is not silently stripped: constraint checks reject non-compliant recipes instead.
    const cleanIngredients = ingredients;

    const profileName = r.tasteProfile?.profileName || config.profileName || 'Fruité et équilibré';

    return {
      id: `ai-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      name: String(r.name || 'Cocktail Signature'),
      type: (['consensuelle', 'signature', 'audacieuse'].includes(r.type) ? r.type : 'signature') as CocktailRecipe['type'],
      tagline: String(r.tagline || 'Création TIKITIKI'),
      description: String(r.description || ''),
      tasteProfile: {
        primaryNotes: Array.isArray(r.tasteProfile?.primaryNotes) ? r.tasteProfile.primaryNotes : ['Notes fraîches'],
        sweetness: Math.max(1, Math.min(5, Number(r.tasteProfile?.sweetness) || 3)),
        fruitiness: Math.max(1, Math.min(5, Number(r.tasteProfile?.fruitiness) || 3)),
        originality: Math.max(1, Math.min(5, Number(r.tasteProfile?.originality) || 3)),
        profileName,
        colorTheme: mapProfileToColorTheme(profileName),
      },
      ingredients: cleanIngredients,
      steps: Array.isArray(r.steps) && r.steps.length > 0 ? r.steps.map(String) : ['Mélanger et servir bien frais.'],
      glassType: String(r.glassType || 'Verre Highball'),
      prepTimeMinutes: Number(r.prepTimeMinutes) || 3,
      difficulty: (['Très facile', 'Facile', 'Moyen'].includes(r.difficulty) ? r.difficulty : 'Facile') as CocktailRecipe['difficulty'],
      distinctIngredientsCount: cleanIngredients.length,
      estimatedCost: {
        min: Number(r.estimatedCost?.min) || 1.8,
        max: Number(r.estimatedCost?.max) || 2.8,
        currency: 'EUR',
        status: 'estime',
        note: r.estimatedCost?.note || 'Estimation indicative par verre selon les formats standards.',
      },
      aromaticCoherence: String(r.aromaticCoherence || "L'équilibre repose sur la complémentarité des notes sucrées et acidulées."),
      simplerAlternative: String(r.simplerAlternative || 'Remplacer le diluant par une eau gazeuse avec un trait de citron.'),
      mocktailVariant: String(r.mocktailVariant || "Remplacer l'alcool par une base de thé glacé ou de jus de pomme."),
      isMocktailOnly: Boolean(config.isMocktailMode),
      allergens: Array.isArray(r.allergens) ? r.allergens.map(String) : [],
      alcoholEstimate: config.isMocktailMode ? '0.0% Sans alcool' : String(r.alcoholEstimate || 'Modéré (~8-10% vol.)'),
      timerSeconds: Number(r.timerSeconds) || (r.steps?.some((s: string) => s.toLowerCase().includes('shak')) ? 15 : undefined),
      imageUrl: '', // no stock photo: the UI renders a procedural illustration from the drink profile
      isExample: Boolean(r.isExample),
      source,
      testedByUser: false,
      createdAt: r.createdAt || new Date().toISOString(),
    };
  });
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const AI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 25000;

// Lightweight in-memory rate limit per IP (protects the Gemini quota).
const hits = new Map<string, number[]>();
function rateLimited(ip: string, max = 12, windowMs = 60000): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  return list.length > max;
}

const clip = (v: unknown, n = 300) => String(v ?? '').replace(/[\r\n]+/g, ' ').slice(0, n);
const clipList = (v: unknown, n = 12) => (Array.isArray(v) ? v.slice(0, n).map((x) => clip(x, 60)).filter(Boolean) : []);

async function callGemini(contents: string, schema: any): Promise<any> {
  if (!process.env.GEMINI_API_KEY) throw new AiError('NO_KEY', 'GEMINI_API_KEY missing');
  const response: any = await withTimeout(
    ai.models.generateContent({
      model: MODEL,
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: 'application/json', responseSchema: schema, temperature: 0.95 },
    }),
    AI_TIMEOUT_MS
  );
  const text = response?.text?.trim();
  if (!text) throw new AiError('INVALID', 'empty response');
  return JSON.parse(text);
}

function sendAiError(res: Response, err: unknown, where: string) {
  const code = classifyError(err);
  console.warn(`[ai:${where}] ${code}:`, (err as any)?.message ?? err);
  return res.status(HTTP_STATUS[code]).json({ success: false, code, message: USER_MESSAGE[code] });
}

// ENDPOINT: AI status (never exposes the key)
app.get('/api/ai/status', (_req: Request, res: Response) => {
  res.json({ configured: Boolean(process.env.GEMINI_API_KEY), model: MODEL });
});

// ENDPOINT: original AI creations. Validated, constraint-checked and de-duplicated against the catalog.
app.post('/api/cocktails/generate', async (req: Request, res: Response) => {
  if (rateLimited(req.ip ?? 'x')) return sendAiError(res, new AiError('QUOTA', 'local rate limit'), 'generate');
  const body = req.body ?? {};
  const config = body as Partial<CreationConfig> & { excluded?: string[]; required?: string[]; recentNames?: string[]; barIngredients?: string[]; catalogMatches?: string[]; preferredTastes?: string[] };
  const constraints = { alcoholFree: Boolean(config.isMocktailMode), excluded: clipList(config.excluded), required: clipList(config.required) };
  const recentNames = clipList(config.recentNames, 30);
  const avoid = [...clipList(config.catalogMatches, 15), ...recentNames];

  const prompt = `Demande de création TIKITIKI (recettes ORIGINALES, pas des classiques existants) :
- Intention libre : ${config.freeIntent ? `"${clip(config.freeIntent)}"` : 'aucune'}
- Sans alcool strict : ${constraints.alcoholFree ? 'OUI — aucun ingrédient alcoolisé, même en trace' : 'non'}
- Base(s) souhaitée(s) : ${constraints.alcoholFree ? 'AUCUNE' : clipList(config.selectedBases).join(', ') || 'au choix'}
- Diluants : ${clipList(config.selectedMixers).join(', ') || 'au choix'}
- Arômes : ${clipList(config.selectedAromatics).join(', ') || 'au choix'}
- Ingrédients obligatoires : ${constraints.required.join(', ') || 'aucun'}
- Ingrédients interdits : ${constraints.excluded.join(', ') || 'aucun'}
- Ingrédients disponibles au bar (à privilégier) : ${clipList(config.barIngredients, 30).join(', ') || 'inconnus'}
- Profil : ${clip(config.profileName, 80) || 'équilibré'} ; goûts préférés : ${clipList(config.preferredTastes).join(', ') || 'non précisés'}
- Douceur ${Math.round(Number(config.sweetness) || 3)}/5, fruité ${Math.round(Number(config.fruitiness) || 3)}/5, originalité ${Math.round(Number(config.originality) || 3)}/5
- Filtres : ${config.advancedFilters?.noSyrup ? 'sans sirop ; ' : ''}${config.advancedFilters?.noFreshFruits ? 'sans fruits frais ; ' : ''}${config.advancedFilters?.frenchSupermarketOnly ? 'ingrédients de supermarché français' : ''}
- NE PAS reproduire ces recettes déjà connues : ${avoid.join(', ') || '—'}

Génère 3 recettes nettement différentes entre elles : 1 consensuelle, 1 signature, 1 audacieuse.`;

  try {
    const raw = await callGemini(prompt, RECIPES_SCHEMA);
    if (!Array.isArray(raw)) throw new AiError('INVALID', 'not an array');
    const normalized = validateAndNormalizeRecipes(raw, config, 'ai_original');
    const rejected: string[] = [];
    const recipes = normalized.flatMap((r) => {
      const issues = checkConstraints(r, constraints);
      if (issues.length) { rejected.push(`${r.name} : ${issues.join(', ')}`); return []; }
      if (isDuplicateOfRecent(r, recentNames)) { rejected.push(`${r.name} : déjà proposé récemment`); return []; }
      const dup = findCatalogDuplicate(r);
      return [dup ? { ...r, source: 'ai_adapted' as const, catalogId: dup.id, provenanceLabel: `Proche de « ${dup.name} » (catalogue) — ${dup.reason}` } : { ...r, provenanceLabel: 'Création originale générée par IA' }];
    });
    if (!recipes.length) throw new AiError('INVALID', rejected.join(' | '));
    return res.json({ success: true, mode: 'live', recipes, rejected });
  } catch (err) {
    return sendAiError(res, err, 'generate');
  }
});

// ENDPOINT: AI adaptation of an existing recipe (substitution, less sugar, alcohol-free...)
app.post('/api/cocktails/rebalance', async (req: Request, res: Response) => {
  if (rateLimited(req.ip ?? 'x')) return sendAiError(res, new AiError('QUOTA', 'local rate limit'), 'rebalance');
  const { originalRecipe, userTweak } = req.body ?? {};
  if (!originalRecipe?.name || !Array.isArray(originalRecipe?.ingredients) || !String(userTweak ?? '').trim()) {
    return res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'Paramètres manquants' });
  }
  const tweak = clip(userTweak, 200);
  const alcoholFree = /sans alcool|mocktail|virgin|0[.,]0/i.test(tweak);
  const prompt = `Recette existante « ${clip(originalRecipe.name, 80)} » :
Ingrédients : ${originalRecipe.ingredients.slice(0, 15).map((i: any) => `${clip(i.amount, 20)} ${clip(i.name, 60)}`).join(' ; ')}
Étapes : ${(originalRecipe.steps ?? []).slice(0, 8).map((s: any) => clip(s, 160)).join(' / ')}
Modification demandée : "${tweak}"
Rééquilibre la recette pour respecter la demande, explique la substitution dans aromaticCoherence. Renvoie UNE recette dans un tableau.`;
  try {
    const list = await callGemini(prompt, { type: Type.ARRAY, items: RECIPES_SCHEMA.items as any });
    if (!Array.isArray(list) || !list.length) throw new AiError('INVALID', 'empty');
    const [r] = validateAndNormalizeRecipes(list.slice(0, 1), { isMocktailMode: alcoholFree }, 'ai_adapted');
    const issues = checkConstraints(r, { alcoholFree });
    if (issues.length) throw new AiError('INVALID', issues.join(', '));
    return res.json({
      success: true,
      mode: 'live',
      recipe: { ...r, catalogId: originalRecipe.catalogId, provenanceLabel: `Adaptation IA de « ${clip(originalRecipe.name, 80)} » : ${tweak}` },
    });
  } catch (err) {
    return sendAiError(res, err, 'rebalance');
  }
});

// Vite dev server mounting or static production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TIKITIKI server running on port ${PORT}`);
  });
}

startServer();
