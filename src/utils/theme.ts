// Drives the interface colours from the drink currently in focus (hero, open recipe, top swipe card).
// --drink is the raw liquid colour; --accent is a vivid, readable version used by buttons, rims and glows.

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

/** Clamps saturation and lightness so pale (vodka-soda) or very dark (cola) drinks still give a usable accent. */
export function vivid(hex: string, fallbackHue = 350): string {
  try {
    const [h, s, l] = hexToHsl(hex);
    const hue = s < 0.12 ? fallbackHue : h;
    return `hsl(${Math.round(hue)} ${Math.round(Math.max(0.7, s) * 100)}% ${Math.round(Math.min(0.62, Math.max(0.5, l)) * 100)}%)`;
  } catch {
    return `hsl(${fallbackHue} 85% 58%)`;
  }
}

export function setFocusColor(hex: string | undefined, fallbackHue?: number): void {
  if (!hex || typeof document === 'undefined') return;
  const root = document.documentElement.style;
  root.setProperty('--drink', hex);
  root.setProperty('--accent', vivid(hex, fallbackHue));
}
