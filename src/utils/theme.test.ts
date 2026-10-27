import { describe, expect, it } from 'vitest';
import { vivid } from './theme';

describe('vivid accent', () => {
  it('keeps hue and lifts dull or extreme colours into a readable range', () => {
    expect(vivid('#b8131c')).toMatch(/^hsl\((35[0-9]|35\d|\d) /);
    expect(vivid('#3c170a')).toMatch(/ 50%\)$/); // cola: lightened
    expect(vivid('#e9f7e2')).toMatch(/ 62%\)$/); // pale soda: darkened
    expect(vivid('#ffffff', 10)).toMatch(/^hsl\(10 /); // grey → fallback hue
  });
});
