import { CATALOG } from './recipes';
import { FLASH_CATALOG } from './flash';
import { CatalogRecipe } from './types';

export type AppMode = 'chic' | 'crackhead';

const MODE_KEY = 'tikitiki_mode_v1';
let active: CatalogRecipe[] = CATALOG;

/** Every catalog recipe from every mode, by id (favourites keep working across modes). */
export const ALL_BY_ID: Record<string, CatalogRecipe> = Object.fromEntries([...CATALOG, ...FLASH_CATALOG].map((r) => [r.id, r]));

export function catalogFor(mode: AppMode): CatalogRecipe[] {
  return mode === 'crackhead' ? FLASH_CATALOG : CATALOG;
}

/** The catalog used by search, discoveries, bar and party screens for the current mode. */
export function getActiveCatalog(): CatalogRecipe[] {
  return active;
}

export function setActiveMode(mode: AppMode): void {
  active = catalogFor(mode);
  document.documentElement.dataset.mode = mode;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {}
}

export function getStoredMode(): AppMode {
  try {
    return localStorage.getItem(MODE_KEY) === 'crackhead' ? 'crackhead' : 'chic';
  } catch {
    return 'chic';
  }
}
