import React from 'react';
import { motion } from 'motion/react';
import { Check, Repeat, ShoppingBasket, Sparkles, BookOpen, Wand2 } from 'lucide-react';
import { CocktailArt } from './CocktailArt';
import { CocktailRecipe } from '../types/cocktail';
import { artFor } from '../catalog/adapter';
import { Availability } from '../engine/search';
import { INGREDIENTS } from '../catalog/ingredients';

export const AvailabilityBadge: React.FC<{ a: Availability; missing?: string[]; subs?: { need: string; use: string }[]; compact?: boolean }> = ({ a, missing = [], subs = [], compact }) => {
  const cfg = {
    ready: { icon: Check, label: 'Prêt avec ton bar', cls: 'text-[var(--tk-ready)] border-[var(--tk-ready)]/40 bg-[var(--tk-ready)]/10' },
    substitute: { icon: Repeat, label: `Substitution : ${subs.map((s) => `${INGREDIENTS[s.use].name} → ${INGREDIENTS[s.need].name}`).join(', ')}`, cls: 'text-[var(--tk-sub)] border-[var(--tk-sub)]/40 bg-[var(--tk-sub)]/10' },
    missing: { icon: ShoppingBasket, label: missing.length ? `Manque : ${missing.map((m) => INGREDIENTS[m].name).join(', ')}` : 'Ingrédients à acheter', cls: 'text-white/60 border-white/15 bg-white/5' },
  }[a];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 max-w-full rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.cls}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate">{compact ? { ready: 'Prêt', substitute: 'Substitution', missing: `${missing.length} manquant${missing.length > 1 ? 's' : ''}` }[a] : cfg.label}</span>
    </span>
  );
};

export const SourceBadge: React.FC<{ c: CocktailRecipe }> = ({ c }) => {
  const map: Record<string, { label: string; icon: typeof BookOpen; cls: string }> = {
    catalog: { label: 'Catalogue', icon: BookOpen, cls: 'text-white/80 bg-white/10 border-white/15' },
    ai_adapted: { label: 'Adapté par IA', icon: Wand2, cls: 'text-[#ffc857] bg-[#ffc857]/10 border-[#ffc857]/30' },
    ai_original: { label: 'Création IA', icon: Sparkles, cls: 'text-[#c9b8ff] bg-[#7c5cff]/15 border-[#7c5cff]/40' },
    gemini_ia: { label: 'Création IA', icon: Sparkles, cls: 'text-[#c9b8ff] bg-[#7c5cff]/15 border-[#7c5cff]/40' },
    reference: { label: 'Exemple', icon: BookOpen, cls: 'text-white/60 bg-white/5 border-white/10' },
    user_custom: { label: 'Ajusté', icon: Wand2, cls: 'text-[#ffc857] bg-[#ffc857]/10 border-[#ffc857]/30' },
    party_menu: { label: 'Soirée', icon: BookOpen, cls: 'text-white/70 bg-white/5 border-white/10' },
  };
  const m = map[c.source ?? 'reference'] ?? map.reference;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold backdrop-blur ${m.cls}`}>
      <Icon className="w-3 h-3" /> {m.label}
    </span>
  );
};

/** Visual for any recipe: real photo when one exists, procedural glass otherwise. */
export const DrinkVisual: React.FC<{ c: CocktailRecipe; className?: string; animated?: boolean }> = ({ c, className = '', animated = true }) => {
  const [broken, setBroken] = React.useState(false);
  if (c.imageUrl && !broken)
    return <img src={c.imageUrl} alt={c.name} referrerPolicy="no-referrer" loading="lazy" onError={() => setBroken(true)} className={`object-cover ${className}`} />;
  return <CocktailArt {...artFor(c)} animated={animated} className={className} />;
};

export const RecipeCard: React.FC<{
  c: CocktailRecipe;
  onOpen: () => void;
  availability?: Availability;
  missing?: string[];
  subs?: { need: string; use: string }[];
  size?: 'sm' | 'md' | 'fluid';
  index?: number;
}> = ({ c, onOpen, availability, missing, subs, size = 'md', index = 0 }) => (
  <motion.button
    layoutId={`card-${c.id}`}
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index, 6) * 0.05, type: 'spring', stiffness: 260, damping: 26 }}
    whileTap={{ scale: 0.97 }}
    onClick={onOpen}
    style={{ ['--drink' as string]: c.color ?? 'var(--tk-accent)' }}
    className={`tk-glass group text-left rounded-[26px] overflow-hidden ${size === 'sm' ? 'w-[150px]' : size === 'fluid' ? 'w-full' : 'w-[200px]'}`}
  >
    <div className={`relative ${size === 'sm' ? 'h-[150px]' : 'h-[190px]'} overflow-hidden`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,color-mix(in_srgb,var(--drink)_45%,transparent),transparent_70%)]" />
      <DrinkVisual c={c} animated={false} className="absolute inset-0 w-full h-full p-3 transition-transform duration-500 group-hover:scale-105" />
      <div className="absolute top-2.5 left-2.5"><SourceBadge c={c} /></div>
    </div>
    <div className="p-3.5 pt-2 space-y-1.5">
      <div className="tk-display text-[22px] text-white leading-none line-clamp-2">{c.name}</div>
      <div className="text-[10.5px] text-white/50 truncate">{c.tagline}</div>
      {availability && <AvailabilityBadge a={availability} missing={missing} subs={subs} compact />}
    </div>
  </motion.button>
);

export const SectionHead: React.FC<{ kicker?: string; title: string; action?: React.ReactNode }> = ({ kicker, title, action }) => (
  <div className="flex items-end justify-between px-1 mb-3">
    <div>
      {kicker && <div className="tk-mono text-[9.5px] text-white/45 mb-1">{kicker}</div>}
      <h2 className="tk-display text-[32px] text-white">{title}</h2>
    </div>
    {action}
  </div>
);
