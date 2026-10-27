import React, { useEffect } from 'react';

export type AmbientTheme =
  | 'dark-berry'
  | 'tropical'
  | 'citrus-fresh'
  | 'floral'
  | 'botanical-bitter'
  | 'spiced-warm'
  | 'mystic-dark'
  | 'neutral';

const THEME_COLORS: Record<AmbientTheme, [string, string, string]> = {
  'dark-berry': ['#a3195b', '#5b1a9c', '#ff4f8b'],
  tropical: ['#ff8a1f', '#ff3d6e', '#ffd23f'],
  'citrus-fresh': ['#2bd98f', '#0fa3b1', '#d4f25a'],
  floral: ['#8a6cff', '#ff7ac8', '#5b8cff'],
  'botanical-bitter': ['#d6402b', '#1f8a5b', '#ff8a3c'],
  'spiced-warm': ['#c2571a', '#7a1f1f', '#ffb547'],
  'mystic-dark': ['#4b2bd6', '#9b1fbf', '#1b6bff'],
  neutral: ['#7c5cff', '#ff4f8b', '#1b6bff'],
};

interface AmbientBackgroundProps {
  theme?: AmbientTheme;
  /** Exact drink colour; takes precedence over the theme for the main light. */
  color?: string;
}

/** Adaptive aurora lighting: three slow blobs tinted by the current cocktail, plus film grain. */
export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ theme = 'neutral', color }) => {
  const [c1, c2, c3] = THEME_COLORS[theme] ?? THEME_COLORS.neutral;
  const main = color ?? c1;

  useEffect(() => {
    document.documentElement.style.setProperty('--drink', main);
  }, [main]);

  return (
    <div aria-hidden="true">
      <div className="tk-aurora">
        <span style={{ width: '55vmax', height: '55vmax', left: '-10%', top: '-15%', background: main, opacity: 0.55, transition: 'background 1.2s ease' }} />
        <span style={{ width: '45vmax', height: '45vmax', right: '-15%', top: '20%', background: c2, opacity: 0.35, animationDelay: '-6s', transition: 'background 1.2s ease' }} />
        <span style={{ width: '50vmax', height: '50vmax', left: '10%', bottom: '-30%', background: c3, opacity: 0.28, animationDelay: '-12s', transition: 'background 1.2s ease' }} />
      </div>
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,6,10,0.55)_60%,rgba(6,6,10,0.95)_100%)]" />
      <div className="tk-grain" />
    </div>
  );
};
