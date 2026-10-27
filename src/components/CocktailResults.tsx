import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Bookmark, 
  ArrowRight, 
  Clock, 
  Scale, 
  RotateCcw,
  Sparkles,
  Info,
  Wine
} from 'lucide-react';
import { CocktailRecipe } from '../types/cocktail';
import { sounds } from '../utils/audio';
import { DrinkVisual, SourceBadge } from './ui';
import { artFor } from '../catalog/adapter';

interface CocktailResultsProps {
  recipes: CocktailRecipe[];
  onSelectCocktail: (cocktail: CocktailRecipe) => void;
  onToggleFavorite: (cocktail: CocktailRecipe) => void;
  favorites: CocktailRecipe[];
  onOpenCompare: (c1: CocktailRecipe, c2: CocktailRecipe) => void;
  onRestartLab: () => void;
  demoNotice?: string;
}

export const CocktailResults: React.FC<CocktailResultsProps> = ({
  recipes,
  onSelectCocktail,
  onToggleFavorite,
  favorites,
  onOpenCompare,
  onRestartLab,
  demoNotice,
}) => {
  const [selectedForCompare, setSelectedForCompare] = useState<CocktailRecipe[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleCompareClick = (recipe: CocktailRecipe, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playTap();
    if (selectedForCompare.some((r) => r.id === recipe.id)) {
      setSelectedForCompare(selectedForCompare.filter((r) => r.id !== recipe.id));
    } else {
      if (selectedForCompare.length === 1) {
        onOpenCompare(selectedForCompare[0], recipe);
        setSelectedForCompare([]);
      } else {
        setSelectedForCompare([recipe]);
      }
    }
  };

  const getStyleTheme = (type: string) => {
    switch (type) {
      case 'consensuelle':
        return {
          label: 'La Consensuelle',
          badgeText: 'text-emerald-300',
          accentBorder: 'hover:border-emerald-500/30',
          gradientBg: 'from-emerald-950/40 via-[#0A0C14] to-black',
        };
      case 'signature':
        return {
          label: 'La Signature',
          badgeText: 'text-purple-300',
          accentBorder: 'hover:border-purple-500/30',
          gradientBg: 'from-purple-950/40 via-[#0A0C14] to-black',
        };
      case 'audacieuse':
      default:
        return {
          label: 'L’Audacieuse',
          badgeText: 'text-amber-300',
          accentBorder: 'hover:border-amber-500/30',
          gradientBg: 'from-amber-950/40 via-[#0A0C14] to-black',
        };
    }
  };

  return (
    <div className="space-y-6 pb-24 pt-2">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider text-purple-300">Créations IA vérifiées</span>
            <span aria-hidden="true">·</span>
            <span>3 profils sur-mesure</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Tes créations
          </h1>
        </div>

        <button
          onClick={() => {
            sounds.playTap();
            onRestartLab();
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 border border-white/10 transition-all shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Modifier critères</span>
        </button>
      </div>

      {/* Notice if demo / fallback */}
      {demoNotice && (
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex items-center gap-2.5">
          <Info className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{demoNotice}</span>
        </div>
      )}

      {/* Active comparison helper */}
      {selectedForCompare.length === 1 && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-purple-300 shrink-0" />
            <span>Sélectionné : <strong className="font-semibold text-purple-200">{selectedForCompare[0].name}</strong>. Cliquez sur une 2e création pour les comparer côte à côte.</span>
          </div>
          <button
            onClick={() => setSelectedForCompare([])}
            className="px-2.5 py-1 rounded-md text-[11px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all shrink-0"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Cocktail Cards Grid */}
      <div className="grid grid-cols-1 gap-5">
        {recipes.map((recipe, index) => {
          const theme = getStyleTheme(recipe.type);
          const isFav = favorites.some((f) => f.id === recipe.id);
          const isComparing = selectedForCompare.some((r) => r.id === recipe.id);
          const isImgBroken = failedImages[recipe.id] || !recipe.imageUrl;

          return (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              onClick={() => {
                sounds.playGlassClink();
                onSelectCocktail(recipe);
              }}
              className={`cursor-pointer group rounded-3xl overflow-hidden glass-panel border transition-all duration-300 ${
                isComparing
                  ? 'border-purple-400 ring-2 ring-purple-400/25 shadow-2xl'
                  : `border-white/10 ${theme.accentBorder} shadow-lg`
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                {/* Visual Section */}
                <div className="md:col-span-5 relative aspect-[16/10] md:aspect-auto overflow-hidden bg-black/40">
                  {!isImgBroken ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      onError={() => setFailedImages((prev) => ({ ...prev, [recipe.id]: true }))}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    /* High-End Styled Studio SVG Fallback Container */
                    <div className="w-full h-full min-h-[220px] flex items-center justify-center relative overflow-hidden" style={{ background: `radial-gradient(circle at 50% 60%, ${artFor(recipe).color}66, transparent 70%)` }}>
                      <DrinkVisual c={recipe} className="h-[200px] tk-float" />
                      <span className="absolute top-3 left-3"><SourceBadge c={recipe} /></span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C14] via-transparent to-transparent md:hidden" />

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playTap();
                      onToggleFavorite(recipe);
                    }}
                    className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-xl border transition-all ${
                      isFav
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-black/50 text-slate-300 hover:text-white border-white/10 hover:bg-black/70'
                    }`}
                    title="Sauvegarder dans ma collection"
                    aria-label="Sauvegarder la recette"
                  >
                    <Bookmark className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                  </button>
                </div>

                {/* Content Section */}
                <div className="md:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Unboxed Metadata Header */}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className={`font-semibold ${theme.badgeText}`}>{theme.label}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {recipe.prepTimeMinutes} min
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11px] text-slate-300">{recipe.alcoholEstimate}</span>
                    </div>

                    <h3 className="font-display font-bold text-xl text-white group-hover:text-purple-200 transition-colors">
                      {recipe.name}
                    </h3>

                    <p className="text-xs text-slate-400 italic">
                      « {recipe.tagline} »
                    </p>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2 pt-1">
                      {recipe.description}
                    </p>
                  </div>

                  {/* Ingredients Unboxed Pills */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] text-slate-400 font-medium">Composition :</div>
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.ingredients.map((ing, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/5 text-[11px] text-slate-300">
                          {ing.amount} {ing.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                    <button
                      onClick={(e) => handleCompareClick(recipe, e)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        isComparing
                          ? 'bg-purple-600 text-white border-purple-400 font-semibold'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border-white/5'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>{isComparing ? 'Sélectionné pour comparateur' : 'Comparer'}</span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs text-white font-medium group-hover:translate-x-1 transition-transform">
                      <span>Consulter la recette</span>
                      <ArrowRight className="w-4 h-4 text-purple-300" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
