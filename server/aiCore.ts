import { CATALOG } from '../src/catalog/recipes';
import { INGREDIENTS } from '../src/catalog/ingredients';
import { normalize, matchIngredientId } from '../src/engine/text';
import { CocktailRecipe } from '../src/types/cocktail';

export type AiErrorCode = 'NO_KEY' | 'TIMEOUT' | 'QUOTA' | 'INVALID' | 'UPSTREAM';

export class AiError extends Error {
  constructor(public code: AiErrorCode, message: string) {
    super(message);
  }
}

export const HTTP_STATUS: Record<AiErrorCode, number> = { NO_KEY: 503, TIMEOUT: 504, QUOTA: 429, INVALID: 502, UPSTREAM: 502 };

export const USER_MESSAGE: Record<AiErrorCode, string> = {
  NO_KEY: "L'IA n'est pas configurée sur ce serveur. Le catalogue reste disponible.",
  TIMEOUT: "L'IA a mis trop de temps à répondre. Réessaie ou choisis une recette du catalogue.",
  QUOTA: "Quota IA atteint pour le moment. Le catalogue reste disponible.",
  INVALID: "La réponse de l'IA ne respectait pas tes contraintes ; elle a été rejetée.",
  UPSTREAM: "L'IA est temporairement indisponible. Le catalogue reste disponible.",
};

/** Maps SDK / network errors to a stable code. Never swallowed into a fake success. */
export function classifyError(err: unknown): AiErrorCode {
  if (err instanceof AiError) return err.code;
  const msg = String((err as any)?.message ?? err ?? '').toLowerCase();
  const status = (err as any)?.status ?? (err as any)?.code;
  if (msg.includes('timeout') || msg.includes('aborted')) return 'TIMEOUT';
  if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('rate limit')) return 'QUOTA';
  if (msg.includes('api key') || msg.includes('api_key') || status === 401 || status === 403) return 'NO_KEY';
  if (err instanceof SyntaxError || msg.includes('json')) return 'INVALID';
  return 'UPSTREAM';
}

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new AiError('TIMEOUT', `timeout after ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

const ALCOHOL_WORDS = /(rhum|rum|vodka|gin\b|whisk|bourbon|tequila|mezcal|cognac|brandy|liqueur|vermouth|campari|aperol|prosecco|champagne|vin |bi[eè]re|pastis|absinthe|triple sec|cointreau|curaçao|curacao|amaretto|kahlua|schnapps|cacha|pisco|chartreuse|bitters?|angostura)/i;

export function isAlcoholicIngredient(ing: { name: string; category?: string }): boolean {
  if (ing.category === 'alcool') return true;
  const id = matchIngredientId(ing.name);
  if (id && INGREDIENTS[id]?.alcoholic) return true;
  return ALCOHOL_WORDS.test(ing.name) && !/sans alcool|0[.,]0|virgin|sirop/i.test(ing.name);
}

export interface Constraints {
  alcoholFree?: boolean;
  excluded?: string[]; // free-text names
  required?: string[];
}

/** Returns the list of violated constraints (empty = valid). */
export function checkConstraints(r: Pick<CocktailRecipe, 'ingredients' | 'name'>, c: Constraints): string[] {
  const issues: string[] = [];
  if (!r.ingredients?.length) issues.push('aucun ingrédient');
  if (c.alcoholFree && r.ingredients.some(isAlcoholicIngredient)) issues.push('contient de l’alcool en mode sans alcool');
  const names = r.ingredients.map((i) => normalize(i.name)).join(' | ');
  for (const ex of c.excluded ?? []) if (ex.trim() && names.includes(normalize(ex))) issues.push(`contient ${ex} (exclu)`);
  for (const req of c.required ?? []) if (req.trim() && !names.includes(normalize(req))) issues.push(`ne contient pas ${req} (obligatoire)`);
  return issues;
}

/** Finds an obvious catalog duplicate (same name, or ≥ 80 % identical ingredient set). */
export function findCatalogDuplicate(r: Pick<CocktailRecipe, 'name' | 'ingredients'>) {
  const n = normalize(r.name);
  const ids = new Set(r.ingredients.map((i) => matchIngredientId(i.name)).filter(Boolean) as string[]);
  for (const c of CATALOG) {
    if (normalize(c.name) === n || (c.aka ?? []).some((a) => normalize(a) === n)) return { id: c.id, name: c.name, reason: 'même nom' };
    const cids = new Set(c.ingredients.filter((i) => !i.optional && INGREDIENTS[i.id].category !== 'garnish' && !INGREDIENTS[i.id].staple).map((i) => i.id));
    if (ids.size < 2 || cids.size < 2) continue;
    const inter = [...ids].filter((x) => cids.has(x)).length;
    const jaccard = inter / (ids.size + cids.size - inter);
    if (jaccard >= 0.8) return { id: c.id, name: c.name, reason: 'mêmes ingrédients' };
  }
  return undefined;
}

export function isDuplicateOfRecent(r: Pick<CocktailRecipe, 'name'>, recentNames: string[] = []): boolean {
  const n = normalize(r.name);
  return recentNames.some((x) => normalize(x) === n);
}
