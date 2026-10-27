import { describe, expect, it } from 'vitest';
import { AiError, checkConstraints, classifyError, findCatalogDuplicate, withTimeout } from './aiCore';

const ing = (name: string, category: any = 'autre') => ({ name, amount: '4 cl', category, supermarketCommon: true });

describe('AI safety layer', () => {
  it('classifies quota, timeout, auth and parse errors', () => {
    expect(classifyError({ status: 429, message: 'Too many' })).toBe('QUOTA');
    expect(classifyError(new Error('RESOURCE_EXHAUSTED: quota'))).toBe('QUOTA');
    expect(classifyError(new AiError('TIMEOUT', 'x'))).toBe('TIMEOUT');
    expect(classifyError(new Error('API key not valid'))).toBe('NO_KEY');
    expect(classifyError(new SyntaxError('Unexpected token'))).toBe('INVALID');
    expect(classifyError(new Error('socket hang up'))).toBe('UPSTREAM');
  });

  it('times out slow calls', async () => {
    await expect(withTimeout(new Promise((r) => setTimeout(r, 200)), 20)).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('rejects alcohol in alcohol-free mode, even if mislabelled', () => {
    expect(checkConstraints({ name: 'X', ingredients: [ing('Rhum blanc', 'diluant'), ing('Citron vert')] }, { alcoholFree: true })).toHaveLength(1);
    expect(checkConstraints({ name: 'X', ingredients: [ing('Sirop de mûre'), ing('Tonic')] }, { alcoholFree: true })).toHaveLength(0);
  });

  it('checks excluded and required ingredients', () => {
    const r = { name: 'X', ingredients: [ing('Gin'), ing('Tonic')] };
    expect(checkConstraints(r, { excluded: ['tonic'] })).toHaveLength(1);
    expect(checkConstraints(r, { required: ['basilic'] })).toHaveLength(1);
  });

  it('detects catalog duplicates by name and by ingredients', () => {
    expect(findCatalogDuplicate({ name: 'Négroni', ingredients: [] })?.id).toBe('negroni');
    expect(findCatalogDuplicate({ name: 'Le Velours Rouge', ingredients: [ing('Gin'), ing('Campari'), ing('Vermouth rouge')] })?.id).toBe('negroni');
    expect(findCatalogDuplicate({ name: 'Nuit de Sureau', ingredients: [ing('Mezcal'), ing('Sirop d\'hibiscus'), ing('Basilic'), ing('Jus de pastèque')] })).toBeUndefined();
  });
});
